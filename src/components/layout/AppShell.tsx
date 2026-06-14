import {CanvasView} from '@components/canvas/CanvasView'
import {PropertiesPanel} from '@components/properties/PropertiesPanel'
import {Toolbar} from '@components/toolbar/Toolbar'
import {TreePanel} from '@components/tree/TreePanel'
import {useDynamicFonts} from '@hooks/useDynamicFonts'
import {useFontMetadataEnrichment} from '@hooks/useFontMetadataEnrichment'
import {useAppDispatch, useAppState} from '@store/context'
import {useCallback, useState} from 'react'
import styles from './AppShell.module.css'
import {ResizeHandle} from './ResizeHandle'
import {SettingsModal} from './SettingsModal'
import {ShortcutIndicator} from './ShortcutIndicator'
import {ShortcutsModal} from './ShortcutsModal'
import {StatusBar} from './StatusBar'

const MIN_SIDEBAR = 150
const MAX_SIDEBAR = 500

export function AppShell() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    useDynamicFonts(state.document.customFonts)
    useFontMetadataEnrichment(state.document.customFonts, dispatch)

    const [leftWidth, setLeftWidth] = useState(220)
    const [rightWidth, setRightWidth] = useState(300)

    const onResizeLeft = useCallback((delta: number) => {
        setLeftWidth(w => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)))
    }, [])

    const onResizeRight = useCallback((delta: number) => {
        setRightWidth(w => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)))
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
            <StatusBar/>
            <ShortcutsModal/>
            <SettingsModal/>
            <ShortcutIndicator/>
        </div>
    )
}
