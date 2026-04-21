import { readonly, ref } from 'vue'
import { ACCESS_TOKEN_KEY } from '@/apollo/client'

type BlogPublishedPayload = {
  blogId: string
  authorId: string
}

type NotificationItem = {
  id: number
  blogId: string
  createdAt: number
}

const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
let source: EventSource | null = null
let nextNotificationId = 1
let activeToken: string | null = null

const toNotificationsEndpoint = (token: string) => {
  const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || '/graphql'
  const baseUrl = graphqlUrl.endsWith('/graphql') ? graphqlUrl.slice(0, -'/graphql'.length) : graphqlUrl
  return `${baseUrl}/notifications?access_token=${encodeURIComponent(token)}`
}

const appendNotification = (blogId: string) => {
  const id = nextNotificationId++
  notifications.value = [
    {
      id,
      blogId,
      createdAt: Date.now(),
    },
    ...notifications.value,
  ].slice(0, 20)
  unreadCount.value += 1
  window.setTimeout(() => {
    notifications.value = notifications.value.filter((notification) => notification.id !== id)
  }, 5000)
}

const parsePayload = (rawData: string): BlogPublishedPayload | null => {
  try {
    const parsed = JSON.parse(rawData) as BlogPublishedPayload
    if (!parsed.blogId || !parsed.authorId) {
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
  source?.close()
  source = null
  activeToken = null
  notifications.value = []
  unreadCount.value = 0
}

const markAllRead = () => {
  unreadCount.value = 0
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

  disconnect()
  activeToken = token
  const currentUserId = parseTokenUserId(token)
  source = new EventSource(toNotificationsEndpoint(token))

  const handleIncomingEvent = (event: MessageEvent<string>) => {
    const payload = parsePayload(event.data)
    if (!payload) {
      return
    }
    if (currentUserId && payload.authorId === currentUserId) {
      return
    }
    appendNotification(payload.blogId)
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
})
