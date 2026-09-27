<script setup>
import {useUserStore} from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const {data: profile} = await useAsyncData(`public-profile-${route.params.id}`, () => (
    userStore.fetchPublicProfile(route.params.id)
))

useSeoMeta({title: computed(() => profile.value?.name || 'Public profile')})
</script>

<template>
    <section class="page-hero py-4">
        <div class="container-xl">
            <span class="eyebrow">Public profile</span>
            <h1 class="h3 mb-0">{{ profile?.name || `User #${route.params.id}` }}</h1>
        </div>
    </section>

    <section class="page-section pt-4">
        <div class="container-xl" style="max-width: 760px">
            <div class="surface p-4">
                <p class="mb-0 text-body-secondary">This is the public identity used from position discussions.</p>
            </div>
        </div>
    </section>
</template>
