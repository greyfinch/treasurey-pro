<script setup lang="ts">
import { useRoute } from 'vue-router'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon, 
  PresentationChartLineIcon 
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
  <div class="flex h-[calc(100vh-64px)]"> <!-- Subtract Topbar Height -->
    <!-- Sidebar -->
    <div class="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 dark:lg:border-gray-800 bg-white dark:bg-gray-900">
      <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div class="px-6 mb-6">
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Modules</h2>
        </div>
        <nav class="flex-1 px-4 space-y-1">
          <router-link 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href" 
            class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              route.path.startsWith(item.href) 
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            ]"
          >
            <component 
              :is="item.icon" 
              class="mr-3 flex-shrink-0 h-6 w-6" 
              :class="[
                route.path.startsWith(item.href) 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
              ]" 
              aria-hidden="true" 
            />
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
      <router-view></router-view>
    </div>
  </div>
</template>
