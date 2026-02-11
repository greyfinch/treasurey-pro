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

export const riskService = {
    getExposures(): Promise<FXExposure[]> {
        return Promise.resolve(MOCK_EXPOSURES)
    },

    getHedges(): Promise<FXHedgeLink[]> {
        return Promise.resolve(MOCK_HEDGES)
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
