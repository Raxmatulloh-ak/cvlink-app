import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const useAttributeStore = defineStore('attributes', () => {
    const state = reactive({
        attributes: [],
        categories: [],
        loading: false,
    })

    const api = useNuxtApp().$axios

    async function fetchAttributes(params = {}) {
        state.loading = true
        try {
            const attributes = []
            let page = 1

            while (true) {
                const response = await api.get('/attribute_definitions', {params: {...params, page}})
                const items = getCollection(response)
                attributes.push(...items)

                const view = response.data.view || response.data['hydra:view']
                const next = view?.next || view?.['hydra:next']
                const total = response.data.totalItems ?? response.data['hydra:totalItems']

                if (items.length === 0 || (!next && (total === undefined || attributes.length >= Number(total)))) break
                page += 1
            }

            state.attributes = attributes
            return state.attributes
        } finally {
            state.loading = false
        }
    }

    async function fetchCategories() {
        const response = await api.get('/attribute_categories')
        state.categories = getCollection(response)
        return state.categories
    }

    async function pushAttribute(data) {
        const response = await api.post('/attribute_definitions', data)
        state.attributes.unshift(response.data)
        return response.data
    }

    async function patchAttribute(id, data) {
        const response = await api.patch(`/attribute_definitions/${id}`, data)
        const index = state.attributes.findIndex((item) => item.id === Number(id))
        if (index !== -1) state.attributes[index] = response.data
        return response.data
    }

    async function deleteAttribute(id, version) {
        await api.delete(`/attribute_definitions/${id}`, {params: {version}})
        state.attributes = state.attributes.filter((item) => item.id !== Number(id))
    }

    return {
        state,
        fetchAttributes,
        fetchCategories,
        pushAttribute,
        patchAttribute,
        deleteAttribute,
    }
})
