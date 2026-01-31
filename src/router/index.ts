import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'

// Lazy load pages
const Login = () => import('../pages/Login.vue')
const InvestmentList = () => import('../pages/Investments/List.vue')
const InvestmentDetail = () => import('../pages/Investments/Detail.vue')
const BankList = () => import('../pages/Banks/List.vue')

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/banks',
        name: 'Banks',
        component: BankList,
        meta: { requiresAuth: true }
    },
    {
        path: '/investments',
        name: 'Investments',
        component: InvestmentList,
        meta: { requiresAuth: true }
    },
    {
        path: '/investments/:id',
        name: 'InvestmentDetail',
        component: InvestmentDetail,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
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
