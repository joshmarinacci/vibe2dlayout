import type {CustomFont, TreeNode, VibeDocument} from '@model/document'
import type {PixelAsset} from '@model/pixelAsset'
import type {BoundingBox} from '@model/transform'
import {buildCSSTransform} from '@model/transform'
import type {
    BoxShadow,
    ButtonShape,
    ChartMockShape,
    CheckboxShape,
    CircleShape,
    DialogShape,
    FillStyle,
    FrameShape,
    GroupShape,
    IconShape,
    ImageMockShape,
    ImageShape,
    LabelShape,
    LineShape,
    ListShape,
    PanelShape,
    PixelImageShape,
    ProgressShape,
    RadioShape,
    RectShape,
    ScrollPanelShape,
    SelectShape,
    Shape,
    SliderShape,
    StepperShape,
    StickyNoteShape,
    StrokeStyle,
    TabbedPanelShape,
    TableShape,
    TextFieldShape,
    TextShape,
    TextStyle,
    ToggleShape,
} from '@model/shapes'
import {strokeColor} from '@model/shapes'
import type {AppState} from '@store/types'
import {arrowMarkerPath, buildConnectorPath, resolveEndpoint} from '@utils/connectors'
import {fillBackground, gradientCSS} from '@utils/fillCSS'
import {buildGoogleFontHref} from '@utils/fontFeatures'
import {exporterLogger} from '@logging'

// ─── CSS string helpers ───────────────────────────────────────────────────

function toKebab(key: string): string {
    return key.replace(/([A-Z])/g, m => '-' + m.toLowerCase())
}

// Properties that take plain numbers without a 'px' unit in CSS
const UNITLESS = new Set([
    'opacity', 'zIndex', 'lineHeight', 'flex', 'flexGrow', 'flexShrink',
    'order', 'strokeOpacity', 'fillOpacity', 'strokeWidth',
])

type StyleValue = string | number | undefined | null

function styleStr(props: Record<string, StyleValue>): string {
    const parts: string[] = []
    for (const [key, val] of Object.entries(props)) {
        if (val === undefined || val === null || val === '') continue
        const cssKey = toKebab(key)
        const cssVal = typeof val === 'number'
            ? (UNITLESS.has(key) ? String(val) : `${val}px`)
            : String(val)
        parts.push(`${cssKey}: ${cssVal}`)
    }
    return parts.join('; ')
}

function sa(props: Record<string, StyleValue>): string {
    const s = styleStr(props)
    return s ? ` style="${s}"` : ''
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Layout / position helpers ────────────────────────────────────────────

function posStyle(t: BoundingBox): Record<string, StyleValue> {
    const cssTransform = buildCSSTransform(t)
    return {
        position: 'absolute',
        left: t.x,
        top: t.y,
        width: t.width,
        height: t.height,
        ...(cssTransform ? {transform: cssTransform, transformOrigin: 'center center'} : {}),
    }
}

function shadowStyle(shape: {boxShadow?: BoxShadow[]}): Record<string, StyleValue> {
    if (!shape.boxShadow?.length) return {}
    return {
        boxShadow: shape.boxShadow
            .map(({offsetX, offsetY, blur, spread, color, inset}) =>
                `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`)
            .join(', '),
    }
}

function fillProps(fill: FillStyle): Record<string, StyleValue> {
    return {background: fillBackground(fill), opacity: fill.opacity}
}

function strokeProps(stroke: StrokeStyle): Record<string, StyleValue> {
    if (stroke.type === 'none') return {border: 'none'}
    if (stroke.type === 'gradient') return {borderWidth: stroke.width, borderStyle: 'solid', borderColor: strokeColor(stroke)}
    const dash = 'dash' in stroke ? stroke.dash : []
    const borderStyle = stroke.type === 'dashed'
        ? (dash?.[0] <= 3 ? 'dotted' : 'dashed')
        : 'solid'
    return {
        borderWidth: stroke.width,
        borderStyle,
        borderColor: strokeColor(stroke),
    }
}

function radiusProps(uniform: number, radii?: {
    topLeft: number; topRight: number; bottomRight: number; bottomLeft: number
} | null): Record<string, StyleValue> {
    if (!radii) return {borderRadius: uniform || 0}
    return {borderRadius: `${radii.topLeft}px ${radii.topRight}px ${radii.bottomRight}px ${radii.bottomLeft}px`}
}

// ─── Text style helpers ───────────────────────────────────────────────────

function vAlignToJustify(v: 'top' | 'middle' | 'bottom'): string {
    if (v === 'top') return 'flex-start'
    if (v === 'bottom') return 'flex-end'
    return 'center'
}

function textBaseProps(text: TextStyle): Record<string, StyleValue> {
    const result: Record<string, StyleValue> = {
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        fontWeight: String(text.fontWeight),
        fontStyle: text.fontStyle,
        textAlign: text.align,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        width: '100%',
    }
    if (!text.textGradient) result.color = text.color
    if (text.textShadow) {
        const {offsetX, offsetY, blur, color} = text.textShadow
        result.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
    }
    if (text.lineHeight != null) result.lineHeight = text.lineHeight
    if (text.letterSpacing != null) result.letterSpacing = `${text.letterSpacing}px`
    if (text.textDecoration && text.textDecoration !== 'none') result.textDecoration = text.textDecoration
    if (text.textTransform && text.textTransform !== 'none') result.textTransform = text.textTransform
    if (text.fontVariantCaps === 'small-caps') result.fontVariantCaps = 'small-caps'
    if (text.fontVariationSettings && Object.keys(text.fontVariationSettings).length > 0) {
        result.fontVariationSettings = Object.entries(text.fontVariationSettings)
            .map(([tag, v]) => `'${tag}' ${v}`)
            .join(', ')
        if ('opsz' in text.fontVariationSettings) result.fontOpticalSizing = 'none'
    }
    if (text.stroke && text.stroke.width > 0 && !text.textStrokeGradient) {
        result.WebkitTextStroke = `${text.stroke.width}px ${text.stroke.color}`
    }
    return result
}

function textContentHtml(text: TextStyle): string {
    const escaped = escHtml(text.content)
    // Fill gradient takes precedence
    if (text.textGradient) {
        const spanStyle = styleStr({
            display: 'inline-block',
            background: gradientCSS(text.textGradient),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        })
        return `<span style="${spanStyle}">${escaped}</span>`
    }
    // Stroke gradient: background-clip shows gradient on stroke outline
    if (text.textStrokeGradient && text.stroke && text.stroke.width > 0) {
        const spanStyle = styleStr({
            display: 'inline-block',
            background: gradientCSS(text.textStrokeGradient),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            WebkitTextStroke: `${text.stroke.width}px transparent`,
            paintOrder: 'stroke fill',
        })
        return `<span style="${spanStyle}">${escaped}</span>`
    }
    return escaped
}

// Renders a text block inside an already-positioned outer div
function textBlockHtml(text: TextStyle): string {
    const vAlignStyle = styleStr({
        position: 'absolute',
        inset: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: vAlignToJustify(text.verticalAlign),
        padding: '4px 8px',
        overflow: 'hidden',
    })
    const textStyle = styleStr(textBaseProps(text))
    return `<div style="${vAlignStyle}"><div style="${textStyle}">${textContentHtml(text)}</div></div>`
}

// ─── Pixel asset → SVG data URL ───────────────────────────────────────────

function pixelAssetToDataUrl(asset: PixelAsset): string {
    const rects: string[] = []
    for (let row = 0; row < asset.height; row++) {
        for (let col = 0; col < asset.width; col++) {
            const i = (row * asset.width + col) * 4
            const [r, g, b, a] = [asset.pixels[i], asset.pixels[i + 1], asset.pixels[i + 2], asset.pixels[i + 3]]
            if (a === 0) continue
            const op = (a / 255).toFixed(3)
            rects.push(`<rect x="${col}" y="${row}" width="1" height="1" fill="rgb(${r},${g},${b})" opacity="${op}"/>`)
        }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${asset.width} ${asset.height}">${rects.join('')}</svg>`
    return `data:image/svg+xml;base64,${btoa(svg)}`
}

// ─── Per-shape renderers ──────────────────────────────────────────────────

function renderRect(shape: RectShape, children: string): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        ...strokeProps(shape.stroke),
        ...radiusProps(shape.cornerRadius, shape.cornerRadii),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
    })}>${children}</div>`
}

function renderCircle(shape: CircleShape, children: string): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        ...strokeProps(shape.stroke),
        ...shadowStyle(shape),
        borderRadius: '50%',
        boxSizing: 'border-box',
    })}>${children}</div>`
}

function renderTextShape(shape: TextShape): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        background: fillBackground(shape.fill),
        opacity: shape.fill.opacity,
        ...shadowStyle(shape),
        overflow: 'hidden',
    })}>${textBlockHtml(shape.text)}</div>`
}

function renderImage(shape: ImageShape): string {
    return `<img src="${shape.src}"${sa({
        ...posStyle(shape.transform),
        opacity: shape.opacity,
        objectFit: shape.preserveAspectRatio ? 'contain' : 'fill',
        display: 'block',
    })}/>`
}

function renderLine(shape: LineShape, shapes: Record<string, Shape>): string {
    const start = resolveEndpoint(shape.start, shapes)
    const end = resolveEndpoint(shape.end, shapes)
    const pad = 20
    const minX = Math.min(start.x, end.x) - pad
    const minY = Math.min(start.y, end.y) - pad
    const svgW = Math.abs(end.x - start.x) + pad * 2
    const svgH = Math.abs(end.y - start.y) + pad * 2
    const localStart = {x: start.x - minX, y: start.y - minY}
    const localEnd = {x: end.x - minX, y: end.y - minY}
    const pathD = buildConnectorPath(localStart, localEnd, shape.route)
    const {stroke} = shape
    const markerId = `arrow-${shape.id}`
    const markerStartId = `arrow-start-${shape.id}`
    const strokeDash = 'dash' in stroke ? stroke.dash : []
    const dashArray = strokeDash?.length ? ` stroke-dasharray="${strokeDash.join(' ')}"` : ''
    const markerEnd = shape.endArrow !== 'none' ? ` marker-end="url(#${markerId})"` : ''
    const markerStart = shape.startArrow !== 'none' ? ` marker-start="url(#${markerStartId})"` : ''
    const defs = (shape.endArrow !== 'none' || shape.startArrow !== 'none') ? `<defs>
${shape.endArrow !== 'none' ? `    <marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="${arrowMarkerPath(shape.endArrow)}" fill="${strokeColor(stroke)}"/></marker>` : ''}
${shape.startArrow !== 'none' ? `    <marker id="${markerStartId}" markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto-start-reverse"><path d="${arrowMarkerPath(shape.startArrow)}" fill="${strokeColor(stroke)}"/></marker>` : ''}
  </defs>` : ''
    return `<svg${sa({
        position: 'absolute',
        left: minX,
        top: minY,
        width: svgW,
        height: svgH,
        overflow: 'visible',
    })}>${defs}
  <path d="${pathD}" fill="none" stroke="${strokeColor(stroke)}" stroke-width="${stroke.width}"${dashArray} stroke-opacity="${stroke.opacity}"${markerEnd}${markerStart}/>
</svg>`
}

function renderGroup(shape: GroupShape, children: string): string {
    const t = shape.transform
    return `<div${sa({
        position: 'absolute',
        left: t.x,
        top: t.y,
        width: t.width,
        height: t.height,
        ...(buildCSSTransform(t) ? {transform: buildCSSTransform(t), transformOrigin: 'center center'} : {}),
    })}>${children}</div>`
}

function renderFrame(shape: FrameShape, children: string): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        ...strokeProps(shape.stroke),
        ...radiusProps(shape.cornerRadius, shape.cornerRadii),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
        overflow: shape.clipChildren ? 'hidden' : 'visible',
    })}>${children}</div>`
}

function renderPanel(shape: PanelShape, children: string): string {
    const {fill, stroke, text, transform} = shape
    const headerStyle = styleStr({
        padding: '6px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        fontWeight: String(text.fontWeight),
        color: text.color,
        borderBottom: `1px solid ${strokeColor(stroke)}`,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    })
    const contentStyle = styleStr({
        position: 'absolute',
        top: '28px',
        left: '0',
        right: '0',
        bottom: '0',
        overflow: shape.clipChildren ? 'hidden' : 'visible',
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        ...radiusProps(shape.cornerRadius, shape.cornerRadii),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
    })}><div style="${headerStyle}">${escHtml(text.content)}</div><div style="${contentStyle}">${children}</div></div>`
}

function renderTabbedPanel(shape: TabbedPanelShape, children: string): string {
    const {fill, stroke, text, transform, activeTab} = shape
    const tabs = text.content.split('\n').filter(t => t.trim())
    const tabsHtml = tabs.map((tab, i) => {
        const isActive = i === activeTab
        const tabStyle = styleStr({
            display: 'inline-block',
            padding: '4px 12px',
            fontFamily: text.fontFamily,
            fontSize: text.fontSize,
            fontWeight: String(text.fontWeight),
            color: isActive ? text.color : `${text.color}99`,
            borderBottom: isActive ? `2px solid ${text.color}` : '2px solid transparent',
            cursor: 'default',
        })
        return `<div style="${tabStyle}">${escHtml(tab)}</div>`
    }).join('')
    const tabBarStyle = styleStr({
        display: 'flex',
        borderBottom: `1px solid ${strokeColor(stroke)}`,
        padding: '0 4px',
    })
    const contentStyle = styleStr({
        position: 'absolute',
        top: '30px',
        left: '0',
        right: '0',
        bottom: '0',
        overflow: shape.clipChildren ? 'hidden' : 'visible',
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        ...radiusProps(shape.cornerRadius, shape.cornerRadii),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
    })}><div style="${tabBarStyle}">${tabsHtml}</div><div style="${contentStyle}">${children}</div></div>`
}

function renderButton(shape: ButtonShape): string {
    const {fill, stroke, text, transform} = shape
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        ...radiusProps(shape.cornerRadius, shape.cornerRadii),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        fontWeight: String(text.fontWeight),
        color: text.color,
        userSelect: 'none',
        cursor: 'default',
    })}>${escHtml(text.content)}</div>`
}

function renderIcon(shape: IconShape): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        ...strokeProps(shape.stroke),
        ...shadowStyle(shape),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.min(shape.transform.width, shape.transform.height) * 0.6,
        color: strokeColor(shape.stroke),
    })}>${escHtml(shape.icon.name)}</div>`
}

function renderLabel(shape: LabelShape): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        overflow: 'hidden',
    })}>${textBlockHtml(shape.text)}</div>`
}

function renderTextField(shape: TextFieldShape): string {
    const {fill, stroke, text, placeholder, transform} = shape
    const displayText = text.content || placeholder
    const isPlaceholder = !text.content
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        boxSizing: 'border-box',
        padding: '4px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: isPlaceholder ? `${text.color}80` : text.color,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    })}>${escHtml(displayText)}</div>`
}

function renderCheckbox(shape: CheckboxShape): string {
    const {fill, stroke, text, checked, transform} = shape
    const boxSize = Math.min(transform.height * 0.6, 16)
    const checkStyle = styleStr({
        width: boxSize,
        height: boxSize,
        minWidth: boxSize,
        borderRadius: '2px',
        border: `1px solid ${strokeColor(stroke)}`,
        background: checked ? strokeColor(stroke) : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: boxSize * 0.7,
        marginRight: '6px',
        flexShrink: '0',
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: text.color,
        overflow: 'hidden',
        boxSizing: 'border-box',
    })}><div style="${checkStyle}">${checked ? '✓' : ''}</div>${escHtml(text.content)}</div>`
}

function renderToggle(shape: ToggleShape): string {
    const {fill, stroke, text, checked, thumbFill, transform} = shape
    const h = Math.min(transform.height * 0.5, 20)
    const w = h * 1.8
    const thumbPos = checked ? `${w - h + 2}px` : '2px'
    const trackStyle = styleStr({
        width: w,
        minWidth: w,
        height: h,
        borderRadius: h / 2,
        background: checked ? fillBackground(stroke as unknown as FillStyle) : '#ccc',
        position: 'relative',
        flexShrink: '0',
        marginRight: '8px',
        display: 'flex',
        alignItems: 'center',
    })
    const thumbStyle = styleStr({
        position: 'absolute',
        left: thumbPos,
        width: h - 4,
        height: h - 4,
        borderRadius: '50%',
        background: fillBackground(thumbFill),
        top: '2px',
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: text.color,
        overflow: 'hidden',
        boxSizing: 'border-box',
    })}><div style="${trackStyle}"><div style="${thumbStyle}"></div></div>${escHtml(text.content)}</div>`
}

function renderRadio(shape: RadioShape): string {
    const {fill, stroke, text, checked, transform} = shape
    const r = Math.min(transform.height * 0.3, 8)
    const circleStyle = styleStr({
        width: r * 2,
        height: r * 2,
        minWidth: r * 2,
        borderRadius: '50%',
        border: `1px solid ${strokeColor(stroke)}`,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '6px',
        flexShrink: '0',
    })
    const dotStyle = checked ? ` style="width: ${r}px; height: ${r}px; border-radius: 50%; background: ${strokeColor(stroke)};"` : ''
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: text.color,
        overflow: 'hidden',
        boxSizing: 'border-box',
    })}><div style="${circleStyle}">${checked ? `<div${dotStyle}></div>` : ''}</div>${escHtml(text.content)}</div>`
}

function renderSelect(shape: SelectShape): string {
    const {fill, stroke, text, value, placeholder, transform} = shape
    const display = value || placeholder
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: value ? text.color : `${text.color}80`,
        overflow: 'hidden',
    })}>${escHtml(display)}<span style="margin-left:4px; opacity:0.5;">▾</span></div>`
}

function renderSlider(shape: SliderShape): string {
    const {fill, stroke, value, thumbFill, transform} = shape
    const thumbPct = value * 100
    const trackStyle = styleStr({
        position: 'absolute',
        left: '8px',
        right: '8px',
        top: '50%',
        height: '4px',
        marginTop: '-2px',
        background: `linear-gradient(to right, ${strokeColor(stroke)} ${thumbPct}%, #ddd ${thumbPct}%)`,
        borderRadius: '2px',
    })
    const thumbStyle = styleStr({
        position: 'absolute',
        left: `calc(8px + ${thumbPct}% * (100% - 16px) / 100%)`,
        top: '50%',
        width: '14px',
        height: '14px',
        marginTop: '-7px',
        marginLeft: '-7px',
        borderRadius: '50%',
        background: fillBackground(thumbFill),
        border: `1px solid ${strokeColor(stroke)}`,
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...shadowStyle(shape),
        position: 'absolute',
    })}><div style="${trackStyle}"></div><div style="${thumbStyle}"></div></div>`
}

function renderProgress(shape: ProgressShape): string {
    const {fill, stroke, value, progressFill, transform} = shape
    const pct = Math.min(100, Math.max(0, value))
    const trackStyle = styleStr({
        position: 'absolute',
        left: '8px',
        right: '8px',
        top: '50%',
        height: '8px',
        marginTop: '-4px',
        background: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
        border: `1px solid ${strokeColor(stroke)}`,
    })
    const fillStyle2 = styleStr({
        width: `${pct}%`,
        height: '100%',
        background: fillBackground(progressFill),
        borderRadius: '4px',
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...shadowStyle(shape),
    })}><div style="${trackStyle}"><div style="${fillStyle2}"></div></div></div>`
}

function renderStepper(shape: StepperShape): string {
    const {fill, stroke, text, value, transform} = shape
    const btnStyle = styleStr({
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${strokeColor(stroke)}`,
        borderRadius: '3px',
        cursor: 'default',
        userSelect: 'none',
        fontSize: '14px',
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: text.color,
        boxSizing: 'border-box',
    })}><div style="${btnStyle}">−</div><div style="min-width:32px; text-align:center;">${escHtml(String(value))}</div><div style="${btnStyle}">+</div></div>`
}

function renderStickyNote(shape: StickyNoteShape): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        ...shadowStyle(shape),
        padding: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box',
    })}>${textBlockHtml(shape.text)}</div>`
}

function renderList(shape: ListShape): string {
    const {fill, stroke, text, selectedIndex, transform} = shape
    const items = text.content.split('\n')
    const liHtml = items.map((item, i) => {
        const isSelected = i === selectedIndex
        const liStyle = styleStr({
            padding: '3px 8px',
            background: isSelected ? strokeColor(stroke) : 'transparent',
            color: isSelected ? fill.type === 'color' ? fill.color : '#fff' : text.color,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        })
        return `<li style="${liStyle}">${escHtml(item)}</li>`
    }).join('')
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        overflow: 'hidden',
        boxSizing: 'border-box',
    })}><ul style="list-style:none; margin:0; padding:0; font-family:${escHtml(text.fontFamily)}; font-size:${text.fontSize}px;">${liHtml}</ul></div>`
}

function renderTable(shape: TableShape): string {
    const {fill, stroke, text, transform} = shape
    const rows = text.content.split('\n').map(r => r.split(','))
    const [header, ...body] = rows
    const thHtml = (header ?? []).map(h =>
        `<th style="padding:4px 8px; border-bottom:2px solid ${strokeColor(stroke)}; text-align:left;">${escHtml(h.trim())}</th>`
    ).join('')
    const trHtml = body.map(row =>
        `<tr>${row.map(cell =>
            `<td style="padding:4px 8px; border-bottom:1px solid ${strokeColor(stroke)}30;">${escHtml(cell.trim())}</td>`
        ).join('')}</tr>`
    ).join('')
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        overflow: 'auto',
        boxSizing: 'border-box',
    })}><table style="width:100%; border-collapse:collapse; font-family:${escHtml(text.fontFamily)}; font-size:${text.fontSize}px; color:${text.color};"><thead><tr>${thHtml}</tr></thead><tbody>${trHtml}</tbody></table></div>`
}

function renderDialog(shape: DialogShape): string {
    const {fill, stroke, text, title, okLabel, cancelLabel, transform} = shape
    const titleBarStyle = styleStr({
        padding: '8px 12px',
        fontFamily: text.fontFamily,
        fontWeight: 'bold',
        fontSize: text.fontSize + 1,
        color: text.color,
        borderBottom: `1px solid ${strokeColor(stroke)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    })
    const bodyStyle = styleStr({
        padding: '12px',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: text.color,
        flex: '1',
        overflow: 'hidden',
    })
    const footerStyle = styleStr({
        padding: '8px 12px',
        borderTop: `1px solid ${strokeColor(stroke)}`,
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
    })
    const btnStyle = styleStr({
        padding: '4px 16px',
        border: `1px solid ${strokeColor(stroke)}`,
        borderRadius: '3px',
        cursor: 'default',
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
    })
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        ...strokeProps(stroke),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    })}><div style="${titleBarStyle}">${escHtml(title)}<span style="opacity:0.5; cursor:default;">✕</span></div><div style="${bodyStyle}">${escHtml(text.content)}</div><div style="${footerStyle}"><div style="${btnStyle}">${escHtml(cancelLabel)}</div><div style="${btnStyle} background:${strokeColor(stroke)}; color:#fff;">${escHtml(okLabel)}</div></div></div>`
}

function renderScrollPanel(shape: ScrollPanelShape, children: string): string {
    return `<div${sa({
        ...posStyle(shape.transform),
        ...fillProps(shape.fill),
        ...strokeProps(shape.stroke),
        ...radiusProps(shape.cornerRadius, shape.cornerRadii),
        ...shadowStyle(shape),
        boxSizing: 'border-box',
        overflow: shape.clipChildren ? 'hidden' : 'auto',
    })}>${children}</div>`
}

function renderImageMock(shape: ImageMockShape): string {
    const {fill, stroke, transform} = shape
    const svgW = transform.width
    const svgH = transform.height
    const xLine1 = `<line x1="0" y1="0" x2="${svgW}" y2="${svgH}" stroke="${strokeColor(stroke)}" stroke-width="1" opacity="0.4"/>`
    const xLine2 = `<line x1="${svgW}" y1="0" x2="0" y2="${svgH}" stroke="${strokeColor(stroke)}" stroke-width="1" opacity="0.4"/>`
    const border = `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="none" stroke="${strokeColor(stroke)}" stroke-width="1"/>`
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        overflow: 'hidden',
    })}><svg width="${svgW}" height="${svgH}" style="position:absolute;left:0;top:0;">${border}${xLine1}${xLine2}</svg></div>`
}

function renderChartMock(shape: ChartMockShape): string {
    const {fill, stroke, transform, chartType} = shape
    const w = transform.width
    const h = transform.height
    const barCount = 5
    const barW = (w - 24) / barCount
    const bars = [0.7, 0.4, 0.9, 0.5, 0.75].slice(0, barCount)
    let chart = ''
    if (chartType === 'bar') {
        chart = bars.map((v, i) => {
            const bh = (h - 24) * v
            const bx = 12 + i * barW + barW * 0.1
            const by = h - 12 - bh
            return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(barW * 0.8).toFixed(1)}" height="${bh.toFixed(1)}" fill="${strokeColor(stroke)}" opacity="0.7"/>`
        }).join('')
    } else {
        const points = bars.map((v, i) =>
            `${(12 + i * barW + barW / 2).toFixed(1)},${(h - 12 - (h - 24) * v).toFixed(1)}`
        ).join(' ')
        chart = `<polyline points="${points}" fill="none" stroke="${strokeColor(stroke)}" stroke-width="2" opacity="0.7"/>`
    }
    return `<div${sa({
        ...posStyle(transform),
        ...fillProps(fill),
        overflow: 'hidden',
    })}><svg width="${w}" height="${h}" style="position:absolute;left:0;top:0;"><rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${strokeColor(stroke)}" stroke-width="1" opacity="0.3"/>${chart}</svg></div>`
}

function renderPixelImage(shape: PixelImageShape, pixelAssets: Record<string, PixelAsset>): string {
    const asset = pixelAssets[shape.assetId]
    if (!asset) {
        return `<div${sa({...posStyle(shape.transform), background: '#eee', border: '1px dashed #999'})}></div>`
    }
    const src = pixelAssetToDataUrl(asset)
    return `<img src="${src}"${sa({
        ...posStyle(shape.transform),
        imageRendering: 'pixelated',
        display: 'block',
    })}/>`
}

// ─── Tree renderer ────────────────────────────────────────────────────────

function renderNodes(
    nodes: TreeNode[],
    shapes: Record<string, Shape>,
    pixelAssets: Record<string, PixelAsset>,
): string {
    return nodes
        .filter(node => {
            const s = shapes[node.id]
            return s && s.visible !== false
        })
        .map(node => {
            const shape = shapes[node.id]
            const children = renderNodes(node.children, shapes, pixelAssets)
            switch (shape.type) {
                case 'rect':        return renderRect(shape, children)
                case 'circle':      return renderCircle(shape, children)
                case 'text':        return renderTextShape(shape)
                case 'image':       return renderImage(shape)
                case 'line':        return renderLine(shape, shapes)
                case 'group':       return renderGroup(shape, children)
                case 'frame':       return renderFrame(shape, children)
                case 'panel':       return renderPanel(shape, children)
                case 'tabbed-panel':return renderTabbedPanel(shape, children)
                case 'button':      return renderButton(shape)
                case 'icon':        return renderIcon(shape)
                case 'label':       return renderLabel(shape)
                case 'textfield':   return renderTextField(shape)
                case 'checkbox':    return renderCheckbox(shape)
                case 'toggle':      return renderToggle(shape)
                case 'radio':       return renderRadio(shape)
                case 'select':      return renderSelect(shape)
                case 'slider':      return renderSlider(shape)
                case 'progress':    return renderProgress(shape)
                case 'stepper':     return renderStepper(shape)
                case 'stickynote':  return renderStickyNote(shape)
                case 'list':        return renderList(shape)
                case 'table':       return renderTable(shape)
                case 'dialog':      return renderDialog(shape)
                case 'scrollpanel': return renderScrollPanel(shape, children)
                case 'imagemock':   return renderImageMock(shape)
                case 'chartmock':   return renderChartMock(shape)
                case 'pixelimage':  return renderPixelImage(shape, pixelAssets)
                case 'page':        return children  // nested pages render only their children
                default:            return ''
            }
        })
        .join('\n')
}

// ─── Font helpers ─────────────────────────────────────────────────────────

function collectFonts(nodes: TreeNode[], shapes: Record<string, Shape>, out: Set<string>): void {
    for (const node of nodes) {
        const shape = shapes[node.id]
        if (!shape) continue
        if ('text' in shape && shape.text) out.add((shape.text as TextStyle).fontFamily)
        collectFonts(node.children, shapes, out)
    }
}

const SYSTEM_FONTS = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'])

function buildFontImports(families: Set<string>, customFonts: CustomFont[]): string {
    const customByName = new Map(customFonts.map(f => [f.name.toLowerCase(), f]))
    const lines: string[] = []
    for (const family of families) {
        if (SYSTEM_FONTS.has(family.toLowerCase())) continue
        const custom = customByName.get(family.toLowerCase())
        const href = custom
            ? buildGoogleFontHref(custom)
            : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;700&display=swap`
        lines.push(`@import url('${href}');`)
    }
    return lines.join('\n')
}

// ─── Public API ───────────────────────────────────────────────────────────

export function generatePageHtml(
    pageId: string,
    doc: VibeDocument,
    docName: string,
): string {
    const page = doc.shapes[pageId]
    if (!page || page.type !== 'page') throw new Error('Shape is not a page')
    if (!page.fixedSize) throw new Error('HTML export requires a fixed-size page')

    const pageNode = doc.rootNodes.find(n => n.id === pageId)
    if (!pageNode) throw new Error('Page node not found')

    const {width, height} = page.fixedSize

    // Build pixel asset lookup
    const pixelAssets: Record<string, PixelAsset> = {}
    for (const a of doc.pixelAssets ?? []) pixelAssets[a.id] = a

    const bodyHtml = renderNodes(pageNode.children, doc.shapes, pixelAssets)

    // Collect fonts
    const fonts = new Set<string>()
    collectFonts(pageNode.children, doc.shapes, fonts)
    const fontImports = buildFontImports(fonts, doc.customFonts ?? [])

    const pageName = escHtml(page.name || 'Page')
    const title = escHtml(docName || 'Export')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ${pageName}</title>
  <style>
    ${fontImports}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: ${page.background ?? '#ffffff'};
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

export function exportPageAsHtml(state: AppState): void {
    exporterLogger.info('Exporting page as HTML', {pageId: state.activePageId})
    const pageId = state.activePageId
    if (!pageId) throw new Error('No active page')

    const page = state.document.shapes[pageId]
    if (!page || page.type !== 'page') throw new Error('No page found')

    if (!page.fixedSize) {
        alert('HTML export requires a fixed-size page. Set a width and height for the page in the properties panel first.')
        return
    }

    const html = generatePageHtml(pageId, state.document, state.documentName)
    const blob = new Blob([html], {type: 'text/html'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.documentName || 'export'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    exporterLogger.info('Exported page as HTML', {pageId})
}
