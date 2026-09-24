<script setup>
definePageMeta({auth: true, roles: ['ROLE_RECRUITER', 'ROLE_ADMIN']})
const route = useRoute()
useSeoMeta({title: 'Edit position'})
</script>

<template>
    <PositionEditor :position-id="route.params.id"/>
</template>
