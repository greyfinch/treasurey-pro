<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BellIcon, ClockIcon, CurrencyDollarIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../services/mockData'
import type { Notification } from '../services/mockData'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const router = useRouter()
const notifications = ref<Notification[]>([])
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const fetchNotifications = async () => {
    notifications.value = await mockService.getNotifications()
}

const handleNotificationClick = (notif: Notification) => {
    if (notif.link) {
        router.push({ path: notif.link.path, query: notif.link.query })
        showDropdown.value = false
    }
}

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
    if (showDropdown.value) {
        fetchNotifications()
    }
}

const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        showDropdown.value = false
    }
}

onMounted(() => {
    fetchNotifications()
    document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
})

const getIcon = (type: string) => {
    switch (type) {
        case 'maturity': return ClockIcon
        case 'liquidity': return CurrencyDollarIcon
        default: return InformationCircleIcon
    }
}

const getTypeStyles = (type: string) => {
    switch (type) {
        case 'maturity': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
        case 'liquidity': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
        default: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
    }
}
</script>

<template>
    <div class="relative" ref="dropdownRef">
        <!-- Bell Icon -->
        <button 
            @click="toggleDropdown"
            class="relative p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-all focus:outline-none"
        >
            <BellIcon class="w-6 h-6" />
            <span 
                v-if="notifications.length > 0"
                class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-gray-900"
            >
                {{ notifications.length }}
            </span>
        </button>

        <!-- Dropdown -->
        <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
        >
            <div 
                v-if="showDropdown"
                class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[60] overflow-hidden"
            >
                <div class="px-4 py-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <span class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                        {{ notifications.length }} Alerts
                    </span>
                </div>

                <div class="max-h-[400px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                    <div 
                        v-for="notif in notifications" 
                        :key="notif.id"
                        @click="handleNotificationClick(notif)"
                        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                    >
                        <div class="flex gap-3">
                            <div :class="['flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center', getTypeStyles(notif.type)]">
                                <component :is="getIcon(notif.type)" class="w-5 h-5" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {{ notif.title }}
                                </p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                                    {{ notif.description }}
                                </p>
                                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                                    <ClockIcon class="w-3 h-3" />
                                    {{ dayjs(notif.timestamp).fromNow() }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="notifications.length === 0" class="p-8 text-center">
                        <BellIcon class="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">No new notifications</p>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">We'll alert you when investments approach maturity.</p>
                    </div>
                </div>

                <div v-if="notifications.length > 0" class="px-4 py-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 text-center">
                    <button class="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 uppercase tracking-widest transition-colors">
                        Clear All
                    </button>
                </div>
            </div>
        </transition>
    </div>
</template>
