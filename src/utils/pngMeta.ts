// CRC32 lookup table — standard ISO 3309 / PNG polynomial
const CRC_TABLE = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
        let c = i
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
        t[i] = c
    }
    return t
})()

function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF
    for (const b of data) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

function validateSignature(pngBytes: Uint8Array): void {
    for (let i = 0; i < 8; i++) {
        if (pngBytes[i] !== PNG_SIGNATURE[i]) throw new Error('Not a valid PNG')
    }
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
}

function writeUint32BE(bytes: Uint8Array, offset: number, value: number): void {
    bytes[offset]     = (value >>> 24) & 0xFF
    bytes[offset + 1] = (value >>> 16) & 0xFF
    bytes[offset + 2] = (value >>> 8) & 0xFF
    bytes[offset + 3] = value & 0xFF
}

function bytesToAscii(bytes: Uint8Array, start: number, end: number): string {
    let s = ''
    for (let i = start; i < end; i++) s += String.fromCharCode(bytes[i])
    return s
}

/**
 * Injects a PNG tEXt metadata chunk with the given keyword and text value.
 * The chunk is inserted immediately before the first IDAT chunk.
 * Throws if pngBytes is not a valid PNG.
 */
export function injectTextChunk(pngBytes: Uint8Array, keyword: string, text: string): Uint8Array {
    validateSignature(pngBytes)

    // Find the offset of the first IDAT chunk
    let pos = 8
    let idatOffset = -1
    while (pos + 12 <= pngBytes.length) {
        const dataLen = readUint32BE(pngBytes, pos)
        const chunkType = bytesToAscii(pngBytes, pos + 4, pos + 8)
        if (chunkType === 'IDAT') {
            idatOffset = pos
            break
        }
        pos += 12 + dataLen
    }
    if (idatOffset < 0) throw new Error('Not a valid PNG: no IDAT chunk found')

    // Build tEXt chunk data: keyword + 0x00 + text (both Latin-1/ASCII)
    const keyBytes = new Uint8Array(keyword.length)
    for (let i = 0; i < keyword.length; i++) keyBytes[i] = keyword.charCodeAt(i) & 0xFF

    const textBytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i++) textBytes[i] = text.charCodeAt(i) & 0xFF

    const chunkData = new Uint8Array(keyBytes.length + 1 + textBytes.length)
    chunkData.set(keyBytes, 0)
    chunkData[keyBytes.length] = 0
    chunkData.set(textBytes, keyBytes.length + 1)

    // Build full chunk: length(4) + type(4) + data + CRC(4)
    const typeBytes = new Uint8Array([116, 69, 88, 116]) // 'tEXt'
    const typeAndData = new Uint8Array(4 + chunkData.length)
    typeAndData.set(typeBytes, 0)
    typeAndData.set(chunkData, 4)

    const crc = crc32(typeAndData)
    const chunk = new Uint8Array(4 + 4 + chunkData.length + 4)
    writeUint32BE(chunk, 0, chunkData.length)
    chunk.set(typeBytes, 4)
    chunk.set(chunkData, 8)
    writeUint32BE(chunk, 8 + chunkData.length, crc)

    // Assemble: original[0..idatOffset] + newChunk + original[idatOffset..]
    const result = new Uint8Array(pngBytes.length + chunk.length)
    result.set(pngBytes.subarray(0, idatOffset), 0)
    result.set(chunk, idatOffset)
    result.set(pngBytes.subarray(idatOffset), idatOffset + chunk.length)
    return result
}

/**
 * Extracts the text value of the first tEXt chunk matching the given keyword.
 * Returns null if no matching chunk is found.
 */
export function extractTextChunk(pngBytes: Uint8Array, keyword: string): string | null {
    validateSignature(pngBytes)

    let pos = 8
    while (pos + 12 <= pngBytes.length) {
        const dataLen = readUint32BE(pngBytes, pos)
        const chunkType = bytesToAscii(pngBytes, pos + 4, pos + 8)
        if (chunkType === 'tEXt') {
            const dataStart = pos + 8
            const dataEnd = dataStart + dataLen
            // Find null separator
            let sep = -1
            for (let i = dataStart; i < dataEnd; i++) {
                if (pngBytes[i] === 0) { sep = i; break }
            }
            if (sep >= 0) {
                const kwLen = sep - dataStart
                if (kwLen === keyword.length) {
                    let match = true
                    for (let i = 0; i < kwLen; i++) {
                        if (pngBytes[dataStart + i] !== keyword.charCodeAt(i)) { match = false; break }
                    }
                    if (match) {
                        let result = ''
                        for (let i = sep + 1; i < dataEnd; i++) result += String.fromCharCode(pngBytes[i])
                        return result
                    }
                }
            }
        }
        pos += 12 + dataLen
    }
    return null
}
