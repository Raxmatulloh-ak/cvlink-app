<script setup>
const props = defineProps({open: {type: Boolean, default: false}, definitions: {type: Array, default: () => []}, modelValue: {type: [Number, String, null], default: null}})
const emit = defineEmits(['update:modelValue', 'close', 'submit'])
</script>

<template>
    <div v-if="open" class="modal-backdrop-custom" @click.self="emit('close')">
        <form class="editor-modal" @submit.prevent="emit('submit')">
            <div class="modal-heading">
                <div><span class="eyebrow">Profile library</span><h2>Add profile attribute</h2></div>
                <button type="button" class="icon-button" aria-label="Close" @click="emit('close')"><BaseIcon name="close" :size="17"/></button>
            </div>
            <label class="form-label fw-semibold">Attribute</label>
            <select :value="modelValue" class="form-select" required @change="emit('update:modelValue', Number($event.target.value) || null)">
                <option value="">Choose from library…</option>
                <option v-for="definition in definitions" :key="definition.id" :value="definition.id">{{ definition.name }} — {{ definition.category?.name || 'Uncategorized' }}</option>
            </select>
            <div class="modal-actions"><button type="button" class="btn btn-outline-secondary" @click="emit('close')">Cancel</button><button class="btn btn-primary">Add attribute</button></div>
        </form>
    </div>
</template>
