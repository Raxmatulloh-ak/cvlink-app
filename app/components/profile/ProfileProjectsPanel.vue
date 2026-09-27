<script setup>
defineProps({projects: {type: Array, default: () => []}})
const emit = defineEmits(['add', 'edit', 'remove'])
</script>

<template>
    <div>
        <div class="section-heading section-heading--compact">
            <div>
                <span class="eyebrow">Portfolio</span>
                <h2>Projects</h2>
                <p>Reusable projects can be filtered into CVs by technology tags.</p>
            </div>
            <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2" @click="emit('add')">
                <BaseIcon name="plus" :size="16"/>
                Add project
            </button>
        </div>

        <div v-if="projects.length" class="project-list">
            <article v-for="project in projects" :key="project.id" class="project-row">
                <div class="project-row__main">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                        <h3>{{ project.name }}</h3>
                        <span class="version-label">v{{ project.version || 1 }}</span>
                    </div>
                    <p class="project-row__period">{{ project.startDate || '—' }} — {{
                            project.endDate || 'Present'
                        }}</p>
                    <MarkdownText class="project-row__description"
                                  :text="project.description || 'No description yet.'"/>
                    <div class="d-flex gap-2 mt-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="emit('edit', project)">
                            Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="emit('remove', project)">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="project-row__tags">
                    <span v-for="item in project.projectTags || project.tags || []" :key="item.id || item"
                          class="badge-soft">{{ item.tag?.name || item.name || item }}</span>
                    <span v-if="!(project.projectTags || project.tags || []).length" class="text-body-secondary small">No technology tags</span>
                </div>
            </article>
        </div>
        <EmptyState v-else
                    icon="folder"
                    title="No projects yet"
                    text="Add projects you may want to reuse across position-specific CVs."
        />
    </div>
</template>
