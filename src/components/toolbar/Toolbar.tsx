import {
  MousePointer2, Hand, Square, Circle, Minus, Type, Image,
  RectangleHorizontal, PanelLeft, SlidersHorizontal, FileText,
  Undo2, Redo2, Home, FolderOpen, Save,
} from 'lucide-react'
import { useAppState, useAppDispatch } from '@store/context'
import type { ToolMode } from '@store/types'
import { downloadJSON, uploadJSON, fromJSON } from '@utils/serialization'
import styles from './Toolbar.module.css'

interface ToolButton {
  mode: ToolMode
  icon: React.ReactNode
  title: string
}

const TOOLS: ToolButton[] = [
  { mode: 'select',        icon: <MousePointer2 size={15} />, title: 'Select (V)' },
  { mode: 'pan',           icon: <Hand size={15} />,          title: 'Pan (H)' },
  { mode: 'insert-rect',   icon: <Square size={15} />,        title: 'Rectangle' },
  { mode: 'insert-circle', icon: <Circle size={15} />,        title: 'Circle' },
  { mode: 'insert-line',   icon: <Minus size={15} />,         title: 'Line / Connector' },
  { mode: 'insert-text',   icon: <Type size={15} />,          title: 'Text' },
  { mode: 'insert-image',  icon: <Image size={15} />,         title: 'Image' },
  { mode: 'insert-button', icon: <RectangleHorizontal size={15} />, title: 'Button' },
  { mode: 'insert-panel',  icon: <PanelLeft size={15} />,     title: 'Panel' },
  { mode: 'insert-slider', icon: <SlidersHorizontal size={15} />, title: 'Slider' },
  { mode: 'insert-page',   icon: <FileText size={15} />,      title: 'Page' },
]

export function Toolbar() {
  const { state, canUndo, canRedo } = useAppState()
  const dispatch = useAppDispatch()

  const handleSave = () => {
    downloadJSON(state.document)
  }

  const handleLoad = async () => {
    try {
      const json = await uploadJSON()
      const doc = fromJSON(json)
      dispatch({ type: 'LOAD_DOCUMENT', document: doc })
      const firstPage = doc.rootNodes[0]?.id ?? null
      dispatch({ type: 'SET_ACTIVE_PAGE', pageId: firstPage })
    } catch (err) {
      alert('Failed to load document: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button
          className={styles.btn}
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
          title="Undo (⌘Z)"
        ><Undo2 size={15} /></button>
        <button
          className={styles.btn}
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
        ><Redo2 size={15} /></button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        {TOOLS.map(tool => (
          <button
            key={tool.mode}
            className={`${styles.btn} ${state.toolMode === tool.mode ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_TOOL_MODE', mode: tool.mode })}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <span className={styles.zoomLabel}>{Math.round(state.viewTransform.zoom * 100)}%</span>
        <button className={styles.btn} onClick={() => dispatch({ type: 'RESET_VIEW' })} title="Reset view">
          <Home size={15} />
        </button>
      </div>

      <div className={styles.spacer} />

      <div className={styles.group}>
        <button className={styles.btn} onClick={handleLoad} title="Load document"><FolderOpen size={15} /></button>
        <button className={styles.btn} onClick={handleSave} title="Save document"><Save size={15} /></button>
      </div>
    </div>
  )
}
