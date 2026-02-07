<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import KPICard from '../components/KPICard.vue'
import ROILineChart from '../components/ROILineChart.vue'
import DateFilter from '../components/DateFilter.vue'
import { mockService } from '../services/mockData'
import { calculatePortfolioROI } from '../utils/roi'
import { exportToExcel, exportToCSV } from '../utils/export'
import { formatCurrency } from '../utils/dateHelpers'
import { 
    ArrowTrendingUpIcon, 
    BuildingOffice2Icon, 
    BuildingLibraryIcon,
    ChartPieIcon,
    FunnelIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import { organisationService } from '../services/organisationService'

const { activeOrganisation } = organisationService

const loading = ref(true)
const investments = ref<any[]>([])
const banks = ref<any[]>([])
const fxRates = ref<any[]>([])
const targetDate = ref(new Date())
const currentReportType = ref('portfolio') // 'portfolio' | 'bank_exposure'

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const selectedCurrency = ref('')
const selectedOrganisationId = ref('')
const maturityDateStart = ref('')
const maturityDateEnd = ref('')
const currencies = ref<any[]>([])
const taxSettings = ref({ whtRate: 0 })

onMounted(async () => {
    try {
        const [invData, bankData, fxData, currData, taxData] = await Promise.all([
            mockService.getInvestments(),
            mockService.getBanks(),
            mockService.getFXRates(),
            mockService.getCurrencies(),
            mockService.getTaxSettings()
        ])
        investments.value = invData
        banks.value = bankData
        fxRates.value = fxData
        currencies.value = currData
        taxSettings.value = taxData
    } finally {
        loading.value = false
    }
})

// Scoped Investments based on active organisation
const scopedInvestments = computed(() => {
    if (!activeOrganisation.value) return []
    if (activeOrganisation.value.type === 'GROUP') {
        // If a specific subsidiary is selected in filter, use only that subsidiary's investments
        if (selectedOrganisationId.value) {
            return investments.value.filter(inv => inv.organisationId === selectedOrganisationId.value)
        }
        // Otherwise show all group investments
        return investments.value
    }
    return investments.value.filter(inv => inv.organisationId === activeOrganisation.value?.id)
})

// Computed Properties
const filteredInvestments = computed(() => {
    return scopedInvestments.value.filter(inv => {
        const matchBank = !selectedBankId.value || inv.bankId === selectedBankId.value
        const matchStatus = !selectedStatus.value || inv.status === selectedStatus.value
        const matchCurrency = !selectedCurrency.value || inv.currency === selectedCurrency.value
        
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

const totalPrincipalBase = computed(() => {
    return filteredInvestments.value.reduce((acc, inv) => {
        if (inv.currency === baseCurrency.value) return acc + Number(inv.principal)
        const rate = fxRates.value.find(r => r.fromCurrency === inv.currency && r.toCurrency === baseCurrency.value)?.rate || 1
        return acc + (Number(inv.principal) * rate)
    }, 0)
})

const totalGrossROIBase = computed(() => {
    return calculatePortfolioROI(filteredInvestments.value, targetDate.value, baseCurrency.value, fxRates.value, 0).toNumber()
})

const totalNetROIBase = computed(() => {
    return calculatePortfolioROI(filteredInvestments.value, targetDate.value, baseCurrency.value, fxRates.value, taxSettings.value.whtRate).toNumber()
})

const todayROIBase = computed(() => {
    return calculatePortfolioROI(filteredInvestments.value, new Date(), baseCurrency.value, fxRates.value, taxSettings.value.whtRate).toNumber()
})

const subsidiaryBreakdown = computed(() => {
    if (!activeOrganisation.value || activeOrganisation.value.type !== 'GROUP') return []
    
    const subs = organisationService.organisations.value.filter(o => o.type === 'SUBSIDIARY')
    return subs.map(sub => {
        const subInvs = filteredInvestments.value.filter(inv => inv.organisationId === sub.id)
        const principal = subInvs.reduce((acc, inv) => {
            if (inv.currency === baseCurrency.value) return acc + Number(inv.principal)
            const rate = fxRates.value.find(r => r.fromCurrency === inv.currency && r.toCurrency === baseCurrency.value)?.rate || 1
            return acc + (Number(inv.principal) * rate)
        }, 0)
        const grossRoi = calculatePortfolioROI(subInvs, targetDate.value, baseCurrency.value, fxRates.value, 0).toNumber()
        const netRoi = calculatePortfolioROI(subInvs, targetDate.value, baseCurrency.value, fxRates.value, taxSettings.value.whtRate).toNumber()
        return {
            ...sub,
            principal,
            grossRoi,
            netRoi
        }
    }).sort((a, b) => b.principal - a.principal)
})

const subsidiaries = computed(() => {
    return organisationService.organisations.value.filter(o => o.type === 'SUBSIDIARY')
})

const bankExposureData = computed(() => {
    if (!banks.value.length || !filteredInvestments.value.length) return []
    
    const exposure = banks.value.map(bank => {
        const bankInvs = filteredInvestments.value.filter(inv => inv.bankId === bank.id)
        
        // Calculate currency breakdown
        const currencyBreakdown: any = {}
        bankInvs.forEach(inv => {
            if (!currencyBreakdown[inv.currency]) {
                currencyBreakdown[inv.currency] = 0
            }
            currencyBreakdown[inv.currency] += Number(inv.principal)
        })
        
        // Calculate total in base currency
        const principal = bankInvs.reduce((acc, inv) => {
            if (inv.currency === baseCurrency.value) return acc + Number(inv.principal)
            const rate = fxRates.value.find(r => r.fromCurrency === inv.currency && r.toCurrency === baseCurrency.value)?.rate || 1
            return acc + (Number(inv.principal) * rate)
        }, 0)
        
        return {
            id: bank.id,
            name: bank.name,
            value: principal,
            currencyBreakdown,
            percentage: totalPrincipalBase.value > 0 ? (principal / totalPrincipalBase.value) * 100 : 0
        }
    }).filter((b: any) => b.value > 0).sort((a: any, b: any) => b.value - a.value)
    
    return exposure
})

const activeFxRates = computed(() => {
    return fxRates.value.filter(rate => rate.status === 'ACTIVE')
})

// Actions
const handleExportExcel = () => {
    exportToExcel(filteredInvestments.value, `treasury_full_report_${dayjs(targetDate.value).format('YYYY-MM-DD')}`)
}

const handleExportCSV = () => {
    exportToCSV(filteredInvestments.value, `treasury_full_report_${dayjs(targetDate.value).format('YYYY-MM-DD')}`)
}

const clearFilters = () => {
    selectedBankId.value = ''
    selectedStatus.value = ''
    selectedCurrency.value = ''
    selectedOrganisationId.value = ''
    maturityDateStart.value = ''
    maturityDateEnd.value = ''
}
</script>

<template>
    <div class="flex flex-col lg:flex-row gap-6 min-h-[80vh]">
        <!-- Reports Sidebar Navigation -->
        <aside class="lg:w-64 flex-shrink-0 space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-2 transition-colors">
                <nav class="space-y-1">
                    <button 
                        @click="currentReportType = 'portfolio'"
                        :class="[
                            'w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all',
                            currentReportType === 'portfolio' 
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        ]"
                    >
                        <ChartPieIcon class="w-5 h-5" />
                        Portfolio Overview
                    </button>
                    <button 
                        @click="currentReportType = 'bank_exposure'"
                        :class="[
                            'w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all',
                            currentReportType === 'bank_exposure' 
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        ]"
                    >
                        <BuildingLibraryIcon class="w-5 h-5" />
                        Bank Exposure
                    </button>
                </nav>
            </div>

            <!-- Contextual Filters based on Report Type -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 transition-colors">
                <div class="flex items-center gap-2 mb-4">
                    <FunnelIcon class="w-4 h-4 text-primary-500" />
                    <h3 class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Report Filters</h3>
                </div>
                
                <div class="space-y-4">
                    <!-- Standard Date Filter -->
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Target Maturity</label>
                        <DateFilter v-model="targetDate" class="w-full" />
                    </div>

                    <!-- Filter Panel Integration (Simplified for sidebar) -->
                    <div class="pt-4 border-t border-gray-50 dark:border-gray-700 space-y-4">
                         <div>
                            <label class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Bank</label>
                            <select v-model="selectedBankId" class="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="">All Banks</option>
                                <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Currency</label>
                            <select v-model="selectedCurrency" class="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="">All Currencies</option>
                                <option v-for="curr in currencies" :key="curr.code" :value="curr.code">{{ curr.code }} - {{ curr.name }}</option>
                            </select>
                        </div>
                        <div v-if="activeOrganisation?.type === 'GROUP'">
                            <label class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Subsidiary</label>
                            <select v-model="selectedOrganisationId" class="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="">All Subsidiaries</option>
                                <option v-for="sub in subsidiaries" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                            </select>
                        </div>
                    </div>

                    <button @click="clearFilters" class="w-full py-2 text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors">
                        Clear All Filters
                    </button>
                </div>
            </div>

            <!-- Export Sidebar Section -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                <div class="flex items-center gap-2 mb-4">
                    <ArrowDownTrayIcon class="w-4 h-4 text-primary-500" />
                    <h3 class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Export Results</h3>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button 
                        @click="handleExportExcel"
                        class="flex border items-center justify-center p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-100 dark:border-gray-700 transition-colors"
                        title="Excel"
                    >
                       <span class="text-xs font-bold text-green-700 dark:text-green-400">Excel</span>
                    </button>
                    <button 
                        @click="handleExportCSV"
                        class="flex border items-center justify-center p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-100 dark:border-gray-700 transition-colors"
                        title="CSV"
                    >
                         <span class="text-xs font-bold text-blue-700 dark:text-blue-400">CSV</span>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Main Report Content -->
        <main class="flex-1 space-y-6">
            <!-- Header (Dynamic) -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                <div class="flex items-start justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ currentReportType === 'portfolio' ? 'Portfolio Overview' : 'Bank Exposure Analytics' }}
                        </h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {{ currentReportType === 'portfolio' ? 'Comprehensive view of investment performance and trends.' : 'Detailed breakdown of investment allocation across financial institutions.' }}
                        </p>
                    </div>
                    <div class="hidden sm:block">
                        <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {{ activeOrganisation?.name }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Portfolio Overview Report Type -->
            <div v-if="currentReportType === 'portfolio'" class="space-y-6">
                <!-- KPI Summary -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard 
                        label="Portfolio Principal" 
                        :value="formatCurrency(totalPrincipalBase, baseCurrency)" 
                    />
                    <KPICard 
                        label="Accrued ROI (Gross)" 
                        :value="formatCurrency(totalGrossROIBase, baseCurrency)"
                        trend-label="Interest before tax"
                    />
                    <KPICard 
                        label="Net ROI (After Tax)" 
                        :value="formatCurrency(totalNetROIBase, baseCurrency)"
                        variant="money"
                        trend-label="Net realised after WHT"
                    />
                    <KPICard 
                        label="Today's Performance" 
                        :value="formatCurrency(todayROIBase, baseCurrency)" 
                    />
                </div>

                <!-- ROI growth chart -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                             <ArrowTrendingUpIcon class="w-5 h-5 text-primary-500" />
                             ROI Growth Projection
                        </h3>
                    </div>
                    <ROILineChart 
                        :investments="filteredInvestments" 
                        :base-currency="baseCurrency"
                        :fx-rates="fxRates"
                    />
                </div>

                <!-- Subsidiary Performance Table (Only for Group View) -->
                <div v-if="activeOrganisation?.type === 'GROUP'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BuildingOffice2Icon class="w-5 h-5 text-primary-500" />
                            Subsidiary Contribution Report
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-900/30">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subsidiary</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invested ({{ baseCurrency }})</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross ROI</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net ROI</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Share</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="sub in subsidiaryBreakdown" :key="sub.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{{ sub.name }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">{{ formatCurrency(sub.principal, baseCurrency) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{{ formatCurrency(sub.grossRoi, baseCurrency) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-money-600 dark:text-money-400">{{ formatCurrency(sub.netRoi, baseCurrency) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <div class="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                                <div 
                                                    class="bg-primary-500 h-full rounded-full" 
                                                    :style="{ width: `${(sub.principal / totalPrincipalBase) * 100}%` }"
                                                ></div>
                                            </div>
                                            <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400">{{ ((sub.principal / totalPrincipalBase) * 100).toFixed(0) }}%</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Bank Exposure Report Type -->
            <div v-else-if="currentReportType === 'bank_exposure'" class="space-y-6">

                <!-- FX Rates Card -->
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Active FX Rates
                        </h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="rate in activeFxRates" :key="`${rate.fromCurrency}-${rate.toCurrency}`" class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{{ rate.fromCurrency }} → {{ rate.toCurrency }}</span>
                                </div>
                                <!-- <div class="text-2xl font-black text-gray-900 dark:text-white">
                                    {{ rate.rate.toFixed(2) }}
                                </div> -->
                                <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    1 {{ rate.fromCurrency }} = {{ rate.rate.toFixed(2) }} {{ rate.toCurrency }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bank Exposure Summary -->
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                             <BuildingLibraryIcon class="w-5 h-5 text-primary-500" />
                             Bank Exposure Analysis
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-900/30">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Financial Institution</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Value ({{ baseCurrency }})</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Portfolio Share (%)</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visual Share</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="bank in bankExposureData" :key="bank.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-primary-600">
                                                {{ bank.name.charAt(0) }}
                                            </div>
                                            {{ bank.name }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-right">
                                        <!-- Currency Breakdown -->
                                        <div class="space-y-1">
                                            <div v-for="(amount, currency) in bank.currencyBreakdown" :key="currency" class="flex items-center justify-end gap-2">
                                                <span class="text-xs text-gray-500 dark:text-gray-400">{{ currency }}:</span>
                                                <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatCurrency(amount, String(currency)) }}</span>
                                            </div>
                                            <div class="pt-1 mt-1 border-t border-gray-200 dark:border-gray-600">
                                                <span class="text-xs text-gray-500 dark:text-gray-400">Total ({{ baseCurrency }}):</span>
                                                <span class="font-bold text-gray-900 dark:text-white ml-2">{{ formatCurrency(bank.value, baseCurrency) }}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary-600 dark:text-primary-400">
                                        {{ bank.percentage.toFixed(2) }}%
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <div class="flex items-center justify-end gap-3">
                                            <div class="w-32 bg-gray-100 dark:bg-gray-700 rounded-full h-2 shadow-inner overflow-hidden">
                                                <div 
                                                    class="bg-gradient-to-r from-primary-400 to-primary-600 h-full rounded-full transition-all duration-1000" 
                                                    :style="{ width: `${bank.percentage}%` }"
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot class="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <td class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Total Portfolio</td>
                                    <td class="px-6 py-4 text-sm font-black text-right text-gray-900 dark:text-white border-t-2 border-primary-500">
                                        {{ formatCurrency(totalPrincipalBase, baseCurrency) }}
                                    </td>
                                    <td class="px-6 py-4 text-sm font-black text-right text-primary-600 dark:text-primary-400 border-t-2 border-primary-500">
                                        100.00%
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Exposure Insights -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <h4 class="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2">Diversification Status</h4>
                        <p class="text-xs text-indigo-700 dark:text-indigo-300 italic">
                            {{ bankExposureData.length > 3 ? 'Your portfolio is moderately diversified across multiple institutions.' : 'Your portfolio is highly concentrated in few institutions. Consider further diversification.' }}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
