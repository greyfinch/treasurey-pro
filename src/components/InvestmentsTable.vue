<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency, formatDate, formatPercentage } from '../utils/dateHelpers'
import { calculateInvestmentROI } from '../utils/roi'

const props = defineProps<{
  investments: any[]
  targetDate: Date
}>()

const router = useRouter()

const sortedInvestments = computed(() => {
  return [...props.investments].sort((a, b) => {
    // Sort by status (Active first) then by maturity date
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1
    return new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime()
  })
})

const getROI = (investment: any) => {
  const result = calculateInvestmentROI({
    principal: investment.principal,
    dailyRate: investment.dailyRate,
    startDate: investment.startDate,
    targetDate: props.targetDate,
    withdrawals: investment.withdrawals
  })
  return result.interest
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-800'
    case 'MATURED': return 'bg-blue-100 text-blue-800'
    case 'TERMINATED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const navigateToDetail = (id: string) => {
  router.push(`/investments/${id}`)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
           <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accrued ROI</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr 
          v-for="inv in sortedInvestments" 
          :key="inv.id"
          @click="navigateToDetail(inv.id)"
          class="hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                {{ inv.bank.name.charAt(0) }}
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">{{ inv.bank.name }}</div>
                <div class="text-xs text-gray-500">ID: {{ inv.id.slice(0, 8) }}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900 font-medium">{{ formatCurrency(inv.principal) }}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">{{ formatPercentage(inv.dailyRate) }}</div>
             <div class="text-xs text-gray-500">Daily</div>
          </td>
           <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-bold text-money-600">
              {{ formatCurrency(getROI(inv).toNumber()) }}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div><span class="text-xs text-gray-400">Start:</span> {{ formatDate(inv.startDate) }}</div>
            <div><span class="text-xs text-gray-400">End:</span> {{ formatDate(inv.maturityDate) }}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusColor(inv.status)]">
              {{ inv.status }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
