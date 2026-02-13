<script setup lang="ts">
import { useRoute } from 'vue-router'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon, 
  PresentationChartLineIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()

const navigation = [
  { name: 'FX Exposure', href: '/risk/fx-exposure', icon: ChartBarIcon },
  { name: 'FX Forwards', href: '/risk/fx-forwards', icon: CurrencyDollarIcon },
  { name: 'MTM Valuation', href: '/risk/mtm-valuation', icon: PresentationChartLineIcon },
  { name: 'Hedge Coverage', href: '/risk/hedge-coverage', icon: ShieldCheckIcon },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Main Layout Container matching Reports.vue style -->
    <div class="flex flex-col lg:flex-row gap-6 min-h-[80vh]">
        
        <!-- Sidebar Navigation -->
        <aside class="lg:w-64 flex-shrink-0 space-y-6">
             <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-2 transition-colors">
                <nav class="space-y-1">
                  <router-link 
                    v-for="item in navigation" 
                    :key="item.name" 
                    :to="item.href" 
                    class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all"
                    :class="[
                      route.path.startsWith(item.href) 
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    ]"
                  >
                    <component 
                      :is="item.icon" 
                      class="w-5 h-5"
                      :class="[
                         route.path.startsWith(item.href) ? 'text-primary-500' : 'text-gray-400'
                      ]"
                    />
                    {{ item.name }}
                  </router-link>
                </nav>
             </div>

             <!-- Contextual Filters Placeholder -->
             <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 transition-colors">
                 <div class="flex items-center gap-2 mb-4">
                        <FunnelIcon class="w-4 h-4 text-primary-500" />
                        <h3 class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Risk Parameters</h3>
                  </div>
                  <div class="space-y-4">
                      <p class="text-xs text-gray-500 dark:text-gray-400 italic">
                          Global risk filters (e.g., Value Date, Counterparty) can be applied here to filter all risk modules.
                      </p>
                      <!-- Placeholder functionality -->
                      <button disabled class="w-full py-2 text-xs font-bold text-gray-300 dark:text-gray-600 cursor-not-allowed border border-dashed border-gray-200 dark:border-gray-700 rounded">
                          Coming Soon
                      </button>
                  </div>
             </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 space-y-6">
             <router-view></router-view>
        </main>
    </div>
  </div>
</template>
