<script setup>
defineProps({definitions: {type: Array, default: () => []}, valueFor: {type: Function, required: true}})
const emit = defineEmits(['change'])
</script>

<template>
    <div class="row g-4">
        <div class="col-lg-8">
            <div class="surface">
                <div class="form-section">
                    <h2>Personal information</h2>
                    <p class="form-section__hint">Core profile fields use the same Attribute Library and master-value model as every other CV field.</p>
                    <div v-if="definitions.length" class="d-grid gap-3">
                        <label v-for="definition in definitions" :key="definition.id">
                            <span class="form-label fw-semibold">{{ definition.name }}</span>
                            <AttributeValueInput :definition="definition" :model-value="valueFor(definition)" @update:model-value="emit('change', definition, $event)"/>
                        </label>
                    </div>
                    <div v-else class="alert alert-warning mb-0">Built-in First Name, Last Name, Location and Personal Photo definitions have not been seeded by the API yet.</div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <aside class="surface profile-note">
                <span class="profile-note__icon"><BaseIcon name="check" :size="18"/></span>
                <h2>Auto-save without noise</h2>
                <p>Changes are grouped and saved after 7 seconds instead of sending a request for every keystroke.</p>
                <p class="mb-0">Each update carries its version so stale edits can be rejected instead of silently overwriting newer data.</p>
            </aside>
        </div>
    </div>
</template>
