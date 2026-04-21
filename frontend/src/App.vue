<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import AppToast from './components/AppToast.vue'
import { useNotifications } from './composables/useNotifications'

const { notifications, connect } = useNotifications()

onMounted(() => {
  connect()
})
</script>

<template>
  <main class="app-shell">
    <section v-if="notifications.length" class="notifications">
      <h2>Notifications</h2>
      <ul>
        <li v-for="notification in notifications" :key="notification.id">
          <RouterLink :to="`/blogs/${notification.blogId}`">New blog: {{ notification.blogId }}</RouterLink>
        </li>
      </ul>
    </section>

    <RouterView />
  </main>
  <AppToast />
</template>

<style scoped>
.app-shell {
  padding: 1.5rem;
}

nav {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

nav a {
  text-decoration: none;
}

.notifications {
  margin-bottom: 1rem;
}

.notifications h2 {
  font-size: 1rem;
  margin-bottom: 0.4rem;
}

.notifications ul {
  margin: 0;
  padding-left: 1.2rem;
}
</style>
