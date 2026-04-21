<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink, RouterView } from 'vue-router'
import { ACCESS_TOKEN_KEY, apolloClient } from './apollo/client'
import AppToast from './components/AppToast.vue'
import { useNotifications } from './composables/useNotifications'

const route = useRoute()
const router = useRouter()
const { notifications, unreadCount, connect, disconnect, markAllRead, dismissNotification } =
  useNotifications()
const hasAuth = computed(() => {
  void route.fullPath
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY))
})

const showBackToBlog = computed(() => route.path !== '/blog')

const dropdownOpen = ref(false)
const notificationRootRef = ref<HTMLElement | null>(null)

const handleSignOut = async () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  await apolloClient.clearStore()
  disconnect()
  dropdownOpen.value = false
  await router.push('/welcome')
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const onNotificationNavigate = (id: number) => {
  dismissNotification(id)
  closeDropdown()
}

const onDocumentClick = (event: MouseEvent) => {
  const root = notificationRootRef.value
  if (!dropdownOpen.value || !root) {
    return
  }
  if (!root.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  connect()
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

watch(
  () => route.fullPath,
  () => {
    connect()
  },
)

watch(hasAuth, (ok) => {
  if (!ok) {
    dropdownOpen.value = false
  }
})
</script>

<template>
  <main class="app-shell" :class="{ 'has-top-nav': hasAuth }">
    <header v-if="hasAuth" class="app-top-nav">
      <div class="app-top-nav-start">
        <RouterLink v-if="showBackToBlog" to="/blog" class="nav-link">Back to blog</RouterLink>
        <button type="button" class="nav-button" @click="handleSignOut">Sign out</button>
      </div>
      <div ref="notificationRootRef" class="notification-root">
        <button
          type="button"
          class="notification-bell"
          :class="{ ringing: unreadCount > 0 }"
          aria-label="Notifications"
          :aria-expanded="dropdownOpen"
          aria-haspopup="true"
          @click.stop="toggleDropdown"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3a5 5 0 0 0-5 5v2.8c0 .7-.2 1.4-.6 2l-1.2 1.8c-.5.7 0 1.8.9 1.8h12c.9 0 1.4-1.1.9-1.8l-1.2-1.8a3.6 3.6 0 0 1-.6-2V8a5 5 0 0 0-5-5Zm0 18a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 21Z"
            />
          </svg>
          <span v-if="unreadCount > 0" class="notification-count">{{ unreadCount }}</span>
        </button>

        <div v-if="dropdownOpen" class="notification-dropdown" role="menu">
          <p v-if="notifications.length === 0" class="notification-empty">No notifications yet.</p>
          <RouterLink
            v-for="notification in notifications"
            :key="notification.id"
            :to="`/blogs/${notification.blogId}`"
            class="notification-row"
            role="menuitem"
            @click="onNotificationNavigate(notification.id)"
          >
            New blog by {{ notification.authorEmail }}
          </RouterLink>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="notification-mark-read"
            @click="markAllRead"
          >
            Mark all read
          </button>
        </div>
      </div>
    </header>

    <RouterView />
  </main>
  <AppToast />
</template>

<style scoped>
.app-shell {
  padding: 1.5rem;
}

.app-shell.has-top-nav {
  padding-top: 5rem;
}

.app-top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.app-top-nav-start {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
  opacity: 0.9;
}

.nav-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.nav-button {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.notification-root {
  position: relative;
  flex-shrink: 0;
}

.notification-bell {
  position: relative;
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

.notification-dropdown {
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  width: min(20rem, calc(100vw - 2rem));
  max-height: min(22rem, 70vh);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.35rem 0;
}

.notification-empty {
  margin: 0;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  opacity: 0.75;
}

.notification-row {
  display: block;
  padding: 0.55rem 0.85rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
  border-top: 1px solid var(--color-border);
}

.notification-row:first-of-type {
  border-top: none;
}

.notification-row:hover {
  background: var(--color-background-soft);
}

.notification-mark-read {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 0.85rem;
  border: none;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
}

.notification-mark-read:hover {
  background: var(--color-background-soft);
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
</style>
