<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { ACCESS_TOKEN_KEY } from '@/apollo/client'
import { useToast } from '@/composables/useToast'

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

type CreateBlogMutationResult = {
  createBlog: Blog
}

type CreateBlogMutationVariables = {
  input: {
    subject: string
    content: string
  }
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

const CREATE_BLOG_MUTATION = gql`
  mutation CreateBlog($input: CreateBlogInput!) {
    createBlog(input: $input) {
      id
      subject
      content
      authorId
      createdAt
    }
  }
`

const subject = ref('')
const content = ref('')
const router = useRouter()
const { showToast } = useToast()

const { result, loading, error, refetch } = useQuery<BlogsQueryResult>(BLOGS_QUERY, undefined, {
  fetchPolicy: 'network-only',
})
const { mutate: createBlogMutate, loading: createLoading } = useMutation<
  CreateBlogMutationResult,
  CreateBlogMutationVariables
>(CREATE_BLOG_MUTATION)

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

const blogs = computed(() => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  const currentUserId = token ? parseTokenUserId(token) : null
  if (!currentUserId) {
    return []
  }
  const items = result.value?.blogs ?? []
  return items.filter((blog) => blog.authorId === currentUserId)
})
const isSubmitting = computed(() => createLoading.value)

watchEffect(() => {
  const message = error.value?.message?.toLowerCase() ?? ''
  if (!message.includes('unauthorized')) {
    return
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  void router.replace('/welcome')
})

const parseErrorMessage = (errorValue: unknown) => {
  if (typeof errorValue === 'object' && errorValue && 'message' in errorValue) {
    return String(errorValue.message)
  }
  return 'Failed to create blog.'
}

const handleCreateBlog = async () => {
  const nextSubject = subject.value.trim()
  const nextContent = content.value.trim()

  if (!nextSubject || !nextContent) {
    showToast('Subject and content are required.', 'error')
    return
  }

  try {
    await createBlogMutate({
      input: {
        subject: nextSubject,
        content: nextContent,
      },
    })
    subject.value = ''
    content.value = ''
    await refetch()
    showToast('Blog created.', 'success')
  } catch (errorValue) {
    showToast(parseErrorMessage(errorValue), 'error')
  }
}
</script>

<template>
  <main class="blog-page">
    <h1>Create a new blog</h1>
    <section class="blog-compose">
      <form class="blog-compose-form" @submit.prevent="handleCreateBlog">
        <label for="blog-subject">Subject</label>
        <input
          id="blog-subject"
          v-model="subject"
          type="text"
          placeholder="Enter a subject"
          :disabled="isSubmitting"
        />

        <label for="blog-content">Content</label>
        <textarea
          id="blog-content"
          v-model="content"
          rows="7"
          placeholder="Write your blog..."
          :disabled="isSubmitting"
        />

        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Posting...' : 'Post blog' }}
        </button>
      </form>
    </section>

    <h3 v-if="blogs.length > 0"><b>Your Blogs</b></h3>
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

.blog-compose {
  margin: 1rem 0;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
}

.blog-compose-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.blog-compose-form input,
.blog-compose-form textarea {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.55rem 0.65rem;
  font: inherit;
}

.blog-compose-form textarea {
  resize: vertical;
}

.blog-compose-form button {
  margin-top: 0.25rem;
  align-self: flex-start;
  border: 1px solid hsla(160, 100%, 37%, 1);
  border-radius: 8px;
  background: transparent;
  color: hsla(160, 100%, 37%, 1);
  padding: 0.55rem 0.75rem;
  cursor: pointer;
}

.blog-compose-form button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.blog-list {
  margin: 1rem 0 0;
  padding-left: 1.2rem;
}

.blog-item {
  margin-bottom: 0.4rem;
}
</style>
