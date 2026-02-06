<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import KPICard from '../components/KPICard.vue'
import ROILineChart from '../components/ROILineChart.vue'
import InvestmentsTable from '../components/InvestmentsTable.vue'
import DateFilter from '../components/DateFilter.vue'
import FilterPanel from '../components/FilterPanel.vue'
import ExportButtons from '../components/ExportButtons.vue'
import { mockService } from '../services/mockData'
import { calculatePortfolioROI } from '../utils/roi'
import { exportToExcel, exportToCSV } from '../utils/export'
import { formatCurrency } from '../utils/dateHelpers'
import { ArrowTrendingUpIcon, ArrowPathIcon, BuildingOffice2Icon } from '@heroicons/vue/24/outline'
import { organisationService } from '../services/organisationService'

const { activeOrganisation } = organisationService

const loading = ref(true)
const investments = ref<any[]>([])
const banks = ref<any[]>([])
const fxRates = ref<any[]>([])
const targetDate = ref(new Date())

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const selectedCurrency = ref('')
const maturityDateStart = ref('')
const maturityDateEnd = ref('')
const currencies = ref<any[]>([])


onMounted(async () => {
    try {
        const [invData, bankData, fxData, currData] = await Promise.all([
            mockService.getInvestments(),
            mockService.getBanks(),
            mockService.getFXRates(),
            mockService.getCurrencies()
        ])
        investments.value = invData
        banks.value = bankData
        fxRates.value = fxData
        currencies.value = currData
    } finally {

        loading.value = false
    }
})

// Scoped Investments based on active organisation
const scopedInvestments = computed(() => {
    if (!activeOrganisation.value) return []
    if (activeOrganisation.value.type === 'GROUP') return investments.value
    return investments.value.filter(inv => inv.organisationId === activeOrganisation.value?.id)
})

// Computed Properties
const filteredInvestments = computed(() => {
    return scopedInvestments.value.filter(inv => {
        const matchBank = !selectedBankId.value || inv.bankId === selectedBankId.value
        const matchStatus = !selectedStatus.value || inv.status === selectedStatus.value
        const matchCurrency = !selectedCurrency.value || inv.currency === selectedCurrency.value
        
        // Maturity Date Range Filter
        let matchDateRange = true
        if (maturityDateStart.value) {
            matchDateRange = matchDateRange && !dayjs(inv.maturityDate).isBefore(dayjs(maturityDateStart.value), 'day')
        }
        if (maturityDateEnd.value) {
            matchDateRange = matchDateRange && !dayjs(inv.maturityDate).isAfter(dayjs(maturityDateEnd.value), 'day')
        }

        return matchBank && matchStatus && matchCurrency && matchDateRange
    })
})


const baseCurrency = computed(() => activeOrganisation.value?.baseCurrency || 'NGN')

const currencyBreakdown = computed(() => {
    const breakdown: Record<string, number> = {}
    filteredInvestments.value.forEach(inv => {
        breakdown[inv.currency] = (breakdown[inv.currency] || 0) + Number(inv.principal)
    })
    return Object.entries(breakdown).map(([code, principal]) => ({ code, principal }))
})

const totalPrincipalBase = computed(() => {
    return filteredInvestments.value.reduce((acc, inv) => {
        if (inv.currency === baseCurrency.value) return acc + Number(inv.principal)
        const rate = fxRates.value.find(r => r.fromCurrency === inv.currency && r.toCurrency === baseCurrency.value)?.rate || 1
        return acc + (Number(inv.principal) * rate)
    }, 0)
})

const totalROIBase = computed(() => {
    return calculatePortfolioROI(filteredInvestments.value, targetDate.value, baseCurrency.value, fxRates.value).toNumber()
})

const todayROIBase = computed(() => {
    return calculatePortfolioROI(filteredInvestments.value, new Date(), baseCurrency.value, fxRates.value).toNumber()
})

const roiTrend = computed(() => {
    const yesterday = calculatePortfolioROI(filteredInvestments.value, dayjs().subtract(1, 'day').toDate(), baseCurrency.value, fxRates.value).toNumber()
    if (yesterday === 0) return 0
    return Number(((todayROIBase.value - yesterday) / yesterday * 100).toFixed(2))
})

const subsidiaryBreakdown = computed(() => {
    if (!activeOrganisation.value || activeOrganisation.value.type !== 'GROUP') return []
    
    const subs = organisationService.organisations.value.filter(o => o.type === 'SUBSIDIARY')
    return subs.map(sub => {
        const subInvs = investments.value.filter(inv => inv.organisationId === sub.id)
        const principal = subInvs.reduce((acc, inv) => {
            if (inv.currency === baseCurrency.value) return acc + Number(inv.principal)
            const rate = fxRates.value.find(r => r.fromCurrency === inv.currency && r.toCurrency === baseCurrency.value)?.rate || 1
            return acc + (Number(inv.principal) * rate)
        }, 0)
        const roi = calculatePortfolioROI(subInvs, targetDate.value, baseCurrency.value, fxRates.value).toNumber()
        return {
            ...sub,
            principal,
            roi
        }
    }).sort((a, b) => b.principal - a.principal)
})

const nextMaturityInvestment = computed(() => {
    const today = dayjs().startOf('day')
    const investmentsWithDate = filteredInvestments.value.filter(inv => {
        return inv.status === 'ACTIVE' && inv.maturityDate && !dayjs(inv.maturityDate).isBefore(today, 'day')
    })
    if (!investmentsWithDate.length) return null
    return investmentsWithDate
        .slice()
        .sort((a, b) => dayjs(a.maturityDate).valueOf() - dayjs(b.maturityDate).valueOf())[0]
})

// Actions
const handleExportExcel = () => {
    exportToExcel(filteredInvestments.value, `treasury_report_${dayjs(targetDate.value).format('YYYY-MM-DD')}`)
}

const handleExportCSV = () => {
    exportToCSV(filteredInvestments.value, `treasury_report_${dayjs(targetDate.value).format('YYYY-MM-DD')}`)
}

const clearFilters = () => {
    selectedBankId.value = ''
    selectedStatus.value = ''
    selectedCurrency.value = ''
}

</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Treasury Dashboard</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Overview of your investment portfolio performance</p>
            </div>
            <div class="flex items-center gap-3">
                 <DateFilter v-model="targetDate" />
                 <ExportButtons @export-excel="handleExportExcel" @export-csv="handleExportCSV" />
            </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard 
                label="Total Invested Principal" 
                :value="formatCurrency(totalPrincipalBase, baseCurrency)" 
            />
            <KPICard 
                label="Accrued ROI (Selected Date)" 
                :value="formatCurrency(totalROIBase, baseCurrency)"
                trend-label="Returns calculated up to selected date"
            />
            <KPICard 
                label="Today's ROI Performance" 
                :value="formatCurrency(todayROIBase, baseCurrency)" 
                :trend="roiTrend"
                trend-label="vs Yesterday"
            />
        </div>

        <!-- Currency Breakdown -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Portfolio Currency Breakdown</h4>
            <div class="flex flex-wrap gap-4">
                <div v-for="item in currencyBreakdown" :key="item.code" class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ item.code }}:</span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatCurrency(item.principal, item.code) }}</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Main Content Area -->
            <div class="lg:col-span-3 space-y-6">
                 <!-- FX Impact Note -->
                 <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3 transition-colors">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg h-fit">
                        <ArrowTrendingUpIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-100">Multi-Currency & FX Impact</h4>
                        <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Your portfolio is spread across {{ currencyBreakdown.length }} currencies. All aggregated totals are displayed in your reporting currency ({{ baseCurrency }}).
                            ROI includes interest earned in native currency and FX gains/losses upon conversion.
                        </p>
                    </div>
                </div>

                <!-- Chart -->
                <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                             <ArrowTrendingUpIcon class="w-5 h-5 text-primary-500" />
                             ROI Growth Trajectory
                        </h3>
                    </div>
                    <ROILineChart 
                        :investments="filteredInvestments" 
                        :base-currency="baseCurrency"
                        :fx-rates="fxRates"
                    />
                </div>

                <!-- Subsidiary Breakdown (Only in Group View) -->
                <div v-if="activeOrganisation?.type === 'GROUP'" class="card p-0 overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <BuildingOffice2Icon class="w-5 h-5 text-primary-500" />
                            Subsidiary Performance
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-900/30">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subsidiary</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Invested ({{ baseCurrency }})</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accrued ROI</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allocation</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="sub in subsidiaryBreakdown" :key="sub.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        <router-link :to="`/subsidiaries/${sub.id}`" class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline">
                                            {{ sub.name }}
                                        </router-link>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">{{ formatCurrency(sub.principal, baseCurrency) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-primary-600 dark:text-primary-400 font-semibold">{{ formatCurrency(sub.roi, baseCurrency) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <div class="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    class="bg-primary-500 dark:bg-primary-600 h-full rounded-full" 
                                                    :style="{ width: `${(sub.principal / totalPrincipalBase) * 100}%` }"
                                                ></div>
                                            </div>
                                            <span class="text-xs text-gray-500 dark:text-gray-400 w-8">{{ ((sub.principal / totalPrincipalBase) * 100).toFixed(0) }}%</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Table -->
                <div class="card p-0 overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white">Active Investments</h3>
                         <span class="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                            {{ filteredInvestments.length }} records
                        </span>
                    </div>
                    <div v-if="loading" class="p-8 text-center text-gray-400">
                        <ArrowPathIcon class="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading investments...
                    </div>
                    <InvestmentsTable 
                        v-else 
                        :investments="filteredInvestments" 
                        :target-date="targetDate"
                    />
                </div>
            </div>

            <!-- Sidebar Filters -->
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

                
                <!-- Summary Stats helper -->
                 <div class="mt-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800 transition-colors">
                    <h4 class="text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider mb-2">Next Maturity</h4>
                    <div class="flex items-center gap-3" v-if="nextMaturityInvestment">
                        <div class="bg-white dark:bg-gray-900 p-2 rounded-lg text-primary-600 dark:text-primary-400 font-bold text-lg border border-primary-100 dark:border-primary-800 transition-colors">
                            {{ dayjs(nextMaturityInvestment.maturityDate).format('DD') }}
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ dayjs(nextMaturityInvestment.maturityDate).format('MMMM YYYY') }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ nextMaturityInvestment.bank.name }} ({{ nextMaturityInvestment.currency }})</p>
                        </div>
                    </div>
                    <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">No active investments found.</div>
                </div>
            </div>
        </div>
    </div>
</template>

