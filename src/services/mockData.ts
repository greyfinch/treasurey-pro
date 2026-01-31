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

const generateInvestments = () => {
    const investments: any[] = [];

    // 1. Active High Yield Investment
    investments.push({
        id: uuidv4(),
        bankId: BANKS[0]!.id,
        bank: BANKS[0]!,
        principal: '50000000', // 50M
        dailyRate: '0.00045', // ~16.4% APY
        startDate: dayjs().subtract(45, 'day').toDate(),
        maturityDate: dayjs().add(320, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [],
        rollovers: []
    });

    // 2. Matured Investment
    investments.push({
        id: uuidv4(),
        bankId: BANKS[1]!.id,
        bank: BANKS[1]!,
        principal: '25000000', // 25M
        dailyRate: '0.00035',
        startDate: dayjs().subtract(400, 'day').toDate(),
        maturityDate: dayjs().subtract(35, 'day').toDate(),
        status: 'MATURED',
        withdrawals: [],
        rollovers: []
    });

    // 3. Active Investment with Withdrawals
    investments.push({
        id: uuidv4(),
        bankId: BANKS[2]!.id,
        bank: BANKS[2]!,
        principal: '100000000', // 100M
        dailyRate: '0.0005', // ~18.25% APY
        startDate: dayjs().subtract(90, 'day').toDate(),
        maturityDate: dayjs().add(275, 'day').toDate(),
        status: 'ACTIVE',
        withdrawals: [
            {
                id: uuidv4(),
                amount: '10000000',
                withdrawalDate: dayjs().subtract(30, 'day').toDate(),
                fee: '10000'
            }
        ],
        rollovers: []
    });

    return investments;
};

const MOCK_INVESTMENTS = generateInvestments();

export const mockService = {
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
                const newInvestment = {
                    ...investment,
                    id: uuidv4(),
                    status: 'ACTIVE',
                    withdrawals: [],
                    rollovers: []
                };
                MOCK_INVESTMENTS.push(newInvestment);
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
                resolve(newRollover);
            }, 500);
        });
    },

    // Bank CRUD
    addBank: async (bank: { name: string }): Promise<any> => {
        return new Promise((resolve) => {
            setTimeout(() => {
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
    }
};
