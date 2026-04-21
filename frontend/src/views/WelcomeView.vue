<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import { useMutation } from '@vue/apollo-composable'
import { ACCESS_TOKEN_KEY } from '@/apollo/client'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'

type AuthMode = 'login' | 'register'

type LoginMutation = {
  login: {
    accessToken: string
  }
}

type LoginVariables = {
  input: {
    email: string
    password: string
  }
}

type RegisterMutation = {
  register: {
    id: string
  }
}

type RegisterVariables = {
  input: {
    email: string
    password: string
  }
}

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
    }
  }
`

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      id
    }
  }
`

const mode = ref<AuthMode>('login')
const email = ref('')
const password = ref('')
const router = useRouter()
const { showToast } = useToast()
const { connect } = useNotifications()

const { mutate: loginMutate, loading: loginLoading } = useMutation<LoginMutation, LoginVariables>(
  LOGIN_MUTATION,
)
const { mutate: registerMutate, loading: registerLoading } = useMutation<
  RegisterMutation,
  RegisterVariables
>(REGISTER_MUTATION)

const isLoading = computed(() => loginLoading.value || registerLoading.value)
const submitLabel = computed(() => (mode.value === 'login' ? 'Login' : 'Register'))

const parseErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error && 'message' in error) {
    return String(error.message)
  }
  return 'Something went wrong. Please try again.'
}

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    showToast('Email and password are required.', 'error')
    return
  }

  try {
    if (mode.value === 'login') {
      const result = await loginMutate({
        input: {
          email: email.value,
          password: password.value,
        },
      })
      const accessToken = result?.data?.login.accessToken
      if (!accessToken) {
        throw new Error('Login did not return an access token.')
      }
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      connect()
      showToast('Login successful.', 'success')
      await router.push('/blog')
      return
    }

    await registerMutate({
      input: {
        email: email.value,
        password: password.value,
      },
    })
    showToast('Registration successful.', 'success')
    await router.push('/blog')
  } catch (error) {
    showToast(parseErrorMessage(error), 'error')
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Welcome, Login to being blogging</h1>
      <div class="mode-toggle">
        <button
          type="button"
          :class="{ active: mode === 'login' }"
          :disabled="isLoading"
          @click="mode = 'login'"
        >
          Login
        </button>
        <button
          type="button"
          :class="{ active: mode === 'register' }"
          :disabled="isLoading"
          @click="mode = 'register'"
        >
          Register
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" autocomplete="email" />

        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" />

        <button type="submit" :disabled="isLoading">{{ isLoading ? 'Please wait...' : submitLabel }}</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.auth-card {
  width: 100%;
  max-width: 820px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.25rem;
}

.auth-card h1 {
  margin: 0 0 1rem;
}

.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mode-toggle button {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
}

.mode-toggle button.active {
  border-color: hsla(160, 100%, 37%, 1);
  color: hsla(160, 100%, 37%, 1);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-form input {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.55rem 0.65rem;
}

.auth-form button[type='submit'] {
  margin-top: 0.5rem;
  border: 1px solid hsla(160, 100%, 37%, 1);
  border-radius: 8px;
  background: transparent;
  color: hsla(160, 100%, 37%, 1);
  padding: 0.55rem 0.75rem;
  cursor: pointer;
}

.auth-form button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>

