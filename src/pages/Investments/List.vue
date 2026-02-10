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
import CommercialPaperTable from '../../components/Investments/CommercialPaperTable.vue'
import CommercialPaperForm from '../../components/Investments/CommercialPaperForm.vue'
import BondsTable from '../../components/Investments/BondsTable.vue'
import BondForm from '../../components/Investments/BondForm.vue'
import { 
    mockService, 
    ORGANISATIONS, 
    TreasuryBillStatus, 
    CommercialPaperStatus,
    type Bond,
    type MoneyMarketFund
} from '../../services/mockData'
import type { TreasuryBill, CommercialPaper } from '../../services/mockData'
import MMFTable from '../../components/Investments/MMFTable.vue'
import MMFForm from '../../components/Investments/MMFForm.vue'

import { formatCurrency } from '../../utils/dateHelpers'
import { calculatePortfolioROI, getEffectiveFXRate } from '../../utils/roi'
import { organisationService } from '../../services/organisationService'
import { usePermissions } from '../../composables/usePermissions'

const route = useRoute()
const router = useRouter()
const { activeOrganisation } = organisationService
const { user, canDo, isGroupScope } = usePermissions()

const loading = ref(true)
const investments = ref<any[]>([])
const fxRates = ref<any[]>([])
const treasuryBills = ref<TreasuryBill[]>([])
const commercialPapers = ref<CommercialPaper[]>([])
const bonds = ref<Bond[]>([])
const mmfs = ref<MoneyMarketFund[]>([])

const banks = ref<any[]>([])
const bankBalances = ref<any[]>([])
const targetDate = ref(new Date())

// Navigation
const activeTab = ref<'deposits' | 'tbills' | 'cp' | 'bonds' | 'mmf'>('deposits')


// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const selectedCurrency = ref('')
const maturityDateStart = ref(route.query.maturityStart as string || '')
const maturityDateEnd = ref(route.query.maturityEnd as string || '')
const currencies = ref<any[]>([])
const liquidDays = ref(7)
const taxSettings = ref({ whtRate: 0 })

// Watch route query
watch(() => route.query.maturityStart, (newVal) => {
    maturityDateStart.value = newVal as string || ''
})
watch(() => route.query.maturityEnd, (newVal) => {
    maturityDateEnd.value = newVal as string || ''
})

// Modal State
const showModal = ref(false)
const showBankModal = ref(false)
const showTerminateModal = ref(false)
const isSubmitting = ref(false)
const investmentToTerminate = ref<string | null>(null)

// --- Forms State ---
const newInvestment = ref({
    organisationId: '',
    bankId: '',
    principal: '',
    currency: 'NGN' as any,
    dailyRate: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    type: 'BANK_DEPOSIT' as 'BANK_DEPOSIT' | 'TREASURY_BILL' | 'COMMERCIAL_PAPER' | 'BOND'
})


const newTreasuryBill = ref<Partial<TreasuryBill>>({
    currency: 'NGN',
    status: TreasuryBillStatus.PENDING_APPROVAL
})

const newCommercialPaper = ref<Partial<CommercialPaper>>({
    currency: 'NGN',
    status: CommercialPaperStatus.PENDING_APPROVAL,
    organisationId: activeOrganisation.value?.id || ''
})

const newBond = ref<Partial<Bond>>({
    currency: 'NGN' as any,
    status: 'PENDING_APPROVAL' as any,
    organisationId: activeOrganisation.value?.id || ''
})

const newMMF = ref({
    fundId: '',
    amount: '',
    organisationId: activeOrganisation.value?.id || ''
})


// --- Logic ---

const handleBankSaved = async (newBank: any) => {
    banks.value = await mockService.getBanks()
    newInvestment.value.bankId = newBank.id
}

const availableBanks = computed(() => {
    const orgId = newInvestment.value.organisationId
    if (!orgId) return banks.value
    const org = ORGANISATIONS.find(o => o.id === orgId)
    if (!org || org.type === 'GROUP') return banks.value
    const accountBankIds = new Set(bankBalances.value.filter(b => b.organisationId === orgId).map(b => b.bankId))
    return banks.value.filter(b => accountBankIds.has(b.id))
})

const availableCurrencies = computed(() => {
    const orgId = newInvestment.value.organisationId
    const bankId = newInvestment.value.bankId
    if (!orgId || !bankId) return currencies.value
    const org = ORGANISATIONS.find(o => o.id === orgId)
    if (!org || org.type === 'GROUP') return currencies.value
    const accountCurrencies = new Set(
        bankBalances.value
            .filter(b => b.organisationId === orgId && b.bankId === bankId)
            .map(b => b.currency)
    )
    return currencies.value.filter(c => accountCurrencies.has(c.code))
})

watch(showModal, async (val: boolean) => {
    if (val) {
        if (!newInvestment.value.organisationId && activeOrganisation.value && activeOrganisation.value.type === 'SUBSIDIARY') {
            newInvestment.value.organisationId = activeOrganisation.value.id
        }
        if (activeOrganisation.value) {
           const orgId = activeOrganisation.value.type === 'GROUP' ? null : activeOrganisation.value.id
           if (orgId) {
               bankBalances.value = await mockService.getBankBalancesByOrganisationId(orgId)
           }
        }
        
        // Set type based on active tab
        if (activeTab.value === 'tbills') {
            newInvestment.value.type = 'TREASURY_BILL'
            newTreasuryBill.value.organisationId = newInvestment.value.organisationId
        } else if (activeTab.value === 'cp') {
            newInvestment.value.type = 'COMMERCIAL_PAPER'
            newCommercialPaper.value.organisationId = newInvestment.value.organisationId
        } else if (activeTab.value === 'bonds') {
            newInvestment.value.type = 'BOND' as any
            newBond.value.organisationId = newInvestment.value.organisationId
        } else {
            newInvestment.value.type = 'BANK_DEPOSIT'
        }

    }
})

watch(() => newInvestment.value.organisationId, async (newOrgId) => {
    if (!newOrgId) return
    const org = ORGANISATIONS.find(o => o.id === newOrgId)
    if (org && org.type === 'SUBSIDIARY') {
        bankBalances.value = await mockService.getBankBalancesByOrganisationId(newOrgId)
        if (newInvestment.value.bankId) {
             const hasAccount = bankBalances.value.some(b => b.organisationId === newOrgId && b.bankId === newInvestment.value.bankId)
             if (!hasAccount) newInvestment.value.bankId = ''
        }
        // Update sub-forms orgId too
        newTreasuryBill.value.organisationId = newOrgId
        newCommercialPaper.value.organisationId = newOrgId
    }
})

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
        const [invData, bankData, currData, taxData, tbillData, cpData, bondData, mmfData, fxData] = await Promise.all([
            mockService.getInvestments(),
            mockService.getBanks(),
            mockService.getCurrencies(),
            mockService.getTaxSettings(),
            mockService.getTreasuryBills(),
            mockService.getCommercialPapers(),
            mockService.getBonds(),
            mockService.getMMFs(),
            mockService.getFXRates()
        ])
        investments.value = invData
        banks.value = bankData
        currencies.value = currData
        taxSettings.value = taxData
        treasuryBills.value = tbillData
        commercialPapers.value = cpData
        bonds.value = bondData
        mmfs.value = mmfData
        fxRates.value = fxData

    } finally {
        loading.value = false
    }
}

const getDisplayStatus = (inv: any) => {
    const isMatured = dayjs(inv.maturityDate).isBefore(dayjs(), 'day')
    if (inv.status === 'ACTIVE' && isMatured) return 'MATURED'
    return inv.status
}

const scopedInvestments = computed(() => {
    let targetData = investments.value
    if (activeTab.value === 'tbills') targetData = treasuryBills.value
    if (activeTab.value === 'cp') targetData = commercialPapers.value
    if (activeTab.value === 'bonds') targetData = bonds.value
    if (activeTab.value === 'mmf') targetData = mmfs.value


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
        return true
    })
})

const filteredInvestments = computed(() => {
    return scopedInvestments.value.filter(inv => {
        // Type filter is mostly implicit by tab, but double check for deposits
        if (activeTab.value === 'deposits' && (inv.type && inv.type !== 'BANK_DEPOSIT')) return false

        const matchBank = !selectedBankId.value || (
            inv.bankId === selectedBankId.value || 
            (inv as any).counterpartyId === selectedBankId.value
        )
        const matchStatus = !selectedStatus.value || getDisplayStatus(inv) === selectedStatus.value
        const matchCurrency = !selectedCurrency.value || inv.currency === selectedCurrency.value
        
        const invMaturity = dayjs(inv.maturityDate)
        const matchMaturityStart = !maturityDateStart.value || invMaturity.isAfter(dayjs(maturityDateStart.value).subtract(1, 'day'), 'day')
        const matchMaturityEnd = !maturityDateEnd.value || invMaturity.isBefore(dayjs(maturityDateEnd.value).add(1, 'day'), 'day')
        
        return matchBank && matchStatus && matchCurrency && matchMaturityStart && matchMaturityEnd
    })
})

const normalizedInvestments = computed(() => {
    return currentTypeInvestments.value.map(inv => {
        if (activeTab.value === 'tbills') {
            const tbill = inv as TreasuryBill
            const principal = Number(tbill.purchasePrice) || 0
            const faceValue = Number(tbill.faceValue) || 0
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
        if (activeTab.value === 'cp') {
            const cp = inv as CommercialPaper
            const principal = Number(cp.purchasePrice) || 0
            const yieldRate = Number(cp.yieldRate) || 0
            const dailyRate = yieldRate ? (yieldRate / 365 / 100) : 0
            return {
                ...cp,
                principal,
                dailyRate,
                startDate: cp.tradeDate,
                maturityDate: cp.maturityDate,
                status: cp.status === 'ACTIVE' ? 'ACTIVE' : 'MATURED',
                currency: cp.currency
            }
        }
        if (activeTab.value === 'bonds') {
            const bond = inv as Bond
            const principal = Number(bond.purchasePrice) || 0
            const couponRate = Number(bond.couponRate) || 0
            const dailyRate = couponRate ? (couponRate / 365 / 100) : 0
            return {
                ...bond,
                principal,
                dailyRate,
                startDate: bond.settlementDate,
                maturityDate: bond.maturityDate,
                status: bond.status === 'ACTIVE' ? 'ACTIVE' : 'MATURED',
                currency: bond.currency
            }
        }
        if (activeTab.value === 'mmf') {
            const mmf = inv as MoneyMarketFund
            return {
                ...mmf,
                principal: Number(mmf.costBasis) || 0,
                dailyRate: 0 // ROI for MMFs is handled differently in utils/roi.ts
            }
        }
        return {
            ...inv,
            principal: Number(inv.principal) || 0,
            dailyRate: Number(inv.dailyRate) || 0
        }
    })
})

const totalPrincipal = computed(() => {
    const baseCurr = activeOrganisation.value?.baseCurrency || 'NGN'
    const regularInvestments = activeTab.value === 'mmf' ? [] : normalizedInvestments.value
    
    const regularSum = regularInvestments.reduce((sum, inv) => {
        if (inv.currency === baseCurr) return sum + inv.principal
        const rate = getEffectiveFXRate(inv.currency, baseCurr, targetDate.value, fxRates.value)?.rate || 1
        return sum + (inv.principal * rate)
    }, 0)

    const mmfSum = (activeTab.value === 'mmf' ? mmfs.value : []).reduce((sum, mmf) => {
        const principal = mmf.costBasis || (mmf.totalUnits * 1.0)
        if (mmf.currency === baseCurr) return sum + principal
        const rate = getEffectiveFXRate(mmf.currency, baseCurr, targetDate.value, fxRates.value)?.rate || 1
        return sum + (principal * rate)
    }, 0)

    return regularSum + mmfSum
})

const totalAccruedROI = computed(() => {
    const baseCurr = activeOrganisation.value?.baseCurrency || 'NGN'
    const regularInvestments = activeTab.value === 'mmf' ? [] : normalizedInvestments.value
    const mmfInvestments = activeTab.value === 'mmf' ? mmfs.value : []
    return calculatePortfolioROI(regularInvestments, targetDate.value, baseCurr, fxRates.value, 0, mmfInvestments).toNumber()
})

const totalNetROI = computed(() => {
    const baseCurr = activeOrganisation.value?.baseCurrency || 'NGN'
    const regularInvestments = activeTab.value === 'mmf' ? [] : normalizedInvestments.value
    const mmfInvestments = activeTab.value === 'mmf' ? mmfs.value : []
    return calculatePortfolioROI(regularInvestments, targetDate.value, baseCurr, fxRates.value, taxSettings.value.whtRate, mmfInvestments).toNumber()
})

const cashLockInMetrics = computed(() => {
    const totalPrincipalValue = totalPrincipal.value 
    const today = dayjs()
    const daysAhead = Math.max(1, Number(liquidDays.value) || 1)
    const nextWeekStart = today.add(1, 'day').startOf('day')
    const nextWeekEnd = today.add(daysAhead, 'day').endOf('day')

    const lockedPrincipal = normalizedInvestments.value.reduce((sum, inv) => {
        const principal = inv.principal
        const isLocked = inv.status === 'ACTIVE' && dayjs(inv.maturityDate).isAfter(today, 'day')
        return sum + (isLocked ? principal : 0)
    }, 0)

    const liquidNextWeek = normalizedInvestments.value.reduce(
        (acc: { amount: number; count: number }, inv) => {
            const maturity = dayjs(inv.maturityDate)
            const isLiquidNextWeek = inv.status === 'ACTIVE' && maturity.isAfter(nextWeekStart) && maturity.isBefore(nextWeekEnd)
            if (isLiquidNextWeek) {
                acc.amount += inv.principal
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
}

// --- Action Handlers ---

const handleAddInvestment = async () => {
    if (!isGroupScope.value) newInvestment.value.organisationId = user.organisationId
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
            maturityDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
            type: 'BANK_DEPOSIT' 
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

const handleCreateCP = async (data: any) => {
    isSubmitting.value = true
    try {
        await mockService.createCommercialPaper(data)
        await fetchData()
        showModal.value = false
        newCommercialPaper.value = {
            currency: 'NGN',
            status: CommercialPaperStatus.PENDING_APPROVAL,
            organisationId: newInvestment.value.organisationId
        }
    } catch (error) {
        console.error('Failed to create CP:', error)
    } finally {
        isSubmitting.value = false
    }
}

const handleCreateBond = async (data: any) => {
    isSubmitting.value = true
    try {
        await mockService.createBond(data)
        await fetchData()
        showModal.value = false
        newBond.value = {
            currency: 'NGN' as any,
            status: 'PENDING_APPROVAL' as any,
            organisationId: newInvestment.value.organisationId
        }
    } catch (error) {
        console.error('Failed to create Bond:', error)
    } finally {
        isSubmitting.value = false
    }
}
const handleCreateMMF = async (data: any) => {
    isSubmitting.value = true
    try {
        await mockService.subscribeMMF(data.fundId, data.amount)
        await fetchData()
        showModal.value = false
        newMMF.value = {
            fundId: '',
            amount: '',
            organisationId: newInvestment.value.organisationId
        }
    } catch (error) {
        console.error('Failed to subscribe to MMF:', error)
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
                 <button 
                    @click="activeTab = 'cp'"
                    :class="[
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                        activeTab === 'cp' 
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                 >
                    <DocumentTextIcon class="w-5 h-5" />
                    Comm. Papers
                 </button>
                 <button 
                    @click="activeTab = 'bonds'"
                    :class="[
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                        activeTab === 'bonds' 
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                 >
                    <DocumentTextIcon class="w-5 h-5" />
                    Bonds
                 </button>
                 <button 
                    @click="activeTab = 'mmf'"
                    :class="[
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                        activeTab === 'mmf' 
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                 >
                    <BanknotesIcon class="w-5 h-5" />
                    MMFs
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

                <!-- Tables -->
                <div v-if="activeTab === 'tbills'" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">
                    <TreasuryBillsTable :investments="filteredInvestments" />
                </div>

                <div v-else-if="activeTab === 'cp'" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">
                    <CommercialPaperTable :investments="filteredInvestments" />
                </div>

                <div v-else-if="activeTab === 'bonds'" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">
                    <BondsTable :investments="filteredInvestments" />
                </div>

                <div v-else-if="activeTab === 'mmf'" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">
                    <MMFTable :mmfs="filteredInvestments" />
                </div>

                <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

        <!-- Add Modal -->
        <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-950/90 transition-colors" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border dark:border-gray-700">
                    <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {{ activeTab === 'tbills' ? 'New Treasury Bill' : (activeTab === 'cp' ? 'New Commercial Paper' : (activeTab === 'bonds' ? 'New Bond Investment' : (activeTab === 'mmf' ? 'MMF Subscription' : 'New Investment'))) }}
                            </h3>
                            <button @click="showModal = false" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                                <XMarkIcon class="h-6 w-6" />
                            </button>
                        </div>
                        
                        <!-- Conditional Forms -->
                        <div v-if="activeTab === 'tbills'">
                             <TreasuryBillForm
                                v-model="newTreasuryBill"
                                :is-submitting="isSubmitting"
                                @submit="handleCreateTBill"
                                @cancel="showModal = false"
                             />
                        </div>
                        <div v-else-if="activeTab === 'cp'">
                             <CommercialPaperForm
                                v-model="newCommercialPaper"
                                :is-submitting="isSubmitting"
                                @submit="handleCreateCP"
                                @cancel="showModal = false"
                             />
                        </div>
                        <div v-else-if="activeTab === 'bonds'">
                             <BondForm
                                v-model="newBond"
                                :is-submitting="isSubmitting"
                                @submit="handleCreateBond"
                                @cancel="showModal = false"
                             />
                        </div>
                        <div v-else-if="activeTab === 'mmf'">
                             <MMFForm
                                :initial-fund-id="newMMF.fundId"
                                @success="handleCreateMMF"
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
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                            :disabled="isSubmitting"
                            @click="confirmTerminate"
                        >
                            {{ isSubmitting ? 'Terminating...' : 'Terminate' }}
                        </button>
                        <button 
                            type="button" 
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                            @click="showTerminateModal = false"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
