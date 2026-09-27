<script setup>
import {computed, ref, watch} from 'vue'
import {usePositionStore} from '@/stores/position'
import {useUserStore} from '@/stores/user'
import {useAppStore} from '@/stores/app'
import {apiMessage} from '@/utils/api'

const route = useRoute()
const positionStore = usePositionStore()
const userStore = useUserStore()
const appStore = useAppStore()
const query = ref(String(route.query.q || ''))
const access = ref('all')
const selected = ref([])

await useAsyncData(`positions-${route.query.tag || ''}`, () => positionStore.fetchPositions({tag: route.query.tag || undefined}).catch(() => []))
useSeoMeta({title: 'Positions'})

watch(() => route.query.q, (value) => {
    query.value = String(value || '')
})
watch(() => route.query.tag, (tag) => positionStore.fetchPositions({tag: tag || undefined}).catch(() => []))

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()

    return positionStore.state.positions.filter((position) => {
        const matchesText = !q || `${position.title} ${position.description || ''}`.toLowerCase().includes(q)
        const matchesAccess = access.value === 'all' || String(position.accessType).toLowerCase() === access.value
        return matchesText && matchesAccess
    })
})

async function removeSelected() {
    const items = positionStore.state.positions.filter((item) => selected.value.includes(item.id))

    if (!items.length || !confirm(`Delete ${items.length} selected position(s)?`)) {
        return
    }

    try {
        for (const item of items) await positionStore.deletePosition(item.id, item.version)
        selected.value = []
        appStore.notify('Positions deleted')
    } catch (error) {
        appStore.notify(apiMessage(error, 'Positions could not be deleted.'), 'error')
    }
}

async function duplicateSelected() {
    if (selected.value.length !== 1) {
        return
    }

    try {
        const copy = await positionStore.duplicatePosition(selected.value[0])
        selected.value = []
        await navigateTo(`/positions/${copy.id}/edit`)
    } catch (error) {
        appStore.notify(apiMessage(error, 'Position could not be duplicated.'), 'error')
    }
}
</script>

<template>
    <PageHeader eyebrow="Recruitment"
                title="Positions"
                description="Browse available position templates. Recruiters manage the shared position pool."
    >
        <template #actions>
            <NuxtLink v-if="userStore.hasRole('ROLE_RECRUITER')" to="/positions/new"
                      class="btn btn-primary d-inline-flex align-items-center gap-2">
                <BaseIcon name="plus" :size="17"/>
                New position
            </NuxtLink>
        </template>
    </PageHeader>

    <section class="page-section pt-4">
        <div class="container-xl">
            <div class="filters-bar">
                <div class="row g-2">
                    <div class="col-md">
                        <div class="input-group">
                            <span class="input-group-text bg-transparent border-end-0">
                                <BaseIcon name="search" :size="17"/></span>
                            <input v-model="query" class="form-control border-start-0"
                                   placeholder="Search title, description or technology"
                            >
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select v-model="access" class="form-select">
                            <option value="all">All access types</option>
                            <option value="public">Public</option>
                            <option value="restricted">Restricted</option>
                        </select>
                    </div>
                </div>
            </div>

            <SelectionToolbar :count="selected.length" @clear="selected = []">
                <button
                    type="button"
                    class="btn btn-sm btn-outline-light"
                    :disabled="selected.length !== 1"
                    @click="duplicateSelected"
                >
                    Duplicate template
                </button>
                <NuxtLink
                    v-if="selected.length === 1"
                    :to="`/positions/${selected[0]}/edit`"
                    class="btn btn-sm btn-outline-light"
                >
                    Edit
                </NuxtLink>
                <button
                    type="button"
                    class="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2"
                    @click="removeSelected"
                >
                    <BaseIcon name="trash" :size="15"/>
                    Delete
                </button>
            </SelectionToolbar>

            <div class="mt-3">
                <PositionTable
                    v-model:selected-ids="selected"
                    :positions="filtered"
                    :selectable="userStore.hasRole('ROLE_RECRUITER')"/>
            </div>
            <button
                v-if="positionStore.state.hasMore"
                type="button"
                class="btn btn-outline-primary mt-3"
                :disabled="positionStore.state.loading"
                @click="positionStore.fetchPositions({tag: route.query.tag || undefined, page: positionStore.state.page + 1})">
                {{ positionStore.state.loading ? 'Loading…' : 'Load more positions' }}
            </button>
            <p class="small text-body-secondary mt-3 mb-0">{{ filtered.length }} positions shown</p>
        </div>
    </section>
</template>
