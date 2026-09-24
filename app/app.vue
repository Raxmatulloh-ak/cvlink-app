<script setup>
import {computed} from 'vue'
import {useAppStore} from '@/stores/app'

const appStore = useAppStore()

useHead({
  htmlAttrs: {
    lang: computed(() => appStore.state.locale),
    'data-bs-theme': computed(() => appStore.state.theme),
  },
})
</script>

<template>
  <NuxtLoadingIndicator color="#769FCD"/>
  <NuxtLayout>
    <NuxtPage/>
  </NuxtLayout>
  <ToastStack/>
</template>
