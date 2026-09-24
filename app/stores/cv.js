import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems, iri} from '@/utils/api'
import {CV_STATUS} from '@/constants/domain'

export const useCvStore = defineStore('cvs', () => {
    const config = useRuntimeConfig()
    const state = reactive({cvs: [], cv: null, totalItems: 0, loading: false})
    const api = () => useNuxtApp().$axios
    const resource = () => String(config.public.cvResource)

    async function fetchCvs(params = {}) {
        state.loading = true
        try {
            const response = await api().get(resource(), {params})
            state.cvs = getCollection(response)
            state.totalItems = getTotalItems(response, state.cvs)
            return state.cvs
        } finally {
            state.loading = false
        }
    }

    async function fetchCv(id) {
        const response = await api().get(`${resource()}/${id}`)
        state.cv = response.data
        return state.cv
    }

    async function pushCv(positionId) {
        const response = await api().post(resource(), {
            position: iri('positions', positionId),
            status: CV_STATUS.draft,
        })
        state.cvs.unshift(response.data)
        state.cv = response.data
        return response.data
    }

    async function patchCv(id, data) {
        const response = await api().patch(`${resource()}/${id}`, data)
        const index = state.cvs.findIndex((item) => item.id === Number(id))
        if (index !== -1) state.cvs[index] = response.data
        state.cv = response.data
        return response.data
    }

    async function publishCv(id, version) {
        return patchCv(id, {status: CV_STATUS.published, version})
    }

    async function deleteCv(id, version) {
        await api().delete(`${resource()}/${id}`, {params: version ? {version} : {}})
        state.cvs = state.cvs.filter((item) => item.id !== Number(id))
    }

    return {state, fetchCvs, fetchCv, pushCv, patchCv, publishCv, deleteCv}
})
