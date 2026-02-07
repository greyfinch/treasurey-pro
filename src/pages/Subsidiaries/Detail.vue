<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon, BuildingOfficeIcon, BanknotesIcon, ArrowTrendingUpIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { mockService, CurrencyCode } from '../../services/mockData'
import type { Organisation, Investment, BankBalance, BalanceHistory } from '../../services/mockData'
import { formatDate, formatCurrency, formatPercentage } from '../../utils/dateHelpers'
import { calculatePortfolioROI } from '../../utils/roi'
import KPICard from '../../components/KPICard.vue'
import ROILineChart from '../../components/ROILineChart.vue'
import DateFilter from '../../components/DateFilter.vue'
import FilterPanel from '../../components/FilterPanel.vue'
import UpdateBalanceModal from '../../components/UpdateBalanceModal.vue'
import AddBankBalanceModal from '../../components/AddBankBalanceModal.vue'
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
const bankBalances = ref<BankBalance[]>([])
const selectedBalance = ref<BankBalance | null>(null)
const showUpdateModal = ref(false)
const showAddModal = ref(false)
const expandedHistory = ref<string | null>(null)
const balanceHistory = ref<Record<string, BalanceHistory[]>>({})

// Filters
const selectedBankId = ref('')
const selectedStatus = ref('')
const selectedCurrency = ref('')
const maturityDateStart = ref('')
const maturityDateEnd = ref('')

const fetchData = async () => {
    loading.value = true
    try {
        const id = route.params.id as string
        const [orgData, invData, bankData, fxData, currData, balData] = await Promise.all([
            mockService.getOrganisationById(id),
            mockService.getInvestmentsByOrganisationId(id),
            mockService.getBanks(),
            mockService.getFXRates(),
            mockService.getCurrencies(),
            mockService.getBankBalancesByOrganisationId(id)
        ])
        organisation.value = orgData || null
        investments.value = invData
        banks.value = bankData
        fxRates.value = fxData
        currencies.value = currData
        bankBalances.value = balData
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
        
        const invMaturity = dayjs(inv.maturityDate)
        const matchMaturityStart = !maturityDateStart.value || invMaturity.isAfter(dayjs(maturityDateStart.value).subtract(1, 'day'), 'day')
        const matchMaturityEnd = !maturityDateEnd.value || invMaturity.isBefore(dayjs(maturityDateEnd.value).add(1, 'day'), 'day')
        
        return matchBank && matchStatus && matchCurrency && matchMaturityStart && matchMaturityEnd
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
    maturityDateStart.value = ''
    maturityDateEnd.value = ''
}

const openUpdateModal = (balance: BankBalance) => {
    selectedBalance.value = balance
    showUpdateModal.value = true
}

const handleUpdateBalance = async (newBalance: number, notes: string) => {
    if (!selectedBalance.value) return
    
    try {
        await mockService.updateBankBalance(selectedBalance.value.id, newBalance, notes)
        await fetchData() // Refresh data
        showUpdateModal.value = false
        selectedBalance.value = null
    } catch (err: any) {
        alert(err.message || 'Failed to update balance')
    }
}

const handleAddBalance = async (bankId: string, currency: string, initialBalance: number) => {
    if (!organisation.value) return
    
    try {
        await mockService.addBankBalance(organisation.value.id, bankId, currency as CurrencyCode, initialBalance)
        await fetchData() // Refresh data
        showAddModal.value = false
    } catch (err: any) {
        alert(err.message || 'Failed to add bank balance')
    }
}

const toggleHistory = async (balanceId: string) => {
    if (expandedHistory.value === balanceId) {
        expandedHistory.value = null
        return
    }
    
    expandedHistory.value = balanceId
    if (!balanceHistory.value[balanceId]) {
        const history = await mockService.getBalanceHistory(balanceId)
        balanceHistory.value[balanceId] = history
    }
}

const getBankName = (bankId: string) => {
    return banks.value.find(b => b.id === bankId)?.name || 'Unknown Bank'
}
</script>

<template>
    <div class="space-y-6">
        <!-- Back Button & Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <router-link 
                to="/subsidiaries"  
                class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <BuildingOfficeIcon class="w-8 h-8" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ organisation.name }} Dashboard</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span :class="[
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                organisation.type === 'GROUP' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            ]">
                                {{ organisation.type }}
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">Reporting Base: {{ baseCurrency }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bank Balances Section -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div class="p-4 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BanknotesIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        Bank Account Balances
                    </h2>
                    <span class="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        {{ bankBalances.length }} accounts
                    </span>
                    <button 
                         @click="showAddModal = true"
                         class="ml-auto text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors flex items-center gap-1"
                    >
                        <PlusIcon class="w-4 h-4" /> Add Account
                    </button>
                </div>

                <div v-if="bankBalances.length === 0" class="p-8 text-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400 italic">No bank balances recorded yet.</p>
                </div>

                <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
                    <div v-for="balance in bankBalances" :key="balance.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <div class="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-bold">
                                        {{ getBankName(balance.bankId).charAt(0) }}
                                    </div>
                                    <div>
                                        <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ getBankName(balance.bankId) }}</h3>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ balance.currency }}</p>
                                    </div>
                                </div>
                                <div class="ml-13">
                                    <p class="text-2xl font-black text-gray-900 dark:text-white">{{ formatCurrency(balance.balance, balance.currency) }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last updated: {{ formatDate(balance.lastUpdated) }}</p>
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <button 
                                    @click="openUpdateModal(balance)"
                                    class="px-4 py-2 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors"
                                >
                                    Update Balance
                                </button>
                                <button 
                                    @click="toggleHistory(balance.id)"
                                    class="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                                >
                                    {{ expandedHistory === balance.id ? 'Hide' : 'View' }} History
                                </button>
                            </div>
                        </div>

                        <!-- History Section -->
                        <div v-if="expandedHistory === balance.id" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h4 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Update History</h4>
                            <div v-if="balanceHistory[balance.id]?.length" class="space-y-2">
                                <div v-for="history in balanceHistory[balance.id]" :key="history.id" class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div class="flex items-start justify-between mb-2">
                                        <div class="flex-1">
                                            <p class="text-xs font-bold text-gray-900 dark:text-white">
                                                {{ formatCurrency(history.previousBalance, balance.currency) }} 
                                                <span class="text-gray-400 dark:text-gray-500 mx-1">→</span>
                                                {{ formatCurrency(history.newBalance, balance.currency) }}
                                            </p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ history.updatedBy }}</p>
                                        </div>
                                        <span :class="[
                                            'text-xs font-bold',
                                            history.newBalance > history.previousBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        ]">
                                            {{ history.newBalance > history.previousBalance ? '+' : '' }}{{ formatCurrency(history.newBalance - history.previousBalance, balance.currency) }}
                                        </span>
                                    </div>
                                    <p class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(history.updatedAt) }}</p>
                                    <p v-if="history.notes" class="text-xs text-gray-500 dark:text-gray-400 italic mt-2">{{ history.notes }}</p>
                                </div>
                            </div>
                            <p v-else class="text-xs text-gray-500 dark:text-gray-400 italic">No history available</p>
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
                    <div class="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 transition-colors">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                        <div class="p-4 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <h2 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BanknotesIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                Active Investments
                            </h2>
                            <span class="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                {{ filteredInvestments.length }} records
                            </span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th class="px-6 py-4 text-left">Bank</th>
                                        <th class="px-6 py-4 text-left">Principal</th>
                                        <th class="px-6 py-4 text-left">Rate</th>
                                        <th class="px-6 py-4 text-left">Maturity</th>
                                        <th class="px-6 py-4 text-left">Status</th>
                                        <th class="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    <tr v-for="inv in filteredInvestments" :key="inv.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-gray-100 dark:border-gray-700">
                                        <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                            {{ inv.bank.name }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {{ formatCurrency(inv.principal, inv.currency) }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {{ formatPercentage(inv.dailyRate) }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {{ formatDate(inv.maturityDate) }}
                                        </td>
                                        <td class="px-6 py-4">
                                            <span :class="[
                                                'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
                                                inv.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                                inv.status === 'MATURED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            ]">
                                                {{ inv.status }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <router-link 
                                                :to="`/investments/${inv.id}`"
                                                class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xs font-bold transition-colors"
                                            >
                                                View Detail
                                            </router-link>
                                        </td>
                                    </tr>
                                    <tr v-if="filteredInvestments.length === 0">
                                        <td colspan="6" class="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400 italic">
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
                        v-model:maturity-date-start="maturityDateStart"
                        v-model:maturity-date-end="maturityDateEnd"
                        @clear="clearFilters"
                    />
                </div>
            </div>
        </template>

        <div v-else class="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <p class="text-gray-500 dark:text-gray-400">Subsidiary not found.</p>
            <router-link to="/subsidiaries" class="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">Return to list</router-link>
        </div>

        <!-- Update Balance Modal -->
        <UpdateBalanceModal 
            v-if="showUpdateModal && selectedBalance"
            :balance="selectedBalance"
            :bank-name="getBankName(selectedBalance.bankId)"
            @close="showUpdateModal = false; selectedBalance = null"
            @update="handleUpdateBalance"
        />

        <!-- Add Balance Modal -->
        <AddBankBalanceModal 
            v-if="showAddModal"
            :banks="banks"
            :currencies="currencies"
            @close="showAddModal = false"
            @add="handleAddBalance"
        />
    </div>
</template>
