<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { valuationService, type PortfolioValuationSummary } from '../../services/valuationService'
import { 
    PresentationChartLineIcon, 
    CurrencyDollarIcon, 
    ArrowTrendingUpIcon, 
    ArrowTrendingDownIcon 
} from '@heroicons/vue/24/outline'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// State
const loading = ref(true)
const summary = ref<PortfolioValuationSummary | null>(null)
const history = ref<{ date: string, value: number }[]>([])

// Chart Configuration
const chartData = computed(() => ({
  labels: history.value.map(h => h.date),
  datasets: [
    {
      label: 'Portfolio MTM (NGN)',
      backgroundColor: (ctx: any) => {
        const canvas = ctx.chart.ctx;
        const gradient = canvas.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // Green-500 equivalent
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        return gradient;
      },
      borderColor: '#10B981', // Green-500
      data: history.value.map(h => h.value),
      fill: true,
      tension: 0.4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  scales: {
    y: {
      grid: { display: true, color: '#f3f4f6' },
      ticks: {
          callback: (value: any) => '₦' + (value / 1000000).toFixed(1) + 'M'
      }
    },
    x: {
      grid: { display: false }
    }
  },
  interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
  }
}

// Data Fetching
const fetchData = async () => {
    try {
        summary.value = await valuationService.getPortfolioSummary()
        history.value = await valuationService.getHistory()
    } catch (error) {
        console.error('Failed to fetch MTM data', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(amount)
}

const getPercentage = (pl: number, book: number) => {
    if (!book) return 0
    return (pl / book) * 100
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">MTM Valuation</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Daily Mark-to-Market valuation of active portfolio instruments.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else class="space-y-6">
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <!-- Total Market Value -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Market Value</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(summary?.totalMarketValue || 0) }}</dd>
                <div class="mt-2 flex items-center text-sm text-gray-500">
                    <CurrencyDollarIcon class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                    <span class="text-gray-400">Book Value: {{ formatCurrency(summary?.totalBookValue || 0) }}</span>
                </div>
            </div>

            <!-- Unrealized P&L -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Unrealized P&L</dt>
                <dd class="mt-1 text-3xl font-semibold" :class="(summary?.totalUnrealizedPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ (summary?.totalUnrealizedPL || 0) >= 0 ? '+' : '' }}{{ formatCurrency(summary?.totalUnrealizedPL || 0) }}
                </dd>
                 <div class="mt-2 flex items-center text-sm">
                    <component 
                        :is="(summary?.totalUnrealizedPL || 0) >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon"
                        class="mr-1.5 h-5 w-5 flex-shrink-0"
                        :class="(summary?.totalUnrealizedPL || 0) >= 0 ? 'text-green-500' : 'text-red-500'"
                    />
                    <span :class="(summary?.totalUnrealizedPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ getPercentage(summary?.totalUnrealizedPL || 0, summary?.totalBookValue || 1).toFixed(2) }}% Return
                    </span>
                </div>
            </div>

            <!-- Valuation Date -->
             <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6 flex flex-col justify-center">
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Valuation Date</dt>
                <dd class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{{ summary?.valuationDate }}</dd>
                 <div class="mt-2 text-xs text-gray-400">
                    Next Run: Tomorrow, 06:00 AM
                </div>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Historical MTM Trend (30 Days)</h3>
            <div class="h-80 w-full">
                <Line :data="chartData" :options="chartOptions" />
            </div>
        </div>

        <!-- Breakdown Table -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
             <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">Portfolio Breakdown by Instrument</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instrument Type</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Book Value (NGN Eq)</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Market Value (NGN Eq)</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unrealized P&L</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Impact</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-for="(data, type) in summary?.breakdownByType" :key="type">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {{ type.replace('_', ' ') }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                {{ formatCurrency(data.book) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                                {{ formatCurrency(data.market) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold" :class="data.pl >= 0 ? 'text-green-600' : 'text-red-600'">
                                {{ formatCurrency(data.pl) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                {{ getPercentage(data.pl, data.book).toFixed(2) }}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  </div>
</template>
