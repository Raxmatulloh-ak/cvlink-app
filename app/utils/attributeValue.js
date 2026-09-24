import {getItemId, iri} from '@/utils/api'
import {ATTRIBUTE_VALUE_TYPE} from '@/constants/domain'

export function scalarFromAttributeValue(definition, value) {
    if (!value) return definition.valueType === ATTRIBUTE_VALUE_TYPE.period ? {start: '', end: ''} : null

    switch (definition.valueType) {
        case ATTRIBUTE_VALUE_TYPE.numeric:
            return value.numericValue
        case ATTRIBUTE_VALUE_TYPE.date:
            return value.dateValue?.slice?.(0, 10) || value.dateValue || ''
        case ATTRIBUTE_VALUE_TYPE.period:
            return {
                start: value.periodStart?.slice?.(0, 10) || value.periodStart || '',
                end: value.periodEnd?.slice?.(0, 10) || value.periodEnd || '',
            }
        case ATTRIBUTE_VALUE_TYPE.boolean:
            return value.booleanValue
        case ATTRIBUTE_VALUE_TYPE.dropdown:
            return getItemId(value.option)
        case ATTRIBUTE_VALUE_TYPE.image:
            return value.imageReference
        default:
            return value.textValue
    }
}

export function attributeValuePayload({definition, scalar, ownerId, current = null}) {
    const payload = {
        owner: iri('users', ownerId),
        attribute: iri('attribute_definitions', definition.id),
        textValue: null,
        imageReference: null,
        numericValue: null,
        dateValue: null,
        periodStart: null,
        periodEnd: null,
        booleanValue: null,
        option: null,
        ...(current?.version ? {version: current.version} : {}),
    }

    switch (definition.valueType) {
        case ATTRIBUTE_VALUE_TYPE.numeric:
            payload.numericValue = scalar === '' || scalar === null ? null : Number(scalar)
            break
        case ATTRIBUTE_VALUE_TYPE.date:
            payload.dateValue = scalar || null
            break
        case ATTRIBUTE_VALUE_TYPE.period:
            payload.periodStart = scalar?.start || null
            payload.periodEnd = scalar?.end || null
            break
        case ATTRIBUTE_VALUE_TYPE.boolean:
            payload.booleanValue = scalar === null || scalar === undefined ? null : Boolean(scalar)
            break
        case ATTRIBUTE_VALUE_TYPE.dropdown:
            payload.option = scalar ? iri('attribute_options', scalar) : null
            break
        case ATTRIBUTE_VALUE_TYPE.image:
            payload.imageReference = scalar || null
            break
        default:
            payload.textValue = scalar || null
    }

    return payload
}

export function isAttributeScalarEmpty(definition, scalar) {
    if (definition.valueType === ATTRIBUTE_VALUE_TYPE.boolean) return scalar === null || scalar === undefined
    if (definition.valueType === ATTRIBUTE_VALUE_TYPE.period) return !scalar?.start || !scalar?.end
    return scalar === null || scalar === undefined || scalar === ''
}
