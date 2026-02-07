<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import KPICard from '../components/KPICard.vue'
import ROILineChart from '../components/ROILineChart.vue'
import DateFilter from '../components/DateFilter.vue'
import FilterPanel from '../components/FilterPanel.vue'
import { mockService } from '../services/mockData'
import { calculatePortfolioROI } from '../utils/roi'
import { exportToExcel, exportToCSV } from '../utils/export'
import { formatCurrency } from '../utils/dateHelpers'
import { ArrowTrendingUpIcon, BuildingOffice2Icon, DocumentChartBarIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
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
    if (activeOrganisation.value.type === 'GROUP') return investments.value
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
        const subInvs = investments.value.filter(inv => inv.organisationId === sub.id)
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
    maturityDateStart.value = ''
    maturityDateEnd.value = ''
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DocumentChartBarIcon class="w-7 h-7 text-primary-600" />
                    Treasury Reports
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Advanced portfolio analytics and comprehensive data export</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                 <DateFilter v-model="targetDate" />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Filter Sidebar -->
            <div class="lg:col-span-1 space-y-4">
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

                <!-- Export Card -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Bulk Export Options</h3>
                    <div class="space-y-3">
                        <button 
                            @click="handleExportExcel"
                            class="w-full flex items-center justify-between px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                            <span class="text-sm font-semibold">Export to Excel</span>
                            <ChevronDownIcon class="w-4 h-4" />
                        </button>
                        <button 
                            @click="handleExportCSV"
                            class="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <span class="text-sm font-semibold">Export to CSV</span>
                            <ChevronDownIcon class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Statistics & Analytics -->
            <div class="lg:col-span-3 space-y-6">
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

                <!-- Detailed Records info -->
                <div class="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                    <DocumentChartBarIcon class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <h4 class="text-sm font-bold text-gray-900 dark:text-white">Reporting Database Ready</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto italic">
                        The current view is based on {{ filteredInvestments.length }} active investment records matching your filters. Use the export options to download raw data for further analysis.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
