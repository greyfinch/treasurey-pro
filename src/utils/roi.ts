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
            const fxRate = fxRates.find(r => r.fromCurrency === inv.currency && r.toCurrency === targetCurrency);
            if (fxRate) {
                interest = interest.mul(fxRate.rate);
            } else if (inv.currency === 'NGN' && targetCurrency === 'USD') {
                // Handle reverse if needed or throw error. For now, simple conversion if rate is USD -> NGN
                const reverseRate = fxRates.find(r => r.fromCurrency === targetCurrency && r.toCurrency === inv.currency);
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
    endDate
}: { investment: any, startDate: Date | string, endDate: Date | string }) {
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

        breakdown.push({
            date: currentDate.format('YYYY-MM-DD'),
            roi: result.interest.toNumber(),
            principal: result.principal.toNumber()
        });
    }

    return breakdown;
}
