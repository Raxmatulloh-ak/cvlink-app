import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useTagStore = defineStore('tags', () => {
    const state = reactive({tags: [], tag: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchTags(params = {}) {
        const response = await api().get('/tags', {params})
        state.tags = getCollection(response)
        state.totalItems = getTotalItems(response, state.tags)
        return state.tags
    }

    async function fetchTag(id) {
        const response = await api().get(`/tags/${id}`)
        state.tag = response.data
        return state.tag
    }

    return {state, fetchTags, fetchTag}
})
