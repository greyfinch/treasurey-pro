<script setup lang="ts">
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/vue/24/outline'

defineEmits(['export-excel', 'export-csv'])
</script>

<template>
  <div class="flex items-center gap-2">
    <button 
      @click="$emit('export-excel')"
      class="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm transition-colors"
      title="Export to Excel"
    >
      <TableCellsIcon class="w-4 h-4 text-green-600 dark:text-green-500" />
      Excel
    </button>
    
    <button 
      @click="$emit('export-csv')"
      class="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm transition-colors"
      title="Export to CSV"
    >
      <ArrowDownTrayIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
      CSV
    </button>
  </div>
</template>
