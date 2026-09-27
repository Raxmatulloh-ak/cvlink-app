export function getCollection(response) {
    const data = response?.data ?? response

    if (Array.isArray(data)) {
        return data
    }

    return data?.items || data?.member || data?.['hydra:member'] || []
}

export function getItemId(value) {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === 'number') {
        return value
    }

    if (typeof value === 'object') {
        return value.id ?? null
    }

    const match = String(value).match(/\/(\d+)$/)

    return match ? Number(match[1]) : Number(value) || null
}

export function apiMessage(error, fallback = 'Request failed.') {
    return error?.response?.data?.detail || error?.response?.data?.message || error?.message || fallback
}
