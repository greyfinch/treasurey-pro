<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
    mockService, 
    type CommercialPaper 
} from '../../services/mockData'
import { formatDate, formatCurrency, formatPercentage } from '../../utils/dateHelpers'
import { 
    ArrowLeftIcon, 
    ClockIcon,
    ShieldCheckIcon,
    CalendarIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const cp = ref<CommercialPaper | null>(null)
const loading = ref(true)
const activeTab = ref<'accrual' | 'issuer' | 'cashflow'>('accrual')

onMounted(async () => {
    if (route.params.id) {
        loading.value = true
        try {
            const data = await mockService.getCommercialPaperById(route.params.id as string)
            if (data) {
                cp.value = data
            } else {
                router.push('/investments')
            }
        } finally {
            loading.value = false
        }
    }
})

const daysToMaturity = computed(() => {
    if (!cp.value) return 0
    return dayjs(cp.value.maturityDate).diff(dayjs(), 'day')
})

const tenor = computed(() => {
    if (!cp.value) return 0
    return dayjs(cp.value.maturityDate).diff(dayjs(cp.value.settlementDate || cp.value.tradeDate), 'day')
})

const maturityValue = computed(() => {
    if (!cp.value) return 0
    if (cp.value.calculationMethod === 'Discounted') {
        return Number(cp.value.faceValue)
    } else {
        // Interest Bearing: Price + (Price * Rate * Tenor / 365)
        const price = Number(cp.value.purchasePrice)
        const rate = (Number(cp.value.yieldRate) || 0) / 100
        const t = tenor.value
        return price + (price * rate * t / 365)
    }
})

const profit = computed(() => {
    if (!cp.value) return 0
    return maturityValue.value - Number(cp.value.purchasePrice)
})

// Mock accrual calculation
const dailyAccrual = computed(() => {
    if (!cp.value) return []
    const days = []
    const start = dayjs(cp.value.settlementDate || cp.value.tradeDate)
    const end = dayjs()
    const diff = Math.max(0, end.diff(start, 'day'))
    
    // Annualised Yield / 365
    const dailyRate = (Number(cp.value.yieldRate) / 100) / 365
    const principal = Number(cp.value.purchasePrice)
    
    const limit = 30
    for(let i = 0; i < Math.min(diff, limit); i++) {
        const date = end.subtract(i, 'day')
        if (date.isBefore(start)) break
        
        const daysPassedDepuisStart = diff - i
        const currentAccrued = principal * dailyRate * daysPassedDepuisStart
        
        days.push({
            date: date.toDate(),
            value: principal + currentAccrued,
            dailyInterest: principal * dailyRate
        })
    }
    return days
})
</script>

<template>
    <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="cp" class="space-y-6">
        <!-- Back Button -->
        <router-link 
            to="/investments?tab=cp"  
            class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            <ArrowLeftIcon class="w-4 h-4" /> Back to Commercial Papers
        </router-link>

        <!-- Header Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ cp.referenceCode }}
                        </h1>
                        <span :class="[
                            'px-2.5 py-0.5 rounded-full text-xs font-medium',
                            cp.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            cp.status === 'MATURED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        ]">
                            {{ cp.status }}
                        </span>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                             {{ cp.calculationMethod }}
                        </span>
                    </div>
                    <div class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ cp.issuer.name }}</span>
                        <span>•</span>
                        <ShieldCheckIcon class="w-4 h-4 text-primary-500" />
                        <span>{{ cp.issuer.creditRating }} Rating</span>
                        <span>•</span>
                        <ClockIcon class="w-4 h-4" />
                        <span>{{ tenor }} Days Tenor</span>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button 
                        v-if="cp.status === 'ACTIVE'"
                        class="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <XMarkIcon class="w-4 h-4" />
                        Terminate
                    </button>
                    <button 
                        class="btn-primary flex items-center gap-2"
                    >
                         Download Certificate
                    </button>
                </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Price</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ formatCurrency(cp.purchasePrice, cp.currency) }}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maturity Value</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ formatCurrency(maturityValue, cp.currency) }}
                    </p>
                    <p class="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                        +{{ formatCurrency(profit, cp.currency) }} Profit
                    </p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Annualised Yield</p>
                    <p class="text-xl font-bold text-money-600 dark:text-money-400 mt-1">
                        {{ formatPercentage(cp.yieldRate) }}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maturity Date</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ formatDate(cp.maturityDate) }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                        {{ daysToMaturity > 0 ? `${daysToMaturity} days to go` : 'Matured' }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    v-for="tab in ['accrual', 'issuer', 'cashflow']"
                    :key="tab"
                    @click="activeTab = tab as any"
                    :class="[
                        activeTab === tab
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                        'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                    ]"
                >
                    {{ tab === 'accrual' ? 'Accrual & ROI' : tab === 'issuer' ? 'Issuer & Risk' : 'Cashflow Profile' }}
                </button>
            </nav>
        </div>

        <!-- Tab Panels -->
        <div>
            <!-- Accrual Panel -->
            <div v-if="activeTab === 'accrual'" class="space-y-6">
                <div class="card bg-white dark:bg-gray-800 p-6">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Daily ROI Accrual</h3>
                    <div class="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <p class="text-gray-500">CP Accrual Chart (Coming Soon)</p>
                    </div>
                </div>

                <div class="card p-0 overflow-hidden bg-white dark:bg-gray-800 transition-colors">
                     <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white">Recent Daily Breakdown</h3>
                    </div>
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-900/30">
                            <tr>
                                <th class="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Projected Value</th>
                                <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Daily ROI</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            <tr v-for="(day, idx) in dailyAccrual" :key="idx">
                                <td class="px-6 py-3 text-gray-900 dark:text-white">{{ formatDate(day.date) }}</td>
                                <td class="px-6 py-3 text-right text-gray-900 dark:text-white font-medium">{{ formatCurrency(day.value, cp.currency) }}</td>
                                <td class="px-6 py-3 text-right text-green-600 dark:text-green-400">+{{ formatCurrency(day.dailyInterest, cp.currency) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Issuer Panel -->
            <div v-if="activeTab === 'issuer'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Issuer Information</h3>
                    <dl class="space-y-4">
                        <div>
                            <dt class="text-xs text-gray-500 uppercase">Organization Name</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ cp.issuer.name }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 uppercase">Issuer Type</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ cp.issuer.type }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 uppercase">Industry / Sector</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">Financial Services</dd>
                        </div>
                    </dl>
                </div>

                <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Risk Assessment</h3>
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-16 h-16 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800">
                            <span class="text-2xl font-bold text-primary-700 dark:text-primary-300">{{ cp.issuer.creditRating }}</span>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">Credit Rating</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Assessed by Standard & Poor's / GCR</p>
                        </div>
                    </div>
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <p class="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            This issuer is classified as HIGH GRADE. The risk of default is extremely low based on recent financial audits and market position.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Cashflow Panel -->
            <div v-if="activeTab === 'cashflow'" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Initial Outflow</h3>
                        <div class="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
                            <div class="flex items-center gap-3">
                                <CalendarIcon class="w-5 h-5 text-red-600" />
                                <div>
                                    <p class="text-sm font-medium text-red-900 dark:text-red-200">Settlement Date</p>
                                    <p class="text-xs text-red-700 dark:text-red-400">{{ formatDate(cp.settlementDate || cp.tradeDate) }}</p>
                                </div>
                            </div>
                            <p class="text-lg font-bold text-red-700 dark:text-red-400">
                                -{{ formatCurrency(cp.purchasePrice, cp.currency) }}
                            </p>
                        </div>
                    </div>

                    <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Final Inflow</h3>
                        <div class="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/50 transition-colors">
                            <div class="flex items-center gap-3">
                                <CalendarIcon class="w-5 h-5 text-green-600" />
                                <div>
                                    <p class="text-sm font-medium text-green-900 dark:text-green-200">Maturity Date</p>
                                    <p class="text-xs text-green-700 dark:text-green-400">{{ formatDate(cp.maturityDate) }}</p>
                                </div>
                            </div>
                            <p class="text-lg font-bold text-green-700 dark:text-green-400">
                                +{{ formatCurrency(maturityValue, cp.currency) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
