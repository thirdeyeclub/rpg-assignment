<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toast, clearToast } = useToast()
</script>

<template>
  <div v-if="toast" class="toast-wrapper">
    <div class="toast" :class="toast.type" @click="clearToast">
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-wrapper {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.toast {
  min-width: 220px;
  max-width: 340px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  cursor: pointer;
}

.success {
  background: #1f8f57;
}

.error {
  background: #b83b3b;
}
</style>
