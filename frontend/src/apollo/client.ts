import { ApolloClient, from, HttpLink, InMemoryCache } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

export const ACCESS_TOKEN_KEY = 'accessToken'

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  void import('@/lib/authSession').then(({ isAuthFailureGraphQL, forceLogout }) => {
    if (isAuthFailureGraphQL(graphQLErrors, networkError)) {
      void forceLogout()
    }
  })
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
})
