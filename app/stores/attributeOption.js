import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useAttributeOptionStore = defineStore('attribute-options', () => {
    const state = reactive({attributeOptions: [], attributeOption: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchAttributeOptions(params = {}) {
        const response = await api().get('/attribute_options', {params})
        state.attributeOptions = getCollection(response)
        state.totalItems = getTotalItems(response, state.attributeOptions)
        return state.attributeOptions
    }

    async function fetchAttributeOption(id) {
        const response = await api().get(`/attribute_options/${id}`)
        state.attributeOption = response.data
        return state.attributeOption
    }

    async function pushAttributeOption(data) {
        const response = await api().post('/attribute_options', data)
        state.attributeOptions.push(response.data)
        return response.data
    }

    async function patchAttributeOption(id, data) {
        const response = await api().patch(`/attribute_options/${id}`, data)
        return response.data
    }

    async function deleteAttributeOption(id) {
        await api().delete(`/attribute_options/${id}`)
        state.attributeOptions = state.attributeOptions.filter((item) => item.id !== Number(id))
    }

    return {state, fetchAttributeOptions, fetchAttributeOption, pushAttributeOption, patchAttributeOption, deleteAttributeOption}
})
