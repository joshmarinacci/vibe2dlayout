export interface DocumentPowerUpEntry {
    id: string
    version: number
    settings: Record<string, unknown>
}

export interface ShapePowerUpEntry {
    id: string
    version: number
    features: Record<string, Record<string, unknown>>
}
