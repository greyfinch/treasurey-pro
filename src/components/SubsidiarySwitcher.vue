<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon, BuildingOfficeIcon, GlobeAltIcon } from '@heroicons/vue/20/solid'
import { organisationService } from '../services/organisationService'
import { usePermissions } from '../composables/usePermissions'

const { activeOrganisation, organisations, setActiveOrganisation, isLoading } = organisationService
const { user, isGroupScope } = usePermissions()

const filteredOrganisations = computed(() => {
    if (isGroupScope.value) return organisations.value
    return organisations.value.filter(org => org.id === user.organisationId)
})

onMounted(async () => {
    if (!activeOrganisation.value) {
        await organisationService.init();
    }
})

const handleSelect = (orgId: string) => {
    setActiveOrganisation(orgId);
}
</script>

<template>
    <div v-if="!isLoading && activeOrganisation" class="w-64">
        <Listbox :modelValue="activeOrganisation.id" @update:modelValue="handleSelect">
            <div class="relative mt-1">
                <ListboxButton
                    class="relative w-full cursor-default rounded-lg bg-gray-50 dark:bg-gray-800 py-2 pl-10 pr-10 text-left border border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-300 sm:text-sm transition-all hover:bg-white dark:hover:bg-gray-700"
                >
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                        <GlobeAltIcon v-if="activeOrganisation.type === 'GROUP'" class="h-5 w-5 text-primary-500" aria-hidden="true" />
                        <BuildingOfficeIcon v-else class="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    </span>
                    <span class="block truncate font-medium text-gray-900 dark:text-white">{{ activeOrganisation.name }}</span>
                    <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronUpDownIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    </span>
                </ListboxButton>

                <transition
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                >
                    <ListboxOptions
                        class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none sm:text-sm z-[60] border dark:border-gray-700"
                    >
                        <ListboxOption
                            v-for="org in filteredOrganisations"
                            :key="org.id"
                            :value="org.id"
                            v-slot="{ active, selected }"
                            as="template"
                        >
                            <li
                                :class="[
                                    active ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-200',
                                    'relative cursor-default select-none py-2 pl-10 pr-4 transition-colors',
                                ]"
                            >
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <GlobeAltIcon v-if="org.type === 'GROUP'" class="h-4 w-4" :class="selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'" aria-hidden="true" />
                                    <BuildingOfficeIcon v-else class="h-4 w-4" :class="selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'" aria-hidden="true" />
                                </span>
                                <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">
                                    {{ org.name }}
                                </span>
                                <span
                                    v-if="selected"
                                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600 dark:text-primary-400"
                                >
                                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                </span>
                            </li>
                        </ListboxOption>
                    </ListboxOptions>
                </transition>
            </div>
        </Listbox>
    </div>
    <div v-else class="h-10 w-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
</template>
