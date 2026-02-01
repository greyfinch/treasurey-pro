<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../services/mockData'
import BankFormModal from '../../components/BankFormModal.vue'
import InvestmentsTable from '../../components/InvestmentsTable.vue'

const loading = ref(true)
const banks = ref<any[]>([])
const investments = ref<any[]>([])
const showModal = ref(false)
const showInvestmentsModal = ref(false)
const selectedBankName = ref('')
const selectedBankInvestments = ref<any[]>([])
const editingBank = ref<any>(null)

onMounted(async () => {
    await fetchData()
})

const fetchData = async () => {
    try {
        const [bankData, investmentData] = await Promise.all([
            mockService.getBanks(),
            mockService.getInvestments()
        ])
        banks.value = bankData
        investments.value = investmentData
    } finally {
        loading.value = false
    }
}

const openInvestmentsModal = async (bank: any) => {
    selectedBankName.value = bank.name
    // Fetch investments if not already done or specific to bank?
    // For simplicity, we can fetch all and filter, or add getInvestmentsByBank to service
    // Let's just fetch all for now as mock service is fast
    const allInvestments = await mockService.getInvestments()
    selectedBankInvestments.value = allInvestments.filter((i: any) => i.bankId === bank.id)
    showInvestmentsModal.value = true
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
    // Modal closes itself via close event which sets showModal = false
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

const bankPerformanceRanking = computed(() => {
    const bankRows = banks.value.map(bank => {
        const bankInvestments = investments.value.filter((inv: any) => inv.bankId === bank.id)
        const activeInvestments = bankInvestments.filter((inv: any) => inv.status === 'ACTIVE')
        const targetInvestments = activeInvestments.length ? activeInvestments : bankInvestments

        if (!targetInvestments.length) {
            return {
                id: bank.id,
                name: bank.name,
                effectiveRate: 0
            }
        }

        const totals = targetInvestments.reduce(
            (acc: { weightedRateSum: number; principalSum: number }, inv: any) => {
                const principal = Number(inv.principal) || 0
                const dailyRate = Number(inv.dailyRate) || 0
                const effectiveRate = (Math.pow(1 + dailyRate, 30) - 1) * 100
                acc.weightedRateSum += effectiveRate * principal
                acc.principalSum += principal
                return acc
            },
            { weightedRateSum: 0, principalSum: 0 }
        )

        const effectiveRate = totals.principalSum
            ? totals.weightedRateSum / totals.principalSum
            : 0

        return {
            id: bank.id,
            name: bank.name,
            effectiveRate
        }
    })

    return bankRows.sort((a, b) => b.effectiveRate - a.effectiveRate)
})
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Banks</h1>
                <p class="text-sm text-gray-500">Manage partner banks</p>
            </div>
            <button 
                @click="openAddModal"
                class="btn-primary"
            >
                <PlusIcon class="w-5 h-5" />
                Add Bank
            </button>
        </div>

        <!-- List -->
        <div class="card p-0 overflow-hidden">
            <div v-if="loading" class="p-8 text-center text-gray-500">Loading banks...</div>
            <table v-else class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="bank in banks" :key="bank.id">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <button 
                                @click="openInvestmentsModal(bank)"
                                class="text-primary-600 hover:text-primary-900 hover:underline focus:outline-none"
                            >
                                {{ bank.name }}
                            </button>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{{ bank.id }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button @click="openEditModal(bank)" class="text-primary-600 hover:text-primary-900 mr-4">
                                <PencilSquareIcon class="w-5 h-5" />
                            </button>
                            <button @click="handleDelete(bank.id)" class="text-red-600 hover:text-red-900">
                                <TrashIcon class="w-5 h-5" />
                            </button>
                        </td>
                    </tr>
                    <tr v-if="banks.length === 0">
                         <td colspan="3" class="px-6 py-8 text-center text-gray-500 italic">No banks found. Add one to get started.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Bank Performance Ranking -->
        <div class="card bg-white p-4">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">Bank Performance Ranking</h2>
                    <p class="text-xs text-gray-500">Strategic view of effective monthly yield by bank (weighted by principal)</p>
                </div>
                <span class="text-[10px] uppercase tracking-wider text-gray-400">Effective Rate</span>
            </div>

            <div v-if="bankPerformanceRanking.length" class="space-y-2">
                <div
                    v-for="(bank, index) in bankPerformanceRanking"
                    :key="bank.id"
                    class="flex items-center justify-between rounded-lg border border-gray-500 px-4 py-3 hover:bg-gray-50"
                >
                    <div class="flex items-center gap-3">
                        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                            {{ index + 1 }}
                        </span>
                        <div>
                            <p class="text-sm font-medium text-gray-900">{{ bank.name }}</p>
                            <p class="text-[10px] text-gray-500">Performance ranking</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-semibold text-primary-700">{{ bank.effectiveRate.toFixed(1) }}%</p>
                        <p class="text-[10px] text-gray-400">effective monthly</p>
                    </div>
                </div>
            </div>
            <div v-else class="text-sm text-gray-500">No performance data yet.</div>
        </div>


        <!-- Reusable Modal Component -->
        <BankFormModal 
            :is-open="showModal"
            :bank-to-edit="editingBank"
            @close="showModal = false"
            @saved="handleSaved"
        />

        <!-- Investments View Modal -->
        <div v-if="showInvestmentsModal" class="fixed inset-0 z-50 overflow-y-auto  bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Investments for {{ selectedBankName }}
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">
                                    Total Active: {{ selectedBankInvestments.filter((i: any) => i.status === 'ACTIVE').length }}
                                </p>
                            </div>
                            <button @click="showInvestmentsModal = false" class="text-gray-400 hover:text-gray-500">
                                <span class="sr-only">Close</span>
                                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div class="mt-4">
                            <InvestmentsTable 
                                :investments="selectedBankInvestments"
                                :target-date="new Date()"
                            />
                            <div v-if="selectedBankInvestments.length === 0" class="text-center py-8 text-gray-500">
                                No investments found for this bank.
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" @click="showInvestmentsModal = false" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
