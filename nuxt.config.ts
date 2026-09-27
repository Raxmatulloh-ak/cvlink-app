export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    components: [{path: '~/components', pathPrefix: false}],
    css: [
        'bootstrap/dist/css/bootstrap.min.css',
        '~/assets/css/main.css',
    ],
    runtimeConfig: {
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE,
        },
    },
    app: {
        head: {
            titleTemplate: '%s · CVLink',
            meta: [
                {name: 'description', content: 'Reusable candidate profiles and position-specific CVs.'},
                {name: 'theme-color', content: '#769FCD'},
            ],
        },
    },
})
