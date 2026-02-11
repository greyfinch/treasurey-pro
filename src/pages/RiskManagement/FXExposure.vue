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
import { riskService, type FXExposure, type FXHedgeLink } from '../../services/riskService'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const exposures = ref<FXExposure[]>([])
const hedges = ref<FXHedgeLink[]>([])
const currencies = computed(() => [...new Set(exposures.value.map(e => e.currencyCode))])
const sensitivityPercent = ref(5)

onMounted(async () => {
  exposures.value = await riskService.getExposures()
  hedges.value = await riskService.getHedges()
})

// --- Net Exposure Table Data ---
const exposureTableData = computed(() => {
  return currencies.value.map(currency => {
    const net = riskService.getNetExposure(exposures.value, currency)
    const coverage = riskService.getHedgeCoverage(exposures.value, hedges.value, currency)
    
    // Simple logic: if negative net exposure (shorts), we want high coverage.
    // If positive (longs), coverage might mean selling forwards.
    // For MVP, simplify to: Amount Hedged vs Net Exposure magnitude.
    
    return {
      currency,
      netExposure: net,
      hedgeRatio: coverage,
      status: coverage >= 70 ? 'Optimal' : coverage >= 50 ? 'Moderate' : 'High Risk'
    }
  })
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Optimal': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    case 'Moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'High Risk': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
    default: return 'text-gray-600 bg-gray-50'
  }
}

// --- Chart Data ---
const chartData = computed(() => {
  const labels = ['0-30', '31-60', '61-90', '90+']
  // We'll just chart USD for the MVP demo, or aggregate all converted to USD (simplified)
  // Let's Chart USD for now as it's the primary risk for many.
  const usdBuckets = riskService.getExposureBuckets(exposures.value, 'USD')

  return {
    labels,
    datasets: [
      {
        label: 'USD Net Exposure',
        backgroundColor: '#f87171',
        data: [usdBuckets['0-30'], usdBuckets['31-60'], usdBuckets['61-90'], usdBuckets['90+']]
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  }
}

// --- Risk Sensitivity ---
const riskImpact = computed(() => {
  // Aggregate absolute net exposure converted to base currency (assuming 1:1 for simplicity or just summing magnitudes)
  // In reality, we'd convert all to NGN. Let's assume the values are already USD equivalent for this demo context.
  const totalNet = exposureTableData.value.reduce((sum, item) => sum + Math.abs(item.netExposure), 0)
  return riskService.calculateRiskSensitivity(totalNet, sensitivityPercent.value)
})

</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">FX Exposure</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor and manage your foreign currency risk.</p>
    </div>

    <!-- Top KPI Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <!-- Risk Sensitivity Card -->
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-red-100 dark:bg-red-900/20 rounded-md p-3">
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Risk Impact ({{ sensitivityPercent }}% Move)</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(riskImpact) }}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

       <!-- Hedge Coverage Card -->
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-100 dark:bg-green-900/20 rounded-md p-3">
            <ShieldCheckIcon class="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div class="ml-5 w-0 flex-1">
             <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">USD Hedge Coverage</dt>
               <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{  exposureTableData.find(e => e.currency === 'USD')?.hedgeRatio.toFixed(1) || 0 }}%
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>


    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Net Exposure Table -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 shadow ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-100 dark:border-gray-700">
           <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Net Exposure by Currency</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:pl-6">Currency</th>
                <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Net Exposure</th>
                <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Hedge Ratio</th>
                <th scope="col" class="px-3 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <tr v-for="item in exposureTableData" :key="item.currency">
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{{ item.currency }}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right" :class="item.netExposure < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                    {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.netExposure) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">{{ item.hedgeRatio.toFixed(1) }}%</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
                  <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10" :class="getStatusColor(item.status)">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Time Bucket Chart -->
      <div class="bg-white dark:bg-gray-800 shadow ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-lg p-6">
         <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">USD Exposure Buckets</h3>
         <div class="h-64">
           <Bar :data="chartData" :options="chartOptions" />
         </div>
      </div>
    </div>
  </div>
</template>
