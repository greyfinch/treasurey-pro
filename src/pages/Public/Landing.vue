<script setup lang="ts">
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, BanknotesIcon } from '@heroicons/vue/24/outline'

const features = [
  {
    name: 'Investment Portfolio',
    description: 'Track all your investments in one place. Monitor T-Bills, Commercial Papers, Bonds, and more with real-time updates.',
    icon: BanknotesIcon,
  },
  {
    name: 'Advanced Analytics',
    description: 'Gain deep insights into your financial health with powerful visualization tools and predictive analytics.',
    icon: ChartBarIcon,
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-grade security protocols ensure your financial data remains safe and protected at all times.',
    icon: ShieldCheckIcon,
  },
]
</script>

<template>
  <div class="bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <div class="relative isolate px-6 pt-14 lg:px-8">
      <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
      <div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <!-- <div class="hidden sm:mb-8 sm:flex sm:justify-center">
          <div class="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-400 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20 transition-all">
            Announcing our new Series A funding. <a href="#" class="font-semibold text-primary-600"><span class="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div> -->
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Modern Treasury Management for the Digital Age</h1>
          <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Streamline your financial operations, optimize liquidity, and make data-driven investment decisions with TreasuryPro.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <router-link to="/login" class="rounded-full bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all">Get started</router-link>
            <router-link to="/features" class="text-sm font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-1 group">
                Learn more <ArrowRightIcon class="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </router-link>
          </div>
        </div>
      </div>
      <div class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
    </div>

    <!-- Feature Section -->
    <div class="mx-auto max-w-7xl px-6 lg:px-8 pb-24 sm:pb-32">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h2 class="text-base font-semibold leading-7 text-primary-600">Deploy faster</h2>
        <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Everything you need to manage your assets</p>
        <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
          TreasuryPro provides a comprehensive suite of tools designed to help financial teams work smarter, not harder.
        </p>
      </div>
      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
          <div v-for="feature in features" :key="feature.name" class="relative pl-16">
            <dt class="text-base font-semibold leading-7 text-gray-900 dark:text-white">
              <div class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <component :is="feature.icon" class="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              {{ feature.name }}
            </dt>
            <dd class="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">{{ feature.description }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-white dark:bg-gray-900">
      <div class="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Ready to boost your productivity?<br />Start using TreasuryPro today.</h2>
          <p class="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Join hundreds of forward-thinking finance teams who are transforming their treasury operations.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <router-link to="/login" class="rounded-full bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all">Get started</router-link>
            <router-link to="/contact" class="text-sm font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-1 group">
                Contact sales <span aria-hidden="true" class="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
