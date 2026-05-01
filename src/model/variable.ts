import type {Shape} from './shapes'

export type VariableType = 'number' | 'string' | 'boolean' | 'color'

export interface Variable {
    id: string
    name: string
    type: VariableType
    value: number | string | boolean   // color is stored as a hex string e.g. '#ff0000'
}

// ─── Resolution ──────────────────────────────────────────────────────────────

/**
 * Set a value at a dot-separated path on a plain object, returning a shallow clone.
 * Handles up to two levels of nesting (e.g. 'fill.color', 'transform.x', 'cornerRadius').
 */
function setNestedPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
    const dot = path.indexOf('.')
    if (dot === -1) {
        return {...obj, [path]: value}
    }
    const key = path.slice(0, dot)
    const rest = path.slice(dot + 1)
    const nested = obj[key] as Record<string, unknown> | undefined
    return {
        ...obj,
        [key]: {...(nested ?? {}), [rest]: value},
    }
}

/**
 * Resolve all variable bindings on a shape at render time.
 * Returns the original shape object unchanged when there are no bindings (no allocation).
 */
export function resolveVariableBindings(shape: Shape, variables: Variable[]): Shape {
    const bindings = (shape as unknown as {
        variableBindings?: Record<string, string>
    }).variableBindings
    if (!bindings || Object.keys(bindings).length === 0) return shape

    let result = shape as unknown as Record<string, unknown>
    let changed = false

    for (const [path, variableId] of Object.entries(bindings)) {
        const variable = variables.find(v => v.id === variableId)
        if (!variable) continue

        const newResult = setNestedPath(result, path, variable.value)
        result = newResult
        changed = true
    }

    return changed ? result as unknown as Shape : shape
}
