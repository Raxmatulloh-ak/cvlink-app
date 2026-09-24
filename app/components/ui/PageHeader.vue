<script setup>
defineProps({
    eyebrow: {type: String, default: ''},
    title: {type: String, required: true},
    description: {type: String, default: ''},
    compact: {type: Boolean, default: false},
})
</script>

<template>
    <section class="page-hero" :class="{'page-hero--compact': compact}">
        <div class="container-xl d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-4">
            <div>
                <slot name="before"/>
                <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
                <h1>{{ title }}</h1>
                <p v-if="description">{{ description }}</p>
            </div>
            <div v-if="$slots.actions" class="page-hero__actions">
                <slot name="actions"/>
            </div>
        </div>
    </section>
</template>
