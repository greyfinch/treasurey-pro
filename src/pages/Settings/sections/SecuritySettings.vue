<script setup lang="ts">
import { ref } from 'vue'
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../../services/mockData'

const passwordForm = ref({
    current: '',
    new: '',
    confirm: ''
})

const isTwoFactorEnabled = ref(false)
const isSubmitting = ref(false)

const handlePasswordChange = async () => {
    if (passwordForm.value.new !== passwordForm.value.confirm) {
        return alert('Passwords do not match')
    }
    isSubmitting.value = true
    try {
        await mockService.changePassword(passwordForm.value.current, passwordForm.value.new)
        alert('Password changed successfully')
        passwordForm.value = { current: '', new: '', confirm: '' }
    } finally {
        isSubmitting.value = false
    }
}

const toggle2FA = async () => {
    try {
        await mockService.toggle2FA(!isTwoFactorEnabled.value)
        isTwoFactorEnabled.value = !isTwoFactorEnabled.value
        alert(`2FA has been ${isTwoFactorEnabled.value ? 'enabled' : 'disabled'}`)
    } catch (err) {
        alert('Failed to toggle 2FA')
    }
}
</script>

<template>
    <div class="max-w-2xl space-y-8">
        <!-- Password Change -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                <LockClosedIcon class="w-5 h-5 text-gray-400" />
                Security & Password
            </h2>
            
            <form @submit.prevent="handlePasswordChange" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Current Password</label>
                    <input v-model="passwordForm.current" type="password" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">New Password</label>
                    <input v-model="passwordForm.new" type="password" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input v-model="passwordForm.confirm" type="password" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2">
                </div>
                <button type="submit" :disabled="isSubmitting" class="btn-primary w-full sm:w-auto">
                    {{ isSubmitting ? 'Updating...' : 'Change Password' }}
                </button>
            </form>
        </div>

        <!-- 2FA Toggle -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary-50 rounded-lg text-primary-600">
                        <ShieldCheckIcon class="w-6 h-6" />
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900">Two-Factor Authentication</h3>
                        <p class="text-sm text-gray-500">Secure your account with 2FA</p>
                    </div>
                </div>
                <button 
                    @click="toggle2FA"
                    :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        isTwoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                    ]"
                >
                    <span 
                        :class="[
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            isTwoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                        ]"
                    />
                </button>
            </div>
        </div>
    </div>
</template>
