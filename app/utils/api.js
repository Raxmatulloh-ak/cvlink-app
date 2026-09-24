export function getCollection(response) {
    const data = response?.data ?? response
    if (Array.isArray(data)) return data
    return data?.member || data?.['hydra:member'] || []
}

export function getTotalItems(response, items = []) {
    const data = response?.data ?? response
    return data?.totalItems ?? data?.['hydra:totalItems'] ?? items.length
}

export function getItemId(value) {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    if (typeof value === 'object') return value.id ?? null
    const match = String(value).match(/\/(\d+)$/)
    return match ? Number(match[1]) : Number(value) || null
}

export function iri(resource, id) {
    if (!id) return null
    return `/api/${resource}/${id}`
}

export function apiMessage(error, fallback = 'Request failed.') {
    return error?.response?.data?.detail || error?.response?.data?.message || error?.message || fallback
}
