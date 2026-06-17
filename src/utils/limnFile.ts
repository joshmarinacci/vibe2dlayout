import type {VibeDocument} from '@model/document'
import {fromJSON, toJSON} from '@utils/serialization'
import {extractTextChunk, injectTextChunk} from '@utils/pngMeta'

const LIMN_CHUNK_KEYWORD = 'LimnDocument'

// UTF-8 → base64, chunked to avoid stack-overflow on large documents
function uint8ToBase64(bytes: Uint8Array): string {
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK)
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
    return btoa(binary)
}

/**
 * Embeds a serialized VibeDocument into the metadata of a PNG thumbnail.
 * The result is a valid PNG file that also carries the full document JSON.
 */
export function encodeLimnPng(thumbnailPngBytes: Uint8Array, doc: VibeDocument): Uint8Array {
    const json = toJSON(doc)
    const base64 = uint8ToBase64(new TextEncoder().encode(json))
    return injectTextChunk(thumbnailPngBytes, LIMN_CHUNK_KEYWORD, base64)
}

/**
 * Extracts and parses a VibeDocument from a .limn PNG file.
 * Runs the full fromJSON migration pipeline, so older document versions are upgraded.
 * Throws if the file is not a valid PNG or has no LimnDocument metadata.
 */
export function decodeLimnPng(pngBytes: Uint8Array): VibeDocument {
    const base64 = extractTextChunk(pngBytes, LIMN_CHUNK_KEYWORD)
    if (base64 === null) throw new Error('Not a Limn file: no LimnDocument metadata found')
    const jsonBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    return fromJSON(new TextDecoder().decode(jsonBytes))
}

/**
 * Triggers a browser download of the given PNG bytes as a .limn file.
 */
export function downloadLimnFile(pngBytes: Uint8Array, filename = 'document.limn.png'): void {
    // Use octet-stream so browsers don't rename the file to .png based on MIME type
    const blob = new Blob([pngBytes], {type: 'application/octet-stream'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Opens a browser file picker for .limn files and returns the decoded document and raw bytes.
 */
export function uploadLimnFile(): Promise<{doc: VibeDocument; bytes: Uint8Array}> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.limn.png,.limn,image/png'
        input.onchange = () => {
            const file = input.files?.[0]
            if (!file) {
                reject(new Error('No file selected'))
                return
            }
            const reader = new FileReader()
            reader.onload = () => {
                const bytes = new Uint8Array(reader.result as ArrayBuffer)
                try {
                    const doc = decodeLimnPng(bytes)
                    resolve({doc, bytes})
                } catch (err) {
                    reject(err)
                }
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsArrayBuffer(file)
        }
        input.click()
    })
}
