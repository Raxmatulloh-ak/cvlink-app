import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const useDiscussionStore = defineStore('discussions', () => {
    const state = reactive({discussions: [], loading: false})
    const api = () => useNuxtApp().$axios

    async function fetchDiscussions(positionId) {
        state.loading = true
        try {
            const response = await api().get(`/positions/${positionId}/discussions`)
            state.discussions = getCollection(response)
            return state.discussions
        } finally {
            state.loading = false
        }
    }

    async function pushDiscussion(positionId, data) {
        const response = await api().post(`/positions/${positionId}/discussions`, data)
        state.discussions.push(response.data)
        return response.data
    }

    return {state, fetchDiscussions, pushDiscussion}
})
