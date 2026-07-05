import { createRouter, createWebHistory } from 'vue-router'

export type PartnerSection =
  | 'partners'
  | 'local'
  | 'analytics'
  | 'projects'
  | 'relations'
  | 'contract'
  | 'settings'

const RouteStub = { template: '<span />' }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/partners' },
    { path: '/partners', component: RouteStub, meta: { section: 'partners' } },
    { path: '/local-merchants', component: RouteStub, meta: { section: 'local' } },
    { path: '/analytics', component: RouteStub, meta: { section: 'analytics' } },
    { path: '/projects', component: RouteStub, meta: { section: 'projects' } },
    { path: '/relations', component: RouteStub, meta: { section: 'relations' } },
    { path: '/contract-signing', component: RouteStub, meta: { section: 'contract' } },
    { path: '/settings', component: RouteStub, meta: { section: 'settings' } }
  ]
})

export default router
