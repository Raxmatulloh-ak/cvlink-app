<script setup>
import {computed, ref, watch} from 'vue'
import {useSearchStore} from '@/stores/search'

const route = useRoute()
const searchStore = useSearchStore()
const query = computed(() => String(route.query.q || '').trim())
const searchInput = ref(query.value)

function submitSearch() {
    const q = searchInput.value.trim()
    navigateTo({path: '/search', query: q ? {q} : {}})
}

async function loadResults(q) {
    if (!q) {
        searchStore.state.results = []
        return []
    }

    return searchStore.search(q)
}

await useAsyncData(`search-${query.value}`, () => loadResults(query.value))

watch(query, (q) => {
    searchInput.value = q
    loadResults(q)
})

useSeoMeta({title: computed(() => query.value ? `Search: ${query.value}` : 'Search')})
</script>

<template>
    <section class="page-hero py-4">
        <div class="container-xl"><span class="eyebrow">Search</span>
            <h1 class="h3">Results for “{{ query }}”</h1></div>
    </section>

    <section class="page-section pt-4">
        <div class="container-xl" style="max-width: 980px">
            <form class="input-group mb-4" @submit.prevent="submitSearch">
                <input v-model="searchInput" class="form-control" type="search" placeholder="Search positions and CVs"
                       aria-label="Search positions and CVs">
                <button type="submit" class="btn btn-primary">Search</button>
            </form>

            <div class="surface overflow-hidden">
                <NuxtLink
                    v-for="item in searchStore.state.results"
                    :key="`${item.type}-${item.id}`"
                    :to="item.type === 'cv' ? `/cvs/${item.id}` : `/positions/${item.id}`"
                    class="d-flex align-items-center gap-3 p-4 border-bottom text-decoration-none text-body"
                >
                    <span class="empty-state__icon m-0 flex-shrink-0" style="width:42px;height:42px"><BaseIcon
                        :name="item.type === 'cv' ? 'file-text' : 'briefcase'" :size="20"/></span>
                    <span class="flex-grow-1 min-w-0">
                        <strong class="d-block">{{ item.title || `Result #${item.id}` }}</strong>
                        <small class="text-body-secondary">{{ item.description || item.candidateName || '' }}</small>
                    </span>
                    <BaseIcon name="chevron-right" :size="18"/>
                </NuxtLink>
                <EmptyState v-if="query && searchStore.state.results.length === 0"
                            icon="search"
                            title="No matching results"
                            text="Try a broader keyword."
                />

                <EmptyState v-if="!query" icon="search"
                            title="Search CVLink"
                            text="Use the search field in the header to find positions and CVs."
                />
            </div>
        </div>
    </section>
</template>
