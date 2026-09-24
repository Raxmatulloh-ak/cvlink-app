import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const usePositionAccessRuleStore = defineStore('position-access-rules', () => {
    const state = reactive({positionAccessRules: [], positionAccessRule: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchPositionAccessRules(params = {}) {
        const response = await api().get('/position_access_rules', {params})
        state.positionAccessRules = getCollection(response)
        state.totalItems = getTotalItems(response, state.positionAccessRules)
        return state.positionAccessRules
    }

    async function fetchPositionAccessRule(id) {
        const response = await api().get(`/position_access_rules/${id}`)
        state.positionAccessRule = response.data
        return state.positionAccessRule
    }

    async function pushPositionAccessRule(data) {
        const response = await api().post('/position_access_rules', data)
        state.positionAccessRules.push(response.data)
        return response.data
    }

    async function patchPositionAccessRule(id, data) {
        const response = await api().patch(`/position_access_rules/${id}`, data)
        return response.data
    }

    async function deletePositionAccessRule(id) {
        await api().delete(`/position_access_rules/${id}`)
        state.positionAccessRules = state.positionAccessRules.filter((item) => item.id !== Number(id))
    }

    return {state, fetchPositionAccessRules, fetchPositionAccessRule, pushPositionAccessRule, patchPositionAccessRule, deletePositionAccessRule}
})
