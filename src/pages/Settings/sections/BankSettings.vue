<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../../services/mockData'
import BankFormModal from '../../../components/BankFormModal.vue'

const loading = ref(true)
const banks = ref<any[]>([])
const showModal = ref(false)
const editingBank = ref<any>(null)

onMounted(async () => {
    await fetchData()
})

const fetchData = async () => {
    try {
        banks.value = await mockService.getBanks()
    } finally {
        loading.value = false
    }
}

const openAddModal = () => {
    editingBank.value = null
    showModal.value = true
}

const openEditModal = (bank: any) => {
    editingBank.value = bank
    showModal.value = true
}

const handleSaved = async () => {
    await fetchData()
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank? This might affect existing investments.')) return
    try {
        await mockService.deleteBank(id)
        await fetchData()
    } catch (e) {
        alert('Failed to delete bank')
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex flex-wrap justify-between items-center">
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Partner Banks</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Manage financial institutions you partner with</p>
            </div>
            <button 
                @click="openAddModal"
                class="btn-primary flex items-center gap-2 text-xs"
            >
                <PlusIcon class="w-4 h-4" />
                Add Bank
            </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <div v-if="loading" class="p-8 text-center text-gray-500 dark:text-gray-400">Loading banks...</div>
            <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">
                    <tr>
                        <th class="px-6 py-4 text-left">Bank Name</th>
                        <th class="px-6 py-4 text-left font-mono">ID</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="bank in banks" :key="bank.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                            {{ bank.name }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500 font-mono">{{ bank.id }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button @click="openEditModal(bank)" class="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
                                <PencilSquareIcon class="w-4 h-4" />
                            </button>
                            <button @click="handleDelete(bank.id)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                    <tr v-if="banks.length === 0">
                         <td colspan="3" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">No banks found.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Reusable Modal Component -->
        <BankFormModal 
            :is-open="showModal"
            :bank-to-edit="editingBank"
            @close="showModal = false"
            @saved="handleSaved"
        />
    </div>
</template>
