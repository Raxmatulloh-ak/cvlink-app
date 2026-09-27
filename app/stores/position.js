import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const usePositionStore = defineStore('positions', () => {
    const state = reactive({
        positions: [],
        position: null,
        loading: false,
        page: 1,
        hasMore: false,
    })

    const api = useNuxtApp().$axios

    async function fetchPositions(params = {}) {
        state.loading = true
        try {
            const response = await api.get('/positions', {params})
            const items = getCollection(response)
            const page = Number(params.page || 1)
            state.positions = page > 1 ? [...state.positions, ...items] : items
            state.page = Number(response.data.page || page)
            state.hasMore = response.data.hasMore === true

            return state.positions
        } finally {
            state.loading = false
        }
    }

    async function loadMorePositions() {
        if (!state.hasMore || state.loading) {
            return state.positions
        }

        return fetchPositions({page: state.page + 1})
    }

    async function fetchPosition(id) {
        const response = await api.get(`/positions/${id}`)
        state.position = response.data

        return state.position
    }

    async function pushPosition(data) {
        const response = await api.post('/positions', data)
        state.positions.unshift(response.data)
        state.position = response.data

        return response.data
    }

    async function patchPosition(id, data) {
        const response = await api.patch(`/positions/${id}`, data)
        const index = state.positions.findIndex((item) => item.id === Number(id))

        if (index !== -1) {
            state.positions[index] = response.data
        }

        state.position = response.data

        return response.data
    }

    async function duplicatePosition(id) {
        const response = await api.post(`/positions/${id}/duplicate`)
        state.positions.unshift(response.data)

        return response.data
    }

    async function deletePosition(id, version) {
        await api.delete(`/positions/${id}`, {params: {version}})
        state.positions = state.positions.filter((item) => item.id !== Number(id))

        if (state.position?.id === Number(id)) {
            state.position = null
        }
    }

    return {
        state,
        fetchPositions,
        loadMorePositions,
        fetchPosition,
        pushPosition,
        patchPosition,
        duplicatePosition,
        deletePosition,
    }
})
