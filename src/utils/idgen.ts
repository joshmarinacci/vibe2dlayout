let counter = 0

/** Generate a unique ID. Uses crypto.randomUUID when available, otherwise falls back. */
export function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    return `id-${Date.now()}-${++counter}`
}
