<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BuildingLibraryIcon, Bars3Icon, XMarkIcon } from '@heroicons/vue/24/solid'

const router = useRouter()
const isMobileMenuOpen = ref(false)

const navigation = [
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]
</script>

<template>
  <header class="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" aria-label="Global">
      <div class="flex items-center justify-between">
        <div class="flex lg:flex-1">
          <a href="/" class="-m-1.5 p-1.5 flex items-center gap-2" @click.prevent="router.push('/')">
            <BuildingLibraryIcon class="h-8 w-8 text-primary-600" />
            <span class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Treasury<span class="text-primary-600">Pro</span></span>
          </a>
        </div>
        <div class="flex lg:hidden">
          <button type="button" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200" @click="isMobileMenuOpen = true">
            <span class="sr-only">Open main menu</span>
            <Bars3Icon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="hidden lg:flex lg:gap-x-12">
          <router-link v-for="item in navigation" :key="item.name" :to="item.href" class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {{ item.name }}
          </router-link>
        </div>
        <div class="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
            <router-link to="/login" class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Log in
            </router-link>
            <router-link to="/login" class="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all">
                Get started
            </router-link>
        </div>
      </div>
    </nav>
    <div class="lg:hidden" v-if="isMobileMenuOpen">
      <div class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
      <div class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:ring-gray-100/10 transform transition-transform duration-300 ease-in-out">
        <div class="flex items-center justify-between">
          <a href="#" class="-m-1.5 p-1.5 flex items-center gap-2" @click.prevent="router.push('/')">
             <BuildingLibraryIcon class="h-8 w-8 text-primary-600" />
            <span class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Treasury<span class="text-primary-600">Pro</span></span>
          </a>
          <button type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200" @click="isMobileMenuOpen = false">
            <span class="sr-only">Close menu</span>
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-6 flow-root">
          <div class="-my-6 divide-y divide-gray-500/10 dark:divide-gray-500/20">
            <div class="space-y-2 py-6">
              <router-link v-for="item in navigation" :key="item.name" :to="item.href" class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800" @click="isMobileMenuOpen = false">
                {{ item.name }}
              </router-link>
            </div>
            <div class="py-6 flex flex-col gap-4">
              <router-link to="/login" class="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800" @click="isMobileMenuOpen = false">
                Log in
              </router-link>
               <router-link to="/login" class="w-full text-center rounded-full bg-primary-600 px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all" @click="isMobileMenuOpen = false">
                Get started
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
