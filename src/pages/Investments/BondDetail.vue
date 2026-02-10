<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
    ChevronLeftIcon, 
    CalendarIcon, 
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    CurrencyDollarIcon,
    BuildingLibraryIcon,
    ShieldCheckIcon,
    DocumentChartBarIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import { mockService, type Bond, type BondCoupon, type BondAccrual } from '../../services/mockData'
import { formatCurrency } from '../../utils/dateHelpers'

const route = useRoute()
const router = useRouter()
const bondId = route.params.id as string

const loading = ref(true)
const bond = ref<Bond | null>(null)
const coupons = ref<BondCoupon[]>([])
const accruals = ref<BondAccrual[]>([])
const activeTab = ref<'overview' | 'cashflow' | 'accruals'>('overview')

onMounted(async () => {
    try {
        const [bondData, couponData, accrualData] = await Promise.all([
            mockService.getBondById(bondId),
            mockService.getBondCoupons(bondId),
            mockService.getBondAccruals(bondId)
        ])
        
        if (bondData) {
            bond.value = bondData
            coupons.value = couponData
            accruals.value = accrualData
        } else {
            router.push('/investments')
        }
    } finally {
        loading.value = false
    }
})

const stats = computed(() => {
    if (!bond.value) return []
    return [
        { label: 'Face Value', value: formatCurrency(bond.value.faceValue, bond.value.currency), icon: CurrencyDollarIcon, color: 'text-primary-600' },
        { label: 'Coupon Rate', value: `${bond.value.couponRate}%`, icon: ArrowPathIcon, color: 'text-blue-600' },
        { label: 'Yield to Maturity', value: `${bond.value.yieldToMaturity}%`, icon: ArrowTrendingUpIcon, color: 'text-money-600' },
        { label: 'Purchase Price', value: formatCurrency(bond.value.purchasePrice, bond.value.currency), icon: BuildingLibraryIcon, color: 'text-indigo-600' }
    ]
})

const nextCoupon = computed(() => {
    return coupons.value.find(c => c.status === 'SCHEDULED')
})

const paidCouponsTotal = computed(() => {
    return coupons.value
        .filter(c => c.status === 'PAID')
        .reduce((sum, c) => sum + parseFloat(c.amount), 0)
})
</script>

<template>
    <div class="space-y-6 font-primary">
        <!-- Breadcrumbs & Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <button @click="router.back()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ChevronLeftIcon class="w-5 h-5" />
                </button>
                <div v-if="bond">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ bond.referenceCode }}</h1>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                            Bond
                        </span>
                        <span :class="[
                            'px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase',
                            bond.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40'
                        ]">
                            {{ bond.status.replace('_', ' ') }}
                        </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ bond.issuer.name }} • {{ bond.currency }}</p>
                </div>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center p-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>

        <div v-else-if="bond" class="space-y-6">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div v-for="stat in stats" :key="stat.label" class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <component :is="stat.icon" class="w-5 h-5" :class="stat.color" />
                        </div>
                        <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ stat.label }}</span>
                    </div>
                    <div class="text-xl font-black text-gray-900 dark:text-white">{{ stat.value }}</div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-200 dark:border-gray-700">
                <button 
                    v-for="tab in ['overview', 'cashflow', 'accruals']" 
                    :key="tab"
                    @click="activeTab = tab as any"
                    :class="[
                        'px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2',
                        activeTab === tab 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    ]"
                >
                    {{ tab }}
                </button>
            </div>

            <!-- Content Area -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <!-- Overview Tab -->
                    <div v-if="activeTab === 'overview'" class="space-y-6">
                        <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-6 space-y-6 transition-colors">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShieldCheckIcon class="w-5 h-5 text-money-500" />
                                Investment Summary
                            </h3>
                            <div class="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Maturity Date</p>
                                    <p class="text-base font-bold text-gray-900 dark:text-white">{{ dayjs(bond.maturityDate).format('MMMM D, YYYY') }}</p>
                                    <p class="text-[10px] text-primary-500 font-bold mt-1 uppercase">{{ dayjs(bond.maturityDate).diff(dayjs(), 'day') }} days until maturity</p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Settlement Date</p>
                                    <p class="text-base font-bold text-gray-900 dark:text-white">{{ dayjs(bond.settlementDate).format('MMMM D, YYYY') }}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Coupon Frequency</p>
                                    <p class="text-base font-bold text-gray-900 dark:text-white capitalize">{{ bond.couponFrequency.replace('_', ' ').toLowerCase() }}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Counterparty</p>
                                    <p class="text-base font-bold text-gray-900 dark:text-white">{{ bond.counterparty.name }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Cashflow Tab -->
                    <div v-if="activeTab === 'cashflow'" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 font-primary">
                            <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-widest text-gray-400">
                                <tr>
                                    <th class="px-6 py-4 text-left">Period</th>
                                    <th class="px-6 py-4 text-left">Due Date</th>
                                    <th class="px-6 py-4 text-right">Amount</th>
                                    <th class="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                <tr v-for="(coupon, index) in coupons" :key="coupon.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Coupon #{{ index + 1 }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ dayjs(coupon.dueDate).format('MMM D, YYYY') }}</td>
                                    <td class="px-6 py-4 text-sm font-black text-right text-gray-900 dark:text-white">{{ formatCurrency(coupon.amount, bond.currency) }}</td>
                                    <td class="px-6 py-4 text-center">
                                        <span :class="[
                                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                                            coupon.status === 'PAID' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        ]">
                                            {{ coupon.status }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Accruals Tab -->
                    <div v-if="activeTab === 'accruals'" class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors">
                        <DocumentChartBarIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 class="text-sm font-bold text-gray-900 dark:text-white">Daily Accruals</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">Accrual data is generated daily based on the coupon logic. Currently viewing latest projections.</p>
                    </div>
                </div>

                <!-- Sidebar Info -->
                <div class="space-y-6">
                    <div class="card bg-money-600 p-6 rounded-2xl text-white shadow-lg shadow-money-500/20">
                        <p class="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Coupon ROI to Date</p>
                        <h4 class="text-3xl font-black mb-1">{{ formatCurrency(paidCouponsTotal, bond.currency) }}</h4>
                        <p class="text-xs opacity-80">Total income collected from paid coupons</p>
                        
                        <div v-if="nextCoupon" class="mt-8 pt-6 border-t border-white/20">
                            <p class="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">Next Cash Flow</p>
                            <div class="flex items-center gap-3">
                                <CalendarIcon class="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p class="text-sm font-bold">{{ dayjs(nextCoupon.dueDate).format('MMM D, YYYY') }}</p>
                                    <p class="text-xl font-black mt-1">{{ formatCurrency(nextCoupon.amount, bond.currency) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Market Value (Placeholder for Premium Feature) -->
                    <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-6 transition-colors opacity-60 grayscale-[0.5]">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Market Value (MTM)</h3>
                            <span class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">Premium</span>
                        </div>
                        <div class="text-2xl font-black text-gray-400 dark:text-gray-600">Locked</div>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">Real-time bond market valuation logic is coming in the Q2 update.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
