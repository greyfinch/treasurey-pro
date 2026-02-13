import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { riskService, type FXForward } from './riskService'
import {
    mockService,
    type TreasuryBill,
    type CommercialPaper,
    type Bond,
} from './mockData'

// --- Data Models ---

export type InstrumentType = 'FX_FORWARD' | 'TREASURY_BILL' | 'COMMERCIAL_PAPER' | 'BOND'

export interface MarketRate {
    id: string
    instrumentType: InstrumentType
    currency?: string // For T-Bills/Bonds
    baseCurrency?: string // For FX
    quoteCurrency?: string // For FX
    tenorDays?: number // For T-Bills/CP
    yield?: number // Percentage (e.g., 12.5 for 12.5%)
    rate?: number // Exchange rate or Price
    rateDate: string
}

export interface MTMSnapshot {
    id: string
    instrumentId: string
    instrumentType: InstrumentType
    currency: string
    bookValue: number
    marketValue: number
    mtmValue: number // unrealized P&L
    mtmPercentage: number
    valuationDate: string
}

export interface PortfolioValuationSummary {
    totalBookValue: number
    totalMarketValue: number
    totalUnrealizedPL: number
    valuationDate: string
    breakdownByType: Record<InstrumentType, { book: number, market: number, pl: number }>
    breakdownByCurrency: Record<string, { book: number, market: number, pl: number }>
}

// --- Mock Market Data ---

const MOCK_MARKET_RATES: MarketRate[] = [
    // FX Rates (Spot)
    { id: 'mr-1', instrumentType: 'FX_FORWARD', baseCurrency: 'USD', quoteCurrency: 'NGN', rate: 1600.00, rateDate: dayjs().format('YYYY-MM-DD') },

    // T-Bill Yields (Market is currently demanding higher yields)
    { id: 'mr-2', instrumentType: 'TREASURY_BILL', currency: 'NGN', tenorDays: 91, yield: 14.5, rateDate: dayjs().format('YYYY-MM-DD') },
    { id: 'mr-3', instrumentType: 'TREASURY_BILL', currency: 'NGN', tenorDays: 182, yield: 16.0, rateDate: dayjs().format('YYYY-MM-DD') },
    { id: 'mr-4', instrumentType: 'TREASURY_BILL', currency: 'NGN', tenorDays: 364, yield: 18.5, rateDate: dayjs().format('YYYY-MM-DD') },

    // CP Yields
    { id: 'mr-5', instrumentType: 'COMMERCIAL_PAPER', currency: 'NGN', tenorDays: 270, yield: 15.0, rateDate: dayjs().format('YYYY-MM-DD') }
]

// --- Service Logic ---

export const valuationService = {

    // Get Market Rate helper
    getMarketRate(criteria: Partial<MarketRate>): MarketRate | undefined {
        return MOCK_MARKET_RATES.find(mr => {
            let match = true
            if (criteria.instrumentType && mr.instrumentType !== criteria.instrumentType) match = false
            if (criteria.currency && mr.currency !== criteria.currency) match = false
            if (criteria.baseCurrency && mr.baseCurrency !== criteria.baseCurrency) match = false
            // Simplified matching for tenor (find closest or exact)
            return match
        })
    },

    // --- MTM Calculators ---

    calculateFXForwardMTM(forward: FXForward): MTMSnapshot {
        // Use riskService logic but wrap in snapshot
        const mtm = riskService.calculateMTM(forward)
        // Book value for forward is typically 0 at inception (or settlement cost if we track it as liability)
        // For this dashboard, let's treat Notional * ForwardRate as the "Book Cost" (Liability)
        // and Notional * SpotRate as "Market Value" (Liability)
        // But simplified: MTM is the unrealized gain/loss.

        return {
            id: uuidv4(),
            instrumentId: forward.id,
            instrumentType: 'FX_FORWARD',
            currency: forward.quoteCurrency,
            bookValue: 0, // Swaps/Forwards are off-balance sheet/derivative, usually 0 book
            marketValue: mtm,
            mtmValue: mtm,
            mtmPercentage: 0,
            valuationDate: dayjs().format('YYYY-MM-DD')
        }
    },

    calculateDiscountedInstrumentMTM(
        instrument: TreasuryBill | CommercialPaper,
        type: InstrumentType
    ): MTMSnapshot {
        const faceValue = Number(instrument.faceValue)
        const bookValue = Number(instrument.purchasePrice) // Or amortized cost in real life
        const maturity = dayjs(instrument.maturityDate)
        const today = dayjs()
        const daysToMaturity = maturity.diff(today, 'day')

        // If matured, MTM is realized (kind of). Value = Face Value.
        if (daysToMaturity <= 0) {
            return {
                id: uuidv4(),
                instrumentId: instrument.id,
                instrumentType: type,
                currency: instrument.currency,
                bookValue,
                marketValue: faceValue,
                mtmValue: faceValue - bookValue,
                mtmPercentage: ((faceValue - bookValue) / bookValue) * 100,
                valuationDate: today.format('YYYY-MM-DD')
            }
        }

        // Get market yield for remaining tenor
        // Simplification: Use closest mock yield or default
        const marketYieldRate = 18.0 // 18% default market yield for NGN
        const marketYield = marketYieldRate / 100

        // Market Price Code: Price = FaceValue / (1 + (Yield * Days/365))
        const marketValue = faceValue / (1 + (marketYield * (daysToMaturity / 365)))
        const mtmValue = marketValue - bookValue

        return {
            id: uuidv4(),
            instrumentId: instrument.id,
            instrumentType: type,
            currency: instrument.currency,
            bookValue,
            marketValue,
            mtmValue,
            mtmPercentage: (mtmValue / bookValue) * 100,
            valuationDate: today.format('YYYY-MM-DD')
        }
    },

    calculateBondMTM(bond: Bond): MTMSnapshot {
        // Simplified Bond Pricing: PV of Principal + PV of Coupons
        const faceValue = Number(bond.faceValue)
        const bookValue = Number(bond.purchasePrice)
        const couponRate = Number(bond.couponRate) / 100
        const marketYield = 0.16 // 16% market yield assumption

        const today = dayjs()
        const maturity = dayjs(bond.maturityDate)
        const frequency = bond.couponFrequency === 'SEMI_ANNUAL' ? 2 : 1

        let pvCoupons = 0
        let currentPeriodDate = today.add(6, 'month') // approximation for next coupon

        // Project remaining coupons (simplified loop)
        while (currentPeriodDate.isBefore(maturity)) {
            const timeToPayment = currentPeriodDate.diff(today, 'year', true)
            const couponAmount = (faceValue * couponRate) / frequency
            pvCoupons += couponAmount / Math.pow(1 + marketYield, timeToPayment)
            currentPeriodDate = currentPeriodDate.add(12 / frequency, 'month')
        }

        const timeToMaturity = maturity.diff(today, 'year', true)
        const pvPrincipal = faceValue / Math.pow(1 + marketYield, timeToMaturity)

        const marketValue = pvCoupons + pvPrincipal
        const mtmValue = marketValue - bookValue

        return {
            id: uuidv4(),
            instrumentId: bond.id,
            instrumentType: 'BOND',
            currency: bond.currency,
            bookValue,
            marketValue,
            mtmValue,
            mtmPercentage: (mtmValue / bookValue) * 100,
            valuationDate: today.format('YYYY-MM-DD')
        }
    },

    // --- Aggregation ---

    async getPortfolioSummary(): Promise<PortfolioValuationSummary> {
        const [forwards, tbills, cps, bonds] = await Promise.all([
            riskService.getForwards(),
            mockService.getTreasuryBills(),
            mockService.getCommercialPapers(),
            mockService.getBonds()
        ])

        const snapshots: MTMSnapshot[] = []

        // 1. Forwards
        forwards.forEach(f => {
            if (f.status === 'ACTIVE') snapshots.push(this.calculateFXForwardMTM(f))
        })

        // 2. TBills
        tbills.forEach(t => {
            if (t.status === 'ACTIVE') snapshots.push(this.calculateDiscountedInstrumentMTM(t, 'TREASURY_BILL'))
        })

        // 3. CPs
        cps.forEach(c => {
            if (c.status === 'ACTIVE') snapshots.push(this.calculateDiscountedInstrumentMTM(c, 'COMMERCIAL_PAPER'))
        })

        // 4. Bonds
        bonds.forEach(b => {
            if (b.status === 'ACTIVE') snapshots.push(this.calculateBondMTM(b))
        })

        // Aggregate
        const summary: PortfolioValuationSummary = {
            totalBookValue: 0,
            totalMarketValue: 0,
            totalUnrealizedPL: 0,
            valuationDate: dayjs().format('YYYY-MM-DD'),
            breakdownByType: {
                'FX_FORWARD': { book: 0, market: 0, pl: 0 },
                'TREASURY_BILL': { book: 0, market: 0, pl: 0 },
                'COMMERCIAL_PAPER': { book: 0, market: 0, pl: 0 },
                'BOND': { book: 0, market: 0, pl: 0 }
            },
            breakdownByCurrency: {}
        }

        snapshots.forEach(s => {
            // Convert to base currency (NGN) for total aggregation if needed
            // For MVP let's assume everything in NGN or convert simply (1500 rate)
            const fxRate = s.currency === 'USD' ? 1600 : (s.currency === 'EUR' ? 1750 : 1)

            const bookBase = s.bookValue * fxRate
            const marketBase = s.marketValue * fxRate
            const plBase = s.mtmValue * fxRate

            summary.totalBookValue += bookBase
            summary.totalMarketValue += marketBase
            summary.totalUnrealizedPL += plBase

            // Type Breakdown
            summary.breakdownByType[s.instrumentType].book += bookBase
            summary.breakdownByType[s.instrumentType].market += marketBase
            summary.breakdownByType[s.instrumentType].pl += plBase

            // Currency Breakdown
            let currencyBreakdown = summary.breakdownByCurrency[s.currency]
            if (!currencyBreakdown) {
                currencyBreakdown = { book: 0, market: 0, pl: 0 }
                summary.breakdownByCurrency[s.currency] = currencyBreakdown
            }
            currencyBreakdown.book += s.bookValue
            currencyBreakdown.market += s.marketValue
            currencyBreakdown.pl += s.mtmValue
        })

        return summary
    },

    async getHistory(): Promise<{ date: string, value: number }[]> {
        // Mock history trend
        const days = 30
        const history = []
        let baseValue = 5000000 // Start at 5M NGN P&L

        for (let i = days; i >= 0; i--) {
            const date = dayjs().subtract(i, 'day').format('MMM DD')
            // Random fluctuation
            const change = (Math.random() - 0.5) * 500000
            baseValue += change
            history.push({ date, value: baseValue })
        }
        return history
    }
}
