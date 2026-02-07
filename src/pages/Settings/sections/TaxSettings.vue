<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mockService, type TaxSettings } from '../../../services/mockData'
import { ReceiptPercentIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const loading = ref(true)
const saving = ref(false)
const success = ref(false)
const settings = ref<TaxSettings>({
    whtRate: 10
})

onMounted(async () => {
    try {
        const data = await mockService.getTaxSettings()
        settings.value = { ...data }
    } finally {
        loading.value = false
    }
})

const handleSave = async () => {
    saving.value = true
    success.value = false
    try {
        await mockService.updateTaxSettings(settings.value)
        success.value = true
        setTimeout(() => success.value = false, 3000)
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div class="max-w-4xl">
        <header class="mb-8">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ReceiptPercentIcon class="w-6 h-6 text-primary-500" />
                Tax Settings
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure withholding tax (WHT) rates for investment interest</p>
        </header>

        <div v-if="loading" class="flex justify-center py-12">
            <ArrowPathIcon class="w-8 h-8 text-primary-500 animate-spin" />
        </div>

        <div v-else class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Withholding Tax (WHT) Rate</label>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">The percentage of interest earned that will be deducted at source.</p>
                            <div class="relative mt-1 max-w-[200px]">
                                <input 
                                    type="number" 
                                    v-model="settings.whtRate"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    class="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                />
                                <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <span class="text-gray-500 dark:text-gray-400 sm:text-sm font-bold">%</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                            <h4 class="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                                <ReceiptPercentIcon class="w-4 h-4" />
                                Reporting Impact
                            </h4>
                            <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                Updating this rate will immediately affect all accrued ROI calculations across the dashboard and reports. 
                                It ensures that the ROI shown reflects the net interest after deduclting the withholding tax as per local tax regulations.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center gap-4">
                    <transition name="fade">
                        <span v-if="success" class="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
                            <CheckCircleIcon class="w-5 h-5" />
                            Settings saved successfully
                        </span>
                    </transition>
                    <button 
                        @click="handleSave"
                        :disabled="saving"
                        class="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
                    >
                        <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                        {{ saving ? 'Saving Changes...' : 'Save Tax Settings' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
