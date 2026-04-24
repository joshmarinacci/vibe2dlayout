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

// Cache results: FontAxis[] (may be empty for static fonts), or null (detection failed)
const axisCache = new Map<string, FontAxis[] | null>()

/**
 * Detects variable font axes using the opentype.js fvar table.
 * Returns an empty array for static fonts, a populated array for variable fonts,
 * or null if detection failed (WOFF2-only, network error, or font not loaded).
 * Reuses the same resolveFontUrl infrastructure as detectSmallCaps.
 */
export async function detectVariableAxes(fontFamily: string): Promise<FontAxis[] | null> {
  const name = fontFamily.split(',')[0].trim()
  if (axisCache.has(name)) return axisCache.get(name)!

  try {
    const url = await resolveFontUrl(name)
    if (!url) { axisCache.set(name, null); return null }

    const resp = await fetch(url)
    if (!resp.ok) { axisCache.set(name, null); return null }

    const buf = await resp.arrayBuffer()
    const font = opentype.parse(buf)
    const fvar = (font as unknown as {
      tables: {
        fvar?: {
          axes?: Array<{ tag: string; minValue: number; maxValue: number; defaultValue: number }>
        }
      }
    }).tables.fvar

    const axes: FontAxis[] = (fvar?.axes ?? []).map(a => ({
      tag: a.tag.trim(),
      min: a.minValue,
      max: a.maxValue,
      default: a.defaultValue,
    }))
    axisCache.set(name, axes)
    return axes
  } catch {
    axisCache.set(name, null)
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
