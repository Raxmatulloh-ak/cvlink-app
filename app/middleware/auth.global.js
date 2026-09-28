import {useUserStore} from '@/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) {
        return
    }

    const userStore = useUserStore()

    if (userStore.isAuthenticated && !userStore.state.user) {
        try {
            await userStore.fetchAboutMe()
        } catch {
            await userStore.signOut()
            if (to.meta.auth === true) return navigateTo(`/auth/sign-in?redirect=${encodeURIComponent(to.fullPath)}`)
        }
    }

    if (to.meta.auth === true && !userStore.isAuthenticated) {
        return navigateTo(`/auth/sign-in?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    const requiredRoles = Array.isArray(to.meta.roles) ? to.meta.roles : []
    if (requiredRoles.length && !requiredRoles.some((role) => userStore.hasRole(role))) {
        return navigateTo('/')
    }
})
