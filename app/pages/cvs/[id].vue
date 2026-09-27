<script setup>
import {computed, onBeforeUnmount, reactive, ref} from 'vue'
import {useCvStore} from '@/stores/cv'
import {usePositionStore} from '@/stores/position'
import {useAttributeStore} from '@/stores/attribute'
import {useProfileStore} from '@/stores/profile'
import {useUserStore} from '@/stores/user'
import {useAppStore} from '@/stores/app'
import {apiMessage} from '@/utils/api'
import {attributeValuePayload, isAttributeScalarEmpty, scalarFromAttributeValue} from '@/utils/attributeValue'
import {CV_STATUS} from '@/constants/domain'

definePageMeta({auth: true})

const route = useRoute()
const cvStore = useCvStore()
const positionStore = usePositionStore()
const attributeStore = useAttributeStore()
const profileStore = useProfileStore()
const userStore = useUserStore()
const appStore = useAppStore()

const drafts = reactive({})
const dirtyIds = reactive(new Set())
const conflictedIds = reactive(new Set())
const savingIds = reactive(new Set())
const publishing = ref(false)
const liked = ref(false)
const likes = ref(0)
let saveTimer = null

await useAsyncData(`cv-${route.params.id}`, async () => {
    const cv = await cvStore.fetchCv(route.params.id)
    likes.value = cv.likes || 0
    liked.value = cv.liked === true

    await Promise.all([
        userStore.fetchAboutMe(),
        attributeStore.fetchAttributes(),
        positionStore.fetchPosition(cv.positionId),
    ])

    return cv
})

const cv = computed(() => cvStore.state.cv || {})
const position = computed(() => positionStore.state.position || {})
const candidateId = computed(() => cv.value.candidateId)
const isOwner = computed(() => candidateId.value === userStore.state.user?.id || userStore.roles.includes('ROLE_ADMIN'))
const isRecruiter = computed(() => userStore.roles.includes('ROLE_RECRUITER') || userStore.roles.includes('ROLE_ADMIN'))
const backTarget = computed(() => isRecruiter.value && position.value.id ? `/positions/${position.value.id}` : '/profile')
const backLabel = computed(() => isRecruiter.value ? 'Position CVs' : 'My CVs')

const definitions = computed(() => (cv.value.attributes || []).map((field) => ({
    ...(attributeStore.state.attributes.find((item) => item.id === field.attributeId) || {}),
    id: field.attributeId,
    name: field.name,
    valueType: field.type,
})))

const fields = computed(() => new Map(
    (cv.value.attributes || []).map((field) => [field.attributeId, field]),
))

const complete = computed(() => definitions.value.every((definition) => !isEmpty(definition)))

function draft(definition) {
    if (!(definition.id in drafts)) {
        drafts[definition.id] = scalarFromAttributeValue(definition, fields.value.get(definition.id) || null)
    }
    return drafts[definition.id]
}

function isEmpty(definition) {
    return isAttributeScalarEmpty(definition, draft(definition))
}

function displayValue(definition) {
    const value = fields.value.get(definition.id)?.value

    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'object') return value.label || `${value.start || ''} — ${value.end || ''}`
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'

    return value
}

function changeValue(definition, scalar) {
    drafts[definition.id] = scalar
    dirtyIds.add(definition.id)

    if (saveTimer === null) {
        saveTimer = setInterval(saveValues, 7000)
    }
}

async function saveValues() {
    if (savingIds.size || !dirtyIds.size) return

    for (const id of [...dirtyIds]) {
        if (conflictedIds.has(id)) continue

        const definition = definitions.value.find((item) => item.id === id)
        if (!definition) continue

        savingIds.add(id)
        const snapshot = JSON.stringify(draft(definition))

        try {
            const field = fields.value.get(id)
            const current = field?.valueId ? {version: field.version} : null
            const payload = attributeValuePayload({definition, scalar: draft(definition), current})

            if (field?.valueId) {
                await profileStore.patchAttributeValue(field.valueId, payload)
            } else {
                const ownerId = candidateId.value === userStore.state.user?.id ? null : candidateId.value
                await profileStore.pushAttributeValue(payload, ownerId)
            }

            if (JSON.stringify(draft(definition)) === snapshot) {
                dirtyIds.delete(id)
            }

            await cvStore.fetchCv(cv.value.id)
        } catch (error) {
            if (error?.response?.status === 409) conflictedIds.add(id)

            const message = error?.response?.status === 409
                ? 'This value changed elsewhere. Your input is kept; reload before retrying.'
                : apiMessage(error, 'Value could not be saved.')

            appStore.notify(message, 'error')
            break
        } finally {
            savingIds.delete(id)
        }
    }
}

async function retryConflicts() {
    try {
        await cvStore.fetchCv(cv.value.id)
        conflictedIds.clear()
        await saveValues()
    } catch (error) {
        appStore.notify(apiMessage(error, 'Could not reload the latest CV.'), 'error')
    }
}

async function toggleLike() {
    try {
        const result = liked.value
            ? await cvStore.unlikeCv(cv.value.id)
            : await cvStore.likeCv(cv.value.id)

        liked.value = result.liked
        likes.value = result.likes
    } catch (error) {
        appStore.notify(apiMessage(error, 'Like could not be updated.'), 'error')
    }
}

async function publish() {
    publishing.value = true

    try {
        clearInterval(saveTimer)
        saveTimer = null
        await saveValues()

        if (dirtyIds.size || !complete.value) {
            appStore.notify('Fill and save every required attribute before publishing.', 'error')
            return
        }

        await cvStore.publishCv(cv.value.id, cv.value.version)
        appStore.notify('CV published')
    } catch (error) {
        appStore.notify(apiMessage(error, 'CV could not be published.'), 'error')
    } finally {
        publishing.value = false
    }
}

async function removeCv() {
    if (!confirm('Delete this CV?')) return

    try {
        await cvStore.deleteCv(cv.value.id, cv.value.version)
        await navigateTo('/profile')
    } catch (error) {
        appStore.notify(apiMessage(error, 'CV could not be deleted.'), 'error')
    }
}

onBeforeUnmount(() => clearInterval(saveTimer))
useSeoMeta({title: computed(() => position.value.title ? `${position.value.title} CV` : 'CV')})
</script>

<template>
    <section class="page-hero">
        <div class="container-xl">
            <NuxtLink :to="backTarget" class="small text-decoration-none text-body-secondary">← {{
                    backLabel
                }}
            </NuxtLink>
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mt-3">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="badge-status"
                              :class="cv.status === CV_STATUS.published ? 'badge-status--success' : 'badge-status--warning'">{{
                                cv.status || 'draft'
                            }}</span>
                        <small class="text-body-secondary">CV #{{ cv.id }}</small>
                    </div>
                    <h1>{{ position.title || cv.title || 'CV' }}</h1>
                    <p>{{ position.description || 'Position-specific CV rendered from the candidate profile.' }}</p>
                </div>
                <div class="d-flex gap-2">
                    <button v-if="isOwner" type="button" class="btn btn-outline-danger" @click="removeCv">Delete CV
                    </button>
                    <button v-if="isRecruiter && cv.status === CV_STATUS.published" type="button"
                            class="btn btn-outline-primary d-inline-flex align-items-center gap-2" @click="toggleLike">
                        <BaseIcon name="heart" :size="17"/>
                        {{ liked ? 'Unlike' : 'Like' }} · {{ likes }}
                    </button>
                    <button v-if="isOwner && cv.status !== CV_STATUS.published" type="button" class="btn btn-primary"
                            :disabled="publishing || !complete" @click="publish">
                        {{ publishing ? 'Publishing…' : 'Publish CV' }}
                    </button>
                </div>
            </div>
        </div>
    </section>

    <section class="page-section pt-4">
        <div class="container-xl">
            <div v-if="conflictedIds.size"
                 class="alert alert-warning d-flex justify-content-between align-items-center gap-3">
                <span>Your input is kept. Another change was saved first.</span>
                <button type="button" class="btn btn-sm btn-outline-dark" @click="retryConflicts">Use my changes
                </button>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="surface">
                        <div class="form-section">
                            <h2>Profile attributes</h2>
                            <p class="form-section__hint">{{
                                    isOwner ? 'Editing here updates the same master profile values used by every CV.' : 'Recruiter view is read-only.'
                                }}</p>
                            <div class="d-grid gap-3">
                                <div v-for="definition in definitions" :key="definition.id" class="border rounded-3 p-3"
                                     :class="isEmpty(definition) ? 'border-danger-subtle bg-danger-subtle' : ''">
                                    <div class="row g-3 align-items-start">
                                        <div class="col-md-4">
                                            <strong class="d-block">{{ definition.name }}</strong>
                                            <small class="text-body-secondary">{{ definition.category?.name }} ·
                                                {{ definition.valueType }}</small>
                                            <small v-if="isEmpty(definition)" class="d-block text-danger mt-1">Required
                                                value is empty</small>
                                        </div>
                                        <div class="col-md">
                                            <AttributeValueInput v-if="isOwner" :definition="definition"
                                                                 :model-value="draft(definition)"
                                                                 @update:model-value="changeValue(definition, $event)"/>
                                            <div v-else class="py-2">
                                                {{ displayValue(definition) }}
                                            </div>
                                        </div>
                                        <div v-if="savingIds.has(definition.id)" class="col-auto"><small
                                            class="text-body-secondary">Saving…</small></div>
                                    </div>
                                </div>
                            </div>
                            <EmptyState v-if="definitions.length === 0" icon="info"
                                        title="No attributes in this template"
                                        text="The position currently has no CV attributes."/>
                        </div>
                    </div>
                </div>

                <aside class="col-lg-4">
                    <div class="surface p-4 mb-4">
                        <h2 class="h6 fw-bold">Completion</h2>
                        <p class="small text-body-secondary">{{
                                complete ? 'All rendered attributes are filled.' : 'Missing values are highlighted in red.'
                            }}</p>
                        <div class="progress" role="progressbar" style="height:8px">
                            <div class="progress-bar"
                                 :style="{width: `${definitions.length ? Math.round(definitions.filter((definition) => !isEmpty(definition)).length / definitions.length * 100) : 100}%`}"></div>
                        </div>
                    </div>
                    <div class="surface p-4">
                        <h2 class="h6 fw-bold">Projects in this CV</h2>
                        <p class="small text-body-secondary">Filtered by position tags, newest matching projects
                            first.</p>
                        <div v-if="cv.projects?.length" class="d-grid gap-3 mt-3">
                            <div v-for="project in cv.projects" :key="project.id" class="border rounded-3 p-3">
                                <strong class="small d-block">{{ project.name }}</strong>
                                <span class="small text-body-secondary">{{
                                        project.startDate
                                    }} — {{ project.endDate || 'Present' }}</span>
                            </div>
                        </div>
                        <span v-else class="small text-body-secondary">No matching projects.</span>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>
