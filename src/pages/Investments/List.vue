<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import InvestmentsTable from '../../components/InvestmentsTable.vue'
import FilterPanel from '../../components/FilterPanel.vue'
import BankFormModal from '../../components/BankFormModal.vue'
import { mockService, ORGANISATIONS } from '../../services/mockData'
import { formatCurrency } from '../../utils/dateHelpers'
import { calculatePortfolioROI } from '../../utils/roi'
import { organisationService } from '../../services/organisationService'
import { usePermissions } from '../../composables/usePermissions'

const { activeOrganisation } = organisationService
const { user, canDo, isGroupScope } = usePermissions()

const loading = ref(true)
const investments = ref<any[]>([])
const banks = ref<any[]>([])
const targetDate = ref(new Date())

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const liquidDays = ref(7)

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
    organisationId: '',
    bankId: '',
    principal: '',
    currency: 'NGN' as any,
    dailyRate: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD')
})


// Initialize organisationId when modal opens
watch(showModal, (val: boolean) => {
    if (val && activeOrganisation.value && activeOrganisation.value.type === 'SUBSIDIARY') {
        newInvestment.value.organisationId = activeOrganisation.value.id
    }
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

// Scoped Investments based on active organisation
const scopedInvestments = computed(() => {
    // SECURITY: If user is NOT group-scoped, they ONLY see their own organisation
    if (!isGroupScope.value) {
        return investments.value.filter(inv => inv.organisationId === user.organisationId)
    }

    if (!activeOrganisation.value) return []
    if (activeOrganisation.value.type === 'GROUP') return investments.value
    return investments.value.filter(inv => inv.organisationId === activeOrganisation.value?.id)
})

const filteredInvestments = computed(() => {
    return scopedInvestments.value.filter(inv => {
        const matchBank = !selectedBankId.value || inv.bankId === selectedBankId.value
        const matchStatus = !selectedStatus.value || getDisplayStatus(inv) === selectedStatus.value
        return matchBank && matchStatus
    })
})

const totalPrincipal = computed(() => {
    return scopedInvestments.value.reduce((sum, inv) => sum + (Number(inv.principal) || 0), 0)
})

const totalAccruedROI = computed(() => {
    return calculatePortfolioROI(scopedInvestments.value, targetDate.value, 'NGN', []).toNumber()
})


const cashLockInMetrics = computed(() => {
    const totalPrincipalValue = scopedInvestments.value.reduce((sum, inv) => sum + (Number(inv.principal) || 0), 0)
    const today = dayjs()
    const daysAhead = Math.max(1, Number(liquidDays.value) || 1)
    const nextWeekStart = today.add(1, 'day').startOf('day')
    const nextWeekEnd = today.add(daysAhead, 'day').endOf('day')

    const lockedPrincipal = scopedInvestments.value.reduce((sum, inv) => {
        const isLocked = inv.status === 'ACTIVE' && dayjs(inv.maturityDate).isAfter(today, 'day')
        return sum + (isLocked ? Number(inv.principal) || 0 : 0)
    }, 0)

    const liquidNextWeek = scopedInvestments.value.reduce(
        (acc: { amount: number; count: number }, inv) => {
            const maturity = dayjs(inv.maturityDate)
            const isLiquidNextWeek = inv.status === 'ACTIVE' && maturity.isAfter(nextWeekStart) && maturity.isBefore(nextWeekEnd)
            if (isLiquidNextWeek) {
                acc.amount += Number(inv.principal) || 0
                acc.count += 1
            }
            return acc
        },
        { amount: 0, count: 0 }
    )

    const lockedPercent = totalPrincipalValue ? (lockedPrincipal / totalPrincipalValue) * 100 : 0
    const liquidPercent = totalPrincipalValue ? (liquidNextWeek.amount / totalPrincipalValue) * 100 : 0

    return {
        totalPrincipal: totalPrincipalValue,
        lockedPrincipal,
        lockedPercent,
        liquidNextWeekAmount: liquidNextWeek.amount,
        liquidNextWeekCount: liquidNextWeek.count,
        liquidPercent,
        daysAhead
    }
})

const clearFilters = () => {
    selectedBankId.value = ''
    selectedStatus.value = ''
}

const handleAddInvestment = async () => {
    // SECURITY: Force organisationId for subsidiary users
    if (!isGroupScope.value) {
        newInvestment.value.organisationId = user.organisationId
    }

    if (!newInvestment.value.organisationId || !newInvestment.value.bankId || !newInvestment.value.principal) return
    
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
            organisationId: activeOrganisation.value?.type === 'SUBSIDIARY' ? activeOrganisation.value.id : '',
            bankId: '',
            principal: '',
            currency: 'NGN' as any,
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
                v-if="canDo('investment:create')"
                @click="showModal = true"
                class="btn-primary"
            >
                <PlusIcon class="w-5 h-5" />
                New Investment
            </button>
        </div>

        <div class="grid grid-cols-1 gap-6">
            <!-- Portfolio Totals (Hidden for restricted roles) -->
            <div v-if="canDo('roi:view')" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="card">
                    <p class="text-xs text-white uppercase tracking-wide">Total Principal</p>
                    <p class="text-2xl font-bold text-gray-100 mt-2">
                        {{ formatCurrency(totalPrincipal) }}
                    </p>
                    <p class="text-[10px] text-gray-400 mt-1">Across all investments</p>
                </div>
                <div class="card">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Total Accrued ROI</p>
                    <p class="text-2xl font-bold text-money-600 mt-2">
                        {{ formatCurrency(totalAccruedROI) }}
                    </p>
                    <p class="text-[10px] text-gray-400 mt-1">Portfolio to date</p>
                </div>
            </div>
            <!-- Cash Lock-in (Hidden for restricted roles) -->
            <div v-if="canDo('liquidity:view')" class="card">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-lg font-semibold text-white">Cash Lock-in</h2>
                        <p class="text-xs text-gray-100">Liquidity outlook based on maturity dates</p>
                    </div>
                    <span class="text-[10px] uppercase tracking-wider text-gray-400">Today & Next {{ cashLockInMetrics.daysAhead }} Days</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="rounded-lg border border-gray-100 p-4 bg-white">
                        <p class="text-[11px] text-gray-500 uppercase tracking-wide">Locked today</p>
                        <p class="text-2xl font-bold text-indigo-900">
                            {{ cashLockInMetrics.lockedPercent.toFixed(1) }}%
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            {{ formatCurrency(cashLockInMetrics.lockedPrincipal) }} of {{ formatCurrency(cashLockInMetrics.totalPrincipal) }}
                        </p>
                    </div>
                    <div class="rounded-lg border border-gray-100 p-4 bg-white">
                        <div class="flex items-center justify-between gap-3">
                            <p class="text-[11px] text-gray-500 uppercase tracking-wide">Becomes liquid in</p>
                            <div class="flex items-center gap-2">
                                <input
                                    v-model.number="liquidDays"
                                    type="number"
                                    min="1"
                                    class="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700"
                                >
                                <span class="text-[11px] text-gray-500">days</span>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-green-700">
                            {{ formatCurrency(cashLockInMetrics.liquidNextWeekAmount) }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            {{ cashLockInMetrics.liquidPercent.toFixed(1) }}% of portfolio • {{ cashLockInMetrics.liquidNextWeekCount }} investments
                        </p>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- Main List -->
                <div class="lg:col-span-3 space-y-4">
                     <!-- Filters -->
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
                            <div v-if="activeOrganisation?.type === 'GROUP'">
                                <label class="block text-sm font-medium text-gray-700">Subsidiary</label>
                                <select v-model="newInvestment.organisationId" required class="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border">
                                    <option value="" disabled>Select Subsidiary</option>
                                    <option v-for="org in ORGANISATIONS.filter(o => o.type === 'SUBSIDIARY')" :key="org.id" :value="org.id">{{ org.name }}</option>
                                </select>
                            </div>

                            <div class="text-gray-700">
                                <label class="block text-sm font-medium text-gray-700">Bank</label>
                                <div class="flex gap-2">
                                    <select v-model="newInvestment.bankId" required class="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border">
                                        <option value="" disabled>Select Bank</option>
                                        <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                                    </select>
                                    <button 
                                        v-if="canDo('bank:create')"
                                        type="button" 
                                        @click="showBankModal = true" 
                                        class="mt-1 inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" 
                                        title="Add New Bank"
                                    >
                                        <PlusIcon class="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">Currency</label>
                                <select v-model="newInvestment.currency" required class="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border">
                                    <option value="NGN">NGN - Nigerian Naira</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">Principal Amount</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">{{ newInvestment.currency === 'NGN' ? '₦' : '$' }}</span>
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
