import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'

// --- Data Models ---

export type FXExposureType = 'PAYABLE' | 'RECEIVABLE' | 'FORECAST' | 'INTERCOMPANY'
export type FXExposureDirection = 'INFLOW' | 'OUTFLOW'
export type FXExposureStatus = 'OPEN' | 'HEDGED' | 'SETTLED'

export interface FXExposure {
    id: string
    organizationId: string
    currencyCode: string
    exposureType: FXExposureType
    direction: FXExposureDirection
    amount: number
    expectedDate: string // ISO Date string
    sourceReference?: string
    status: FXExposureStatus
}

export interface FXHedgeLink {
    id: string
    exposureId: string
    forwardId: string // In a real app, this links to a Forward Contract
    hedgedAmount: number
}

// --- Mock Data ---

const MOCK_EXPOSURES: FXExposure[] = [
    // USD Payables (Outflows)
    {
        id: uuidv4(),
        organizationId: 'org-1',
        currencyCode: 'USD',
        exposureType: 'PAYABLE',
        direction: 'OUTFLOW',
        amount: 1000000,
        expectedDate: dayjs().add(60, 'day').format('YYYY-MM-DD'), // 30-60 bucket
        sourceReference: 'INV-2024-001',
        status: 'OPEN'
    },
    {
        id: uuidv4(),
        organizationId: 'org-1',
        currencyCode: 'USD',
        exposureType: 'PAYABLE',
        direction: 'OUTFLOW',
        amount: 500000,
        expectedDate: dayjs().add(15, 'day').format('YYYY-MM-DD'), // 0-30 bucket
        sourceReference: 'INV-2024-002',
        status: 'HEDGED'
    },
    // EUR Receivables (Inflows)
    {
        id: uuidv4(),
        organizationId: 'org-1',
        currencyCode: 'EUR',
        exposureType: 'RECEIVABLE',
        direction: 'INFLOW',
        amount: 750000,
        expectedDate: dayjs().add(45, 'day').format('YYYY-MM-DD'), // 30-60 bucket
        sourceReference: 'INV-2024-003',
        status: 'OPEN'
    },
    // GBP Forecast (Inflow)
    {
        id: uuidv4(),
        organizationId: 'org-1',
        currencyCode: 'GBP',
        exposureType: 'FORECAST',
        direction: 'INFLOW',
        amount: 300000,
        expectedDate: dayjs().add(95, 'day').format('YYYY-MM-DD'), // 90+ bucket
        sourceReference: 'Q3 Sales Forecast',
        status: 'OPEN'
    }
]

const MOCK_HEDGES: FXHedgeLink[] = [
    {
        id: uuidv4(),
        exposureId: MOCK_EXPOSURES[1]?.id || 'mock-id', // Safely access id
        forwardId: 'fwd-1',
        hedgedAmount: 400000 // Partial hedge
    }
]

// --- Service Logic ---

// --- FX Forward Data Models ---

export type FXForwardDirection = 'BUY_BASE' | 'SELL_BASE'
export type FXForwardStatus = 'DRAFT' | 'ACTIVE' | 'SETTLED' | 'CANCELLED'

export interface FXForward {
    id: string
    organizationId: string
    subsidiaryId?: string

    baseCurrency: string // e.g. USD
    quoteCurrency: string // e.g. NGN

    direction: FXForwardDirection
    notionalAmount: number
    forwardRate: number
    spotRateAtTrade?: number

    tradeDate: string // ISO Date
    valueDate: string // ISO Date

    counterparty: string // Bank name

    status: FXForwardStatus

    settlementAmount?: number
    currentMTM?: number // calculated field, not in DB ideally but useful for UI
}

export interface FXRate {
    id: string
    baseCurrency: string
    quoteCurrency: string
    rate: number
    rateDate: string
}

// --- Mock Data Extension ---

let MOCK_FORWARDS: FXForward[] = [
    {
        id: 'fwd-1',
        organizationId: 'org-1',
        baseCurrency: 'USD',
        quoteCurrency: 'NGN',
        direction: 'BUY_BASE',
        notionalAmount: 400000,
        forwardRate: 1520.50,
        spotRateAtTrade: 1450.00,
        tradeDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
        valueDate: dayjs().add(50, 'day').format('YYYY-MM-DD'),
        counterparty: 'Access Bank',
        status: 'ACTIVE'
    }
]

const MOCK_FX_RATES: FXRate[] = [
    { id: 'rate-1', baseCurrency: 'USD', quoteCurrency: 'NGN', rate: 1600.00, rateDate: dayjs().format('YYYY-MM-DD') },
    { id: 'rate-2', baseCurrency: 'EUR', quoteCurrency: 'NGN', rate: 1750.00, rateDate: dayjs().format('YYYY-MM-DD') },
    { id: 'rate-3', baseCurrency: 'GBP', quoteCurrency: 'NGN', rate: 2000.00, rateDate: dayjs().format('YYYY-MM-DD') }
]

// --- Service Logic ---

export const riskService = {
    getExposures(): Promise<FXExposure[]> {
        return Promise.resolve(MOCK_EXPOSURES)
    },

    getHedges(): Promise<FXHedgeLink[]> {
        return Promise.resolve(MOCK_HEDGES)
    },

    // --- FX Forward Methods ---

    getForwards(): Promise<FXForward[]> {
        // Recalculate MTM on fetch for 'real-time' feel
        const forwardsWithMTM = MOCK_FORWARDS.map(fwd => {
            if (fwd.status === 'ACTIVE') {
                fwd.currentMTM = this.calculateMTM(fwd)
            }
            return fwd
        })
        return Promise.resolve(forwardsWithMTM)
    },

    createForward(forward: Omit<FXForward, 'id' | 'status'>): Promise<FXForward> {
        const newForward: FXForward = {
            ...forward,
            id: uuidv4(),
            status: 'ACTIVE' // Default to active for MVP simplicity
        }
        MOCK_FORWARDS.push(newForward)
        return Promise.resolve(newForward)
    },

    settleForward(id: string): Promise<FXForward> {
        const fwdIndex = MOCK_FORWARDS.findIndex(f => f.id === id)
        if (fwdIndex === -1) throw new Error('Forward not found')

        const fwd = MOCK_FORWARDS[fwdIndex]
        if (!fwd) throw new Error('Forward data is invalid')

        // Calculate settlement amount
        // If BUY_BASE (Buy USD with NGN): Settlement cost = Notional * ForwardRate
        const settlementAmount = fwd.notionalAmount * fwd.forwardRate

        const updatedFwd: FXForward = {
            ...fwd,
            status: 'SETTLED',
            settlementAmount
        }

        MOCK_FORWARDS[fwdIndex] = updatedFwd
        return Promise.resolve(updatedFwd)
    },

    // --- Risk Calculations ---

    getLatestRate(base: string, quote: string): number {
        const rate = MOCK_FX_RATES.find(r => r.baseCurrency === base && r.quoteCurrency === quote)
        return rate ? rate.rate : 0
    },

    calculateMTM(forward: FXForward): number {
        const currentRate = this.getLatestRate(forward.baseCurrency, forward.quoteCurrency)
        if (!currentRate) return 0

        // MTM Logic:
        // BUY_BASE (Long): (Current Market Rate - Forward Rate) * Notional
        // SELL_BASE (Short): (Forward Rate - Current Market Rate) * Notional
        // Result is in Quote Currency (e.g. NGN)

        if (forward.direction === 'BUY_BASE') {
            return (currentRate - forward.forwardRate) * forward.notionalAmount
        } else {
            return (forward.forwardRate - currentRate) * forward.notionalAmount
        }
    },

    getTotalPortfolioMTM(forwards: FXForward[]): number {
        return forwards
            .filter(f => f.status === 'ACTIVE')
            .reduce((sum, f) => sum + (this.calculateMTM(f) || 0), 0)
    },

    // Calculate Net Exposure for a specific currency
    getNetExposure(exposures: FXExposure[], currency: string): number {
        const currencyExposures = exposures.filter(e => e.currencyCode === currency)
        const inflows = currencyExposures
            .filter(e => e.direction === 'INFLOW')
            .reduce((sum, e) => sum + e.amount, 0)

        const outflows = currencyExposures
            .filter(e => e.direction === 'OUTFLOW')
            .reduce((sum, e) => sum + e.amount, 0)

        // For MVP, we aren't automatically netting Forwards against Exposure in this calculation yet
        // strictly based on the prompt's "Net Exposure" definition which focused on Inflow - Outflow exposures.
        // However, hedge coverage uses the forwards/hedges.

        return inflows - outflows
    },

    // Get exposure buckets for a currency (0-30, 31-60, 61-90, 90+)
    getExposureBuckets(exposures: FXExposure[], currency: string) {
        const buckets = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        }

        const currencyExposures = exposures.filter(e => e.currencyCode === currency)
        const now = dayjs()

        currencyExposures.forEach(exp => {
            const daysDiff = dayjs(exp.expectedDate).diff(now, 'day')
            const signedAmount = exp.direction === 'INFLOW' ? exp.amount : -exp.amount

            if (daysDiff <= 30) buckets['0-30'] += signedAmount
            else if (daysDiff <= 60) buckets['31-60'] += signedAmount
            else if (daysDiff <= 90) buckets['61-90'] += signedAmount
            else buckets['90+'] += signedAmount
        })

        return buckets
    },

    // Sensitivity Analysis: Impact of X% FX move
    calculateRiskSensitivity(netExposure: number, percentageMove: number): number {
        return netExposure * (percentageMove / 100)
    },

    // Calculate Hedge Coverage Ratio
    getHedgeCoverage(exposures: FXExposure[], hedges: FXHedgeLink[], currency: string) {
        const totalExposure = exposures
            .filter(e => e.currencyCode === currency && e.direction === 'OUTFLOW') // Usually hedge against outflows/payables risk
            .reduce((sum, e) => sum + e.amount, 0)

        // Find hedges related to these exposures
        const relevantExposureIds = exposures
            .filter(e => e.currencyCode === currency)
            .map(e => e.id)

        const totalHedged = hedges
            .filter(h => relevantExposureIds.includes(h.exposureId))
            .reduce((sum, h) => sum + h.hedgedAmount, 0)

        return totalExposure === 0 ? 0 : (totalHedged / totalExposure) * 100
    }
}
