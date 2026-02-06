<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BuildingLibraryIcon } from '@heroicons/vue/24/solid'
import { mockService } from '../services/mockData'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const user = await mockService.login(username.value, password.value)
    if (user) {
      localStorage.setItem('isAuthenticated', 'true')
      router.push('/')
    } else {
      error.value = 'Invalid username or password'
    }
  } catch (e) {
    error.value = 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-colors duration-500">
    <div class="max-w-md w-full">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="flex justify-center items-center gap-2 mb-4">
          <BuildingLibraryIcon class="h-12 w-12 text-primary-600" />
          <span class="font-bold text-3xl tracking-tight text-gray-900 dark:text-white">Treasury<span class="text-primary-600">Pro</span></span>
        </div>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Welcome back</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 transition-colors">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              class="appearance-none text-gray-900 dark:text-white block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white dark:bg-gray-900"
              placeholder="Enter your username"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="appearance-none text-gray-900 dark:text-white block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white dark:bg-gray-900"
              placeholder="Enter your password"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Sign in</span>
            <span v-else class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          </button>
        </form>

        <!-- Test Credentials -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Test credentials (password: password):</p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-gray-400 dark:text-gray-500">
            <div><span class="font-medium text-gray-600 dark:text-gray-300">cfo</span>: Group CFO</div>
            <div><span class="font-medium text-gray-600 dark:text-gray-300">treasury</span>: Group Treasury</div>
            <div><span class="font-medium text-gray-600 dark:text-gray-300">manager_foods</span>: Foods Mgr</div>
            <div><span class="font-medium text-gray-600 dark:text-gray-300">officer_foods</span>: Foods Officer</div>
            <div><span class="font-medium text-gray-600 dark:text-gray-300">manager_transport</span>: Trans Mgr</div>
            <div><span class="font-medium text-gray-600 dark:text-gray-300">auditor</span>: Auditor</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
