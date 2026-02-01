<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockService } from '../../services/mockData'
import { calculateDailyROI, calculateInvestmentROI } from '../../utils/roi'
import { formatDate, formatCurrency, formatPercentage } from '../../utils/dateHelpers'
import { ArrowLeftIcon, BanknotesIcon, ArrowPathIcon, XMarkIcon, TrashIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const investment = ref<any>(null)
const loading = ref(true)

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

onMounted(async () => {
    try {
        const id = route.params.id as string
        const data = await mockService.getInvestmentById(id)
        if (data) {
            investment.value = data
        } else {
            router.push('/')
        }
    } finally {
        loading.value = false
    }
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

const dailyBreakdown = computed(() => {
    if (!investment.value) return []
    // Show last 30 days breakdown
    return calculateDailyROI({
        investment: investment.value,
        startDate: dayjs(targetDate.value).subtract(30, 'day').toDate(),
        endDate: targetDate.value
    })
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
            class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
            <ArrowLeftIcon class="w-4 h-4" /> Back to Investments
        </router-link>

        <!-- Header -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ investment.bank.name }} Investment</h1>
                    <p class="text-sm text-gray-500">ID: {{ investment.id }}</p>
                </div>
                <div class="flex items-center gap-2">
                     <button 
                        v-if="investment.status === 'ACTIVE'"
                        @click="showWithdrawModal = true"
                        class="px-3 py-1.5 text-sm text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                    >
                        <BanknotesIcon class="w-4 h-4" />
                        Withdraw
                    </button>
                     <button 
                        v-if="investment.status === 'ACTIVE'"
                        @click="showRolloverModal = true"
                        class="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors flex items-center gap-1"
                    >
                        <ArrowPathIcon class="w-4 h-4" />
                        Rollover
                    </button>
                     <button 
                        v-if="investment.status === 'ACTIVE'"
                        @click="showTerminateModal = true"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg border border-red-700 transition-colors flex items-center gap-1"
                    >
                        <TrashIcon class="w-4 h-4" />
                        Terminate
                    </button>
                     <span :class="[
                        'px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide',
                        investment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        investment.status === 'TERMINATED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    ]">
                        {{ investment.status }}
                    </span>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-100 pt-6">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wider">Initial Principal</p>
                    <p class="text-lg font-bold text-gray-900">{{ formatCurrency(investment.principal) }}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wider">Daily Rate</p>
                    <p class="text-lg font-bold text-gray-900">{{ formatPercentage(investment.dailyRate) }}</p>
                </div>
                 <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wider">Start Date</p>
                    <p class="text-lg font-medium text-gray-900">{{ formatDate(investment.startDate) }}</p>
                </div>
                 <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wider">Maturity Date</p>
                    <p class="text-lg font-medium text-gray-900">{{ formatDate(investment.maturityDate) }}</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- ROI Calculator / Preview -->
            <div class="lg:col-span-2 space-y-6">
                <div class="card bg-primary-50 border-primary-100">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-primary-900">ROI Calculator</h3>
                        <input 
                            type="date" 
                            :value="dayjs(targetDate).format('YYYY-MM-DD')"
                            @input="targetDate = new Date(($event.target as HTMLInputElement).value)"
                            class="bg-white border-primary-200 text-primary-900 rounded-lg text-sm"
                        >
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <p class="text-xs text-gray-500 mb-1">Total Accrued Interest</p>
                            <p class="text-2xl font-bold text-money-600">{{ formatCurrency(accumulatedROI) }}</p>
                        </div>
                         <div class="bg-white p-4 rounded-lg shadow-sm">
                            <p class="text-xs text-gray-500 mb-1">Current Principal Balance</p>
                            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(currentPrincipal) }}</p>
                        </div>
                    </div>
                </div>

                <!-- Daily Breakdown Table -->
                <div class="card p-0 overflow-hidden">
                    <div class="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 class="font-semibold text-gray-900">Daily ROI Breakdown (Last 30 Days)</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-500">Principal</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-500">Accrued ROI</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                                <tr v-for="day in dailyBreakdown" :key="day.date">
                                    <td class="px-6 py-3 text-gray-900">{{ dayjs(day.date).format('MMM D, YYYY') }}</td>
                                    <td class="px-6 py-3 text-gray-600">{{ formatCurrency(day.principal) }}</td>
                                    <td class="px-6 py-3 font-medium text-money-600">{{ formatCurrency(day.roi) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Sidebar Info -->
            <div class="space-y-6">
                <!-- Withdrawals -->
                <div class="card bg-white">
                     <h3 class="font-semibold text-gray-900 mb-4">Withdrawal History</h3>
                     <div v-if="investment.withdrawals.length" class="space-y-4">
                        <div 
                            v-for="w in investment.withdrawals" 
                            :key="w.id"
                            class="relative pl-4 border-l-2 border-expense-200 py-1"
                        >
                            <div class="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-expense-500"></div>
                            <p class="font-bold text-gray-900">{{ formatCurrency(w.amount) }}</p>
                            <p class="text-xs text-gray-500">{{ formatDate(w.withdrawalDate) }}</p>
                            <p v-if="w.fee > 0" class="text-xs text-expense-600 mt-1">Fee: {{ formatCurrency(w.fee) }}</p>
                        </div>
                     </div>
                     <div v-else class="text-sm text-gray-500 italic">No withdrawals recorded.</div>
                </div>

                <!-- Rollovers -->
                 <div class="card bg-white">
                     <h3 class="font-semibold text-gray-900 mb-4">Rollover History</h3>
                     <div v-if="investment.rollovers && investment.rollovers.length" class="space-y-4">
                        <div 
                            v-for="r in investment.rollovers" 
                            :key="r.id"
                            class="relative pl-4 border-l-2 border-primary-200 py-1"
                        >
                            <div class="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                            <p class="font-bold text-gray-900">+{{ formatCurrency(r.amount) }}</p>
                            <p class="text-xs text-gray-500">{{ formatDate(r.date) }}</p>
                        </div>
                     </div>
                     <div v-else class="text-sm text-gray-500 italic">No rollovers recorded.</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Withdrawal Modal -->
    <div v-if="showWithdrawModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">Record Withdrawal</h3>
                        <button @click="showWithdrawModal = false" class="text-gray-400 hover:text-gray-500">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <form @submit.prevent="handleWithdrawal" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Amount</label>
                             <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 sm:text-sm">₦</span>
                                </div>
                                <input type="number" v-model="withdrawalForm.amount" required class="focus:ring-expense-500 focus:border-expense-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" v-model="withdrawalForm.withdrawalDate" required class="mt-1 focus:ring-expense-500 focus:border-expense-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Fee (Optional)</label>
                             <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 sm:text-sm">₦</span>
                                </div>
                                <input type="number" v-model="withdrawalForm.fee" class="focus:ring-expense-500 focus:border-expense-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00">
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-6">
                            <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-expense-600 text-base font-medium text-white hover:bg-expense-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-expense-500 sm:text-sm disabled:opacity-50">
                                {{ isSubmitting ? 'Recording...' : 'Confirm Withdrawal' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Rollover Modal -->
    <div v-if="showRolloverModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">Record Rollover (Injection)</h3>
                        <button @click="showRolloverModal = false" class="text-gray-400 hover:text-gray-500">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <form @submit.prevent="handleRollover" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Additional Principal</label>
                             <div class="mt-1 relative rounded-md shadow-sm">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 sm:text-sm">₦</span>
                                </div>
                                <input type="number" v-model="rolloverForm.amount" required class="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" v-model="rolloverForm.date" required class="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border">
                        </div>
                        <div class="mt-5 sm:mt-6">
                            <button type="submit" :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50">
                                {{ isSubmitting ? 'Recording...' : 'Confirm Rollover' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Terminate Confirmation Modal -->
    <div v-if="showTerminateModal" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <TrashIcon class="h-6 w-6 text-red-600" />
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Terminate Investment
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
                                    Are you sure you want to terminate this investment? This action will change the status to TERMINATED and cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button 
                        type="button" 
                        @click="handleTerminate" 
                        :disabled="isSubmitting"
                        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                        {{ isSubmitting ? 'Terminating...' : 'Terminate' }}
                    </button>
                    <button 
                        type="button" 
                        @click="showTerminateModal = false" 
                        :disabled="isSubmitting"
                        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
