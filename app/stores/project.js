import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useProjectStore = defineStore('projects', () => {
    const state = reactive({projects: [], project: null, totalItems: 0, loading: false})
    const api = () => useNuxtApp().$axios

    async function fetchProjects(params = {}) {
        state.loading = true
        try {
            const response = await api().get('/projects', {params})
            state.projects = getCollection(response)
            state.totalItems = getTotalItems(response, state.projects)
            return state.projects
        } finally {
            state.loading = false
        }
    }

    async function fetchProject(id) {
        const response = await api().get(`/projects/${id}`)
        state.project = response.data
        return state.project
    }

    async function pushProject(data) {
        const response = await api().post('/projects', data)
        state.projects.unshift(response.data)
        state.project = response.data
        return response.data
    }

    async function patchProject(id, data) {
        const response = await api().patch(`/projects/${id}`, data)
        const index = state.projects.findIndex((item) => item.id === Number(id))
        if (index !== -1) state.projects[index] = response.data
        state.project = response.data
        return response.data
    }

    async function deleteProject(id, version) {
        await api().delete(`/projects/${id}`, {params: version ? {version} : {}})
        state.projects = state.projects.filter((item) => item.id !== Number(id))
    }

    return {state, fetchProjects, fetchProject, pushProject, patchProject, deleteProject}
})
