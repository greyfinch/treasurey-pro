<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, TrashIcon, ClockIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../../services/mockData'
import type { FXRate, Currency } from '../../../services/mockData'
import { formatDate } from '../../../utils/dateHelpers'
import dayjs from 'dayjs'

const fxRates = ref<FXRate[]>([])
const currencies = ref<Currency[]>([])
const loading = ref(true)
const showModal = ref(false)
const isSubmitting = ref(false)
const showHistory = ref(false)
const selectedFilterCurrency = ref('')

const form = ref({
    fromCurrency: 'USD',
    toCurrency: 'NGN',
    rate: 0,
    source: 'CBN',
    effectiveDate: dayjs().format('YYYY-MM-DD')
})

const fetchData = async () => {
    loading.value = true
    try {
        const [rates, currs] = await Promise.all([
            mockService.getFXRates(),
            mockService.getCurrencies()
        ])
        fxRates.value = rates
        currencies.value = currs
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)

const filteredRates = computed(() => {
    let rates = [...fxRates.value]
    
    // Status Filter
    if (!showHistory.value) {
        rates = rates.filter(r => r.status === 'ACTIVE')
    }
    
    // Currency Filter
    if (selectedFilterCurrency.value) {
        rates = rates.filter(r => r.fromCurrency === selectedFilterCurrency.value)
    }

    // Sort by effective date descending
    return rates.sort((a, b) => dayjs(b.effectiveDate).unix() - dayjs(a.effectiveDate).unix())
})

const openCreateModal = () => {
    form.value = {
        fromCurrency: 'USD',
        toCurrency: 'NGN',
        rate: 0,
        source: 'MANUAL',
        effectiveDate: dayjs().format('YYYY-MM-DD')
    }
    showModal.value = true
}

const handleSave = async () => {
    isSubmitting.value = true
    try {
        await mockService.addFXRate({
            ...form.value,
            effectiveDate: new Date(form.value.effectiveDate)
        } as any)
        await fetchData()
        showModal.value = false
    } catch (err: any) {
        alert(err.message || 'Failed to save FX rate')
    } finally {
        isSubmitting.value = false
    }
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FX rate?')) return
    try {
        await mockService.deleteFXRate(id)
        await fetchData()
    } catch (err: any) {
        alert(err.message || 'Failed to delete FX rate')
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">FX Rate Management</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Manage exchange rates for multi-currency reporting</p>
            </div>
            <div class="flex items-center gap-3">
                <select 
                    v-model="selectedFilterCurrency" 
                    class="text-xs text-gray-900 dark:text-white font-bold rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-primary-500 focus:border-primary-500 p-1.5 border min-w-[120px] transition-colors"
                >
                    <option value="">All Currencies</option>
                    <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
                </select>
                <button 
                    @click="showHistory = !showHistory" 
                    :class="[
                        'flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border',
                        showHistory ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    ]"
                >
                    <ClockIcon class="w-4 h-4" />
                    {{ showHistory ? 'Show Active' : 'View History' }}
                </button>
                <button @click="openCreateModal" class="btn-primary flex items-center gap-2 text-xs">
                    <PlusIcon class="w-4 h-4" />
                    Add Rate
                </button>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">
                    <tr>
                        <th class="px-6 py-4 text-left">Status</th>
                        <th class="px-6 py-4 text-left">From</th>
                        <th class="px-6 py-4 text-left">To</th>
                        <th class="px-6 py-4 text-left">Rate</th>
                        <th class="px-6 py-4 text-left">Source</th>
                        <th class="px-6 py-4 text-left">Effective Date</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <tr v-for="rate in filteredRates" :key="rate.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td class="px-6 py-4">
                            <span v-if="rate.status === 'ACTIVE'" class="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase">
                                <CheckCircleIcon class="w-3.5 h-3.5" />
                                Active
                            </span>
                            <span v-else class="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase">
                                Superseded
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{{ rate.fromCurrency }}</td>
                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ rate.toCurrency }}</td>
                        <td class="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">{{ rate.rate }}</td>
                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{{ rate.source }}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ formatDate(rate.effectiveDate) }}</td>
                        <td class="px-6 py-4 text-right">
                            <button @click="handleDelete(rate.id)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                    <tr v-if="filteredRates.length === 0">
                        <td colspan="7" class="px-6 py-10 text-center text-sm text-gray-500 italic">
                            No rates found.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 dark:bg-gray-950/80 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Add FX Rate</h3>
                    <p class="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase p-1 bg-primary-50 dark:bg-primary-900/40 rounded">New Entry</p>
                </div>
                <form @submit.prevent="handleSave" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">From Currency</label>
                            <select v-model="form.fromCurrency" class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900 transition-colors">
                                <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">To Currency</label>
                            <select v-model="form.toCurrency" class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900 transition-colors">
                                <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Rate</label>
                        <input v-model="form.rate" type="number" step="0.0001" required class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900 transition-colors">
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Note: Adding a rate for a date that already has one will supersede the old rate.</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
                        <select v-model="form.source" class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900 transition-colors">
                            <option value="MANUAL">MANUAL</option>
                            <option value="CBN">CBN</option>
                            <option value="BLOOMBERG">BLOOMBERG</option>
                            <option value="REUTERS">REUTERS</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Effective Date</label>
                        <input v-model="form.effectiveDate" type="date" required class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900 transition-colors [color-scheme:light] dark:[color-scheme:dark]">
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        <button type="submit" :disabled="isSubmitting" class="btn-primary">
                            {{ isSubmitting ? 'Saving...' : 'Save Rate' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
