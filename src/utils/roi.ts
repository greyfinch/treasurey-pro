import Decimal from "decimal.js";
import dayjs from "dayjs";

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date | string, end: Date | string) {
    return dayjs(end).diff(dayjs(start), 'day');
}

interface Withdrawal {
    withdrawalDate: Date | string;
    amount: number | string;
    fee?: number | string;
}

interface Rollover {
    date: Date | string;
    amount: number | string;
}

interface InvestmentParams {
    principal: number | string | Decimal;
    dailyRate: number | string | Decimal;
    startDate: Date | string;
    targetDate: Date | string;
    maturityDate?: Date | string;
    status?: string;
    withdrawals?: Withdrawal[];
    rollovers?: Rollover[];
    whtRate?: number | string | Decimal;
}

/**
 * Calculate ROI for ONE Investment at a Given Date
 */
export function calculateInvestmentROI({
    principal,
    dailyRate,
    startDate,
    targetDate,
    maturityDate,
    withdrawals = [],
    rollovers = [],
    whtRate = 0
}: InvestmentParams) {
    let currentPrincipal = new Decimal(principal);
    let totalInterest = new Decimal(0);

    let cursorDate = dayjs(startDate);
    let target = dayjs(targetDate);

    // If mautirytDate provided, cap target date
    if (maturityDate) {
        const maturity = dayjs(maturityDate);
        if (target.isAfter(maturity)) {
            target = maturity;
        }
    }

    // For terminated investments, we might want to rely on a passed termination date 
    // or just assume the caller handles the targetDate. 
    // But adhering to maturity is the primary fix requested.

    // If start date is after target date, no ROI
    if (cursorDate.isAfter(target)) {
        return {
            interest: new Decimal(0),
            grossInterest: new Decimal(0),
            whtAmount: new Decimal(0),
            principal: currentPrincipal
        };
    }

    // Combine withdrawals and rollovers into a single event stream
    const events = [
        ...withdrawals.map(w => ({
            type: 'WITHDRAWAL' as const,
            date: dayjs(w.withdrawalDate),
            amount: w.amount,
            fee: w.fee
        })),
        ...(rollovers || []).map(r => ({
            type: 'ROLLOVER' as const,
            date: dayjs(r.date),
            amount: r.amount,
            fee: 0
        }))
    ].sort((a, b) => a.date.unix() - b.date.unix());

    for (const event of events) {
        const eventDate = event.date;

        if (eventDate.isAfter(target)) break;

        const days = eventDate.diff(cursorDate, 'day');

        if (days > 0) {
            totalInterest = totalInterest.plus(
                currentPrincipal.mul(dailyRate).mul(days)
            );
        }

        if (event.type === 'WITHDRAWAL') {
            currentPrincipal = currentPrincipal.minus(event.amount).minus(event.fee || 0);
        } else {
            currentPrincipal = currentPrincipal.plus(event.amount);
        }

        cursorDate = eventDate;
    }

    const remainingDays = target.diff(cursorDate, 'day');
    if (remainingDays > 0) {
        totalInterest = totalInterest.plus(
            currentPrincipal.mul(dailyRate).mul(remainingDays)
        );
    }

    const wht = totalInterest.mul(new Decimal(whtRate).div(100));

    // If status is terminated/matured, we might enforce 0 principal if full withdrawal happened? 
    // But ROI calculation focuses on interest accrued. 
    // The previous logic returns currentPrincipal which is fine.

    return {
        interest: totalInterest.minus(wht), // Net interest (to maintain compatibility)
        grossInterest: totalInterest,
        whtAmount: wht,
        principal: currentPrincipal
    };
}

/**
 * Find the most recent FX rate for a given date that is not after the target date
 */
export function getEffectiveFXRate(
    fromCurrency: string,
    toCurrency: string,
    targetDate: Date | string,
    fxRates: any[]
) {
    const target = dayjs(targetDate);

    // Filter rates for the correct currency pair and where effective date <= target date
    const eligibleRates = fxRates.filter(r =>
        r.fromCurrency === fromCurrency &&
        r.toCurrency === toCurrency &&
        (dayjs(r.effectiveDate).isBefore(target) || dayjs(r.effectiveDate).isSame(target, 'day'))
    );

    if (eligibleRates.length === 0) return null;

    // Sort by effective date descending and createdAt descending to get the most recent one
    return eligibleRates.sort((a, b) => {
        const dateDiff = dayjs(b.effectiveDate).unix() - dayjs(a.effectiveDate).unix();
        if (dateDiff !== 0) return dateDiff;
        return dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix();
    })[0];
}

/**
 * Calculate ROI for Money Market Funds (MMF)
 */
export function calculateMMFROI(fund: any, targetDate: Date | string) {
    if (!fund) return new Decimal(0);
    const target = dayjs(targetDate);
    const valuationDate = dayjs(fund.valuationDate);

    // In a real app, we would look up the NAV at targetDate from history
    // For mock, we'll use current NAV if targetDate is today, or interpolate/extrapolate
    let effectiveNav = new Decimal(fund.nav);

    if (target.isBefore(valuationDate, 'day')) {
        // Simple mock back-calculation: assume 12% annual growth (0.032% daily)
        const daysBack = valuationDate.diff(target, 'day');
        effectiveNav = effectiveNav.div(new Decimal(1.00032).pow(daysBack));
    }

    const currentValue = new Decimal(fund.totalUnits).mul(effectiveNav);
    // Standard MMFs often maintain 1.0 NAV and pay out interest, 
    // but this blueprint uses unit growth. 
    // We assume purchase NAV was 1.0 or use a provided field.
    const costBasis = fund.costBasis ? new Decimal(fund.costBasis) : new Decimal(fund.totalUnits).mul(1.0);

    return currentValue.minus(costBasis);
}

/**
 * Calculate Total ROI Across ALL Investments (Portfolio View)
 * If targetCurrency is provided, converts all investment ROIs to that currency.
 * Requires fxRates if targetCurrency is different from investment currencies.
 */
export function calculatePortfolioROI(
    investments: any[],
    targetDate: Date | string,
    targetCurrency?: string,
    fxRates: any[] = [],
    whtRate: number = 0,
    mmfs: any[] = [] // Optional MMFs
) {
    const regularInvestmentsROI = investments.reduce((acc, inv) => {
        const roi = calculateInvestmentROI({
            principal: inv.principal,
            dailyRate: inv.dailyRate,
            startDate: inv.startDate,
            targetDate,
            maturityDate: inv.maturityDate,
            status: inv.status,
            withdrawals: inv.withdrawals,
            rollovers: inv.rollovers,
            whtRate
        });

        let interest = roi.interest;

        if (targetCurrency && inv.currency !== targetCurrency) {
            const fxRate = getEffectiveFXRate(inv.currency, targetCurrency, targetDate, fxRates);
            if (fxRate) {
                interest = interest.mul(fxRate.rate);
            } else if (inv.currency === 'NGN' && targetCurrency === 'USD') {
                const reverseRate = getEffectiveFXRate(targetCurrency, inv.currency, targetDate, fxRates);
                if (reverseRate) interest = interest.div(reverseRate.rate);
            }
        }

        return acc.plus(interest);
    }, new Decimal(0));

    const mmfsROI = mmfs.reduce((acc, mmf) => {
        let roi = calculateMMFROI(mmf, targetDate);

        if (targetCurrency && mmf.currency !== targetCurrency) {
            const fxRate = getEffectiveFXRate(mmf.currency, targetCurrency, targetDate, fxRates);
            if (fxRate) {
                roi = roi.mul(fxRate.rate);
            } else if (mmf.currency === 'NGN' && targetCurrency === 'USD') {
                const reverseRate = getEffectiveFXRate(targetCurrency, mmf.currency, targetDate, fxRates);
                if (reverseRate) roi = roi.div(reverseRate.rate);
            }
        }

        return acc.plus(roi);
    }, new Decimal(0));

    return regularInvestmentsROI.plus(mmfsROI);
}

/**
 * Calculate FX Gain/Loss based on current FX rate vs acquisition rate
 * (Treasury-realistic)
 */
export function calculateFXImpact(nativeROI: Decimal, originalRate: number, currentRate: number) {
    return nativeROI.mul(currentRate - originalRate);
}


/**
 * Generate daily ROI breakdown for a date range
 */
export function calculateDailyROI({
    investment,
    startDate,
    endDate,
    targetCurrency,
    fxRates = [],
    whtRate = 0
}: {
    investment: any,
    startDate: Date | string,
    endDate: Date | string,
    targetCurrency?: string,
    fxRates?: any[],
    whtRate?: number
}) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days = end.diff(start, 'day');

    const breakdown = [];

    for (let i = 0; i <= days; i++) {
        const currentDate = start.add(i, 'day');
        const result = calculateInvestmentROI({
            principal: investment.principal,
            dailyRate: investment.dailyRate,
            startDate: investment.startDate,
            targetDate: currentDate.toDate(),
            maturityDate: investment.maturityDate,
            status: investment.status,
            withdrawals: investment.withdrawals,
            rollovers: investment.rollovers,
            whtRate
        });

        let netRoi = result.interest;
        let grossRoi = result.grossInterest;

        if (targetCurrency && investment.currency !== targetCurrency) {
            const rate = getEffectiveFXRate(investment.currency, targetCurrency, currentDate.toDate(), fxRates);
            if (rate) {
                netRoi = netRoi.mul(rate.rate);
                grossRoi = grossRoi.mul(rate.rate);
            } else {
                // Try reverse lookup
                const reverseRate = getEffectiveFXRate(targetCurrency, investment.currency, currentDate.toDate(), fxRates);
                if (reverseRate) {
                    netRoi = netRoi.div(reverseRate.rate);
                    grossRoi = grossRoi.div(reverseRate.rate);
                }
            }
        }

        breakdown.push({
            date: currentDate.format('YYYY-MM-DD'),
            roi: netRoi.toNumber(), // Keep for compatibility
            netROI: netRoi.toNumber(),
            grossROI: grossRoi.toNumber(),
            whtAmount: result.whtAmount.toNumber(),
            principal: result.principal.toNumber()
        });
    }

    return breakdown;
}
