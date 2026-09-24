<script setup>
import {computed, reactive, ref} from 'vue'
import {useAttributeDefinitionStore} from '@/stores/attributeDefinition'
import {useAttributeCategoryStore} from '@/stores/attributeCategory'
import {useAppStore} from '@/stores/app'
import {apiMessage, iri} from '@/utils/api'

definePageMeta({auth: true, roles: ['ROLE_RECRUITER', 'ROLE_ADMIN']})

const attributeStore = useAttributeDefinitionStore()
const categoryStore = useAttributeCategoryStore()
const appStore = useAppStore()
const search = ref('')
const categoryId = ref('all')
const selected = ref([])
const editorOpen = ref(false)
const saving = ref(false)
const form = reactive({id: null, name: '', categoryId: null, valueType: 'string', description: '', optionsText: '', version: 1, builtinKey: null})

await useAsyncData('attribute-library', () => Promise.all([
    attributeStore.fetchAttributeDefinitions(),
    categoryStore.fetchCategories(),
]))

useSeoMeta({title: 'Attribute library'})

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return attributeStore.state.attributeDefinitions.filter((attribute) => {
        const matchesText = !q || `${attribute.name} ${attribute.description || ''}`.toLowerCase().startsWith(q) || attribute.name.toLowerCase().includes(q)
        const matchesCategory = categoryId.value === 'all' || Number(attribute.category?.id) === Number(categoryId.value)
        return matchesText && matchesCategory
    })
})

function openEditor(attribute = null) {
    Object.assign(form, attribute ? {
        id: attribute.id,
        name: attribute.name || '',
        categoryId: attribute.category?.id || null,
        valueType: attribute.valueType || 'string',
        description: attribute.description || '',
        optionsText: (attribute.options || []).map((option) => option.label).join(', '),
        version: attribute.version || 1,
        builtinKey: attribute.builtinKey || null,
    } : {
        id: null,
        name: '',
        categoryId: categoryStore.state.categories[0]?.id || null,
        valueType: 'string',
        description: '',
        optionsText: '',
        version: 1,
        builtinKey: null,
    })
    editorOpen.value = true
}

function optionPayload() {
    if (form.valueType !== 'dropdown') return []
    return form.optionsText.split(',').map((label) => label.trim()).filter(Boolean).map((label, displayOrder) => ({label, displayOrder}))
}

async function save() {
    saving.value = true
    try {
        const payload = {
            name: form.name.trim(),
            category: iri('attribute_categories', form.categoryId),
            description: form.description || null,
            options: optionPayload(),
            ...(form.id ? {id: form.id, version: form.version} : {valueType: form.valueType}),
        }
        await attributeStore.saveAttributeDefinition(payload)
        editorOpen.value = false
        appStore.notify(form.id ? 'Attribute updated' : 'Attribute created')
    } catch (error) {
        appStore.notify(error?.response?.status === 409 ? 'Attribute changed elsewhere. Reload it before saving again.' : apiMessage(error, 'Attribute could not be saved.'), 'error')
    } finally {
        saving.value = false
    }
}

async function removeSelected() {
    const items = attributeStore.state.attributeDefinitions.filter((item) => selected.value.includes(item.id))
    const builtIns = items.filter((item) => item.builtinKey)
    if (builtIns.length) return appStore.notify('Built-in profile attributes cannot be deleted.', 'error')
    if (!items.length || !confirm(`Delete ${items.length} selected attribute(s)?`)) return

    try {
        for (const item of items) await attributeStore.deleteAttributeDefinition(item.id, item.version)
        selected.value = []
        appStore.notify('Attributes deleted')
    } catch (error) {
        appStore.notify(apiMessage(error, 'Attributes could not be deleted.'), 'error')
    }
}
</script>

<template>
    <PageHeader eyebrow="Shared recruiter workspace" title="Attribute library" description="Global reusable definitions. Candidate values are stored separately and reused across every CV.">
        <template #actions>
            <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2" @click="openEditor()">
                <BaseIcon name="plus" :size="17"/> New attribute
            </button>
        </template>
    </PageHeader>

    <section class="page-section pt-4">
        <div class="container-xl">
            <div class="filters-bar">
                <div class="row g-2">
                    <div class="col-md">
                        <div class="input-group">
                            <span class="input-group-text bg-transparent border-end-0"><BaseIcon name="search" :size="17"/></span>
                            <input v-model="search" class="form-control border-start-0" placeholder="Find attributes by prefix">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <select v-model="categoryId" class="form-select">
                            <option value="all">All categories</option>
                            <option v-for="category in categoryStore.state.categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <SelectionToolbar :count="selected.length" @clear="selected = []">
                <button type="button" class="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2" @click="removeSelected"><BaseIcon name="trash" :size="15"/> Delete</button>
            </SelectionToolbar>

            <div class="table-shell mt-3">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead><tr><th style="width:52px"></th><th>Attribute</th><th>Category</th><th>Type</th><th>Kind</th><th>Version</th></tr></thead>
                        <tbody>
                        <tr v-for="attribute in filtered" :key="attribute.id">
                            <td><input v-model="selected" class="form-check-input" type="checkbox" :value="attribute.id"></td>
                            <td><button type="button" class="btn btn-link p-0 text-start text-decoration-none table-link" @click="openEditor(attribute)">{{ attribute.name }}</button><div class="small text-body-secondary text-truncate" style="max-width:440px">{{ attribute.description || 'No description' }}</div></td>
                            <td>{{ attribute.category?.name || '—' }}</td>
                            <td><span class="badge-soft">{{ attribute.valueType }}</span></td>
                            <td><span :class="attribute.builtinKey ? 'badge-status badge-status--warning' : 'text-body-secondary small'">{{ attribute.builtinKey ? 'Built-in' : 'Custom' }}</span></td>
                            <td class="text-body-secondary">v{{ attribute.version }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <EmptyState v-if="filtered.length === 0" icon="info" title="No attributes found" text="Try another prefix or category."/>
            </div>
            <p class="small text-body-secondary mt-3 mb-0">{{ filtered.length }} attributes shown</p>
        </div>
    </section>

    <div v-if="editorOpen" class="modal-backdrop-custom" @click.self="editorOpen = false">
        <form class="editor-modal" @submit.prevent="save">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-4">
                <div><span class="eyebrow">{{ form.id ? 'Edit' : 'Create' }}</span><h2 class="h4 fw-bold mt-1 mb-0">Attribute definition</h2></div>
                <button type="button" class="icon-button" aria-label="Close" @click="editorOpen = false"><BaseIcon name="close" :size="18"/></button>
            </div>
            <div class="row g-3">
                <div class="col-12"><label class="form-label fw-semibold">Name</label><input v-model="form.name" class="form-control" required maxlength="255"></div>
                <div class="col-md-6"><label class="form-label fw-semibold">Category</label><select v-model.number="form.categoryId" class="form-select" required><option v-for="category in categoryStore.state.categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></div>
                <div class="col-md-6"><label class="form-label fw-semibold">Data type</label><select v-model="form.valueType" class="form-select" :disabled="Boolean(form.id)"><option v-for="type in ['string','text','image','numeric','date','period','boolean','dropdown']" :key="type" :value="type">{{ type }}</option></select></div>
                <div class="col-12"><label class="form-label fw-semibold">Description</label><textarea v-model="form.description" class="form-control" rows="3"></textarea></div>
                <div v-if="form.valueType === 'dropdown'" class="col-12"><label class="form-label fw-semibold">Options</label><input v-model="form.optionsText" class="form-control" placeholder="Beginner, Intermediate, Advanced"><div class="form-text">Comma-separated. Display order follows the list.</div></div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-outline-secondary" @click="editorOpen = false">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving || form.builtinKey">{{ saving ? 'Saving…' : 'Save attribute' }}</button>
            </div>
        </form>
    </div>
</template>
