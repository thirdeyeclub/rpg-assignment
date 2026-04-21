<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { gql } from '@apollo/client/core'
import { useQuery } from '@vue/apollo-composable'

type Blog = {
  id: string
  subject: string
  content: string
  authorId: string
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
      createdAt
    }
  }
`

const route = useRoute()
const blogId = computed(() => String(route.params.id ?? ''))
const variables = computed<BlogQueryVariables>(() => ({ id: blogId.value }))

const { result, loading, error } = useQuery<BlogQueryResult, BlogQueryVariables>(BLOG_QUERY, variables)
const blog = computed(() => result.value?.blog ?? null)
</script>

<template>
  <main class="blog-detail-page">
    <p v-if="loading">Loading blog...</p>
    <p v-else-if="error">Failed to load blog.</p>
    <section v-else-if="blog" class="blog-card">
      <h1>{{ blog.subject }}</h1>
      <p class="meta">Blog ID: {{ blog.id }}</p>
      <p class="meta">Author ID: {{ blog.authorId }}</p>
      <p class="meta">Created At: {{ blog.createdAt }}</p>
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
