import type { VibeDocument } from '@model/document'

const CURRENT_VERSION = 1

export function toJSON(doc: VibeDocument): string {
  return JSON.stringify({ ...doc, version: CURRENT_VERSION }, null, 2)
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
  return parsed
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
  const blob = new Blob([json], { type: 'application/json' })
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
