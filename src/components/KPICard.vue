<script setup lang="ts">
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/solid'

defineProps<{
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{{ label }}</p>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ value }}</h3>
      </div>
      <div v-if="trend" :class="[
        'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
        trend > 0 ? 'bg-money-100 dark:bg-money-900/30 text-money-700 dark:text-money-400' : 'bg-expense-100 dark:bg-expense-900/30 text-expense-600 dark:text-expense-400'
      ]">
        <component :is="trend > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon" class="w-3 h-3" />
        {{ Math.abs(trend) }}%
      </div>
    </div>
    <div v-if="trendLabel" class="mt-2 text-xs text-gray-400 dark:text-gray-500">
      {{ trendLabel }}
    </div>
  </div>
</template>
