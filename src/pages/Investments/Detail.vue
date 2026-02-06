<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockService, ORGANISATIONS } from '../../services/mockData'
import { calculateDailyROI, calculateInvestmentROI } from '../../utils/roi'
import { formatDate, formatCurrency, formatPercentage } from '../../utils/dateHelpers'
import { ArrowLeftIcon, BanknotesIcon, ArrowPathIcon, XMarkIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import { usePermissions } from '../../composables/usePermissions'

const { user, canDo, isGroupScope } = usePermissions()

const route = useRoute()
const router = useRouter()
const investment = ref<any>(null)
const loading = ref(true)
const fxRates = ref<any[]>([])

// Modals
const showWithdrawModal = ref(false)
const showRolloverModal = ref(false)
const showTerminateModal = ref(false)
const isSubmitting = ref(false)

const withdrawalForm = ref({
    amount: '',
    withdrawalDate: dayjs().format('YYYY-MM-DD'),
    fee: ''
})

const rolloverForm = ref({
    amount: '',
    date: dayjs().format('YYYY-MM-DD')
})
const targetDate = ref(new Date())

// ROI Forecast Simulator
const showSimulator = ref(true)
const simulatorPrincipal = ref('')
const simulatorRate = ref('')
const simulatorDays = ref(60)
const showFullProjection = ref(false)

onMounted(async () => {
    try {
        const id = route.params.id as string
        const [data, rates] = await Promise.all([
            mockService.getInvestmentById(id),
            mockService.getFXRates()
        ])
        
        fxRates.value = rates

        if (data) {
            // SECURITY: Deep Scope Protection
            // If user is NOT group-scoped, they ONLY see their own organisation's investments
            if (!isGroupScope.value && data.organisationId !== user.organisationId) {
                console.warn('Security Block: Unauthorised access to investment in other organisation');
                router.push('/investments')
                return
            }

            investment.value = data
            // Initialize simulator with current investment values
            simulatorPrincipal.value = data.principal
            simulatorRate.value = (parseFloat(data.dailyRate) * 100).toFixed(3) // Convert to percentage
        } else {
            router.push('/')
        }
    } finally {
        loading.value = false
    }
})


const subsidiaryName = computed(() => {
    if (!investment.value) return ''
    const org = ORGANISATIONS.find(o => o.id === investment.value.organisationId)
    return org ? org.name : 'Unknown Subsidiary'
})

const baseCurrency = computed(() => user.organisationId === 'org-holdco' ? 'NGN' : 'NGN') // Mocking base currency

const fxRateUsed = computed(() => {
    if (!investment.value || investment.value.currency === baseCurrency.value) return 1
    return fxRates.value.find(r => r.fromCurrency === investment.value.currency && r.toCurrency === baseCurrency.value)?.rate || 1
})

// Computeds
const accumulatedROI = computed(() => {
    if (!investment.value) return 0
    const result = calculateInvestmentROI({
        principal: investment.value.principal,
        dailyRate: investment.value.dailyRate,
        startDate: investment.value.startDate,
        targetDate: targetDate.value,
        withdrawals: investment.value.withdrawals
    })
    return result.interest.toNumber()
})

const currentPrincipal = computed(() => {
    if (!investment.value) return 0
     const result = calculateInvestmentROI({
        principal: investment.value.principal,
        dailyRate: investment.value.dailyRate,
        startDate: investment.value.startDate,
        targetDate: targetDate.value,
        withdrawals: investment.value.withdrawals
    })
    return result.principal.toNumber()
})

const reportingROI = computed(() => {
    return accumulatedROI.value * fxRateUsed.value
})

const reportingPrincipal = computed(() => {
    return currentPrincipal.value * fxRateUsed.value
})


const dailyBreakdown = computed(() => {
    if (!investment.value) return []
    // Show last 30 days breakdown
    return calculateDailyROI({
        investment: investment.value,
        startDate: dayjs(targetDate.value).subtract(30, 'day').toDate(),
        endDate: targetDate.value
    })
})

// Simulator Computeds
const simulatedResults = computed(() => {
    if (!simulatorPrincipal.value || !simulatorRate.value || !simulatorDays.value) {
        return {
            totalInterest: 0,
            finalBalance: 0,
            effectiveMPY: 0,
            dailyBreakdown: []
        }
    }

    const principal = parseFloat(simulatorPrincipal.value)
    const dailyRate = parseFloat(simulatorRate.value) / 100 // Convert percentage to decimal
    const days = parseInt(simulatorDays.value.toString())

    // Calculate day-by-day projection
    const dailyBreakdown: Array<{ day: number; date: string; principal: number; interest: number; balance: number }> = []
    let runningBalance = principal
    let totalInterest = 0

    for (let i = 1; i <= days; i++) {
        const dayInterest = runningBalance * dailyRate
        totalInterest += dayInterest
        runningBalance += dayInterest
        
        dailyBreakdown.push({
            day: i,
            date: dayjs().add(i, 'day').format('MMM D, YYYY'),
            principal: principal,
            interest: dayInterest,
            balance: runningBalance
        })
    }

    // Calculate effective MPY (monthly percentage yield)
    const effectiveMPY = (Math.pow(1 + dailyRate, 30) - 1) * 100

    return {
        totalInterest,
        finalBalance: runningBalance,
        effectiveMPY,
        dailyBreakdown
    }
})

const comparisonMetrics = computed(() => {
    if (!investment.value || !simulatorRate.value) return null
    
    const currentRate = parseFloat(investment.value.dailyRate) * 100
    const simRate = parseFloat(simulatorRate.value)
    const rateDiff = simRate - currentRate
    const percentDiff = (rateDiff / currentRate) * 100

    return {
        currentRate,
        simRate,
        rateDiff,
        percentDiff,
        isHigher: simRate > currentRate
    }
})

const projectionPreview = computed(() => {
    const breakdown = simulatedResults.value.dailyBreakdown
    return showFullProjection.value ? breakdown : breakdown.slice(0, 7)
})

const displayStatus = computed(() => {
    if (!investment.value) return ''
    const isMatured = dayjs(investment.value.maturityDate).isBefore(dayjs(), 'day')
    if (investment.value.status === 'ACTIVE' && isMatured) return 'MATURED'
    return investment.value.status
})

// Actions
const handleWithdrawal = async () => {
    if (!withdrawalForm.value.amount) return
    isSubmitting.value = true
    try {
        await mockService.addWithdrawal(investment.value.id, {
            amount: withdrawalForm.value.amount,
            withdrawalDate: new Date(withdrawalForm.value.withdrawalDate),
            fee: withdrawalForm.value.fee || 0
        })
        // Refresh data
        const data = await mockService.getInvestmentById(investment.value.id)
        investment.value = data
        showWithdrawModal.value = false
        withdrawalForm.value = { amount: '', withdrawalDate: dayjs().format('YYYY-MM-DD'), fee: '' }
    } finally {
        isSubmitting.value = false
    }
}

const handleRollover = async () => {
    if (!rolloverForm.value.amount) return
    isSubmitting.value = true
    try {
        await mockService.addRollover(investment.value.id, {
            amount: rolloverForm.value.amount,
            date: new Date(rolloverForm.value.date)
        })
        // Refresh data
        const data = await mockService.getInvestmentById(investment.value.id)
        investment.value = data
        showRolloverModal.value = false
        rolloverForm.value = { amount: '', date: dayjs().format('YYYY-MM-DD') }
    } finally {
        isSubmitting.value = false
    }
}

const handleTerminate = async () => {
    if (!investment.value) return
    isSubmitting.value = true
    try {
        await mockService.terminateInvestment(investment.value.id)
        // Refresh data
        const data = await mockService.getInvestmentById(investment.value.id)
        investment.value = data
        showTerminateModal.value = false
    } catch (error) {
        console.error('Failed to terminate investment:', error)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="investment" class="space-y-6">
        <!-- Back Button -->
        <router-link 
            to="/investments"  
            class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            <ArrowLeftIcon class="w-4 h-4" /> Back to Investments
        </router-link>

        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ investment.bank.name }} Investment</h1>
                    <div class="flex items-center gap-2 mt-1">
                        <BuildingOfficeIcon class="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ subsidiaryName }}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                     <button 
                        v-if="investment.status === 'ACTIVE' && canDo('withdrawal:create', { organisationId: investment.organisationId })"
                        @click="showWithdrawModal = true"
                        class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center gap-1"
                    >
                        <BanknotesIcon class="w-4 h-4" />
                        Withdraw
                    </button>
                     <button 
                        v-if="investment.status === 'ACTIVE' && canDo('rollover:create', { organisationId: investment.organisationId })"
                        @click="showRolloverModal = true"
                        class="px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors flex items-center gap-1"
                    >
                        <ArrowPathIcon class="w-4 h-4" />
                        Rollover
                    </button>
                     <button 
                        v-if="investment.status === 'ACTIVE' && canDo('investment:edit', { organisationId: investment.organisationId })"
                        @click="showTerminateModal = true"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg border border-red-700 dark:border-red-600 transition-colors flex items-center gap-1"
                    >
                        <TrashIcon class="w-4 h-4" />
                        Terminate
                    </button>
                     <span :class="[
                        'px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide',
                        displayStatus === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                        displayStatus === 'MATURED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                        displayStatus === 'TERMINATED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    ]">
                        {{ displayStatus }}
                    </span>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Initial Principal</p>
                    <p class="text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(investment.principal, investment.currency) }}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Daily Rate</p>
                    <p class="text-lg font-bold text-gray-900 dark:text-white">{{ formatPercentage(investment.dailyRate) }}</p>
                </div>
                 <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Date</p>
                    <p class="text-lg font-medium text-gray-900 dark:text-white">{{ formatDate(investment.startDate) }}</p>
                </div>
                 <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maturity Date</p>
                    <p class="text-lg font-medium text-gray-900 dark:text-white">{{ formatDate(investment.maturityDate) }}</p>
                </div>
            </div>
            <div v-if="investment.currency !== baseCurrency" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center justify-between transition-colors">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">FX Information:</span>
                    <span class="text-sm text-blue-700 dark:text-blue-300">Reporting in {{ baseCurrency }} at rate {{ fxRateUsed }}</span>
                </div>
                 <span class="text-xs text-blue-500 dark:text-blue-400 italic">Explicit rate for conversion</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- ROI Calculator / Preview -->
            <div class="lg:col-span-2 space-y-6">
                <div class="card bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800 transition-colors">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-primary-900 dark:text-primary-100">ROI Calculator</h3>
                        <input 
                            type="date" 
                            :value="dayjs(targetDate).format('YYYY-MM-DD')"
                            @input="targetDate = new Date(($event.target as HTMLInputElement).value)"
                            class="bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-700 text-primary-900 dark:text-primary-100 rounded-lg text-sm [color-scheme:light] dark:[color-scheme:dark] transition-colors"
                        >
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                            <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1">Total Accrued (Native)</p>
                            <p class="text-2xl font-bold text-money-600 dark:text-money-400">{{ formatCurrency(accumulatedROI, investment.currency) }}</p>
                            <div v-if="investment.currency !== baseCurrency" class="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1">Reporting ({{ baseCurrency }})</p>
                                <p class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(reportingROI, baseCurrency) }}</p>
                            </div>
                        </div>
                         <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                            <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1">Current Balance (Native)</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(currentPrincipal, investment.currency) }}</p>
                            <div v-if="investment.currency !== baseCurrency" class="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1">Reporting ({{ baseCurrency }})</p>
                                <p class="text-lg font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(reportingPrincipal, baseCurrency) }}</p>
                            </div>
                        </div>
                    </div>
                </div>


                <!-- Daily Breakdown Table -->
                <div class="card p-0 overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white">Daily ROI Breakdown (Last 30 Days)</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead class="bg-gray-50 dark:bg-gray-900/30">
                                <tr>
                                    <th class="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Principal</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Accrued ROI</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                <tr v-for="day in dailyBreakdown" :key="day.date" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td class="px-6 py-3 text-gray-900 dark:text-white">{{ dayjs(day.date).format('MMM D, YYYY') }}</td>
                                    <td class="px-6 py-3 text-gray-600 dark:text-gray-400">{{ formatCurrency(day.principal) }}</td>
                                    <td class="px-6 py-3 font-medium text-money-600 dark:text-money-400">{{ formatCurrency(day.roi) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ROI Forecast Simulator -->
                <div v-if="showSimulator" class="card bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border-indigo-200 dark:border-indigo-800 relative overflow-hidden transition-colors">
                    <!-- Premium Badge -->
                    <div class="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                        ⭐ PREMIUM
                    </div>
                    
                    <div class="mb-6">
                        <h3 class="font-bold text-xl sm:text-2xl text-indigo-900 dark:text-indigo-100 mb-2">ROI Forecast Simulator</h3>
                        <p class="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">Run "what-if" scenarios to plan your investment strategy</p>
                    </div>

                    <!-- Input Controls -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label class="block text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Principal Amount</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₦</span>
                                <input 
                                    type="number" 
                                    v-model="simulatorPrincipal"
                                    class="w-full text-gray-900 dark:text-white pl-8 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 transition-all"
                                    placeholder="Enter amount"
                                >
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Daily Interest Rate (%)</label>
                            <input 
                                type="number" 
                                step="0.001"
                                v-model="simulatorRate"
                                class="w-full text-gray-900 dark:text-white px-4 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 transition-all"
                                placeholder="0.045"
                            >
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Duration (Days)</label>
                            <input 
                                type="number" 
                                v-model="simulatorDays"
                                class="w-full text-gray-900 dark:text-white px-4 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 transition-all"
                                placeholder="60"
                            >
                        </div>
                    </div>

                    <!-- Quick Presets -->
                    <div class="flex gap-2 mb-6 flex-wrap">
                        <span class="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-200">Quick Presets:</span>
                        <button @click="simulatorDays = 30" class="px-3 py-1 bg-white dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300 transition-colors">30 Days</button>
                        <button @click="simulatorDays = 60" class="px-3 py-1 bg-white dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300 transition-colors">60 Days</button>
                        <button @click="simulatorDays = 90" class="px-3 py-1 bg-white dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300 transition-colors">90 Days</button>
                        <button 
                            @click="() => { 
                                simulatorPrincipal = investment.principal; 
                                simulatorRate = (parseFloat(investment.dailyRate) * 100).toFixed(3);
                                simulatorDays = 60;
                            }"
                            class="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-full text-xs font-medium transition-colors ml-2"
                        >
                            Reset to Current
                        </button>
                    </div>

                    <!-- Results Display -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900/50 transition-colors">
                            <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Projected Interest</p>
                            <p class="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-500">{{ formatCurrency(simulatedResults.totalInterest) }}</p>
                            <p class="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-2">Over {{ simulatorDays }} days</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900/50 transition-colors">
                            <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Final Balance</p>
                            <p class="text-2xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-100">{{ formatCurrency(simulatedResults.finalBalance) }}</p>
                            <p class="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-2">Principal + Interest</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900/50 transition-colors">
                            <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Effective MPY</p>
                            <p class="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{{ simulatedResults.effectiveMPY.toFixed(2) }}%</p>
                            <p class="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-2">Monthly rate</p>
                        </div>
                    </div>

                    <!-- Comparison Metrics -->
                    <div v-if="comparisonMetrics" class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-6 transition-colors">
                        <div class="flex items-center justify-between">
                            <span class="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                Simulated rate ({{ comparisonMetrics.simRate.toFixed(3) }}%) is 
                                <span :class="comparisonMetrics.isHigher ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'">
                                    {{ comparisonMetrics.isHigher ? 'higher' : 'lower' }}
                                </span>
                                than current ({{ comparisonMetrics.currentRate.toFixed(3) }}%)
                            </span>
                            <span class="text-base sm:text-lg font-bold" :class="comparisonMetrics.isHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                {{ comparisonMetrics.isHigher ? '+' : '' }}{{ comparisonMetrics.percentDiff.toFixed(1) }}%
                            </span>
                        </div>
                    </div>

                    <!-- Daily Projection Preview (First 7 days) -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800 transition-colors">
                        <h4 class="font-semibold text-sm sm:text-base text-indigo-900 dark:text-indigo-100 mb-3">Projection Preview (First 7 Days)</h4>
                        <div class="overflow-x-auto">
                            <table class="min-w-full text-sm">
                                <thead class="border-b border-indigo-100 dark:border-indigo-900/50">
                                    <tr>
                                        <th class="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">Day</th>
                                        <th class="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                                        <th class="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Daily Interest</th>
                                        <th class="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="day in projectionPreview" :key="day.day" class="border-b border-gray-50 dark:border-gray-700/50">
                                        <td class="py-2 text-gray-700 dark:text-gray-300">{{ day.day }}</td>
                                        <td class="py-2 text-gray-600 dark:text-gray-400">{{ day.date }}</td>
                                        <td class="py-2 text-right font-medium text-green-600 dark:text-green-400">{{ formatCurrency(day.interest) }}</td>
                                        <td class="py-2 text-right font-bold text-indigo-900 dark:text-indigo-100">{{ formatCurrency(day.balance) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                            <button
                                v-if="simulatedResults.dailyBreakdown.length > 7"
                                type="button"
                                @click="showFullProjection = !showFullProjection"
                                class="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-[10px] sm:text-xs transition-colors"
                            >
                                {{ showFullProjection
                                    ? 'Show fewer days'
                                    : `+ ${simulatedResults.dailyBreakdown.length - 7} more days`
                                }}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Sidebar Info -->
            <div class="space-y-6">
                <!-- Withdrawals -->
                <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                     <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Withdrawal History</h3>
                     <div v-if="investment.withdrawals.length" class="space-y-4">
                        <div 
                            v-for="w in investment.withdrawals" 
                            :key="w.id"
                            class="relative pl-4 border-l-2 border-expense-200 dark:border-expense-900 py-1"
                        >
                            <div class="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-expense-500"></div>
                            <p class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(w.amount) }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(w.withdrawalDate) }}</p>
                            <p v-if="w.fee > 0" class="text-xs text-expense-600 dark:text-expense-400 mt-1">Fee: {{ formatCurrency(w.fee) }}</p>
                        </div>
                     </div>
                     <div v-else class="text-sm text-gray-500 dark:text-gray-500 italic">No withdrawals recorded.</div>
                </div>

                <!-- Rollovers -->
                 <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                     <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Rollover History</h3>
                     <div v-if="investment.rollovers && investment.rollovers.length" class="space-y-4">
                        <div 
                            v-for="r in investment.rollovers" 
                            :key="r.id"
                            class="relative pl-4 border-l-2 border-primary-200 dark:border-primary-900 py-1"
                        >
                            <div class="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                            <p class="font-bold text-gray-900 dark:text-white">+{{ formatCurrency(r.amount) }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(r.date) }}</p>
                        </div>
                     </div>
                     <div v-else class="text-sm text-gray-500 dark:text-gray-500 italic">No rollovers recorded.</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Withdrawal Modal -->
    <div v-if="showWithdrawModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-900/90 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100 dark:border-gray-700">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Record Withdrawal</h3>
                        <button @click="showWithdrawModal = false" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <form @submit.prevent="handleWithdrawal" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                             <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 dark:text-gray-400 sm:text-sm">₦</span>
                                </div>
                                <input type="number" v-model="withdrawalForm.amount" required class="focus:ring-expense-500 focus:border-expense-500 block w-full pl-7 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="0.00">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input type="date" v-model="withdrawalForm.withdrawalDate" required class="mt-1 focus:ring-expense-500 focus:border-expense-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border bg-white dark:bg-gray-900 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Fee (Optional)</label>
                             <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 dark:text-gray-400 sm:text-sm">₦</span>
                                </div>
                                <input type="number" v-model="withdrawalForm.fee" class="focus:ring-expense-500 focus:border-expense-500 block w-full pl-7 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="0.00">
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-6">
                            <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-expense-600 text-base font-medium text-white hover:bg-expense-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-expense-500 sm:text-sm disabled:opacity-50 transition-colors">
                                {{ isSubmitting ? 'Recording...' : 'Confirm Withdrawal' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Rollover Modal -->
    <div v-if="showRolloverModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-900/90 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100 dark:border-gray-700">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Record Rollover (Injection)</h3>
                        <button @click="showRolloverModal = false" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <form @submit.prevent="handleRollover" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Principal</label>
                             <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 dark:text-gray-400 sm:text-sm">₦</span>
                                </div>
                                <input type="number" v-model="rolloverForm.amount" required class="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="0.00">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input type="date" v-model="rolloverForm.date" required class="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 border bg-white dark:bg-gray-900 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]">
                        </div>
                        <div class="mt-5 sm:mt-6">
                            <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50 transition-colors">
                                {{ isSubmitting ? 'Recording...' : 'Confirm Rollover' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Terminate Confirmation Modal -->
    <div v-if="showTerminateModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-900/90 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100 dark:border-gray-700">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                            <TrashIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
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
                <div class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100 dark:border-gray-700">
                    <button 
                        type="button" 
                        @click="handleTerminate" 
                        :disabled="isSubmitting"
                        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                    >
                        {{ isSubmitting ? 'Terminating...' : 'Terminate' }}
                    </button>
                    <button 
                        type="button" 
                        @click="showTerminateModal = false" 
                        :disabled="isSubmitting"
                        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
