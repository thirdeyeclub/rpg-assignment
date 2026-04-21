import { createRouter, createWebHistory } from 'vue-router'
import BlogDetailView from '../views/BlogDetailView.vue'
import BlogView from '../views/BlogView.vue'
import WelcomeView from '../views/WelcomeView.vue'

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
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView,
    },
    {
      path: '/blogs/:id',
      name: 'blog-detail',
      component: BlogDetailView,
    },
  ],
})

export default router
