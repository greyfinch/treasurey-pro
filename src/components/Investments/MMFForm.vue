<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
    mockService, 
    CurrencyCode, 
} from '../../services/mockData';

const props = defineProps<{
    initialFundId?: string;
}>();

const emit = defineEmits<{
    (e: 'success', data: any): void;
    (e: 'cancel'): void;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const mmfs = ref<any[]>([]);

const form = ref({
    fundId: props.initialFundId || '',
    amount: '',
    currency: CurrencyCode.NGN,
});

onMounted(async () => {
    mmfs.value = await mockService.getMMFs();
    if (props.initialFundId) {
        const fund = mmfs.value.find(f => f.id === props.initialFundId);
        if (fund) form.value.currency = fund.currency;
    }
});

const selectedFund = computed(() => {
    return mmfs.value.find(f => f.id === form.value.fundId);
});

const estimatedUnits = computed(() => {
    if (!selectedFund.value || !form.value.amount) return 0;
    return parseFloat(form.value.amount) / selectedFund.value.nav;
});

const handleSubmit = async () => {
    if (!form.value.fundId || !form.value.amount) return;
    
    loading.value = true;
    error.value = null;
    try {
        const result = await mockService.subscribeMMF(form.value.fundId, parseFloat(form.value.amount));
        emit('success', result);
    } catch (err: any) {
        error.value = err.message || 'Failed to process subscription';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {{ error }}
        </div>

        <div class="grid grid-cols-1 gap-6">
            <!-- Fund Selection -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Money Market Fund</label>
                <select 
                    v-model="form.fundId"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                >
                    <option value="" disabled>Select a fund</option>
                    <option v-for="mmf in mmfs" :key="mmf.id" :value="mmf.id">
                        {{ mmf.fundName }} ({{ mmf.fundManager }})
                    </option>
                </select>
            </div>

            <!-- Amount -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Amount</label>
                    <div class="relative mt-1 rounded-md shadow-sm">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span class="text-gray-500 sm:text-sm">{{ selectedFund?.currency || 'NGN' }}</span>
                        </div>
                        <input 
                            v-model="form.amount"
                            type="number" 
                            step="0.01"
                            required
                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div v-if="selectedFund" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Estimated Units</span>
                        <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {{ estimatedUnits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }}
                        </span>
                        <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            @ NAV {{ selectedFund.nav.toFixed(4) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button 
                type="button" 
                @click="emit('cancel')"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit"
                :disabled="loading"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50 transition-colors"
            >
                {{ loading ? 'Processing...' : 'Confirm Subscription' }}
            </button>
        </div>
    </form>
</template>
