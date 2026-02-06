<script setup lang="ts">

const props = defineProps<{
    banks: any[],
    currencies: any[],
    selectedBankId: string,
    selectedStatus: string,
    selectedCurrency: string,
    maturityDateStart: string,
    maturityDateEnd: string
}>()

const emit = defineEmits(['update:selectedBankId', 'update:selectedStatus', 'update:selectedCurrency', 'update:maturityDateStart', 'update:maturityDateEnd', 'clear'])

const statuses = ['ACTIVE', 'MATURED', 'TERMINATED']
</script>

<template>
    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div class="flex justify-between items-center">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
            <button @click="$emit('clear')" class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors">Clear All</button>
        </div>
        
        <div class="space-y-3">
            <div>
                 <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Currency</label>
                 <select 
                    :value="selectedCurrency" 
                    @change="$emit('update:selectedCurrency', ($event.target as HTMLSelectElement).value)"
                    class="w-full text-sm text-black dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                >
                    <option value="" class="dark:bg-gray-900">All Currencies</option>
                    <option v-for="curr in currencies" :key="curr.code" :value="curr.code" class="dark:bg-gray-900">
                        {{ curr.code }} - {{ curr.name }}
                    </option>
                 </select>
            </div>

            <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Maturity Date Range</label>
                <div class="space-y-2">
                    <input 
                        type="date" 
                        :value="maturityDateStart"
                        @input="$emit('update:maturityDateStart', ($event.target as HTMLInputElement).value)"
                        class="w-full text-sm text-black dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        placeholder="Start Date"
                    >
                    <input 
                        type="date" 
                        :value="maturityDateEnd"
                        @input="$emit('update:maturityDateEnd', ($event.target as HTMLInputElement).value)"
                        class="w-full text-sm text-black dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        placeholder="End Date"
                    >
                </div>
            </div>

            <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <div class="flex flex-wrap gap-2">

                    <button 
                        v-for="status in statuses" 
                        :key="status"
                        @click="$emit('update:selectedStatus', status === selectedStatus ? '' : status)"
                        :class="[
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            selectedStatus === status 
                                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400' 
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        ]"
                    >
                        {{ status }}
                    </button>
                </div>
            </div>

            <div>
                 <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bank</label>
                 <select 
                    :value="selectedBankId" 
                    @change="$emit('update:selectedBankId', ($event.target as HTMLSelectElement).value)"
                    class="w-full text-sm text-black dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                >
                    <option value="" class="dark:bg-gray-900">All Banks</option>
                    <option v-for="bank in banks" :key="bank.id" :value="bank.id" class="dark:bg-gray-900">
                        {{ bank.name }}
                    </option>
                 </select>
            </div>
        </div>
    </div>
</template>
