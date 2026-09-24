<script setup>
import {computed, onBeforeUnmount, ref} from 'vue'
import {usePositionStore} from '@/stores/position'
import {useCvStore} from '@/stores/cv'
import {useDiscussionStore} from '@/stores/discussion'
import {useUserStore} from '@/stores/user'
import {useAppStore} from '@/stores/app'
import {apiMessage, iri} from '@/utils/api'
import {CV_STATUS, POSITION_ACCESS} from '@/constants/domain'

const route = useRoute()
const positionStore = usePositionStore()
const cvStore = useCvStore()
const discussionStore = useDiscussionStore()
const userStore = useUserStore()
const appStore = useAppStore()
const tab = ref('overview')
const comment = ref('')
const submitting = ref(false)
let discussionTimer = null

await useAsyncData(`position-${route.params.id}`, async () => {
    const loaded = await positionStore.fetchPosition(route.params.id)
    if (userStore.hasRole('ROLE_RECRUITER')) {
        await cvStore.fetchCvs({position: iri('positions', loaded.id)}).catch(() => [])
    }
    return loaded
})
const position = computed(() => positionStore.state.position || {})

useSeoMeta({title: computed(() => position.value.title || 'Position')})

if (userStore.isAuthenticated) {
    discussionStore.fetchDiscussions(route.params.id).catch(() => {})
    if (import.meta.client) {
        discussionTimer = setInterval(() => discussionStore.fetchDiscussions(route.params.id).catch(() => {}), 4000)
    }
}

onBeforeUnmount(() => {
    if (discussionTimer) clearInterval(discussionTimer)
})

const attributes = computed(() => (position.value.positionAttributes || []).map((item) => item.attribute).filter(Boolean))
const tags = computed(() => (position.value.positionTags || []).map((item) => item.tag).filter(Boolean))
const visibleCvs = computed(() => userStore.roles.includes('ROLE_ADMIN')
    ? cvStore.state.cvs
    : cvStore.state.cvs.filter((cv) => cv.status === CV_STATUS.published))

async function createCv() {
    if (!userStore.isAuthenticated) return navigateTo(`/auth/sign-in?redirect=${encodeURIComponent(route.fullPath)}`)
    try {
        const cv = await cvStore.pushCv(position.value.id)
        await navigateTo(`/cvs/${cv.id}`)
    } catch (error) {
        appStore.notify(apiMessage(error, 'CV could not be created.'), 'error')
    }
}

async function postComment() {
    if (!comment.value.trim()) return
    submitting.value = true
    try {
        await discussionStore.pushDiscussion(position.value.id, {text: comment.value.trim()})
        comment.value = ''
    } catch (error) {
        appStore.notify(apiMessage(error, 'Comment could not be posted.'), 'error')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <section class="page-hero">
        <div class="container-xl">
            <NuxtLink to="/positions" class="small text-decoration-none text-body-secondary">← Back to positions</NuxtLink>
            <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-4 mt-3">
                <div>
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <span class="badge-status" :class="position.accessType === POSITION_ACCESS.restricted ? 'badge-status--warning' : 'badge-status--success'">{{ position.accessType || 'public' }}</span>
                        <span class="small text-body-secondary">v{{ position.version || 1 }}</span>
                    </div>
                    <h1 class="mb-2">{{ position.title }}</h1>
                    <p>{{ position.description || 'No description has been added yet.' }}</p>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <NuxtLink v-if="userStore.hasRole('ROLE_RECRUITER')" :to="`/positions/${position.id}/edit`" class="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                        <BaseIcon name="edit" :size="16"/> Edit position
                    </NuxtLink>
                    <button v-else type="button" class="btn btn-primary" @click="createCv">Create CV</button>
                </div>
            </div>
        </div>
    </section>

    <section class="page-section pt-4">
        <div class="container-xl">
            <div class="profile-tabs mt-0 mb-4">
                <button :class="{active: tab === 'overview'}" @click="tab = 'overview'">Overview</button>
                <button v-if="userStore.hasRole('ROLE_RECRUITER')" :class="{active: tab === 'cvs'}" @click="tab = 'cvs'">CVs <span class="tab-count">{{ visibleCvs.length }}</span></button>
                <button :class="{active: tab === 'discussion'}" @click="tab = 'discussion'">Discussion</button>
            </div>

            <div v-if="tab === 'overview'" class="row g-4">
                <div class="col-lg-8">
                    <div class="surface">
                        <div class="form-section">
                            <h2>CV attributes</h2>
                            <p class="form-section__hint">These global profile attributes are rendered in CVs for this position.</p>
                            <div v-if="attributes.length" class="row g-2">
                                <div v-for="attribute in attributes" :key="attribute.id" class="col-md-6">
                                    <div class="border rounded-3 p-3 h-100">
                                        <strong class="d-block">{{ attribute.name }}</strong>
                                        <small class="text-body-secondary">{{ attribute.category?.name || 'Uncategorized' }} · {{ attribute.valueType }}</small>
                                    </div>
                                </div>
                            </div>
                            <EmptyState v-else icon="info" title="No attributes selected" text="A recruiter has not added profile attributes to this template yet."/>
                        </div>

                        <div class="form-section">
                            <h2>Access rules</h2>
                            <p class="form-section__hint">Candidates must satisfy these rules before creating a CV for a restricted position.</p>
                            <div v-if="position.accessRules?.length" class="d-grid gap-2">
                                <div v-for="rule in position.accessRules" :key="rule.id" class="d-flex justify-content-between gap-3 border rounded-3 p-3">
                                    <span class="fw-semibold">{{ rule.attribute?.name }}</span>
                                    <span class="text-body-secondary small">{{ String(rule.operation || '').replaceAll('_', ' ') }}</span>
                                </div>
                            </div>
                            <p v-else class="text-body-secondary small mb-0">No access rules.</p>
                        </div>
                    </div>
                </div>

                <aside class="col-lg-4">
                    <div class="surface p-4 mb-4">
                        <h2 class="h6 fw-bold">Project selection</h2>
                        <p class="small text-body-secondary">Up to {{ position.maxProjects ?? 0 }} matching projects are included.</p>
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            <span v-for="tag in tags" :key="tag.id" class="badge-soft">{{ tag.name }}</span>
                            <span v-if="tags.length === 0" class="small text-body-secondary">No project tag filter.</span>
                        </div>
                    </div>
                    <div class="surface p-4">
                        <h2 class="h6 fw-bold">Template behavior</h2>
                        <p class="small text-body-secondary mb-0">CV content is resolved from the candidate profile at render time. Changes to the template are reflected without copying CV data.</p>
                    </div>
                </aside>
            </div>

            <div v-else-if="tab === 'cvs'">
                <div class="section-heading section-heading--compact">
                    <div>
                        <span class="eyebrow">Submitted CVs</span>
                        <h2>Candidate CVs for this position</h2>
                        <p>Recruiters see published candidate CVs in a consistent table view.</p>
                    </div>
                </div>
                <CvTable :cvs="visibleCvs" show-candidate empty-title="No CVs for this position" empty-text="Candidate CVs will appear here after they are created and exposed by the API."/>
            </div>

            <div v-else class="surface p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div><h2 class="h5 fw-bold mb-1">Position discussion</h2><p class="small text-body-secondary mb-0">Updates refresh every few seconds.</p></div>
                </div>

                <div v-if="discussionStore.state.discussions.length" class="d-grid gap-3">
                    <article v-for="item in discussionStore.state.discussions" :key="item.id" class="border rounded-3 p-3">
                        <div class="d-flex justify-content-between gap-3 mb-2">
                            <strong>{{ item.author?.email || item.authorName || 'User' }}</strong>
                            <small class="text-body-secondary">{{ item.createdAt ? new Date(item.createdAt).toLocaleString() : '' }}</small>
                        </div>
                        <p class="mb-0" style="white-space: pre-wrap">{{ item.text }}</p>
                    </article>
                </div>
                <EmptyState v-else icon="info" title="No discussion yet" text="Be the first to start the conversation."/>

                <form v-if="userStore.isAuthenticated" class="mt-4" @submit.prevent="postComment">
                    <label class="form-label fw-semibold">Add comment</label>
                    <textarea v-model="comment" class="form-control" rows="4" placeholder="Write Markdown text…"></textarea>
                    <div class="text-end mt-2"><button class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Posting…' : 'Post comment' }}</button></div>
                </form>
                <div v-else class="alert alert-light border mt-4 mb-0">Sign in to participate in the discussion.</div>
            </div>
        </div>
    </section>
</template>
