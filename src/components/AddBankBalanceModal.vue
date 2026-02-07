<script setup lang="ts">
import { ref, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    banks: any[]
    currencies: any[]
}>()

const emit = defineEmits<{
    close: []
    add: [bankId: string, currency: string, initialBalance: number]
}>()

const selectedBankId = ref('')
const selectedCurrency = ref('')
const initialBalance = ref('')
const isSubmitting = ref(false)

const isValid = computed(() => {
    const val = parseFloat(initialBalance.value)
    return selectedBankId.value && selectedCurrency.value && !isNaN(val) && val >= 0
})

const handleSubmit = async () => {
    if (!isValid.value) return
    
    isSubmitting.value = true
    try {
        await emit('add', selectedBankId.value, selectedCurrency.value, parseFloat(initialBalance.value))
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
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Add Bank Account</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Associate a new bank account with this subsidiary</p>
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
                <!-- Bank Selection -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Select Bank <span class="text-red-500">*</span>
                    </label>
                    <select 
                        v-model="selectedBankId"
                        required
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                        <option value="" disabled>Select a bank...</option>
                        <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                    </select>
                </div>

                <!-- Currency Selection -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Currency <span class="text-red-500">*</span>
                    </label>
                    <select 
                        v-model="selectedCurrency"
                        required
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                        <option value="" disabled>Select currency...</option>
                        <option v-for="curr in currencies" :key="curr.code" :value="curr.code">{{ curr.code }} - {{ curr.name }}</option>
                    </select>
                </div>

                <!-- Initial Balance -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Initial Balance <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <span class="absolute left-4 top-2 text-gray-500 dark:text-gray-400 font-bold" v-if="selectedCurrency">{{ selectedCurrency }}</span>
                        <input 
                            v-model="initialBalance"
                            type="number"
                            step="any"
                            required
                            placeholder="0.00"
                            :class="['w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white', selectedCurrency ? 'pl-16 pr-4' : 'px-4']"
                        />
                    </div>
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
                        {{ isSubmitting ? 'Adding...' : 'Add Account' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
