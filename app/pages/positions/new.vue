<script setup>
definePageMeta({auth: true, roles: ['ROLE_RECRUITER', 'ROLE_ADMIN']})
useSeoMeta({title: 'Create position'})
</script>

<template>
    <PositionEditor/>
</template>
