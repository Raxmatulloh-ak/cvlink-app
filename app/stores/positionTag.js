import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const usePositionTagStore = defineStore('position-tags', () => {
    const state = reactive({positionTags: [], positionTag: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchPositionTags(params = {}) {
        const response = await api().get('/position_tags', {params})
        state.positionTags = getCollection(response)
        state.totalItems = getTotalItems(response, state.positionTags)
        return state.positionTags
    }

    async function fetchPositionTag(id) {
        const response = await api().get(`/position_tags/${id}`)
        state.positionTag = response.data
        return state.positionTag
    }

    async function pushPositionTag(data) {
        const response = await api().post('/position_tags', data)
        state.positionTags.push(response.data)
        return response.data
    }

    async function deletePositionTag(id) {
        await api().delete(`/position_tags/${id}`)
        state.positionTags = state.positionTags.filter((item) => item.id !== Number(id))
    }

    return {state, fetchPositionTags, fetchPositionTag, pushPositionTag, deletePositionTag}
})
