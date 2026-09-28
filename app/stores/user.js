import {computed, reactive} from 'vue'
import {defineStore} from 'pinia'
import {getCollection} from '@/utils/api'
import {ROLE_ADMIN, ROLE_CANDIDATE} from '@/constants/roles'
import {useAppStore} from '@/stores/app'

export const useUserStore = defineStore('users', () => {
    const tokenCookie = useCookie('cvlink_token', {sameSite: 'lax'})

    const state = reactive({
        user: null,
        users: [],
        accessToken: tokenCookie.value || null,
        loading: false,
    })

    const api = useNuxtApp().$axios
    const isAuthenticated = computed(() => Boolean(state.accessToken))
    const roles = computed(() => state.user?.roles || [])
    const primaryRole = computed(() => roles.value[0] || ROLE_CANDIDATE)
    const primaryRoleLabel = computed(() => primaryRole.value.replace('ROLE_', '').toLowerCase())
    const displayName = computed(() => state.user?.email?.split('@')[0] || 'Account')
    const initials = computed(() => displayName.value
        .split(/[._\-\s]+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CV')

    function setToken(token) {
        state.accessToken = token || null
        tokenCookie.value = token || null
    }

    function hasRole(...allowed) {
        if (roles.value.includes(ROLE_ADMIN)) {
            return true
        }

        return allowed.some((role) => roles.value.includes(role))
    }

    async function auth(credentials) {
        const response = await api.post('/users/auth', credentials)
        setToken(response.data.accessToken)
        await fetchAboutMe(true)

        return response.data
    }

    async function register(data) {
        const response = await api.post('/users', data)

        return response.data
    }

    async function fetchAboutMe(force = false) {
        if (state.user && !force) {
            return state.user
        }

        if (!state.accessToken) {
            return null
        }

        const response = await api.post('/users/about_me', null, {
            headers: {Authorization: `Bearer ${state.accessToken}`},
        })

        state.user = response.data
        const appStore = useAppStore()
        appStore.setLocale(state.user.locale)
        appStore.setTheme(state.user.theme)

        return state.user
    }

    async function fetchUsers(params = {}) {
        state.loading = true
        try {
            const response = await api.get('/users', {params})
            state.users = getCollection(response)

            return state.users
        } finally {
            state.loading = false
        }
    }

    async function fetchPublicProfile(id) {
        const response = await api.get(`/users/${id}/public-profile`)

        return response.data
    }

    async function patchPreferences(data) {
        const response = await api.patch('/users/preferences', data)
        state.user = response.data
        const appStore = useAppStore()
        appStore.setLocale(state.user.locale)
        appStore.setTheme(state.user.theme)

        return state.user
    }

    async function patchUsers(data) {
        for (const id of data.ids) {
            const user = state.users.find((item) => item.id === id)

            if (!user) {
                continue
            }

            let payload

            if (data.action === 'MAKE_RECRUITER' || data.action === 'MAKE_ADMIN') {
                const role = data.action === 'MAKE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_RECRUITER'
                payload = {roles: [...new Set([...user.roles, role])]}
            } else if (data.action === 'REMOVE_ADMIN' || data.action === 'REMOVE_RECRUITER') {
                const role = data.action === 'REMOVE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_RECRUITER'
                payload = {roles: user.roles.filter((value) => value !== role)}
            } else {
                payload = {status: data.action === 'BLOCK' ? 'blocked' : 'active'}
            }

            await api.patch(`/users/${id}`, payload)
        }

        if (data.ids.includes(state.user?.id)) {
            if (data.action === 'BLOCK') {
                await signOut()
            } else {
                await fetchAboutMe(true)
            }
        }
    }

    async function signOut() {
        setToken(null)
        state.user = null
        await navigateTo('/')
    }

    return {
        state,
        isAuthenticated,
        roles,
        primaryRole,
        primaryRoleLabel,
        displayName,
        initials,
        hasRole,
        auth,
        register,
        fetchAboutMe,
        fetchUsers,
        fetchPublicProfile,
        patchPreferences,
        patchUsers,
        signOut,
    }
})
