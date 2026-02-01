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
    const today = dayjs();

    // 1. Active High Yield Investment (Started 45 days ago, 30-day duration)
    const inv1StartDate = today.subtract(45, 'day');
    investments.push({
        id: uuidv4(),
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

    terminateInvestment: async (investmentId: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const inv = MOCK_INVESTMENTS.find((i: any) => i.id === investmentId);
                if (!inv) {
                    reject('Investment not found');
                    return;
                }
                inv.status = 'TERMINATED';
                resolve(inv);
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
