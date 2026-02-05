import { ref } from 'vue';
import type { Organisation, User } from './mockData';
import { mockService } from './mockData';

const activeOrganisation = ref<Organisation | null>(null);
const currentUser = ref<User | null>(null);
const organisations = ref<Organisation[]>([]);
const isLoading = ref(true);

export const useOrganisation = () => {
    const init = async () => {
        isLoading.value = true;
        try {
            const [user, orgs] = await Promise.all([
                mockService.getCurrentUser(),
                mockService.getOrganisations()
            ]);
            currentUser.value = user;
            organisations.value = orgs;

            // Default to user's assigned organisation
            const userOrg = orgs.find(o => o.id === user.organisationId);
            activeOrganisation.value = userOrg || null;
        } finally {
            isLoading.value = false;
        }
    };

    const setActiveOrganisation = (orgId: string) => {
        // Security Check: Only Group roles can switch organisations
        // In usePermissions, group roles have isGroupScope = true
        // We can't import usePermissions here due to circular dependency (it uses mockService which is used here)
        // But we can check the user role directly or use a simpler check
        if (currentUser.value?.role !== 'GROUP_CFO' && currentUser.value?.role !== 'GROUP_TREASURY_MANAGER' && currentUser.value?.role !== 'AUDITOR') {
            if (orgId !== currentUser.value?.organisationId) {
                console.warn('Unauthorised organisation switch attempt blocked');
                return;
            }
        }

        const org = organisations.value.find(o => o.id === orgId);
        if (org) {
            activeOrganisation.value = org;
        }
    };

    const isGroupContext = () => activeOrganisation.value?.type === 'GROUP';

    const getVisibleSubsidiaries = () => {
        if (!activeOrganisation.value) return [];
        if (activeOrganisation.value.type === 'GROUP') {
            return organisations.value.filter(o => o.type === 'SUBSIDIARY');
        }
        return [activeOrganisation.value];
    };

    return {
        activeOrganisation,
        currentUser,
        organisations,
        isLoading,
        init,
        setActiveOrganisation,
        isGroupContext,
        getVisibleSubsidiaries
    };
};

// Singleton-ish instance for global access
export const organisationService = useOrganisation();
