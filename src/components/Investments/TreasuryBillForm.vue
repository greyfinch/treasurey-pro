<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import dayjs from 'dayjs';
import { 
    type TreasuryBill, 
    CurrencyCode, 
    BANKS,
    ORGANISATIONS 
} from '../../services/mockData';

const props = defineProps<{
    modelValue: Partial<TreasuryBill>;
    isSubmitting: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

// Mock store access
const authStore = {
    user: { organisationId: 'org-holdco' }, // Default mock user
    isGroupUser: true
};

const subStore = {
    subsidiaries: ORGANISATIONS.filter(o => o.type === 'SUBSIDIARY')
};

const form = ref({
    organisationId: authStore.user?.organisationId || '',
    currency: CurrencyCode.NGN as CurrencyCode,
    faceValue: '',
    purchasePrice: '',
    discountRate: '',
    tradeDate: dayjs().format('YYYY-MM-DD'),
    settlementDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    maturityDate: dayjs().add(91, 'day').format('YYYY-MM-DD'),
    counterpartyId: '',
    notes: ''
});

// Helper to safely format date to string
const formatDateVal = (val: string | Date | undefined): string => {
    if (!val) return '';
    if (val instanceof Date) return dayjs(val).format('YYYY-MM-DD');
    return val;
};

// Sync prop to form
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        form.value = { ...form.value, ...newVal, 
            faceValue: newVal.faceValue?.toString() || '',
            purchasePrice: newVal.purchasePrice?.toString() || '',
            discountRate: newVal.discountRate?.toString() || '',
            tradeDate: formatDateVal(newVal.tradeDate) || form.value.tradeDate,
            settlementDate: formatDateVal(newVal.settlementDate) || form.value.settlementDate,
            maturityDate: formatDateVal(newVal.maturityDate) || form.value.maturityDate
        };
    }
}, { immediate: true });

// Auto-calculate Yield and Tenor
const derivedMetrics = computed(() => {
    const face = parseFloat(form.value.faceValue) || 0;
    const price = parseFloat(form.value.purchasePrice) || 0;
    const start = dayjs(form.value.settlementDate);
    const end = dayjs(form.value.maturityDate);
    const tenor = end.diff(start, 'day');

    let yieldRate = 0;
    let roi = 0;
    if (face > 0 && price > 0 && tenor > 0) {
        // ROI for the period = ((Face - Price) / Price) * 100
        roi = ((face - price) / price) * 100;
        
        // Annualized Yield = ROI * (365 / Tenor)
        yieldRate = roi * (365 / tenor);
    }

    return {
        tenor,
        yieldRate: yieldRate.toFixed(2),
        roi: roi.toFixed(2),
        profit: (face - price).toFixed(2)
    };
});

const handleSubmit = () => {
    emit('submit', {
        ...form.value,
        effectiveYield: derivedMetrics.value.yieldRate,
        tenorDays: derivedMetrics.value.tenor
    });
};
</script>

<template>
    <div class="space-y-6">
        <!-- Organization / Counterparty -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-if="authStore.isGroupUser">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subsidiary</label>
                <select 
                    v-model="form.organisationId"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                    <option v-for="sub in subStore.subsidiaries" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Counterparty (Bank)</label>
                <select 
                    v-model="form.counterpartyId"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                    <option value="" disabled>Select Bank</option>
                    <option v-for="bank in BANKS" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                </select>
            </div>
        </div>

        <!-- Financials -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                <select 
                    v-model="form.currency"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                    <option :value="CurrencyCode.NGN">NGN</option>
                    <option :value="CurrencyCode.USD">USD</option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Face Value</label>
                <div class="relative rounded-md shadow-sm">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">{{ form.currency === 'NGN' ? '₦' : '$' }}</span>
                    </div>
                    <input 
                        type="number" 
                        v-model="form.faceValue"
                        class="block w-full pl-7 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
                <div class="relative rounded-md shadow-sm">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">{{ form.currency === 'NGN' ? '₦' : '$' }}</span>
                    </div>
                    <input 
                        type="number" 
                        v-model="form.purchasePrice"
                        class="block w-full pl-7 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="0.00"
                    />
                </div>
            </div>
        </div>

        <!-- Metrics Preview -->
        <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">ROI ({{ derivedMetrics.tenor }} Days)</span>
                    <span class="block text-lg font-bold text-green-600 dark:text-green-400">{{ derivedMetrics.roi }}%</span>
                </div>
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">Tenor</span>
                    <span class="block text-lg font-bold text-gray-900 dark:text-white">{{ derivedMetrics.tenor }} Days</span>
                </div>
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">Profit at Maturity</span>
                    <span class="block text-lg font-bold text-gray-900 dark:text-white">{{ form.currency === 'NGN' ? '₦' : '$' }}{{ Number(derivedMetrics.profit).toLocaleString() }}</span>
                </div>
            </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trade Date</label>
                <input 
                    type="date" 
                    v-model="form.tradeDate"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Settlement Date</label>
                <input 
                    type="date" 
                    v-model="form.settlementDate"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maturity Date</label>
                <input 
                    type="date" 
                    v-model="form.maturityDate"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
            </div>
        </div>

        <!-- Notes -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Reference</label>
            <textarea 
                v-model="form.notes"
                rows="3"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter deal ticket number or remarks..."
            ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
                type="button" 
                @click="$emit('cancel')"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                Cancel
            </button>
            <button 
                type="button"
                @click="handleSubmit" 
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {{ isSubmitting ? 'Creating...' : 'Create T-Bill' }}
            </button>
        </div>
    </div>
</template>
