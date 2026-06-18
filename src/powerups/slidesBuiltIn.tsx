import {CollapsibleSection} from '@components/properties/CollapsibleSection'
import type {PageShape, RectShape, TextShape} from '@model/shapes'
import {defaultStroke, defaultText, defaultTransform} from '@model/shapes'
import {exportSlidesWithNotesPdf} from '@utils/exportSlidesWithNotesPdf'
import {generateId} from '@utils/idgen'
import {createPowerUpLogger} from '@logging'
import {Presentation, StickyNote} from 'lucide-react'
import type {Dispatch} from 'react'
import type {AppAction} from '@store/types'
import type {PowerUpDefinition} from './types'

export const SLIDES_POWER_UP_ID = 'slides'
const NOTES_FEATURE_ID = 'speaker-notes'
const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720

const slidesLogger = createPowerUpLogger(SLIDES_POWER_UP_ID)

function makeRect(
    x: number, y: number, w: number, h: number,
    fillColor: string, opts?: {cornerRadius?: number; noStroke?: boolean},
): RectShape {
    return {
        id: generateId(),
        name: 'rect',
        locked: false,
        visible: true,
        powerUps: [],
        type: 'rect',
        transform: defaultTransform(x, y, w, h),
        fill: {type: 'color', color: fillColor, opacity: 1},
        stroke: opts?.noStroke
            ? {type: 'none', color: '#000', width: 0, dash: [], opacity: 1}
            : {...defaultStroke(), type: 'none', color: '#000', width: 0, dash: [], opacity: 1},
        cornerRadius: opts?.cornerRadius ?? 0,
    }
}

function makeText(
    x: number, y: number, w: number, h: number,
    content: string,
    opts?: {
        fontSize?: number
        fontWeight?: 'normal' | 'bold'
        color?: string
        align?: 'left' | 'center' | 'right'
        verticalAlign?: 'top' | 'middle' | 'bottom'
    },
): TextShape {
    return {
        id: generateId(),
        name: 'text',
        locked: false,
        visible: true,
        powerUps: [],
        type: 'text',
        transform: defaultTransform(x, y, w, h),
        fill: {type: 'color', color: 'transparent', opacity: 1},
        text: {
            ...defaultText(content),
            fontSize: opts?.fontSize ?? 16,
            fontWeight: opts?.fontWeight ?? 'normal',
            color: opts?.color ?? '#333333',
            align: opts?.align ?? 'center',
            verticalAlign: opts?.verticalAlign ?? 'middle',
        },
    }
}

function createTitleSlide(headerColor: string) {
    const pageId = generateId()
    const page: PageShape = {
        id: pageId,
        name: 'Title Slide',
        locked: false,
        visible: true,
        powerUps: [{id: SLIDES_POWER_UP_ID, version: 1, features: {[NOTES_FEATURE_ID]: {content: ''}}}],
        type: 'page',
        transform: defaultTransform(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT),
        fixedSize: {width: SLIDE_WIDTH, height: SLIDE_HEIGHT},
        pageSize: {kind: 'preset', presetId: 'presentation-16-9'},
        background: '#ffffff',
        clipChildren: true,
    }

    const header = makeRect(0, 0, SLIDE_WIDTH, 120, headerColor, {noStroke: true})
    const titleText = makeText(64, 0, SLIDE_WIDTH - 128, 120, 'Presentation Title', {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'left',
        verticalAlign: 'middle',
    })
    const subtitleText = makeText(64, 160, SLIDE_WIDTH - 128, 80, 'Your subtitle here', {
        fontSize: 24,
        color: '#555555',
        align: 'left',
        verticalAlign: 'middle',
    })
    const divider = makeRect(64, SLIDE_HEIGHT - 80, SLIDE_WIDTH - 128, 1, '#cccccc', {noStroke: true})
    const footerText = makeText(64, SLIDE_HEIGHT - 70, SLIDE_WIDTH - 128, 50, 'Author · Date', {
        fontSize: 14,
        color: '#888888',
        align: 'left',
        verticalAlign: 'middle',
    })

    return {page, children: [header, titleText, subtitleText, divider, footerText]}
}

function createContentSlide(headerColor: string) {
    const pageId = generateId()
    const page: PageShape = {
        id: pageId,
        name: 'Content Slide',
        locked: false,
        visible: true,
        powerUps: [{id: SLIDES_POWER_UP_ID, version: 1, features: {[NOTES_FEATURE_ID]: {content: ''}}}],
        type: 'page',
        transform: defaultTransform(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT),
        fixedSize: {width: SLIDE_WIDTH, height: SLIDE_HEIGHT},
        pageSize: {kind: 'preset', presetId: 'presentation-16-9'},
        background: '#ffffff',
        clipChildren: true,
    }

    const header = makeRect(0, 0, SLIDE_WIDTH, 80, headerColor, {noStroke: true})
    const slideTitleText = makeText(32, 0, SLIDE_WIDTH - 64, 80, 'Slide Title', {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'left',
        verticalAlign: 'middle',
    })
    const bulletText = makeText(64, 120, SLIDE_WIDTH - 128, 460, '• Point one\n• Point two\n• Point three', {
        fontSize: 22,
        color: '#333333',
        align: 'left',
        verticalAlign: 'top',
    })
    const divider = makeRect(64, SLIDE_HEIGHT - 60, SLIDE_WIDTH - 128, 1, '#cccccc', {noStroke: true})
    const footerText = makeText(64, SLIDE_HEIGHT - 50, SLIDE_WIDTH - 128, 40, 'Footer text', {
        fontSize: 12,
        color: '#aaaaaa',
        align: 'left',
        verticalAlign: 'middle',
    })
    const pageNumText = makeText(SLIDE_WIDTH - 128, SLIDE_HEIGHT - 50, 100, 40, '1', {
        fontSize: 12,
        color: '#aaaaaa',
        align: 'right',
        verticalAlign: 'middle',
    })

    return {page, children: [header, slideTitleText, bulletText, divider, footerText, pageNumText]}
}

export const SLIDES_POWER_UP: PowerUpDefinition = {
    id: SLIDES_POWER_UP_ID,
    name: 'Slides',
    version: 1,
    createDefaultDocumentSettings: () => ({
        headerColor: '#2563EB',
        headerHeight: 80,
        footerText: '',
    }),
    documentSettingsRenderer: ({settings, update}) => {
        const headerColor = typeof settings.headerColor === 'string' ? settings.headerColor : '#2563EB'
        return (
            <CollapsibleSection title="Slides">
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                    <label style={{fontSize: 12}}>Header Color</label>
                    <input
                        type="color"
                        value={headerColor}
                        onChange={e => update({headerColor: e.target.value})}
                        style={{width: 40, height: 24, cursor: 'pointer', border: 'none', padding: 0, borderRadius: 4}}
                    />
                </div>
            </CollapsibleSection>
        )
    },
    nodeFeatures: [
        {
            id: NOTES_FEATURE_ID,
            name: 'Speaker Notes',
            createDefaultSettings: () => ({content: ''}),
            canAttachToShape: shape => shape.type === 'page',
            propsRenderer: ({settings}) => {
                const content = typeof settings.content === 'string' ? settings.content : ''
                return (
                    <div style={{fontSize: 11, color: 'var(--color-text-muted, #888)', fontStyle: 'italic', paddingTop: 4}}>
                        {content ? `${content.length} chars` : 'No notes — use the Notes panel to edit'}
                    </div>
                )
            },
        },
    ],
    toolbarActions: [
        {
            id: 'slides-present',
            title: 'Present',
            icon: <Presentation size={15}/>,
            run: ({state, dispatch}) => {
                const {rootNodes, shapes} = state.document
                const slides = rootNodes.filter(n => {
                    const s = shapes[n.id]
                    return s?.type === 'page' && (s as PageShape).fixedSize != null
                })
                if (slides.length === 0) {
                    alert('No fixed-size pages to present.')
                    return
                }
                const activeIndex = slides.findIndex(n => n.id === state.activePageId)
                const slideIndex = activeIndex >= 0 ? activeIndex : 0
                slidesLogger.info('Starting presentation', {slideCount: slides.length, slideIndex})
                dispatch({type: 'SET_PRESENTATION_MODE', active: true, slideIndex})
            },
        },
        {
            id: 'slides-notes',
            title: 'Notes',
            icon: <StickyNote size={15}/>,
            run: ({dispatch}) => {
                dispatch({type: 'TOGGLE_NOTES_PANEL'})
            },
        },
    ],
    menuActions: [
        {
            id: 'slides-export-pdf-with-notes',
            title: 'Export PDF with Notes...',
            tauriMenuId: 'menu:powerups:action:slides:export-pdf-notes',
            run: async ({state}) => {
                slidesLogger.info('Exporting slides PDF with notes')
                await exportSlidesWithNotesPdf(state)
            },
        },
        {
            id: 'slides-insert-templates',
            title: 'Insert Template Slides',
            tauriMenuId: 'menu:powerups:action:slides:insert-templates',
            run: ({state, dispatch}) => {
                const entry = state.document.powerUps.find(p => p.id === SLIDES_POWER_UP_ID)
                const headerColor = typeof entry?.settings?.headerColor === 'string'
                    ? entry.settings.headerColor
                    : '#2563EB'
                insertTemplateSlides(dispatch, headerColor)
            },
        },
    ],
    lifecycle: {
        onInstall: ({state, dispatch}) => {
            slidesLogger.info('Installing Slides powerup — inserting template slides')
            const entry = state.document.powerUps.find(p => p.id === SLIDES_POWER_UP_ID)
            const headerColor = typeof entry?.settings?.headerColor === 'string'
                ? entry.settings.headerColor
                : '#2563EB'
            insertTemplateSlides(dispatch, headerColor)
        },
    },
}

function insertTemplateSlides(dispatch: Dispatch<AppAction>, headerColor: string) {
    const title = createTitleSlide(headerColor)
    dispatch({type: 'ADD_SHAPE', parentId: null, shape: title.page})
    for (const child of title.children) {
        dispatch({type: 'ADD_SHAPE', parentId: title.page.id, shape: child})
    }

    const content = createContentSlide(headerColor)
    dispatch({type: 'ADD_SHAPE', parentId: null, shape: content.page})
    for (const child of content.children) {
        dispatch({type: 'ADD_SHAPE', parentId: content.page.id, shape: child})
    }
}
