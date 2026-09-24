import {defineStore} from 'pinia'
import {reactive} from 'vue'
import {getCollection, getTotalItems} from '@/utils/api'

export const useUserAuthIdentityStore = defineStore('user-auth-identities', () => {
    const state = reactive({userAuthIdentities: [], totalItems: 0})
    const api = () => useNuxtApp().$axios

    async function fetchUserAuthIdentities(params = {}) {
        const response = await api().get('/user_auth_identities', {params})
        state.userAuthIdentities = getCollection(response)
        state.totalItems = getTotalItems(response, state.userAuthIdentities)
        return state.userAuthIdentities
    }

    async function pushUserAuthIdentity(data) {
        const response = await api().post('/user_auth_identities', data)
        state.userAuthIdentities.push(response.data)
        return response.data
    }

    async function deleteUserAuthIdentity(id) {
        await api().delete(`/user_auth_identities/${id}`)
        state.userAuthIdentities = state.userAuthIdentities.filter((item) => item.id !== Number(id))
    }

    return {state, fetchUserAuthIdentities, pushUserAuthIdentity, deleteUserAuthIdentity}
})
