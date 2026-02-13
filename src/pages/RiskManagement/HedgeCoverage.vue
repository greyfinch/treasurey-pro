<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { riskService, type FXExposure, type FXHedgeLink, type FXForward } from '../../services/riskService'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const exposures = ref<FXExposure[]>([])
const hedges = ref<FXHedgeLink[]>([])
const forwards = ref<FXForward[]>([])
const selectedCurrency = ref('USD')

onMounted(async () => {
  exposures.value = await riskService.getExposures()
  hedges.value = await riskService.getHedges()
  forwards.value = await riskService.getForwards()
})

// --- Summary Data ---

const currencyCoverage = computed(() => {
    return riskService.getCurrencyCoverage(selectedCurrency.value)
})

const exposureList = computed(() => {
    // Filter exposures by selected currency and map with coverage info
    return exposures.value
        .filter(e => e.currencyCode === selectedCurrency.value && e.status !== 'SETTLED')
        .map(e => {
            const coverage = riskService.getExposureCoverage(e.id)
            return {
                ...e,
                ...coverage
            }
        })
})

const bucketedCoverage = computed(() => {
    return riskService.getTimeBucketedCoverage(selectedCurrency.value)
})


// --- Chart Data ---

const chartData = computed(() => {
  const labels = ['0-30', '31-60', '61-90', '90+']
  const buckets = bucketedCoverage.value
  
  return {
    labels,
    datasets: [
      {
        label: 'Net Exposure',
        backgroundColor: '#f87171', // Red for risk
        data: [
            Math.abs(buckets['0-30'].exposure),
            Math.abs(buckets['31-60'].exposure),
            Math.abs(buckets['61-90'].exposure),
            Math.abs(buckets['90+'].exposure)
        ]
      },
      {
        label: 'Hedged Amount',
        backgroundColor: '#4ade80', // Green for hedge
        data: [
            buckets['0-30'].hedged,
            buckets['31-60'].hedged,
            buckets['61-90'].hedged,
            buckets['90+'].hedged
        ]
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const }
  },
  scales: {
      y: {
          beginAtZero: true,
          ticks: {
              callback: (value: any) => {
                  return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)
              }
          }
      }
  }
}

// --- Helpers ---

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const getCoverageColor = (ratio: number) => {
    if (ratio >= 1) return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' // Over/Full
    if (ratio >= 0.8) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    if (ratio >= 0.5) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
}

const getCoverageStatus = (ratio: number) => {
     if (ratio > 1.01) return 'Over-Hedged'
     if (ratio >= 0.99) return 'Fully Hedged'
     if (ratio >= 0.5) return 'Partially Hedged'
     if (ratio > 0) return 'Low Coverage'
     return 'Unhedged'
}


</script>

<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Hedge Coverage</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Analyze your hedge ratios and gap analysis.</p>
      </div>
      <div class="mt-4 sm:mt-0 flex items-center space-x-3">
          <label for="currency-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency:</label>
          <select 
            id="currency-select"
            v-model="selectedCurrency" 
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <!-- Net Exposure -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Net Exposure</dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(currencyCoverage.netExposure, selectedCurrency) }}
            </dd>
            <div class="mt-2 text-sm text-gray-500">
                Total Risk Position
            </div>
        </div>

        <!-- Hedged Amount -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Hedged</dt>
            <dd class="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">
                {{ formatCurrency(currencyCoverage.totalHedged, selectedCurrency) }}
            </dd>
             <div class="mt-2 text-sm text-gray-500">
                Active Forwards
            </div>
        </div>

        <!-- Unhedged Amount -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Unhedged Exposure</dt>
            <dd class="mt-1 text-3xl font-semibold text-red-600 dark:text-red-400">
                {{ formatCurrency(currencyCoverage.unhedgedAmount, selectedCurrency) }}
            </dd>
             <div class="mt-2 text-sm text-gray-500">
                Open Risk
            </div>
        </div>

        <!-- Coverage Ratio -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Coverage Ratio</dt>
            <dd class="mt-1 text-3xl font-semibold" :class="getCoverageColor(currencyCoverage.coverageRatio).split(' ')[0]">
                {{ (currencyCoverage.coverageRatio * 100).toFixed(1) }}%
            </dd>
             <div class="mt-2">
                <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10" :class="getCoverageColor(currencyCoverage.coverageRatio)">
                    {{ getCoverageStatus(currencyCoverage.coverageRatio) }}
                </span>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Chart -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-800 shadow ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-lg p-6">
             <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">Maturity Gap Analysis</h3>
             <div class="h-64">
                <Bar :data="chartData" :options="chartOptions" />
             </div>
        </div>

        <!-- Detailed List -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 shadow ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-lg overflow-hidden">
             <div class="px-4 py-5 sm:px-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Exposure Details</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:pl-6">Ref</th>
                             <th scope="col" class="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
                            <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                            <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Hedged</th>
                            <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Coverage</th>
                            <th scope="col" class="px-3 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span class="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        <tr v-for="item in exposureList" :key="item.id">
                            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                {{ item.sourceReference || 'N/A' }}
                                <div class="text-xs text-gray-500 font-normal">{{ item.direction }}</div>
                            </td>
                             <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ item.expectedDate }}</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white text-right">{{ formatCurrency(item.amount, item.currencyCode) }}</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-green-600 dark:text-green-400 text-right">{{ formatCurrency(item.totalHedged || 0, item.currencyCode) }}</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">{{ ((item.coverageRatio || 0) * 100).toFixed(0) }}%</td>
                             <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
                                <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10" :class="getCoverageColor(item.coverageRatio || 0)">
                                    {{ getCoverageStatus(item.coverageRatio || 0) }}
                                </span>
                            </td>
                            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button v-if="(item.coverageRatio || 0) < 1" type="button" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    Link Hedge
                                </button>
                            </td>
                        </tr>
                        <tr v-if="exposureList.length === 0">
                            <td colspan="7" class="py-8 text-center text-sm text-gray-500">
                                No active exposures found for {{ selectedCurrency }}.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  </div>
</template>
