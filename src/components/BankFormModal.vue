<script setup lang="ts">
import { ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../services/mockData'

const props = defineProps<{
    isOpen: boolean
    bankToEdit?: { id: string, name: string } | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved', bank: any): void
}>()

const isSubmitting = ref(false)
const form = ref({
    name: ''
})

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        if (props.bankToEdit) {
            form.value = { name: props.bankToEdit.name }
        } else {
            form.value = { name: '' }
        }
    }
})

const handleSubmit = async () => {
    if (!form.value.name) return
    isSubmitting.value = true
    try {
        let result
        if (props.bankToEdit) {
            result = await mockService.updateBank(props.bankToEdit.id, { name: form.value.name })
        } else {
            result = await mockService.addBank({ name: form.value.name })
        }
        emit('saved', result)
        emit('close')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-[60] overflow-y-auto  bg-gray-500/90" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Backdrop -->
            
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {{ bankToEdit ? 'Edit Bank' : 'Add New Bank' }}
                        </h3>
                        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 transition-colors">
                            <span class="sr-only">Close</span>
                            <XMarkIcon class="h-6 w-6" />
                        </button>
                    </div>
                    
                    <form @submit.prevent="handleSubmit" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Bank Name</label>
                            <input 
                                type="text" 
                                v-model="form.name" 
                                required 
                                class="mt-1 text-black focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" 
                                placeholder="e.g. Access Bank"
                                autofocus
                            >
                        </div>
                        
                        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button 
                                type="submit" 
                                :disabled="isSubmitting" 
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 transition-colors"
                            >
                                {{ isSubmitting ? 'Saving...' : 'Save Bank' }}
                            </button>
                            <button 
                                type="button" 
                                @click="$emit('close')" 
                                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors"
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
