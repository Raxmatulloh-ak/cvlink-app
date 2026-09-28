import axios from 'axios'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const token = useCookie('cvlink_token')
    const locale = useCookie('cvlink_locale', {default: () => 'en'})

    const api = axios.create({
        baseURL: config.public.apiBase,
        timeout: 15000,
    })

    api.interceptors.request.use((request) => {
        const method = String(request.method || 'get').toLowerCase()

        request.headers.Accept = 'application/ld+json'
        request.headers['Accept-Language'] = locale.value

        if (token.value && !request.headers.Authorization) {
            request.headers.Authorization = `Bearer ${token.value}`
        }

        request.headers['Content-Type'] = method === 'patch'
            ? 'application/merge-patch+json'
            : 'application/ld+json'

        return request
    })

    return {
        provide: {
            axios: api,
        },
    }
})
