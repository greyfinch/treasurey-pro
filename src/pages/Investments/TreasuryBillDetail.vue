<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
    mockService, 
    type TreasuryBill 
} from '../../services/mockData'
import { formatDate, formatCurrency, formatPercentage } from '../../utils/dateHelpers'
import { 
    ArrowLeftIcon, 
    BanknotesIcon, 
    ArrowPathIcon,
    ClockIcon,
    DocumentCheckIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const tbill = ref<TreasuryBill | null>(null)
const loading = ref(true)
const activeTab = ref<'overview' | 'cash-impact' | 'history'>('overview')

// Actions state
const showRolloverModal = ref(false)
const showLiquidateModal = ref(false)
const isSubmitting = ref(false)
const rolloverForm = ref({ amount: '', newMaturityDate: '' })
const liquidateForm = ref({ amount: '', penalty: '' })

onMounted(async () => {
    if (route.params.id) {
        loading.value = true
        try {
            const data = await mockService.getTreasuryBillById(route.params.id as string)
            if (data) {
                tbill.value = data
            } else {
                router.push('/investments')
            }
        } finally {
            loading.value = false
        }
    }
})


const tenor = computed(() => {
    if (!tbill.value) return 0
    return dayjs(tbill.value.maturityDate).diff(dayjs(tbill.value.settlementDate), 'day')
})

const daysToMaturity = computed(() => {
    if (!tbill.value) return 0
    return dayjs(tbill.value.maturityDate).diff(dayjs(), 'day')
})

// Mock accrual calculation for Overview tab
const dailyAccrual = computed(() => {
    if (!tbill.value) return []
    // Generate simple daily accrual for demo
    const days = []
    const start = dayjs(tbill.value.settlementDate)
    const end = dayjs()
    const diff = end.diff(start, 'day')
    const dailyRate = (Number(tbill.value.effectiveYield) / 100) / 365
    let currentValue = Number(tbill.value.purchasePrice)
    
    // limit to last 30 days or start date
    const limit = 30
    for(let i = 0; i < Math.min(diff, limit); i++) {
        const date = end.subtract(i, 'day')
        if (date.isBefore(start)) break
        
        const interest = currentValue * dailyRate
        currentValue -= interest // Reverse calculation for demo? No, just forward.
        
        days.push({
            date: date.toDate(),
            value: Number(tbill.value.purchasePrice) + (Number(tbill.value.purchasePrice) * dailyRate * (diff - i)),
            dailyInterest: Number(tbill.value.purchasePrice) * dailyRate
        })
    }
    return days
})

const handleRollover = async () => {
    // Implement
    alert('Rollover logic to be implemented')
    showRolloverModal.value = false
}

const handleLiquidate = async () => {
    // Implement
    alert('Liquidation logic to be implemented')
    showLiquidateModal.value = false
}

</script>

<template>
    <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="tbill" class="space-y-6">
        <!-- Back Button -->
        <router-link 
            to="/investments?tab=tbills"  
            class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            <ArrowLeftIcon class="w-4 h-4" /> Back to Treasury Bills
        </router-link>

        <!-- Header Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ tbill.referenceCode || 'TBILL-REF' }}
                        </h1>
                        <span :class="[
                            'px-2.5 py-0.5 rounded-full text-xs font-medium',
                            tbill.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            tbill.status === 'MATURED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        ]">
                            {{ tbill.status }}
                        </span>
                    </div>
                    <div class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{{ tbill.counterparty.name }}</span>
                        <span>•</span>
                        <ClockIcon class="w-4 h-4" />
                        <span>{{ tenor }} Days Tenor</span>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button 
                        v-if="tbill.status === 'ACTIVE'"
                        @click="showLiquidateModal = true"
                        class="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <BanknotesIcon class="w-4 h-4" />
                        Liquidate
                    </button>
                    <button 
                        v-if="tbill.status === 'MATURED' || (daysToMaturity < 7 && tbill.status === 'ACTIVE')"
                        @click="showRolloverModal = true"
                        class="btn-primary flex items-center gap-2"
                    >
                        <ArrowPathIcon class="w-4 h-4" />
                        Rollover
                    </button>
                </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Face Value</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ formatCurrency(tbill.faceValue, tbill.currency) }}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Price</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ formatCurrency(tbill.purchasePrice, tbill.currency) }}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yield / Discount</p>
                    <div class="flex items-baseline gap-2 mt-1">
                        <p class="text-xl font-bold text-green-600 dark:text-green-400">
                            {{ formatPercentage(tbill.effectiveYield) }}
                        </p>
                        <span class="text-xs text-gray-400">({{ formatPercentage(tbill.discountRate) }} D.R.)</span>
                    </div>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maturity</p>
                    <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ formatDate(tbill.maturityDate) }}
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
                    v-for="tab in ['overview', 'cash-impact', 'history']"
                    :key="tab"
                    @click="activeTab = tab as any"
                    :class="[
                        activeTab === tab
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                        'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize'
                    ]"
                >
                    {{ tab.replace('-', ' ') }}
                </button>
            </nav>
        </div>

        <!-- Tab Panels -->
        <div>
            <!-- Overview Panel -->
            <div v-if="activeTab === 'overview'" class="space-y-6">
                <!-- Accrual Chart Placeholder -->
                <div class="card bg-white dark:bg-gray-800 p-6">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Accrual Timeline</h3>
                    <div class="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <p class="text-gray-500">Accrual Chart Visualisation (Coming Soon)</p>
                    </div>
                </div>

                <!-- Daily Accrual Table -->
                <div class="card p-0 overflow-hidden bg-white dark:bg-gray-800">
                     <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white">Daily Accrual (Last 30 Days)</h3>
                    </div>
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-900/30">
                            <tr>
                                <th class="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Value</th>
                                <th class="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Daily Interest</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            <tr v-for="(day, idx) in dailyAccrual" :key="idx">
                                <td class="px-6 py-3 text-gray-900 dark:text-white">{{ formatDate(day.date) }}</td>
                                <td class="px-6 py-3 text-right text-gray-900 dark:text-white font-medium">{{ formatCurrency(day.value, tbill.currency) }}</td>
                                <td class="px-6 py-3 text-right text-green-600 dark:text-green-400">+{{ formatCurrency(day.dailyInterest, tbill.currency) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Cash Impact Panel -->
            <div v-if="activeTab === 'cash-impact'" class="space-y-6">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card bg-white dark:bg-gray-800">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Initial Outflow</h3>
                        <div class="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
                            <div>
                                <p class="text-sm font-medium text-red-900 dark:text-red-200">Purchase Settlement</p>
                                <p class="text-xs text-red-700 dark:text-red-400">{{ formatDate(tbill.settlementDate) }}</p>
                            </div>
                            <p class="text-lg font-bold text-red-700 dark:text-red-400">
                                -{{ formatCurrency(tbill.purchasePrice, tbill.currency) }}
                            </p>
                        </div>
                    </div>

                    <div class="card bg-white dark:bg-gray-800">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Projected Inflow</h3>
                        <div class="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/50">
                            <div>
                                <p class="text-sm font-medium text-green-900 dark:text-green-200">Maturity Value</p>
                                <p class="text-xs text-green-700 dark:text-green-400">{{ formatDate(tbill.maturityDate) }}</p>
                            </div>
                            <p class="text-lg font-bold text-green-700 dark:text-green-400">
                                +{{ formatCurrency(tbill.faceValue, tbill.currency) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- History Panel -->
            <div v-if="activeTab === 'history'" class="space-y-6">
                <div class="card bg-white dark:bg-gray-800">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Audit Trail</h3>
                     <div class="flow-root">
                        <ul role="list" class="-mb-8">
                            <!-- Mock History Items -->
                            <li v-for="(event, eventIdx) in [{ type: 'PURCHASED', date: tbill.tradeDate, description: 'Treasury Bill purchased' }, { type: 'CREATED', date: tbill.tradeDate, description: 'Investment record created' }]" :key="eventIdx">
                                <div class="relative pb-8">
                                    <span v-if="eventIdx !== 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                                    <div class="relative flex space-x-3">
                                        <div>
                                            <span class="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                                                <DocumentCheckIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ event.description }} <span class="font-medium text-gray-900 dark:text-white">{{ event.type }}</span></p>
                                            </div>
                                            <div class="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                <time :datetime="event.date.toString()">{{ formatDate(event.date) }}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
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
                        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Rollover Treasury Bill</h3>
                        <button @click="showRolloverModal = false" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <form @submit.prevent="handleRollover" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Rollover Amount</label>
                            <input type="number" v-model="rolloverForm.amount" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">New Maturity Date</label>
                            <input type="date" v-model="rolloverForm.newMaturityDate" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]">
                        </div>
                        <div class="mt-5 sm:mt-6">
                            <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50 transition-colors">
                                {{ isSubmitting ? 'Processing...' : 'Confirm Rollover' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Liquidate Modal -->
    <div v-if="showLiquidateModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 dark:bg-gray-900/90 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100 dark:border-gray-700">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Liquidate Early</h3>
                        <button @click="showLiquidateModal = false" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <form @submit.prevent="handleLiquidate" class="space-y-4">
                         <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                            <p class="text-sm text-yellow-800 dark:text-yellow-200">
                                Warning: Early liquidation may incur penalties and loss of accrued interest.
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Liquidation Amount</label>
                            <input type="number" v-model="liquidateForm.amount" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Penalty / Fee</label>
                            <input type="number" v-model="liquidateForm.penalty" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        </div>
                        <div class="mt-5 sm:mt-6">
                            <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50 transition-colors">
                                {{ isSubmitting ? 'Processing...' : 'Confirm Liquidation' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
