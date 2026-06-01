import type {VibeDocument} from '@model/document'

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function toXmlTag(tag: string, value: unknown, indent = 0): string {
    const pad = '  '.repeat(indent)
    if (value === null || value === undefined) {
        return `${pad}<${tag} />`
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return `${pad}<${tag} />`
        }
        const children = value
            .map(item => toXmlTag('item', item, indent + 1))
            .join('\n')
        return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
        if (entries.length === 0) {
            return `${pad}<${tag} />`
        }
        const children = entries
            .map(([key, child]) => toXmlTag(key, child, indent + 1))
            .join('\n')
        return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`
    }

    return `${pad}<${tag}>${escapeXml(String(value))}</${tag}>`
}

export function buildDocumentXml(vibeDocument: VibeDocument): string {
    const body = Object.entries(vibeDocument)
        .map(([key, value]) => toXmlTag(key, value, 1))
        .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<vibeDocument>\n${body}\n</vibeDocument>\n`
}

export function downloadDocumentXml(vibeDocument: VibeDocument, fileName: string): void {
    const xml = buildDocumentXml(vibeDocument)
    const blob = new Blob([xml], {type: 'application/xml'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
