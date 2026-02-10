<script setup lang="ts">
import { 
    BanknotesIcon, 
    ChartPieIcon, 
    BuildingOffice2Icon, // Replaced BuildingMultipleIcon with BuildingOffice2Icon
    ShieldCheckIcon,
    DocumentChartBarIcon,
    ClockIcon
} from '@heroicons/vue/24/outline'

const features = [
  {
    name: 'Comprehensive Investment Tracking',
    description: 'Manage diverse asset classes including Treasury Bills, Commercial Papers, Bonds, and Money Market Funds. Get a unified view of your entire portfolio performance.',
    icon: BanknotesIcon,
  },
  {
    name: 'Advanced Analytics & Reporting',
    description: 'Visualize your financial data with interactive charts and generate detailed reports. Track ROI, maturity profiles, and liquidity positions in real-time.',
    icon: ChartPieIcon,
  },
  {
    name: 'Multi-Subsidiary Management',
    description: 'Seamlessly manage treasury operations across multiple subsidiaries or organizations. Centralize control while maintaining granular visibility.',
    icon: BuildingOffice2Icon,
  },
  {
    name: 'Bank-Grade Security',
    description: 'Rest easy knowing your financial data is protected by industry-leading security protocols, encryption, and strict access controls.',
    icon: ShieldCheckIcon,
  },
    {
    name: 'Audit Trails & Compliance',
    description: 'Maintain full accountability with comprehensive audit logs. Track every action and change within the system for regulatory compliance.',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Real-time Market Updates',
    description: 'Stay ahead of the market with real-time updates on rates and maturity alerts. Never miss an opportunity to optimize your investments.',
    icon: ClockIcon,
  },
]
</script>

<template>
  <div class="bg-white dark:bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h2 class="text-base font-semibold leading-7 text-primary-600">Platform Capabilities</h2>
        <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Everything you need to master your treasury</p>
        <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
          TreasuryPro empowers finance teams with a robust set of tools designed to streamline operations and drive growth.
        </p>
      </div>
      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <div v-for="feature in features" :key="feature.name" class="flex flex-col">
            <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
              <component :is="feature.icon" class="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
              {{ feature.name }}
            </dt>
            <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
              <p class="flex-auto">{{ feature.description }}</p>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
