<script setup>
const props = defineProps({statistics: {type: Object, default: null}, positionCount: {type: Number, default: 0}})
const value = (key, fallback = '—') => props.statistics?.[key] ?? fallback
</script>

<template>
    <section class="stats-strip">
        <div class="container-xl">
            <div class="row row-cols-2 row-cols-md-4 g-0">
                <div class="col stat-cell"><strong>{{ value('totalPositions', positionCount) }}</strong><span>Total positions</span></div>
                <div class="col stat-cell"><strong>{{ value('cvsLast24Hours') }}</strong><span>CVs in last 24 hours</span></div>
                <div class="col stat-cell"><strong>{{ value('totalCandidates') }}</strong><span>Candidates</span></div>
                <div class="col stat-cell"><strong>{{ value('totalRecruiters') }}</strong><span>Recruiters</span></div>
            </div>
        </div>
    </section>
</template>
