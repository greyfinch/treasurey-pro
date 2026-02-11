import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'

// Lazy load pages
const Login = () => import('../pages/Login.vue')
const InvestmentList = () => import('../pages/Investments/List.vue')
const InvestmentDetail = () => import('../pages/Investments/Detail.vue')
const TreasuryBillDetail = () => import('../pages/Investments/TreasuryBillDetail.vue')
const CommercialPaperDetail = () => import('../pages/Investments/CommercialPaperDetail.vue')
const BondDetail = () => import('../pages/Investments/BondDetail.vue')
const SubsidiaryDetail = () => import('../pages/Subsidiaries/Detail.vue')
const Settings = () => import('../pages/Settings/Settings.vue')
const AuditLogs = () => import('../pages/AuditLogs.vue')
const Reports = () => import('../pages/Reports.vue')

// Public Pages
const Landing = () => import('../pages/Public/Landing.vue')
const Features = () => import('../pages/Public/Features.vue')
const Pricing = () => import('../pages/Public/Pricing.vue')
const About = () => import('../pages/Public/About.vue')
const Contact = () => import('../pages/Public/Contact.vue')


const routes: RouteRecordRaw[] = [
    // Public Routes
    {
        path: '/',
        name: 'Landing',
        component: Landing,
        meta: { layout: 'public', requiresAuth: false }
    },
    {
        path: '/features',
        name: 'Features',
        component: Features,
        meta: { layout: 'public', requiresAuth: false }
    },
    {
        path: '/pricing',
        name: 'Pricing',
        component: Pricing,
        meta: { layout: 'public', requiresAuth: false }
    },
    {
        path: '/about',
        name: 'About',
        component: About,
        meta: { layout: 'public', requiresAuth: false }
    },
    {
        path: '/contact',
        name: 'Contact',
        component: Contact,
        meta: { layout: 'public', requiresAuth: false }
    },

    // Auth Routes
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },

    // App Routes
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/banks',
        redirect: { path: '/settings', query: { tab: 'banks' } }
    },
    {
        path: '/subsidiaries',
        redirect: { path: '/settings', query: { tab: 'organisations' } }
    },
    {
        path: '/subsidiaries/:id',
        name: 'SubsidiaryDetail',
        component: SubsidiaryDetail,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings,
        meta: { requiresAuth: true }
    },
    {
        path: '/audit-logs',
        name: 'AuditLogs',
        component: AuditLogs,
        meta: { requiresAuth: true }
    },
    {
        path: '/investments',
        name: 'Investments',
        component: InvestmentList,
        meta: { requiresAuth: true }
    },
    {
        path: '/investments/tbills/:id',
        name: 'TreasuryBillDetail',
        component: TreasuryBillDetail,
        meta: { requiresAuth: true }
    },
    {
        path: '/investments/cp/:id',
        name: 'CommercialPaperDetail',
        component: CommercialPaperDetail,
        meta: { requiresAuth: true }
    },
    {
        path: '/investments/mmf/:id',
        name: 'mmf-detail',
        component: () => import('../pages/Investments/MMFDetail.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/investments/bond/:id',
        name: 'BondDetail',
        component: BondDetail,
        meta: { requiresAuth: true }
    },

    {
        path: '/investments/:id',
        name: 'InvestmentDetail',
        component: InvestmentDetail,
        meta: { requiresAuth: true }
    },
    {
        path: '/reports',
        name: 'Reports',
        component: Reports,
        meta: { requiresAuth: true }
    },
    {
        path: '/risk',
        component: () => import('../layouts/RiskLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'fx-exposure',
                name: 'FXExposure',
                component: () => import('../pages/RiskManagement/FXExposure.vue')
            },
            {
                path: 'fx-forwards',
                name: 'FXForwards',
                component: () => import('../pages/RiskManagement/FXForwards.vue')
            },
            {
                path: 'mtm-valuation',
                name: 'MTMValuation',
                component: () => import('../pages/RiskManagement/MTMValuation.vue')
            },
            {
                path: 'hedge-coverage',
                name: 'HedgeCoverage',
                component: () => import('../pages/RiskManagement/HedgeCoverage.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !isAuthenticated) {
        // Redirect to login if trying to access protected route
        next({ name: 'Login' })
    } else if (to.name === 'Login' && isAuthenticated) {
        // Redirect to dashboard if already logged in and trying to access login
        next({ name: 'Dashboard' })
    } else {
        next()
    }
})

export default router
