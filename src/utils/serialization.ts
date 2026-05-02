import type {VibeDocument} from '@model/document'
import {DEFAULT_PALETTE} from '@model/palette'

const CURRENT_VERSION = 2

export function toJSON(doc: VibeDocument): string {
    return JSON.stringify({...doc, version: CURRENT_VERSION}, null, 2)
}

export function fromJSON(json: string): VibeDocument {
    let parsed: unknown
    try {
        parsed = JSON.parse(json)
    } catch {
        throw new Error('Invalid JSON')
    }
    if (!isVibeDocument(parsed)) {
        throw new Error('Invalid document format')
    }
    // Migrate v1 → v2: add default palette
    const docObj = parsed as unknown as Record<string, unknown>
    if (docObj.version === 1) {
        docObj.palettes = [{...DEFAULT_PALETTE, colors: [...DEFAULT_PALETTE.colors]}]
        docObj.version = 2
    }
    // Migrate older docs missing pageFolders
    if (!Array.isArray(docObj.pageFolders)) {
        docObj.pageFolders = []
    }
    // Migrate older docs missing variables
    if (!Array.isArray(docObj.variables)) {
        docObj.variables = []
    }
    // Migrate older docs missing images
    if (!Array.isArray(docObj.images)) {
        docObj.images = []
    }
    // Migrate older docs missing pixelAssets
    if (!Array.isArray(docObj.pixelAssets)) {
        docObj.pixelAssets = []
    }
    // Migrate older docs: customFonts was string[], now CustomFont[]
    if (!Array.isArray(docObj.customFonts)) {
        docObj.customFonts = []
    } else {
        docObj.customFonts = (docObj.customFonts as unknown[]).map(f =>
            typeof f === 'string' ? {name: f, metadataVersion: 0, isVariable: null, axes: []} : {
                metadataVersion: 0,
                ...(f as Record<string, unknown>),
            }
        )
    }
    // Migrate older docs missing snapAlignment in gridSettings
    if (typeof docObj.gridSettings === 'object' && docObj.gridSettings !== null) {
        const gs = docObj.gridSettings as Record<string, unknown>
        if (gs.snapAlignment === undefined) gs.snapAlignment = true
    }
    // Migrate older docs: boxShadow was BoxShadow | null, now BoxShadow[]
    if (typeof docObj.shapes === 'object' && docObj.shapes !== null) {
        for (const shape of Object.values(docObj.shapes as Record<string, unknown>)) {
            if (typeof shape !== 'object' || shape === null) continue
            const s = shape as Record<string, unknown>
            if (s.boxShadow === null || s.boxShadow === undefined) {
                s.boxShadow = []
            } else if (!Array.isArray(s.boxShadow)) {
                s.boxShadow = [s.boxShadow]
            }
        }
    }
    return parsed as VibeDocument
}

function isVibeDocument(obj: unknown): obj is VibeDocument {
    if (typeof obj !== 'object' || obj === null) return false
    const doc = obj as Record<string, unknown>
    return (
        typeof doc.version === 'number' &&
        Array.isArray(doc.rootNodes) &&
        typeof doc.shapes === 'object' &&
        doc.shapes !== null
    )
}

export function downloadJSON(doc: VibeDocument, filename = 'document.vibe.json'): void {
    const json = toJSON(doc)
    const blob = new Blob([json], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function uploadJSON(): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,.vibe.json'
        input.onchange = () => {
            const file = input.files?.[0]
            if (!file) {
                reject(new Error('No file selected'))
                return
            }
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        }
        input.click()
    })
}
