import type { GraphQLFormattedError } from 'graphql'
import { ACCESS_TOKEN_KEY, apolloClient } from '@/apollo/client'
import { useNotifications } from '@/composables/useNotifications'

function graphQLHintsAuthFailure(graphQLErrors: readonly GraphQLFormattedError[] | undefined): boolean {
  if (!graphQLErrors?.length) {
    return false
  }
  return graphQLErrors.some((g) => {
    const code = g.extensions?.code
    if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
      return true
    }
    const m = g.message.toLowerCase()
    return m.includes('unauthorized') || m.includes('unauthenticated') || m.includes('jwt')
  })
}

function networkHintsAuthFailure(networkError: Error | null | undefined): boolean {
  if (!networkError || typeof networkError !== 'object') {
    return false
  }
  const n = networkError as { statusCode?: number; message?: string }
  if (n.statusCode === 401 || n.statusCode === 403) {
    return true
  }
  const m = (n.message || '').toLowerCase()
  return m.includes('unauthorized') || m.includes('401') || m.includes('403')
}

export function isAuthFailureGraphQL(
  graphQLErrors: readonly GraphQLFormattedError[] | undefined,
  networkError: Error | null | undefined,
): boolean {
  return graphQLHintsAuthFailure(graphQLErrors) || networkHintsAuthFailure(networkError)
}

export function isAuthApolloError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false
  }
  const e = err as {
    graphQLErrors?: readonly GraphQLFormattedError[]
    networkError?: Error | null
    message?: string
  }
  if (graphQLHintsAuthFailure(e.graphQLErrors) || networkHintsAuthFailure(e.networkError)) {
    return true
  }
  const m = (e.message || '').toLowerCase()
  return m.includes('unauthorized') || m.includes('unauthenticated') || m.includes('forbidden')
}

export async function forceLogout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  await apolloClient.clearStore()
  useNotifications().disconnect()
  const { default: router } = await import('@/router')
  await router.replace({ path: '/welcome', replace: true })
}
