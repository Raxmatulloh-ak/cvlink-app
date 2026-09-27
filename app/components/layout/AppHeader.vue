<script setup>
import {computed, ref, watch} from 'vue'
import {useAppStore} from '@/stores/app'
import {useUserStore} from '@/stores/user'
import {useTranslate} from '@/composables/useTranslate'
import {apiMessage} from '@/utils/api'

const appStore = useAppStore()
const userStore = useUserStore()
const {t} = useTranslate()
const route = useRoute()
const mobileOpen = ref(false)
const search = ref('')
const accountTarget = computed(() => userStore.hasRole('ROLE_CANDIDATE') ? '/profile' : '/positions')

const navigation = computed(() => [
    {label: t('common.home'), to: '/'},
    {label: t('common.positions'), to: '/positions'},
    ...(userStore.isAuthenticated && userStore.hasRole('ROLE_CANDIDATE') ? [{
        label: t('common.profile'),
        to: '/profile'
    }] : []),
    ...(userStore.hasRole('ROLE_RECRUITER') ? [{label: t('common.attributes'), to: '/attributes'}] : []),
    ...(userStore.hasRole('ROLE_ADMIN') ? [{label: t('common.users'), to: '/users'}] : []),
])

function submitSearch() {
    const q = search.value.trim()
    if (q) {
        navigateTo({path: '/search', query: {q}})
    }
}

async function changeTheme() {
    const theme = appStore.toggleTheme()
    if (!userStore.isAuthenticated) {
        return
    }

    try {
        await userStore.patchPreferences({theme})
    } catch (error) {
        appStore.notify(apiMessage(error, 'Theme preference could not be saved.'), 'error')
    }
}

async function changeLocale() {
    const locale = appStore.switchLocale()
    if (!userStore.isAuthenticated) {
        return
    }

    try {
        await userStore.patchPreferences({locale})
    } catch (error) {
        appStore.notify(apiMessage(error, 'Language preference could not be saved.'), 'error')
    }
}

watch(() => route.fullPath, () => {
    mobileOpen.value = false
})
</script>

<template>
    <header class="site-header">
        <div class="container-xl site-header__inner">
            <AppLogo/>

            <nav class="site-nav d-none d-lg-flex" aria-label="Main navigation">
                <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" class="site-nav__link"
                          active-class="site-nav__link--active">
                    {{ item.label }}
                </NuxtLink>
            </nav>

            <form class="header-search d-none d-xl-flex" @submit.prevent="submitSearch">
                <BaseIcon name="search" :size="17"/>
                <input v-model="search" :placeholder="t('home.searchPlaceholder')">
            </form>

            <div class="site-header__actions">
                <NuxtLink to="/search" class="icon-button d-none d-lg-inline-flex d-xl-none" aria-label="Search">
                    <BaseIcon name="search" :size="18"/>
                </NuxtLink>
                <button type="button" class="icon-button"
                        :aria-label="appStore.state.theme === 'dark' ? 'Light theme' : 'Dark theme'"
                        @click="changeTheme">
                    <BaseIcon :name="appStore.state.theme === 'dark' ? 'sun' : 'moon'" :size="18"/>
                </button>

                <button type="button" class="locale-button d-none d-sm-inline-flex" @click="changeLocale">
                    <BaseIcon name="globe" :size="16"/>
                    {{ appStore.state.locale.toUpperCase() }}
                </button>

                <template v-if="userStore.isAuthenticated">
                    <NuxtLink v-if="userStore.hasRole('ROLE_RECRUITER')" to="/positions/new"
                              class="btn btn-primary d-none d-lg-inline-flex align-items-center gap-2 px-3">
                        <BaseIcon name="plus" :size="16"/>
                        New position
                    </NuxtLink>
                    <NuxtLink :to="accountTarget" class="user-pill d-none d-md-flex text-decoration-none">
                        <span class="user-pill__avatar">{{ userStore.initials }}</span>
                        <span class="user-pill__text">
                            <strong>{{ userStore.displayName }}</strong>
                            <small>{{ userStore.primaryRoleLabel }}</small>
                        </span>
                    </NuxtLink>
                    <button type="button" class="icon-button d-none d-sm-inline-flex" :title="t('common.signOut')"
                            @click="userStore.signOut">
                        <BaseIcon name="logout" :size="18"/>
                    </button>
                </template>

                <div v-else class="d-none d-md-flex align-items-center gap-2">
                    <NuxtLink to="/auth/sign-in" class="btn btn-link text-decoration-none fw-semibold text-body">
                        {{ t('common.signIn') }}
                    </NuxtLink>
                    <NuxtLink to="/auth/register" class="btn btn-primary px-3">{{ t('common.register') }}</NuxtLink>
                </div>

                <button type="button" class="icon-button d-lg-none" aria-label="Menu" @click="mobileOpen = !mobileOpen">
                    <BaseIcon :name="mobileOpen ? 'close' : 'menu'" :size="20"/>
                </button>
            </div>
        </div>

        <div v-if="mobileOpen" class="mobile-nav d-lg-none">
            <div class="container-xl py-3">
                <form class="header-search w-100 mb-3" @submit.prevent="submitSearch">
                    <BaseIcon name="search" :size="17"/>
                    <input v-model="search" :placeholder="t('home.searchPlaceholder')">
                </form>
                <nav class="d-grid gap-1">
                    <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" class="mobile-nav__link">
                        {{ item.label }}
                    </NuxtLink>
                    <NuxtLink v-if="!userStore.isAuthenticated" to="/auth/sign-in" class="btn btn-primary mt-2">
                        {{ t('common.signIn') }}
                    </NuxtLink>
                    <button v-else type="button" class="btn btn-outline-danger mt-2" @click="userStore.signOut">
                        {{ t('common.signOut') }}
                    </button>
                </nav>
            </div>
        </div>
    </header>
</template>
