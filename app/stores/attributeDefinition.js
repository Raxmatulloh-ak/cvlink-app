import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useAttributeDefinitionStore = defineStore('attribute-definitions', () => {
    const state = reactive({attributeDefinitions: [], attributeDefinition: null, totalItems: 0, loading: false})
    const api = () => useNuxtApp().$axios

    async function fetchAttributeDefinitions(params = {}) {
        state.loading = true
        try {
            const response = await api().get('/attribute_definitions', {params})
            state.attributeDefinitions = getCollection(response)
            state.totalItems = getTotalItems(response, state.attributeDefinitions)
            return state.attributeDefinitions
        } finally {
            state.loading = false
        }
    }

    async function fetchAttributeDefinition(id) {
        const response = await api().get(`/attribute_definitions/${id}`)
        state.attributeDefinition = response.data
        return state.attributeDefinition
    }

    async function pushAttributeDefinition(data) {
        const response = await api().post('/attribute_definitions', data)
        state.attributeDefinitions.unshift(response.data)
        state.attributeDefinition = response.data
        return response.data
    }

    async function patchAttributeDefinition(id, data) {
        const response = await api().patch(`/attribute_definitions/${id}`, data)
        const index = state.attributeDefinitions.findIndex((item) => item.id === Number(id))
        if (index !== -1) state.attributeDefinitions[index] = response.data
        state.attributeDefinition = response.data
        return response.data
    }

    async function saveAttributeDefinition(data) {
        return data.id ? patchAttributeDefinition(data.id, data) : pushAttributeDefinition(data)
    }

    async function deleteAttributeDefinition(id, version) {
        await api().delete(`/attribute_definitions/${id}`, {params: {version}})
        state.attributeDefinitions = state.attributeDefinitions.filter((item) => item.id !== Number(id))
        if (state.attributeDefinition?.id === Number(id)) state.attributeDefinition = null
    }

    return {state, fetchAttributeDefinitions, fetchAttributeDefinition, pushAttributeDefinition, patchAttributeDefinition, saveAttributeDefinition, deleteAttributeDefinition}
})
