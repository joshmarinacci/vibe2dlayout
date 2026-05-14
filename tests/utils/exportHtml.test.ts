import {describe, expect, it} from 'vitest'
import type {TreeNode, VibeDocument} from '../../src/model/document'
import type {
    BoxShadow,
    CircleShape,
    ColorFill,
    GradientFill,
    ImageShape,
    LineShape,
    PageShape,
    RectShape,
    Shape,
    SketchFill,
    StrokeStyle,
    TextShape,
    TextStyle,
} from '../../src/model/shapes'
import type {BoundingBox} from '../../src/model/transform'
import {generatePageHtml} from '../../src/utils/exportHtml'

// ─── Factories ────────────────────────────────────────────────────────────

function makeTransform(x = 0, y = 0, w = 100, h = 60): BoundingBox {
    return {x, y, width: w, height: h, rotation: 0}
}

function makeColorFill(color = '#ff0000', opacity = 1): ColorFill {
    return {type: 'color', color, opacity}
}

function makeGradientFill(): GradientFill {
    return {
        type: 'gradient',
        gradientType: 'linear',
        angle: 90,
        stops: [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}],
        opacity: 1,
    }
}

function makeSketchFill(fillStyle: 'solid' | 'hatched' | 'none' = 'solid'): SketchFill {
    return {type: 'sketch', color: '#333333', fillStyle, hachureAngle: 45, hachureGap: 4, opacity: 1}
}

function makeStroke(type: StrokeStyle['type'] = 'solid', color = '#000000', width = 2): StrokeStyle {
    return {type, color, width, dash: type === 'dashed' ? [5, 3] : [], opacity: 1}
}

function makeText(overrides: Partial<TextStyle> = {}): TextStyle {
    return {
        content: 'Hello',
        fontFamily: 'sans-serif',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        align: 'left',
        verticalAlign: 'top',
        ...overrides,
    }
}

function makeRect(id: string, overrides: Partial<RectShape> = {}): RectShape {
    return {
        id,
        name: id,
        type: 'rect',
        visible: true,
        locked: false,
        transform: makeTransform(),
        fill: makeColorFill(),
        stroke: makeStroke('none'),
        cornerRadius: 0,
        ...overrides,
    }
}

function makeCircle(id: string, overrides: Partial<CircleShape> = {}): CircleShape {
    return {
        id,
        name: id,
        type: 'circle',
        visible: true,
        locked: false,
        transform: makeTransform(),
        fill: makeColorFill('#00ff00'),
        stroke: makeStroke('none'),
        ...overrides,
    }
}

function makeTextShape(id: string, textOverrides: Partial<TextStyle> = {}, shapeOverrides: Partial<TextShape> = {}): TextShape {
    return {
        id,
        name: id,
        type: 'text',
        visible: true,
        locked: false,
        transform: makeTransform(),
        fill: makeColorFill('transparent'),
        text: makeText(textOverrides),
        ...shapeOverrides,
    }
}

function makeImage(id: string, overrides: Partial<ImageShape> = {}): ImageShape {
    return {
        id,
        name: id,
        type: 'image',
        visible: true,
        locked: false,
        transform: makeTransform(),
        src: 'data:image/png;base64,ABC123',
        mimeType: 'image/png',
        preserveAspectRatio: true,
        opacity: 1,
        ...overrides,
    }
}

function makeLine(id: string, overrides: Partial<LineShape> = {}): LineShape {
    return {
        id,
        name: id,
        type: 'line',
        visible: true,
        locked: false,
        start: {kind: 'free', point: {x: 10, y: 10}},
        end: {kind: 'free', point: {x: 110, y: 60}},
        route: {mode: 'straight', waypoints: []},
        stroke: makeStroke('solid', '#333333', 2),
        startArrow: 'none',
        endArrow: 'none',
        ...overrides,
    }
}

function makePage(id: string, children: TreeNode[], shapes: Record<string, Shape>, overrides: Partial<PageShape> = {}): {
    doc: VibeDocument
    pageId: string
} {
    const page: PageShape = {
        id,
        name: 'Test Page',
        type: 'page',
        visible: true,
        locked: false,
        transform: makeTransform(0, 0, 800, 600),
        fixedSize: {width: 800, height: 600},
        background: '#ffffff',
        clipChildren: false,
        ...overrides,
    }
    const doc: VibeDocument = {
        version: 2,
        rootNodes: [{id, children}],
        shapes: {[id]: page, ...shapes},
        palettes: [],
        themes: [],
        activeThemeId: '',
        gridSettings: {size: 16, style: 'lines', snapEnabled: false, snapAlignment: false},
        pageFolders: [],
        images: [],
        pixelAssets: [],
        customFonts: [],
        gradients: [],
        sketchStyles: [],
    }
    return {doc, pageId: id}
}

function htmlForShapes(shapes: Record<string, Shape>, children: TreeNode[] = []): string {
    const shapeEntries = Object.entries(shapes)
    const childNodes: TreeNode[] = children.length > 0 ? children : shapeEntries.map(([id]) => ({id, children: []}))
    const {doc, pageId} = makePage('page1', childNodes, shapes)
    return generatePageHtml(pageId, doc, 'Test')
}

// ─── RectShape tests ──────────────────────────────────────────────────────

describe('RectShape', () => {
    it('renders color fill as background', () => {
        const html = htmlForShapes({r: makeRect('r', {fill: makeColorFill('#aabbcc')})})
        expect(html).toContain('#aabbcc')
    })

    it('renders gradient fill', () => {
        const html = htmlForShapes({r: makeRect('r', {fill: makeGradientFill()})})
        expect(html).toContain('linear-gradient')
        expect(html).toContain('#ff0000')
        expect(html).toContain('#0000ff')
    })

    it('renders sketch fill (solid) as color background', () => {
        const html = htmlForShapes({r: makeRect('r', {fill: makeSketchFill('solid')})})
        expect(html).toContain('#333333')
    })

    it('renders sketch fill (hatched) as repeating-linear-gradient', () => {
        const html = htmlForShapes({r: makeRect('r', {fill: makeSketchFill('hatched')})})
        expect(html).toContain('repeating-linear-gradient')
    })

    it('renders uniform corner radius', () => {
        const html = htmlForShapes({r: makeRect('r', {cornerRadius: 8})})
        expect(html).toContain('border-radius: 8px')
    })

    it('renders per-corner radii', () => {
        const html = htmlForShapes({
            r: makeRect('r', {cornerRadius: 0, cornerRadii: {topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16}}),
        })
        expect(html).toContain('4px 8px 12px 16px')
    })

    it('renders box shadow', () => {
        const shadow: BoxShadow = {offsetX: 2, offsetY: 4, blur: 6, spread: 0, color: '#00000040'}
        const html = htmlForShapes({r: makeRect('r', {boxShadow: [shadow]})})
        expect(html).toContain('box-shadow')
        expect(html).toContain('#00000040')
    })

    it('renders solid stroke as border', () => {
        const html = htmlForShapes({r: makeRect('r', {stroke: makeStroke('solid', '#ff0000', 3)})})
        expect(html).toContain('border-color: #ff0000')
        expect(html).toContain('border-width: 3px')
        expect(html).toContain('border-style: solid')
    })

    it('renders stroke:none as border:none', () => {
        const html = htmlForShapes({r: makeRect('r', {stroke: makeStroke('none')})})
        expect(html).toContain('border: none')
    })

    it('renders dashed stroke', () => {
        const html = htmlForShapes({r: makeRect('r', {stroke: makeStroke('dashed', '#000', 1)})})
        expect(html).toContain('border-style: dashed')
    })

    it('renders rotation transform', () => {
        const html = htmlForShapes({
            r: makeRect('r', {transform: {...makeTransform(), rotation: 45}}),
        })
        expect(html).toContain('rotate(45deg)')
    })

    it('positions at correct x/y', () => {
        const html = htmlForShapes({r: makeRect('r', {transform: makeTransform(50, 80, 120, 40)})})
        expect(html).toContain('left: 50px')
        expect(html).toContain('top: 80px')
        expect(html).toContain('width: 120px')
        expect(html).toContain('height: 40px')
    })

    it('invisible shapes are omitted', () => {
        const html = htmlForShapes({r: makeRect('r', {visible: false, fill: makeColorFill('#deadbe')})})
        expect(html).not.toContain('#deadbe')
    })
})

// ─── CircleShape tests ────────────────────────────────────────────────────

describe('CircleShape', () => {
    it('renders border-radius 50%', () => {
        const html = htmlForShapes({c: makeCircle('c')})
        expect(html).toContain('border-radius: 50%')
    })

    it('renders fill color', () => {
        const html = htmlForShapes({c: makeCircle('c', {fill: makeColorFill('#123456')})})
        expect(html).toContain('#123456')
    })

    it('renders stroke', () => {
        const html = htmlForShapes({c: makeCircle('c', {stroke: makeStroke('solid', '#abcdef', 2)})})
        expect(html).toContain('#abcdef')
    })
})

// ─── TextShape tests ──────────────────────────────────────────────────────

describe('TextShape', () => {
    it('renders font family', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontFamily: 'Georgia'})})
        expect(html).toContain('Georgia')
    })

    it('renders font size', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontSize: 24})})
        expect(html).toContain('font-size: 24px')
    })

    it('renders font weight', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontWeight: '700'})})
        expect(html).toContain('font-weight: 700')
    })

    it('renders font style italic', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontStyle: 'italic'})})
        expect(html).toContain('font-style: italic')
    })

    it('renders text color', () => {
        const html = htmlForShapes({t: makeTextShape('t', {color: '#cc0000'})})
        expect(html).toContain('#cc0000')
    })

    it('renders text-align', () => {
        const html = htmlForShapes({t: makeTextShape('t', {align: 'center'})})
        expect(html).toContain('text-align: center')
    })

    it('verticalAlign:top → justify-content:flex-start', () => {
        const html = htmlForShapes({t: makeTextShape('t', {verticalAlign: 'top'})})
        expect(html).toContain('justify-content: flex-start')
    })

    it('verticalAlign:middle → justify-content:center', () => {
        const html = htmlForShapes({t: makeTextShape('t', {verticalAlign: 'middle'})})
        expect(html).toContain('justify-content: center')
    })

    it('verticalAlign:bottom → justify-content:flex-end', () => {
        const html = htmlForShapes({t: makeTextShape('t', {verticalAlign: 'bottom'})})
        expect(html).toContain('justify-content: flex-end')
    })

    it('renders lineHeight', () => {
        const html = htmlForShapes({t: makeTextShape('t', {lineHeight: 1.6})})
        expect(html).toContain('line-height: 1.6')
    })

    it('renders letterSpacing', () => {
        const html = htmlForShapes({t: makeTextShape('t', {letterSpacing: 2})})
        expect(html).toContain('letter-spacing: 2px')
    })

    it('renders textDecoration underline', () => {
        const html = htmlForShapes({t: makeTextShape('t', {textDecoration: 'underline'})})
        expect(html).toContain('text-decoration: underline')
    })

    it('renders textTransform uppercase', () => {
        const html = htmlForShapes({t: makeTextShape('t', {textTransform: 'uppercase'})})
        expect(html).toContain('text-transform: uppercase')
    })

    it('renders fontVariantCaps small-caps', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontVariantCaps: 'small-caps'})})
        expect(html).toContain('font-variant-caps: small-caps')
    })

    it('renders fontVariationSettings', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontVariationSettings: {wght: 600, wdth: 75}})})
        expect(html).toContain("font-variation-settings")
        expect(html).toContain("'wght' 600")
        expect(html).toContain("'wdth' 75")
    })

    it('renders opsz axis + font-optical-sizing:none', () => {
        const html = htmlForShapes({t: makeTextShape('t', {fontVariationSettings: {opsz: 24}})})
        expect(html).toContain("'opsz' 24")
        expect(html).toContain('font-optical-sizing: none')
    })

    it('renders textShadow', () => {
        const html = htmlForShapes({
            t: makeTextShape('t', {textShadow: {offsetX: 1, offsetY: 2, blur: 3, color: '#00000066'}}),
        })
        expect(html).toContain('text-shadow')
        expect(html).toContain('#00000066')
    })

    it('renders text stroke (-webkit-text-stroke)', () => {
        const html = htmlForShapes({
            t: makeTextShape('t', {stroke: {width: 2, color: '#ff0000'}}),
        })
        expect(html).toContain('-webkit-text-stroke')
        expect(html).toContain('#ff0000')
    })

    it('renders gradient text with background-clip', () => {
        const html = htmlForShapes({t: makeTextShape('t', {textGradient: makeGradientFill()})})
        expect(html).toContain('background-clip: text')
        expect(html).toContain('-webkit-background-clip: text')
        expect(html).toContain('-webkit-text-fill-color: transparent')
        expect(html).toContain('linear-gradient')
    })

    it('renders text content (HTML-escaped)', () => {
        const html = htmlForShapes({t: makeTextShape('t', {content: 'A & B'})})
        expect(html).toContain('A &amp; B')
        expect(html).not.toContain('A & B')
    })
})

// ─── ImageShape tests ─────────────────────────────────────────────────────

describe('ImageShape', () => {
    it('passes src through to img tag', () => {
        const html = htmlForShapes({i: makeImage('i', {src: 'data:image/png;base64,ABC123'})})
        expect(html).toContain('src="data:image/png;base64,ABC123"')
        expect(html).toContain('<img')
    })

    it('preserveAspectRatio:true → object-fit:contain', () => {
        const html = htmlForShapes({i: makeImage('i', {preserveAspectRatio: true})})
        expect(html).toContain('object-fit: contain')
    })

    it('preserveAspectRatio:false → object-fit:fill', () => {
        const html = htmlForShapes({i: makeImage('i', {preserveAspectRatio: false})})
        expect(html).toContain('object-fit: fill')
    })

    it('opacity is applied', () => {
        const html = htmlForShapes({i: makeImage('i', {opacity: 0.5})})
        expect(html).toContain('opacity: 0.5')
    })
})

// ─── LineShape tests ──────────────────────────────────────────────────────

describe('LineShape', () => {
    it('renders an SVG element', () => {
        const html = htmlForShapes({l: makeLine('l')})
        expect(html).toContain('<svg')
        expect(html).toContain('</svg>')
    })

    it('renders stroke color in SVG path', () => {
        const html = htmlForShapes({l: makeLine('l', {stroke: makeStroke('solid', '#ff5500', 3)})})
        expect(html).toContain('#ff5500')
    })

    it('straight route generates M...L path', () => {
        const html = htmlForShapes({l: makeLine('l', {route: {mode: 'straight', waypoints: []}})})
        expect(html).toMatch(/d="M[\d. ]+ L[\d. ]+"/)
    })

    it('endArrow:arrow adds marker element', () => {
        const html = htmlForShapes({l: makeLine('l', {endArrow: 'arrow'})})
        expect(html).toContain('<marker')
        expect(html).toContain('marker-end')
    })

    it('startArrow:circle adds start marker', () => {
        const html = htmlForShapes({l: makeLine('l', {startArrow: 'circle'})})
        expect(html).toContain('<marker')
        expect(html).toContain('marker-start')
    })

    it('no arrows when both are none', () => {
        const html = htmlForShapes({l: makeLine('l', {startArrow: 'none', endArrow: 'none'})})
        expect(html).not.toContain('<marker')
    })

    it('renders stroke-dasharray for dashed line', () => {
        const html = htmlForShapes({l: makeLine('l', {stroke: {...makeStroke('dashed', '#000', 2), dash: [5, 3]}})})
        expect(html).toContain('stroke-dasharray')
    })
})

// ─── GroupShape with children ─────────────────────────────────────────────

describe('GroupShape with children', () => {
    it('renders child shapes inside group', () => {
        const group = {
            id: 'g',
            name: 'g',
            type: 'group' as const,
            visible: true,
            locked: false,
            transform: makeTransform(10, 10, 200, 100),
        }
        const child = makeRect('child', {fill: makeColorFill('#abcdef'), transform: makeTransform(0, 0, 50, 50)})
        const shapes: Record<string, Shape> = {g: group, child}
        const nodes: TreeNode[] = [{id: 'g', children: [{id: 'child', children: []}]}]
        const html = htmlForShapes(shapes, nodes)
        expect(html).toContain('#abcdef')
    })

    it('omits invisible child shapes', () => {
        const group = {
            id: 'g',
            name: 'g',
            type: 'group' as const,
            visible: true,
            locked: false,
            transform: makeTransform(),
        }
        const child = makeRect('child', {visible: false, fill: makeColorFill('#deadbe')})
        const shapes: Record<string, Shape> = {g: group, child}
        const nodes: TreeNode[] = [{id: 'g', children: [{id: 'child', children: []}]}]
        const html = htmlForShapes(shapes, nodes)
        expect(html).not.toContain('#deadbe')
    })
})

// ─── generatePageHtml structure ───────────────────────────────────────────

describe('generatePageHtml', () => {
    it('output starts with <!DOCTYPE html>', () => {
        const {doc, pageId} = makePage('p', [], {})
        const html = generatePageHtml(pageId, doc, 'MyDoc')
        expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true)
    })

    it('includes page background on body', () => {
        const {doc, pageId} = makePage('p', [], {}, {background: '#f0f0f0'} as Partial<PageShape>)
        const html = generatePageHtml(pageId, doc, 'MyDoc')
        expect(html).toContain('#f0f0f0')
    })

    it('includes page dimensions on body', () => {
        const {doc, pageId} = makePage('p', [], {}, {fixedSize: {width: 1024, height: 768}} as Partial<PageShape>)
        const html = generatePageHtml(pageId, doc, 'MyDoc')
        expect(html).toContain('1024px')
        expect(html).toContain('768px')
    })

    it('includes document name in title', () => {
        const {doc, pageId} = makePage('p', [], {})
        const html = generatePageHtml(pageId, doc, 'MyAwesomeDoc')
        expect(html).toContain('MyAwesomeDoc')
    })

    it('includes all child shapes in output', () => {
        const r1 = makeRect('r1', {fill: makeColorFill('#111111')})
        const r2 = makeRect('r2', {fill: makeColorFill('#222222'), transform: makeTransform(110, 0)})
        const shapes: Record<string, Shape> = {r1, r2}
        const {doc, pageId} = makePage('p', [{id: 'r1', children: []}, {id: 'r2', children: []}], shapes)
        const html = generatePageHtml(pageId, doc, 'Test')
        expect(html).toContain('#111111')
        expect(html).toContain('#222222')
    })

    it('throws if page has no fixedSize', () => {
        const {doc, pageId} = makePage('p', [], {}, {fixedSize: null} as Partial<PageShape>)
        expect(() => generatePageHtml(pageId, doc, 'Test')).toThrow()
    })

    it('includes Google Fonts import for non-system fonts', () => {
        const shape = makeTextShape('t', {fontFamily: 'Roboto'})
        const {doc, pageId} = makePage('p', [{id: 't', children: []}], {t: shape})
        const html = generatePageHtml(pageId, doc, 'Test')
        expect(html).toContain('fonts.googleapis.com')
        expect(html).toContain('Roboto')
    })

    it('does not import system fonts', () => {
        const shape = makeTextShape('t', {fontFamily: 'sans-serif'})
        const {doc, pageId} = makePage('p', [{id: 't', children: []}], {t: shape})
        const html = generatePageHtml(pageId, doc, 'Test')
        // system fonts should not generate @import URLs
        const importCount = (html.match(/@import url/g) ?? []).length
        expect(importCount).toBe(0)
    })
})
