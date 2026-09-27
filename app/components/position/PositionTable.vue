<script setup>
import {computed} from 'vue'

const props = defineProps({
    positions: {type: Array, required: true},
    selectable: {type: Boolean, default: false},
    selectedIds: {type: Array, default: () => []}
})

const emit = defineEmits(['update:selectedIds'])
const allSelected = computed(() => props.positions.length > 0 && props.positions.every((item) => props.selectedIds.includes(item.id)))

function toggleAll() {
    emit('update:selectedIds', allSelected.value ? [] : props.positions.map((item) => item.id))
}

function toggle(id) {
    emit('update:selectedIds', props.selectedIds.includes(id) ? props.selectedIds.filter((item) => item !== id) : [...props.selectedIds, id])
}

function attributeCount(position) {
    return position.attributeCount ?? position.positionAttributes?.length ?? position.attributes?.length ?? '—'
}

function accessLabel(value) {
    if (!value) {
        return '—'
    }

    return String(value).toLowerCase() === 'restricted' ? 'Restricted' : 'Public'
}
</script>

<template>
    <div class="table-shell">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                <tr>
                    <th v-if="selectable" style="width: 52px"><input class="form-check-input" type="checkbox"
                                                                     :checked="allSelected" @change="toggleAll"></th>
                    <th>Position</th>
                    <th>Access</th>
                    <th class="text-center">Attributes</th>
                    <th class="text-center">Project limit</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="position in positions" :key="position.id">
                    <td v-if="selectable"><input class="form-check-input" type="checkbox"
                                                 :checked="selectedIds.includes(position.id)"
                                                 @change="toggle(position.id)"></td>
                    <td>
                        <NuxtLink :to="`/positions/${position.id}`" class="table-link">{{ position.title }}</NuxtLink>
                        <div class="small text-body-secondary text-truncate" style="max-width: 520px">
                            {{ position.description || 'No description' }}
                        </div>
                    </td>
                    <td><span v-if="position.accessType" class="badge-status"
                              :class="accessLabel(position.accessType) === 'Public' ? 'badge-status--success' : 'badge-status--warning'">{{
                            accessLabel(position.accessType)
                        }}</span><span v-else class="text-body-secondary">—</span></td>
                    <td class="text-center fw-semibold">{{ attributeCount(position) }}</td>
                    <td class="text-center">{{ position.maxProjects ?? '—' }}</td>
                </tr>
                </tbody>
            </table>
        </div>
        <EmptyState v-if="positions.length === 0" icon="briefcase" title="No positions yet"
                    text="Positions created by recruiters will appear here."/>
    </div>
</template>
