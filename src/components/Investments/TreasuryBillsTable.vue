<script setup lang="ts">
import { useRouter } from 'vue-router';
import { 
    type TreasuryBill, 
    TreasuryBillStatus 
} from '../../services/mockData';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const props = defineProps<{
    investments: TreasuryBill[];
}>();

const router = useRouter();

const getStatusColor = (status: TreasuryBillStatus) => {
    switch (status) {
        case TreasuryBillStatus.ACTIVE:
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case TreasuryBillStatus.MATURED:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case TreasuryBillStatus.PENDING_APPROVAL:
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case TreasuryBillStatus.ROLLED_OVER:
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        case TreasuryBillStatus.LIQUIDATED_EARLY:
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
};

const getDaysToMaturity = (maturityDate: Date) => {
    const today = new Date();
    const diffTime = new Date(maturityDate).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const navigateToDetail = (id: string) => {
    router.push(`/investments/tbills/${id}`);
};
</script>

<template>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Counterparty</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Face Value</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yield</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maturity</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" class="relative px-6 py-3">
                        <span class="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="tbill in investments" :key="tbill.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" @click="navigateToDetail(tbill.id)">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-900">
                                {{ tbill.referenceCode }}
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 dark:text-white">{{ tbill.counterparty.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(tbill.tradeDate) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ formatCurrency(Number(tbill.faceValue), tbill.currency) }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            Price: {{ formatCurrency(Number(tbill.purchasePrice), tbill.currency) }}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <div class="text-sm font-semibold text-green-600 dark:text-green-400">
                            {{ tbill.effectiveYield }}%
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            Disc: {{ tbill.discountRate }}%
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 dark:text-white">{{ formatDate(tbill.maturityDate) }}</div>
                        <div class="text-xs" :class="getDaysToMaturity(tbill.maturityDate) < 30 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400'">
                            {{ getDaysToMaturity(tbill.maturityDate) }} days left
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusColor(tbill.status)">
                            {{ tbill.status.replace('_', ' ') }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            @click.stop="navigateToDetail(tbill.id)"
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </td>
                </tr>
                <tr v-if="investments.length === 0">
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No Treasury Bills found matching your criteria
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
