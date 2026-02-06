<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BuildingLibraryIcon } from '@heroicons/vue/24/solid'
import { Bars3Icon, XMarkIcon, UserCircleIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import SubsidiarySwitcher from './components/SubsidiarySwitcher.vue'
import NotificationBell from './components/NotificationBell.vue'
import { organisationService } from './services/organisationService'
import { mockService } from './services/mockData'
import type { User } from './services/mockData'
import { usePermissions } from './composables/usePermissions'

const { canDo } = usePermissions()

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)
const currentUser = ref<User | null>(null)
const showLogoutModal = ref(false)
const isProfileDropdownOpen = ref(false)

const isLoginPage = computed(() => route.name === 'Login')

onMounted(async () => {
  await organisationService.init()
  currentUser.value = await mockService.getCurrentUser()
})

const confirmLogout = () => {
  showLogoutModal.value = true
  isProfileDropdownOpen.value = false
}

const handleLogout = () => {
  localStorage.removeItem('isAuthenticated')
  showLogoutModal.value = false
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-gray-900 dark:text-gray-100">
    <!-- Navbar -->
    <nav v-if="!isLoginPage" class="bg-white border-b border-gray-200 sticky top-0 z-50">
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
                v-if="canDo('audit:view')"
                to="/audit-logs" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-primary-500 text-gray-900"
              >
                Audit Logs
              </router-link>
              <router-link 
                to="/settings" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-primary-500 text-gray-900"
              >
                Settings
              </router-link>
            </div>
          </div>
          <div class="flex items-center gap-4 sm:gap-6">
            <NotificationBell />
            <SubsidiarySwitcher />
            
            <!-- User Profile Dropdown -->
            <div class="relative">
              <button 
                @click="isProfileDropdownOpen = !isProfileDropdownOpen"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
              >
                <div class="hidden md:flex flex-col items-end mr-1">
                  <span class="text-xs font-bold text-gray-900 leading-none mb-0.5">{{ currentUser?.name }}</span>
                  <span class="text-[10px] text-gray-500 font-medium uppercase tracking-wider leading-none">{{ currentUser?.role.replace(/_/g, ' ') }}</span>
                </div>
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 group-hover:bg-primary-200 transition-colors ring-1 ring-primary-200">
                  <UserCircleIcon class="w-6 h-6" />
                </div>
              </button>

              <div v-if="isProfileDropdownOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <div class="px-4 py-2 border-b border-gray-50 md:hidden">
                  <p class="text-sm font-bold text-gray-900">{{ currentUser?.name }}</p>
                  <p class="text-[10px] text-gray-500 uppercase tracking-widest">{{ currentUser?.role.replace(/_/g, ' ') }}</p>
                </div>
                <button 
                  @click="confirmLogout"
                  class="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <ArrowRightOnRectangleIcon class="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

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
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="sm:hidden border-t border-gray-100" id="mobile-menu" v-show="isMobileMenuOpen">
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
            v-if="canDo('audit:view')" 
            to="/audit-logs" 
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="bg-primary-50 border-primary-500 text-primary-700"
            @click="isMobileMenuOpen = false"
          >
            Audit Logs
          </router-link>
          <div class="mt-4 pt-4 border-t border-gray-200 px-4 pb-4">
             <button 
               @click="confirmLogout"
               class="w-full bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
             >
                <ArrowRightOnRectangleIcon class="w-4 h-4" />
                Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Logout Confirmation Modal -->
    <div v-if="showLogoutModal" class="fixed inset-0 z-[60] overflow-y-auto bg-gray-500/75 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-6 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
          <p class="text-sm text-gray-500">Are you sure you want to log out? You will need to sign in again to access your dashboard.</p>
        </div>
        <div class="bg-gray-50 px-6 py-4 flex gap-3">
          <button 
            type="button" 
            class="flex-1 btn-secondary text-sm font-bold py-2" 
            @click="showLogoutModal = false"
          >
            Cancel
          </button>
          <button 
            type="button" 
            class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm transition-colors" 
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view></router-view>
    </main>
  </div>
</template>
