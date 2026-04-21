export interface ParsedPalette {
  name: string
  colors: Array<{ name: string; hex: string }>
}

export function normalizeHex(raw: string): string | null {
  const stripped = raw.startsWith('#') ? raw.slice(1) : raw
  const lower = stripped.toLowerCase()
  if (!/^[0-9a-f]{6}$/.test(lower)) return null
  return '#' + lower
}

export function parseHexFile(text: string): string[] {
  const results: string[] = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//') || line.startsWith(';')) continue
    const hex = normalizeHex(line)
    if (hex) results.push(hex)
  }
  return results
}

export function parseGPL(text: string): ParsedPalette | null {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== 'GIMP Palette') return null

  let name = 'Imported Palette'
  const colors: Array<{ name: string; hex: string }> = []
  let inHeader = true

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    if (inHeader) {
      if (line.startsWith('Name:')) {
        name = line.slice(5).trim() || name
        continue
      }
      // Once we hit a line that starts with a digit, we're in the color data section
      if (/^\d/.test(line)) {
        inHeader = false
      } else {
        continue
      }
    }

    // Data line: R G B [Name...]
    const parts = line.split(/\s+/)
    if (parts.length < 3) continue
    const r = parseInt(parts[0], 10)
    const g = parseInt(parts[1], 10)
    const b = parseInt(parts[2], 10)
    if (isNaN(r) || isNaN(g) || isNaN(b)) continue
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) continue

    const hex = normalizeHex(
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0'),
    )
    if (!hex) continue

    const colorName = parts.slice(3).join(' ').trim() || hex
    colors.push({ name: colorName, hex })
  }

  return { name, colors }
}

export function parseCoolorsUrl(url: string): string[] | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.hostname !== 'coolors.co') return null

  let path = parsed.pathname
  if (path.startsWith('/palette')) {
    path = path.slice('/palette'.length)
  }
  // Strip leading slash
  path = path.replace(/^\//, '')

  const tokens = path.split('-')
  const colors: string[] = []
  for (const token of tokens) {
    const hex = normalizeHex(token)
    if (hex) colors.push(hex)
  }
  return colors.length > 0 ? colors : null
}

export async function fetchLospecPalette(url: string): Promise<ParsedPalette> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.hostname !== 'lospec.com') {
    throw new Error('Not a lospec.com URL')
  }

  // Extract slug: last path segment, strip .json if present
  const slug = parsed.pathname.split('/').filter(Boolean).pop()?.replace(/\.json$/, '')
  if (!slug) throw new Error('Could not extract palette slug from URL')

  const apiUrl = `https://lospec.com/palette-list/${slug}.json`
  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Lospec fetch failed: ${response.status}`)
  }

  const data = await response.json() as { name: string; colors: string[] }
  const colors = data.colors
    .map(c => normalizeHex(c))
    .filter((c): c is string => c !== null)
    .map(hex => ({ name: hex, hex }))

  return { name: data.name, colors }
}
