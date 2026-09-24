import {defineStore} from 'pinia'
import {reactive} from 'vue'

export const useStatisticsStore = defineStore('statistics', () => {
    const state = reactive({
        statistics: null,
        unavailable: false,
    })
    const api = () => useNuxtApp().$axios

    async function fetchStatistics() {
        try {
            const response = await api().get('/statistics')
            state.statistics = response.data
            state.unavailable = false
        } catch (error) {
            if (error?.response?.status === 404) {
                state.unavailable = true
                state.statistics = null
                return null
            }
            throw error
        }
        return state.statistics
    }

    return {state, fetchStatistics}
})
