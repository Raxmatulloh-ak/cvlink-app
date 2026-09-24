<script setup>
import {reactive, ref} from 'vue'
import {useUserStore} from '@/stores/user'
import {apiMessage} from '@/utils/api'

definePageMeta({layout: 'auth'})
const userStore = useUserStore()
const route = useRoute()
const loading = ref(false)
const error = ref('')
const form = reactive({email: '', password: ''})
useSeoMeta({title: 'Sign in'})

async function submit() {
    loading.value = true
    error.value = ''
    try {
        await userStore.auth(form)
        await navigateTo(String(route.query.redirect || '/profile'))
    } catch (exception) {
        error.value = apiMessage(exception, 'Invalid email or password.')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="auth-card__mobile-logo d-lg-none"><AppLogo/></div>
    <span class="eyebrow">Welcome back</span>
    <h1 class="auth-title">Sign in to CVLink</h1>
    <p class="auth-copy">Continue with your profile, projects and position-specific CVs.</p>

    <div v-if="error" class="alert alert-danger mt-4">{{ error }}</div>
    <form class="mt-4" @submit.prevent="submit">
        <div class="mb-3"><label class="form-label fw-semibold">Email address</label><input v-model="form.email" type="email" class="form-control" autocomplete="email" required></div>
        <div class="mb-3"><label class="form-label fw-semibold">Password</label><input v-model="form.password" type="password" class="form-control" autocomplete="current-password" required></div>
        <button class="btn btn-primary w-100 py-2" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
    </form>

    <div class="d-flex align-items-center gap-3 my-4"><span class="border-top flex-grow-1"></span><small class="text-body-secondary">social login</small><span class="border-top flex-grow-1"></span></div>
    <div class="row g-2"><div class="col-6"><button class="btn btn-outline-secondary w-100" disabled>Google</button></div><div class="col-6"><button class="btn btn-outline-secondary w-100" disabled>Facebook</button></div></div>
    <p class="text-center small text-body-secondary mt-4 mb-0">New to CVLink? <NuxtLink to="/auth/register" class="fw-semibold">Create an account</NuxtLink></p>
</template>
