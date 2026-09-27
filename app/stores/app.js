import {defineStore} from 'pinia'
import {reactive} from 'vue'

export const useAppStore = defineStore('app', () => {
    const themeCookie = useCookie('cvlink_theme', {default: () => 'light', sameSite: 'lax'})
    const localeCookie = useCookie('cvlink_locale', {default: () => 'en', sameSite: 'lax'})

    const state = reactive({
        theme: themeCookie.value === 'dark' ? 'dark' : 'light',
        locale: localeCookie.value === 'uz' ? 'uz' : 'en',
        toasts: [],
    })

    function setTheme(theme) {
        state.theme = theme === 'dark' ? 'dark' : 'light'
        themeCookie.value = state.theme

        return state.theme
    }

    function toggleTheme() {
        return setTheme(state.theme === 'dark' ? 'light' : 'dark')
    }

    function setLocale(locale) {
        state.locale = locale === 'uz' ? 'uz' : 'en'
        localeCookie.value = state.locale

        return state.locale
    }

    function switchLocale() {
        return setLocale(state.locale === 'en' ? 'uz' : 'en')
    }

    function dismissToast(id) {
        state.toasts = state.toasts.filter((toast) => toast.id !== id)
    }

    function notify(message, type = 'success') {
        const id = `${Date.now()}-${Math.random()}`
        state.toasts.push({id, message, type})
        setTimeout(() => dismissToast(id), 4500)
    }

    return {state, setTheme, toggleTheme, setLocale, switchLocale, notify, dismissToast}
})
