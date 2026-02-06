<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    isOpen: boolean,
    log: any | null
}>()

const emit = defineEmits(['close'])

const formatValue = (val: any) => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 class="text-lg font-bold text-gray-900">Audit Log Details</h3>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-6">
                <!-- Meta Info -->
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Action</p>
                        <p class="text-sm font-semibold text-gray-900 capitalize">{{ log?.action.replace(':', ' ') }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Performed By</p>
                        <p class="text-sm font-semibold text-gray-900">{{ log?.userName }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Timestamp</p>
                        <p class="text-xs text-gray-600">{{ log ? new Date(log.timestamp).toLocaleString() : '-' }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Log ID</p>
                        <p class="text-xs font-mono text-gray-400">{{ log?.id }}</p>
                    </div>
                </div>

                <!-- Changes Table -->
                <div v-if="log?.changes && log.changes.length > 0">
                    <h4 class="text-sm font-bold text-gray-700 mb-3">Field Changes</h4>
                    <div class="border border-gray-100 rounded-lg overflow-hidden">
                        <table class="min-w-full divide-y divide-gray-100">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Field</th>
                                    <th class="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Previous Value</th>
                                    <th class="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">New Value</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="change in log.changes" :key="change.field">
                                    <td class="px-4 py-3 text-xs font-medium text-gray-900">{{ change.field }}</td>
                                    <td class="px-4 py-3 text-xs text-red-600 bg-red-50/30 line-through">{{ formatValue(change.old) }}</td>
                                    <td class="px-4 py-3 text-xs text-green-700 bg-green-50/30 font-semibold">{{ formatValue(change.new) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Raw Details (if no specific changes tracked) -->
                <div v-else>
                    <h4 class="text-sm font-bold text-gray-700 mb-3">Action Details</h4>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-[11px] overflow-auto max-h-48 font-mono">{{ JSON.stringify(log?.details, null, 2) }}</pre>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button @click="$emit('close')" class="btn-secondary text-sm">Close</button>
            </div>
        </div>
    </div>
</template>
