<script setup>
defineProps({definitions: {type: Array, default: () => []}, valueFor: {type: Function, required: true}})
const emit = defineEmits(['change', 'remove', 'add'])
</script>

<template>
    <div class="surface">
        <div class="form-section d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
                <h2>Reusable information</h2>
                <p class="form-section__hint mb-0">Keep one master value for every attribute you want to reuse across CVs.</p>
            </div>
            <button type="button" class="btn btn-outline-primary align-self-start d-inline-flex align-items-center gap-2" @click="emit('add')">
                <BaseIcon name="plus" :size="16"/> Add attribute
            </button>
        </div>
        <div v-if="definitions.length" class="border-top">
            <div v-for="definition in definitions" :key="definition.id" class="form-section">
                <div class="row g-3 align-items-start">
                    <div class="col-md-4">
                        <strong class="d-block">{{ definition.name }}</strong>
                        <small class="text-body-secondary">{{ definition.category?.name || 'Uncategorized' }} · {{ definition.valueType }}</small>
                    </div>
                    <div class="col-md">
                        <AttributeValueInput :definition="definition" :model-value="valueFor(definition)" @update:model-value="emit('change', definition, $event)"/>
                    </div>
                    <div class="col-auto">
                        <button type="button" class="icon-button" :aria-label="`Remove ${definition.name}`" @click="emit('remove', definition)">
                            <BaseIcon name="trash" :size="16"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <EmptyState v-else icon="info" title="No custom profile attributes" text="Choose reusable attributes from the shared Attribute Library."/>
    </div>
</template>
