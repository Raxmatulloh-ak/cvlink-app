<script setup>
import {ref} from 'vue'
import {useTranslate} from '@/composables/useTranslate'

const {t} = useTranslate()
const query = ref('')

const heroCards = [
    {
        id: 1,
        initials: 'AM',
        title: 'Product talent',
        subtitle: 'Ready to grow',
        theme: 'blue',
    },
    {
        id: 2,
        initials: 'SK',
        title: 'Data specialist',
        subtitle: 'Open to work',
        theme: 'green',
    },
    {
        id: 3,
        initials: 'NR',
        title: 'UI engineer',
        subtitle: '4 projects',
        theme: 'orange',
    },
    {
        id: 4,
        initials: 'JL',
        title: 'Cloud engineer',
        subtitle: 'C1 English',
        theme: 'purple',
    },
]

function submit() {
    navigateTo({path: '/positions', query: {q: query.value.trim() || undefined}})
}
</script>

<template>
    <section class="hero">
        <div class="container-xl hero__inner">
            <div class="hero__copy">
                <span class="eyebrow">{{ t('home.eyebrow') }}</span>
                <h1>{{ t('home.title') }} <span>{{ t('home.titleAccent') }}</span></h1>
                <p class="hero__lead">{{ t('home.lead') }}</p>

                <form class="hero-search" @submit.prevent="submit">
                    <label class="hero-search__field">
                        <BaseIcon name="search" :size="20"/>
                        <span class="visually-hidden">Search positions</span>
                        <input v-model="query" :placeholder="t('home.searchPlaceholder')">
                    </label>
                    <button type="submit" class="btn btn-primary">{{ t('home.searchButton') }}</button>
                </form>

                <div class="hero__checks" aria-label="CVLink benefits">
                    <span><i class="hero__check-icon"><BaseIcon name="check" :size="11"/></i>{{ t('home.reusable') }}</span>
                    <span><i class="hero__check-icon"><BaseIcon name="check" :size="11"/></i>{{ t('home.current') }}</span>
                    <span><i class="hero__check-icon"><BaseIcon name="check" :size="11"/></i>{{ t('home.structured') }}</span>
                </div>
            </div>

            <div class="hero-visual" aria-hidden="true">
                <div class="hero-visual__frame"></div>
                <div class="hero-visual__dots"></div>

                <div class="hero-cards-scene">
                    <div class="hero-match-badge surface--shadow">
                        <span>Profile match</span>
                        <strong>94%</strong>
                    </div>

                    <article
                        v-for="card in heroCards"
                        :key="card.id"
                        class="hero-profile-card"
                        :class="[
                            `hero-profile-card--${card.theme}`,
                            `hero-profile-card--slot-${card.id}`,
                        ]"
                    >
                        <div class="hero-profile-card__avatar">{{ card.initials }}</div>
                        <div class="hero-profile-card__content">
                            <h3>{{ card.title }}</h3>
                            <p>{{ card.subtitle }}</p>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    </section>
</template>
