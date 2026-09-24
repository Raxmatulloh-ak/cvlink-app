import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const usePositionAttributeStore = defineStore('position-attributes', () => {
    const state = reactive({positionAttributes: [], positionAttribute: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchPositionAttributes(params = {}) {
        const response = await api().get('/position_attributes', {params})
        state.positionAttributes = getCollection(response)
        state.totalItems = getTotalItems(response, state.positionAttributes)
        return state.positionAttributes
    }

    async function fetchPositionAttribute(id) {
        const response = await api().get(`/position_attributes/${id}`)
        state.positionAttribute = response.data
        return state.positionAttribute
    }

    async function pushPositionAttribute(data) {
        const response = await api().post('/position_attributes', data)
        state.positionAttributes.push(response.data)
        return response.data
    }

    async function deletePositionAttribute(id) {
        await api().delete(`/position_attributes/${id}`)
        state.positionAttributes = state.positionAttributes.filter((item) => item.id !== Number(id))
    }

    return {state, fetchPositionAttributes, fetchPositionAttribute, pushPositionAttribute, deletePositionAttribute}
})
