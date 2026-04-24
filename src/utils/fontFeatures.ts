import opentype from 'opentype.js'
import type { FontAxis } from '@model/document'

// Cache results: true = has smcp, false = no smcp, null = detection failed (WOFF2 / network error)
const smcpCache = new Map<string, boolean | null>()

/**
 * Checks whether the named font has a true OpenType small-caps (smcp) feature.
 * Works by finding the Google Fonts <link> tag injected by useDynamicFonts,
 * fetching the CSS to extract a parseable font URL (TTF/WOFF1), then
 * reading the GSUB feature list with opentype.js.
 *
 * Returns null if detection is impossible (e.g. only WOFF2 is available,
 * or the font isn't a Google Font with a known link tag).
 * In that case the UI should not show a "not supported" warning.
 */
export async function detectSmallCaps(fontFamily: string): Promise<boolean | null> {
  const name = fontFamily.split(',')[0].trim()
  if (smcpCache.has(name)) return smcpCache.get(name)!

  try {
    const url = await resolveFontUrl(name)
    if (!url) { smcpCache.set(name, null); return null }

    const resp = await fetch(url)
    if (!resp.ok) { smcpCache.set(name, null); return null }

    const buf = await resp.arrayBuffer()
    // opentype.js throws on WOFF2 — treat as unknown
    const font = opentype.parse(buf)
    const gsub = (font as unknown as { tables: { gsub?: { featureList?: { featureRecords: { tag: string }[] } } } }).tables.gsub
    const result = gsub?.featureList?.featureRecords.some(f => f.tag === 'smcp') ?? false
    smcpCache.set(name, result)
    return result
  } catch {
    smcpCache.set(name, null)
    return null
  }
}

// Cache results: FontAxis[] (may be empty for static fonts), or null (network error)
const axisCache = new Map<string, FontAxis[] | null>()

/**
 * Detects variable font axes using the Google Fonts CSS2 API.
 * Requests the font with broad axis ranges; if the response contains range-style
 * `font-weight: X Y` values (two numbers), the font is variable.
 *
 * Works reliably in modern browsers (no WOFF2 / opentype.js issues).
 * Returns an empty array for static fonts, an array of axes for variable fonts,
 * or null on network failure.
 */
export async function detectVariableAxes(fontFamily: string): Promise<FontAxis[] | null> {
  const name = fontFamily.split(',')[0].trim()
  if (axisCache.has(name)) return axisCache.get(name)!

  try {
    const encoded = name.replace(/ /g, '+')
    const css = await fetchFontCss(encoded)
    if (css === null) { axisCache.set(name, null); return null }

    const axes: FontAxis[] = []

    // `font-weight: X Y` (two numbers separated by space) → wght axis
    const wghtMatch = css.match(/font-weight:\s*(\d+)\s+(\d+)/)
    if (wghtMatch) {
      axes.push({ tag: 'wght', min: Number(wghtMatch[1]), max: Number(wghtMatch[2]), default: 400 })
    }

    // `font-stretch: X% Y%` → wdth axis
    const wdthMatch = css.match(/font-stretch:\s*([\d.]+)%\s+([\d.]+)%/)
    if (wdthMatch) {
      axes.push({ tag: 'wdth', min: Math.round(Number(wdthMatch[1])), max: Math.round(Number(wdthMatch[2])), default: 100 })
    }

    // `font-style: oblique Xdeg Ydeg` → slnt axis
    const slntMatch = css.match(/font-style:\s*oblique\s+([-\d.]+)deg\s+([-\d.]+)deg/)
    if (slntMatch) {
      axes.push({ tag: 'slnt', min: Number(slntMatch[1]), max: Number(slntMatch[2]), default: 0 })
    }

    axisCache.set(name, axes)
    return axes
  } catch {
    axisCache.set(name, null)
    return null
  }
}

/**
 * Fetches Google Fonts CSS with axis ranges to allow variable font detection.
 * Tries a broad multi-axis request first; falls back to wght-only if the
 * server rejects the unsupported axes (HTTP 400).
 */
async function fetchFontCss(encoded: string): Promise<string | null> {
  // Try broad request first (covers ital, opsz, wdth, wght in one go)
  const broad = `https://fonts.googleapis.com/css2?family=${encoded}:ital,opsz,wdth,wght@0,6..144,25..151,1..1000&display=swap`
  try {
    const r = await fetch(broad)
    if (r.ok) {
      const css = await r.text()
      if (css.includes('@font-face')) return css
    }
  } catch { /* fall through */ }

  // Fallback: just wght range — works for all fonts, even those without other axes
  const simple = `https://fonts.googleapis.com/css2?family=${encoded}:wght@1..1000&display=swap`
  try {
    const r = await fetch(simple)
    if (!r.ok) return null
    const css = await r.text()
    return css.includes('@font-face') ? css : null
  } catch {
    return null
  }
}

/**
 * Finds a parseable (TTF or WOFF1) font file URL for the given family by
 * fetching the Google Fonts CSS that was injected for this font.
 * Returns null if only WOFF2 is available or no link tag exists.
 */
async function resolveFontUrl(fontName: string): Promise<string | null> {
  const encoded = fontName.replace(/ /g, '+')
  const linkId = `gfont-${encoded}`
  const link = document.getElementById(linkId) as HTMLLinkElement | null
  if (!link) return null

  try {
    const cssResp = await fetch(link.href)
    if (!cssResp.ok) return null
    const css = await cssResp.text()

    // Prefer TTF, then WOFF1 — opentype.js cannot parse WOFF2
    const allUrls = [...css.matchAll(/url\(([^)]+)\)\s+format\('([^']+)'\)/g)]
    const ttf  = allUrls.find(m => m[2] === 'truetype')?.[1]?.replace(/['"]/g, '')
    const woff = allUrls.find(m => m[2] === 'woff')?.[1]?.replace(/['"]/g, '')
    return ttf ?? woff ?? null  // null if only woff2 entries exist
  } catch {
    return null
  }
}
