<script setup>
const props = defineProps({
    cvs: {type: Array, default: () => []},
    showCandidate: {type: Boolean, default: false},
    emptyTitle: {type: String, default: 'No CVs yet'},
    emptyText: {type: String, default: 'CVs will appear here when candidates create them.'},
})

function candidateLabel(cv) {
    return cv.candidateName || (cv.candidateId ? `Candidate #${cv.candidateId}` : 'Candidate')
}

function likeCount(cv) {
    if (typeof cv.likes === 'number') {
        return cv.likes
    }

    if (typeof cv.likesCount === 'number') {
        return cv.likesCount
    }

    if (typeof cv.likeCount === 'number') {
        return cv.likeCount
    }

    return Array.isArray(cv.likes) ? cv.likes.length : '—'
}
</script>

<template>
    <div class="table-shell">
        <div v-if="cvs.length" class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                <tr>
                    <th>CV</th>
                    <th v-if="showCandidate">Candidate</th>
                    <th>Status</th>
                    <th class="text-center">Likes</th>
                    <th>Created</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="cv in cvs" :key="cv.id">
                    <td>
                        <NuxtLink :to="`/cvs/${cv.id}`" class="table-link">
                            {{ cv.position?.title || cv.positionTitle || `CV #${cv.id}` }}
                        </NuxtLink>
                    </td>
                    <td v-if="showCandidate" class="text-body-secondary">{{ candidateLabel(cv) }}</td>
                    <td>
                        <span class="badge-status"
                              :class="cv.status === 'published' ? 'badge-status--success' : 'badge-status--warning'">
                            {{ cv.status || 'draft' }}
                        </span>
                    </td>
                    <td class="text-center fw-semibold">{{ likeCount(cv) }}</td>
                    <td class="text-body-secondary">{{
                            cv.createdAt ? new Date(cv.createdAt).toLocaleDateString() : '—'
                        }}
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <EmptyState v-else icon="file-text" :title="emptyTitle" :text="emptyText"/>
    </div>
</template>
