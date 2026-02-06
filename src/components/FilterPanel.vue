<script setup lang="ts">

const props = defineProps<{
    banks: any[],
    currencies: any[],
    selectedBankId: string,
    selectedStatus: string,
    selectedCurrency: string
}>()

const emit = defineEmits(['update:selectedBankId', 'update:selectedStatus', 'update:selectedCurrency', 'clear'])

const statuses = ['ACTIVE', 'MATURED', 'TERMINATED']
</script>

<template>
    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div class="flex justify-between items-center">
            <h3 class="text-sm font-semibold text-gray-700">Filters</h3>
            <button @click="$emit('clear')" class="text-xs text-primary-600 hover:text-primary-800 font-medium">Clear All</button>
        </div>
        
        <div class="space-y-3">
            <div>
                 <label class="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                 <select 
                    :value="selectedCurrency" 
                    @change="$emit('update:selectedCurrency', ($event.target as HTMLSelectElement).value)"
                    class="w-full text-sm text-black rounded-lg border border-gray-200 p-2"
                >
                    <option value="">All Currencies</option>
                    <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                        {{ curr.code }} - {{ curr.name }}
                    </option>
                 </select>
            </div>

            <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <div class="flex flex-wrap gap-2">

                    <button 
                        v-for="status in statuses" 
                        :key="status"
                        @click="$emit('update:selectedStatus', status === selectedStatus ? '' : status)"
                        :class="[
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            selectedStatus === status 
                                ? 'bg-primary-50 border-primary-200 text-primary-700' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]"
                    >
                        {{ status }}
                    </button>
                </div>
            </div>

            <div>
                 <label class="block text-xs font-medium text-gray-500 mb-1">Bank</label>
                 <select 
                    :value="selectedBankId" 
                    @change="$emit('update:selectedBankId', ($event.target as HTMLSelectElement).value)"
                    class="w-full text-sm text-black rounded-lg border border-gray-200 p-2"
                >
                    <option value="">All Banks</option>
                    <option v-for="bank in banks" :key="bank.id" :value="bank.id">
                        {{ bank.name }}
                    </option>
                 </select>
            </div>
        </div>
    </div>
</template>
