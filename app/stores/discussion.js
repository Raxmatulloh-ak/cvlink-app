import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const useDiscussionStore = defineStore('discussions', () => {
    const state = reactive({discussions: [], loading: false})
    const api = useNuxtApp().$axios

    async function fetchDiscussions(positionId, after = null) {
        state.loading = true
        try {
            const response = await api.get(`/positions/${positionId}/discussions`, {
                params: after ? {after} : {},
            })
            const items = getCollection(response)
            state.discussions = after ? [...state.discussions, ...items] : items

            return state.discussions
        } finally {
            state.loading = false
        }
    }

    async function pushDiscussion(positionId, message) {
        const response = await api.post(`/positions/${positionId}/discussions`, {message})
        state.discussions.push(response.data)

        return response.data
    }

    return {state, fetchDiscussions, pushDiscussion}
})
