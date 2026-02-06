import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

// Realistic Bank Names in Nigeria
let BANKS = [
    { id: uuidv4(), name: 'Zenith Bank' },
    { id: uuidv4(), name: 'Guaranty Trust Bank' },
    { id: uuidv4(), name: 'United Bank for Africa' },
    { id: uuidv4(), name: 'Access Bank' },
    { id: uuidv4(), name: 'First Bank' }
];

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
    { username: 'cfo', password: 'password', id: 'user-1', name: 'Obi Wan (Group CFO)', role: 'GROUP_CFO' as Role, organisationId: 'org-holdco' },
    { username: 'treasury', password: 'password', id: 'user-2', name: 'Yoda (Group Treasury)', role: 'GROUP_TREASURY_MANAGER' as Role, organisationId: 'org-holdco' },
    { username: 'manager_foods', password: 'password', id: 'user-3', name: 'Anakin (Acme Foods Manager)', role: 'SUB_FINANCE_MANAGER' as Role, organisationId: 'org-foods' },
    { username: 'officer_foods', password: 'password', id: 'user-4', name: 'Ahsoka (Acme Foods Officer)', role: 'SUB_FINANCE_OFFICER' as Role, organisationId: 'org-foods' },
    { username: 'viewer_foods', password: 'password', id: 'user-8', name: 'Jar Jar (Foods Viewer)', role: 'SUB_VIEWER' as Role, organisationId: 'org-foods' },
    { username: 'manager_transport', password: 'password', id: 'user-5', name: 'Mace Windu (Acme Transport Manager)', role: 'SUB_FINANCE_MANAGER' as Role, organisationId: 'org-transport' },
    { username: 'officer_transport', password: 'password', id: 'user-10', name: 'Han Solo (Transport Officer)', role: 'SUB_FINANCE_OFFICER' as Role, organisationId: 'org-transport' },
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
    withdrawals: any[];
    rollovers: any[];
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

    return investments;
};

const MOCK_INVESTMENTS = generateInvestments();

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userRole: Role;
    organisationId: string;
    action: string;
    details: any;
    timestamp: Date;
}

const AUDIT_LOGS: AuditLog[] = [];

const logAction = (action: string, details: any) => {
    AUDIT_LOGS.push({
        id: uuidv4(),
        userId: CURRENT_USER.id,
        userName: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        organisationId: CURRENT_USER.organisationId,
        action,
        details,
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
                const updatedOrg = { ...ORGANISATIONS[index]!, ...updates };
                ORGANISATIONS[index] = updatedOrg;
                logAction('org:edit', { id, ...updates });
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

    async getAuditLogs(): Promise<any[]> {
        return new Promise((resolve) => {
            resolve([
                { id: '1', action: 'LOGIN', userId: 'user-1', timestamp: new Date(), details: 'User logged in' },
                { id: '2', action: 'INVESTMENT_CREATE', userId: 'user-1', timestamp: new Date(), details: 'New multi-currency investment added' },
                { id: '3', action: 'ORG_CREATE', userId: 'user-1', timestamp: new Date(), details: 'New subsidiary created' }
            ]);
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
    }
};

