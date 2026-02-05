<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { TrashIcon, BuildingOfficeIcon } from '@heroicons/vue/24/outline'
import { formatCurrency, formatDate, formatPercentage } from '../utils/dateHelpers'
import { calculateInvestmentROI } from '../utils/roi'
import { ORGANISATIONS } from '../services/mockData'
import dayjs from 'dayjs'

const props = defineProps<{
  investments: any[]
  targetDate: Date
}>()

const emit = defineEmits<{
  terminate: [id: string]
}>()

const router = useRouter()

const getSubsidiaryName = (orgId: string) => {
  const org = ORGANISATIONS.find(o => o.id === orgId)
  return org ? org.name : 'Unknown'
}

const getDisplayStatus = (investment: any) => {
  const isMatured = dayjs(investment.maturityDate).isBefore(dayjs(), 'day')
  if (investment.status === 'ACTIVE' && isMatured) return 'MATURED'
  return investment.status
}

const sortedInvestments = computed(() => {
  return [...props.investments].sort((a, b) => {
    // Sort by status (Active first) then by maturity date
    const statusA = getDisplayStatus(a)
    const statusB = getDisplayStatus(b)
    if (statusA === 'ACTIVE' && statusB !== 'ACTIVE') return -1
    if (statusA !== 'ACTIVE' && statusB === 'ACTIVE') return 1
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

const handleTerminate = (event: Event, id: string) => {
  event.stopPropagation()
  emit('terminate', id)
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
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span>ID: {{ inv.id.slice(0, 8) }}</span>
                  <span class="text-gray-300">•</span>
                  <span class="flex items-center gap-1">
                    <BuildingOfficeIcon class="h-3 w-3" />
                    {{ getSubsidiaryName(inv.organisationId) }}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900 font-medium">{{ formatCurrency(inv.principal, inv.currency) }}</div>
            <div class="text-xs text-gray-500">{{ inv.currency }}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">{{ formatPercentage(inv.dailyRate) }}</div>
             <div class="text-xs text-gray-500">Daily</div>
          </td>
           <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-bold text-money-600">
              {{ formatCurrency(getROI(inv).toNumber(), inv.currency) }}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div><span class="text-xs text-gray-400">Start:</span> {{ formatDate(inv.startDate) }}</div>
            <div><span class="text-xs text-gray-400">End:</span> {{ formatDate(inv.maturityDate) }}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusColor(getDisplayStatus(inv))]">
              {{ getDisplayStatus(inv) }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button
              v-if="getDisplayStatus(inv) === 'ACTIVE'"
              @click="handleTerminate($event, inv.id)"
              class="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Terminate Investment"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
            <span v-else class="text-gray-400 text-xs">N/A</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
