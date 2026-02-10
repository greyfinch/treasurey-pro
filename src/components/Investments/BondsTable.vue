<script setup lang="ts">
import { useRouter } from 'vue-router'
import { formatCurrency } from '../../utils/dateHelpers'
import dayjs from 'dayjs'
import type { Bond } from '../../services/mockData'

defineProps<{
    investments: Bond[]
}>()

const router = useRouter()

const viewDetail = (id: string) => {
    router.push(`/investments/bond/${id}`)
}
</script>

<template>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400 font-primary">
                <tr>
                    <th class="px-6 py-4 text-left">Ref / Issuer</th>
                    <th class="px-6 py-4 text-left">Face Value</th>
                    <th class="px-6 py-4 text-center">Coupon</th>
                    <th class="px-6 py-4 text-center">YTM</th>
                    <th class="px-6 py-4 text-left">Maturity</th>
                    <th class="px-6 py-4 text-center">Status</th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 font-primary">
                <tr v-for="bond in investments" :key="bond.id" @click="viewDetail(bond.id)" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{{ bond.referenceCode }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ bond.issuer?.name || 'FGN' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(bond.faceValue, bond.currency) }}</div>
                        <div class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">at {{ formatCurrency(bond.purchasePrice, bond.currency) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <div class="text-sm font-bold text-primary-600 dark:text-primary-400">{{ bond.couponRate }}%</div>
                        <div class="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{{ bond.couponFrequency.replace('_', ' ') }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <div class="text-sm font-bold text-money-600 dark:text-money-400">{{ bond.yieldToMaturity }}%</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 dark:text-white font-medium">{{ dayjs(bond.maturityDate).format('MMM D, YYYY') }}</div>
                        <div class="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{{ dayjs(bond.maturityDate).diff(dayjs(), 'year', true).toFixed(1) }}Y remain</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span :class="[
                            'px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase',
                            bond.status === 'ACTIVE' ? 'bg-green-50 text-green-700 dark:bg-green-900/30' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30'
                        ]">
                            {{ bond.status.replace('_', ' ') }}
                        </span>
                    </td>
                </tr>
                <tr v-if="investments.length === 0">
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">No bond investments found.</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
