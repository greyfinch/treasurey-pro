import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

// Realistic Bank Names in Nigeria
export const BANKS = [
    { id: 'bank-zenith', name: 'Zenith Bank' },
    { id: 'bank-gtb', name: 'Guaranty Trust Bank' },
    { id: 'bank-uba', name: 'United Bank for Africa' },
    { id: 'bank-access', name: 'Access Bank' },
    { id: 'bank-first', name: 'First Bank' }
];

export interface Bank {
    id: string;
    name: string;
}

export const TreasuryBillStatus = {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    ACTIVE: 'ACTIVE',
    MATURED: 'MATURED',
    ROLLED_OVER: 'ROLLED_OVER',
    LIQUIDATED_EARLY: 'LIQUIDATED_EARLY'
} as const;
export type TreasuryBillStatus = typeof TreasuryBillStatus[keyof typeof TreasuryBillStatus];

export const TreasuryBillEventType = {
    CREATED: 'CREATED',
    APPROVED: 'APPROVED',
    ROLLED_OVER: 'ROLLED_OVER',
    MATURED: 'MATURED',
    EARLY_LIQUIDATION: 'EARLY_LIQUIDATION'
} as const;
export type TreasuryBillEventType = typeof TreasuryBillEventType[keyof typeof TreasuryBillEventType];

export type OrgType = 'GROUP' | 'SUBSIDIARY';

export const CurrencyCode = {
    NGN: 'NGN',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP'
} as const;
export type CurrencyCode = typeof CurrencyCode[keyof typeof CurrencyCode];

export const FXSource = {
    MANUAL: 'MANUAL',
    CBN: 'CBN',
    BLOOMBERG: 'BLOOMBERG',
    REUTERS: 'REUTERS'
} as const;
export type FXSource = typeof FXSource[keyof typeof FXSource];

export const FXStatus = {
    ACTIVE: 'ACTIVE',
    SUPERSEDED: 'SUPERSEDED'
} as const;
export type FXStatus = typeof FXStatus[keyof typeof FXStatus];

export interface Currency {
    code: CurrencyCode;
    name: string;
    symbol: string;
}

export const MOCK_CURRENCIES: Currency[] = [
    { code: CurrencyCode.NGN, name: 'Nigerian Naira', symbol: '₦' },
    { code: CurrencyCode.USD, name: 'US Dollar', symbol: '$' },
    { code: CurrencyCode.EUR, name: 'Euro', symbol: '€' },
    { code: CurrencyCode.GBP, name: 'British Pound', symbol: '£' }
];

export interface FXRate {
    id: string;
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    rate: number;
    source: FXSource;
    effectiveDate: Date;
    status: FXStatus;
    createdAt: Date;
}

export const MOCK_FX_RATES: FXRate[] = [
    {
        id: uuidv4(),
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.NGN,
        rate: 1550.25,
        source: FXSource.CBN,
        effectiveDate: dayjs().startOf('day').toDate(),
        status: FXStatus.ACTIVE,
        createdAt: new Date()
    },
    {
        id: uuidv4(),
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.NGN,
        rate: 1540.00,
        source: FXSource.CBN,
        effectiveDate: dayjs().subtract(1, 'day').startOf('day').toDate(),
        status: FXStatus.SUPERSEDED,
        createdAt: dayjs().subtract(1, 'day').toDate()
    },
    {
        id: uuidv4(),
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.NGN,
        rate: 1535.50,
        source: FXSource.CBN,
        effectiveDate: dayjs().subtract(2, 'day').startOf('day').toDate(),
        status: FXStatus.SUPERSEDED,
        createdAt: dayjs().subtract(2, 'day').toDate()
    },
    {
        id: uuidv4(),
        fromCurrency: CurrencyCode.EUR,
        toCurrency: CurrencyCode.NGN,
        rate: 1680.50,
        source: FXSource.CBN,
        effectiveDate: dayjs().startOf('day').toDate(),
        status: FXStatus.ACTIVE,
        createdAt: new Date()
    },
    {
        id: uuidv4(),
        fromCurrency: CurrencyCode.GBP,
        toCurrency: CurrencyCode.NGN,
        rate: 1950.75,
        source: FXSource.CBN,
        effectiveDate: dayjs().startOf('day').toDate(),
        status: FXStatus.ACTIVE,
        createdAt: new Date()
    }
];

export interface Organisation {
    id: string;
    name: string;
    type: OrgType;
    parentId?: string | null;
    baseCurrency: CurrencyCode;
}

export const ORGANISATIONS: Organisation[] = [
    { id: 'org-holdco', name: 'Acme Holdings', type: 'GROUP', parentId: null, baseCurrency: CurrencyCode.NGN },
    { id: 'org-foods', name: 'Acme Foods', type: 'SUBSIDIARY', parentId: 'org-holdco', baseCurrency: CurrencyCode.NGN },
    { id: 'org-transport', name: 'Acme Transport', type: 'SUBSIDIARY', parentId: 'org-holdco', baseCurrency: CurrencyCode.NGN },
    { id: 'org-energy', name: 'Acme Energy', type: 'SUBSIDIARY', parentId: 'org-holdco', baseCurrency: CurrencyCode.NGN }
];

export interface BankBalance {
    id: string;
    organisationId: string;
    bankId: string;
    currency: CurrencyCode;
    balance: number;
    lastUpdated: Date;
}

export interface BalanceHistory {
    id: string;
    bankBalanceId: string;
    previousBalance: number;
    newBalance: number;
    updatedBy: string; // User ID or name
    updatedAt: Date;
    notes?: string;
}

let BANK_BALANCES: BankBalance[] = [
    {
        id: 'bal-1',
        organisationId: 'org-foods',
        bankId: 'bank-access',
        currency: CurrencyCode.NGN,
        balance: 45000000,
        lastUpdated: new Date('2024-01-15')
    },
    {
        id: 'bal-2',
        organisationId: 'org-foods',
        bankId: 'bank-gtb',
        currency: CurrencyCode.NGN,
        balance: 32000000,
        lastUpdated: new Date('2024-01-20')
    },
    {
        id: 'bal-3',
        organisationId: 'org-transport',
        bankId: 'bank-access',
        currency: CurrencyCode.NGN,
        balance: 28000000,
        lastUpdated: new Date('2024-01-18')
    },
    {
        id: 'bal-4',
        organisationId: 'org-energy',
        bankId: 'bank-zenith',
        currency: CurrencyCode.NGN,
        balance: 55000000,
        lastUpdated: new Date('2024-01-22')
    },
    {
        id: 'bal-5',
        organisationId: 'org-foods',
        bankId: 'bank-zenith',
        currency: CurrencyCode.USD,
        balance: 150000,
        lastUpdated: new Date('2024-01-25')
    },
    {
        id: 'bal-6',
        organisationId: 'org-transport',
        bankId: 'bank-gtb',
        currency: CurrencyCode.GBP,
        balance: 45000,
        lastUpdated: new Date('2024-01-26')
    }
];

let BALANCE_HISTORY: BalanceHistory[] = [
    {
        id: 'hist-1',
        bankBalanceId: 'bal-1',
        previousBalance: 40000000,
        newBalance: 45000000,
        updatedBy: 'John Doe (CFO)',
        updatedAt: new Date('2024-01-15T10:30:00'),
        notes: 'Monthly balance update'
    },
    {
        id: 'hist-2',
        bankBalanceId: 'bal-2',
        previousBalance: 30000000,
        newBalance: 32000000,
        updatedBy: 'Jane Smith (Finance Manager)',
        updatedAt: new Date('2024-01-20T14:15:00'),
        notes: 'Reconciliation after investment maturity'
    }
];

export type Role = 'GROUP_CFO' | 'GROUP_TREASURY_MANAGER' | 'SUB_FINANCE_MANAGER' | 'SUB_FINANCE_OFFICER' | 'AUDITOR' | 'GROUP_VIEWER' | 'SUB_VIEWER' | 'SYSTEM_ADMIN';

export interface User {
    id: string;
    name: string;
    role: Role;
    organisationId: string;
}

// Current logged in user (Mock)
export let CURRENT_USER: User = {
    id: 'user-1',
    name: 'Obi Wan (Group CFO)',
    role: 'GROUP_CFO',
    organisationId: 'org-holdco'
};

export const MOCK_USERS = [
    { username: 'cfo', password: 'password', id: 'user-1', name: 'Obi Wan', role: 'GROUP_CFO' as Role, organisationId: 'org-holdco' },
    { username: 'treasury', password: 'password', id: 'user-2', name: 'Yoda', role: 'GROUP_TREASURY_MANAGER' as Role, organisationId: 'org-holdco' },
    { username: 'manager_foods', password: 'password', id: 'user-3', name: 'Anakin', role: 'SUB_FINANCE_MANAGER' as Role, organisationId: 'org-foods' },
    { username: 'officer_foods', password: 'password', id: 'user-4', name: 'Ahsoka', role: 'SUB_FINANCE_OFFICER' as Role, organisationId: 'org-foods' },
    { username: 'viewer_foods', password: 'password', id: 'user-8', name: 'Jar Jar', role: 'SUB_VIEWER' as Role, organisationId: 'org-foods' },
    { username: 'manager_transport', password: 'password', id: 'user-5', name: 'Mace Windu', role: 'SUB_FINANCE_MANAGER' as Role, organisationId: 'org-transport' },
    { username: 'officer_transport', password: 'password', id: 'user-10', name: 'Han Solo', role: 'SUB_FINANCE_OFFICER' as Role, organisationId: 'org-transport' },
    { username: 'viewer_transport', password: 'password', id: 'user-11', name: 'Chewbacca (Transport Viewer)', role: 'SUB_VIEWER' as Role, organisationId: 'org-transport' },
    { username: 'manager_energy', password: 'password', id: 'user-12', name: 'Plo Koon (Energy Manager)', role: 'SUB_FINANCE_MANAGER' as Role, organisationId: 'org-energy' },
    { username: 'officer_energy', password: 'password', id: 'user-13', name: 'Aayla Secura (Energy Officer)', role: 'SUB_FINANCE_OFFICER' as Role, organisationId: 'org-energy' },
    { username: 'viewer_energy', password: 'password', id: 'user-14', name: 'Kit Fisto (Energy Viewer)', role: 'SUB_VIEWER' as Role, organisationId: 'org-energy' },
    { username: 'auditor', password: 'password', id: 'user-6', name: 'Qui-Gon (Auditor)', role: 'AUDITOR' as Role, organisationId: 'org-holdco' },
    { username: 'group_viewer', password: 'password', id: 'user-7', name: 'Padme (Group Viewer)', role: 'GROUP_VIEWER' as Role, organisationId: 'org-holdco' },
    { username: 'admin', password: 'password', id: 'user-9', name: 'R2-D2 (System Admin)', role: 'SYSTEM_ADMIN' as Role, organisationId: 'org-holdco' }
];


export interface Investment {
    id: string;
    organisationId: string;
    bankId: string;
    bank: { id: string, name: string };
    principal: string;
    currency: CurrencyCode;
    dailyRate: string;
    startDate: Date;
    maturityDate: Date;
    status: 'ACTIVE' | 'MATURED' | 'TERMINATED';
    type?: 'BANK_DEPOSIT' | 'TREASURY_BILL' | 'COMMERCIAL_PAPER'; // Added CP type
    withdrawals: any[];
    rollovers: any[];
    actualInterest?: string;
}

export interface TreasuryBill {
    id: string;
    organisationId: string;
    subsidiaryId: string;
    referenceCode: string;
    currency: CurrencyCode;
    faceValue: string;
    purchasePrice: string;
    discountRate: string;
    effectiveYield: string;
    tradeDate: Date;
    settlementDate: Date;
    maturityDate: Date;
    tenorDays: number;
    counterpartyId: string;
    counterparty: Bank;
    settlementAccountId: string; // ID of BankAccount
    status: TreasuryBillStatus;
    approvalRequestId?: string;
}

export interface TreasuryBillAccrual {
    id: string;
    treasuryBillId: string;
    accrualDate: Date;
    accruedAmount: string;
    bookValue: string;
}

export type IssuerType = 'CORPORATE' | 'FINANCIAL_INSTITUTION';

export interface Issuer {
    id: string;
    name: string;
    type: IssuerType;
    creditRating: string;
    country: string;
    sector: string;
}

export const CommercialPaperStatus = {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    ACTIVE: 'ACTIVE',
    MATURED: 'MATURED',
    Rolled_OVER: 'ROLLED_OVER',
    LIQUIDATED_EARLY: 'LIQUIDATED_EARLY',
    DEFAULTED: 'DEFAULTED'
} as const;
export type CommercialPaperStatus = typeof CommercialPaperStatus[keyof typeof CommercialPaperStatus];

export type CommercialPaperCalculationMethod = 'Discounted' | 'Interest Bearing';


export interface CommercialPaper {
    id: string;
    organisationId: string;
    subsidiaryId: string;
    referenceCode: string;
    issuerId: string;
    issuer: Issuer;
    currency: CurrencyCode;
    faceValue: string;
    purchasePrice: string;
    yieldRate: string; // The user specified yieldRate and effectiveYield in prompt
    tenorDays: number;
    tradeDate: Date;
    settlementDate: Date;
    maturityDate: Date;
    earlyExitAllowed: boolean;
    earlyExitPenalty?: string;
    counterpartyId: string;
    counterparty: Bank;
    status: CommercialPaperStatus;
    calculationMethod: CommercialPaperCalculationMethod;
}


export interface CommercialPaperAccrual {
    id: string;
    commercialPaperId: string;
    accrualDate: Date;
    accruedAmount: string; // Daily Income
    bookValue: string;     // Current Value
}

export const MOCK_ISSUERS: Issuer[] = [
    { id: 'issuer-mtn', name: 'MTN Nigeria', type: 'CORPORATE', creditRating: 'AAA', country: 'Nigeria', sector: 'Telecommunications' },
    { id: 'issuer-dangote', name: 'Dangote Cement', type: 'CORPORATE', creditRating: 'AA+', country: 'Nigeria', sector: 'Industrial Goods' },
    { id: 'issuer-flourmills', name: 'Flour Mills of Nigeria', type: 'CORPORATE', creditRating: 'A-', country: 'Nigeria', sector: 'Consumer Goods' },
    { id: 'issuer-ubagroup', name: 'UBA Group', type: 'FINANCIAL_INSTITUTION', creditRating: 'AA', country: 'Nigeria', sector: 'Banking' },
    { id: 'issuer-nestle', name: 'Nestle Nigeria', type: 'CORPORATE', creditRating: 'AAA', country: 'Nigeria', sector: 'Consumer Goods' }
];

export const MOCK_COMMERCIAL_PAPERS: CommercialPaper[] = [
    {
        id: uuidv4(),
        organisationId: 'org-holdco',
        subsidiaryId: 'sub-acme',
        referenceCode: 'CP-MTN-001',
        issuerId: 'issuer-mtn',
        issuer: MOCK_ISSUERS[0]!,
        currency: CurrencyCode.NGN,
        faceValue: '50000000',
        purchasePrice: '45000000',
        yieldRate: '12.5',
        tenorDays: 270,
        tradeDate: dayjs().subtract(90, 'day').toDate(),
        settlementDate: dayjs().subtract(88, 'day').toDate(),
        maturityDate: dayjs().subtract(88, 'day').add(270, 'day').toDate(),
        earlyExitAllowed: true,
        earlyExitPenalty: '1.5',
        counterpartyId: BANKS[1]!.id, // UBA
        counterparty: BANKS[1]!,
        status: CommercialPaperStatus.ACTIVE,
        calculationMethod: 'Discounted'
    },

    {
        id: uuidv4(),
        organisationId: 'org-foods',
        subsidiaryId: 'sub-acme-foods',
        referenceCode: 'CP-DAN-002',
        issuerId: 'issuer-dangote',
        issuer: MOCK_ISSUERS[1]!,
        currency: CurrencyCode.NGN,
        faceValue: '150000000',
        purchasePrice: '138000000',
        yieldRate: '13.2',
        tenorDays: 180,
        tradeDate: dayjs().subtract(30, 'day').toDate(),
        settlementDate: dayjs().subtract(28, 'day').toDate(),
        maturityDate: dayjs().subtract(28, 'day').add(180, 'day').toDate(),
        earlyExitAllowed: false,
        counterpartyId: BANKS[0]!.id, // Zenith
        counterparty: BANKS[0]!,
        status: CommercialPaperStatus.ACTIVE,
        calculationMethod: 'Discounted'
    }
];


export interface TreasuryBillEvent {
    id: string;
    treasuryBillId: string;
    eventType: TreasuryBillEventType;
    amount?: string;
    eventDate: Date;
    notes?: string;
    createdById: string;
    createdBy: string; // User Name
}

const generateInvestments = () => {
    const investments: Investment[] = [];
    const today = dayjs();

    // 1. Active High Yield Investment (Started 45 days ago, 30-day duration) - USD
    const inv1StartDate = today.subtract(45, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[0]!.id,
        bank: BANKS[0]!,
        principal: '50000', // 50k USD
        currency: CurrencyCode.USD,
        dailyRate: '0.0003', // ~11% APY
        startDate: inv1StartDate.toDate(),
        maturityDate: inv1StartDate.add(30, 'day').toDate(), // 30 days duration
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 2. Matured Investment - NGN
    const inv2StartDate = today.subtract(60, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[1]!.id,
        bank: BANKS[1]!,
        principal: '25000000', // 25M
        currency: CurrencyCode.NGN,
        dailyRate: '0.00035',
        startDate: inv2StartDate.toDate(),
        maturityDate: inv2StartDate.add(30, 'day').toDate(),
        status: 'MATURED',
        withdrawals: [],
        rollovers: []
    });

    // 3. Active Investment with Withdrawals - NGN
    const inv3StartDate = today.subtract(20, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-energy',
        bankId: BANKS[2]!.id,
        bank: BANKS[2]!,
        principal: '100000000', // 100M
        currency: CurrencyCode.NGN,
        dailyRate: '0.0005',
        startDate: inv3StartDate.toDate(),
        maturityDate: inv3StartDate.add(30, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [
            {
                id: uuidv4(),
                amount: '10000000',
                withdrawalDate: today.subtract(10, 'day').toDate(),
                fee: '10000'
            }
        ],
        rollovers: []
    });

    // 4. Short-term Active Investment - EUR
    const inv4StartDate = today.subtract(15, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[3]!.id,
        bank: BANKS[3]!,
        principal: '100000', // 100k EUR
        currency: CurrencyCode.EUR,
        dailyRate: '0.0002',
        startDate: inv4StartDate.toDate(),
        maturityDate: inv4StartDate.add(30, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 5. Recent Active Investment - GBP
    const inv5StartDate = today.subtract(5, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[4]!.id,
        bank: BANKS[4]!,
        principal: '25000', // 25k GBP
        currency: CurrencyCode.GBP,
        dailyRate: '0.00025',
        startDate: inv5StartDate.toDate(),
        maturityDate: inv5StartDate.add(30, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 6. Another USD Investment
    const inv6StartDate = today.subtract(12, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-energy',
        bankId: BANKS[0]!.id,
        bank: BANKS[0]!,
        principal: '150000', // 150k USD
        currency: CurrencyCode.USD,
        dailyRate: '0.00032',
        startDate: inv6StartDate.toDate(),
        maturityDate: inv6StartDate.add(45, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 7. Regular NGN Investment
    const inv7StartDate = today.subtract(90, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[1]!.id,
        bank: BANKS[1]!,
        principal: '40000000', // 40M
        currency: CurrencyCode.NGN,
        dailyRate: '0.00033',
        startDate: inv7StartDate.toDate(),
        maturityDate: inv7StartDate.add(60, 'day').toDate(),
        status: 'MATURED',
        withdrawals: [],
        rollovers: []
    });

    // 8. Investment Maturing TOMORROW
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[2]!.id,
        bank: BANKS[2]!,
        principal: '15000000',
        currency: CurrencyCode.NGN,
        dailyRate: '0.0004',
        startDate: today.subtract(29, 'day').toDate(),
        maturityDate: today.add(1, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 9. Investment Maturing in 7 DAYS (Liquid in 7 days)
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[4]!.id,
        bank: BANKS[4]!,
        principal: '250000000',
        currency: CurrencyCode.NGN,
        dailyRate: '0.00045',
        startDate: today.subtract(23, 'day').toDate(),
        maturityDate: today.add(7, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });


    // 8. Second Investment for UBA - NGN
    const inv8StartDate = today.subtract(25, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[2]!.id,
        bank: BANKS[2]!,
        principal: '60000000', // 60M
        currency: CurrencyCode.NGN,
        dailyRate: '0.00047',
        startDate: inv8StartDate.toDate(),
        maturityDate: inv8StartDate.add(40, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: [
            {
                id: uuidv4(),
                amount: '5000000',
                date: today.subtract(7, 'day').toDate()
            }
        ]
    });

    // 9. Second Investment for Access - EUR
    const inv9StartDate = today.subtract(50, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-energy',
        bankId: BANKS[3]!.id,
        bank: BANKS[3]!,
        principal: '15000', // 15k EUR
        currency: CurrencyCode.EUR,
        dailyRate: '0.00036',
        startDate: inv9StartDate.toDate(),
        maturityDate: inv9StartDate.add(30, 'day').toDate(),
        status: 'TERMINATED',
        withdrawals: [],
        rollovers: []
    });

    // 10. Second Investment for First Bank - GBP
    const inv10StartDate = today.subtract(8, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[4]!.id,
        bank: BANKS[4]!,
        principal: '90000', // 90k GBP
        currency: CurrencyCode.GBP,
        dailyRate: '0.0004',
        startDate: inv10StartDate.toDate(),
        maturityDate: inv10StartDate.add(90, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 9. Treasury Bill - 91 Days
    const tb1StartDate = today.subtract(10, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-holdco',
        bankId: BANKS[0]!.id, // Custodian Bank
        bank: BANKS[0]!,
        principal: '500000000', // 500M
        currency: CurrencyCode.NGN,
        dailyRate: '0.00045', // Implied daily rate from discount
        startDate: tb1StartDate.toDate(),
        maturityDate: tb1StartDate.add(91, 'day').toDate(),
        status: 'ACTIVE',
        type: 'TREASURY_BILL',
        withdrawals: [],
        rollovers: []
    });

    // 10. Treasury Bill - 364 Days
    const tb2StartDate = today.subtract(60, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[1]!.id,
        bank: BANKS[1]!,
        principal: '100000000', // 100M
        currency: CurrencyCode.NGN,
        dailyRate: '0.00052',
        startDate: tb2StartDate.toDate(),
        maturityDate: tb2StartDate.add(364, 'day').toDate(),
        status: 'ACTIVE',
        type: 'TREASURY_BILL',
        withdrawals: [],
        rollovers: []
    });

    // Ensure existing items have default type
    investments.forEach(inv => {
        if (!inv.type) inv.type = 'BANK_DEPOSIT';
    });

    return investments;
};

// --- Mock Treasury Bills ---
export const MOCK_TREASURY_BILLS: TreasuryBill[] = [];

// Helper to generate initial T-Bills
const generateTreasuryBills = (): TreasuryBill[] => {
    const tBills: TreasuryBill[] = [];
    const today = dayjs();

    // 1. Active T-Bill (91 Days)
    tBills.push({
        id: uuidv4(),
        organisationId: 'org-holdco',
        subsidiaryId: 'sub-acme', // Assuming Acme Foods
        referenceCode: 'TB-2026-001',
        currency: CurrencyCode.NGN,
        faceValue: '100000000', // 100M
        purchasePrice: '96500000', // 96.5M
        discountRate: '14.00',
        effectiveYield: '14.50',
        tradeDate: today.subtract(45, 'day').toDate(),
        settlementDate: today.subtract(43, 'day').toDate(),
        maturityDate: today.subtract(43, 'day').add(91, 'day').toDate(),
        tenorDays: 91,
        counterpartyId: BANKS[2]!.id, // Zenith
        counterparty: BANKS[2]!,
        settlementAccountId: 'acc-zenith-ngn', // Mock ID
        status: TreasuryBillStatus.ACTIVE
    });

    return tBills;
};

MOCK_TREASURY_BILLS.push(...generateTreasuryBills());

const MOCK_INVESTMENTS = generateInvestments();

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userRole: Role;
    organisationId: string;
    action: string;
    details: any;
    changes?: Array<{ field: string, old: any, new: any }>;
    timestamp: Date;
}

export interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'maturity' | 'liquidity' | 'system';
    timestamp: Date;
    isRead: boolean;
    link?: { path: string; query: Record<string, string> };
}

export interface NotificationSettings {
    maturityDays: number;
    liquidityDays: number;
    enableEmail: boolean;
    enableInApp: boolean;
}

export interface TaxSettings {
    whtRate: number; // Percentage, e.g., 10 for 10%
}

let MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
    maturityDays: 1,
    liquidityDays: 7,
    enableEmail: true,
    enableInApp: true
};

let MOCK_TAX_SETTINGS: TaxSettings = {
    whtRate: 10
};

const AUDIT_LOGS: AuditLog[] = [
    {
        id: 'initial-1',
        userId: 'user-1',
        userName: 'Admin User',
        userRole: 'GROUP_CFO' as any,
        organisationId: 'org-1',
        action: 'system:init',
        details: { message: 'System audit trail initialized' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
        id: 'initial-2',
        userId: 'user-1',
        userName: 'Admin User',
        userRole: 'GROUP_CFO' as any,
        organisationId: 'org-1',
        action: 'org:create',
        details: { name: 'Proforge Subsidiaries' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
        id: 'initial-3',
        userId: 'user-1',
        userName: 'Obi Wan (Group CFO)',
        userRole: 'GROUP_CFO' as any,
        organisationId: 'org-holdco',
        action: 'org:edit',
        details: { id: 'org-foods', name: 'Acme Foods Updated' },
        changes: [
            { field: 'name', old: 'Acme Foods', new: 'Acme Foods Updated' },
            { field: 'baseCurrency', old: 'NGN', new: 'USD' }
        ],
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
    }
];

const logAction = (action: string, details: any, changes?: any[]) => {
    AUDIT_LOGS.push({
        id: uuidv4(),
        userId: CURRENT_USER.id,
        userName: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        organisationId: CURRENT_USER.organisationId,
        action,
        details,
        changes,
        timestamp: new Date()
    });
};

export const mockService = {
    getOrganisations: async (): Promise<Organisation[]> => {
        return new Promise((resolve) => resolve(ORGANISATIONS));
    },

    getCurrentUser: async (): Promise<User> => {
        return new Promise((resolve) => resolve(CURRENT_USER));
    },

    getInvestments: async (): Promise<Investment[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_INVESTMENTS);
            }, 500);
        });
    },

    getInvestmentById: async (id: string): Promise<Investment | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const inv = MOCK_INVESTMENTS.find((i: any) => i.id === id);
                resolve(inv);
            }, 300);
        });
    },

    getBanks: async (): Promise<any[]> => {
        return new Promise((resolve) => resolve(BANKS));
    },

    getCurrencies: async (): Promise<Currency[]> => {
        return new Promise((resolve) => resolve(MOCK_CURRENCIES));
    },

    getFXRates: async (): Promise<FXRate[]> => {
        return new Promise((resolve) => resolve(MOCK_FX_RATES));
    },

    addFXRate: async (fxRate: Omit<FXRate, 'id' | 'createdAt' | 'status'>): Promise<FXRate> => {
        return new Promise((resolve) => {
            const newId = uuidv4();
            const createdAt = new Date();

            // Supersede any existing EXACT same date/pair rate
            MOCK_FX_RATES.forEach(r => {
                if (
                    r.fromCurrency === fxRate.fromCurrency &&
                    r.toCurrency === fxRate.toCurrency &&
                    dayjs(r.effectiveDate).isSame(dayjs(fxRate.effectiveDate), 'day')
                ) {
                    r.status = FXStatus.SUPERSEDED;
                }
            });

            const newRate: FXRate = {
                ...fxRate,
                id: newId,
                createdAt,
                status: FXStatus.ACTIVE
            };

            MOCK_FX_RATES.push(newRate);
            logAction('fxrate:create', newRate);
            resolve(newRate);
        });
    },

    addInvestment: async (investment: Omit<Investment, 'id' | 'status' | 'withdrawals' | 'rollovers'>): Promise<Investment> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Backend-side Security Verification
                if (CURRENT_USER.role !== 'GROUP_CFO' &&
                    CURRENT_USER.role !== 'GROUP_TREASURY_MANAGER' &&
                    CURRENT_USER.role !== 'SYSTEM_ADMIN' &&
                    CURRENT_USER.organisationId !== investment.organisationId) {
                    throw new Error('Unauthorised: You can only create investments for your own organisation.');
                }

                const newInvestment: Investment = {
                    ...investment,
                    id: uuidv4(),
                    status: 'ACTIVE',
                    withdrawals: [],
                    rollovers: []
                };
                MOCK_INVESTMENTS.push(newInvestment);
                logAction('investment:create', newInvestment);
                resolve(newInvestment);
            }, 500);
        });
    },

    addWithdrawal: async (investmentId: string, withdrawal: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const inv = MOCK_INVESTMENTS.find((i: any) => i.id === investmentId);
                if (!inv) {
                    reject('Investment not found');
                    return;
                }
                const newWithdrawal = {
                    ...withdrawal,
                    id: uuidv4(),
                };
                inv.withdrawals.push(newWithdrawal);
                logAction('withdrawal:create', { investmentId, ...newWithdrawal });
                resolve(newWithdrawal);
            }, 500);
        });
    },

    addRollover: async (investmentId: string, rollover: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const inv = MOCK_INVESTMENTS.find((i: any) => i.id === investmentId);
                if (!inv) {
                    reject('Investment not found');
                    return;
                }
                const newRollover = {
                    ...rollover,
                    id: uuidv4(),
                };
                inv.rollovers.push(newRollover);
                logAction('rollover:create', { investmentId, ...newRollover });
                resolve(newRollover);
            }, 500);
        });
    },

    terminateInvestment: async (investmentId: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const inv = MOCK_INVESTMENTS.find((i: any) => i.id === investmentId);
                if (!inv) {
                    reject('Investment not found');
                    return;
                }
                inv.status = 'TERMINATED';
                logAction('investment:terminate', { investmentId });
                resolve(inv);
            }, 500);
        });
    },

    reconcileInvestment: async (investmentId: string, actualInterest: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const inv = MOCK_INVESTMENTS.find((i: any) => i.id === investmentId);
                if (!inv) {
                    reject('Investment not found');
                    return;
                }
                inv.actualInterest = actualInterest;
                logAction('investment:reconcile', { investmentId, actualInterest });
                resolve(inv);
            }, 500);
        });
    },

    // Bank CRUD
    addBank: async (bank: { name: string }): Promise<any> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Backend-side Security Verification
                if (CURRENT_USER.role !== 'GROUP_CFO' &&
                    CURRENT_USER.role !== 'GROUP_TREASURY_MANAGER' &&
                    CURRENT_USER.role !== 'AUDITOR') {
                    throw new Error('Unauthorised: Only Group roles can register new banks.');
                }

                const newBank = {
                    id: uuidv4(),
                    name: bank.name
                };
                BANKS.push(newBank);
                resolve(newBank);
            }, 500);
        });
    },

    updateBank: async (id: string, bank: { name: string }): Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = BANKS.findIndex(b => b.id === id);
                if (index === -1) {
                    reject('Bank not found');
                    return;
                }
                const updatedBank = { ...BANKS[index]!, ...bank };
                BANKS[index] = updatedBank;
                resolve(updatedBank);
            }, 500);
        });
    },

    deleteBank: async (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = BANKS.findIndex(b => b.id === id);
                if (index === -1) {
                    reject('Bank not found');
                    return;
                }
                BANKS.splice(index, 1);
                resolve();
            }, 500);
        });
    },

    // Organisation CRUD
    addOrganisation: async (org: Omit<Organisation, 'id'>): Promise<Organisation> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Security Check
                if (CURRENT_USER.role !== 'GROUP_CFO' && CURRENT_USER.role !== 'SYSTEM_ADMIN') {
                    throw new Error('Unauthorised: Only Group CFO or System Admin can create subsidiaries.');
                }

                const newOrg: Organisation = {
                    ...org,
                    id: `org-${org.name.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 4)}`
                };
                ORGANISATIONS.push(newOrg);
                logAction('org:create', newOrg);
                resolve(newOrg);
            }, 500);
        });
    },

    updateOrganisation: async (id: string, updates: Partial<Organisation>): Promise<Organisation> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Security Check
                if (CURRENT_USER.role !== 'GROUP_CFO' && CURRENT_USER.role !== 'SYSTEM_ADMIN') {
                    throw new Error('Unauthorised: Only Group CFO or System Admin can update subsidiaries.');
                }

                const index = ORGANISATIONS.findIndex(o => o.id === id);
                if (index === -1) {
                    reject('Organisation not found');
                    return;
                }

                const oldOrg = { ...ORGANISATIONS[index]! };
                const updatedOrg = { ...ORGANISATIONS[index]!, ...updates };

                // Track changes
                const changes: any[] = [];
                Object.keys(updates).forEach(key => {
                    const k = key as keyof Organisation;
                    if (updates[k] !== oldOrg[k]) {
                        changes.push({
                            field: k,
                            old: oldOrg[k],
                            new: updates[k]
                        });
                    }
                });

                ORGANISATIONS[index] = updatedOrg;
                logAction('org:edit', { id, ...updates }, changes);
                resolve(updatedOrg);
            }, 500);
        });
    },

    deleteOrganisation: async (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Security Check
                if (CURRENT_USER.role !== 'GROUP_CFO' && CURRENT_USER.role !== 'SYSTEM_ADMIN') {
                    throw new Error('Unauthorised: Only Group CFO or System Admin can delete subsidiaries.');
                }

                const index = ORGANISATIONS.findIndex(o => o.id === id);
                if (index === -1) {
                    reject('Organisation not found');
                    return;
                }

                // Prevent deleting self or group
                if (ORGANISATIONS[index]!.type === 'GROUP') {
                    reject('Cannot delete Group organisation');
                    return;
                }

                const deletedOrg = ORGANISATIONS[index];
                ORGANISATIONS.splice(index, 1);
                logAction('org:delete', deletedOrg);
                resolve();
            }, 500);
        });
    },

    setMockRole: (role: Role, orgId: string) => {
        CURRENT_USER.role = role;
        CURRENT_USER.organisationId = orgId;
    },

    login: async (username: string, password: string): Promise<User | null> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = MOCK_USERS.find(u => u.username === username && u.password === password);
                if (user) {
                    CURRENT_USER.id = user.id;
                    CURRENT_USER.name = user.name;
                    CURRENT_USER.role = user.role;
                    CURRENT_USER.organisationId = user.organisationId;
                    resolve(CURRENT_USER);
                } else {
                    resolve(null);
                }
            }, 500);
        });
    },

    async getAuditLogs(): Promise<AuditLog[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Sort by timestamp descending
                const sortedLogs = [...AUDIT_LOGS].sort((a, b) =>
                    b.timestamp.getTime() - a.timestamp.getTime()
                );
                resolve(sortedLogs);
            }, 500);
        });
    },

    getOrganisationById: async (id: string): Promise<Organisation | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const org = ORGANISATIONS.find(o => o.id === id);
                resolve(org);
            }, 300);
        });
    },

    async getInvestmentsByOrganisationId(orgId: string): Promise<Investment[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const investments = MOCK_INVESTMENTS.filter(i => i.organisationId === orgId);
                resolve(investments);
            }, 300);
        });
    },

    getBaseCurrency: async (): Promise<CurrencyCode> => {
        return new Promise((resolve) => {
            const group = ORGANISATIONS.find(o => o.type === 'GROUP');
            resolve(group?.baseCurrency || 'NGN' as CurrencyCode);
        });
    },

    setBaseCurrency: async (code: CurrencyCode): Promise<void> => {
        return new Promise((resolve, reject) => {
            const group = ORGANISATIONS.find(o => o.type === 'GROUP');
            if (!group) return reject('Group organisation not found');
            group.baseCurrency = code;
            logAction('system:base_currency_update', { code });
            resolve();
        });
    },

    // Currency CRUD
    addCurrency: async (currency: Currency): Promise<Currency> => {
        return new Promise((resolve) => {
            MOCK_CURRENCIES.push(currency);
            logAction('currency:create', currency);
            resolve(currency);
        });
    },

    updateCurrency: async (code: CurrencyCode, updates: Partial<Currency>): Promise<Currency> => {
        return new Promise((resolve, reject) => {
            const index = MOCK_CURRENCIES.findIndex(c => c.code === code);
            if (index === -1) {
                reject('Currency not found');
                return;
            }
            MOCK_CURRENCIES[index] = { ...MOCK_CURRENCIES[index]!, ...updates };
            logAction('currency:update', { code, ...updates });
            resolve(MOCK_CURRENCIES[index]!);
        });
    },

    deleteCurrency: async (code: CurrencyCode): Promise<void> => {
        return new Promise((resolve, reject) => {
            const group = ORGANISATIONS.find(o => o.type === 'GROUP');
            const baseCode = group?.baseCurrency || 'NGN';

            const index = MOCK_CURRENCIES.findIndex(c => c.code === code);
            if (index === -1 || code === baseCode) {
                reject(`Cannot delete currency or it is the active base currency (${baseCode})`);
                return;
            }
            MOCK_CURRENCIES.splice(index, 1);
            logAction('currency:delete', { code });
            resolve();
        });
    },


    updateFXRate: async (id: string, updates: Partial<FXRate>): Promise<FXRate> => {
        return new Promise((resolve, reject) => {
            const index = MOCK_FX_RATES.findIndex(r => r.id === id);
            if (index === -1) {
                reject('FX Rate not found');
                return;
            }
            MOCK_FX_RATES[index] = { ...MOCK_FX_RATES[index]!, ...updates };
            logAction('fxrate:update', { id, ...updates });
            resolve(MOCK_FX_RATES[index]!);
        });
    },

    deleteFXRate: async (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const index = MOCK_FX_RATES.findIndex(r => r.id === id);
            if (index === -1) {
                reject('FX Rate not found');
                return;
            }
            const deleted = MOCK_FX_RATES[index];
            MOCK_FX_RATES.splice(index, 1);
            logAction('fxrate:delete', deleted);
            resolve();
        });
    },

    // Security
    changePassword: async (_current: string, _next: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                logAction('user:password_change', { timestamp: new Date() });
                resolve();
            }, 500);
        });
    },

    toggle2FA: async (enabled: boolean): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                logAction('user:2fa_toggle', { enabled });
                resolve();
            }, 500);
        });
    },

    getNotifications: async (): Promise<Notification[]> => {
        return new Promise((resolve) => {
            if (!MOCK_NOTIFICATION_SETTINGS.enableInApp) {
                return resolve([]);
            }

            const today = dayjs().startOf('day');
            const notifications: Notification[] = [];

            // 1. Check for investments maturing based on settings
            const maturityDate = today.add(MOCK_NOTIFICATION_SETTINGS.maturityDays, 'day');
            const maturingSoon = MOCK_INVESTMENTS.filter(i =>
                i.status === 'ACTIVE' &&
                dayjs(i.maturityDate).isSame(maturityDate, 'day')
            );

            if (maturingSoon.length > 0) {
                notifications.push({
                    id: 'notif-maturity',
                    title: 'Upcoming Maturity',
                    description: `${maturingSoon.length} investment${maturingSoon.length > 1 ? 's' : ''} mature in ${MOCK_NOTIFICATION_SETTINGS.maturityDays} day${MOCK_NOTIFICATION_SETTINGS.maturityDays > 1 ? 's' : ''}`,
                    type: 'maturity',
                    timestamp: new Date(),
                    isRead: false,
                    link: {
                        path: '/investments',
                        query: { maturityDate: maturityDate.format('YYYY-MM-DD') }
                    }
                });
            }

            // 2. Check for investments maturing for liquidity
            const liquidityDate = today.add(MOCK_NOTIFICATION_SETTINGS.liquidityDays, 'day');
            const liquidSoon = MOCK_INVESTMENTS.filter(i =>
                i.status === 'ACTIVE' &&
                dayjs(i.maturityDate).isSame(liquidityDate, 'day')
            );

            liquidSoon.forEach((inv, idx) => {
                const amountFactor = inv.currency === CurrencyCode.NGN ? 1000000 : 1;
                const amountLabel = inv.currency === CurrencyCode.NGN ? 'm' : '';
                const amountValue = Number(inv.principal) / amountFactor;

                notifications.push({
                    id: `notif-liquid-${idx}`,
                    title: 'Liquidity Alert',
                    description: `${inv.currency === CurrencyCode.NGN ? '₦' : inv.currency}${amountValue.toFixed(0)}${amountLabel} becomes liquid in ${MOCK_NOTIFICATION_SETTINGS.liquidityDays} days`,
                    type: 'liquidity',
                    timestamp: new Date(),
                    isRead: false,
                    link: {
                        path: '/investments',
                        query: { maturityDate: dayjs(inv.maturityDate).format('YYYY-MM-DD') }
                    }
                });
            });

            resolve(notifications);
        });
    },

    // Tax Settings
    getTaxSettings: async (): Promise<TaxSettings> => {
        return new Promise((resolve) => resolve(MOCK_TAX_SETTINGS));
    },

    updateTaxSettings: async (settings: TaxSettings): Promise<TaxSettings> => {
        return new Promise((resolve) => {
            const old = { ...MOCK_TAX_SETTINGS };
            MOCK_TAX_SETTINGS = { ...settings };
            logAction('settings:tax_update', MOCK_TAX_SETTINGS, [{ field: 'whtRate', old: old.whtRate, new: settings.whtRate }]);
            resolve(MOCK_TAX_SETTINGS);
        });
    },

    // Notification Settings
    getNotificationSettings: async (): Promise<NotificationSettings> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ ...MOCK_NOTIFICATION_SETTINGS }), 300);
        });
    },

    updateNotificationSettings: async (settings: NotificationSettings): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                MOCK_NOTIFICATION_SETTINGS = { ...settings };
                logAction('system:notification_settings_update', settings);
                resolve();
            }, 500);
        });
    },

    // Bank Balance Management
    getBankBalancesByOrganisationId: async (organisationId: string): Promise<BankBalance[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const balances = BANK_BALANCES.filter(b => b.organisationId === organisationId)
                    .map(b => ({ ...b }));
                resolve(balances);
            }, 300);
        });
    },

    addBankBalance: async (organisationId: string, bankId: string, currency: CurrencyCode, initialBalance: number): Promise<BankBalance> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newBalance: BankBalance = {
                    id: `bal-${Date.now()}`,
                    organisationId,
                    bankId,
                    currency,
                    balance: initialBalance,
                    lastUpdated: new Date()
                };
                BANK_BALANCES.push(newBalance);

                // Create initial history entry
                const historyEntry: BalanceHistory = {
                    id: `hist-${Date.now()}`,
                    bankBalanceId: newBalance.id,
                    previousBalance: 0,
                    newBalance: initialBalance,
                    updatedBy: 'System',
                    updatedAt: new Date(),
                    notes: 'Initial balance entry'
                };
                BALANCE_HISTORY.push(historyEntry);

                logAction('bank_balance:create', newBalance);
                resolve({ ...newBalance });
            }, 500);
        });
    },

    updateBankBalance: async (balanceId: string, newBalance: number, notes?: string): Promise<BankBalance> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const balance = BANK_BALANCES.find(b => b.id === balanceId);
                if (!balance) {
                    reject(new Error('Bank balance not found'));
                    return;
                }

                const previousBalance = balance.balance;
                balance.balance = newBalance;
                balance.lastUpdated = new Date();

                // Create history entry
                const historyEntry: BalanceHistory = {
                    id: `hist-${Date.now()}`,
                    bankBalanceId: balanceId,
                    previousBalance,
                    newBalance,
                    updatedBy: 'Current User', // In real app, get from auth context
                    updatedAt: new Date(),
                    notes
                };
                BALANCE_HISTORY.push(historyEntry);

                logAction('bank_balance:update', { balanceId, previousBalance, newBalance, notes });
                resolve({ ...balance });
            }, 500);
        });
    },

    getBalanceHistory: async (bankBalanceId: string): Promise<BalanceHistory[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const history = BALANCE_HISTORY
                    .filter(h => h.bankBalanceId === bankBalanceId)
                    .map(h => ({ ...h }))
                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                resolve(history);
            }, 300);
        });
    },

    deleteBankBalance: async (balanceId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = BANK_BALANCES.findIndex(b => b.id === balanceId);
                if (index === -1) {
                    reject(new Error('Bank balance not found'));
                    return;
                }

                BANK_BALANCES.splice(index, 1);
                // Also remove history
                BALANCE_HISTORY = BALANCE_HISTORY.filter(h => h.bankBalanceId !== balanceId);

                logAction('bank_balance:delete', { balanceId });
                resolve();
            }, 500);
        });
    },

    // --- Treasury Bills Management ---
    getTreasuryBills: async (): Promise<TreasuryBill[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...MOCK_TREASURY_BILLS]);
            }, 300);
        });
    },

    getTreasuryBillById: async (id: string): Promise<TreasuryBill | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_TREASURY_BILLS.find(tb => tb.id === id));
            }, 200);
        });
    },

    createTreasuryBill: async (data: Omit<TreasuryBill, 'id' | 'status' | 'counterparty'>): Promise<TreasuryBill> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const counterparty = BANKS.find(b => b.id === data.counterpartyId);
                if (!counterparty) throw new Error('Invalid counterparty');

                const newTBill: TreasuryBill = {
                    ...data,
                    id: uuidv4(),
                    status: TreasuryBillStatus.PENDING_APPROVAL,
                    counterparty
                };
                MOCK_TREASURY_BILLS.push(newTBill);

                // Create initial event
                const event: TreasuryBillEvent = {
                    id: uuidv4(),
                    treasuryBillId: newTBill.id,
                    eventType: TreasuryBillEventType.CREATED,
                    eventDate: new Date(),
                    createdById: CURRENT_USER.id,
                    createdBy: CURRENT_USER.name
                };
                // In a real app we would save this event
                console.log('T-Bill Event:', event);

                logAction('tbill:create', newTBill);
                resolve(newTBill);
            }, 500);
        });
    },

    rolloverTreasuryBill: async (id: string, data: any): Promise<TreasuryBill> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const tbill = MOCK_TREASURY_BILLS.find(t => t.id === id);
                if (!tbill) return reject('T-Bill not found');

                tbill.status = TreasuryBillStatus.ROLLED_OVER;

                // Create new T-Bill (child) logic would go here
                // For mock, just update status

                logAction('tbill:rollover', { id, data });
                resolve(tbill);
            }, 500);
        });
    },

    liquidateTreasuryBill: async (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const tbill = MOCK_TREASURY_BILLS.find(t => t.id === id);
                if (!tbill) return reject('T-Bill not found');

                tbill.status = TreasuryBillStatus.LIQUIDATED_EARLY;
                logAction('tbill:liquidate', { id });
                resolve();
            }, 500);
        });
    },

    // --- Commercial Papers Management ---
    getIssuers: async (): Promise<Issuer[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...MOCK_ISSUERS]);
            }, 300);
        });
    },

    getCommercialPapers: async (): Promise<CommercialPaper[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...MOCK_COMMERCIAL_PAPERS]);
            }, 300);
        });
    },

    getCommercialPaperById: async (id: string): Promise<CommercialPaper | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_COMMERCIAL_PAPERS.find(cp => cp.id === id));
            }, 200);
        });
    },

    createCommercialPaper: async (data: Omit<CommercialPaper, 'id' | 'status' | 'counterparty' | 'issuer'>): Promise<CommercialPaper> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const counterparty = BANKS.find(b => b.id === data.counterpartyId);
                const issuer = MOCK_ISSUERS.find(i => i.id === data.issuerId);
                if (!counterparty) throw new Error('Invalid counterparty');
                if (!issuer) throw new Error('Invalid issuer');

                const newCP: CommercialPaper = {
                    ...data,
                    id: uuidv4(),
                    status: CommercialPaperStatus.PENDING_APPROVAL,
                    counterparty,
                    issuer
                };
                MOCK_COMMERCIAL_PAPERS.push(newCP);

                // Create initial event
                // This would normally be handled by the backend
                console.log('Commercial Paper Created:', newCP);

                logAction('cp:create', newCP);
                resolve(newCP);
            }, 500);
        });
    }
};

