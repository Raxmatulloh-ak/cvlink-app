import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems, iri} from '@/utils/api'

export const useCvLikeStore = defineStore('cv-likes', () => {
    const state = reactive({cvLikes: [], totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchCvLikes(params = {}) {
        const response = await api().get('/cv_likes', {params})
        state.cvLikes = getCollection(response)
        state.totalItems = getTotalItems(response, state.cvLikes)
        return state.cvLikes
    }

    async function pushCvLike(cvId) {
        const response = await api().post('/cv_likes', {cv: iri('c_vs', cvId)})
        state.cvLikes.push(response.data)
        return response.data
    }

    async function deleteCvLike(id) {
        await api().delete(`/cv_likes/${id}`)
        state.cvLikes = state.cvLikes.filter((item) => item.id !== Number(id))
    }

    return {state, fetchCvLikes, pushCvLike, deleteCvLike}
})
