<script setup>
import {reactive, ref} from 'vue'
import {useUserStore} from '@/stores/user'
import {useAppStore} from '@/stores/app'
import {apiMessage} from '@/utils/api'

definePageMeta({layout: 'blank'})
const userStore = useUserStore()
const appStore = useAppStore()
const loading = ref(false)
const error = ref('')
const form = reactive({email: '', password: '', consent: false})
useSeoMeta({title: 'Create account'})

async function submit() {
    loading.value = true
    error.value = ''
    try {
        await userStore.register({email: form.email, password: form.password})
        appStore.notify('Account created. You can sign in now.')
        await navigateTo('/auth/sign-in')
    } catch (exception) {
        error.value = apiMessage(exception, 'Unable to create your account.')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="auth-card__mobile-logo d-lg-none">
        <AppLogo/>
    </div>
    <span class="eyebrow">Start with one profile</span>
    <h1 class="auth-title">Create your account</h1>
    <p class="auth-copy">Register as a candidate. Recruiter and Administrator roles are assigned by authorized
        users.</p>

    <div v-if="error" class="alert alert-danger mt-4">{{ error }}</div>
    <form class="mt-4" @submit.prevent="submit">
        <div class="mb-3"><label class="form-label fw-semibold">Email address</label><input v-model="form.email"
                                                                                            type="email"
                                                                                            class="form-control"
                                                                                            autocomplete="email"
                                                                                            required></div>
        <div class="mb-3"><label class="form-label fw-semibold">Password</label><input v-model="form.password"
                                                                                       type="password"
                                                                                       class="form-control"
                                                                                       minlength="6"
                                                                                       autocomplete="new-password"
                                                                                       required>
            <div class="form-text">At least 6 characters.</div>
        </div>
        <div class="form-check mb-3"><input id="terms" v-model="form.consent" class="form-check-input" type="checkbox"
                                            required><label for="terms" class="form-check-label small">I agree to the
            Terms and Privacy Policy.</label></div>
        <button class="btn btn-primary w-100 py-2" :disabled="loading">
            {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
    </form>
    <p class="text-center small text-body-secondary mt-4 mb-0">Already registered?
        <NuxtLink to="/auth/sign-in" class="fw-semibold">Sign in</NuxtLink>
    </p>
</template>
