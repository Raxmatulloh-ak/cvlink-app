<script setup>
import {computed} from 'vue'
import {useSearchStore} from '@/stores/search'
import {usePositionStore} from '@/stores/position'

const route = useRoute()
const searchStore = useSearchStore()
const positionStore = usePositionStore()
const query = computed(() => String(route.query.q || '').trim())
const fallback = ref(false)

await useAsyncData(`search-${query.value}`, async () => {
    if (!query.value) return []
    try {
        return await searchStore.search(query.value)
    } catch (error) {
        if (error?.response?.status !== 404) throw error
        fallback.value = true
        await positionStore.fetchPositions()
        const q = query.value.toLowerCase()
        searchStore.state.results = positionStore.state.positions.filter((item) => `${item.title} ${item.description || ''}`.toLowerCase().includes(q))
        return searchStore.state.results
    }
})

useSeoMeta({title: computed(() => query.value ? `Search: ${query.value}` : 'Search')})
</script>

<template>
    <section class="page-hero py-4">
        <div class="container-xl"><span class="eyebrow">Search</span><h1 class="h3">Results for “{{ query }}”</h1></div>
    </section>
    <section class="page-section pt-4">
        <div class="container-xl" style="max-width: 980px">
            <p v-if="fallback" class="small text-body-secondary">Showing a position-only fallback until the full-text search endpoint is available.</p>
            <div class="surface overflow-hidden">
                <NuxtLink v-for="item in searchStore.state.results" :key="item.id" :to="item.type === 'cv' ? `/cvs/${item.id}` : `/positions/${item.id}`" class="d-flex align-items-center gap-3 p-4 border-bottom text-decoration-none text-body">
                    <span class="empty-state__icon m-0 flex-shrink-0" style="width:42px;height:42px"><BaseIcon :name="item.type === 'cv' ? 'file-text' : 'briefcase'" :size="20"/></span>
                    <span class="flex-grow-1 min-w-0"><strong class="d-block">{{ item.title || item.position?.title || `Result #${item.id}` }}</strong><small class="text-body-secondary">{{ item.description || item.email || '' }}</small></span>
                    <BaseIcon name="chevron-right" :size="18"/>
                </NuxtLink>
                <EmptyState v-if="query && searchStore.state.results.length === 0" icon="search" title="No matching results" text="Try a broader keyword."/>
                <EmptyState v-if="!query" icon="search" title="Search CVLink" text="Use the search field in the header to find positions and CVs."/>
            </div>
        </div>
    </section>
</template>
