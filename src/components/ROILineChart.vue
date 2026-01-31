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
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import dayjs from 'dayjs'
import { formatCurrency } from '../utils/dateHelpers'
import { calculatePortfolioROI } from '../utils/roi'

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
}>()

const chartData = computed(() => {
  const days = props.days || 30
  const labels = []
  const data = []
  
  // Generate data for the last N days up to today + N days projection
  // Let's show past 30 days and future 30 days
  const today = dayjs()
  const start = today.subtract(days, 'day')
  const end = today.add(days, 'day')
  
  let current = start
  while (current.isBefore(end)) {
    labels.push(current.format('MMM D'))
    const roi = calculatePortfolioROI(props.investments, current.toDate())
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
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.5)'); // Primary-500
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
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

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context: any) => formatCurrency(context.raw)
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
        color: '#9ca3af'
      }
    },
    y: {
      grid: {
        color: '#f3f4f6'
      },
      ticks: {
        callback: (value: any) => {
          if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`
          if (value >= 1000) return `₦${(value / 1000).toFixed(1)}k`
          return value
        },
        color: '#9ca3af'
      }
    }
  },
  interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
  }
}
</script>

<template>
  <div class="h-[300px] w-full">
    <Line :data="chartData" :options="options" />
  </div>
</template>
