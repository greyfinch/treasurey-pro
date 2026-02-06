<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/vue/24/outline'
import { mockService } from '../../services/mockData'
import type { Organisation } from '../../services/mockData'
import SubsidiaryFormModal from '../../components/SubsidiaryFormModal.vue'

const organisations = ref<Organisation[]>([])
const loading = ref(true)
const showModal = ref(false)
const selectedOrg = ref<Organisation | null>(null)
const isDeleting = ref<string | null>(null)

const fetchData = async () => {
    loading.value = true
    try {
        organisations.value = await mockService.getOrganisations()
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)

const openCreateModal = () => {
    selectedOrg.value = null
    showModal.value = true
}

const openEditModal = (org: Organisation) => {
    selectedOrg.value = org
    showModal.value = true
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subsidiary? This action cannot be undone.')) return
    
    isDeleting.value = id
    try {
        await mockService.deleteOrganisation(id)
        await fetchData()
    } catch (err: any) {
        alert(err.message || 'Failed to delete organisation')
    } finally {
        isDeleting.value = null
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subsidiary Management</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Manage your organisation units and subsidiaries</p>
            </div>
            <button @click="openCreateModal" class="btn-primary">
                <PlusIcon class="w-5 h-5" />
                New Subsidiary
            </button>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="org in organisations" :key="org.id" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary-900/10 transition-all">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <BuildingOfficeIcon class="w-6 h-6" />
                        </div>
                        <span :class="[
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            org.type === 'GROUP' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        ]">
                            {{ org.type }}
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ org.name }}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-mono mb-4">ID: {{ org.id }}</p>
                </div>

                <div class="flex items-center justify-end gap-2 border-t border-gray-50 dark:border-gray-700 pt-4 mt-2">
                    <router-link 
                        :to="`/subsidiaries/${org.id}`"
                        class="px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors mr-auto"
                    >
                        View Details
                    </router-link>
                    <button 
                        @click="openEditModal(org)" 
                        class="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                        title="Edit Subsidiary"
                    >
                        <PencilSquareIcon class="w-5 h-5" />
                    </button>
                    <button 
                        v-if="org.type !== 'GROUP'"
                        @click="handleDelete(org.id)" 
                        :disabled="isDeleting === org.id"
                        class="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Subsidiary"
                    >
                        <TrashIcon v-if="isDeleting !== org.id" class="w-5 h-5" />
                        <div v-else class="w-5 h-5 border-2 border-red-600 dark:border-red-400 border-t-transparent animate-spin rounded-full"></div>
                    </button>
                </div>
            </div>
        </div>

        <SubsidiaryFormModal 
            :is-open="showModal"
            :organisation="selectedOrg"
            @close="showModal = false"
            @saved="fetchData"
        />
    </div>
</template>
