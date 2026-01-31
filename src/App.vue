<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BuildingLibraryIcon } from '@heroicons/vue/24/solid'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const isMobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-gray-900 dark:text-gray-100">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center gap-2 cursor-pointer" @click="router.push('/')">
              <BuildingLibraryIcon class="h-8 w-8 text-primary-600" />
              <span class="font-bold text-xl tracking-tight text-gray-900">Treasury<span class="text-primary-600">Pro</span></span>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link 
                to="/" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-primary-500 text-gray-900"
              >
                Dashboard
              </router-link>
              <router-link 
                to="/investments" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-primary-500 text-gray-900"
              >
                Investments
              </router-link>
              <router-link 
                to="/banks" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-primary-500 text-gray-900"
              >
                Banks
              </router-link>
            </div>
          </div>
          <div class="flex items-center gap-4">
             <!-- Mobile menu button -->
            <div class="flex items-center sm:hidden">
              <button 
                @click="isMobileMenuOpen = !isMobileMenuOpen"
                type="button" 
                class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500" 
                aria-controls="mobile-menu" 
                :aria-expanded="isMobileMenuOpen"
              >
                <span class="sr-only">Open main menu</span>
                <Bars3Icon v-if="!isMobileMenuOpen" class="block h-6 w-6" aria-hidden="true" />
                <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <button class="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-primary-200 hidden sm:block">
                User Admin
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state. -->
      <div class="sm:hidden" id="mobile-menu" v-show="isMobileMenuOpen">
        <div class="pt-2 pb-3 space-y-1">
          <router-link 
            to="/" 
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="bg-primary-50 border-primary-500 text-primary-700"
            @click="isMobileMenuOpen = false"
          >
            Dashboard
          </router-link>
          <router-link 
            to="/investments" 
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="bg-primary-50 border-primary-500 text-primary-700"
            @click="isMobileMenuOpen = false"
          >
            Investments
          </router-link>
          <router-link 
            to="/banks" 
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="bg-primary-50 border-primary-500 text-primary-700"
            @click="isMobileMenuOpen = false"
          >
            Banks
          </router-link>
          <div class="mt-4 pt-4 border-t border-gray-200 pl-3">
             <button class="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-primary-200">
                User Admin
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view></router-view>
    </main>
  </div>
</template>
