import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useAttributeCategoryStore = defineStore('attribute-categories', () => {
    const state = reactive({categories: [], category: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchCategories() {
        const response = await api().get('/attribute_categories')
        state.categories = getCollection(response)
        state.totalItems = getTotalItems(response, state.categories)
        return state.categories
    }

    async function fetchCategory(id) {
        const response = await api().get(`/attribute_categories/${id}`)
        state.category = response.data
        return state.category
    }

    return {state, fetchCategories, fetchCategory}
})
