<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import InvestmentsTable from '../../components/InvestmentsTable.vue'
import FilterPanel from '../../components/FilterPanel.vue'
import BankFormModal from '../../components/BankFormModal.vue'
import { mockService } from '../../services/mockData'

const loading = ref(true)
const investments = ref<any[]>([])
const banks = ref<any[]>([])
const targetDate = ref(new Date())

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')

// Modal
const showModal = ref(false)
const showBankModal = ref(false)
const showTerminateModal = ref(false)
const isSubmitting = ref(false)
const investmentToTerminate = ref<string | null>(null)

const handleBankSaved = async (newBank: any) => {
    // Refresh bank list
    banks.value = await mockService.getBanks()
    // Auto-select the new bank
    newInvestment.value.bankId = newBank.id
}
const newInvestment = ref({
    bankId: '',
    principal: '',
    dailyRate: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD')
})

onMounted(async () => {
    await fetchData()
})

const fetchData = async () => {
    try {
        const [invData, bankData] = await Promise.all([
            mockService.getInvestments(),
            mockService.getBanks()
        ])
        investments.value = invData
        banks.value = bankData
    } finally {
        loading.value = false
    }
}

const getDisplayStatus = (inv: any) => {
    const isMatured = dayjs(inv.maturityDate).isBefore(dayjs(), 'day')
    if (inv.status === 'ACTIVE' && isMatured) return 'MATURED'
    return inv.status
}

const filteredInvestments = computed(() => {
    return investments.value.filter(inv => {
        const matchBank = !selectedBankId.value || inv.bankId === selectedBankId.value
        const matchStatus = !selectedStatus.value || getDisplayStatus(inv) === selectedStatus.value
        return matchBank && matchStatus
    })
})

const clearFilters = () => {
    selectedBankId.value = ''
    selectedStatus.value = ''
}

const handleAddInvestment = async () => {
    if (!newInvestment.value.bankId || !newInvestment.value.principal) return
    
    isSubmitting.value = true
    try {
        const bank = banks.value.find(b => b.id === newInvestment.value.bankId)
        await mockService.addInvestment({
            ...newInvestment.value,
            bank,
            startDate: new Date(newInvestment.value.startDate),
            maturityDate: new Date(newInvestment.value.maturityDate)
        })
        await fetchData()
        showModal.value = false
        // Reset form
        newInvestment.value = {
            bankId: '',
            principal: '',
            dailyRate: '',
            startDate: dayjs().format('YYYY-MM-DD'),
            maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD')
        }
    } finally {
        isSubmitting.value = false
    }
}

const handleTerminate = (id: string) => {
    investmentToTerminate.value = id
    showTerminateModal.value = true
}

const confirmTerminate = async () => {
    if (!investmentToTerminate.value) return
    
    isSubmitting.value = true
    try {
        await mockService.terminateInvestment(investmentToTerminate.value)
        await fetchData()
        showTerminateModal.value = false
        investmentToTerminate.value = null
    } catch (error) {
        console.error('Failed to terminate investment:', error)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Investments</h1>
                <p class="text-sm text-gray-500">Manage your portfolio entries</p>
            </div>
            <button 
                @click="showModal = true"
                class="btn-primary"
            >
                <PlusIcon class="w-5 h-5" />
                New Investment
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Main List -->
            <div class="lg:col-span-3">
                <div class="card p-0 overflow-hidden">
                    <InvestmentsTable 
                        :investments="filteredInvestments"
                        :target-date="targetDate"
                        @terminate="handleTerminate"
                    />
                </div>
            </div>

            <!-- Filters -->
            <div class="lg:col-span-1">
                <FilterPanel 
                    :banks="banks"
                    v-model:selected-bank-id="selectedBankId"
                    v-model:selected-status="selectedStatus"
                    @clear="clearFilters"
                />
            </div>
        </div>

        <!-- Add Modal -->
        <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 text-gray" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">New Investment</h3>
                            <button @click="showModal = false" class="text-gray-400 hover:text-gray-500">
                                <XMarkIcon class="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form @submit.prevent="handleAddInvestment" class="space-y-4">
                            <div class="text-gray-700">
                                <label class="block text-sm font-medium text-gray-700">Bank</label>
                                <div class="flex gap-2">
                                    <select v-model="newInvestment.bankId" required class="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border">
                                        <option value="" disabled>Select Bank</option>
                                        <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                                    </select>
                                    <button type="button" @click="showBankModal = true" class="mt-1 inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" title="Add New Bank">
                                        <PlusIcon class="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">Principal Amount</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">₦</span>
                                    </div>
                                    <input type="number" v-model="newInvestment.principal" required class="focus:ring-primary-500 text-gray-700 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">Daily Interest Rate</label>
                                <input type="number" step="0.00001" v-model="newInvestment.dailyRate" required class="mt-1 text-gray-700 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00045">
                                <p class="mt-1 text-xs text-gray-500">e.g. 0.00045 for ~16.4% APY</p>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input type="date" v-model="newInvestment.startDate" required class="mt-1  text-gray-700 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Maturity Date</label>
                                    <input type="date" v-model="newInvestment.maturityDate" required class="mt-1 text-gray-700 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border">
                                </div>
                            </div>
                            
                            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50">
                                    {{ isSubmitting ? 'Adding...' : 'Add Investment' }}
                                </button>
                                <button type="button" @click="showModal = false" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bank Creation Modal (Nested) -->
        <BankFormModal 
            :is-open="showBankModal"
            @close="showBankModal = false"
            @saved="handleBankSaved"
        />

        <!-- Terminate Confirmation Modal -->
        <div v-if="showTerminateModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Terminate Investment
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Are you sure you want to terminate this investment? This action will change the status to TERMINATED and cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="button" 
                            @click="confirmTerminate" 
                            :disabled="isSubmitting"
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {{ isSubmitting ? 'Terminating...' : 'Terminate' }}
                        </button>
                        <button 
                            type="button" 
                            @click="showTerminateModal = false" 
                            :disabled="isSubmitting"
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
