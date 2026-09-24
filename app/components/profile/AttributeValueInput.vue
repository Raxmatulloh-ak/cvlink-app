<script setup>
import {computed} from 'vue'

const props = defineProps({
    definition: {type: Object, required: true},
    modelValue: {type: [String, Number, Boolean, Object, null], default: null},
})
const emit = defineEmits(['update:modelValue'])

const type = computed(() => props.definition.valueType || 'string')
const period = computed(() => typeof props.modelValue === 'object' && props.modelValue !== null ? props.modelValue : {start: '', end: ''})

function updatePeriod(key, value) {
    emit('update:modelValue', {...period.value, [key]: value})
}
</script>

<template>
    <textarea v-if="type === 'text'" class="form-control" rows="4" :value="modelValue || ''" @input="emit('update:modelValue', $event.target.value)"></textarea>
    <input v-else-if="type === 'numeric'" class="form-control" type="number" :value="modelValue ?? ''" @input="emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))">
    <input v-else-if="type === 'date'" class="form-control" type="date" :value="modelValue || ''" @input="emit('update:modelValue', $event.target.value)">
    <div v-else-if="type === 'period'" class="row g-2">
        <div class="col-sm-6"><input class="form-control" type="date" :value="period.start || ''" @input="updatePeriod('start', $event.target.value)"></div>
        <div class="col-sm-6"><input class="form-control" type="date" :value="period.end || ''" @input="updatePeriod('end', $event.target.value)"></div>
    </div>
    <div v-else-if="type === 'boolean'" class="form-check form-switch pt-2">
        <input class="form-check-input" type="checkbox" :checked="Boolean(modelValue)" @change="emit('update:modelValue', $event.target.checked)">
        <label class="form-check-label">{{ modelValue ? 'Yes' : 'No' }}</label>
    </div>
    <select v-else-if="type === 'dropdown'" class="form-select" :value="modelValue ?? ''" @change="emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))">
        <option value="">Choose…</option>
        <option v-for="option in definition.options || []" :key="option.id" :value="option.id">{{ option.label }}</option>
    </select>
    <div v-else-if="type === 'image'" class="input-group">
        <span class="input-group-text"><BaseIcon name="upload" :size="16"/></span>
        <input class="form-control" type="url" :value="modelValue || ''" placeholder="Cloud image URL" @input="emit('update:modelValue', $event.target.value)">
    </div>
    <input v-else class="form-control" type="text" :value="modelValue || ''" @input="emit('update:modelValue', $event.target.value)">
</template>
