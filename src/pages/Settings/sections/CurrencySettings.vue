<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon, StarIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../../services/mockData'
import type { Currency, CurrencyCode } from '../../../services/mockData'

const currencies = ref<Currency[]>([])
const loading = ref(true)
const showModal = ref(false)
const selectedCurrency = ref<Currency | null>(null)
const isSubmitting = ref(false)
const currBase = ref<string>('')

const form = ref({
    code: '' as CurrencyCode | '',
    name: '',
    symbol: ''
})

const fetchData = async () => {
    loading.value = true
    try {
        const [currs, base] = await Promise.all([
            mockService.getCurrencies(),
            mockService.getBaseCurrency()
        ])
        currencies.value = currs
        currBase.value = base
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)

const openCreateModal = () => {
    selectedCurrency.value = null
    form.value = { code: '', name: '', symbol: '' }
    showModal.value = true
}

const openEditModal = (currency: Currency) => {
    selectedCurrency.value = currency
    form.value = { ...currency }
    showModal.value = true
}

const handleSave = async () => {
    isSubmitting.value = true
    try {
        if (selectedCurrency.value) {
            await mockService.updateCurrency(selectedCurrency.value.code, form.value as Partial<Currency>)
        } else {
            await mockService.addCurrency(form.value as Currency)
        }
        await fetchData()
        showModal.value = false
    } catch (err: any) {
        alert(err.message || 'Failed to save currency')
    } finally {
        isSubmitting.value = false
    }
}

const handleSetBase = async (code: string) => {
    if (!confirm(`Set ${code} as the global base currency? This will affect all financial reports.`)) return
    try {
        await mockService.setBaseCurrency(code as any)
        await fetchData()
    } catch (err: any) {
        alert(err.message || 'Failed to set base currency')
    }
}

const handleDelete = async (code: string) => {
    if (code === currBase.value) return alert(`Cannot delete the active base currency ${code}`)
    if (!confirm('Are you sure you want to delete this currency?')) return
    
    try {
        await mockService.deleteCurrency(code as any)
        await fetchData()
    } catch (err: any) {
        alert(err.message || 'Failed to delete currency')
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex flex-wrap justify-between items-center">
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Currency Management</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Add or manage currencies used in the system</p>
            </div>
            <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
                <PlusIcon class="w-4 h-4" />
                Add Currency
            </button>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">
                    <tr>
                        <th class="px-6 py-4 text-left">Code</th>
                        <th class="px-6 py-4 text-left">Name</th>
                        <th class="px-6 py-4 text-left">Symbol</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <tr v-for="curr in currencies" :key="curr.code" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                            <div class="flex items-center gap-2">
                                {{ curr.code }}
                                <span v-if="curr.code === currBase" class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-[10px] rounded-full uppercase">Base</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ curr.name }}</td>
                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ curr.symbol }}</td>
                        <td class="px-6 py-4 text-right flex justify-end gap-2">
                            <button 
                                v-if="curr.code !== currBase"
                                @click="handleSetBase(curr.code)" 
                                class="p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
                                title="Set as Base"
                            >
                                <StarIcon class="w-4 h-4" />
                            </button>
                            <button @click="openEditModal(curr)" class="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
                                <PencilSquareIcon class="w-4 h-4" />
                            </button>
                            <button 
                                v-if="curr.code !== currBase" 
                                @click="handleDelete(curr.code)" 
                                class="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 dark:bg-gray-950/80 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ selectedCurrency ? 'Edit' : 'Add' }} Currency</h3>
                <form @submit.prevent="handleSave" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency Code</label>
                        <input v-model="form.code" type="text" maxlength="3" required :disabled="!!selectedCurrency" class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input v-model="form.name" type="text" required class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Symbol</label>
                        <input v-model="form.symbol" type="text" required class="mt-1 text-gray-900 dark:text-white block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 bg-white dark:bg-gray-900">
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        <button type="submit" :disabled="isSubmitting" class="btn-primary">
                            {{ isSubmitting ? 'Saving...' : 'Save Currency' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
