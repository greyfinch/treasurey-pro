<script setup lang="ts">
import PublicNavbar from '../components/Public/Navbar.vue'
import PublicFooter from '../components/Public/Footer.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
    <PublicNavbar />
    <main class="flex-grow pt-20"> <!-- pt-20 to account for fixed navbar -->
      <router-view></router-view>
    </main>
    <PublicFooter />
  </div>
</template>
