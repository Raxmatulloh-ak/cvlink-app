<script setup>
import {computed} from 'vue'
import {usePositionStore} from '@/stores/position'
import {useStatisticsStore} from '@/stores/statistics'
import {useTagStore} from '@/stores/tag'
import {useTranslate} from '@/composables/useTranslate'

const positionStore = usePositionStore()
const statisticsStore = useStatisticsStore()
const tagStore = useTagStore()
const {t} = useTranslate()

await useAsyncData('home-data', async () => {
    await Promise.all([
        positionStore.fetchPositions().catch(() => []),
        statisticsStore.fetchStatistics().catch(() => null),
        tagStore.fetchTags().catch(() => []),
    ])
})

const latest = computed(() => [...positionStore.state.positions]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 5))

const popular = computed(() => [...positionStore.state.positions]
    .sort((a, b) => Number(b.cvCount || b.cvsCount || 0) - Number(a.cvCount || a.cvsCount || 0))
    .slice(0, 5))

useSeoMeta({title: 'Career profiles and position-specific CVs'})
</script>

<template>
    <HeroSection/>
    <StatisticsStrip :statistics="statisticsStore.state.statistics" :position-count="positionStore.state.totalItems"/>

    <section class="page-section">
        <div class="container-xl">
            <div class="section-heading">
                <div>
                    <span class="eyebrow">{{ t('home.latestEyebrow') }}</span>
                    <h2>{{ t('home.latestTitle') }}</h2>
                </div>
                <NuxtLink to="/positions" class="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                    {{ t('home.browseAll') }} <BaseIcon name="arrow-right" :size="16"/>
                </NuxtLink>
            </div>
            <PositionTable :positions="latest"/>
        </div>
    </section>

    <section class="page-section page-section--soft">
        <div class="container-xl">
            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="section-heading mb-3">
                        <div><span class="eyebrow">By activity</span><h2>Popular positions</h2></div>
                    </div>
                    <PositionTable :positions="popular"/>
                </div>
                <div class="col-lg-4">
                    <div class="surface h-100 p-4">
                        <span class="eyebrow">Technology cloud</span>
                        <h2 class="h4 fw-bold mt-2">Explore by technology</h2>
                        <p class="text-body-secondary small">Tags come from projects and position project filters.</p>
                        <div class="d-flex flex-wrap gap-2 mt-4">
                            <NuxtLink v-for="tag in tagStore.state.tags.slice(0, 18)" :key="tag.id" :to="{path:'/positions', query:{tag:tag.name}}" class="badge-soft text-decoration-none">
                                {{ tag.name }}
                            </NuxtLink>
                            <span v-if="tagStore.state.tags.length === 0" class="text-body-secondary small">No tags yet.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <WorkflowSection/>
</template>
