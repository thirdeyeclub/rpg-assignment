<script setup lang="ts">
import { computed, onBeforeMount, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { gql } from '@apollo/client/core'
import { useQuery } from '@vue/apollo-composable'
import { ACCESS_TOKEN_KEY } from '@/apollo/client'
import { forceLogout, isAuthApolloError } from '@/lib/authSession'

type Blog = {
  id: string
  subject: string
  content: string
  authorId: string
  authorEmail: string
  createdAt: number
}

type BlogQueryResult = {
  blog: Blog | null
}

type BlogQueryVariables = {
  id: string
}

const BLOG_QUERY = gql`
  query Blog($id: String!) {
    blog(id: $id) {
      id
      subject
      content
      authorId
      authorEmail
      createdAt
    }
  }
`

const route = useRoute()
const blogId = computed(() => String(route.params.id ?? ''))
const variables = computed<BlogQueryVariables>(() => ({ id: blogId.value }))

const queryEnabled = computed(() => {
  void route.fullPath
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)) && blogId.value.length > 0
})

const { result, loading, error } = useQuery<BlogQueryResult, BlogQueryVariables>(
  BLOG_QUERY,
  variables,
  () => ({
    enabled: queryEnabled.value,
  }),
)

const blog = computed(() => result.value?.blog ?? null)

onBeforeMount(() => {
  if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
    void forceLogout()
  }
})

watch(
  () => route.fullPath,
  () => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      void forceLogout()
    }
  },
)

watchEffect(() => {
  if (isAuthApolloError(error.value)) {
    void forceLogout()
  }
})
</script>

<template>
  <main class="blog-detail-page">
    <p v-if="loading">Loading blog...</p>
    <p v-else-if="error">Failed to load blog.</p>
    <section v-else-if="blog" class="blog-card">
      <p class="meta">{{ new Date(blog.createdAt * 1000).toLocaleString() }}</p>
      <h1>{{ blog.subject }}</h1>
      <p class="meta">Written by: {{ blog.authorEmail }}</p>
      <p class="content">{{ blog.content }}</p>
    </section>
    <p v-else>Blog not found.</p>
  </main>
</template>

<style scoped>
.blog-detail-page {
  padding: 1rem 0;
}

.blog-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
}

.meta {
  color: var(--color-text);
  opacity: 0.7;
  margin: 0.25rem 0;
}

.content {
  margin-top: 1rem;
  white-space: pre-wrap;
}
</style>
