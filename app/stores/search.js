import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const useSearchStore = defineStore('search', () => {
    const state = reactive({results: [], loading: false})
    const api = () => useNuxtApp().$axios

    async function search(query) {
        state.loading = true
        try {
            const response = await api().get('/search', {params: {q: query}})
            state.results = getCollection(response)
            return state.results
        } finally {
            state.loading = false
        }
    }

    return {state, search}
})
