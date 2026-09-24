import {computed, reactive} from 'vue'
import {defineStore} from 'pinia'
import {getCollection, getTotalItems} from '@/utils/api'
import {ROLE_ADMIN, ROLE_CANDIDATE} from '@/constants/roles'

export const useUserStore = defineStore('users', () => {
    const tokenCookie = useCookie('cvlink_token', {sameSite: 'lax'})

    const state = reactive({
        user: null,
        users: [],
        totalItems: 0,
        accessToken: tokenCookie.value || null,
        loading: false,
    })

    const isAuthenticated = computed(() => Boolean(state.accessToken))
    const roles = computed(() => state.user?.roles || [])
    const primaryRole = computed(() => roles.value[0] || ROLE_CANDIDATE)
    const primaryRoleLabel = computed(() => primaryRole.value.replace('ROLE_', '').toLowerCase())
    const displayName = computed(() => state.user?.email?.split('@')[0] || 'Account')
    const initials = computed(() => displayName.value.split(/[._\-\s]+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CV')

    function api() {
        return useNuxtApp().$axios
    }

    function setToken(token) {
        state.accessToken = token || null
        tokenCookie.value = token || null
    }

    function hasRole(...allowed) {
        if (roles.value.includes(ROLE_ADMIN)) return true
        return allowed.some((role) => roles.value.includes(role))
    }

    async function auth(credentials) {
        const response = await api().post('/users/auth', credentials)
        setToken(response.data.accessToken)
        await fetchAboutMe(true)
        return response.data
    }

    async function register(data) {
        const response = await api().post('/users', data)
        return response.data
    }

    async function fetchAboutMe(force = false) {
        if (state.user && !force) return state.user
        if (!state.accessToken) return null

        const response = await api().post('/users/about_me')
        state.user = response.data
        return state.user
    }

    async function fetchUsers(params = {}) {
        state.loading = true
        try {
            const response = await api().get('/users', {params})
            state.users = getCollection(response)
            state.totalItems = getTotalItems(response, state.users)
            return state.users
        } finally {
            state.loading = false
        }
    }

    async function fetchUser(id) {
        const response = await api().get(`/users/${id}`)
        return response.data
    }

    async function deleteUser(id) {
        await api().delete(`/users/${id}`)
        state.users = state.users.filter((user) => user.id !== Number(id))
    }

    async function patchUsers(data) {
        const response = await api().patch('/users/batch', data)
        return response.data
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
        fetchUser,
        deleteUser,
        patchUsers,
        signOut,
    }
})
