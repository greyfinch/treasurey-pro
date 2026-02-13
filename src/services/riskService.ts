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
    createdAt: string // ISO Date
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

let MOCK_HEDGES: FXHedgeLink[] = [
    {
        id: uuidv4(),
        exposureId: MOCK_EXPOSURES[1]?.id || 'mock-id', // Safely access id
        forwardId: 'fwd-1',
        hedgedAmount: 400000, // Partial hedge
        createdAt: dayjs().format('YYYY-MM-DD')
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

        // Update Exposure Statuses linked to this forward
        const linkedHedges = MOCK_HEDGES.filter(h => h.forwardId === id)
        linkedHedges.forEach(h => {
            const expIndex = MOCK_EXPOSURES.findIndex(e => e.id === h.exposureId)
            if (expIndex !== -1) {
                // Reduce exposure amount? Spec says: "Reduce linked exposure by hedgedAmount."
                // "If fully settled: Update exposure status to SETTLED."
                // Let's implement this logic:
                const exposure = MOCK_EXPOSURES[expIndex]
                if (exposure) {
                    // For now, let's just mark it SETTLED if remaining amount is small?
                    // Or reduce amount. Reducing amount is cleaner for "Remaining Exposure" concept.
                    // But we might lose original history. Let's assume we reduce amount for MVP.
                    exposure.amount = Math.max(0, exposure.amount - h.hedgedAmount)
                    if (exposure.amount <= 0) {
                        exposure.status = 'SETTLED'
                    } else {
                        // Was HEDGED, now partially settled, so technically back to OPEN/PARTIAL?
                        // Spec says "If fully settled... Update to SETTLED".
                        // If not fully, it stays open or partial.
                        exposure.status = 'OPEN'
                    }
                }
            }
        })

        // Remove from active hedges for calculation?
        // We filter by Fwd Status usually, or we can remove the Hedge Link.
        // Spec: "Remove forward from active hedge coverage calculations."
        // We will likely filter hedges by Forward Status != SETTLED in calculations.

        return Promise.resolve(updatedFwd)
    },

    linkHedge(exposureId: string, forwardId: string, amount: number): Promise<FXHedgeLink> {
        const exposure = MOCK_EXPOSURES.find(e => e.id === exposureId)
        const forward = MOCK_FORWARDS.find(f => f.id === forwardId)

        if (!exposure) throw new Error('Exposure not found')
        if (!forward) throw new Error('Forward not found')

        // Validations
        if (forward.status !== 'ACTIVE') throw new Error('Forward must be ACTIVE')
        if (exposure.status !== 'OPEN' && exposure.status !== 'HEDGED') throw new Error('Exposure must be OPEN or PARTIALLY HEDGED')

        // Check Forward Remaining Notional
        const existingForwardHedges = MOCK_HEDGES.filter(h => h.forwardId === forwardId)
        const usedForwardAmount = existingForwardHedges.reduce((sum, h) => sum + h.hedgedAmount, 0)
        const forwardRemaining = forward.notionalAmount - usedForwardAmount

        if (amount > forwardRemaining) throw new Error(`Amount exceeds forward remaining notional (${forwardRemaining})`)

        // Check Exposure Remaining Amount
        // Note: Exposure amount in our model tracks the *outstanding* amount if we reduce it on settlement?
        // No, we should track original amount and hedged amount separately to avoid confusion until settlement.
        // Let's calculate "Remaining to Hedge":
        const existingExposureHedges = MOCK_HEDGES.filter(h => h.exposureId === exposureId)
        const hedgedExposureAmount = existingExposureHedges.reduce((sum, h) => sum + h.hedgedAmount, 0)
        const exposureRemaining = exposure.amount - hedgedExposureAmount

        if (amount > exposureRemaining) throw new Error(`Amount exceeds exposure remaining amount (${exposureRemaining})`)

        // Currency Match
        // Outflow Exposure (Pay USD) needs BUY_BASE (Buy USD) Forward
        // Inflow Exposure (Receive USD) needs SELL_BASE (Sell USD) Forward
        // Or simple currency code match:
        if (exposure.currencyCode !== forward.baseCurrency) throw new Error(`Currency mismatch: Exposure is ${exposure.currencyCode}, Forward Base is ${forward.baseCurrency}`)


        const newLink: FXHedgeLink = {
            id: uuidv4(),
            exposureId,
            forwardId,
            hedgedAmount: amount,
            createdAt: dayjs().format()
        }

        MOCK_HEDGES.push(newLink)

        // Update Exposure Status
        const newTotalHedged = hedgedExposureAmount + amount
        if (newTotalHedged >= exposure.amount) {
            exposure.status = 'HEDGED' // Fully Hedged
        } else {
            // If it was OPEN, it is now PARTIALLY HEDGED (we reuse HEDGED status or keep OPEN?
            // Spec has OPEN, HEDGED, SETTLED.
            // Let's use HEDGED for Full, OPEN for Partial/None?
            // Or maybe we need a dedicated status? Spec says: "If 0 < CoverageRatio < 1 -> PARTIALLY_HEDGED"
            // But enum only has OPEN, HEDGED, SETTLED.
            // I will stick to OPEN = < 100%, HEDGED = 100%.
            // Wait, standard practice: OPEN = 0%, PARTIAL = 1-99%, HEDGED = 100%.
            // For MVP, I will leave it as OPEN if not full? Or maybe spec implies logical status derivative.
            // Let's update status to HEDGED only if full.
        }

        return Promise.resolve(newLink)
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

    // --- Hedge Coverage Calculations ---

    getExposureCoverage(exposureId: string) {
        const exposure = MOCK_EXPOSURES.find(e => e.id === exposureId)
        if (!exposure) return null

        const links = MOCK_HEDGES.filter(h => h.exposureId === exposureId)
        // Filter out settled forwards if necessary?
        // Spec says "Remove forward from active hedge coverage calculations" on settlement.
        // But here we are looking at exposure coverage. If forward settled, exposure amount reduced?
        // If we reduced exposure amount, then current coverage is based on Remaining Exposure vs Remaining Hedges?
        // Let's assume links to SETTLED forwards should be ignored for *Active* coverage ratio.
        // We need to check Forward status.
        const activeLinks = links.filter(l => {
            const fwd = MOCK_FORWARDS.find(f => f.id === l.forwardId)
            return fwd && fwd.status === 'ACTIVE'
        })

        const totalHedged = activeLinks.reduce((sum, h) => sum + h.hedgedAmount, 0)
        const coverageRatio = exposure.amount === 0 ? 0 : (totalHedged / exposure.amount)

        let status = 'UNHEDGED'
        if (coverageRatio > 0 && coverageRatio < 1) status = 'PARTIALLY_HEDGED'
        if (coverageRatio >= 1) status = 'FULLY_HEDGED' // >= covers over-hedged too roughly, but let's be specific if needed
        if (coverageRatio > 1.01) status = 'OVER_HEDGED' // Tolerance

        return {
            exposureId: exposure.id,
            exposureAmount: exposure.amount,
            totalHedged,
            coverageRatio,
            coverageStatus: status
        }
    },

    getCurrencyCoverage(currency: string) {
        const exposures = MOCK_EXPOSURES.filter(e => e.currencyCode === currency && e.status !== 'SETTLED') // Ignore settled exposures
        const netExposure = this.getNetExposure(exposures, currency)

        // Find all active hedges for this currency
        // Hedges are linked to exposures of this currency.
        const relevantExposureIds = exposures.map(e => e.id)
        const relevantHedges = MOCK_HEDGES.filter(h => relevantExposureIds.includes(h.exposureId))

        // Filter for active forwards
        const activeHedgedAmount = relevantHedges.reduce((sum, h) => {
            const fwd = MOCK_FORWARDS.find(f => f.id === h.forwardId)
            if (fwd && fwd.status === 'ACTIVE') {
                return sum + h.hedgedAmount
            }
            return sum
        }, 0)


        const coverageRatio = netExposure === 0 ? 0 : (activeHedgedAmount / Math.abs(netExposure))

        return {
            currency,
            netExposure,
            totalHedged: activeHedgedAmount,
            unhedgedAmount: Math.abs(netExposure) - activeHedgedAmount,
            coverageRatio
        }
    },

    getTimeBucketedCoverage(currency: string) {
        // Group by buckets similar to getExposureBuckets but including hedge info
        const buckets = {
            '0-30': { exposure: 0, hedged: 0, ratio: 0 },
            '31-60': { exposure: 0, hedged: 0, ratio: 0 },
            '61-90': { exposure: 0, hedged: 0, ratio: 0 },
            '90+': { exposure: 0, hedged: 0, ratio: 0 }
        }

        const currencyExposures = MOCK_EXPOSURES.filter(e => e.currencyCode === currency && e.status !== 'SETTLED')
        const now = dayjs()

        currencyExposures.forEach(exp => {
            const daysDiff = dayjs(exp.expectedDate).diff(now, 'day')
            const signedAmount = exp.direction === 'INFLOW' ? exp.amount : -exp.amount
            // Net Exposure per bucket

            // Find hedges for this exposure
            const expCoverage = this.getExposureCoverage(exp.id)
            const hedgedAmt = expCoverage ? expCoverage.totalHedged : 0
            // Hedge direction? Usually hedge counteracts exposure.
            // If Exposure is Outflow (-), Hedge is Inflow (+).
            // We want to compare Net Exposure Magnitude vs Hedge Magnitude.

            let bucketKey = '90+'
            if (daysDiff <= 30) bucketKey = '0-30'
            else if (daysDiff <= 60) bucketKey = '31-60'
            else if (daysDiff <= 90) bucketKey = '61-90'

            // @ts-ignore
            buckets[bucketKey].exposure += signedAmount
            // @ts-ignore
            buckets[bucketKey].hedged += hedgedAmt // Simplification: Summing hedged amounts (always positive magnitude usually)
        })

        // Calculate Ratios
        Object.keys(buckets).forEach(k => {
            // @ts-ignore
            const b = buckets[k]
            b.ratio = b.exposure === 0 ? 0 : (b.hedged / Math.abs(b.exposure))
        })

        return buckets
    }
}
