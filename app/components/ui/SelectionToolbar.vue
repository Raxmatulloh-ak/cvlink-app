<script setup>
defineProps({count: {type: Number, required: true}})
const emit = defineEmits(['clear'])
</script>

<template>
    <div v-if="count > 0" class="selection-toolbar">
        <strong>{{ count }} selected</strong>
        <span class="selection-toolbar__divider"></span>
        <slot/>
        <button type="button" class="btn btn-sm btn-link ms-auto text-decoration-none" @click="emit('clear')">Clear</button>
    </div>
</template>
