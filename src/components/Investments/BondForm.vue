<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { 
    mockService,
    type Bond, 
    CurrencyCode, 
    BANKS,
    ORGANISATIONS,
    type Issuer,
    type CouponFrequency
} from '../../services/mockData';

const props = defineProps<{
    modelValue: Partial<Bond>;
    isSubmitting: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

// Mock store access
const authStore = {
    user: { organisationId: 'org-holdco' },
    isGroupUser: true
};

const subStore = {
    subsidiaries: ORGANISATIONS.filter(o => o.type === 'SUBSIDIARY')
};

const issuers = ref<Issuer[]>([]);
const loadingIssuers = ref(true);

onMounted(async () => {
    try {
        issuers.value = await mockService.getIssuers();
    } finally {
        loadingIssuers.value = false;
    }
});

const form = ref({
    organisationId: authStore.user?.organisationId || '',
    subsidiaryId: '',
    currency: CurrencyCode.NGN as CurrencyCode,
    issuerId: '',
    faceValue: '',
    couponRate: '',
    couponFrequency: 'SEMI_ANNUAL' as CouponFrequency,
    purchasePrice: '',
    tradeDate: dayjs().format('YYYY-MM-DD'),
    settlementDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    maturityDate: dayjs().add(5, 'year').format('YYYY-MM-DD'),
    counterpartyId: '',
    notes: ''
});

// Computed Issuer details
const selectedIssuer = computed(() => {
    return issuers.value.find(i => i.id === form.value.issuerId);
});

// Derived metrics
const derivedMetrics = computed(() => {
    const start = dayjs(form.value.settlementDate);
    const end = dayjs(form.value.maturityDate);
    const tenorYears = end.diff(start, 'year', true);

    const face = parseFloat(form.value.faceValue) || 0;
    const price = parseFloat(form.value.purchasePrice) || 0;
    const rate = parseFloat(form.value.couponRate) || 0;

    let ytm = 0;
    if (face > 0 && price > 0 && tenorYears > 0) {
        // Simple YTM Approximation: (C + (F-P)/n) / ((F+P)/2)
        const couponAmount = face * (rate / 100);
        ytm = (couponAmount + (face - price) / tenorYears) / ((face + price) / 2) * 100;
    }

    return {
        tenorYears: tenorYears.toFixed(2),
        ytm: ytm.toFixed(2),
        couponAmountPerPeriod: (face * (rate / 100) / (form.value.couponFrequency === 'ANNUAL' ? 1 : form.value.couponFrequency === 'SEMI_ANNUAL' ? 2 : 4)).toFixed(2)
    };
});

const handleSubmit = () => {
    emit('submit', {
        ...form.value,
        yieldToMaturity: derivedMetrics.value.ytm,
    });
};
</script>

<template>
    <div class="space-y-6 font-primary">
        <!-- Organization & Issuer -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-if="authStore.isGroupUser">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subsidiary</label>
                <select 
                    v-model="form.subsidiaryId"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                >
                    <option value="" disabled>Select Subsidiary</option>
                    <option v-for="sub in subStore.subsidiaries" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuer</label>
                <select 
                    v-model="form.issuerId"
                    :disabled="loadingIssuers"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors disabled:opacity-50"
                >
                    <option value="" disabled>{{ loadingIssuers ? 'Loading Issuers...' : 'Select Issuer' }}</option>
                    <option v-for="issuer in issuers" :key="issuer.id" :value="issuer.id">{{ issuer.name }} ({{ issuer.creditRating }})</option>
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
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                >
                    <option :value="CurrencyCode.NGN">NGN</option>
                    <option :value="CurrencyCode.USD">USD</option>
                    <option :value="CurrencyCode.EUR">EUR</option>
                    <option :value="CurrencyCode.GBP">GBP</option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Face Value (Par)</label>
                <div class="relative rounded-md shadow-sm">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">{{ form.currency }}</span>
                    </div>
                    <input 
                        v-model="form.faceValue"
                        type="number" 
                        class="block w-full pl-12 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
                <div class="relative rounded-md shadow-sm">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">{{ form.currency }}</span>
                    </div>
                    <input 
                        v-model="form.purchasePrice"
                        type="number" 
                        class="block w-full pl-12 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                        placeholder="0.00"
                    />
                </div>
            </div>
        </div>

        <!-- Coupon Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Rate (%)</label>
                <div class="relative rounded-md shadow-sm">
                    <input 
                        v-model="form.couponRate"
                        type="number" 
                        step="0.01"
                        class="block w-full pr-10 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                        placeholder="0.00"
                    />
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">%</span>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Frequency</label>
                <select 
                    v-model="form.couponFrequency"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                >
                    <option value="ANNUAL">Annual</option>
                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                    <option value="QUARTERLY">Quarterly</option>
                </select>
            </div>
        </div>

        <!-- Dates & Counterparty -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Settlement Date</label>
                <input 
                    v-model="form.settlementDate"
                    type="date" 
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maturity Date</label>
                <input 
                    v-model="form.maturityDate"
                    type="date" 
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                />
            </div>
            <!-- <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Counterparty (Custodian)</label>
                <select 
                    v-model="form.counterpartyId"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                >
                    <option value="" disabled>Select Bank</option>
                    <option v-for="bank in BANKS" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                </select>
            </div> -->
        </div>

        <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
             <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Counterparty (Custodian)</label>
                <select 
                    v-model="form.counterpartyId"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border text-gray-900 dark:text-white bg-white dark:bg-gray-900 transition-colors"
                >
                    <option value="" disabled>Select Bank</option>
                    <option v-for="bank in BANKS" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                </select>
            </div>
        </div>

        <!-- Metrics Preview -->
        <div class="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <span class="block text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Tenor (Years)</span>
                    <span class="block text-[9px] font-bold text-primary-700 dark:text-primary-400">{{ derivedMetrics.tenorYears }}</span>
                </div>
                <div>
                    <span class="block text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Est. YTM</span>
                    <span class="block text-[9px] font-bold text-money-600 dark:text-money-400">{{ derivedMetrics.ytm }}%</span>
                </div>
                <div>
                    <span class="block text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Coupon / Period</span>
                    <span class="block text-[9px] font-bold text-gray-900 dark:text-white">{{ form.currency }} {{ Number(derivedMetrics.couponAmountPerPeriod).toLocaleString() }}</span>
                </div>
                <div>
                    <span class="block text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Price / Par</span>
                    <span class="block text-[9px] font-bold" :class="parseFloat(form.purchasePrice) < parseFloat(form.faceValue) ? 'text-green-600' : 'text-red-600'">
                        {{ ((parseFloat(form.purchasePrice) / parseFloat(form.faceValue) || 0) * 100).toFixed(2) }}%
                    </span>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button 
                type="button" 
                @click="$emit('cancel')"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                Cancel
            </button>
            <button 
                type="button"
                @click="handleSubmit" 
                :disabled="isSubmitting"
                class="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                {{ isSubmitting ? 'Creating Bond...' : 'Register Bond Investment' }}
            </button>
        </div>
    </div>
</template>
