<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { gql } from '@apollo/client/core'
import { useQuery } from '@vue/apollo-composable'

type Blog = {
  id: string
  subject: string
  content: string
  authorId: string
  createdAt: number
}

type BlogsQueryResult = {
  blogs: Blog[]
}

const BLOGS_QUERY = gql`
  query Blogs {
    blogs {
      id
      subject
      content
      authorId
      createdAt
    }
  }
`

const { result, loading, error } = useQuery<BlogsQueryResult>(BLOGS_QUERY)
const blogs = computed(() => result.value?.blogs ?? [])
</script>

<template>
  <main class="blog-page">
    <h1>Blogs</h1>
    <p v-if="loading">Loading blogs...</p>
    <p v-else-if="error">Failed to load blogs.</p>
    <ul v-else-if="blogs.length" class="blog-list">
      <li v-for="blog in blogs" :key="blog.id" class="blog-item">
        <RouterLink :to="`/blogs/${blog.id}`">{{ blog.subject }}</RouterLink>
      </li>
    </ul>
    <p v-else>No blogs yet.</p>
  </main>
</template>

<style scoped>
.blog-page {
  padding: 1rem 0;
}

.blog-list {
  margin: 1rem 0 0;
  padding-left: 1.2rem;
}

.blog-item {
  margin-bottom: 0.4rem;
}
</style>
