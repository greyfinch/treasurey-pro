<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import dayjs from 'dayjs';
import { 
    type CommercialPaper, 
    type Issuer,
    CurrencyCode, 
    BANKS,
    ORGANISATIONS,
    MOCK_ISSUERS
} from '../../services/mockData';

const props = defineProps<{
    modelValue: Partial<CommercialPaper>;
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

const interestType = ref<'DISCOUNTED' | 'INTEREST_BEARING'>('DISCOUNTED');

const form = ref({
    organisationId: authStore.user?.organisationId || '',
    currency: CurrencyCode.NGN as CurrencyCode,
    issuerId: '',
    faceValue: '',
    purchasePrice: '',
    interestRate: '', // Used for Interest Bearing
    tradeDate: dayjs().format('YYYY-MM-DD'),
    settlementDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    maturityDate: dayjs().add(270, 'day').format('YYYY-MM-DD'),
    counterpartyId: '',
    earlyExitAllowed: false,
    earlyExitPenalty: '',
    notes: ''
});

// Computed Issuer details
const selectedIssuer = computed(() => {
    return MOCK_ISSUERS.find(i => i.id === form.value.issuerId);
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
            tradeDate: formatDateVal(newVal.tradeDate) || form.value.tradeDate,
            settlementDate: formatDateVal(newVal.settlementDate) || form.value.settlementDate,
            maturityDate: formatDateVal(newVal.maturityDate) || form.value.maturityDate
        };
    }
}, { immediate: true });

// Auto-calculate Yield/ROI/Maturity
const derivedMetrics = computed(() => {
    const start = dayjs(form.value.settlementDate);
    const end = dayjs(form.value.maturityDate);
    const tenor = end.diff(start, 'day');

    let face = parseFloat(form.value.faceValue) || 0;
    let price = parseFloat(form.value.purchasePrice) || 0;
    let rate = parseFloat(form.value.interestRate) || 0;

    let yieldRate = 0;
    let roi = 0;
    let profit = 0;

    if (interestType.value === 'DISCOUNTED') {
        // User inputs Face Value and Purchase Price
        if (face > 0 && price > 0 && tenor > 0) {
            profit = face - price;
            roi = (profit / price) * 100;
            yieldRate = roi * (365 / tenor);
        }
    } else {
        // Interest Bearing: User inputs Principal (Purchase Price) and Rate
        // Face Value (Maturity Value) is calculated
        if (price > 0 && rate > 0 && tenor > 0) {
            profit = (price * rate * tenor) / (365 * 100); // Simple Interest
            face = price + profit; // Derived Face Value
            roi = (profit / price) * 100;
            yieldRate = rate; // The rate input is the annualized yield
        }
    }

    return {
        tenor,
        yieldRate: yieldRate.toFixed(2),
        roi: roi.toFixed(2),
        profit: profit.toFixed(2),
        derivedFaceValue: interestType.value === 'INTEREST_BEARING' ? face.toFixed(2) : null
    };
});

const handleSubmit = () => {
    const finalFaceValue = interestType.value === 'INTEREST_BEARING' 
        ? derivedMetrics.value.derivedFaceValue 
        : form.value.faceValue;

    emit('submit', {
        ...form.value,
        faceValue: finalFaceValue,
        yieldRate: derivedMetrics.value.yieldRate,
        tenorDays: derivedMetrics.value.tenor
    });
};
</script>

<template>
    <div class="space-y-6">
        <!-- Interest Type Toggle -->
        <div class="flex justify-center">
            <div class="inline-flex rounded-md shadow-sm" role="group">
                <button 
                    type="button" 
                    @click="interestType = 'DISCOUNTED'"
                    class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                    :class="interestType === 'DISCOUNTED' ? 'bg-gray-100 text-blue-700 dark:bg-gray-700 dark:text-white' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'"
                >
                    Discounted (Upfront)
                </button>
                <button 
                    type="button" 
                    @click="interestType = 'INTEREST_BEARING'"
                    class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                    :class="interestType === 'INTEREST_BEARING' ? 'bg-gray-100 text-blue-700 dark:bg-gray-700 dark:text-white' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'"
                >
                    Interest Bearing
                </button>
            </div>
        </div>

        <!-- Structure -->
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
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuer</label>
                <select 
                    v-model="form.issuerId"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                    <option value="" disabled>Select Issuer</option>
                    <option v-for="issuer in MOCK_ISSUERS" :key="issuer.id" :value="issuer.id">{{ issuer.name }} ({{ issuer.creditRating }})</option>
                </select>
                <div v-if="selectedIssuer" class="mt-1 text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                    <span class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{{ selectedIssuer.sector }}</span>
                    <span class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">{{ selectedIssuer.creditRating }}</span>
                </div>
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

            <template v-if="interestType === 'DISCOUNTED'">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Face Value (Maturity)</label>
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
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price (Investment)</label>
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
            </template>

            <template v-else>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal (Investment)</label>
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

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
                    <div class="relative rounded-md shadow-sm">
                        <input 
                            type="number" 
                            v-model="form.interestRate"
                            class="block w-full pr-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                        />
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Metrics Preview -->
        <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">Holding ROI</span>
                    <span class="block text-lg font-bold text-green-600 dark:text-green-400">{{ derivedMetrics.roi }}%</span>
                </div>
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">Annualised Yield</span>
                    <span class="block text-lg font-bold text-blue-600 dark:text-blue-400">{{ derivedMetrics.yieldRate }}%</span>
                </div>
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">Tenor</span>
                    <span class="block text-lg font-bold text-gray-900 dark:text-white">{{ derivedMetrics.tenor }} Days</span>
                </div>
                <div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 uppercase">Profit at Maturity</span>
                    <span class="block text-lg font-bold text-gray-900 dark:text-white">{{ form.currency === 'NGN' ? '₦' : '$' }}{{ Number(derivedMetrics.profit).toLocaleString() }}</span>
                    <span v-if="interestType === 'INTEREST_BEARING'" class="block text-xs text-gray-500 mt-1">
                        Mat. Val: {{ form.currency === 'NGN' ? '₦' : '$' }}{{ Number(derivedMetrics.derivedFaceValue).toLocaleString() }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Dates & Dealer -->
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
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dealer (Counterparty)</label>
                <select 
                    v-model="form.counterpartyId"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                    <option value="" disabled>Select Dealer Bank</option>
                    <option v-for="bank in BANKS" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                </select>
            </div>
             <div class="flex items-center mt-6">
                 <input 
                    id="early-exit" 
                    type="checkbox" 
                    v-model="form.earlyExitAllowed"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="early-exit" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Early Exit Allowed
                </label>
             </div>
             <div v-if="form.earlyExitAllowed">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exit Penalty (%)</label>
                <div class="relative rounded-md shadow-sm">
                    <input 
                        type="number" 
                        v-model="form.earlyExitPenalty"
                        class="block w-full pr-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="0.00"
                    />
                     <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notes -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Reference</label>
            <textarea 
                v-model="form.notes"
                rows="3"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter deal ticket number, ISIN, or remarks..."
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
                {{ isSubmitting ? 'Creating...' : 'Create Commercial Paper' }}
            </button>
        </div>
    </div>
</template>
