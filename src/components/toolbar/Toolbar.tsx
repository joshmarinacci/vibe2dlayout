import { useState } from 'react'
import {
  MousePointer2, Hand, Square, Circle, Minus, Type, Image, FileText,
  RectangleHorizontal, PanelLeft, SlidersHorizontal,
  Tag, TextCursorInput, CheckSquare, ToggleLeft, ChevronDown,
  Undo2, Redo2, Home, FolderOpen, Save, ZoomIn, ZoomOut,
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
  { mode: 'insert-page',   icon: <FileText size={15} />,      title: 'Page' },
]

const FORM_CONTROLS: ToolButton[] = [
  { mode: 'insert-button',    icon: <RectangleHorizontal size={14} />, title: 'Button' },
  { mode: 'insert-panel',     icon: <PanelLeft size={14} />,           title: 'Panel' },
  { mode: 'insert-slider',    icon: <SlidersHorizontal size={14} />,   title: 'Slider' },
  { mode: 'insert-label',     icon: <Tag size={14} />,                 title: 'Label' },
  { mode: 'insert-textfield', icon: <TextCursorInput size={14} />,     title: 'Text Field' },
  { mode: 'insert-checkbox',  icon: <CheckSquare size={14} />,         title: 'Checkbox' },
  { mode: 'insert-toggle',    icon: <ToggleLeft size={14} />,          title: 'Toggle' },
]

const FORM_MODES = new Set(FORM_CONTROLS.map(fc => fc.mode))

export function Toolbar() {
  const { state, canUndo, canRedo } = useAppState()
  const dispatch = useAppDispatch()
  const [showFormMenu, setShowFormMenu] = useState(false)
  const activeFormControl = FORM_CONTROLS.find(fc => fc.mode === state.toolMode)

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

        {/* Form Controls dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className={`${styles.btn} ${styles.formBtn} ${FORM_MODES.has(state.toolMode) ? styles.active : ''}`}
            title="Form Controls"
            onClick={() => setShowFormMenu(v => !v)}
          >
            {activeFormControl ? activeFormControl.icon : <RectangleHorizontal size={14} />}
            <ChevronDown size={10} />
          </button>
          {showFormMenu && (
            <div className={styles.formMenu}>
              {FORM_CONTROLS.map(fc => (
                <button
                  key={fc.mode}
                  className={`${styles.formMenuItem} ${state.toolMode === fc.mode ? styles.formMenuItemActive : ''}`}
                  onClick={() => {
                    dispatch({ type: 'SET_TOOL_MODE', mode: fc.mode })
                    setShowFormMenu(false)
                  }}
                >
                  {fc.icon}
                  <span>{fc.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button
          className={styles.btn}
          title="Zoom out"
          onClick={() => {
            const presets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]
            const cur = state.viewTransform.zoom
            const next = [...presets].reverse().find(z => z < cur - 0.01) ?? presets[0]
            dispatch({ type: 'ZOOM_TO', zoom: next, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 } })
          }}
        ><ZoomOut size={15} /></button>
        <select
          className={styles.zoomSelect}
          value={Math.round(state.viewTransform.zoom * 100)}
          onChange={e => {
            const zoom = parseInt(e.target.value) / 100
            dispatch({ type: 'ZOOM_TO', zoom, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 } })
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
            dispatch({ type: 'ZOOM_TO', zoom: next, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 } })
          }}
        ><ZoomIn size={15} /></button>
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
