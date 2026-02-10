<script setup lang="ts">
import { useRouter } from 'vue-router';
import { 
    type MoneyMarketFund, 
    MMFStatus 
} from '../../services/mockData';
import { formatCurrency, formatDate } from '../../utils/dateHelpers';

const props = defineProps<{
    mmfs: MoneyMarketFund[];
}>();

const router = useRouter();

const getStatusColor = (status: MMFStatus) => {
    switch (status) {
        case MMFStatus.ACTIVE:
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case MMFStatus.SUSPENDED:
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
};

const navigateToDetail = (id: string) => {
    router.push(`/investments/mmf/${id}`);
};
</script>

<template>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fund Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fund Manager</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Units</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current NAV</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Value</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" class="relative px-6 py-3">
                        <span class="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="mmf in mmfs" :key="mmf.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" @click="navigateToDetail(mmf.id)">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-900">
                            {{ mmf.fundName }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Valued: {{ formatDate(mmf.valuationDate) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 dark:text-white">{{ mmf.fundManager }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <div class="text-sm text-gray-900 dark:text-white">
                            {{ Number(mmf.totalUnits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        {{ mmf.nav.toFixed(4) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <div class="text-sm font-bold text-gray-900 dark:text-white">
                            {{ formatCurrency(mmf.totalUnits * mmf.nav, mmf.currency) }}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusColor(mmf.status)">
                            {{ mmf.status }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            @click.stop="navigateToDetail(mmf.id)"
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </td>
                </tr>
                <tr v-if="mmfs.length === 0">
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No Money Market Funds found
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
