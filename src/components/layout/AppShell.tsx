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
    const [leftCollapsed, setLeftCollapsed] = useState(false)
    const [rightCollapsed, setRightCollapsed] = useState(false)

    const onResizeLeft = useCallback((delta: number) => {
        setLeftWidth(w => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)))
    }, [])

    const onResizeRight = useCallback((delta: number) => {
        setRightWidth(w => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)))
    }, [])

    return (
        <div className={styles.shell}>
            <div className={styles.toolbar}>
                <Toolbar/>
            </div>
            <div className={styles.body}>
                {!leftCollapsed && (
                    <>
                        <div className={styles.sidebar} style={{flex: `0 0 ${leftWidth}px`}}>
                            <TreePanel/>
                        </div>
                        <ResizeHandle onResize={onResizeLeft} side="left"/>
                    </>
                )}
                <div className={styles.canvas}>
                    <CanvasView/>
                </div>
                {/*<SelectionPanel/>*/}
                {!rightCollapsed && (
                    <>
                        <ResizeHandle onResize={onResizeRight} side="right"/>
                        <div className={styles.properties} style={{flex: `0 0 ${rightWidth}px`}}>
                            <PropertiesPanel/>
                        </div>
                    </>
                )}
            </div>
            <StatusBar
                leftCollapsed={leftCollapsed}
                rightCollapsed={rightCollapsed}
                onToggleLeft={() => setLeftCollapsed(c => !c)}
                onToggleRight={() => setRightCollapsed(c => !c)}
            />
            <ShortcutsModal/>
            <SettingsModal/>
        </div>
    )
}
