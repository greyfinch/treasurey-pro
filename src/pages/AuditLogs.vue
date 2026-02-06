<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mockService } from '../services/mockData'
import type { AuditLog } from '../services/mockData'
import { formatCurrency } from '../utils/dateHelpers'
import { ClipboardDocumentIcon, ShieldCheckIcon, EyeIcon } from '@heroicons/vue/24/outline'
import AuditDetailsModal from '../components/AuditDetailsModal.vue'

const logs = ref<AuditLog[]>([])
const loading = ref(true)
const selectedLog = ref<AuditLog | null>(null)
const isModalOpen = ref(false)

onMounted(async () => {
    try {
        logs.value = await mockService.getAuditLogs()
    } finally {
        loading.value = false
    }
})

const openDetails = (log: AuditLog) => {
    selectedLog.value = log
    isModalOpen.value = true
}

const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 bg-green-50 border-green-100 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800'
    if (action.includes('terminate')) return 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800'
    if (action.includes('withdrawal')) return 'text-orange-600 bg-orange-50 border-orange-100 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-800'
    if (action.includes('edit')) return 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800'
    return 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800'
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Security and activity trail for the organisation</p>
            </div>
            <div class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs font-semibold">
                <ShieldCheckIcon class="w-4 h-4" />
                RBAC ENFORCED
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div v-if="logs.length === 0" class="p-20 text-center">
                <ClipboardDocumentIcon class="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p class="text-gray-500 dark:text-gray-400">No actions recorded yet.</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Audit logs are generated when you perform sensitive actions like creating investments or recordings withdrawals.</p>
            </div>
            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {{ new Date(log.timestamp).toLocaleString() }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ log.userName }}</span>
                                    <span class="text-xs text-gray-400 dark:text-gray-500 capitalize">{{ log.userRole.toLowerCase().replace(/_/g, ' ') }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="['px-2 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider', getActionColor(log.action)]">
                                    {{ log.action.replace(':', ' ') }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                <div v-if="log.action === 'investment:create'">
                                    Principal: <span class="font-semibold">{{ formatCurrency(log.details.principal) }}</span> at {{ log.details.bank?.name }}
                                </div>
                                <div v-else-if="log.action === 'withdrawal:create'">
                                    Amount: <span class="font-semibold text-red-600 dark:text-red-400">{{ formatCurrency(log.details.amount) }}</span>
                                </div>
                                <div v-else-if="log.action === 'rollover:create'">
                                    Injection: <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(log.details.amount) }}</span>
                                </div>
                                <div v-else-if="log.action === 'investment:terminate'">
                                    Terminated Investment ID: <span class="font-mono text-[10px]">{{ log.details.investmentId.substring(0, 8) }}...</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                    @click="openDetails(log)"
                                    class="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-semibold transition-colors"
                                >
                                    <EyeIcon class="w-4 h-4" />
                                    View
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Details Modal -->
        <AuditDetailsModal 
            :is-open="isModalOpen"
            :log="selectedLog"
            @close="isModalOpen = false"
        />
    </div>
</template>
