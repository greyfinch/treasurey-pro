<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon} from '@heroicons/vue/24/outline'
import { riskService, type FXForward, type FXForwardDirection } from '../../services/riskService'
import dayjs from 'dayjs'

const forwards = ref<FXForward[]>([])
const showCreateModal = ref(false)
const isLoading = ref(false)

// Form State
const newForward = ref({
  counterparty: '',
  baseCurrency: 'USD',
  quoteCurrency: 'NGN',
  direction: 'BUY_BASE' as FXForwardDirection,
  notionalAmount: 0,
  forwardRate: 0,
  tradeDate: dayjs().format('YYYY-MM-DD'),
  valueDate: dayjs().add(30, 'day').format('YYYY-MM-DD')
})

const fetchForwards = async () => {
    isLoading.value = true
    forwards.value = await riskService.getForwards()
    isLoading.value = false
}

onMounted(() => {
    fetchForwards()
})

const handleCreate = async () => {
    if (newForward.value.notionalAmount <= 0 || newForward.value.forwardRate <= 0) {
        alert('Invalid amount or rate')
        return
    }
    
    await riskService.createForward({
        organizationId: 'org-1', // Mock org
        ...newForward.value
    })
    
    showCreateModal.value = false
    await fetchForwards()
    
    // Reset form
    newForward.value = {
        counterparty: '',
        baseCurrency: 'USD',
        quoteCurrency: 'NGN',
        direction: 'BUY_BASE',
        notionalAmount: 0,
        forwardRate: 0,
        tradeDate: dayjs().format('YYYY-MM-DD'),
        valueDate: dayjs().add(30, 'day').format('YYYY-MM-DD')
    }
}

const handleSettle = async (id: string) => {
    if(confirm('Are you sure you want to settle this contract?')) {
        await riskService.settleForward(id)
        await fetchForwards()
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'
        case 'SETTLED': return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400'
        case 'CANCELLED': return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400'
        default: return 'bg-gray-50 text-gray-600 ring-gray-500/10'
    }
}
</script>

<template>
  <div class="space-y-6">
     <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">FX Forwards</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-400">Manage your active and settled forward contracts.</p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button 
            @click="showCreateModal = true"
            type="button" 
            class="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
            <PlusIcon class="inline-block w-5 h-5 mr-1" />
            New Forward
        </button>
      </div>
    </div>
    
    <!-- List Table -->
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:pl-6">Counterparty</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pair</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Direction</th>
                  <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Notional</th>
                  <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Rate</th>
                  <th scope="col" class="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">MTM (NGN)</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Value Date</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                <tr v-for="fwd in forwards" :key="fwd.id">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{{ fwd.counterparty }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ fwd.baseCurrency }}/{{ fwd.quoteCurrency }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span :class="fwd.direction === 'BUY_BASE' ? 'text-green-600' : 'text-red-600'">
                        {{ fwd.direction === 'BUY_BASE' ? 'Buy' : 'Sell' }} {{ fwd.baseCurrency }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: fwd.baseCurrency }).format(fwd.notionalAmount) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">{{ fwd.forwardRate.toFixed(2) }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-right" :class="(fwd.currentMTM || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(fwd.currentMTM || 0) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ fwd.valueDate }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                     <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset" :class="getStatusColor(fwd.status)">
                        {{ fwd.status }}
                     </span>
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button 
                        v-if="fwd.status === 'ACTIVE'"
                        @click="handleSettle(fwd.id)"
                        class="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                    >
                        Settle<span class="sr-only">, {{ fwd.id }}</span>
                    </button>
                  </td>
                </tr>
                 <tr v-if="forwards.length === 0">
                    <td colspan="9" class="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No forward contracts found. Create one to get started.
                    </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create Modal -->
    <div v-if="showCreateModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div> -->
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto g-gray-500/90 dark:bg-gray-950/90">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div class="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">New Forward Contract</h3>
                        <div class="mt-4 grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Counterparty</label>
                                <input v-model="newForward.counterparty" type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border" placeholder="e.g. Access Bank" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Currency</label>
                                <select v-model="newForward.baseCurrency" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border">
                                    <option>USD</option>
                                    <option>EUR</option>
                                    <option>GBP</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Quote Currency</label>
                                <select v-model="newForward.quoteCurrency" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border">
                                    <option>NGN</option>
                                </select>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Direction</label>
                                <div class="mt-2 flex gap-4">
                                    <label class="inline-flex items-center">
                                        <input type="radio" v-model="newForward.direction" value="BUY_BASE" class="form-radio text-primary-600" />
                                        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Buy Base (Long)</span>
                                    </label>
                                    <label class="inline-flex items-center">
                                        <input type="radio" v-model="newForward.direction" value="SELL_BASE" class="form-radio text-primary-600" />
                                        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Sell Base (Short)</span>
                                    </label>
                                </div>
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Notional Amount</label>
                                <input v-model.number="newForward.notionalAmount" type="number" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border" />
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Forward Rate</label>
                                <input v-model.number="newForward.forwardRate" type="number" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border" />
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Trade Date</label>
                                <input v-model="newForward.tradeDate" type="date" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border" />
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Value Date</label>
                                <input v-model="newForward.valueDate" type="date" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border" />
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button 
                            @click="handleCreate"
                            type="button" 
                            class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                        >
                            Create Forward
                        </button>
                        <button 
                            @click="showCreateModal = false"
                            type="button" 
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>
