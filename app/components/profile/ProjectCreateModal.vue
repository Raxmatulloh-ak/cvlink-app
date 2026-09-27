<script setup>
import {computed} from 'vue'

const props = defineProps({
    open: {type: Boolean, default: false},
    form: {type: Object, required: true},
    editing: {type: Boolean, default: false},
    tags: {type: Array, default: () => []}
})
const tagPrefix = computed(() => props.form.tagsText.replace(/[^,]*$/, ''))
const emit = defineEmits(['close', 'submit'])
</script>

<template>
    <div v-if="open" class="modal-backdrop-custom" @click.self="emit('close')">
        <form class="editor-modal" @submit.prevent="emit('submit')">
            <div class="modal-heading">
                <div><span class="eyebrow">Portfolio</span>
                    <h2>{{ editing ? 'Edit project' : 'Add project' }}</h2></div>
                <button type="button" class="icon-button" aria-label="Close" @click="emit('close')">
                    <BaseIcon name="close" :size="17"/>
                </button>
            </div>
            <div class="row g-3">
                <div class="col-12"><label class="form-label fw-semibold">Name</label><input v-model="form.name"
                                                                                             class="form-control"
                                                                                             required></div>
                <div class="col-sm-6"><label class="form-label fw-semibold">Start date</label><input
                    v-model="form.startDate" type="date" class="form-control" required></div>
                <div class="col-sm-6"><label class="form-label fw-semibold">End date</label><input
                    v-model="form.endDate" type="date" class="form-control"></div>
                <div class="col-12"><label class="form-label fw-semibold">Description</label><textarea
                    v-model="form.description" class="form-control" rows="4"
                    placeholder="Markdown is supported in the rendered view"></textarea></div>
                <div class="col-12"><label class="form-label fw-semibold">Technology tags</label><input
                    v-model="form.tagsText" class="form-control" list="project-tag-suggestions"
                    placeholder="PHP, Symfony, PostgreSQL">
                    <datalist id="project-tag-suggestions">
                        <option v-for="tag in tags" :key="tag.id" :value="`${tagPrefix}${tag.name}`"/>
                    </datalist>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-outline-secondary" @click="emit('close')">Cancel</button>
                <button class="btn btn-primary">{{ editing ? 'Save project' : 'Add project' }}</button>
            </div>
        </form>
    </div>
</template>
