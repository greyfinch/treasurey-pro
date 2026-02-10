<script setup lang="ts">
import { ref, watch } from 'vue';
import { 
    XMarkIcon
} from '@heroicons/vue/24/outline';
import { 
    mockService, 
    type Issuer,
    type IssuerType 
} from '../../services/mockData';

const props = defineProps<{
    isOpen: boolean;
    issuerToEdit?: Issuer | null;
}>();

const emit = defineEmits(['close', 'saved']);

const isSubmitting = ref(false);
const error = ref('');

const form = ref({
    name: '',
    type: 'CORPORATE' as IssuerType,
    creditRating: '',
    country: 'Nigeria',
    sector: ''
});

watch(() => props.issuerToEdit, (newVal) => {
    if (newVal) {
        form.value = {
            name: newVal.name,
            type: newVal.type,
            creditRating: newVal.creditRating,
            country: newVal.country,
            sector: newVal.sector
        };
    } else {
        form.value = {
            name: '',
            type: 'CORPORATE' as IssuerType,
            creditRating: '',
            country: 'Nigeria',
            sector: ''
        };
    }
}, { immediate: true });

const handleSubmit = async () => {
    isSubmitting.value = true;
    error.value = '';
    
    try {
        if (props.issuerToEdit) {
            await mockService.updateIssuer(props.issuerToEdit.id, form.value);
        } else {
            await mockService.addIssuer(form.value);
        }
        emit('saved');
        emit('close');
    } catch (e: any) {
        error.value = e.message || 'Failed to save issuer';
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 overflow-y-auto transition-colors" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <!-- <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div> -->

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-gray-700 font-primary">
                <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                        {{ issuerToEdit ? 'Edit Issuer' : 'Add New Issuer' }}
                    </h3>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 transition-colors">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>

                <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
                    <div v-if="error" class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        {{ error }}
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuer Name</label>
                        <input 
                            v-model="form.name" 
                            type="text" 
                            required
                            placeholder="e.g. MTN Nigeria"
                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 selection:bg-primary-100 transition-colors"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select 
                                v-model="form.type"
                                class="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                            >
                                <option value="CORPORATE">Corporate</option>
                                <option value="FINANCIAL_INSTITUTION">Financial Institution</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Rating</label>
                            <input 
                                v-model="form.creditRating" 
                                type="text" 
                                required
                                placeholder="e.g. AAA, AA+"
                                class="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sector</label>
                            <input 
                                v-model="form.sector" 
                                type="text" 
                                required
                                placeholder="e.g. Telecommunications"
                                class="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                            <input 
                                v-model="form.country" 
                                type="text" 
                                required
                                placeholder="Nigeria"
                                class="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                            />
                        </div>
                    </div>

                    <div class="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            @click="$emit('close')"
                            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            :disabled="isSubmitting"
                            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {{ isSubmitting ? 'Saving...' : (issuerToEdit ? 'Save Changes' : 'Add Issuer') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
