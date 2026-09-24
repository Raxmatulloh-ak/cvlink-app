<script setup>
import {useAppStore} from '@/stores/app'

const appStore = useAppStore()
</script>

<template>
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
        <button
            v-for="toast in appStore.state.toasts"
            :key="toast.id"
            type="button"
            class="cv-toast"
            :class="`cv-toast--${toast.type}`"
            @click="appStore.dismissToast(toast.id)"
        >
            <BaseIcon :name="toast.type === 'error' ? 'close' : 'check'" :size="17"/>
            <span>{{ toast.message }}</span>
        </button>
    </div>
</template>
