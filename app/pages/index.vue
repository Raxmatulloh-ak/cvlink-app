<script setup>
import {computed, onMounted} from 'vue'
import {useDashboardStore} from '@/stores/dashboard'
import {useTranslate} from '@/composables/useTranslate'

const dashboardStore = useDashboardStore()
const {t} = useTranslate()

onMounted(() => {
    dashboardStore.fetchDashboard().catch(console.error)
})

const dashboard = computed(() => dashboardStore.state.dashboard || {})
const latest = computed(() => dashboard.value.latestPositions || [])
const popular = computed(() => dashboard.value.popularPositions || [])
const tags = computed(() => dashboard.value.tags?.items || [])

useSeoMeta({title: 'Career profiles and position-specific CVs'})
</script>

<template>
    <HeroSection/>
    <StatisticsStrip :statistics="dashboard.statistics" :position-count="dashboard.statistics?.totalPositions || 0"/>

    <section class="page-section">
        <div class="container-xl">
            <div class="section-heading">
                <div>
                    <span class="eyebrow">{{ t('home.latestEyebrow') }}</span>
                    <h2>{{ t('home.latestTitle') }}</h2>
                </div>
                <NuxtLink to="/positions" class="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                    {{ t('home.browseAll') }}
                    <BaseIcon name="arrow-right" :size="16"/>
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
                        <div><span class="eyebrow">By activity</span>
                            <h2>Popular positions</h2></div>
                    </div>
                    <PositionTable :positions="popular"/>
                </div>
                <div class="col-lg-4">
                    <div class="surface h-100 p-4">
                        <span class="eyebrow">Technology cloud</span>
                        <h2 class="h4 fw-bold mt-2">Explore by technology</h2>
                        <p class="text-body-secondary small">Open positions related to a technology tag.</p>
                        <div class="d-flex flex-wrap gap-2 mt-4">
                            <NuxtLink
                                v-for="tag in tags.slice(0, 18)"
                                :key="tag.id"
                                :to="{path: '/positions', query: {tag: tag.name}}"
                                class="badge-soft text-decoration-none"
                            >
                                {{ tag.name }}
                            </NuxtLink>
                            <span v-if="!tags.length" class="text-body-secondary small">No tags yet.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
