<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js'
import { Line } from 'vue-chartjs'
import dayjs from 'dayjs'
import { formatCurrency } from '../utils/dateHelpers'
import { calculatePortfolioROI } from '../utils/roi'

import { useTheme } from '../composables/useTheme'

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

const props = defineProps<{
  investments: any[]
  days?: number
  baseCurrency?: string
  fxRates?: any[]
}>()

const { isDark } = useTheme()

const chartData = computed(() => {
  const days = props.days || 30
  const labels = []
  const data = []
  const targetCurrency = props.baseCurrency || 'NGN'
  const fxRates = props.fxRates || []
  
  // Generate data for the last N days up to today + N days projection
  const today = dayjs()
  const start = today.subtract(days, 'day')
  const end = today.add(days, 'day')
  
  let current = start
  while (current.isBefore(end)) {
    labels.push(current.format('MMM D'))
    const roi = calculatePortfolioROI(props.investments, current.toDate(), targetCurrency, fxRates)
    data.push(roi.toNumber())
    current = current.add(1, 'day')
  }

  return {
    labels,
    datasets: [
      {
        label: 'Total Accumulated ROI',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          if (isDark.value) {
            gradient.addColorStop(0, 'rgba(14, 165, 233, 0.3)');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
          } else {
            gradient.addColorStop(0, 'rgba(14, 165, 233, 0.5)');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
          }
          return gradient;
        },
        borderColor: '#0ea5e9',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        data,
        tension: 0.4
      }
    ]
  }
})

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      titleColor: isDark.value ? '#ffffff' : '#111827',
      bodyColor: isDark.value ? '#d1d5db' : '#374151',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => formatCurrency(context.raw, props.baseCurrency || 'NGN')
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxTicksLimit: 8,
        color: isDark.value ? '#9ca3af' : '#6b7280'
      }
    },
    y: {
      grid: {
        color: isDark.value ? '#374151' : '#f3f4f6'
      },
      ticks: {
        callback: (value: any) => {
          const symbol = props.baseCurrency === 'USD' ? '$' : props.baseCurrency === 'EUR' ? '€' : props.baseCurrency === 'GBP' ? '£' : '₦'
          if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`
          if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`
          return `${symbol}${value}`
        },
        color: isDark.value ? '#9ca3af' : '#6b7280'
      }
    }
  },
  interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
  }
}))
</script>

<template>
  <div class="h-[300px] w-full">
    <Line :data="chartData" :options="options" />
  </div>
</template>
