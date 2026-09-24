import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useUserAttributeValueStore = defineStore('user-attribute-values', () => {
    const state = reactive({userAttributeValues: [], userAttributeValue: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchUserAttributeValues(params = {}) {
        const response = await api().get('/user_attribute_values', {params})
        state.userAttributeValues = getCollection(response)
        state.totalItems = getTotalItems(response, state.userAttributeValues)
        return state.userAttributeValues
    }

    async function pushUserAttributeValue(data) {
        const response = await api().post('/user_attribute_values', data)
        state.userAttributeValues.push(response.data)
        return response.data
    }

    async function patchUserAttributeValue(id, data) {
        const response = await api().patch(`/user_attribute_values/${id}`, data)
        const index = state.userAttributeValues.findIndex((item) => item.id === Number(id))
        if (index !== -1) state.userAttributeValues[index] = response.data
        return response.data
    }

    async function deleteUserAttributeValue(id, version) {
        await api().delete(`/user_attribute_values/${id}`, {params: version ? {version} : {}})
        state.userAttributeValues = state.userAttributeValues.filter((item) => item.id !== Number(id))
    }

    return {state, fetchUserAttributeValues, pushUserAttributeValue, patchUserAttributeValue, deleteUserAttributeValue}
})
