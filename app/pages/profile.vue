<script setup>
import {computed, onBeforeUnmount, reactive, ref} from 'vue'
import {useUserStore} from '@/stores/user'
import {useAttributeStore} from '@/stores/attribute'
import {useProfileStore} from '@/stores/profile'
import {useCvStore} from '@/stores/cv'
import {useTagStore} from '@/stores/tag'
import {useAppStore} from '@/stores/app'
import {apiMessage} from '@/utils/api'
import {attributeValuePayload, scalarFromAttributeValue} from '@/utils/attributeValue'

definePageMeta({auth: true, roles: ['ROLE_CANDIDATE', 'ROLE_ADMIN']})

const userStore = useUserStore()
const attributeStore = useAttributeStore()
const profileStore = useProfileStore()
const cvStore = useCvStore()
const tagStore = useTagStore()
const appStore = useAppStore()
const tab = ref('me')
const saving = ref(false)
const dirtyIds = reactive(new Set())
const conflictedIds = reactive(new Set())
const drafts = reactive({})
const addAttributeOpen = ref(false)
const addAttributeId = ref(null)
const projectOpen = ref(false)
const projectForm = reactive({
    id: null,
    version: null,
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    tagsText: ''
})

let saveTimer = null

await useAsyncData('profile-data', async () => {
    const user = await userStore.fetchAboutMe(true)

    await Promise.all([
        profileStore.fetchProfile(user.id),
        attributeStore.fetchAttributes(),
        tagStore.fetchTags().catch(() => []),
        cvStore.fetchCvs({candidate: user.id}).catch(() => []),
    ])
})

useSeoMeta({title: 'My profile'})

const valueByAttribute = computed(() => new Map(
    profileStore.state.fields
        .filter((field) => field.value)
        .map((field) => [field.attribute?.id, field.value]),
))

const builtInDefinitions = computed(() => profileStore.state.fields
    .filter((field) => field.attribute?.builtinKey)
    .map((field) => field.attribute))

const customDefinitions = computed(() => attributeStore.state.attributes.filter((attribute) => (
    !attribute.builtinKey && valueByAttribute.value.has(attribute.id)
)))

const availableDefinitions = computed(() => attributeStore.state.attributes.filter((attribute) => (
    !attribute.builtinKey && !valueByAttribute.value.has(attribute.id)
)))

function draft(definition) {
    if (!(definition.id in drafts)) {
        drafts[definition.id] = scalarFromAttributeValue(definition, valueByAttribute.value.get(definition.id))
    }
    return drafts[definition.id]
}

function markDirty(definition, value) {
    drafts[definition.id] = value
    dirtyIds.add(definition.id)

    if (saveTimer === null) {
        saveTimer = setInterval(saveDirtyValues, 7000)
    }
}

async function saveDefinition(definition) {
    const current = valueByAttribute.value.get(definition.id)
    const payload = attributeValuePayload({definition, scalar: draft(definition), current})
    const snapshot = JSON.stringify(draft(definition))

    const saved = current
        ? await profileStore.patchAttributeValue(current.id, payload)
        : await profileStore.pushAttributeValue(payload)

    if (JSON.stringify(draft(definition)) === snapshot) {
        dirtyIds.delete(definition.id)
    }

    return saved
}

async function saveDirtyValues() {
    if (!dirtyIds.size || saving.value) {
        return
    }

    saving.value = true
    let currentId = null
    let savedAny = false

    try {
        for (const id of [...dirtyIds]) {
            if (conflictedIds.has(id)) {
                continue
            }

            currentId = id
            const definition = attributeStore.state.attributes.find((item) => item.id === id)

            if (!definition) {
                continue
            }

            await saveDefinition(definition)
            savedAny = true
        }

        if (savedAny) {
            appStore.notify('Profile saved')
        }

    } catch (error) {
        if (error?.response?.status === 409 && currentId !== null) {
            conflictedIds.add(currentId)
        }

        const message = error?.response?.status === 409
            ? 'Profile data changed elsewhere. Your local input is kept; reload before retrying.'
            : apiMessage(error, 'Profile could not be saved.')

        appStore.notify(message, 'error')
    } finally {
        saving.value = false
    }
}

async function retryConflicts() {
    try {
        await profileStore.fetchProfile(userStore.state.user.id)
        conflictedIds.clear()
        await saveDirtyValues()
    } catch (error) {
        appStore.notify(apiMessage(error, 'Could not reload the latest values.'), 'error')
    }
}

async function addAttribute() {
    const definition = attributeStore.state.attributes.find((item) => item.id === Number(addAttributeId.value))

    if (!definition) {
        return
    }

    try {
        drafts[definition.id] = scalarFromAttributeValue(definition, null)
        await saveDefinition(definition)
        addAttributeOpen.value = false
        addAttributeId.value = null
    } catch (error) {
        appStore.notify(apiMessage(error, 'Attribute could not be added.'), 'error')
    }
}

async function removeAttribute(definition) {
    const value = valueByAttribute.value.get(definition.id)
    if (!value || !confirm(`Remove ${definition.name} from your profile?`)) {
        return
    }

    try {
        await profileStore.deleteAttributeValue(value.id, value.version)
        delete drafts[definition.id]
        dirtyIds.delete(definition.id)
    } catch (error) {
        appStore.notify(apiMessage(error, 'Attribute could not be removed.'), 'error')
    }
}

async function saveProject() {
    if (!projectForm.name.trim()) {
        return
    }

    try {
        const payload = {
            name: projectForm.name.trim(),
            startDate: projectForm.startDate,
            endDate: projectForm.endDate || null,
            description: projectForm.description || null,
            tags: projectForm.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        }

        if (projectForm.id !== null) {
            await profileStore.patchProject(projectForm.id, {...payload, version: projectForm.version})
        } else {
            await profileStore.pushProject(payload)
        }

        resetProjectForm()
        projectOpen.value = false
    } catch (error) {
        appStore.notify(apiMessage(error, 'Project could not be saved.'), 'error')
    }
}

function editProject(project) {
    Object.assign(projectForm, {
        id: project.id,
        version: project.version,
        name: project.name,
        startDate: project.startDate?.slice(0, 10) || '',
        endDate: project.endDate?.slice(0, 10) || '',
        description: project.description || '',
        tagsText: (project.projectTags || project.tags || [])
            .map((item) => item.tag?.name || item.name || item)
            .filter(Boolean)
            .join(', '),
    })
    projectOpen.value = true
}

function resetProjectForm() {
    Object.assign(projectForm, {
        id: null,
        version: null,
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        tagsText: '',
    })
}

async function removeProject(project) {
    if (!confirm(`Delete ${project.name}?`)) {
        return
    }

    try {
        await profileStore.deleteProject(project.id, project.version)
    } catch (error) {
        appStore.notify(apiMessage(error, 'Project could not be deleted.'), 'error')
    }
}

onBeforeUnmount(() => clearInterval(saveTimer))
</script>

<template>
    <ProfileHeader
        v-model:tab="tab"
        :initials="userStore.initials"
        :display-name="userStore.displayName"
        :email="userStore.state.user?.email"
        :role-label="userStore.primaryRoleLabel"
        :saving="saving"
        :dirty-count="dirtyIds.size"
        :info-count="customDefinitions.length"
        :project-count="profileStore.state.projects.length"
        :cv-count="cvStore.state.cvs.length"
        @save="saveDirtyValues"
    />

    <section class="page-section pt-4">
        <div class="container-xl">
            <div v-if="conflictedIds.size"
                 class="alert alert-warning d-flex justify-content-between align-items-center gap-3">
                <span>Your input is kept. Another change was saved first.</span>
                <button type="button" class="btn btn-sm btn-outline-dark" @click="retryConflicts">Use my changes
                </button>
            </div>

            <ProfileMePanel
                v-if="tab === 'me'"
                :definitions="builtInDefinitions"
                :value-for="draft"
                @change="markDirty"
            />

            <ProfileInfoPanel
                v-else-if="tab === 'info'"
                :definitions="customDefinitions"
                :value-for="draft"
                @change="markDirty"
                @remove="removeAttribute"
                @add="addAttributeOpen = true"
            />

            <ProfileProjectsPanel
                v-else-if="tab === 'projects'"
                :projects="profileStore.state.projects"
                @add="resetProjectForm(); projectOpen = true"
                @edit="editProject"
                @remove="removeProject"
            />

            <div v-else>
                <CvTable :cvs="cvStore.state.cvs" empty-title="No CVs yet"
                         empty-text="Open a position you can access and create a position-specific CV."/>
                <button v-if="cvStore.state.hasMore" type="button" class="btn btn-outline-primary mt-3"
                        :disabled="cvStore.state.loading" @click="cvStore.loadMoreCvs()">
                    {{ cvStore.state.loading ? 'Loading…' : 'Load more CVs' }}
                </button>
            </div>
        </div>
    </section>

    <AddAttributeModal
        v-model="addAttributeId"
        :open="addAttributeOpen"
        :definitions="availableDefinitions"
        @close="addAttributeOpen = false"
        @submit="addAttribute"
    />

    <ProjectCreateModal
        :open="projectOpen"
        :form="projectForm"
        :tags="tagStore.state.tags"
        :editing="projectForm.id !== null"
        @close="projectOpen = false"
        @submit="saveProject"
    />
</template>
