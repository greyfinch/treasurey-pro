<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './layouts/AppLayout.vue'
import PublicLayout from './layouts/PublicLayout.vue'

const route = useRoute()

const layout = computed(() => {
  // If explicitly set to public
  if (route.meta.layout === 'public') {
    return PublicLayout
  }
  // Login page usually doesn't have a frame layout, or it's self-contained
  if (route.name === 'Login') {
    return null
  }
  // Default to AppLayout for authenticated/dashboard pages
  return AppLayout
})
</script>

<template>
  <component :is="layout" v-if="layout">
    <router-view></router-view>
  </component>
  <router-view v-else></router-view>
</template>
