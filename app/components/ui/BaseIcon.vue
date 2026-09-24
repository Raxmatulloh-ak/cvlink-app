<script setup>
import {computed} from 'vue'

const props = defineProps({
    name: {type: String, required: true},
    size: {type: [Number, String], default: 20},
})

const dimension = computed(() => typeof props.size === 'number' ? `${props.size}px` : props.size)
const iconUrl = computed(() => `url('/icons/${props.name}.svg')`)
</script>

<template>
    <span
        class="base-icon"
        :style="{
            width: dimension,
            height: dimension,
            WebkitMaskImage: iconUrl,
            maskImage: iconUrl,
        }"
        aria-hidden="true"
    />
</template>
