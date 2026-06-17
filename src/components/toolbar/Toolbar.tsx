import {DocumentSettingsModal} from '@components/layout/DocumentSettingsModal'
import {DocumentsModal} from '@components/layout/DocumentsModal'
import {GradientEditorModal} from '@components/layout/GradientEditorModal'
import {SketchStyleEditorModal} from '@components/layout/SketchStyleEditorModal'
import {ThemeEditorModal} from '@components/layout/ThemeEditorModal'
import {PaletteEditorModal} from '@components/palette/PaletteEditorModal'
import {useTheme} from '@hooks/useTheme'
import {notifyPowerUpsDocumentSaved} from '@hooks/usePowerUpsRuntime'
import type {VibeDocument} from '@model/document'
import {getActivePowerUpMenuActions, getActivePowerUpToolbarActions, listAvailablePowerUps, runPowerUpMenuAction, runPowerUpToolbarAction} from '@powerups/registry'
import {useShapeRegistry} from '@powerups/shapeRegistry'
import {useAppDispatch, useAppState} from '@store/context'
import {createInitialDocument} from '@store/reducer'
import type {ToolMode} from '@store/types'
import {exportDocumentAsPdf} from '@utils/exportPdf'
import {exportPageAsPng, renderPageToBytes} from '@utils/exportPng'
import {encodeLimnPng, downloadLimnFile, uploadLimnFile} from '@utils/limnFile'
import {saveDoc} from '@utils/localStorageDB'
import {downloadJSON, fromJSON, uploadJSON} from '@utils/serialization'
import {createShape} from '@utils/shapeFactory'
import {appLogger, importerLogger} from '@logging'
import {
    ChevronDown,
    Circle,
    Download,
    File,
    FileImage,
    FilePlus2,
    FileText,
    FolderOpen,
    Grid,
    Grid2X2,
    Hand,
    HelpCircle,
    Home,
    Image,
    Magnet,
    Minus,
    Moon,
    MousePointer2,
    Paintbrush,
    Palette,
    RectangleHorizontal,
    Redo2,
    Save,
    Settings,
    Search,
    StopCircle,
    Square,
    Sun,
    Type,
    Undo2,
    Upload,
    ZoomIn,
    ZoomOut,
} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'
import styles from './Toolbar.module.css'

interface ToolButton {
    mode: string
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

export function Toolbar() {
    const {state, canUndo, canRedo} = useAppState()
    const dispatch = useAppDispatch()
    const registeredShapes = useShapeRegistry()
    const containerTools: ToolButton[] = registeredShapes
        .filter(s => s.category === 'containers')
        .map(s => ({mode: s.toolMode, icon: s.icon, title: s.name}))
    const formTools: ToolButton[] = registeredShapes
        .filter(s => s.category === 'forms')
        .map(s => ({mode: s.toolMode, icon: s.icon, title: s.name}))
    const allComponentTools = [...containerTools, ...formTools]
    const componentModes = new Set(allComponentTools.map(t => t.mode))
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
    const [showEditMenu, setShowEditMenu] = useState(false)
    const [showViewMenu, setShowViewMenu] = useState(false)
    const [showPowerUpsMenu, setShowPowerUpsMenu] = useState(false)
    const [showAboutModal, setShowAboutModal] = useState(false)
    const [showDocumentsModal, setShowDocumentsModal] = useState(false)
    const [documentsModalMode, setDocumentsModalMode] = useState<'open' | 'save-as'>('open')
    const [editingName, setEditingName] = useState(false)
    const [nameInputValue, setNameInputValue] = useState('')

    const [theme, toggleTheme] = useTheme()
    const fileMenuRef = useRef<HTMLDivElement>(null)
    const editMenuRef = useRef<HTMLDivElement>(null)
    const viewMenuRef = useRef<HTMLDivElement>(null)
    const powerUpsMenuRef = useRef<HTMLDivElement>(null)
    const shapesMenuRef = useRef<HTMLDivElement>(null)
    const componentMenuRef = useRef<HTMLDivElement>(null)

    // Close any open menu when clicking outside (but not inside the menu itself)
    const anyMenuOpen = showFileMenu || showEditMenu || showViewMenu || showPowerUpsMenu || showShapesMenu || showComponentMenu
    useEffect(() => {
        if (!anyMenuOpen) return
        const handler = (e: PointerEvent) => {
            if (fileMenuRef.current?.contains(e.target as Node)) return
            if (editMenuRef.current?.contains(e.target as Node)) return
            if (viewMenuRef.current?.contains(e.target as Node)) return
            if (powerUpsMenuRef.current?.contains(e.target as Node)) return
            if (shapesMenuRef.current?.contains(e.target as Node)) return
            if (componentMenuRef.current?.contains(e.target as Node)) return
            setShowFileMenu(false)
            setShowEditMenu(false)
            setShowViewMenu(false)
            setShowPowerUpsMenu(false)
            setShowShapesMenu(false)
            setShowComponentMenu(false)
            setComponentSubMenu(null)
        }
        window.addEventListener('pointerdown', handler, {capture: true})
        return () => window.removeEventListener('pointerdown', handler, {capture: true})
    }, [anyMenuOpen])


    const activeShapeTool = SHAPE_TOOLS.find(t => t.mode === state.toolMode)
    const activeComponentTool = allComponentTools.find(t => t.mode === state.toolMode)
    const powerUpToolbarActions = getActivePowerUpToolbarActions(state.document)
    const powerUpMenuActions = getActivePowerUpMenuActions(state.document)
    const availablePowerUps = listAvailablePowerUps()
    const activePowerUpIds = new Set((state.document.powerUps ?? []).map(powerUp => powerUp.id))

    const handleSave = async () => {
        if (IS_TAURI) return  // Tauri saves are handled by the native menu via useTauriMenu
        try {
            const entry = saveDoc(state.documentId, state.documentName, state.document)
            dispatch({type: 'SET_DOCUMENT_META', id: entry.id, name: entry.name})
            await notifyPowerUpsDocumentSaved(state, dispatch)
        } catch (err) {
            appLogger.error('Save failed', err)
            alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleImportJSON = async () => {
        try {
            importerLogger.info('Importing JSON document')
            const json = await uploadJSON()
            const doc = fromJSON(json)
            dispatch({type: 'LOAD_DOCUMENT', document: doc})
            const firstPage = doc.rootNodes[0]?.id ?? null
            dispatch({type: 'SET_ACTIVE_PAGE', pageId: firstPage})
            dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
            importerLogger.info('Imported JSON document', {rootNodes: doc.rootNodes.length, shapeCount: Object.keys(doc.shapes).length})
        } catch (err) {
            importerLogger.error('Failed to import JSON document', err)
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
            notifyPowerUpsDocumentSaved(state, dispatch).catch(err => {
                appLogger.error('Failed to notify power-ups after save', err)
            })
            setShowDocumentsModal(false)
        } catch (err) {
            appLogger.error('Save As failed', err)
            alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleSaveLimnFile = async () => {
        setShowFileMenu(false)
        try {
            const thumbnailBytes = await renderPageToBytes(state)
            const pngBytes = encodeLimnPng(thumbnailBytes, state.document)
            downloadLimnFile(pngBytes, `${state.documentName || 'document'}.limn.png`)
        } catch (err) {
            appLogger.error('Save as Limn failed', err)
            alert('Save as Limn failed: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleOpenLimnFile = async () => {
        setShowFileMenu(false)
        try {
            const {doc} = await uploadLimnFile()
            dispatch({type: 'LOAD_DOCUMENT', document: doc})
            dispatch({type: 'SET_ACTIVE_PAGE', pageId: doc.rootNodes[0]?.id ?? null})
            dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
        } catch (err) {
            appLogger.error('Open Limn failed', err)
            alert('Open Limn failed: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const handleNew = () => {
        const doc = createInitialDocument()
        dispatch({type: 'LOAD_DOCUMENT', document: doc})
        dispatch({type: 'SET_ACTIVE_PAGE', pageId: doc.rootNodes[0]?.id ?? null})
        dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
        setShowFileMenu(false)
        setShowEditMenu(false)
        setShowViewMenu(false)
        setShowPowerUpsMenu(false)
    }

    const openDocumentsModal = (mode: 'open' | 'save-as') => {
        setDocumentsModalMode(mode)
        setShowDocumentsModal(true)
        setShowFileMenu(false)
        setShowEditMenu(false)
        setShowViewMenu(false)
        setShowPowerUpsMenu(false)
    }

    useEffect(() => {
        if (state.pendingDocumentsModalMode) {
            openDocumentsModal(state.pendingDocumentsModalMode)
            dispatch({type: 'CLEAR_DOCUMENTS_MODAL_REQUEST'})
        }
    }, [state.pendingDocumentsModalMode])

    return (
        <div className={styles.toolbar}>

            {/* Menu bar — web only; Tauri uses the native menu bar */}
            {!IS_TAURI && (
                <>
                    <div className={`${styles.group} ${styles.menuBar}`}>
                        {/* File menu */}
                        <div ref={fileMenuRef} style={{position: 'relative'}}>
                            <button
                                className={`${styles.btn} ${styles.formBtn}`}
                                title="File"
                                onClick={() => {
                                    setShowFileMenu(v => !v)
                                    setShowEditMenu(false)
                                    setShowViewMenu(false)
                                    setShowPowerUpsMenu(false)
                                }}
                            >
                                <span style={{fontSize: 12}}>File</span>
                                <ChevronDown size={10}/>
                            </button>
                            {showFileMenu && (
                                <div className={styles.formMenu} style={{minWidth: 180}}>
                                    <button className={styles.formMenuItem} onClick={handleNew}>
                                        <File size={13}/><span>New</span><span className={styles.menuShortcut}>⌘N</span>
                                    </button>
                                    <button className={styles.formMenuItem}
                                            onClick={() => openDocumentsModal('open')}>
                                        <FolderOpen size={13}/><span>Open...</span><span className={styles.menuShortcut}>⌘O</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        handleSave();
                                        setShowFileMenu(false)
                                    }}>
                                        <Save size={13}/><span>Save</span><span className={styles.menuShortcut}>⌘S</span>
                                    </button>
                                    <button className={styles.formMenuItem}
                                            onClick={() => openDocumentsModal('save-as')}>
                                        <FilePlus2 size={13}/><span>Save As...</span><span className={styles.menuShortcut}>⌘⇧S</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
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
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={handleSaveLimnFile}>
                                        <FileImage size={13}/><span>Save as Limn...</span>
                                    </button>
                                    <button className={styles.formMenuItem} onClick={handleOpenLimnFile}>
                                        <Image size={13}/><span>Open Limn...</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        setShowFileMenu(false);
                                        setShowAboutModal(true)
                                    }}>
                                        <HelpCircle size={13}/><span>About...</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Edit menu */}
                        <div ref={editMenuRef} style={{position: 'relative'}}>
                            <button
                                className={`${styles.btn} ${styles.formBtn}`}
                                title="Edit"
                                onClick={() => {
                                    setShowEditMenu(v => !v)
                                    setShowFileMenu(false)
                                    setShowViewMenu(false)
                                    setShowPowerUpsMenu(false)
                                }}
                            >
                                <span style={{fontSize: 12}}>Edit</span>
                                <ChevronDown size={10}/>
                            </button>
                            {showEditMenu && (
                                <div className={styles.formMenu} style={{minWidth: 200}}>
                                    <button className={styles.formMenuItem}
                                            disabled={!canUndo}
                                            onClick={() => {
                                                dispatch({type: 'UNDO'});
                                                setShowEditMenu(false)
                                            }}>
                                        <Undo2 size={13}/><span>Undo</span><span className={styles.menuShortcut}>⌘Z</span>
                                    </button>
                                    <button className={styles.formMenuItem}
                                            disabled={!canRedo}
                                            onClick={() => {
                                                dispatch({type: 'REDO'});
                                                setShowEditMenu(false)
                                            }}>
                                        <Redo2 size={13}/><span>Redo</span><span className={styles.menuShortcut}>⌘⇧Z</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_PALETTE_MODAL'});
                                        setShowEditMenu(false)
                                    }}>
                                        <Palette size={13}/><span>Edit Palettes...</span>
                                    </button>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_THEME_MODAL'});
                                        setShowEditMenu(false)
                                    }}>
                                        <Paintbrush size={13}/><span>Edit Themes...</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_SETTINGS_MODAL'});
                                        setShowEditMenu(false)
                                    }}>
                                        <Settings size={13}/><span>Settings...</span>
                                    </button>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_DOCUMENT_SETTINGS_MODAL'});
                                        setShowEditMenu(false)
                                    }}>
                                        <Grid size={13}/><span>Document Settings...</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* View menu */}
                        <div ref={viewMenuRef} style={{position: 'relative'}}>
                            <button
                                className={`${styles.btn} ${styles.formBtn}`}
                                title="View"
                                onClick={() => {
                                    setShowViewMenu(v => !v)
                                    setShowFileMenu(false)
                                    setShowEditMenu(false)
                                    setShowPowerUpsMenu(false)
                                }}
                            >
                                <span style={{fontSize: 12}}>View</span>
                                <ChevronDown size={10}/>
                            </button>
                            {showViewMenu && (
                                <div className={styles.formMenu} style={{minWidth: 200}}>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_LEFT_PANEL'});
                                        setShowViewMenu(false)
                                    }}>
                                        <span>{state.leftPanelVisible ? 'Hide Layer Panel' : 'Show Layer Panel'}</span>
                                    </button>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_RIGHT_PANEL'});
                                        setShowViewMenu(false)
                                    }}>
                                        <span>{state.rightPanelVisible ? 'Hide Properties Panel' : 'Show Properties Panel'}</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({
                                            type: 'UPDATE_GRID_SETTINGS',
                                            patch: {snapEnabled: !state.document.gridSettings.snapEnabled}
                                        });
                                        setShowViewMenu(false)
                                    }}>
                                        <Grid size={13}/>
                                        <span>{state.document.gridSettings.snapEnabled ? 'Hide Grid' : 'Show Grid'}</span>
                                    </button>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({
                                            type: 'UPDATE_GRID_SETTINGS',
                                            patch: {snapAlignment: !(state.document.gridSettings.snapAlignment ?? true)}
                                        });
                                        setShowViewMenu(false)
                                    }}>
                                        <Magnet size={13}/>
                                        <span>{(state.document.gridSettings.snapAlignment ?? true) ? 'Disable Snap' : 'Enable Snap'}</span>
                                    </button>
                                    <div className={styles.formMenuDivider}/>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        toggleTheme();
                                        setShowViewMenu(false)
                                    }}>
                                        {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
                                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    </button>
                                    <button className={styles.formMenuItem} onClick={() => {
                                        dispatch({type: 'TOGGLE_LOG_CONSOLE'});
                                        setShowViewMenu(false)
                                    }}>
                                        <Search size={13}/>
                                        <span>{state.showLogConsole ? 'Hide Log Console' : 'Show Log Console'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Powerups menu */}
                        <div ref={powerUpsMenuRef} style={{position: 'relative'}}>
                            <button
                                className={`${styles.btn} ${styles.formBtn}`}
                                title="Powerups"
                                onClick={() => {
                                    setShowPowerUpsMenu(v => !v)
                                    setShowFileMenu(false)
                                    setShowEditMenu(false)
                                    setShowViewMenu(false)
                                }}
                            >
                                <span style={{fontSize: 12}}>Powerups</span>
                                <ChevronDown size={10}/>
                            </button>
                            {showPowerUpsMenu && (
                                <div className={styles.formMenu} style={{minWidth: 220}}>
                                    <div className={styles.formMenuSection}>Add to Document</div>
                                    {availablePowerUps.map(powerUp => (
                                        <button
                                            key={powerUp.id}
                                            className={styles.formMenuItem}
                                            disabled={activePowerUpIds.has(powerUp.id)}
                                            onClick={() => {
                                                dispatch({
                                                    type: 'ADD_DOCUMENT_POWER_UP',
                                                    powerUpId: powerUp.id
                                                })
                                                setShowPowerUpsMenu(false)
                                            }}
                                        >
                                            <span>{powerUp.name}</span>
                                        </button>
                                    ))}

                                    <div className={styles.formMenuDivider}/>
                                    <div className={styles.formMenuSection}>Remove from Document</div>
                                    {availablePowerUps.map(powerUp => (
                                        <button
                                            key={`remove-${powerUp.id}`}
                                            className={styles.formMenuItem}
                                            disabled={!activePowerUpIds.has(powerUp.id)}
                                            onClick={() => {
                                                dispatch({
                                                    type: 'REMOVE_DOCUMENT_POWER_UP',
                                                    powerUpId: powerUp.id
                                                })
                                                setShowPowerUpsMenu(false)
                                            }}
                                        >
                                            <span>Remove {powerUp.name}</span>
                                        </button>
                                    ))}

                                    {powerUpMenuActions.length > 0 && (
                                        <>
                                            <div className={styles.formMenuDivider}/>
                                            <div className={styles.formMenuSection}>Power Up Actions</div>
                                            {powerUpMenuActions.map(action => (
                                                <button
                                                    key={action.id}
                                                    className={styles.formMenuItem}
                                                    disabled={action.isEnabled ? !action.isEnabled({state, dispatch}) : false}
                                                    onClick={() => {
                                                runPowerUpMenuAction(action, {state, dispatch})
                                                    .catch(err => appLogger.error(`Power-up menu action failed: ${action.id}`, err))
                                                        setShowPowerUpsMenu(false)
                                                    }}
                                                >
                                                    <span>{action.title}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.separator}/>
                </>
            )}

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
                    className={styles.docName}
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

            {powerUpToolbarActions.length > 0 && (
                <>
                    <div className={styles.group}>
                        {powerUpToolbarActions.map(action => {
                            const isPhysicsAction = action.id === 'physics-simulate'
                            const icon = isPhysicsAction && state.physicsSimulationRunning
                                ? <StopCircle size={15}/>
                                : action.icon
                            const title = isPhysicsAction && state.physicsSimulationRunning
                                ? 'Stop Physics'
                                : action.title
                            return (
                            <button
                                key={action.id}
                                className={`${styles.btn} ${isPhysicsAction && state.physicsSimulationRunning ? styles.btnDanger : ''}`}
                                title={title}
                                disabled={action.isEnabled ? !action.isEnabled({state, dispatch}) : false}
                                onClick={() => runPowerUpToolbarAction(action, {state, dispatch}).catch(err => appLogger.error(`Power-up toolbar action failed: ${action.id}`, err))}
                            >
                                {icon}
                            </button>
                            )
                        })}
                    </div>
                    <div className={styles.separator}/>
                </>
            )}

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

                {/* Components dropdown — only shown when forms powerup is active */}
                {allComponentTools.length > 0 && <div ref={componentMenuRef} style={{position: 'relative'}}>
                    <button
                        className={`${styles.btn} ${styles.formBtn} ${componentModes.has(state.toolMode) ? styles.active : ''}`}
                        title="Components"
                        onClick={() => setShowComponentMenu(v => !v)}
                    >
                        {activeComponentTool ? activeComponentTool.icon :
                            <RectangleHorizontal size={14}/>}
                        <ChevronDown size={10}/>
                    </button>
                    {showComponentMenu && allComponentTools.length > 0 && (
                        <div className={styles.formMenu} onMouseLeave={scheduleSubMenuClose}>
                            {containerTools.length > 0 && (
                                <div
                                    className={styles.formMenuItem}
                                    style={{justifyContent: 'space-between', cursor: 'default', position: 'relative'}}
                                    onMouseEnter={() => { cancelSubMenuClose(); setComponentSubMenu('containers') }}
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
                                            {containerTools.map(t => (
                                                <button
                                                    key={t.mode}
                                                    className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                                                    onClick={() => {
                                                        dispatch({type: 'SET_TOOL_MODE', mode: t.mode as ToolMode});
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
                            )}
                            {formTools.length > 0 && (
                                <div
                                    className={styles.formMenuItem}
                                    style={{justifyContent: 'space-between', cursor: 'default', position: 'relative'}}
                                    onMouseEnter={() => { cancelSubMenuClose(); setComponentSubMenu('forms') }}
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
                                            {formTools.map(t => (
                                                <button
                                                    key={t.mode}
                                                    className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                                                    onClick={() => {
                                                        dispatch({type: 'SET_TOOL_MODE', mode: t.mode as ToolMode});
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
                            )}
                        </div>
                    )}
                </div>}
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

            {showAboutModal && (
                <div
                    style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    onClick={() => setShowAboutModal(false)}
                >
                    <div
                        style={{background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '24px 28px', minWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'}}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{fontWeight: 'bold', fontSize: 15, marginBottom: 12}}>Limn</div>
                        <div style={{fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4}}>Version {__APP_VERSION__}</div>
                        <div style={{fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16}}>Built {__BUILD_TIME__}</div>
                        <button style={{fontSize: 12}} onClick={() => setShowAboutModal(false)}>Close</button>
                    </div>
                </div>
            )}
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
