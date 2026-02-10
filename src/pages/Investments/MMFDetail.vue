<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
    PlusIcon, 
    ArrowPathIcon, 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon,
    ChartBarIcon,
    ListBulletIcon,
    ClockIcon,
    ShieldCheckIcon
} from '@heroicons/vue/24/outline';
import dayjs from 'dayjs';
import { mockService } from '../../services/mockData';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const route = useRoute();
const router = useRouter();
const fundId = route.params.id as string;

const loading = ref(true);
const fund = ref<any>(null);
const transactions = ref<any[]>([]);
const valuations = ref<any[]>([]);
const activeTab = ref<'overview' | 'nav' | 'transactions' | 'rules'>('overview');

onMounted(async () => {
    try {
        const [fundData, txData, valData] = await Promise.all([
            mockService.getMMFById(fundId),
            mockService.getMMFTransactions(fundId),
            mockService.getMMFValuations(fundId)
        ]);

        if (!fundData) {
            router.push('/investments');
            return;
        }

        fund.value = fundData;
        transactions.value = txData;
        valuations.value = valData;
    } finally {
        loading.value = false;
    }
});

const totalInvested = computed(() => {
    return transactions.value
        .filter(t => t.transactionType === 'SUBSCRIPTION')
        .reduce((sum, t) => sum + t.amount, 0);
});

const totalRedeemed = computed(() => {
    return transactions.value
        .filter(t => t.transactionType === 'REDEMPTION')
        .reduce((sum, t) => sum + t.amount, 0);
});

const currentValue = computed(() => {
    if (!fund.value) return 0;
    return fund.value.totalUnits * fund.value.nav;
});

const totalROI = computed(() => {
    return currentValue.value - totalInvested.value + totalRedeemed.value;
});

const roiPercentage = computed(() => {
    if (totalInvested.value === 0) return 0;
    return (totalROI.value / totalInvested.value) * 100;
});
</script>

<template>
    <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <ArrowPathIcon class="w-8 h-8 text-primary-500 animate-spin" />
    </div>

    <div v-else-if="fund" class="space-y-6 pb-12">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <button @click="router.back()" class="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        Back to Investments
                    </button>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ fund.fundName }}</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Managed by {{ fund.fundManager }}</p>
            </div>
            
            <div class="flex items-center gap-3">
                <button class="btn-secondary">
                    <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                    Redeem
                </button>
                <button class="btn-primary">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Subscribe
                </button>
            </div>
        </div>

        <!-- Key Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="card p-6 border-l-4 border-primary-500">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">Current Balance</p>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {{ formatCurrency(currentValue, fund.currency) }}
                </h3>
                <p class="text-xs text-gray-400 mt-2">{{ fund.totalUnits.toLocaleString() }} Units</p>
            </div>
            
            <div class="card p-6">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">Current NAV</p>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {{ fund.nav.toFixed(4) }}
                </h3>
                <p class="text-xs text-gray-400 mt-2">As of {{ formatDate(fund.valuationDate) }}</p>
            </div>

            <div class="card p-6">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">Total ROI (Life)</p>
                <h3 class="text-2xl font-bold text-money-600 dark:text-money-400 mt-1">
                    {{ formatCurrency(totalROI, fund.currency) }}
                </h3>
                <p class="text-xs text-green-600 mt-2 font-medium">+{{ roiPercentage.toFixed(2) }}% Absolute Return</p>
            </div>

            <div class="card p-6">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">Fund Status</p>
                <div class="mt-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {{ fund.status }}
                    </span>
                </div>
                <p class="text-xs text-gray-400 mt-2">Valuation: Daily</p>
            </div>
        </div>

        <!-- Tabs -->
        <div class="card overflow-hidden">
            <div class="border-b border-gray-200 dark:border-gray-700 px-6">
                <nav class="-mb-px flex space-x-8">
                    <button 
                        @click="activeTab = 'overview'"
                        :class="[activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']"
                        class="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                    >
                        <ChartBarIcon class="w-4 h-4" />
                        Performance
                    </button>
                    <button 
                        @click="activeTab = 'transactions'"
                        :class="[activeTab === 'transactions' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']"
                        class="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                    >
                        <ListBulletIcon class="w-4 h-4" />
                        Transactions
                    </button>
                    <button 
                        @click="activeTab = 'nav'"
                        :class="[activeTab === 'nav' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']"
                        class="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                    >
                        <ClockIcon class="w-4 h-4" />
                        NAV History
                    </button>
                    <button 
                        @click="activeTab = 'rules'"
                        :class="[activeTab === 'rules' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']"
                        class="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                    >
                        <ShieldCheckIcon class="w-4 h-4" />
                        Liquidity Rules
                    </button>
                </nav>
            </div>

            <div class="p-6">
                <!-- Performance Tab -->
                <div v-if="activeTab === 'overview'" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Investment Summary</h4>
                            <dl class="space-y-3">
                                <div class="flex justify-between text-sm">
                                    <dt class="text-gray-500">Total Subscriptions</dt>
                                    <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalInvested, fund.currency) }}</dd>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <dt class="text-gray-500">Total Redemptions</dt>
                                    <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalRedeemed, fund.currency) }}</dd>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <dt class="text-gray-500">Net Invested</dt>
                                    <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalInvested - totalRedeemed, fund.currency) }}</dd>
                                </div>
                                <div class="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm font-bold">
                                    <dt class="text-gray-900 dark:text-white">Total Value</dt>
                                    <dd class="text-primary-600 dark:text-primary-400">{{ formatCurrency(currentValue, fund.currency) }}</dd>
                                </div>
                            </dl>
                        </div>
                        
                        <div class="bg-primary-50/50 dark:bg-primary-900/10 p-6 rounded-xl border border-primary-100 dark:border-primary-900/30">
                            <h4 class="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-4">Insights</h4>
                            <ul class="space-y-3 text-sm text-primary-900 dark:text-primary-200">
                                <li class="flex items-start gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5"></span>
                                    Fund is currently yielding ~12.5% p.a. based on 30-day performance.
                                </li>
                                <li class="flex items-start gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5"></span>
                                    NAV has grown consistently by 0.1% daily over the last week.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Transactions Tab -->
                <div v-if="activeTab === 'transactions'" class="overflow-x-auto -mx-6">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">NAV</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr v-for="tx in transactions" :key="tx.id">
                                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(tx.transactionDate) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <span :class="tx.transactionType === 'SUBSCRIPTION' ? 'text-green-600' : 'text-red-600'">
                                        {{ tx.transactionType }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-mono">
                                    {{ Number(tx.units).toLocaleString(undefined, { minimumFractionDigits: 4 }) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {{ tx.nav.toFixed(4) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                    {{ formatCurrency(tx.amount, fund.currency) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- NAV Tab -->
                <div v-if="activeTab === 'nav'" class="space-y-4">
                    <div class="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p class="text-gray-500 italic text-sm">NAV Growth Chart Placeholder</p>
                    </div>
                    <div class="grid grid-cols-4 gap-4">
                        <div v-for="val in valuations.slice(0, 8)" :key="val.id" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                            <p class="text-[10px] text-gray-500 uppercase">{{ dayjs(val.valuationDate).format('MMM DD') }}</p>
                            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ val.nav.toFixed(4) }}</p>
                        </div>
                    </div>
                </div>

                <!-- Rules Tab -->
                <div v-if="activeTab === 'rules'" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                            <h5 class="text-xs font-bold text-gray-500 uppercase mb-2">Redemption Settlement</h5>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">T + 2 Working Days</p>
                        </div>
                        <div class="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                            <h5 class="text-xs font-bold text-gray-500 uppercase mb-2">Minimum Balance</h5>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatCurrency(5000, fund.currency) }}</p>
                        </div>
                        <div class="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                            <h5 class="text-xs font-bold text-gray-500 uppercase mb-2">Valuation Cycle</h5>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">Daily (Business Days)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
