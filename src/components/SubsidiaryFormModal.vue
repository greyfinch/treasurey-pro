<script setup lang="ts">
import { ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../services/mockData'
import type { Organisation, OrgType } from '../services/mockData'

const props = defineProps<{
    isOpen: boolean
    organisation?: Organisation | null
}>()

const emit = defineEmits<{
    close: []
    saved: [org: Organisation]
}>()

const isSubmitting = ref(false)
const error = ref('')

const formData = ref<{
    name: string
    type: OrgType
    parentId: string
    baseCurrency: string
}>({
    name: '',
    type: 'SUBSIDIARY',
    parentId: 'org-holdco',
    baseCurrency: 'NGN'
})

watch(() => props.organisation, (newOrg) => {
    if (newOrg) {
        formData.value = {
            name: newOrg.name,
            type: newOrg.type,
            parentId: newOrg.parentId || 'org-holdco',
            baseCurrency: newOrg.baseCurrency || 'NGN'
        }
    } else {
        formData.value = {
            name: '',
            type: 'SUBSIDIARY',
            parentId: 'org-holdco',
            baseCurrency: 'NGN'
        }
    }
}, { immediate: true })


const handleSubmit = async () => {
    if (!formData.value.name) return

    isSubmitting.value = true
    error.value = ''
    try {
        let savedOrg: Organisation
        if (props.organisation) {
            savedOrg = await mockService.updateOrganisation(props.organisation.id, {
                ...formData.value,
                baseCurrency: formData.value.baseCurrency as any
            })
        } else {
            savedOrg = await mockService.addOrganisation({
                ...formData.value,
                baseCurrency: formData.value.baseCurrency as any
            })
        }

        emit('saved', savedOrg)
        emit('close')
    } catch (err: any) {
        error.value = err.message || 'Failed to save organisation'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {{ organisation ? 'Edit Subsidiary' : 'New Subsidiary' }}
                        </h3>
                        <button @click="emit('close')" class="text-gray-400 hover:text-gray-500">
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>

                    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                        {{ error }}
                    </div>

                    <form @submit.prevent="handleSubmit" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Subsidiary Name</label>
                            <input 
                                type="text" 
                                v-model="formData.name" 
                                required 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900"
                                placeholder="e.g. Acme Logistics"
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Type</label>
                            <select 
                                v-model="formData.type" 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900"
                            >
                                <option value="SUBSIDIARY">Subsidiary</option>
                                <option value="GROUP">Group (Management)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Base Reporting Currency</label>
                            <select 
                                v-model="formData.baseCurrency" 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900"
                            >
                                <option value="NGN">NGN - Nigerian Naira</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                            </select>
                        </div>

                        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button 
                                type="submit" 
                                :disabled="isSubmitting"
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                                {{ isSubmitting ? 'Saving...' : (organisation ? 'Update' : 'Create') }}
                            </button>
                            <button 
                                type="button" 
                                @click="emit('close')"
                                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
