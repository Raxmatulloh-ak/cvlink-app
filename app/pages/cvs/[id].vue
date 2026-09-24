<script setup>
import {computed, reactive, ref} from 'vue'
import {useCvStore} from '@/stores/cv'
import {useCvLikeStore} from '@/stores/cvLike'
import {usePositionStore} from '@/stores/position'
import {useUserAttributeValueStore} from '@/stores/userAttributeValue'
import {useProjectStore} from '@/stores/project'
import {useUserStore} from '@/stores/user'
import {useAppStore} from '@/stores/app'
import {apiMessage, getItemId, iri} from '@/utils/api'
import {attributeValuePayload, isAttributeScalarEmpty, scalarFromAttributeValue} from '@/utils/attributeValue'
import {CV_STATUS} from '@/constants/domain'

definePageMeta({auth: true})

const route = useRoute()
const cvStore = useCvStore()
const likeStore = useCvLikeStore()
const positionStore = usePositionStore()
const valueStore = useUserAttributeValueStore()
const projectStore = useProjectStore()
const userStore = useUserStore()
const appStore = useAppStore()
const drafts = reactive({})
const savingIds = reactive(new Set())
const publishing = ref(false)

await useAsyncData(`cv-${route.params.id}`, async () => {
    const [cv] = await Promise.all([
        cvStore.fetchCv(route.params.id),
        userStore.fetchAboutMe(),
    ])
    const positionId = getItemId(cv.position)
    const candidateId = getItemId(cv.candidate)
    if (positionId) await positionStore.fetchPosition(positionId)
    await Promise.all([
        candidateId ? valueStore.fetchUserAttributeValues({owner: iri('users', candidateId)}).catch(() => []) : Promise.resolve([]),
        candidateId ? projectStore.fetchProjects({candidate: iri('users', candidateId)}).catch(() => []) : Promise.resolve([]),
        likeStore.fetchCvLikes({cv: iri('c_vs', cv.id)}).catch(() => []),
    ])
})

const cv = computed(() => cvStore.state.cv || {})
const position = computed(() => positionStore.state.position || cv.value.position || {})
const candidateId = computed(() => getItemId(cv.value.candidate))
const isOwner = computed(() => candidateId.value === userStore.state.user?.id || userStore.hasRole('ROLE_ADMIN'))
const isRecruiter = computed(() => userStore.hasRole('ROLE_RECRUITER'))
const backTarget = computed(() => isRecruiter.value && position.value.id ? `/positions/${position.value.id}` : '/profile')
const backLabel = computed(() => isRecruiter.value ? 'Position CVs' : 'My CVs')
const definitions = computed(() => (position.value.positionAttributes || []).map((item) => item.attribute).filter(Boolean))
const values = computed(() => valueStore.state.userAttributeValues.filter((item) => {
    const ownerId = getItemId(item.owner)
    return ownerId === null || ownerId === candidateId.value
}))
const valueMap = computed(() => new Map(values.value.map((item) => [getItemId(item.attribute), item])))

function draft(definition) {
    if (!(definition.id in drafts)) drafts[definition.id] = scalarFromAttributeValue(definition, valueMap.value.get(definition.id))
    return drafts[definition.id]
}

function isEmpty(definition) {
    return isAttributeScalarEmpty(definition, draft(definition))
}

const complete = computed(() => definitions.value.every((definition) => !isEmpty(definition)))

async function saveValue(definition, scalar) {
    if (!isOwner.value) return
    drafts[definition.id] = scalar
    savingIds.add(definition.id)
    try {
        const current = valueMap.value.get(definition.id)
        const payload = attributeValuePayload({definition, scalar, ownerId: candidateId.value, current})
        if (current) await valueStore.patchUserAttributeValue(current.id, payload)
        else await valueStore.pushUserAttributeValue(payload)
    } catch (error) {
        appStore.notify(error?.response?.status === 409 ? 'This profile value changed elsewhere. Reload before retrying.' : apiMessage(error, 'Value could not be saved.'), 'error')
    } finally {
        savingIds.delete(definition.id)
    }
}

const requiredTags = computed(() => (position.value.positionTags || []).map((item) => item.tag?.name).filter(Boolean))
const matchingProjects = computed(() => {
    const required = new Set(requiredTags.value.map((tag) => tag.toLowerCase()))
    const filtered = projectStore.state.projects.filter((project) => {
        if (!required.size) return true
        const names = (project.projectTags || project.tags || []).map((item) => item.tag?.name || item.name || item).filter(Boolean).map((name) => String(name).toLowerCase())
        return names.some((name) => required.has(name))
    })
    return filtered.sort((a, b) => new Date(b.endDate || b.startDate || 0) - new Date(a.endDate || a.startDate || 0)).slice(0, position.value.maxProjects || 0)
})

const myLike = computed(() => likeStore.state.cvLikes.find((like) => getItemId(like.recruiter) === userStore.state.user?.id))

async function toggleLike() {
    try {
        if (myLike.value) await likeStore.deleteCvLike(myLike.value.id)
        else await likeStore.pushCvLike(cv.value.id)
    } catch (error) {
        appStore.notify(apiMessage(error, 'Like could not be updated.'), 'error')
    }
}

async function publish() {
    if (!complete.value) return appStore.notify('Fill every required CV attribute before publishing.', 'error')
    publishing.value = true
    try {
        await cvStore.publishCv(cv.value.id, cv.value.version)
        appStore.notify('CV published')
    } catch (error) {
        appStore.notify(apiMessage(error, 'CV could not be published.'), 'error')
    } finally {
        publishing.value = false
    }
}

useSeoMeta({title: computed(() => position.value.title ? `${position.value.title} CV` : 'CV')})
</script>

<template>
    <section class="page-hero">
        <div class="container-xl">
            <NuxtLink :to="backTarget" class="small text-decoration-none text-body-secondary">← {{ backLabel }}</NuxtLink>
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mt-3">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-2"><span class="badge-status" :class="cv.status === CV_STATUS.published ? 'badge-status--success' : 'badge-status--warning'">{{ cv.status || 'draft' }}</span><small class="text-body-secondary">CV #{{ cv.id }}</small></div>
                    <h1>{{ position.title || 'CV' }}</h1>
                    <p>{{ position.description || 'Position-specific CV rendered from the candidate profile.' }}</p>
                </div>
                <div class="d-flex gap-2">
                    <button v-if="isRecruiter" type="button" class="btn btn-outline-primary d-inline-flex align-items-center gap-2" @click="toggleLike"><BaseIcon name="heart" :size="17"/> {{ myLike ? 'Unlike' : 'Like' }} · {{ likeStore.state.cvLikes.length }}</button>
                    <button v-if="isOwner && cv.status !== CV_STATUS.published" type="button" class="btn btn-primary" :disabled="publishing || !complete" @click="publish">{{ publishing ? 'Publishing…' : 'Publish CV' }}</button>
                </div>
            </div>
        </div>
    </section>

    <section class="page-section pt-4">
        <div class="container-xl">
            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="surface">
                        <div class="form-section">
                            <h2>Profile attributes</h2>
                            <p class="form-section__hint">{{ isOwner ? 'Editing here updates the same master profile values used by every CV.' : 'Recruiter view is read-only.' }}</p>
                            <div class="d-grid gap-3">
                                <div v-for="definition in definitions" :key="definition.id" class="border rounded-3 p-3" :class="isEmpty(definition) ? 'border-danger-subtle bg-danger-subtle' : ''">
                                    <div class="row g-3 align-items-start">
                                        <div class="col-md-4"><strong class="d-block">{{ definition.name }}</strong><small class="text-body-secondary">{{ definition.category?.name }} · {{ definition.valueType }}</small><small v-if="isEmpty(definition)" class="d-block text-danger mt-1">Required value is empty</small></div>
                                        <div class="col-md">
                                            <AttributeValueInput v-if="isOwner" :definition="definition" :model-value="draft(definition)" @update:model-value="saveValue(definition, $event)"/>
                                            <div v-else class="py-2">{{ draft(definition) ?? '—' }}</div>
                                        </div>
                                        <div v-if="savingIds.has(definition.id)" class="col-auto"><small class="text-body-secondary">Saving…</small></div>
                                    </div>
                                </div>
                            </div>
                            <EmptyState v-if="definitions.length === 0" icon="info" title="No attributes in this template" text="The position currently has no CV attributes."/>
                        </div>
                    </div>
                </div>

                <aside class="col-lg-4">
                    <div class="surface p-4 mb-4">
                        <h2 class="h6 fw-bold">Completion</h2>
                        <p class="small text-body-secondary">{{ complete ? 'All rendered attributes are filled.' : 'Missing values are highlighted in red.' }}</p>
                        <div class="progress" role="progressbar" style="height:8px"><div class="progress-bar" :style="{width: `${definitions.length ? Math.round(definitions.filter(d => !isEmpty(d)).length / definitions.length * 100) : 100}%`}"></div></div>
                    </div>
                    <div class="surface p-4">
                        <h2 class="h6 fw-bold">Projects in this CV</h2>
                        <p class="small text-body-secondary">Filtered by position tags, newest matching projects first.</p>
                        <div v-if="matchingProjects.length" class="d-grid gap-3 mt-3">
                            <div v-for="project in matchingProjects" :key="project.id" class="border rounded-3 p-3"><strong class="small d-block">{{ project.name }}</strong><span class="small text-body-secondary">{{ project.startDate }} — {{ project.endDate || 'Present' }}</span></div>
                        </div>
                        <span v-else class="small text-body-secondary">No matching projects.</span>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>
