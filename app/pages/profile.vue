<script setup>
import {computed, onBeforeUnmount, reactive, ref} from 'vue'
import {useUserStore} from '@/stores/user'
import {useAttributeDefinitionStore} from '@/stores/attributeDefinition'
import {useUserAttributeValueStore} from '@/stores/userAttributeValue'
import {useProjectStore} from '@/stores/project'
import {useCvStore} from '@/stores/cv'
import {useAppStore} from '@/stores/app'
import {apiMessage, getItemId, iri} from '@/utils/api'
import {attributeValuePayload, scalarFromAttributeValue} from '@/utils/attributeValue'

definePageMeta({auth: true, roles: ['ROLE_CANDIDATE', 'ROLE_ADMIN']})

const userStore = useUserStore()
const attributeStore = useAttributeDefinitionStore()
const valueStore = useUserAttributeValueStore()
const projectStore = useProjectStore()
const cvStore = useCvStore()
const appStore = useAppStore()
const tab = ref('me')
const saving = ref(false)
const dirtyIds = reactive(new Set())
const drafts = reactive({})
const addAttributeOpen = ref(false)
const addAttributeId = ref(null)
const projectOpen = ref(false)
const projectForm = reactive({name: '', startDate: '', endDate: '', description: '', tagsText: ''})
let saveTimer = null

await useAsyncData('profile-data-v2', async () => {
    const user = await userStore.fetchAboutMe(true)
    await Promise.all([
        attributeStore.fetchAttributeDefinitions(),
        valueStore.fetchUserAttributeValues({owner: iri('users', user.id)}).catch(() => []),
        projectStore.fetchProjects({candidate: iri('users', user.id)}).catch(() => []),
        cvStore.fetchCvs({candidate: iri('users', user.id)}).catch(() => []),
    ])
})

useSeoMeta({title: 'My profile'})

const userValues = computed(() => valueStore.state.userAttributeValues.filter((item) => {
    const ownerId = getItemId(item.owner)
    return ownerId === null || ownerId === userStore.state.user?.id
}))

const valueByAttribute = computed(() => new Map(userValues.value.map((item) => [getItemId(item.attribute), item])))
const builtInDefinitions = computed(() => attributeStore.state.attributeDefinitions.filter((item) => item.builtinKey))
const customDefinitions = computed(() => userValues.value
    .map((value) => attributeStore.state.attributeDefinitions.find((item) => item.id === getItemId(value.attribute)))
    .filter((item) => item && !item.builtinKey))
const availableDefinitions = computed(() => attributeStore.state.attributeDefinitions.filter((item) => !item.builtinKey && !valueByAttribute.value.has(item.id)))

function draft(definition) {
    if (!(definition.id in drafts)) drafts[definition.id] = scalarFromAttributeValue(definition, valueByAttribute.value.get(definition.id))
    return drafts[definition.id]
}

function markDirty(definition, value) {
    drafts[definition.id] = value
    dirtyIds.add(definition.id)
    scheduleSave()
}

function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveDirtyValues, 7000)
}

async function saveDefinition(definition) {
    const current = valueByAttribute.value.get(definition.id)
    const payload = attributeValuePayload({definition, scalar: draft(definition), ownerId: userStore.state.user.id, current})
    const saved = current
        ? await valueStore.patchUserAttributeValue(current.id, payload)
        : await valueStore.pushUserAttributeValue(payload)
    dirtyIds.delete(definition.id)
    return saved
}

async function saveDirtyValues() {
    if (!dirtyIds.size || saving.value) return
    saving.value = true
    const ids = [...dirtyIds]
    try {
        for (const id of ids) {
            const definition = attributeStore.state.attributeDefinitions.find((item) => item.id === id)
            if (definition) await saveDefinition(definition)
        }
        appStore.notify('Profile saved')
    } catch (error) {
        appStore.notify(error?.response?.status === 409 ? 'Profile data changed elsewhere. Your local input is kept; reload before retrying.' : apiMessage(error, 'Profile could not be saved.'), 'error')
    } finally {
        saving.value = false
    }
}

async function addAttribute() {
    const definition = attributeStore.state.attributeDefinitions.find((item) => item.id === Number(addAttributeId.value))
    if (!definition) return
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
    if (!value || !confirm(`Remove ${definition.name} from your profile?`)) return
    try {
        await valueStore.deleteUserAttributeValue(value.id, value.version)
        delete drafts[definition.id]
    } catch (error) {
        appStore.notify(apiMessage(error, 'Attribute could not be removed.'), 'error')
    }
}

async function addProject() {
    if (!projectForm.name.trim()) return
    try {
        await projectStore.pushProject({
            candidate: iri('users', userStore.state.user.id),
            name: projectForm.name.trim(),
            startDate: projectForm.startDate,
            endDate: projectForm.endDate || null,
            description: projectForm.description || null,
            tags: projectForm.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        })
        Object.assign(projectForm, {name: '', startDate: '', endDate: '', description: '', tagsText: ''})
        projectOpen.value = false
    } catch (error) {
        appStore.notify(apiMessage(error, 'Project could not be created.'), 'error')
    }
}

onBeforeUnmount(() => clearTimeout(saveTimer))
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
        :project-count="projectStore.state.projects.length"
        :cv-count="cvStore.state.cvs.length"
        @save="saveDirtyValues"
    />

    <section class="page-section pt-4">
        <div class="container-xl">
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
                :projects="projectStore.state.projects"
                @add="projectOpen = true"
            />

            <CvTable
                v-else
                :cvs="cvStore.state.cvs"
                empty-title="No CVs yet"
                empty-text="Open a position you can access and create a position-specific CV."
            />
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
        @close="projectOpen = false"
        @submit="addProject"
    />
</template>
