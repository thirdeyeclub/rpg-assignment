import { readonly, ref } from 'vue'
import { ACCESS_TOKEN_KEY } from '@/apollo/client'

type BlogPublishedPayload = {
  blogId: string
  authorId: string
  authorEmail: string
}

type NotificationItem = {
  id: number
  blogId: string
  authorEmail: string
  createdAt: number
}

const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
let source: EventSource | null = null
let nextNotificationId = 1
let activeToken: string | null = null

const closeStreamOnly = () => {
  source?.close()
  source = null
}

const toNotificationsEndpoint = (token: string) => {
  const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || '/graphql'
  const baseUrl = graphqlUrl.endsWith('/graphql') ? graphqlUrl.slice(0, -'/graphql'.length) : graphqlUrl
  return `${baseUrl}/notifications?access_token=${encodeURIComponent(token)}`
}

const appendNotification = (blogId: string, authorEmail: string) => {
  const id = nextNotificationId++
  notifications.value = [
    {
      id,
      blogId,
      authorEmail,
      createdAt: Date.now(),
    },
    ...notifications.value,
  ].slice(0, 50)
  unreadCount.value += 1
}

const parsePayload = (rawData: string): BlogPublishedPayload | null => {
  try {
    const parsed = JSON.parse(rawData) as BlogPublishedPayload
    if (!parsed.blogId || !parsed.authorId || !parsed.authorEmail) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const parseTokenUserId = (token: string): string | null => {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) {
      return null
    }
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}

const disconnect = () => {
  closeStreamOnly()
  activeToken = null
  notifications.value = []
  unreadCount.value = 0
}

const markAllRead = () => {
  unreadCount.value = 0
}

const dismissNotification = (id: number) => {
  const exists = notifications.value.some((n) => n.id === id)
  if (!exists) {
    return
  }
  notifications.value = notifications.value.filter((n) => n.id !== id)
  if (unreadCount.value > 0) {
    unreadCount.value -= 1
  }
}

const connect = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) {
    disconnect()
    return
  }

  if (source && activeToken === token) {
    return
  }

  if (activeToken && activeToken !== token) {
    notifications.value = []
    unreadCount.value = 0
  }

  closeStreamOnly()
  activeToken = token
  const currentUserId = parseTokenUserId(token)
  source = new EventSource(toNotificationsEndpoint(token))

  source.onerror = () => {
    closeStreamOnly()
  }

  const handleIncomingEvent = (event: MessageEvent<string>) => {
    const payload = parsePayload(event.data)
    if (!payload) {
      return
    }
    if (currentUserId && payload.authorId === currentUserId) {
      return
    }
    appendNotification(payload.blogId, payload.authorEmail)
  }

  source.addEventListener('blog-published', (event) => {
    handleIncomingEvent(event as MessageEvent<string>)
  })
}

export const useNotifications = () => ({
  notifications: readonly(notifications),
  unreadCount: readonly(unreadCount),
  connect,
  disconnect,
  markAllRead,
  dismissNotification,
})
