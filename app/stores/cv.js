import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection} from '@/utils/api'

export const useCvStore = defineStore('cvs', () => {
    const state = reactive({
        cvs: [],
        cv: null,
        loading: false,
        page: 1,
        hasMore: false,
        filters: {},
    })

    const api = useNuxtApp().$axios

    async function fetchCvs(params = {}) {
        state.loading = true
        try {
            const response = await api.get('/cvs', {params})
            const items = getCollection(response)
            const page = Number(params.page || 1)

            state.cvs = page > 1 ? [...state.cvs, ...items] : items
            state.page = Number(response.data.page || page)
            state.hasMore = response.data.hasMore === true
            state.filters = {...params, page: undefined}

            return state.cvs
        } finally {
            state.loading = false
        }
    }

    async function loadMoreCvs() {
        if (!state.hasMore || state.loading) {
            return state.cvs
        }

        return fetchCvs({...state.filters, page: state.page + 1})
    }

    async function fetchCv(id) {
        const response = await api.get(`/cvs/${id}`)
        state.cv = response.data

        return state.cv
    }

    async function pushCv(positionId) {
        const response = await api.post('/cvs', {positionId: Number(positionId)})
        state.cvs.unshift(response.data)
        state.cv = response.data

        return response.data
    }

    async function publishCv(id, version) {
        const response = await api.post(`/cvs/${id}/publish`, {version})
        state.cv = response.data

        return response.data
    }

    async function deleteCv(id, version) {
        await api.delete(`/cvs/${id}`, {params: {version}})
        state.cvs = state.cvs.filter((item) => item.id !== Number(id))

        if (state.cv?.id === Number(id)) {
            state.cv = null
        }
    }

    async function likeCv(id) {
        const response = await api.post(`/cvs/${id}/like`)

        return response.data
    }

    async function unlikeCv(id) {
        const response = await api.delete(`/cvs/${id}/like`)
        
        return response.data
    }

    return {
        state,
        fetchCvs,
        loadMoreCvs,
        fetchCv,
        pushCv,
        publishCv,
        deleteCv,
        likeCv,
        unlikeCv,
    }
})
