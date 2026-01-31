import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'

// Lazy load detail page
const InvestmentList = () => import('../pages/Investments/List.vue')
const InvestmentDetail = () => import('../pages/Investments/Detail.vue')
const BankList = () => import('../pages/Banks/List.vue')

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard
    },
    {
        path: '/banks',
        name: 'Banks',
        component: BankList
    },
    {
        path: '/investments',
        name: 'Investments',
        component: InvestmentList
    },
    {
        path: '/investments/:id',
        name: 'InvestmentDetail',
        component: InvestmentDetail
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
