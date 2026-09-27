<script setup>
import MarkdownIt from 'markdown-it'
import {computed} from 'vue'

const props = defineProps({text: {type: String, default: ''}})
const parser = new MarkdownIt({html: false, linkify: true, breaks: true})
const html = computed(() => parser.render(props.text || ''))
</script>

<template>
    <div v-html="html"></div>
</template>
