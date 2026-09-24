<script setup>
import {useTranslate} from '@/composables/useTranslate'
const {t} = useTranslate()
const steps = [
    {title: 'Build profile', text: 'Keep your master values, projects and personal details in one reusable profile.'},
    {title: 'Choose position', text: 'A position decides which profile attributes and project tags are relevant.'},
    {title: 'Publish CV', text: 'Fill missing values and publish when the position-specific CV is complete.'},
]
</script>

<template>
    <section class="page-section">
        <div class="container-xl">
            <div class="workflow-panel">
                <div class="row g-0">
                    <div class="col-lg-5">
                        <div class="workflow-panel__intro">
                            <span class="eyebrow text-info-emphasis">{{ t('home.workflowEyebrow') }}</span>
                            <h2 class="mt-3 fw-bold">{{ t('home.workflowTitle') }}</h2>
                            <p class="mt-3 mb-0">{{ t('home.workflowLead') }}</p>
                        </div>
                    </div>
                    <div v-for="(step, index) in steps" :key="step.title" class="col-lg">
                        <div class="workflow-step">
                            <span class="workflow-step__number">0{{ index + 1 }}</span>
                            <h3>{{ step.title }}</h3>
                            <p>{{ step.text }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
