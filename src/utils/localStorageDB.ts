import type { VibeDocument } from '@model/document'
import { toJSON, fromJSON } from './serialization'
import { generateId } from './idgen'

const INDEX_KEY = 'vibe2d:index'
const docKey = (id: string) => `vibe2d:doc:${id}`

export interface StoredDocEntry {
  id: string
  name: string
  savedAt: number
}

export function getIndex(): StoredDocEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredDocEntry[]
  } catch {
    return []
  }
}

function setIndex(entries: StoredDocEntry[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries))
}

export function saveDoc(id: string | null, name: string, doc: VibeDocument): StoredDocEntry {
  const resolvedId = id ?? generateId()
  const savedAt = Date.now()
  const entry: StoredDocEntry = { id: resolvedId, name, savedAt }
  const docJson = toJSON(doc)
  try {
    localStorage.setItem(docKey(resolvedId), JSON.stringify({ id: resolvedId, name, savedAt, docJson }))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('Storage full — free up space by deleting old documents.')
    }
    throw err
  }
  const index = getIndex().filter(e => e.id !== resolvedId)
  index.unshift(entry)
  setIndex(index)
  return entry
}

export function loadDoc(id: string): { entry: StoredDocEntry; document: VibeDocument } | null {
  try {
    const raw = localStorage.getItem(docKey(id))
    if (!raw) return null
    const stored = JSON.parse(raw) as { id: string; name: string; savedAt: number; docJson: string }
    const document = fromJSON(stored.docJson)
    return { entry: { id: stored.id, name: stored.name, savedAt: stored.savedAt }, document }
  } catch {
    return null
  }
}

export function deleteDoc(id: string): void {
  localStorage.removeItem(docKey(id))
  setIndex(getIndex().filter(e => e.id !== id))
}
