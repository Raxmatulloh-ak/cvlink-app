import {defineStore} from 'pinia'
import {reactive} from 'vue'

export const useProfileStore = defineStore('profile', () => {
    const state = reactive({
        fields: [],
        projects: [],
        loading: false,
    })

    const api = useNuxtApp().$axios

    async function fetchProfile(userId) {
        state.loading = true
        try {
            const response = await api.get(`/users/${userId}/profile`)
            state.fields = response.data.fields || []
            state.projects = response.data.projects || []
            return response.data
        } finally {
            state.loading = false
        }
    }

    async function pushAttributeValue(data, ownerId = null) {
        const url = ownerId ? `/users/${ownerId}/attribute-values` : '/user_attribute_values'
        const response = await api.post(url, data)
        updateFieldValue(data.attributeId, response.data)
        return response.data
    }

    async function patchAttributeValue(id, data) {
        const response = await api.patch(`/user_attribute_values/${id}`, data)
        updateFieldValue(data.attributeId, response.data)
        return response.data
    }

    async function deleteAttributeValue(id, version) {
        await api.delete(`/user_attribute_values/${id}`, {params: {version}})

        const index = state.fields.findIndex((field) => field.value?.id === Number(id))
        if (index === -1) return

        if (state.fields[index].attribute?.builtinKey) {
            state.fields[index] = {...state.fields[index], value: null, empty: true}
            return
        }

        state.fields.splice(index, 1)
    }

    async function pushProject(data, candidateId = null) {
        const url = candidateId ? `/users/${candidateId}/projects` : '/projects'
        const response = await api.post(url, data)
        state.projects.unshift(response.data)
        return response.data
    }

    async function patchProject(id, data) {
        const response = await api.patch(`/projects/${id}`, data)
        const index = state.projects.findIndex((item) => item.id === Number(id))
        if (index !== -1) state.projects[index] = response.data
        return response.data
    }

    async function deleteProject(id, version) {
        await api.delete(`/projects/${id}`, {params: {version}})
        state.projects = state.projects.filter((item) => item.id !== Number(id))
    }

    function updateFieldValue(attributeId, value) {
        const index = state.fields.findIndex((field) => field.attribute?.id === Number(attributeId))

        if (index !== -1) {
            state.fields[index] = {...state.fields[index], value, empty: false}
            return
        }

        state.fields.push({
            attribute: {id: Number(attributeId)},
            value,
            empty: false,
        })
    }

    return {
        state,
        fetchProfile,
        pushAttributeValue,
        patchAttributeValue,
        deleteAttributeValue,
        pushProject,
        patchProject,
        deleteProject,
    }
})
