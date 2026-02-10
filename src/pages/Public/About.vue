<script setup lang="ts">
const stats = [
  { label: 'Assets Managed', value: '$10B+' },
  { label: 'Companies', value: '500+' },
  { label: 'User Satisfaction', value: '99%' },
  { label: 'Countries', value: '12' },
]

const team = [
  {
    name: 'Leslie Alexander',
    role: 'Co-Founder / CEO',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
    {
    name: 'Michael Foster',
    role: 'Co-Founder / CTO',
    imageUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
    {
    name: 'Dries Vincent',
    role: 'Head of Product',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  // More people...
]
</script>

<template>
  <div class="bg-white dark:bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:mx-0">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Our mission</h2>
        <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
          We believe that every company, regardless of size, deserves access to world-class treasury management tools. Our mission is to democratize financial operations and empower businesses to make smarter investment decisions.
        </p>
      </div>
      <div class="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
        <div class="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-gray-900 dark:text-white sm:grid-cols-2 md:flex lg:gap-x-10">
          <a v-for="link in ['Open roles', 'Internship program', 'Our values', 'Meet our leadership']" :key="link" href="#">
            {{ link }} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <dl class="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="stat in stats" :key="stat.label" class="flex flex-col-reverse">
            <dt class="text-base leading-7 text-gray-600 dark:text-gray-400">{{ stat.label }}</dt>
            <dd class="text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">{{ stat.value }}</dd>
          </div>
        </dl>
      </div>
      
      <!-- Team section -->
      <div class="mx-auto mt-32 max-w-7xl px-6 sm:mt-48 lg:px-8">
        <div class="mx-auto max-w-2xl lg:mx-0">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Our team</h2>
          <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            We’re a dynamic group of individuals who are passionate about building better financial tools.
          </p>
        </div>
        <ul role="list" class="mx-auto mt-20 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-16 text-center sm:grid-cols-3 md:grid-cols-4 lg:mx-0 lg:max-w-none lg:grid-cols-5 xl:grid-cols-6">
          <li v-for="person in team" :key="person.name">
            <img class="mx-auto h-24 w-24 rounded-full" :src="person.imageUrl" alt="" />
            <h3 class="mt-6 text-base font-semibold leading-7 tracking-tight text-gray-900 dark:text-white">{{ person.name }}</h3>
            <p class="text-sm leading-6 text-gray-600 dark:text-gray-400">{{ person.role }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
