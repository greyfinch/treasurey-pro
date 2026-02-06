<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon, BuildingOfficeIcon, BanknotesIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../services/mockData'
import type { Organisation, Investment } from '../../services/mockData'
import { formatDate, formatCurrency, formatPercentage } from '../../utils/dateHelpers'
import { calculatePortfolioROI } from '../../utils/roi'
import KPICard from '../../components/KPICard.vue'
import ROILineChart from '../../components/ROILineChart.vue'
import DateFilter from '../../components/DateFilter.vue'
import FilterPanel from '../../components/FilterPanel.vue'
import ExportButtons from '../../components/ExportButtons.vue'
import { exportToExcel, exportToCSV } from '../../utils/export'
import dayjs from 'dayjs'

const route = useRoute()
const organisation = ref<Organisation | null>(null)
const investments = ref<Investment[]>([])
const banks = ref<any[]>([])
const fxRates = ref<any[]>([])
const currencies = ref<any[]>([])
const loading = ref(true)
const targetDate = ref(new Date())

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const selectedCurrency = ref('')

const fetchData = async () => {
    loading.value = true
    try {
        const id = route.params.id as string
        const [orgData, invData, bankData, fxData, currData] = await Promise.all([
            mockService.getOrganisationById(id),
            mockService.getInvestmentsByOrganisationId(id),
            mockService.getBanks(),
            mockService.getFXRates(),
            mockService.getCurrencies()
        ])
        organisation.value = orgData || null
        investments.value = invData
        banks.value = bankData
        fxRates.value = fxData
        currencies.value = currData
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)

// Computed Properties
const filteredInvestments = computed(() => {
    return investments.value.filter(inv => {
        const matchBank = !selectedBankId.value || inv.bankId === selectedBankId.value
        const matchStatus = !selectedStatus.value || inv.status === selectedStatus.value
        const matchCurrency = !selectedCurrency.value || inv.currency === selectedCurrency.value
        return matchBank && matchStatus && matchCurrency
    })
})

const baseCurrency = computed(() => organisation.value?.baseCurrency || 'NGN')

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

// Actions
const handleExportExcel = () => {
    exportToExcel(filteredInvestments.value, `subsidiary_report_${organisation.value?.name}_${dayjs(targetDate.value).format('YYYY-MM-DD')}`)
}

const handleExportCSV = () => {
    exportToCSV(filteredInvestments.value, `subsidiary_report_${organisation.value?.name}_${dayjs(targetDate.value).format('YYYY-MM-DD')}`)
}

const clearFilters = () => {
    selectedBankId.value = ''
    selectedStatus.value = ''
    selectedCurrency.value = ''
}
</script>

<template>
    <div class="space-y-6">
        <!-- Back Button & Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <router-link 
                to="/subsidiaries"  
                class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeftIcon class="w-4 h-4" /> Back to Subsidiaries
            </router-link>
            
            <div v-if="organisation" class="flex items-center gap-3">
                 <DateFilter v-model="targetDate" />
                 <ExportButtons @export-excel="handleExportExcel" @export-csv="handleExportCSV" />
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <template v-else-if="organisation">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center gap-4">
                    <div class="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                        <BuildingOfficeIcon class="w-8 h-8" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">{{ organisation.name }} Dashboard</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span :class="[
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                organisation.type === 'GROUP' ? 'bg-indigo-100 text-indigo-700' : 'bg-primary-100 text-primary-700'
                            ]">
                                {{ organisation.type }}
                            </span>
                            <span class="text-xs text-gray-500 font-mono">Reporting Base: {{ baseCurrency }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPICard 
                    label="Total Invested Principal" 
                    :value="formatCurrency(totalPrincipalBase, baseCurrency)" 
                />
                <KPICard 
                    label="Accrued ROI (Selected Date)" 
                    :value="formatCurrency(totalROIBase, baseCurrency)"
                    trend-label="Returns calculated up to selected date"
                />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- Main Content Area -->
                <div class="lg:col-span-3 space-y-6">
                    <!-- Chart -->
                    <div class="card bg-white">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <ArrowTrendingUpIcon class="w-5 h-5 text-primary-500" />
                                Subsidiary ROI Growth
                            </h3>
                        </div>
                        <ROILineChart 
                            :investments="filteredInvestments" 
                            :base-currency="baseCurrency"
                            :fx-rates="fxRates"
                        />
                    </div>

                    <!-- Investment List -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                            <h2 class="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <BanknotesIcon class="w-5 h-5 text-gray-400" />
                                Active Investments
                            </h2>
                            <span class="text-xs font-medium px-2 py-1 bg-white rounded border border-gray-200 text-gray-500">
                                {{ filteredInvestments.length }} records
                            </span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50 uppercase text-[10px] font-bold tracking-wider text-gray-500">
                                    <tr>
                                        <th class="px-6 py-4 text-left">Bank</th>
                                        <th class="px-6 py-4 text-left">Principal</th>
                                        <th class="px-6 py-4 text-left">Rate</th>
                                        <th class="px-6 py-4 text-left">Maturity</th>
                                        <th class="px-6 py-4 text-left">Status</th>
                                        <th class="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 bg-white">
                                    <tr v-for="inv in filteredInvestments" :key="inv.id" class="hover:bg-gray-50 transition-colors">
                                        <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                                            {{ inv.bank.name }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-700">
                                            {{ formatCurrency(inv.principal, inv.currency) }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-600">
                                            {{ formatPercentage(inv.dailyRate) }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-600">
                                            {{ formatDate(inv.maturityDate) }}
                                        </td>
                                        <td class="px-6 py-4">
                                            <span :class="[
                                                'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
                                                inv.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                                inv.status === 'MATURED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            ]">
                                                {{ inv.status }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <router-link 
                                                :to="`/investments/${inv.id}`"
                                                class="text-primary-600 hover:text-primary-800 text-xs font-bold"
                                            >
                                                View Detail
                                            </router-link>
                                        </td>
                                    </tr>
                                    <tr v-if="filteredInvestments.length === 0">
                                        <td colspan="6" class="px-6 py-10 text-center text-sm text-gray-500 italic">
                                            No investments matching criteria.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
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
                        @clear="clearFilters"
                    />
                </div>
            </div>
        </template>

        <div v-else class="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p class="text-gray-500">Subsidiary not found.</p>
            <router-link to="/subsidiaries" class="text-primary-600 hover:underline mt-2 inline-block">Return to list</router-link>
        </div>
    </div>
</template>
