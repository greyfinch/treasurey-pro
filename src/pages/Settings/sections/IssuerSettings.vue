<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/vue/24/outline'
import { mockService, type Issuer } from '../../../services/mockData'
import IssuerFormModal from '../../../components/Investments/IssuerFormModal.vue'

const loading = ref(true)
const issuers = ref<Issuer[]>([])
const showModal = ref(false)
const editingIssuer = ref<Issuer | null>(null)

onMounted(async () => {
    await fetchData()
})

const fetchData = async () => {
    loading.value = true
    try {
        issuers.value = await mockService.getIssuers()
    } finally {
        loading.value = false
    }
}

const openAddModal = () => {
    editingIssuer.value = null
    showModal.value = true
}

const openEditModal = (issuer: Issuer) => {
    editingIssuer.value = issuer
    showModal.value = true
}

const handleSaved = async () => {
    await fetchData()
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issuer? This might affect existing commercial papers.')) return
    try {
        await mockService.deleteIssuer(id)
        await fetchData()
    } catch (e) {
        alert('Failed to delete issuer')
    }
}
</script>

<template>
    <div class="space-y-6 font-primary">
        <div class="flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BuildingOfficeIcon class="w-5 h-5 text-primary-500" />
                    CP Issuers
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Manage organizations that issue Commercial Papers</p>
            </div>
            <button 
                @click="openAddModal"
                class="btn-primary flex items-center gap-2 text-sm px-4 py-2"
            >
                <PlusIcon class="w-4 h-4" />
                Add Issuer
            </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <div v-if="loading" class="p-12 text-center text-gray-500 dark:text-gray-400">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                Loading issuers...
            </div>
            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">
                        <tr>
                            <th class="px-6 py-4 text-left">Issuer Name</th>
                            <th class="px-6 py-4 text-left">Type</th>
                            <th class="px-6 py-4 text-left">Sector</th>
                            <th class="px-6 py-4 text-center">Rating</th>
                            <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                        <tr v-for="issuer in issuers" :key="issuer.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-bold text-gray-900 dark:text-white">{{ issuer.name }}</div>
                                <div class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{{ issuer.id }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase',
                                    issuer.type === 'CORPORATE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                ]">
                                    {{ issuer.type.replace('_', ' ') }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {{ issuer.sector }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <span class="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {{ issuer.creditRating }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button @click="openEditModal(issuer)" class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                                    <PencilSquareIcon class="w-4 h-4" />
                                </button>
                                <button @click="handleDelete(issuer.id)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                        <tr v-if="issuers.length === 0">
                             <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/10">
                                No issuers found. Start by adding a new issuer.
                             </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <IssuerFormModal 
            :is-open="showModal"
            :issuer-to-edit="editingIssuer"
            @close="showModal = false"
            @saved="handleSaved"
        />
    </div>
</template>
