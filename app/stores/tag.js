import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const useTagStore = defineStore('tags', () => {
    const state = reactive({tags: []})
    const api = useNuxtApp().$axios

    async function fetchTags(params = {}) {
        const response = await api.get('/tags', {params})
        state.tags = getCollection(response)

        return state.tags
    }

    return {state, fetchTags}
})
