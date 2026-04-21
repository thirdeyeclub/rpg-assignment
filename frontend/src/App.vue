<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink, RouterView } from 'vue-router'
import { ACCESS_TOKEN_KEY } from './apollo/client'
import AppToast from './components/AppToast.vue'
import { useNotifications } from './composables/useNotifications'

const route = useRoute()
const router = useRouter()
const { notifications, unreadCount, connect, disconnect, markAllRead } = useNotifications()
const showSignOut = computed(() => route.path === '/blog')

const handleSignOut = async () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  disconnect()
  await router.push('/welcome')
}

onMounted(() => {
  connect()
})
</script>

<template>
  <main class="app-shell">
    <button v-if="showSignOut" type="button" class="signout-button" @click="handleSignOut">Sign out</button>

    <button
      v-if="unreadCount > 0"
      type="button"
      class="notification-bell"
      :class="{ ringing: unreadCount > 0 }"
      aria-label="Notifications"
      @click="markAllRead"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3a5 5 0 0 0-5 5v2.8c0 .7-.2 1.4-.6 2l-1.2 1.8c-.5.7 0 1.8.9 1.8h12c.9 0 1.4-1.1.9-1.8l-1.2-1.8a3.6 3.6 0 0 1-.6-2V8a5 5 0 0 0-5-5Zm0 18a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 21Z"
        />
      </svg>
      <span v-if="unreadCount > 0" class="notification-count">{{ unreadCount }}</span>
    </button>

    <section class="notification-toasts" aria-live="polite">
      <RouterLink
        v-for="notification in notifications"
        :key="notification.id"
        :to="`/blogs/${notification.blogId}`"
        class="notification-toast"
      >
        New blog posted
      </RouterLink>
    </section>

    <RouterView />
  </main>
  <AppToast />
</template>

<style scoped>
.app-shell {
  padding: 1.5rem;
}

.signout-button {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 30;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.notification-bell {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 30;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-background);
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.notification-bell svg {
  width: 1.35rem;
  height: 1.35rem;
  fill: currentColor;
}

.notification-bell.ringing svg {
  animation: ring 0.8s ease-in-out infinite;
}

.notification-count {
  position: absolute;
  top: -0.35rem;
  right: -0.2rem;
  min-width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1.2rem;
  text-align: center;
  padding: 0 0.2rem;
}

.notification-toasts {
  position: fixed;
  top: 4.1rem;
  right: 1rem;
  z-index: 20;
  width: min(20rem, calc(100vw - 2rem));
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-toast {
  display: block;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  text-decoration: none;
  padding: 0.7rem 0.8rem;
  animation: slide-down 0.2s ease-out;
}

@keyframes ring {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(10deg);
  }
  75% {
    transform: rotate(-10deg);
  }
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
