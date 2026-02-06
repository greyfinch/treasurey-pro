<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
    BanknotesIcon, 
    ArrowPathRoundedSquareIcon, 
    ShieldCheckIcon,
    Cog6ToothIcon,
    BuildingOfficeIcon,
    BuildingLibraryIcon
} from '@heroicons/vue/24/outline'
import CurrencySettings from './sections/CurrencySettings.vue'
import FXRateSettings from './sections/FXRateSettings.vue'
import SecuritySettings from './sections/SecuritySettings.vue'
import OrganisationSettings from './sections/OrganisationSettings.vue'
import BankSettings from './sections/BankSettings.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
    { id: 'currency', name: 'Currencies', icon: BanknotesIcon, component: CurrencySettings },
    { id: 'fx-rates', name: 'FX Rates', icon: ArrowPathRoundedSquareIcon, component: FXRateSettings },
    { id: 'organisations', name: 'Organisations', icon: BuildingOfficeIcon, component: OrganisationSettings },
    { id: 'banks', name: 'Partner Banks', icon: BuildingLibraryIcon, component: BankSettings },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon, component: SecuritySettings },
]

const activeTab = ref((route.query.tab as string) || 'currency')

watch(() => route.query.tab, (newTab) => {
    if (newTab) activeTab.value = newTab as string
})

const setActiveTab = (id: string) => {
    activeTab.value = id
    router.replace({ query: { ...route.query, tab: id } })
}

const activeComponent = computed(() => {
    return tabs.find(t => t.id === activeTab.value)?.component || CurrencySettings
})
</script>

<template>
    <div class="min-h-screen">
        <header class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Cog6ToothIcon class="w-7 h-7 text-gray-400" />
                Account Settings
            </h1>
            <p class="text-gray-500 text-sm mt-1">Manage your system preferences and security</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <!-- Sidebar -->
            <aside class="lg:col-span-1">
                <nav class="space-y-1 bg-white p-2 rounded-xl border border-gray-100 shadow-sm sticky top-24">
                    <button
                        v-for="tab in tabs"
                        :key="tab.id"
                        @click="setActiveTab(tab.id)"
                        :class="[
                            'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                            activeTab === tab.id 
                                ? 'bg-primary-50 text-primary-700 shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        ]"
                    >
                        <component :is="tab.icon" class="w-5 h-5" />
                        {{ tab.name }}
                    </button>
                </nav>
            </aside>

            <!-- Content Area -->
            <main class="lg:col-span-3">
                <div class="bg-gray-50/50 rounded-2xl p-6 lg:p-8 min-h-[600px] border border-dashed border-gray-200">
                    <transition 
                        name="fade" 
                        mode="out-in"
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 translate-y-2"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 translate-y-2"
                    >
                        <component :is="activeComponent" />
                    </transition>
                </div>
            </main>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>
