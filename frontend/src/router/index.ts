import { createRouter, createWebHistory } from 'vue-router'
import BlogDetailView from '../views/BlogDetailView.vue'
import BlogView from '../views/BlogView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import { ACCESS_TOKEN_KEY } from '@/apollo/client'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/welcome',
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
      meta: { guestOnly: true },
    },
    {
      path: '/auth',
      name: 'auth',
      redirect: '/welcome',
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView,
      meta: { requiresAuth: true },
    },
    {
      path: '/blogs/:id',
      name: 'blog-detail',
      component: BlogDetailView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  const isAuthenticated = Boolean(token)

  if (to.meta.requiresAuth && !isAuthenticated) {
    showToast('Please login.', 'error')
    return { path: '/welcome' }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { path: '/blog' }
  }

  return true
})

export default router
