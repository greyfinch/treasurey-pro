import { computed } from 'vue';
import { CURRENT_USER } from '../services/mockData';
import { PERMISSIONS } from '../utils/permissions';
import type { Action } from '../utils/permissions';

export const usePermissions = () => {
    const user = CURRENT_USER;

    const canDo = (action: Action, resource?: { organisationId?: string, amount?: number }) => {
        const permission = PERMISSIONS[user.role][action];

        if (!permission) return false;

        // Scope Check
        if (permission === 'scoped') {
            if (!resource?.organisationId) return true; // General view if scoped? Usually refers to "within own org"
            return resource.organisationId === user.organisationId || user.role === 'GROUP_CFO';
        }

        // Threshold Check for SUB_FINANCE_MANAGER
        if (action === 'approval:approve' && user.role === 'SUB_FINANCE_MANAGER') {
            const THRESHOLD = 5000000; // 5M example
            if (resource?.amount && resource.amount > THRESHOLD) {
                return false; // Requires Group CFO
            }
        }

        return true;
    };

    const isGroupScope = computed(() => ['GROUP_CFO', 'GROUP_TREASURY_MANAGER', 'AUDITOR'].includes(user.role));

    return {
        user,
        canDo,
        isGroupScope
    };
};
