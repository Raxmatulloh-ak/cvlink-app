import {defineStore} from 'pinia'
import {reactive} from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
    const state = reactive({dashboard: null, loading: false})
    const api = useNuxtApp().$axios

    async function fetchDashboard() {
        state.loading = true
        try {
            const response = await api.get('/dashboard')
            state.dashboard = response.data

            return state.dashboard
        } finally {
            state.loading = false
        }
    }

    return {state, fetchDashboard}
})
