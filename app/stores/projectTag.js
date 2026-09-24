import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useProjectTagStore = defineStore('project-tags', () => {
    const state = reactive({projectTags: [], projectTag: null, totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchProjectTags(params = {}) {
        const response = await api().get('/project_tags', {params})
        state.projectTags = getCollection(response)
        state.totalItems = getTotalItems(response, state.projectTags)
        return state.projectTags
    }

    async function fetchProjectTag(id) {
        const response = await api().get(`/project_tags/${id}`)
        state.projectTag = response.data
        return state.projectTag
    }

    async function pushProjectTag(data) {
        const response = await api().post('/project_tags', data)
        state.projectTags.push(response.data)
        return response.data
    }

    async function deleteProjectTag(id) {
        await api().delete(`/project_tags/${id}`)
        state.projectTags = state.projectTags.filter((item) => item.id !== Number(id))
    }

    return {state, fetchProjectTags, fetchProjectTag, pushProjectTag, deleteProjectTag}
})
