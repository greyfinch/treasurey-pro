<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { CalendarIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: Date
}>()

const emit = defineEmits(['update:modelValue'])

const dateInput = ref(dayjs(props.modelValue).format('YYYY-MM-DD'))

watch(dateInput, (newVal) => {
  emit('update:modelValue', new Date(newVal))
})
</script>

<template>
  <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
    <CalendarIcon class="w-5 h-5 text-gray-400" />
    <label for="date-filter" class="text-sm font-medium text-gray-600 whitespace-nowrap">ROI at:</label>
    <input 
      id="date-filter"
      type="date" 
      v-model="dateInput"
      class="text-sm font-medium text-gray-900 focus:outline-none bg-transparent"
    >
  </div>
</template>
