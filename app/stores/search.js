import {defineStore} from 'pinia'
import {reactive} from 'vue'

export const useSearchStore = defineStore('search', () => {
    const state = reactive({results: [], loading: false})
    const api = useNuxtApp().$axios

    async function search(query) {
        state.loading = true
        try {
            const response = await api.get('/search', {params: {q: query}})
            state.results = [
                ...(response.data.positions || []).map((item) => ({...item, type: 'position'})),
                ...(response.data.cvs || []).map((item) => ({...item, type: 'cv', title: item.positionTitle})),
            ]

            return state.results
        } finally {
            state.loading = false
        }
    }

    return {state, search}
})
