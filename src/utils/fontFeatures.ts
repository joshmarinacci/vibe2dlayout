import type {FontAxis} from '@model/document'
import opentype from 'opentype.js'
import decompressWoff2 from 'woff2-encoder/decompress'

type GoogleAxisRegistryEntry = {
    tag: string
    name: string
    min: number
    max: number
    default: number
    precision: number
}

type GoogleAxisSpecifier = {
    tag: string
    point?: number
    range?: { min: number; max: number }
}

type GoogleFontCssResult = {
    css: string
    requestedAxes: FontAxis[]
}

type GoogleFontMetadata = {
    family?: string
    axes?: Array<{
        tag: string
        min: number
        max: number
        defaultValue: number
    }>
}

const GOOGLE_AXIS_REGISTRY: GoogleAxisRegistryEntry[] = [
    {tag: 'ARRR', name: 'AR Retinal Resolution', min: 10, max: 60, default: 10, precision: 0},
    {tag: 'BLED', name: 'Bleed', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'BNCE', name: 'Bounce', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'CASL', name: 'Casual', min: 0, max: 1, default: 0, precision: -2},
    {tag: 'CRSV', name: 'Cursive', min: 0, max: 1, default: 0.5, precision: -1},
    {tag: 'CTRS', name: 'Contrast', min: -100, max: 100, default: 0, precision: 1},
    {tag: 'EDPT', name: 'Extrusion Depth', min: 0, max: 1000, default: 100, precision: 0},
    {tag: 'EHLT', name: 'Edge Highlight', min: 0, max: 1000, default: 12, precision: 0},
    {tag: 'ELGR', name: 'Element Grid', min: 1, max: 2, default: 1, precision: -1},
    {tag: 'ELSH', name: 'Element Shape', min: 0, max: 100, default: 0, precision: -1},
    {tag: 'ELXP', name: 'Element Expansion', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'FILL', name: 'Fill', min: 0, max: 1, default: 0, precision: -2},
    {tag: 'FLAR', name: 'Flare', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'GRAD', name: 'Grade', min: -1000, max: 1000, default: 0, precision: 0},
    {tag: 'HEXP', name: 'Hyper Expansion', min: 0, max: 100, default: 0, precision: -1},
    {tag: 'INFM', name: 'Informality', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'ital', name: 'Italic', min: 0, max: 1, default: 0, precision: 0},
    {tag: 'MONO', name: 'Monospace', min: 0, max: 1, default: 0, precision: -2},
    {tag: 'MORF', name: 'Morph', min: 0, max: 60, default: 0, precision: 0},
    {tag: 'opsz', name: 'Optical Size', min: 5, max: 1200, default: 14, precision: -1},
    {tag: 'ROND', name: 'Roundness', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'SCAN', name: 'Scanlines', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'SHLN', name: 'Shadow Length', min: 0, max: 100, default: 50, precision: -1},
    {tag: 'SHRP', name: 'Sharpness', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'slnt', name: 'Slant', min: -90, max: 90, default: 0, precision: 0},
    {tag: 'SOFT', name: 'Softness', min: 0, max: 100, default: 0, precision: -1},
    {tag: 'SPAC', name: 'Spacing', min: -100, max: 100, default: 0, precision: -1},
    {tag: 'SZP1', name: 'Size of Paint 1', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'SZP2', name: 'Size of Paint 2', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'VOLM', name: 'Volume', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'wdth', name: 'Width', min: 25, max: 200, default: 100, precision: -1},
    {tag: 'wght', name: 'Weight', min: 1, max: 1000, default: 400, precision: 0},
    {tag: 'WONK', name: 'Wonky', min: 0, max: 1, default: 0, precision: 0},
    {tag: 'XELA', name: 'Horizontal Element Alignment', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'XOPQ', name: 'Thick Stroke', min: -1000, max: 2000, default: 88, precision: 0},
    {tag: 'XPN1', name: 'Horizontal Position of Paint 1', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'XPN2', name: 'Horizontal Position of Paint 2', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'XROT', name: 'Rotation in X', min: -180, max: 180, default: 0, precision: 0},
    {tag: 'XTFI', name: 'X transparent figures', min: -1000, max: 2000, default: 400, precision: 0},
    {tag: 'XTRA', name: 'Counter Width', min: -1000, max: 2000, default: 400, precision: 0},
    {tag: 'YEAR', name: 'Year', min: -4000, max: 4000, default: 2000, precision: 0},
    {tag: 'YELA', name: 'Vertical Element Alignment', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'YEXT', name: 'Vertical Extension', min: 0, max: 100, default: 0, precision: 0},
    {tag: 'YOPQ', name: 'Thin Stroke', min: -1000, max: 2000, default: 116, precision: 0},
    {tag: 'YPN1', name: 'Vertical Position of Paint 1', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'YPN2', name: 'Vertical Position of Paint 2', min: -100, max: 100, default: 0, precision: 0},
    {tag: 'YROT', name: 'Rotation in Y', min: -180, max: 180, default: 0, precision: 0},
    {tag: 'YTAS', name: 'Ascender Height', min: 0, max: 1000, default: 750, precision: 0},
    {tag: 'YTDE', name: 'Descender Depth', min: -1000, max: 0, default: -250, precision: 0},
    {tag: 'YTFI', name: 'Figure Height', min: -1000, max: 2000, default: 600, precision: 0},
    {tag: 'YTLC', name: 'Lowercase Height', min: 0, max: 1000, default: 500, precision: 0},
    {tag: 'YTUC', name: 'Uppercase Height', min: 0, max: 1000, default: 725, precision: 0},
    {tag: 'ZROT', name: 'Rotation in Z', min: -180, max: 180, default: 0, precision: 0},
]

const GOOGLE_AXIS_REGISTRY_BY_TAG = Object.fromEntries(
    GOOGLE_AXIS_REGISTRY.map(entry => [entry.tag, entry]),
) as Record<string, GoogleAxisRegistryEntry>

const GOOGLE_STANDARD_AXIS_TAGS = ['ital', 'opsz', 'slnt', 'wdth', 'wght'] as const
const GOOGLE_STANDARD_AXIS_TAG_SET = new Set<string>(GOOGLE_STANDARD_AXIS_TAGS)
const GOOGLE_CUSTOM_AXIS_REGISTRY = GOOGLE_AXIS_REGISTRY.filter(
    entry => !GOOGLE_STANDARD_AXIS_TAG_SET.has(entry.tag),
)

// Cache results: true = has smcp, false = no smcp, null = detection failed (WOFF2 / network error)
const smcpCache = new Map<string, boolean | null>()

// Cache results: FontAxis[] (may be empty for static fonts), or null (network error)
const axisCache = new Map<string, FontAxis[] | null>()

/**
 * Checks whether the named font has a true OpenType small-caps (smcp) feature.
 * Works by fetching Google Fonts CSS, extracting a parseable font URL
 * (TTF/WOFF1), then reading the GSUB feature list with opentype.js.
 *
 * Returns null if detection is impossible (e.g. only WOFF2 is available,
 * or the font isn't available from Google Fonts).
 * In that case the UI should not show a "not supported" warning.
 */
export async function detectSmallCaps(fontFamily: string): Promise<boolean | null> {
    const name = fontFamily.split(',')[0].trim()
    if (smcpCache.has(name)) return smcpCache.get(name)!

    try {
        const url = await resolveFontUrl(name)
        if (!url) {
            smcpCache.set(name, null)
            return null
        }

        const resp = await fetch(url)
        if (!resp.ok) {
            smcpCache.set(name, null)
            return null
        }

        const buf = await resp.arrayBuffer()
        const font = opentype.parse(buf)
        const gsub = (font as unknown as {
            tables: { gsub?: { featureList?: { featureRecords: { tag: string }[] } } }
        }).tables.gsub
        const result = gsub?.featureList?.featureRecords.some(f => f.tag === 'smcp') ?? false
        smcpCache.set(name, result)
        return result
    } catch {
        smcpCache.set(name, null)
        return null
    }
}

/**
 * Detects variable font axes for a Google Font.
 *
 * Uses browser-safe Google Fonts CSS probing to discover the supported design
 * space, then parses the resulting font file (including WOFF2) so we can read
 * the `fvar` table directly. Falls back to CSS descriptor inspection if that
 * parsing path fails.
 *
 * Returns an empty array for static fonts, an array of axes for variable fonts,
 * or null on network failure.
 */
export async function detectVariableAxes(fontFamily: string): Promise<FontAxis[] | null> {
    const name = fontFamily.split(',')[0].trim()
    if (axisCache.has(name)) return axisCache.get(name)!

    try {
        const parsedAxes = await detectVariableAxesFromFontFile(name)
        if (parsedAxes) {
            axisCache.set(name, parsedAxes)
            return parsedAxes
        }

        const cssResult = await fetchGoogleFontCss(name)
        if (cssResult === null) {
            axisCache.set(name, null)
            return null
        }

        const axes = detectVariableAxesFromCss(cssResult)
        axisCache.set(name, axes)
        return axes
    } catch {
        axisCache.set(name, null)
        return null
    }
}

/**
 * Builds the Google Fonts stylesheet URL used to load the family into the page.
 * For variable fonts we request the full design space so the browser can use the
 * exposed axes in `font-variation-settings`.
 */
export function buildGoogleFontHref(font: { name: string; isVariable: boolean | null; axes: FontAxis[] }): string {
    const encoded = font.name.trim().replace(/ /g, '+')
    const axes = [...(font.axes ?? [])]
        .filter(axis => isFinite(axis.min) && isFinite(axis.max))
        .sort((a, b) => compareGoogleAxisTags(a.tag, b.tag))

    if (font.isVariable !== true || axes.length === 0) {
        return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`
    }

    const axisTags = axes.map(axis => axis.tag).join(',')
    const italAxis = axes.find(axis => axis.tag === 'ital')

    if (!italAxis) {
        const tuple = axes.map(axis => formatAxisRange(axis.min, axis.max)).join(',')
        return `https://fonts.googleapis.com/css2?family=${encoded}:${axisTags}@${tuple}&display=swap`
    }

    const italicValues = getItalicAxisValues(italAxis)
    if (italicValues.length === 0) {
        return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`
    }

    const tuples = italicValues.map(ital =>
        axes.map(axis => axis.tag === 'ital' ? formatAxisNumber(ital) : formatAxisRange(axis.min, axis.max)).join(','),
    )

    return `https://fonts.googleapis.com/css2?family=${encoded}:${axisTags}@${tuples.join(';')}&display=swap`
}

/**
 * Google serves variable webfonts based on the requested design-space query.
 * We discover supported axes via point probes, use range probes for the
 * registered CSS axes, then fetch a full variable font file and read its fvar.
 */
async function detectVariableAxesFromFontFile(fontName: string): Promise<FontAxis[] | null> {
    const cssResult = await fetchGoogleFontCss(fontName)
    const standardAxes = cssResult ? detectVariableAxesFromCss(cssResult) : []
    const supportedCustomAxes = await discoverSupportedCustomAxes(fontName, standardAxes)
    if (standardAxes.length === 0 && supportedCustomAxes.length === 0) return null

    const parsedAxes = await detectVariableAxesFromFullAxisRequest(fontName, standardAxes, supportedCustomAxes)

    return dedupeAxes([
        ...standardAxes,
        ...(parsedAxes ?? []),
    ])
}

async function discoverSupportedCustomAxes(fontName: string, standardAxes: FontAxis[]): Promise<GoogleAxisRegistryEntry[]> {
    const baseAxes = standardAxes
        .filter(axis => axis.tag !== 'ital')
        .map(axis => pointAxisSpecifier(axis.tag, axis.default))

    return filterTruthy(await mapWithConcurrency(GOOGLE_CUSTOM_AXIS_REGISTRY, 8, async axis => {
        const isSupported = await isGoogleAxisValueSupported(fontName, axis, axis.default, baseAxes)
        return isSupported ? axis : null
    }))
}

async function detectVariableAxesFromFullAxisRequest(
    fontName: string,
    standardAxes: FontAxis[],
    customAxes: GoogleAxisRegistryEntry[],
): Promise<FontAxis[] | null> {
    const specs: GoogleAxisSpecifier[] = [
        ...standardAxes
            .filter(axis => axis.tag !== 'ital')
            .map(axis => rangeAxisSpecifier(axis.tag, axis.min, axis.max)),
        ...customAxes.map(axis => pointAxisSpecifier(axis.tag, nonDefaultAxisProbeValue(axis))),
    ]

    if (specs.length === 0) return null

    const css = await fetchGoogleFontCssForSpecs(fontName, specs)
    if (!css) return null

    const url = resolvePreferredFontUrlFromCss(css)
    if (!url) return null

    const resp = await fetch(url)
    if (!resp.ok) return null

    return parseVariableAxesFromBuffer(await resp.arrayBuffer())
}

async function isGoogleAxisValueSupported(
    fontName: string,
    axis: GoogleAxisRegistryEntry,
    value: number,
    companions: GoogleAxisSpecifier[],
): Promise<boolean> {
    const css = await fetchGoogleFontCssForSpecs(
        fontName,
        [...companions, pointAxisSpecifier(axis.tag, value)],
    )
    return css !== null
}

/**
 * Fetches Google Fonts CSS with standard registered-axis requests.
 * This gives us browser-safe variable signals even when we still need to parse
 * a separate font file to recover custom axes.
 */
async function fetchGoogleFontCss(fontName: string): Promise<GoogleFontCssResult | null> {
    const requests: Array<{ specs: GoogleAxisSpecifier[]; requestedAxes: FontAxis[] }> = [
        {
            specs: [
                rangeAxisSpecifier('opsz', 8, 144),
                rangeAxisSpecifier('slnt', -10, 0),
                rangeAxisSpecifier('wdth', 25, 151),
                rangeAxisSpecifier('wght', 100, 1000),
            ],
            requestedAxes: [
                {tag: 'opsz', name: GOOGLE_AXIS_REGISTRY_BY_TAG.opsz.name, min: 8, max: 144, default: 14},
                {tag: 'slnt', name: GOOGLE_AXIS_REGISTRY_BY_TAG.slnt.name, min: -10, max: 0, default: 0},
                {tag: 'wdth', name: GOOGLE_AXIS_REGISTRY_BY_TAG.wdth.name, min: 25, max: 151, default: 100},
                {tag: 'wght', name: GOOGLE_AXIS_REGISTRY_BY_TAG.wght.name, min: 100, max: 1000, default: 400},
            ],
        },
        {
            specs: [
                rangeAxisSpecifier('opsz', 14, 32),
                rangeAxisSpecifier('wght', 100, 1000),
            ],
            requestedAxes: [
                {tag: 'opsz', name: GOOGLE_AXIS_REGISTRY_BY_TAG.opsz.name, min: 14, max: 32, default: 14},
                {tag: 'wght', name: GOOGLE_AXIS_REGISTRY_BY_TAG.wght.name, min: 100, max: 1000, default: 400},
            ],
        },
        {
            specs: [rangeAxisSpecifier('wght', 100, 1000)],
            requestedAxes: [
                {tag: 'wght', name: GOOGLE_AXIS_REGISTRY_BY_TAG.wght.name, min: 100, max: 1000, default: 400},
            ],
        },
    ]

    for (const request of requests) {
        const css = await fetchGoogleFontCssForSpecs(fontName, request.specs)
        if (css) return {css, requestedAxes: request.requestedAxes}
    }

    return null
}

async function fetchGoogleFontCssForSpecs(fontName: string, specs: GoogleAxisSpecifier[]): Promise<string | null> {
    if (specs.length === 0) return null

    const href = buildGoogleAxisHref(fontName, specs)
    try {
        const resp = await fetch(href)
        if (!resp.ok) return null
        const css = await resp.text()
        return css.includes('@font-face') ? css : null
    } catch {
        return null
    }
}

function buildGoogleAxisHref(fontName: string, specs: GoogleAxisSpecifier[]): string {
    const encoded = fontName.trim().replace(/ /g, '+')
    const sorted = [...specs].sort((a, b) => compareGoogleAxisTags(a.tag, b.tag))
    const axisTags = sorted.map(spec => spec.tag).join(',')
    const tuple = sorted.map(spec => {
        if (spec.range) return formatAxisRange(spec.range.min, spec.range.max)
        return formatAxisNumber(spec.point ?? 0)
    }).join(',')
    return `https://fonts.googleapis.com/css2?family=${encoded}:${axisTags}@${tuple}&display=swap`
}

export function parseGoogleFontMetadata(raw: string): GoogleFontMetadata | null {
    const trimmed = raw.replace(/^\)\]\}'\s*/, '')
    try {
        return JSON.parse(trimmed) as GoogleFontMetadata
    } catch {
        return null
    }
}

async function parseVariableAxesFromBuffer(buffer: ArrayBuffer): Promise<FontAxis[] | null> {
    const data = new DataView(buffer)
    const signature = getTag(data, 0)
    if (signature === 'wOF2') {
        return parseWoff2VariableAxes(buffer)
    }

    return parseSfntVariableAxes(buffer)
}

function parseSfntVariableAxes(buffer: ArrayBuffer): FontAxis[] | null {
    try {
        const font = opentype.parse(buffer) as unknown as {
            tables?: {
                fvar?: {
                    axes?: Array<{
                        tag: string
                        name?: Record<string, string>
                        minValue: number
                        defaultValue: number
                        maxValue: number
                    }>
                }
            }
        }
        const axes = font.tables?.fvar?.axes
        if (!axes) return []
        return axes.map(axis => ({
            tag: axis.tag,
            name: pickLocalizedName(axis.name) ?? GOOGLE_AXIS_REGISTRY_BY_TAG[axis.tag]?.name,
            min: axis.minValue,
            max: axis.maxValue,
            default: axis.defaultValue,
        }))
    } catch {
        return null
    }
}

async function parseWoff2VariableAxes(buffer: ArrayBuffer): Promise<FontAxis[] | null> {
    try {
        const decompressed = await decompressWoff2(buffer)
        return parseSfntVariableAxes(tightlySizedArrayBuffer(decompressed))
    } catch {
        return null
    }
}

function detectVariableAxesFromCss(result: GoogleFontCssResult): FontAxis[] {
    const axes: FontAxis[] = []
    const {css, requestedAxes} = result

    const wghtMatch = css.match(/font-weight:\s*(\d+)\s+(\d+)/)
    if (wghtMatch) {
        axes.push({
            tag: 'wght',
            name: GOOGLE_AXIS_REGISTRY_BY_TAG.wght.name,
            min: Number(wghtMatch[1]),
            max: Number(wghtMatch[2]),
            default: GOOGLE_AXIS_REGISTRY_BY_TAG.wght.default,
        })
    }

    const wdthMatch = css.match(/font-stretch:\s*([\d.]+)%\s+([\d.]+)%/)
    if (wdthMatch) {
        axes.push({
            tag: 'wdth',
            name: GOOGLE_AXIS_REGISTRY_BY_TAG.wdth.name,
            min: Number(wdthMatch[1]),
            max: Number(wdthMatch[2]),
            default: GOOGLE_AXIS_REGISTRY_BY_TAG.wdth.default,
        })
    }

    const slntMatch = css.match(/font-style:\s*oblique\s+([-\d.]+)deg\s+([-\d.]+)deg/)
    if (slntMatch) {
        const cssMin = Number(slntMatch[1])
        const cssMax = Number(slntMatch[2])
        axes.push({
            tag: 'slnt',
            name: GOOGLE_AXIS_REGISTRY_BY_TAG.slnt.name,
            min: -cssMax,
            max: -cssMin,
            default: GOOGLE_AXIS_REGISTRY_BY_TAG.slnt.default,
        })
    }

    const hasItalic0 = /font-style:\s*normal/.test(css)
    const hasItalic1 = /font-style:\s*italic/.test(css)
    if (hasItalic0 && hasItalic1) {
        axes.push({
            tag: 'ital',
            name: GOOGLE_AXIS_REGISTRY_BY_TAG.ital.name,
            min: 0,
            max: 1,
            default: 0,
        })
    }

    const hasExplicitVariableSignal = axes.length > 0
    if (hasExplicitVariableSignal) {
        for (const requestedAxis of requestedAxes) {
            if (!axes.some(axis => axis.tag === requestedAxis.tag)) {
                axes.push(requestedAxis)
            }
        }
    }

    return dedupeAxes(axes)
}

/**
 * Finds a parseable (TTF or WOFF1) font file URL for the given family by
 * fetching Google Fonts CSS directly.
 * Returns null if only WOFF2 is available to the current browser.
 */
async function resolveFontUrl(fontName: string): Promise<string | null> {
    const result = await fetchGoogleFontCss(fontName)
    if (!result) return null

    const sources = extractFontSources(result.css)
    const ttf = sources.find(source => source.format === 'truetype')?.url
    const woff = sources.find(source => source.format === 'woff')?.url
    return ttf ?? woff ?? null
}

function resolvePreferredFontUrlFromCss(css: string): string | null {
    const sources = extractFontSources(css)
    return (
        sources.find(source => source.format === 'woff2')?.url ??
        sources.find(source => source.format === 'truetype')?.url ??
        sources.find(source => source.format === 'woff')?.url ??
        null
    )
}

function extractFontSources(css: string): Array<{ url: string; format: string }> {
    return [...css.matchAll(/url\(([^)]+)\)\s+format\('([^']+)'\)/g)].map(match => ({
        url: match[1].replace(/['"]/g, ''),
        format: match[2],
    }))
}

function dedupeAxes(axes: FontAxis[]): FontAxis[] {
    const byTag = new Map<string, FontAxis>()
    for (const axis of axes) {
        byTag.set(axis.tag, axis)
    }
    return [...byTag.values()].sort((a, b) => compareGoogleAxisTags(a.tag, b.tag))
}

function pointAxisSpecifier(tag: string, point: number): GoogleAxisSpecifier {
    return {tag, point}
}

function rangeAxisSpecifier(tag: string, min: number, max: number): GoogleAxisSpecifier {
    return {tag, range: {min, max}}
}

function compareGoogleAxisTags(left: string, right: string): number {
    const leftCustom = isGoogleCustomAxisTag(left)
    const rightCustom = isGoogleCustomAxisTag(right)
    if (leftCustom !== rightCustom) return leftCustom ? -1 : 1
    return left.localeCompare(right, 'en-US', {sensitivity: 'case', caseFirst: 'upper'})
}

function isGoogleCustomAxisTag(tag: string): boolean {
    return tag !== tag.toLowerCase()
}

function axisPrecisionStep(precision: number): number {
    return 10 ** precision
}

function nonDefaultAxisProbeValue(axis: GoogleAxisRegistryEntry): number {
    const step = axisPrecisionStep(axis.precision)
    const forward = axis.default + step
    if (forward <= axis.max) return forward
    const backward = axis.default - step
    if (backward >= axis.min) return backward
    return axis.default
}

function pickLocalizedName(name?: Record<string, string>): string | undefined {
    if (!name) return undefined
    return name.en ?? name['en-US'] ?? name['en-us'] ?? name.und ?? Object.values(name)[0]
}

function formatAxisNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)))
}

function formatAxisRange(min: number, max: number): string {
    return `${formatAxisNumber(min)}..${formatAxisNumber(max)}`
}

function getItalicAxisValues(axis: FontAxis): number[] {
    const supportsNormal = axis.min <= 0 && axis.max >= 0
    const supportsItalic = axis.min <= 1 && axis.max >= 1
    if (supportsNormal && supportsItalic) return [0, 1]
    if (supportsNormal) return [0]
    if (supportsItalic) return [1]
    return axis.default >= 0.5 ? [1] : [0]
}

function getTag(data: DataView, offset: number): string {
    return String.fromCharCode(
        data.getUint8(offset),
        data.getUint8(offset + 1),
        data.getUint8(offset + 2),
        data.getUint8(offset + 3),
    )
}

function tightlySizedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<R>,
): Promise<R[]> {
    if (items.length === 0) return []
    const results = new Array<R>(items.length)
    let nextIndex = 0

    await Promise.all(Array.from({length: Math.min(concurrency, items.length)}, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex
            nextIndex += 1
            results[index] = await worker(items[index])
        }
    }))

    return results
}

function filterTruthy<T>(items: Array<T | null | undefined>): T[] {
    return items.filter((item): item is T => item != null)
}
