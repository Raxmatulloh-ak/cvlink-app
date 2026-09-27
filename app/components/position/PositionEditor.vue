<script setup>
import {computed, reactive, ref} from 'vue'
import {usePositionStore} from '@/stores/position'
import {useAttributeStore} from '@/stores/attribute'
import {useTagStore} from '@/stores/tag'
import {useAppStore} from '@/stores/app'
import {apiMessage} from '@/utils/api'
import {POSITION_ACCESS} from '@/constants/domain'

const props = defineProps({
    positionId: {type: [Number, String], default: null},
})
const positionStore = usePositionStore()
const attributeStore = useAttributeStore()
const tagStore = useTagStore()
const appStore = useAppStore()
const saving = ref(false)
const isNew = computed(() => !props.positionId)

const form = reactive({
    id: null,
    title: '',
    description: '',
    accessType: POSITION_ACCESS.public,
    maxProjects: 0,
    version: 1,
    attributes: [],
    accessRules: [],
    tagsText: '',
})

await useAsyncData(`position-editor-${props.positionId || 'new'}`, async () => {
    await Promise.all([
        attributeStore.fetchAttributes(),
        tagStore.fetchTags().catch(() => []),
    ])

    if (!isNew.value) {
        const position = await positionStore.fetchPosition(props.positionId)
        Object.assign(form, {
            id: position.id,
            title: position.title || '',
            description: position.description || '',
            accessType: position.accessType || POSITION_ACCESS.public,
            maxProjects: position.maxProjects ?? 0,
            version: position.version || 1,
            attributes: (position.positionAttributes || []).map((item) => ({
                attributeId: item.attribute?.id,
                displayOrder: item.displayOrder ?? 0,
            })).filter((item) => item.attributeId),
            accessRules: (position.accessRules || []).map((rule) => ({
                attributeId: rule.attribute?.id || null,
                operation: rule.operation || 'equal',
                textOperand: rule.textOperand ?? '',
                numericOperand: rule.numericOperand ?? null,
                dateOperand: rule.dateOperand ?? '',
                periodStartOperand: rule.periodStartOperand ?? '',
                periodEndOperand: rule.periodEndOperand ?? '',
                booleanOperand: rule.booleanOperand ?? null,
                optionId: rule.option?.id || null,
            })),
            tagsText: (position.positionTags || []).map((item) => item.tag?.name).filter(Boolean).join(', '),
        })
    }
})

function selectedAttribute(id) {
    return attributeStore.state.attributes.find((item) => item.id === Number(id))
}

function isAttributeSelected(id) {
    return form.attributes.some((item) => item.attributeId === id)
}

function toggleAttribute(attribute) {
    const index = form.attributes.findIndex((item) => item.attributeId === attribute.id)
    if (index === -1) {
        form.attributes.push({attributeId: attribute.id, displayOrder: form.attributes.length})
    } else {
        form.attributes.splice(index, 1)
        form.attributes.forEach((item, order) => item.displayOrder = order)
        form.accessRules = form.accessRules.filter((rule) => rule.attributeId !== attribute.id)
    }
}

function addRule() {
    const firstAllowed = form.attributes.find((item) => selectedAttribute(item.attributeId)?.valueType !== 'image')
    if (firstAllowed === undefined) return
    form.accessRules.push({
        attributeId: firstAllowed.attributeId,
        operation: 'equal',
        textOperand: '',
        numericOperand: null,
        dateOperand: '',
        periodStartOperand: '',
        periodEndOperand: '',
        booleanOperand: null,
        optionId: null,
    })
}

function operators(attribute) {
    if (!attribute) return [{value: 'equal', label: 'Equals'}]
    if (['numeric', 'date'].includes(attribute.valueType)) {
        return [
            {value: 'equal', label: 'Equals'},
            {value: 'greater_than', label: 'Greater than'},
            {value: 'greater_than_or_equal', label: 'At least'},
            {value: 'less_than', label: 'Less than'},
            {value: 'less_than_or_equal', label: 'At most'},
        ]
    }
    return [{value: 'equal', label: 'Equals'}]
}

function buildRule(rule) {
    const attribute = selectedAttribute(rule.attributeId)
    const payload = {attributeId: Number(rule.attributeId), operation: rule.operation}

    switch (attribute?.valueType) {
        case 'numeric':
            payload.numericOperand = rule.numericOperand === '' ? null : Number(rule.numericOperand);
            break
        case 'date':
            payload.dateOperand = rule.dateOperand || null;
            break
        case 'period':
            payload.periodStartOperand = rule.periodStartOperand || null
            payload.periodEndOperand = rule.periodEndOperand || null
            break
        case 'boolean':
            payload.booleanOperand = Boolean(rule.booleanOperand);
            break
        case 'dropdown':
            payload.optionId = rule.optionId ? Number(rule.optionId) : null;
            break
        default:
            payload.textOperand = rule.textOperand || null
    }

    return payload
}

async function save() {
    saving.value = true
    try {
        const payload = {
            title: form.title.trim(),
            description: form.description || null,
            accessType: form.accessType,
            maxProjects: Number(form.maxProjects || 0),
            attributes: form.attributes.map((item, index) => ({
                attributeId: Number(item.attributeId),
                displayOrder: index
            })),
            accessRules: form.accessType === POSITION_ACCESS.restricted ? form.accessRules.filter((rule) => rule.attributeId).map(buildRule) : [],
            tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
            ...(isNew.value ? {} : {id: form.id, version: form.version}),
        }

        const saved = isNew.value
            ? await positionStore.pushPosition(payload)
            : await positionStore.patchPosition(form.id, payload)
        appStore.notify(isNew.value ? 'Position created' : 'Position updated')
        await navigateTo(`/positions/${saved.id}`)
    } catch (error) {
        appStore.notify(error?.response?.status === 409 ? 'Position changed elsewhere. Reload before saving again.' : apiMessage(error, 'Position could not be saved.'), 'error')
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <section class="page-hero py-4">
        <div class="container-xl d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
                <NuxtLink to="/positions" class="small text-decoration-none text-body-secondary">← Positions</NuxtLink>
                <h1 class="h3 mt-2 mb-0">{{ isNew ? 'Create position' : 'Edit position' }}</h1>
            </div>
            <div class="d-flex gap-2">
                <NuxtLink :to="isNew ? '/positions' : `/positions/${form.id}`" class="btn btn-outline-secondary">
                    Cancel
                </NuxtLink>
                <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
                    {{ saving ? 'Saving…' : 'Save position' }}
                </button>
            </div>
        </div>
    </section>

    <section class="page-section pt-4">
        <div class="container-xl">
            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="surface mb-4">
                        <div class="form-section">
                            <h2>Basic information</h2>
                            <p class="form-section__hint">Keep the template name clear enough for candidates and
                                recruiters.</p>
                            <div class="row g-3">
                                <div class="col-12"><label class="form-label fw-semibold">Title</label><input
                                    v-model="form.title" class="form-control" required maxlength="255"></div>
                                <div class="col-12"><label class="form-label fw-semibold">Short
                                    description</label><textarea v-model="form.description" class="form-control"
                                                                 rows="4"></textarea></div>
                                <div class="col-md-6"><label class="form-label fw-semibold">Access</label><select
                                    v-model="form.accessType" class="form-select">
                                    <option :value="POSITION_ACCESS.public">Public</option>
                                    <option :value="POSITION_ACCESS.restricted">Restricted</option>
                                </select></div>
                                <div class="col-md-6"><label class="form-label fw-semibold">Maximum
                                    projects</label><input v-model.number="form.maxProjects" type="number" min="0"
                                                           class="form-control"></div>
                            </div>
                        </div>
                    </div>

                    <div class="surface mb-4">
                        <div class="form-section">
                            <h2>Template attributes</h2>
                            <p class="form-section__hint">Choose from the shared Attribute Library. Values remain owned
                                by the candidate profile.</p>
                            <div class="row g-2">
                                <div v-for="attribute in attributeStore.state.attributes" :key="attribute.id"
                                     class="col-md-6">
                                    <button type="button" class="w-100 text-start border rounded-3 p-3 bg-body"
                                            :class="isAttributeSelected(attribute.id) ? 'border-primary' : ''"
                                            @click="toggleAttribute(attribute)">
                                        <div class="d-flex align-items-start gap-2">
                                            <input class="form-check-input mt-1" type="checkbox"
                                                   :checked="isAttributeSelected(attribute.id)" tabindex="-1">
                                            <div><strong class="d-block">{{ attribute.name }}</strong><small
                                                class="text-body-secondary">{{
                                                    attribute.category?.name || 'Uncategorized'
                                                }} · {{ attribute.valueType }}</small></div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <EmptyState v-if="attributeStore.state.attributes.length === 0" icon="info"
                                        title="No attributes available"
                                        text="Create attributes in the shared library first."/>
                        </div>
                    </div>

                    <div v-if="form.accessType === POSITION_ACCESS.restricted" class="surface">
                        <div class="form-section">
                            <div class="d-flex justify-content-between align-items-start gap-3">
                                <div><h2>Access rules</h2>
                                    <p class="form-section__hint mb-0">Only selected template attributes can be used in
                                        access rules.</p></div>
                                <button type="button" class="btn btn-sm btn-outline-primary"
                                        :disabled="form.attributes.every((item) => selectedAttribute(item.attributeId)?.valueType === 'image')"
                                        @click="addRule">+ Add rule
                                </button>
                            </div>
                            <div class="d-grid gap-3 mt-4">
                                <div v-for="(rule, index) in form.accessRules" :key="index"
                                     class="border rounded-3 p-3">
                                    <div class="row g-2 align-items-end">
                                        <div class="col-md-4">
                                            <label class="form-label small fw-semibold">Attribute</label>
                                            <select v-model.number="rule.attributeId" class="form-select">
                                                <option
                                                    v-for="item in form.attributes.filter((entry) => selectedAttribute(entry.attributeId)?.valueType !== 'image')"
                                                    :key="item.attributeId" :value="item.attributeId">
                                                    {{ selectedAttribute(item.attributeId)?.name }}
                                                </option>
                                            </select>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label small fw-semibold">Operator</label>
                                            <select v-model="rule.operation" class="form-select">
                                                <option
                                                    v-for="operator in operators(selectedAttribute(rule.attributeId))"
                                                    :key="operator.value" :value="operator.value">{{ operator.label }}
                                                </option>
                                            </select>
                                        </div>
                                        <div class="col-md">
                                            <template
                                                v-if="selectedAttribute(rule.attributeId)?.valueType === 'numeric'">
                                                <label class="form-label small fw-semibold">Value</label><input
                                                v-model="rule.numericOperand" type="number" class="form-control">
                                            </template>
                                            <template
                                                v-else-if="selectedAttribute(rule.attributeId)?.valueType === 'date'">
                                                <label class="form-label small fw-semibold">Date</label><input
                                                v-model="rule.dateOperand" type="date" class="form-control"></template>
                                            <template
                                                v-else-if="selectedAttribute(rule.attributeId)?.valueType === 'period'">
                                                <label class="form-label small fw-semibold">Period</label>
                                                <div class="d-flex gap-2"><input v-model="rule.periodStartOperand"
                                                                                 type="date" class="form-control"><input
                                                    v-model="rule.periodEndOperand" type="date" class="form-control">
                                                </div>
                                            </template>
                                            <template
                                                v-else-if="selectedAttribute(rule.attributeId)?.valueType === 'boolean'">
                                                <label class="form-label small fw-semibold d-block">Value</label><select
                                                v-model="rule.booleanOperand" class="form-select">
                                                <option :value="true">Checked</option>
                                                <option :value="false">Not checked</option>
                                            </select></template>
                                            <template
                                                v-else-if="selectedAttribute(rule.attributeId)?.valueType === 'dropdown'">
                                                <label class="form-label small fw-semibold">Option</label><select
                                                v-model.number="rule.optionId" class="form-select">
                                                <option :value="null">Choose…</option>
                                                <option
                                                    v-for="option in selectedAttribute(rule.attributeId)?.options || []"
                                                    :key="option.id" :value="option.id">{{ option.label }}
                                                </option>
                                            </select></template>
                                            <template v-else><label
                                                class="form-label small fw-semibold">Value</label><input
                                                v-model="rule.textOperand" class="form-control"></template>
                                        </div>
                                        <div class="col-auto">
                                            <button type="button" class="icon-button" aria-label="Remove rule"
                                                    @click="form.accessRules.splice(index, 1)">
                                                <BaseIcon name="trash" :size="16"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p v-if="form.accessRules.length === 0" class="small text-body-secondary mt-4 mb-0">No rules
                                added. Restricted positions should have at least one meaningful rule.</p>
                        </div>
                    </div>
                </div>

                <aside class="col-lg-4">
                    <div class="surface p-4 sticky-lg-top" style="top: 96px">
                        <h2 class="h6 fw-bold">Project filter</h2>
                        <p class="small text-body-secondary">Enter technology tags separated by commas. Matching
                            projects are selected from the candidate profile.</p>
                        <label class="form-label small fw-semibold">Tags</label>
                        <textarea v-model="form.tagsText" class="form-control" rows="4"
                                  placeholder="PHP, Symfony, PostgreSQL"></textarea>
                        <div v-if="tagStore.state.tags.length" class="mt-3">
                            <small class="text-body-secondary d-block mb-2">Existing tags</small>
                            <div class="d-flex flex-wrap gap-2"><span v-for="tag in tagStore.state.tags.slice(0, 12)"
                                                                      :key="tag.id" class="badge-soft">{{
                                    tag.name
                                }}</span></div>
                        </div>
                        <hr>
                        <div class="small text-body-secondary">
                            <strong class="text-body d-block mb-1">Optimistic locking</strong>
                            Existing positions are saved with version {{ form.version }}. A stale version must return a
                            conflict instead of overwriting newer changes.
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>
