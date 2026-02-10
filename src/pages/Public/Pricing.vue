<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid'

const tiers = [
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '#',
    priceMonthly: '$0',
    description: 'Everything you need to start tracking your personal investments.',
    features: ['Basic Investment Tracking', 'Up to 3 Portfolios', 'Standard Analytics', 'Email Support'],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    priceMonthly: '$49',
    description: 'Advanced tools for growing businesses and serious investors.',
    features: [
      'Unlimited Portfolios',
      'Advanced Risk Analytics',
      'Priority Email Support',
      'Export to CSV/PDF',
      'Market Alerts',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: 'Custom',
    description: 'Dedicated support and infrastructure for large organizations.',
    features: [
      'Dedicated Account Manager',
      'Custom Integrations',
      'SSO & Advanced Security',
      'Audit Logs',
      'SLA Guarantees',
      'On-premise Deployment Option',
    ],
    mostPopular: false,
  },
]
</script>

<template>
  <div class="bg-white dark:bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
        <p class="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Pricing plans for teams of all sizes</p>
      </div>
      <p class="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-400">
        Choose the best plan for your treasury management needs. Scale as you grow.
      </p>
      <div class="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div v-for="(tier, tierIdx) in tiers" :key="tier.id" :class="[tier.mostPopular ? 'ring-2 ring-primary-600' : 'ring-1 ring-gray-200 dark:ring-gray-700', 'rounded-3xl p-8 xl:p-10 transition-all hover:scale-105']">
          <div class="flex items-center justify-between gap-x-4">
            <h3 :id="tier.id" :class="[tier.mostPopular ? 'text-primary-600' : 'text-gray-900 dark:text-white', 'text-lg font-semibold leading-8']">{{ tier.name }}</h3>
            <p v-if="tier.mostPopular" class="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">Most popular</p>
          </div>
          <p class="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">{{ tier.description }}</p>
          <p class="mt-6 flex items-baseline gap-x-1">
            <span class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{{ tier.priceMonthly }}</span>
            <span class="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">/month</span>
          </p>
          <a :href="tier.href" :aria-describedby="tier.id" :class="[tier.mostPopular ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500' : 'text-primary-600 ring-1 ring-inset ring-primary-200 hover:ring-primary-300 dark:ring-primary-800 dark:hover:ring-primary-700', 'mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600']">Buy plan</a>
          <ul role="list" class="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            <li v-for="feature in tier.features" :key="feature" class="flex gap-x-3">
              <CheckIcon class="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
