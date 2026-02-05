import type { Role } from '../services/mockData';

export type Action =
    | 'org:view_all'
    | 'bank:view'
    | 'bank:create'
    | 'investment:view'
    | 'investment:create'
    | 'investment:edit'
    | 'roi:view'
    | 'liquidity:view'
    | 'withdrawal:create'
    | 'rollover:create'
    | 'approval:view_pending'
    | 'approval:approve'
    | 'approval:reject'
    | 'audit:view'
    | 'org:create'
    | 'org:edit'
    | 'user:view'
    | 'user:create'
    | 'user:edit';

export const PERMISSIONS: Record<Role, Partial<Record<Action, boolean | 'scoped' | 'conditional'>>> = {
    GROUP_CFO: {
        'org:view_all': true,
        'bank:view': true,
        'bank:create': true,
        'investment:view': true,
        'investment:create': true,
        'investment:edit': true,
        'roi:view': true,
        'liquidity:view': true,
        'withdrawal:create': 'conditional', // can initiate but discouraged
        'rollover:create': 'conditional',
        'approval:view_pending': true,
        'approval:approve': true,
        'approval:reject': true,
        'audit:view': true,
        'org:create': true,
        'org:edit': true,
    },
    GROUP_TREASURY_MANAGER: {
        'org:view_all': true,
        'bank:view': true,
        'bank:create': true,
        'investment:view': true,
        'investment:create': true,
        'investment:edit': true,
        'roi:view': true,
        'liquidity:view': true,
        'withdrawal:create': 'conditional', // approval required
        'rollover:create': 'conditional',
        'approval:view_pending': true,
        'approval:approve': false,
        'approval:reject': false,
        'audit:view': false,
    },
    SUB_FINANCE_MANAGER: {
        'org:view_all': 'scoped',
        'bank:view': true,
        'bank:create': false,
        'investment:view': 'scoped',
        'investment:create': 'scoped',
        'investment:edit': 'scoped',
        'roi:view': 'scoped',
        'liquidity:view': 'scoped',
        'withdrawal:create': 'scoped',
        'rollover:create': 'scoped',
        'approval:view_pending': 'scoped',
        'approval:approve': 'conditional', // below threshold
        'approval:reject': 'scoped',
        'audit:view': false,
    },
    SUB_FINANCE_OFFICER: {
        'org:view_all': 'scoped',
        'bank:view': true,
        'bank:create': false,
        'investment:view': 'scoped',
        'investment:create': 'scoped',
        'investment:edit': false,
        'roi:view': 'scoped',
        'liquidity:view': 'scoped',
        'withdrawal:create': 'scoped', // draft only?
        'rollover:create': 'scoped', // draft only?
        'approval:view_pending': false,
        'approval:approve': false,
        'approval:reject': false,
        'audit:view': false,
    },
    AUDITOR: {
        'org:view_all': true,
        'bank:view': true,
        'bank:create': false,
        'investment:view': true,
        'investment:create': false,
        'investment:edit': false,
        'roi:view': true,
        'liquidity:view': true,
        'withdrawal:create': false,
        'rollover:create': false,
        'approval:view_pending': false,
        'approval:approve': false,
        'audit:view': true,
    },
    GROUP_VIEWER: {
        'org:view_all': true,
        'bank:view': true,
        'bank:create': false,
        'investment:view': true,
        'investment:create': false,
        'investment:edit': false,
        'roi:view': true,
        'liquidity:view': true,
        'withdrawal:create': false,
        'rollover:create': false,
        'approval:view_pending': false,
        'approval:approve': false,
        'approval:reject': false,
        'audit:view': false,
    },
    SUB_VIEWER: {
        'org:view_all': 'scoped',
        'bank:view': true,
        'bank:create': false,
        'investment:view': 'scoped',
        'investment:create': false,
        'investment:edit': false,
        'roi:view': 'scoped',
        'liquidity:view': 'scoped',
        'withdrawal:create': false,
        'rollover:create': false,
        'approval:view_pending': false,
        'approval:approve': false,
        'approval:reject': false,
        'audit:view': false,
    },
    SYSTEM_ADMIN: {
        'org:view_all': true,
        'bank:view': true,
        'bank:create': true,
        'investment:view': false,
        'investment:create': false,
        'investment:edit': false,
        'roi:view': false,
        'liquidity:view': false,
        'withdrawal:create': false,
        'rollover:create': false,
        'approval:view_pending': false,
        'approval:approve': false,
        'approval:reject': false,
        'audit:view': false,
        'org:create': true,
        'org:edit': true,
        'user:view': true,
        'user:create': true,
        'user:edit': true,
    }
};
