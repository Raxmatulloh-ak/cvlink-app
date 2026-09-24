<script setup>
defineProps({
    initials: {type: String, default: 'CV'},
    displayName: {type: String, default: 'Account'},
    email: {type: String, default: ''},
    roleLabel: {type: String, default: 'candidate'},
    saving: {type: Boolean, default: false},
    dirtyCount: {type: Number, default: 0},
    tab: {type: String, default: 'me'},
    infoCount: {type: Number, default: 0},
    projectCount: {type: Number, default: 0},
    cvCount: {type: Number, default: 0},
})

const emit = defineEmits(['save', 'update:tab'])
</script>

<template>
    <section class="profile-head">
        <div class="container-xl">
            <div class="d-flex flex-column flex-md-row align-items-md-center gap-3 gap-md-4">
                <div class="profile-head__avatar">{{ initials }}</div>
                <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                        <h1 class="h3 fw-bold mb-0">{{ displayName }}</h1>
                        <span class="badge-status badge-status--success">{{ roleLabel }}</span>
                    </div>
                    <p class="text-body-secondary mt-1 mb-0">{{ email }}</p>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span class="save-state">
                        <BaseIcon :name="dirtyCount ? 'edit' : 'check'" :size="15"/>
                        {{ saving ? 'Saving…' : dirtyCount ? 'Unsaved changes' : 'Saved' }}
                    </span>
                    <button type="button" class="btn btn-primary" :disabled="saving || dirtyCount === 0" @click="emit('save')">Save now</button>
                </div>
            </div>

            <div class="profile-tabs" role="tablist">
                <button :class="{active: tab === 'me'}" @click="emit('update:tab', 'me')">Me</button>
                <button :class="{active: tab === 'info'}" @click="emit('update:tab', 'info')">Info <span class="tab-count">{{ infoCount }}</span></button>
                <button :class="{active: tab === 'projects'}" @click="emit('update:tab', 'projects')">Projects <span class="tab-count">{{ projectCount }}</span></button>
                <button :class="{active: tab === 'cvs'}" @click="emit('update:tab', 'cvs')">CVs <span class="tab-count">{{ cvCount }}</span></button>
            </div>
        </div>
    </section>
</template>
