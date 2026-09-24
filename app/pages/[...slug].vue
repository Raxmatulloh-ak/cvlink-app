<script setup>
useSeoMeta({title: 'Page not found'})
</script>

<template>
    <section class="page-section">
        <div class="container-xl text-center py-5">
            <span class="display-1 fw-bold" style="color:var(--cv-soft-2)">404</span>
            <h1 class="h3 fw-bold mt-2">This page is not available</h1>
            <p class="text-body-secondary">The link may be outdated or the page may have moved.</p>
            <NuxtLink to="/" class="btn btn-primary mt-2">Back home</NuxtLink>
        </div>
    </section>
</template>
