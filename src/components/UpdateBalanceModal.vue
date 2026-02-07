<script setup lang="ts">
import { ref, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { BankBalance } from '../services/mockData'
import { formatCurrency } from '../utils/dateHelpers'

const props = defineProps<{
    balance: BankBalance
    bankName: string
}>()

const emit = defineEmits<{
    close: []
    update: [newBalance: number, notes: string]
}>()

const newBalance = ref('')
const notes = ref('')
const isSubmitting = ref(false)

const balanceDifference = computed(() => {
    const newVal = parseFloat(newBalance.value)
    if (isNaN(newVal)) return 0
    return newVal - props.balance.balance
})

const isValid = computed(() => {
    const val = parseFloat(newBalance.value)
    return !isNaN(val) && val >= 0
})

const handleSubmit = async () => {
    if (!isValid.value) return
    
    isSubmitting.value = true
    try {
        await emit('update', parseFloat(newBalance.value), notes.value)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-gray-700 transition-colors">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Update Bank Balance</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ bankName }} - {{ balance.currency }}</p>
                </div>
                <button 
                    @click="emit('close')" 
                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <XMarkIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
            </div>

            <!-- Body -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
                <!-- Current Balance -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Current Balance</p>
                    <p class="text-2xl font-black text-gray-900 dark:text-white">{{ formatCurrency(balance.balance, balance.currency) }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last updated: {{ new Date(balance.lastUpdated).toLocaleDateString() }}</p>
                </div>

                <!-- New Balance Input -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        New Balance <span class="text-red-500">*</span>
                    </label>
                    <input 
                        v-model="newBalance"
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                </div>

                <!-- Difference Display -->
                <div v-if="newBalance && isValid" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p class="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">Change</p>
                    <p :class="[
                        'text-lg font-bold',
                        balanceDifference > 0 ? 'text-green-600 dark:text-green-400' : balanceDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    ]">
                        {{ balanceDifference > 0 ? '+' : '' }}{{ formatCurrency(balanceDifference, balance.currency) }}
                    </p>
                </div>

                <!-- Notes -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea 
                        v-model="notes"
                        rows="3"
                        placeholder="Add notes about this balance update..."
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    ></textarea>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button 
                        type="button"
                        @click="emit('close')"
                        class="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        :disabled="!isValid || isSubmitting"
                        class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {{ isSubmitting ? 'Updating...' : 'Update Balance' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
