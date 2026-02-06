<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
    ClockIcon, 
    EnvelopeIcon,
    BellAlertIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { mockService } from '../../../services/mockData'
import type { NotificationSettings } from '../../../services/mockData'

const settings = ref<NotificationSettings>({
    maturityDays: 1,
    liquidityDays: 7,
    enableEmail: true,
    enableInApp: true
})

const loading = ref(true)
const saving = ref(false)
const showSuccess = ref(false)

const fetchSettings = async () => {
    loading.value = true
    try {
        const data = await mockService.getNotificationSettings()
        settings.value = data
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    saving.value = true
    try {
        await mockService.updateNotificationSettings(settings.value)
        showSuccess.value = true
        setTimeout(() => {
            showSuccess.value = false
        }, 3000)
    } finally {
        saving.value = false
    }
}

onMounted(fetchSettings)
</script>

<template>
    <div class="max-w-4xl mx-auto">
        <div class="mb-8">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure how and when you want to be alerted about your investments.</p>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <ArrowPathIcon class="w-8 h-8 text-primary-600 animate-spin" />
        </div>

        <div v-else class="space-y-6">
            <!-- Alert Timings -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div class="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClockIcon class="w-4 h-4 text-amber-500" />
                        Alert Timings
                    </h3>
                </div>
                <div class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Maturity Notification Lead Time
                            </label>
                            <div class="relative">
                                <input 
                                    v-model.number="settings.maturityDays"
                                    type="number"
                                    min="1"
                                    max="30"
                                    class="block text-gray-900 dark:text-white w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-900 transition-colors"
                                />
                                <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    Days before maturity
                                </div>
                            </div>
                            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                                When notifications should start appearing for upcoming maturity.
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Liquidity Warning Threshold
                            </label>
                            <div class="relative">
                                <input 
                                    v-model.number="settings.liquidityDays"
                                    type="number"
                                    min="1"
                                    max="60"
                                    class="block text-gray-900 dark:text-white w-full px-4 py-3 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-900 transition-colors"
                                />
                                <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    Days before liquid
                                </div>
                            </div>
                            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                                Lead time for planning liquidity across the group.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Channels -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div class="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BellAlertIcon class="w-4 h-4 text-indigo-500" />
                        Notification Channels
                    </h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 rounded-xl border border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <BellAlertIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-gray-900 dark:text-white">In-App Notifications</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Show alerts in the header notification bell.</p>
                                </div>
                            </div>
                            <button 
                                @click="settings.enableInApp = !settings.enableInApp"
                                :class="[
                                    'w-12 h-6 rounded-full transition-colors relative',
                                    settings.enableInApp ? 'bg-primary-600' : 'bg-gray-200'
                                ]"
                            >
                                <span 
                                    :class="[
                                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                                        settings.enableInApp ? 'left-7' : 'left-1'
                                    ]"
                                />
                            </button>
                        </div>

                        <div class="flex items-center justify-between p-4 rounded-xl border border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                    <EnvelopeIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-gray-900 dark:text-white">Email Alerts</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Receive summaries of upcoming maturities via email.</p>
                                </div>
                            </div>
                            <button 
                                @click="settings.enableEmail = !settings.enableEmail"
                                :class="[
                                    'w-12 h-6 rounded-full transition-colors relative',
                                    settings.enableEmail ? 'bg-primary-600' : 'bg-gray-200'
                                ]"
                            >
                                <span 
                                    :class="[
                                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                                        settings.enableEmail ? 'left-7' : 'left-1'
                                    ]"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Action -->
            <div class="flex items-center justify-end gap-4">
                <transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 translate-x-4"
                    enter-to-class="opacity-100 translate-x-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="opacity-100 translate-x-0"
                    leave-to-class="opacity-0 translate-x-4"
                >
                    <div v-if="showSuccess" class="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-bold">
                        <CheckCircleIcon class="w-5 h-5 transition-colors" />
                        Settings saved!
                    </div>
                </transition>
                
                <button 
                    @click="handleSave"
                    :disabled="saving"
                    class="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <ArrowPathIcon v-if="saving" class="w-5 h-5 animate-spin" />
                    Save Changes
                </button>
            </div>
        </div>
    </div>
</template>
