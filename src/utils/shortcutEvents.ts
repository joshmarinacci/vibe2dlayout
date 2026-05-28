type Handler = (keys: string, description: string) => void

const handlers = new Set<Handler>()

export const shortcutEvents = {
    emit(keys: string, description: string) {
        handlers.forEach(h => h(keys, description))
    },
    subscribe(h: Handler): () => void {
        handlers.add(h)
        return () => handlers.delete(h)
    },
}
