import { readonly, ref } from 'vue'

type ToastType = 'success' | 'error'

type ToastState = {
  id: number
  message: string
  type: ToastType
}

const toast = ref<ToastState | null>(null)
let timeoutId: number | null = null
let nextId = 1

const clearToast = () => {
  if (timeoutId) {
    window.clearTimeout(timeoutId)
    timeoutId = null
  }
  toast.value = null
}

const showToast = (message: string, type: ToastType = 'success', duration = 3000) => {
  clearToast()
  toast.value = { id: nextId++, message, type }
  timeoutId = window.setTimeout(() => {
    toast.value = null
    timeoutId = null
  }, duration)
}

export const useToast = () => ({
  toast: readonly(toast),
  showToast,
  clearToast,
})
