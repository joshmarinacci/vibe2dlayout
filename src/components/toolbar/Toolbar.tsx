import {DocumentSettingsModal} from '@components/layout/DocumentSettingsModal'
import {DocumentsModal} from '@components/layout/DocumentsModal'
import {GradientEditorModal} from '@components/layout/GradientEditorModal'
import {SketchStyleEditorModal} from '@components/layout/SketchStyleEditorModal'
import {ThemeEditorModal} from '@components/layout/ThemeEditorModal'
import {PaletteEditorModal} from '@components/palette/PaletteEditorModal'
import {useTheme} from '@hooks/useTheme'
import type {VibeDocument} from '@model/document'
import {useAppDispatch, useAppState} from '@store/context'
import {createInitialDocument} from '@store/reducer'
import type {ToolMode} from '@store/types'
import {exportDocumentAsPdf} from '@utils/exportPdf'
import {exportPageAsPng} from '@utils/exportPng'
import {saveDoc} from '@utils/localStorageDB'
import {downloadJSON, fromJSON, uploadJSON} from '@utils/serialization'
import {createShape} from '@utils/shapeFactory'
import {
    AppWindow,
    CheckSquare,
    ChevronDown,
    Circle,
    CircleDot,
    Download,
    File,
    FileImage,
    FilePlus2,
    FileText,
    FolderOpen,
    GanttChart,
    Grid,
    Grid2X2,
    Hand,
    Hash,
    HelpCircle,
    Home,
    Image,
    LayoutPanelLeft,
    List,
    ListOrdered,
    Magnet,
    Minus,
    Moon,
    MousePointer2,
    NotebookTabs,
    Paintbrush,
    Palette,
    PanelLeft,
    RectangleHorizontal,
    Redo2,
    Save,
    ScrollText,
    Settings,
    SlidersHorizontal,
    Square,
    Star,
    StickyNote,
    Sun,
    Table2,
    Tag,
    TextCursorInput,
    ToggleLeft,
    Type,
    Undo2,
    Upload,
    ZoomIn,
    ZoomOut,
} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'
import styles from './Toolbar.module.css'

interface ToolButton {
    mode: ToolMode
    icon: React.ReactNode
    title: string
}

const IS_TAURI = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const SHAPE_TOOLS: ToolButton[] = [
    {mode: 'insert-rect', icon: <Square size={14}/>, title: 'Rectangle'},
    {mode: 'insert-circle', icon: <Circle size={14}/>, title: 'Circle'},
    {mode: 'insert-line', icon: <Minus size={14}/>, title: 'Line / Connector'},
    {mode: 'insert-pixelimage', icon: <Grid2X2 size={14}/>, title: 'Pixel Image'},
]
const SHAPE_MODES = new Set(SHAPE_TOOLS.map(t => t.mode))

const CONTAINER_CONTROLS: ToolButton[] = [
    {mode: 'insert-panel', icon: <PanelLeft size={14}/>, title: 'Titled Panel'},
    {mode: 'insert-tabbed-panel', icon: <NotebookTabs size={14}/>, title: 'Tabbed Panel'},
    {mode: 'insert-frame', icon: <LayoutPanelLeft size={14}/>, title: 'Panel'},
    {mode: 'insert-dialog', icon: <AppWindow size={14}/>, title: 'Dialog'},
    {mode: 'insert-stickynote', icon: <StickyNote size={14}/>, title: 'Sticky Note'},
    {mode: 'insert-scrollpanel', icon: <ScrollText size={14}/>, title: 'Scroll Panel'},
]

const FORM_CONTROLS: ToolButton[] = [
    {mode: 'insert-button', icon: <RectangleHorizontal size={14}/>, title: 'Button'},
    {mode: 'insert-icon', icon: <Star size={14}/>, title: 'Icon'},
    {mode: 'insert-slider', icon: <SlidersHorizontal size={14}/>, title: 'Slider'},
    {mode: 'insert-label', icon: <Tag size={14}/>, title: 'Label'},
    {mode: 'insert-textfield', icon: <TextCursorInput size={14}/>, title: 'Text Field'},
    {mode: 'insert-checkbox', icon: <CheckSquare size={14}/>, title: 'Checkbox'},
    {mode: 'insert-toggle', icon: <ToggleLeft size={14}/>, title: 'Toggle'},
    {mode: 'insert-radio', icon: <CircleDot size={14}/>, title: 'Radio Button'},
    {mode: 'insert-select', icon: <List size={14}/>, title: 'Select'},
    {mode: 'insert-progress', icon: <GanttChart size={14}/>, title: 'Progress Bar'},
    {mode: 'insert-stepper', icon: <Hash size={14}/>, title: 'Number Stepper'},
    {mode: 'insert-list', icon: <ListOrdered size={14}/>, title: 'List'},
    {mode: 'insert-table', icon: <Table2 size={14}/>, title: 'Table'},
]

const ALL_COMPONENT_TOOLS = [...CONTAINER_CONTROLS, ...FORM_CONTROLS]
const COMPONENT_MODES = new Set(ALL_COMPONENT_TOOLS.map(t => t.mode))

export function Toolbar() {
    const {state, canUndo, canRedo} = useAppState()
    const dispatch = useAppDispatch()
    const [showShapesMenu, setShowShapesMenu] = useState(false)
    const [showComponentMenu, setShowComponentMenu] = useState(false)
    const [componentSubMenu, setComponentSubMenu] = useState<'containers' | 'forms' | null>(null)
    const subMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cancelSubMenuClose = useCallback(() => {
        if (subMenuCloseTimer.current !== null) {
            clearTimeout(subMenuCloseTimer.current)
            subMenuCloseTimer.current = null
        }
    }, [])

    const scheduleSubMenuClose = useCallback(() => {
        cancelSubMenuClose()
        subMenuCloseTimer.current = setTimeout(() => setComponentSubMenu(null), 300)
    }, [cancelSubMenuClose])
    const [showFileMenu, setShowFileMenu] = useState(false)
    const [showDocumentsModal, setShowDocumentsModal] = useState(false)
    const [documentsModalMode, setDocumentsModalMode] = useState<'open' | 'save-as'>('open')
    const [editingName, setEditingName] = useState(false)
    const [nameInputValue, setNameInputValue] = useState('')

    const [theme, toggleTheme] = useTheme()
    const fileMenuRef = useRef<HTMLDivElement>(null)
    const shapesMenuRef = useRef<HTMLDivElement>(null)
    const componentMenuRef = useRef<HTMLDivElement>(null)

    // Close any open menu when clicking outside (but not inside the menu itself)
    const anyMenuOpen = showFileMenu || showShapesMenu || showComponentMenu
    useEffect(() => {
        if (!anyMenuOpen) return
        const handler = (e: PointerEvent) => {
            if (fileMenuRef.current?.contains(e.target as Node)) return
            if (shapesMenuRef.current?.contains(e.target as Node)) return
            if (componentMenuRef.current?.contains(e.target as Node)) return
            setShowFileMenu(false)
            setShowShapesMenu(false)
            setShowComponentMenu(false)
            setComponentSubMenu(null)
        }
        window.addEventListener('pointerdown', handler, {capture: true})
        return () => window.removeEventListener('pointerdown', handler, {capture: true})
    }, [anyMenuOpen])


    const activeShapeTool = SHAPE_TOOLS.find(t => t.mode === state.toolMode)
    const activeComponentTool = ALL_COMPONENT_TOOLS.find(t => t.mode === state.toolMode)

    const handleSave = () => {
        if (IS_TAURI) return  // Tauri saves are handled by the native menu via useTauriMenu
        try {
            const entry = saveDoc(state.documentId, state.documentName, state.document)
            dispatch({type: 'SET_DOCUMENT_META', id: entry.id, name: entry.name})
        } catch (err) {
            alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleImportJSON = async () => {
        try {
            const json = await uploadJSON()
            const doc = fromJSON(json)
            dispatch({type: 'LOAD_DOCUMENT', document: doc})
            const firstPage = doc.rootNodes[0]?.id ?? null
            dispatch({type: 'SET_ACTIVE_PAGE', pageId: firstPage})
            dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
        } catch (err) {
            alert('Failed to load document: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleLoadDoc = (id: string, name: string, doc: VibeDocument) => {
        dispatch({type: 'LOAD_DOCUMENT', document: doc})
        dispatch({type: 'SET_ACTIVE_PAGE', pageId: doc.rootNodes[0]?.id ?? null})
        dispatch({type: 'SET_DOCUMENT_META', id, name})
        setShowDocumentsModal(false)
    }

    const handleSaveAs = (id: string | null, name: string) => {
        try {
            const entry = saveDoc(id, name, state.document)
            dispatch({type: 'SET_DOCUMENT_META', id: entry.id, name: entry.name})
            setShowDocumentsModal(false)
        } catch (err) {
            alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleNew = () => {
        const doc = createInitialDocument()
        dispatch({type: 'LOAD_DOCUMENT', document: doc})
        dispatch({type: 'SET_ACTIVE_PAGE', pageId: doc.rootNodes[0]?.id ?? null})
        dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
        setShowFileMenu(false)
    }

    const openDocumentsModal = (mode: 'open' | 'save-as') => {
        setDocumentsModalMode(mode)
        setShowDocumentsModal(true)
        setShowFileMenu(false)
    }

    useEffect(() => {
        if (state.pendingDocumentsModalMode) {
            openDocumentsModal(state.pendingDocumentsModalMode)
            dispatch({type: 'CLEAR_DOCUMENTS_MODAL_REQUEST'})
        }
    }, [state.pendingDocumentsModalMode])

    return (
        <div className={styles.toolbar}>

            {/* File menu */}
            <div className={styles.group}>
                <div ref={fileMenuRef} style={{position: 'relative'}}>
                    <button
                        className={`${styles.btn} ${styles.formBtn}`}
                        title="File"
                        onClick={() => setShowFileMenu(v => !v)}
                    >
                        <FolderOpen size={14}/>
                        <span style={{fontSize: 12}}>File</span>
                        <ChevronDown size={10}/>
                    </button>
                    {showFileMenu && (
                        <div className={styles.formMenu} style={{minWidth: 160}}>
                            <button className={styles.formMenuItem} onClick={handleNew}>
                                <File size={13}/><span>New</span>
                            </button>
                            <button className={styles.formMenuItem}
                                    onClick={() => { if (!IS_TAURI) openDocumentsModal('open'); else setShowFileMenu(false) }}>
                                <FolderOpen size={13}/><span>Open...</span>
                            </button>
                            <div className={styles.formMenuDivider}/>
                            <button className={styles.formMenuItem} onClick={() => {
                                handleSave();
                                setShowFileMenu(false)
                            }}>
                                <Save size={13}/><span>Save</span>
                            </button>
                            <button className={styles.formMenuItem}
                                    onClick={() => { if (!IS_TAURI) openDocumentsModal('save-as'); else setShowFileMenu(false) }}>
                                <FilePlus2 size={13}/><span>Save As...</span>
                            </button>
                            <div className={styles.formMenuDivider}/>
                            <button className={styles.formMenuItem} onClick={() => {
                                dispatch({type: 'TOGGLE_PALETTE_MODAL'});
                                setShowFileMenu(false)
                            }}>
                                <Palette size={13}/><span>Edit Palettes...</span>
                            </button>
                            <button className={styles.formMenuItem} onClick={() => {
                                dispatch({type: 'TOGGLE_THEME_MODAL'});
                                setShowFileMenu(false)
                            }}>
                                <Paintbrush size={13}/><span>Edit Themes...</span>
                            </button>
                            <button className={styles.formMenuItem} onClick={() => {
                                dispatch({type: 'TOGGLE_SETTINGS_MODAL'});
                                setShowFileMenu(false)
                            }}>
                                <Settings size={13}/><span>Settings...</span>
                            </button>
                            <button className={styles.formMenuItem} onClick={() => {
                                dispatch({type: 'TOGGLE_DOCUMENT_SETTINGS_MODAL'});
                                setShowFileMenu(false)
                            }}>
                                <Grid size={13}/><span>Document Settings...</span>
                            </button>
                            <div className={styles.formMenuDivider}/>
                            {!IS_TAURI && <>
                                <button className={styles.formMenuItem} onClick={() => {
                                    handleImportJSON();
                                    setShowFileMenu(false)
                                }}>
                                    <Upload size={13}/><span>Import JSON...</span>
                                </button>
                                <button className={styles.formMenuItem} onClick={() => {
                                    downloadJSON(state.document);
                                    setShowFileMenu(false)
                                }}>
                                    <Download size={13}/><span>Export JSON...</span>
                                </button>
                            </>}
                            <button className={styles.formMenuItem} onClick={() => {
                                exportPageAsPng(state);
                                setShowFileMenu(false)
                            }}>
                                <FileImage size={13}/><span>Export PNG...</span>
                            </button>
                            <button className={styles.formMenuItem} onClick={() => {
                                exportDocumentAsPdf(state);
                                setShowFileMenu(false)
                            }}>
                                <Download size={13}/><span>Export PDF...</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.separator}/>

            {/* Document name */}
            {editingName ? (
                <input
                    autoFocus
                    value={nameInputValue}
                    onChange={e => setNameInputValue(e.target.value)}
                    onBlur={() => {
                        const name = nameInputValue.trim() || state.documentName
                        dispatch({type: 'SET_DOCUMENT_META', id: state.documentId, name})
                        setEditingName(false)
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') {
                            setEditingName(false)
                        }
                    }}
                    style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        width: 140,
                        height: 24,
                        border: '1px solid var(--color-accent)',
                        borderRadius: 4,
                        padding: '0 6px',
                        outline: 'none',
                        color: 'var(--color-text-primary)',
                        background: 'var(--color-bg-surface)'
                    }}
                />
            ) : (
                <span
                    title="Click to rename"
                    onClick={() => {
                        setNameInputValue(state.documentName);
                        setEditingName(true)
                    }}
                    style={{
                        fontWeight: 'bold',
                        color: 'var(--color-text-secondary)',
                        fontSize: 12,
                        padding: '0 8px',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'text',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }}
                >
          {state.documentName}
                    {state.isDirty && (
                        <span title="Unsaved changes" style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--color-accent)',
                            display: 'inline-block',
                            flexShrink: 0
                        }}/>
                    )}
        </span>
            )}

            <div className={styles.spacer}/>

            {/* Undo / Redo */}
            <div className={styles.group}>
                <button
                    className={styles.btn}
                    onClick={() => dispatch({type: 'UNDO'})}
                    disabled={!canUndo}
                    title="Undo (⌘Z)"
                ><Undo2 size={15}/></button>
                <button
                    className={styles.btn}
                    onClick={() => dispatch({type: 'REDO'})}
                    disabled={!canRedo}
                    title="Redo (⌘⇧Z)"
                ><Redo2 size={15}/></button>
            </div>

            <div className={styles.separator}/>

            {/* Select + Pan | Shapes + other tools */}
            <div className={styles.group}>
                <button
                    className={`${styles.btn} ${state.toolMode === 'select' ? styles.active : ''}`}
                    onClick={() => dispatch({type: 'SET_TOOL_MODE', mode: 'select'})}
                    title="Select (V)"
                ><MousePointer2 size={15}/></button>
                <button
                    className={`${styles.btn} ${state.toolMode === 'pan' ? styles.active : ''}`}
                    onClick={() => dispatch({type: 'SET_TOOL_MODE', mode: 'pan'})}
                    title="Pan (H)"
                ><Hand size={15}/></button>
            </div>

            <div className={styles.separator}/>

            <div className={styles.group}>
                {/* Shapes dropdown */}
                <div ref={shapesMenuRef} style={{position: 'relative'}}>
                    <button
                        className={`${styles.btn} ${styles.formBtn} ${SHAPE_MODES.has(state.toolMode) ? styles.active : ''}`}
                        title="Shapes"
                        onClick={() => setShowShapesMenu(v => !v)}
                    >
                        {activeShapeTool ? activeShapeTool.icon : <Square size={14}/>}
                        <ChevronDown size={10}/>
                    </button>
                    {showShapesMenu && (
                        <div className={styles.formMenu}>
                            {SHAPE_TOOLS.map(t => (
                                <button
                                    key={t.mode}
                                    className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                                    onClick={() => {
                                        dispatch({type: 'SET_TOOL_MODE', mode: t.mode});
                                        setShowShapesMenu(false)
                                    }}
                                >
                                    {t.icon}
                                    <span>{t.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Text + Image + Page */}
                <button
                    className={`${styles.btn} ${state.toolMode === 'insert-text' ? styles.active : ''}`}
                    onClick={() => dispatch({type: 'SET_TOOL_MODE', mode: 'insert-text'})}
                    title="Text"
                ><Type size={15}/></button>
                <button
                    className={`${styles.btn} ${state.toolMode === 'insert-image' ? styles.active : ''}`}
                    onClick={() => dispatch({type: 'SET_TOOL_MODE', mode: 'insert-image'})}
                    title="Image"
                ><Image size={15}/></button>
                <button
                    className={styles.btn}
                    onClick={() => {
                        const page = createShape('page')
                        dispatch({type: 'ADD_SHAPE', parentId: null, shape: page})
                        dispatch({type: 'SET_ACTIVE_PAGE', pageId: page.id})
                    }}
                    title="Add Page"
                ><FileText size={15}/></button>

                {/* Components dropdown */}
                <div ref={componentMenuRef} style={{position: 'relative'}}>
                    <button
                        className={`${styles.btn} ${styles.formBtn} ${COMPONENT_MODES.has(state.toolMode) ? styles.active : ''}`}
                        title="Components"
                        onClick={() => setShowComponentMenu(v => !v)}
                    >
                        {activeComponentTool ? activeComponentTool.icon :
                            <RectangleHorizontal size={14}/>}
                        <ChevronDown size={10}/>
                    </button>
                    {showComponentMenu && (
                        <div className={styles.formMenu} onMouseLeave={scheduleSubMenuClose}>
                            {/* Containers sub-menu item */}
                            <div
                                className={styles.formMenuItem}
                                style={{
                                    justifyContent: 'space-between',
                                    cursor: 'default',
                                    position: 'relative'
                                }}
                                onMouseEnter={() => {
                                    cancelSubMenuClose();
                                    setComponentSubMenu('containers')
                                }}
                            >
                                <span>Containers</span>
                                <span style={{opacity: 0.5, fontSize: 10}}>›</span>
                                {componentSubMenu === 'containers' && (
                                    <div
                                        className={styles.formMenu}
                                        style={{position: 'absolute', left: '100%', top: 0}}
                                        onMouseEnter={cancelSubMenuClose}
                                        onMouseLeave={scheduleSubMenuClose}
                                    >
                                        {CONTAINER_CONTROLS.map(t => (
                                            <button
                                                key={t.mode}
                                                className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                                                onClick={() => {
                                                    dispatch({type: 'SET_TOOL_MODE', mode: t.mode});
                                                    setShowComponentMenu(false);
                                                    setComponentSubMenu(null)
                                                }}
                                            >
                                                {t.icon}
                                                <span>{t.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Form Controls sub-menu item */}
                            <div
                                className={styles.formMenuItem}
                                style={{
                                    justifyContent: 'space-between',
                                    cursor: 'default',
                                    position: 'relative'
                                }}
                                onMouseEnter={() => {
                                    cancelSubMenuClose();
                                    setComponentSubMenu('forms')
                                }}
                            >
                                <span>Form Controls</span>
                                <span style={{opacity: 0.5, fontSize: 10}}>›</span>
                                {componentSubMenu === 'forms' && (
                                    <div
                                        className={styles.formMenu}
                                        style={{position: 'absolute', left: '100%', top: 0}}
                                        onMouseEnter={cancelSubMenuClose}
                                        onMouseLeave={scheduleSubMenuClose}
                                    >
                                        {FORM_CONTROLS.map(t => (
                                            <button
                                                key={t.mode}
                                                className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                                                onClick={() => {
                                                    dispatch({type: 'SET_TOOL_MODE', mode: t.mode});
                                                    setShowComponentMenu(false);
                                                    setComponentSubMenu(null)
                                                }}
                                            >
                                                {t.icon}
                                                <span>{t.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.separator}/>

            {/* Grid toggle */}
            <div className={styles.group}>
                <button
                    className={`${styles.btn} ${state.document.gridSettings.snapEnabled ? styles.active : ''}`}
                    title="Toggle grid snap"
                    onClick={() => dispatch({
                        type: 'UPDATE_GRID_SETTINGS',
                        patch: {snapEnabled: !state.document.gridSettings.snapEnabled}
                    })}
                ><Grid size={15}/></button>
                <button
                    className={`${styles.btn} ${state.document.gridSettings.snapAlignment ?? true ? styles.active : ''}`}
                    title="Toggle snap to shapes and guides"
                    onClick={() => dispatch({
                        type: 'UPDATE_GRID_SETTINGS',
                        patch: {snapAlignment: !(state.document.gridSettings.snapAlignment ?? true)}
                    })}
                ><Magnet size={15}/></button>
            </div>

            <div className={styles.separator}/>

            {/* Zoom controls */}
            <div className={styles.group}>
                <button
                    className={styles.btn}
                    title="Zoom out"
                    onClick={() => {
                        const presets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]
                        const cur = state.viewTransform.zoom
                        const next = [...presets].reverse().find(z => z < cur - 0.01) ?? presets[0]
                        dispatch({
                            type: 'ZOOM_TO',
                            zoom: next,
                            origin: {x: window.innerWidth / 2, y: window.innerHeight / 2 - 20}
                        })
                    }}
                ><ZoomOut size={15}/></button>
                <select
                    className={styles.zoomSelect}
                    value={Math.round(state.viewTransform.zoom * 100)}
                    onChange={e => {
                        const zoom = parseInt(e.target.value) / 100
                        dispatch({
                            type: 'ZOOM_TO',
                            zoom,
                            origin: {x: window.innerWidth / 2, y: window.innerHeight / 2 - 20}
                        })
                    }}
                >
                    {[25, 50, 75, 100, 150, 200, 300, 400].map(pct => (
                        <option key={pct} value={pct}>{pct}%</option>
                    ))}
                    {![25, 50, 75, 100, 150, 200, 300, 400].includes(Math.round(state.viewTransform.zoom * 100)) && (
                        <option value={Math.round(state.viewTransform.zoom * 100)}>
                            {Math.round(state.viewTransform.zoom * 100)}%
                        </option>
                    )}
                </select>
                <button
                    className={styles.btn}
                    title="Zoom in"
                    onClick={() => {
                        const presets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]
                        const cur = state.viewTransform.zoom
                        const next = presets.find(z => z > cur + 0.01) ?? presets[presets.length - 1]
                        dispatch({
                            type: 'ZOOM_TO',
                            zoom: next,
                            origin: {x: window.innerWidth / 2, y: window.innerHeight / 2 - 20}
                        })
                    }}
                ><ZoomIn size={15}/></button>
                <button className={styles.btn} onClick={() => dispatch({type: 'RESET_VIEW'})}
                        title="Reset view">
                    <Home size={15}/>
                </button>
            </div>

            <div className={styles.spacer}/>

            {/* Dark mode toggle */}
            <div className={styles.group}>
                <button
                    className={styles.btn}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}</button>
            </div>

            <div className={styles.separator}/>

            {/* Help */}
            <div className={styles.group}>
                <button
                    className={styles.btn}
                    onClick={() => dispatch({type: 'TOGGLE_SHORTCUTS_MODAL'})}
                    title="Keyboard shortcuts (?)"
                ><HelpCircle size={15}/></button>
            </div>

            {showDocumentsModal && (
                <DocumentsModal
                    mode={documentsModalMode}
                    currentName={state.documentName}
                    onClose={() => setShowDocumentsModal(false)}
                    onLoad={handleLoadDoc}
                    onSave={handleSaveAs}
                />
            )}
            {state.showPaletteModal && (
                <PaletteEditorModal onClose={() => dispatch({type: 'TOGGLE_PALETTE_MODAL'})}/>
            )}
            {state.showGradientModal && (
                <GradientEditorModal onClose={() => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})}/>
            )}
            {state.showSketchStyleModal && (
                <SketchStyleEditorModal onClose={() => dispatch({type: 'TOGGLE_SKETCH_STYLE_MODAL'})}/>
            )}
            <ThemeEditorModal/>
            {state.showDocumentSettingsModal && (
                <DocumentSettingsModal
                    onClose={() => dispatch({type: 'TOGGLE_DOCUMENT_SETTINGS_MODAL'})}/>
            )}
        </div>
    )
}
