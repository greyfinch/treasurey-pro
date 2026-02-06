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
    withdrawals?: Withdrawal[];
    rollovers?: Rollover[];
}

/**
 * Calculate ROI for ONE Investment at a Given Date
 */
export function calculateInvestmentROI({
    principal,
    dailyRate,
    startDate,
    targetDate,
    withdrawals = [],
    rollovers = []
}: InvestmentParams) {
    let currentPrincipal = new Decimal(principal);
    let totalInterest = new Decimal(0);

    let cursorDate = dayjs(startDate);
    const target = dayjs(targetDate);

    // If start date is after target date, no ROI
    if (cursorDate.isAfter(target)) {
        return {
            interest: new Decimal(0),
            principal: currentPrincipal
        };
    }

    // Combine withdrawals and rollovers into a single event stream
    // Withdrawal: reduces principal (or payout)
    // Rollover: increases principal (injection)
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

        // Stop processing events after target date
        if (eventDate.isAfter(target)) break;

        // Calculate interest for the period before event
        const days = eventDate.diff(cursorDate, 'day');

        if (days > 0) {
            totalInterest = totalInterest.plus(
                currentPrincipal.mul(dailyRate).mul(days)
            );
        }

        if (event.type === 'WITHDRAWAL') {
            currentPrincipal = currentPrincipal.minus(event.amount).minus(event.fee || 0);
        } else {
            // ROLLOVER (Injection)
            currentPrincipal = currentPrincipal.plus(event.amount);
        }

        cursorDate = eventDate;
    }

    // Calculate remaining interest from last event to target date
    const remainingDays = target.diff(cursorDate, 'day');
    if (remainingDays > 0) {
        totalInterest = totalInterest.plus(
            currentPrincipal.mul(dailyRate).mul(remainingDays)
        );
    }

    return {
        interest: totalInterest,
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
 * Calculate Total ROI Across ALL Investments (Portfolio View)
 * If targetCurrency is provided, converts all investment ROIs to that currency.
 * Requires fxRates if targetCurrency is different from investment currencies.
 */
export function calculatePortfolioROI(
    investments: any[],
    targetDate: Date | string,
    targetCurrency?: string,
    fxRates: any[] = []
) {
    return investments.reduce((acc, inv) => {
        const roi = calculateInvestmentROI({
            principal: inv.principal,
            dailyRate: inv.dailyRate,
            startDate: inv.startDate,
            targetDate,
            withdrawals: inv.withdrawals,
            rollovers: inv.rollovers
        });

        let interest = roi.interest;

        if (targetCurrency && inv.currency !== targetCurrency) {
            const fxRate = getEffectiveFXRate(inv.currency, targetCurrency, targetDate, fxRates);
            if (fxRate) {
                interest = interest.mul(fxRate.rate);
            } else if (inv.currency === 'NGN' && targetCurrency === 'USD') {
                // Handle reverse if needed (USD -> NGN)
                const reverseRate = getEffectiveFXRate(targetCurrency, inv.currency, targetDate, fxRates);
                if (reverseRate) {
                    interest = interest.div(reverseRate.rate);
                }
            }
        }

        return acc.plus(interest);
    }, new Decimal(0));
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
    fxRates = []
}: {
    investment: any,
    startDate: Date | string,
    endDate: Date | string,
    targetCurrency?: string,
    fxRates?: any[]
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
            withdrawals: investment.withdrawals,
            rollovers: investment.rollovers
        });

        let roi = result.interest;

        if (targetCurrency && investment.currency !== targetCurrency) {
            const rate = getEffectiveFXRate(investment.currency, targetCurrency, currentDate.toDate(), fxRates);
            if (rate) {
                roi = roi.mul(rate.rate);
            } else {
                // Try reverse lookup
                const reverseRate = getEffectiveFXRate(targetCurrency, investment.currency, currentDate.toDate(), fxRates);
                if (reverseRate) {
                    roi = roi.div(reverseRate.rate);
                }
            }
        }

        breakdown.push({
            date: currentDate.format('YYYY-MM-DD'),
            roi: roi.toNumber(),
            principal: result.principal.toNumber()
        });
    }

    return breakdown;
}
