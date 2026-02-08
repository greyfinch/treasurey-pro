<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon, XMarkIcon, CalendarIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import InvestmentsTable from '../../components/InvestmentsTable.vue'
import FilterPanel from '../../components/FilterPanel.vue'
import BankFormModal from '../../components/BankFormModal.vue'
import TreasuryBillsTable from '../../components/Investments/TreasuryBillsTable.vue'
import TreasuryBillForm from '../../components/Investments/TreasuryBillForm.vue'
import { 
    mockService, 
    ORGANISATIONS, 
    TreasuryBillStatus 
} from '../../services/mockData'
import type { TreasuryBill } from '../../services/mockData'
import { formatCurrency } from '../../utils/dateHelpers'
import { calculatePortfolioROI } from '../../utils/roi'
import { organisationService } from '../../services/organisationService'
import { usePermissions } from '../../composables/usePermissions'

const route = useRoute()
const router = useRouter()
const { activeOrganisation } = organisationService
const { user, canDo, isGroupScope } = usePermissions()

const loading = ref(true)
const investments = ref<any[]>([])
const treasuryBills = ref<TreasuryBill[]>([])
const banks = ref<any[]>([])
const bankBalances = ref<any[]>([])
const targetDate = ref(new Date())

// Navigation
const activeTab = ref<'deposits' | 'tbills'>('deposits')

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const selectedCurrency = ref('')
const maturityDateStart = ref(route.query.maturityStart as string || '')
const maturityDateEnd = ref(route.query.maturityEnd as string || '')
const currencies = ref<any[]>([])
const liquidDays = ref(7)
const taxSettings = ref({ whtRate: 0 })

watch(() => route.query.maturityStart, (newVal) => {
    maturityDateStart.value = newVal as string || ''
})
watch(() => route.query.maturityEnd, (newVal) => {
    maturityDateEnd.value = newVal as string || ''
})


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

// Restricted lists based on subsidiary bank accounts
const availableBanks = computed(() => {
    const orgId = newInvestment.value.organisationId
    
    // If no org selected, or org is GROUP (and no subsidiary selected), show all banks
    // In a real app, GROUP might also have restrictions, but for now we focus on subsidiaries
    if (!orgId) return banks.value
    
    const org = ORGANISATIONS.find(o => o.id === orgId)
    if (!org || org.type === 'GROUP') return banks.value
    
    // For subsidiaries, only show banks they have accounts with
    const accountBankIds = new Set(bankBalances.value.filter(b => b.organisationId === orgId).map(b => b.bankId))
    return banks.value.filter(b => accountBankIds.has(b.id))
})

const availableCurrencies = computed(() => {
    const orgId = newInvestment.value.organisationId
    const bankId = newInvestment.value.bankId
    
    // If unrestricted, show all currencies
    if (!orgId || !bankId) return currencies.value
    
    const org = ORGANISATIONS.find(o => o.id === orgId)
    if (!org || org.type === 'GROUP') return currencies.value
    
    // Filter currencies based on available accounts for this bank
    const accountCurrencies = new Set(
        bankBalances.value
            .filter(b => b.organisationId === orgId && b.bankId === bankId)
            .map(b => b.currency)
    )
    
    return currencies.value.filter(c => accountCurrencies.has(c.code))
})

const newInvestment = ref({
    organisationId: '',
    bankId: '',
    principal: '',
    currency: 'NGN' as any,
    dailyRate: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    type: 'BANK_DEPOSIT' as 'BANK_DEPOSIT' | 'TREASURY_BILL' // Default
})

const newTreasuryBill = ref<Partial<TreasuryBill>>({
    currency: 'NGN',
    status: TreasuryBillStatus.PENDING_APPROVAL
})


// Initialize organisationId when modal opens
watch(showModal, async (val: boolean) => {
    if (val) {
        // Reset form if opening
        if (!newInvestment.value.organisationId && activeOrganisation.value && activeOrganisation.value.type === 'SUBSIDIARY') {
            newInvestment.value.organisationId = activeOrganisation.value.id
        }
        
        // Fetch bank balances if not already loaded or stale
        if (activeOrganisation.value) {
           const orgId = activeOrganisation.value.type === 'GROUP' ? null : activeOrganisation.value.id
           if (orgId) {
               bankBalances.value = await mockService.getBankBalancesByOrganisationId(orgId)
           }
        }
        
        // Set type based on active tab
        newInvestment.value.type = (activeTab.value === 'tbills' ? 'TREASURY_BILL' : 'BANK_DEPOSIT') as 'BANK_DEPOSIT' | 'TREASURY_BILL'
    }
})

// Watch for organisation selection change in form to fetch specific balances
watch(() => newInvestment.value.organisationId, async (newOrgId) => {
    if (!newOrgId) return
    
    const org = ORGANISATIONS.find(o => o.id === newOrgId)
    if (org && org.type === 'SUBSIDIARY') {
        bankBalances.value = await mockService.getBankBalancesByOrganisationId(newOrgId)
        
        // Clear bank/currency if they are no longer valid
        if (newInvestment.value.bankId) {
             const hasAccount = bankBalances.value.some(b => b.organisationId === newOrgId && b.bankId === newInvestment.value.bankId)
             if (!hasAccount) newInvestment.value.bankId = ''
        }
    }
})

// Watch for bank selection to validate currency
watch(() => newInvestment.value.bankId, (newBankId) => {
    if (!newBankId) return
    const orgId = newInvestment.value.organisationId
    
    if (orgId) {
         const org = ORGANISATIONS.find(o => o.id === orgId)
         if (org && org.type === 'SUBSIDIARY') {
             const hasCurrency = bankBalances.value.some(b => 
                 b.organisationId === orgId && 
                 b.bankId === newBankId && 
                 b.currency === newInvestment.value.currency
             )
             
             // If current currency is not valid for this bank, reset or default
             if (!hasCurrency) {
                 const available = availableCurrencies.value
                 if (available.length > 0) {
                     newInvestment.value.currency = available[0].code
                 } else {
                     newInvestment.value.currency = '' as any
                 }
             }
         }
    }
})

onMounted(async () => {
    await fetchData()
})

const fetchData = async () => {
    try {
        const [invData, bankData, currData, taxData, tbillData] = await Promise.all([
            mockService.getInvestments(),
            mockService.getBanks(),
            mockService.getCurrencies(),
            mockService.getTaxSettings(),
            mockService.getTreasuryBills()
        ])
        investments.value = invData
        banks.value = bankData
        currencies.value = currData
        taxSettings.value = taxData
        treasuryBills.value = tbillData
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
    const targetData = activeTab.value === 'tbills' ? treasuryBills.value : investments.value

    if (!isGroupScope.value) {
        return targetData.filter(inv => inv.organisationId === user.organisationId)
    }

    if (!activeOrganisation.value) return []
    if (activeOrganisation.value.type === 'GROUP') return targetData
    return targetData.filter(inv => inv.organisationId === activeOrganisation.value?.id)
})

const currentTypeInvestments = computed(() => {
    return scopedInvestments.value.filter(inv => {
        if (activeTab.value === 'deposits') return !inv.type || inv.type === 'BANK_DEPOSIT'
        // For tbills tab, scopedInvestments is already the treasuryBills array, so we just return it
        // But we should ensure we aren't mixing types if treasuryBills array somehow got pollution (unlikely)
        if (activeTab.value === 'tbills') return true 
        return true
    })
})

const filteredInvestments = computed(() => {
    return scopedInvestments.value.filter(inv => {
        // Type filter is implicit by the data source switch in scopedInvestments
        if (activeTab.value === 'deposits' && (inv.type && inv.type !== 'BANK_DEPOSIT')) return false

        const matchBank = !selectedBankId.value || (inv.bankId === selectedBankId.value || (inv as any).counterpartyId === selectedBankId.value)
        const matchStatus = !selectedStatus.value || getDisplayStatus(inv) === selectedStatus.value
        const matchCurrency = !selectedCurrency.value || inv.currency === selectedCurrency.value
        
        const invMaturity = dayjs(inv.maturityDate)
        const matchMaturityStart = !maturityDateStart.value || invMaturity.isAfter(dayjs(maturityDateStart.value).subtract(1, 'day'), 'day')
        const matchMaturityEnd = !maturityDateEnd.value || invMaturity.isBefore(dayjs(maturityDateEnd.value).add(1, 'day'), 'day')
        
        return matchBank && matchStatus && matchCurrency && matchMaturityStart && matchMaturityEnd
    })
})


const totalPrincipal = computed(() => {
    return currentTypeInvestments.value.reduce((sum, inv) => {
        if (activeTab.value === 'tbills') {
            const tbill = inv as TreasuryBill
            return sum + (Number(tbill.purchasePrice) || 0)
        }
        return sum + (Number(inv.principal) || 0)
    }, 0)
})

const totalAccruedROI = computed(() => {
    const investmentsToCalc = currentTypeInvestments.value.map(inv => {
        if (activeTab.value === 'tbills') {
            const tbill = inv as TreasuryBill
            const principal = Number(tbill.purchasePrice)
            const faceValue = Number(tbill.faceValue)
            const interest = faceValue - principal
            const tenor = tbill.tenorDays || 91
            // derived daily rate
            const dailyRate = principal ? (interest / principal) / tenor : 0

            return {
                ...tbill,
                principal,
                dailyRate,
                startDate: tbill.tradeDate,
                maturityDate: tbill.maturityDate,
                status: tbill.status === 'ACTIVE' ? 'ACTIVE' : 'MATURED', // align status
                currency: tbill.currency
            }
        }
        return inv
    })
    return calculatePortfolioROI(investmentsToCalc, targetDate.value, 'NGN', [], 0).toNumber()
})

const totalNetROI = computed(() => {
    // Re-use logic for consistency, just add tax
    const investmentsToCalc = currentTypeInvestments.value.map(inv => {
        if (activeTab.value === 'tbills') {
            const tbill = inv as TreasuryBill
            const principal = Number(tbill.purchasePrice)
            const faceValue = Number(tbill.faceValue)
            const interest = faceValue - principal
            const tenor = tbill.tenorDays || 91
            const dailyRate = principal ? (interest / principal) / tenor : 0

            return {
                ...tbill,
                principal,
                dailyRate,
                startDate: tbill.tradeDate,
                maturityDate: tbill.maturityDate,
                status: tbill.status === 'ACTIVE' ? 'ACTIVE' : 'MATURED',
                currency: tbill.currency
            }
        }
        return inv
    })
    return calculatePortfolioROI(investmentsToCalc, targetDate.value, 'NGN', [], taxSettings.value.whtRate).toNumber()
})


const cashLockInMetrics = computed(() => {
    const totalPrincipalValue = currentTypeInvestments.value.reduce((sum, inv) => sum + (Number(inv.principal) || 0), 0)
    const today = dayjs()
    const daysAhead = Math.max(1, Number(liquidDays.value) || 1)
    const nextWeekStart = today.add(1, 'day').startOf('day')
    const nextWeekEnd = today.add(daysAhead, 'day').endOf('day')

    const lockedPrincipal = currentTypeInvestments.value.reduce((sum, inv) => {
        const isLocked = inv.status === 'ACTIVE' && dayjs(inv.maturityDate).isAfter(today, 'day')
        return sum + (isLocked ? Number(inv.principal) || 0 : 0)
    }, 0)

    const liquidNextWeek = currentTypeInvestments.value.reduce(
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
    selectedCurrency.value = ''
    maturityDateStart.value = ''
    maturityDateEnd.value = ''
    router.replace({ query: { ...route.query, maturityStart: undefined, maturityEnd: undefined, maturityDate: undefined } })
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
        showModal.value = false
        // Reset form
        newInvestment.value = {
            organisationId: activeOrganisation.value?.type === 'SUBSIDIARY' ? activeOrganisation.value.id : '',
            bankId: '',
            principal: '',
            currency: 'NGN' as any,
            dailyRate: '',
            startDate: dayjs().format('YYYY-MM-DD'),
            maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
            type: (activeTab.value === 'tbills' ? 'TREASURY_BILL' : 'BANK_DEPOSIT') as 'BANK_DEPOSIT' | 'TREASURY_BILL'
        }



    } finally {
        isSubmitting.value = false
    }
}

const handleCreateTBill = async (data: any) => {
    isSubmitting.value = true
    try {
        await mockService.createTreasuryBill(data)
        await fetchData()
        showModal.value = false
        // Reset form
        newTreasuryBill.value = {
            currency: 'NGN',
            status: TreasuryBillStatus.PENDING_APPROVAL,
            organisationId: newInvestment.value.organisationId
        }
    } catch (error) {
        console.error('Failed to create T-Bill:', error)
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
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Investments</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Manage your portfolio entries</p>
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

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Sidebar -->
            <div class="lg:col-span-2 space-y-2">
                 <button 
                    @click="activeTab = 'deposits'"
                    :class="[
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                        activeTab === 'deposits' 
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                 >
                    <BanknotesIcon class="w-5 h-5" />
                    Bank Deposits
                 </button>
                 <button 
                    @click="activeTab = 'tbills'"
                    :class="[
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                        activeTab === 'tbills' 
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                 >
                    <DocumentTextIcon class="w-5 h-5" />
                    Treasury Bills
                 </button>
            </div>

            <div class="lg:col-span-10 space-y-6">
                <!-- Active Filter Banner -->
            <transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-4"
            >
                <div v-if="maturityDateStart || maturityDateEnd" class="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-4 flex items-center justify-between shadow-sm transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                            <CalendarIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p class="text-sm font-bold text-primary-900 dark:text-primary-100">Filtering by Maturity Date Range</p>
                            <p class="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                <span v-if="maturityDateStart && maturityDateEnd">
                                    From {{ dayjs(maturityDateStart).format('MMM D, YYYY') }} to {{ dayjs(maturityDateEnd).format('MMM D, YYYY') }}
                                </span>
                                <span v-else-if="maturityDateStart">
                                    From {{ dayjs(maturityDateStart).format('MMM D, YYYY') }} onwards
                                </span>
                                <span v-else-if="maturityDateEnd">
                                    Until {{ dayjs(maturityDateEnd).format('MMM D, YYYY') }}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button 
                        @click="clearFilters"
                        class="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors group"
                        title="Clear filter"
                    >
                        <XMarkIcon class="w-5 h-5 text-primary-400 dark:text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-300" />
                    </button>
                </div>
            </transition>

            <!-- Portfolio Totals (Hidden for restricted roles) -->
            <div v-if="canDo('roi:view')" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Principal</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {{ formatCurrency(totalPrincipal) }}
                    </p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Across all investments</p>
                </div>
                <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Accrued ROI (Gross)</p>
                    <p class="text-2xl font-bold text-gray-700 dark:text-gray-200 mt-2">
                        {{ formatCurrency(totalAccruedROI) }}
                    </p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Total earned before tax</p>
                </div>
                <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net ROI (After Tax)</p>
                    <p class="text-2xl font-bold text-money-600 dark:text-money-400 mt-2">
                        {{ formatCurrency(totalNetROI) }}
                    </p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Realised after {{ taxSettings.whtRate }}% WHT</p>
                </div>
            </div>
            <!-- Cash Lock-in (Hidden for restricted roles) -->
            <div v-if="canDo('liquidity:view')" class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Cash Lock-in</h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Liquidity outlook based on maturity dates</p>
                    </div>
                    <span class="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Today & Next {{ cashLockInMetrics.daysAhead }} Days</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="rounded-lg border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/50 transition-colors">
                        <p class="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Locked today</p>
                        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {{ cashLockInMetrics.lockedPercent.toFixed(1) }}%
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {{ formatCurrency(cashLockInMetrics.lockedPrincipal) }} of {{ formatCurrency(cashLockInMetrics.totalPrincipal) }}
                        </p>
                    </div>
                    <div class="rounded-lg border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/50 transition-colors">
                        <div class="flex items-center justify-between gap-3">
                            <p class="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Becomes liquid in</p>
                            <div class="flex items-center gap-2">
                                <input
                                    v-model.number="liquidDays"
                                    type="number"
                                    min="1"
                                    class="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1 text-xs text-gray-900 dark:text-gray-300 transition-colors"
                                >
                                <span class="text-[11px] text-gray-400 dark:text-gray-500">days</span>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                            {{ formatCurrency(cashLockInMetrics.liquidNextWeekAmount) }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {{ cashLockInMetrics.liquidPercent.toFixed(1) }}% of portfolio • {{ cashLockInMetrics.liquidNextWeekCount }} investments
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'tbills'" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <TreasuryBillsTable :investments="filteredInvestments" />
            </div>

            <div v-if="activeTab === 'deposits'" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- Main List -->
                <div class="lg:col-span-3 space-y-4">
                     <!-- Table -->
                    <div class="card p-0 overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                        <InvestmentsTable 
                            :investments="filteredInvestments"
                            :target-date="targetDate"
                            :wht-rate="taxSettings.whtRate"
                            @terminate="handleTerminate"
                        />
                    </div>
                </div>
    
                <!-- Filters -->
                <div class="lg:col-span-1">
                    <FilterPanel 
                        :banks="banks"
                        :currencies="currencies"
                        v-model:selected-bank-id="selectedBankId"
                        v-model:selected-status="selectedStatus"
                        v-model:selected-currency="selectedCurrency"
                        v-model:maturity-date-start="maturityDateStart"
                        v-model:maturity-date-end="maturityDateEnd"
                        @clear="clearFilters"
                    />
                </div>

            </div>
        </div>

        </div>
    </div>

    <!-- Add Modal -->
        <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-950/90 transition-colors" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border dark:border-gray-700">
                    <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {{ activeTab === 'tbills' ? 'New Treasury Bill' : 'New Investment' }}
                            </h3>
                            <button @click="showModal = false" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                                <XMarkIcon class="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div v-if="activeTab === 'tbills'">
                             <TreasuryBillForm
                                v-model="newTreasuryBill"
                                :is-submitting="isSubmitting"
                                @submit="handleCreateTBill"
                                @cancel="showModal = false"
                             />
                        </div>
                        <form v-else @submit.prevent="handleAddInvestment" class="space-y-4">
                            <div v-if="activeOrganisation?.type === 'GROUP'">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Subsidiary</label>
                                <select v-model="newInvestment.organisationId" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors">
                                    <option value="" disabled>Select Subsidiary</option>
                                    <option v-for="org in ORGANISATIONS.filter(o => o.type === 'SUBSIDIARY')" :key="org.id" :value="org.id">{{ org.name }}</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank</label>
                                <div class="flex gap-2">
                                    <select v-model="newInvestment.bankId" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors">
                                        <option value="" disabled>Select Bank</option>
                                        <option v-for="bank in availableBanks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                                    </select>
                                    <button 
                                        v-if="canDo('bank:create')"
                                        type="button" 
                                        @click="showBankModal = true" 
                                        class="mt-1 inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors" 
                                        title="Add New Bank"
                                    >
                                        <PlusIcon class="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                <select v-model="newInvestment.currency" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors">
                                    <option v-for="currency in availableCurrencies" :key="currency.code" :value="currency.code">
                                        {{ currency.code }} - {{ currency.name }}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Principal Amount</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 dark:text-gray-400 sm:text-sm">{{ newInvestment.currency === 'NGN' ? '₦' : '$' }}</span>
                                    </div>
                                    <input type="number" v-model="newInvestment.principal" required class="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors" placeholder="0.00">
                                </div>
                            </div>


                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Daily Interest Rate</label>
                                <input type="number" step="0.00001" v-model="newInvestment.dailyRate" required class="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors" placeholder="0.00045">
                                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">e.g. 0.00045 for ~16.4% APY</p>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input type="date" v-model="newInvestment.startDate" required class="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors [color-scheme:light] dark:[color-scheme:dark]">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Maturity Date</label>
                                    <input type="date" v-model="newInvestment.maturityDate" required class="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors [color-scheme:light] dark:[color-scheme:dark]">
                                </div>
                            </div>
                            
                            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 transition-colors">
                                    {{ isSubmitting ? 'Adding...' : 'Add Investment' }}
                                </button>
                                <button type="button" @click="showModal = false" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors">
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
        ></BankFormModal>

        <!-- Terminate Confirmation Modal -->
        <div v-if="showTerminateModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-950/90 transition-colors" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border dark:border-gray-700">
                    <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                    Terminate Investment
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Are you sure you want to terminate this investment? This action will change the status to TERMINATED and cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t dark:border-gray-700 transition-colors">
                        <button 
                            type="button" 
                            @click="confirmTerminate" 
                            :disabled="isSubmitting"
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                        >
                            {{ isSubmitting ? 'Terminating...' : 'Terminate' }}
                        </button>
                        <button 
                            type="button" 
                            @click="showTerminateModal = false" 
                            :disabled="isSubmitting"
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

    </div>
</template>
