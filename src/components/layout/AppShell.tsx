import {CanvasView} from '@components/canvas/CanvasView'
import {PropertiesPanel} from '@components/properties/PropertiesPanel'
import {Toolbar} from '@components/toolbar/Toolbar'
import {TreePanel} from '@components/tree/TreePanel'
import {useDynamicFonts} from '@hooks/useDynamicFonts'
import {useFontMetadataEnrichment} from '@hooks/useFontMetadataEnrichment'
import {useAppDispatch, useAppState} from '@store/context'
import {useCallback, useEffect, useRef, useState} from 'react'
import styles from './AppShell.module.css'
import {ResizeHandle} from './ResizeHandle'
import {SettingsModal} from './SettingsModal'
import {ShortcutIndicator} from './ShortcutIndicator'
import {ShortcutsModal} from './ShortcutsModal'
import {LogConsole} from './LogConsole'
import {StatusBar} from './StatusBar'

const MIN_SIDEBAR = 150
const MAX_SIDEBAR = 500
const MIN_LOG_CONSOLE = 140
const MAX_LOG_CONSOLE = 420

export function AppShell() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    useDynamicFonts(state.document.customFonts)
    useFontMetadataEnrichment(state.document.customFonts, dispatch)

    const [leftWidth, setLeftWidth] = useState(220)
    const [rightWidth, setRightWidth] = useState(300)
    const [logConsoleHeight, setLogConsoleHeight] = useState(260)
    const logResizeDrag = useRef<{startY: number; startHeight: number} | null>(null)

    useEffect(() => {
        if (window.innerWidth < 768) {
            if (state.leftPanelVisible) dispatch({type: 'TOGGLE_LEFT_PANEL'})
            if (state.rightPanelVisible) dispatch({type: 'TOGGLE_RIGHT_PANEL'})
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const onResizeLeft = useCallback((delta: number) => {
        setLeftWidth(w => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)))
    }, [])

    const onResizeRight = useCallback((delta: number) => {
        setRightWidth(w => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)))
    }, [])

    const onLogResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault()
        logResizeDrag.current = {startY: e.clientY, startHeight: logConsoleHeight}
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [logConsoleHeight])

    const onLogResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!logResizeDrag.current) return
        const delta = logResizeDrag.current.startY - e.clientY
        setLogConsoleHeight(Math.max(MIN_LOG_CONSOLE, Math.min(MAX_LOG_CONSOLE, logResizeDrag.current.startHeight + delta)))
    }, [])

    const onLogResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        logResizeDrag.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
    }, [])

    const panelOpacity = state.settings.panelOpacity ?? 0.92
    const panelStyle = {'--panel-opacity': panelOpacity} as React.CSSProperties

    return (
        <div className={styles.shell}>
            <div className={styles.toolbar}>
                <Toolbar/>
            </div>
            <div className={styles.body}>
                <div className={styles.canvas}>
                    <CanvasView/>
                </div>
                {state.leftPanelVisible && (
                    <div className={styles.sidebarOverlay} style={{...panelStyle, width: leftWidth}}>
                        <div className={styles.panelContent}>
                            <TreePanel/>
                        </div>
                        <ResizeHandle onResize={onResizeLeft} side="left"/>
                    </div>
                )}
                {state.rightPanelVisible && (
                    <div className={styles.propertiesOverlay} style={{...panelStyle, width: rightWidth}}>
                        <ResizeHandle onResize={onResizeRight} side="right"/>
                        <div className={styles.panelContent}>
                            <PropertiesPanel/>
                        </div>
                    </div>
                )}
            </div>
            {state.showLogConsole && (
                <div
                    className={styles.logConsoleResizeHandle}
                    onPointerDown={onLogResizePointerDown}
                    onPointerMove={onLogResizePointerMove}
                    onPointerUp={onLogResizePointerUp}
                    title="Resize log console"
                >
                    <span/>
                </div>
            )}
            <LogConsole height={state.showLogConsole ? logConsoleHeight : undefined}/>
            <StatusBar/>
            <ShortcutsModal/>
            <SettingsModal/>
            <ShortcutIndicator/>
        </div>
    )
}
