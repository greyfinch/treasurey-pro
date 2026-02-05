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

export interface Organisation {
    id: string;
    name: string;
    type: OrgType;
    parentId?: string | null;
}

export const ORGANISATIONS: Organisation[] = [
    { id: 'org-holdco', name: 'Acme Holdings', type: 'GROUP', parentId: null },
    { id: 'org-foods', name: 'Acme Foods', type: 'SUBSIDIARY', parentId: 'org-holdco' },
    { id: 'org-transport', name: 'Acme Transport', type: 'SUBSIDIARY', parentId: 'org-holdco' },
    { id: 'org-energy', name: 'Acme Energy', type: 'SUBSIDIARY', parentId: 'org-holdco' }
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


const generateInvestments = () => {
    const investments: any[] = [];
    const today = dayjs();

    // 1. Active High Yield Investment (Started 45 days ago, 30-day duration)
    const inv1StartDate = today.subtract(45, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[0]!.id,
        bank: BANKS[0]!,
        principal: '50000000', // 50M
        dailyRate: '0.00045', // ~16.4% APY
        startDate: inv1StartDate.toDate(),
        maturityDate: inv1StartDate.add(30, 'day').toDate(), // 30 days duration
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 2. Matured Investment (Started 60 days ago, 30-day duration, already matured)
    const inv2StartDate = today.subtract(60, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[1]!.id,
        bank: BANKS[1]!,
        principal: '25000000', // 25M
        dailyRate: '0.00035',
        startDate: inv2StartDate.toDate(),
        maturityDate: inv2StartDate.add(30, 'day').toDate(), // 30 days duration, already matured
        status: 'MATURED',
        withdrawals: [],
        rollovers: []
    });

    // 3. Active Investment with Withdrawals (Started 20 days ago, 30-day duration)
    const inv3StartDate = today.subtract(20, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-energy',
        bankId: BANKS[2]!.id,
        bank: BANKS[2]!,
        principal: '100000000', // 100M
        dailyRate: '0.0005', // ~18.25% APY
        startDate: inv3StartDate.toDate(),
        maturityDate: inv3StartDate.add(30, 'day').toDate(), // 30 days duration
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

    // 4. Short-term Active Investment (Started 15 days ago, 30-day duration)
    const inv4StartDate = today.subtract(15, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[3]!.id,
        bank: BANKS[3]!,
        principal: '30000000', // 30M
        dailyRate: '0.0004',
        startDate: inv4StartDate.toDate(),
        maturityDate: inv4StartDate.add(30, 'day').toDate(), // 30 days duration
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 5. Recent Active Investment (Started 5 days ago, 30-day duration)
    const inv5StartDate = today.subtract(5, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[4]!.id,
        bank: BANKS[4]!,
        principal: '75000000', // 75M
        dailyRate: '0.00038',
        startDate: inv5StartDate.toDate(),
        maturityDate: inv5StartDate.add(30, 'day').toDate(), // 30 days duration
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 6. Second Active Investment for Zenith (Started 12 days ago, 45-day duration)
    const inv6StartDate = today.subtract(12, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-energy',
        bankId: BANKS[0]!.id,
        bank: BANKS[0]!,
        principal: '20000000', // 20M
        dailyRate: '0.00042',
        startDate: inv6StartDate.toDate(),
        maturityDate: inv6StartDate.add(45, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 7. Second Investment for GTBank (Matured, started 90 days ago, 60-day duration)
    const inv7StartDate = today.subtract(90, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[1]!.id,
        bank: BANKS[1]!,
        principal: '40000000', // 40M
        dailyRate: '0.00033',
        startDate: inv7StartDate.toDate(),
        maturityDate: inv7StartDate.add(60, 'day').toDate(),
        status: 'MATURED',
        withdrawals: [],
        rollovers: []
    });

    // 8. Second Investment for UBA (Active with rollover)
    const inv8StartDate = today.subtract(25, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-transport',
        bankId: BANKS[2]!.id,
        bank: BANKS[2]!,
        principal: '60000000', // 60M
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

    // 9. Second Investment for Access (Terminated, started 50 days ago, 30-day duration)
    const inv9StartDate = today.subtract(50, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-energy',
        bankId: BANKS[3]!.id,
        bank: BANKS[3]!,
        principal: '15000000', // 15M
        dailyRate: '0.00036',
        startDate: inv9StartDate.toDate(),
        maturityDate: inv9StartDate.add(30, 'day').toDate(),
        status: 'TERMINATED',
        withdrawals: [],
        rollovers: []
    });

    // 10. Second Investment for First Bank (Active, longer duration)
    const inv10StartDate = today.subtract(8, 'day');
    investments.push({
        id: uuidv4(),
        organisationId: 'org-foods',
        bankId: BANKS[4]!.id,
        bank: BANKS[4]!,
        principal: '90000000', // 90M
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

    getInvestments: async (): Promise<any[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_INVESTMENTS);
            }, 500);
        });
    },

    getInvestmentById: async (id: string): Promise<any> => {
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

    addInvestment: async (investment: any): Promise<any> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Backend-side Security Verification
                if (CURRENT_USER.role !== 'GROUP_CFO' &&
                    CURRENT_USER.role !== 'GROUP_TREASURY_MANAGER' &&
                    CURRENT_USER.organisationId !== investment.organisationId) {
                    throw new Error('Unauthorised: You can only create investments for your own organisation.');
                }

                const newInvestment = {
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

    getAuditLogs: async (): Promise<AuditLog[]> => {
        return new Promise((resolve) => resolve(AUDIT_LOGS));
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
    }
};
