<script setup>
defineProps({
    icon: {type: String, default: 'file-text'},
    title: {type: String, required: true},
    text: {type: String, default: ''},
})
</script>

<template>
    <div class="empty-state">
        <span class="empty-state__icon"><BaseIcon :name="icon" :size="26"/></span>
        <h3>{{ title }}</h3>
        <p v-if="text">{{ text }}</p>
        <slot/>
    </div>
</template>
