<script setup>
import {computed, ref} from 'vue'
import {useUserStore} from '@/stores/user'
import {useAppStore} from '@/stores/app'
import {apiMessage} from '@/utils/api'

definePageMeta({auth: true, roles: ['ROLE_ADMIN']})

const userStore = useUserStore()
const appStore = useAppStore()
const query = ref('')
const selected = ref([])

await useAsyncData('admin-users', () => userStore.fetchUsers())
useSeoMeta({title: 'Users'})

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    return userStore.state.users.filter((user) => !q || `${user.email} ${(user.roles || []).join(' ')} ${user.status}`.toLowerCase().includes(q))
})

const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every((user) => selected.value.includes(user.id)))

function toggleAll() {
    selected.value = allSelected.value ? [] : filtered.value.map((user) => user.id)
}

async function applyAction(action) {
    if (!selected.value.length) {
        return
    }

    try {
        await userStore.patchUsers({ids: selected.value, action})
        await userStore.fetchUsers()
        selected.value = []
        appStore.notify('Users updated')
    } catch (error) {
        appStore.notify(apiMessage(error, 'Users could not be updated.'), 'error')
    }
}
</script>

<template>
    <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Manage account status and role assignments. Authorization remains enforced by the API."
    />

    <section class="page-section pt-4">
        <div class="container-xl">
            <div class="filters-bar">
                <div class="input-group">
                    <span class="input-group-text bg-transparent border-end-0">
                        <BaseIcon
                            name="search"
                            :size="17"
                        />
                    </span>
                    <input
                        v-model="query"
                        class="form-control border-start-0"
                        placeholder="Search email, role or status">
                </div>
            </div>

            <SelectionToolbar :count="selected.length" @clear="selected = []">
                <button type="button" class="btn btn-sm btn-outline-light" @click="applyAction('BLOCK')">Block</button>
                <button type="button" class="btn btn-sm btn-outline-light" @click="applyAction('UNBLOCK')">Unblock
                </button>
                <button type="button" class="btn btn-sm btn-outline-light" @click="applyAction('MAKE_RECRUITER')">Make
                    recruiter
                </button>
                <button type="button" class="btn btn-sm btn-outline-light" @click="applyAction('REMOVE_RECRUITER')">
                    Remove recruiter
                </button>
                <button type="button" class="btn btn-sm btn-outline-light" @click="applyAction('MAKE_ADMIN')">Make
                    admin
                </button>
                <button type="button" class="btn btn-sm btn-outline-light" @click="applyAction('REMOVE_ADMIN')">Remove
                    admin
                </button>
            </SelectionToolbar>

            <div class="table-shell mt-3">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                        <tr>
                            <th style="width:52px">
                                <input class="form-check-input"
                                       type="checkbox"
                                       :checked="allSelected"
                                       @change="toggleAll"
                                >
                            </th>
                            <th>User</th>
                            <th>Roles</th>
                            <th>Status</th>
                            <th>Locale</th>
                            <th>Theme</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="user in filtered" :key="user.id">
                            <td><input v-model="selected" class="form-check-input" type="checkbox" :value="user.id">
                            </td>
                            <td><strong>{{ user.email }}</strong>
                                <div class="small text-body-secondary">ID {{ user.id }}</div>
                            </td>
                            <td>
                                <div class="d-flex flex-wrap gap-1">
                                    <span v-for="role in user.roles || []" :key="role" class="badge-soft">{{
                                            role.replace('ROLE_', '').toLowerCase()
                                        }}
                                    </span>
                                </div>
                            </td>
                            <td><span class="badge-status"
                                      :class="user.status === 'active' ? 'badge-status--success' : 'badge-status--danger'">{{
                                    user.status || '—'
                                }}</span>
                            </td>
                            <td>{{ user.locale || '—' }}</td>
                            <td>{{ user.theme || '—' }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <EmptyState
                    v-if="filtered.length === 0"
                    icon="users"
                    title="No users found"
                    text="Try another search term."/>
            </div>
        </div>
    </section>
</template>
