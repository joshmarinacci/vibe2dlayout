import { useState } from 'react'
import {
  MousePointer2, Hand, Square, Circle, Minus, Type, Image, FileText,
  RectangleHorizontal, PanelLeft, SlidersHorizontal,
  Tag, TextCursorInput, CheckSquare, ToggleLeft, ChevronDown,
  Undo2, Redo2, Home, FolderOpen, Save, ZoomIn, ZoomOut,
  AppWindow, CircleDot, List, GanttChart, Hash,
  HelpCircle, LayoutPanelLeft,
} from 'lucide-react'
import { useAppState, useAppDispatch } from '@store/context'
import type { ToolMode } from '@store/types'
import { createShape } from '@utils/shapeFactory'
import { downloadJSON, uploadJSON, fromJSON } from '@utils/serialization'
import styles from './Toolbar.module.css'

interface ToolButton {
  mode: ToolMode
  icon: React.ReactNode
  title: string
}

const SHAPE_TOOLS: ToolButton[] = [
  { mode: 'insert-rect',   icon: <Square size={14} />,        title: 'Rectangle' },
  { mode: 'insert-circle', icon: <Circle size={14} />,        title: 'Circle' },
  { mode: 'insert-line',   icon: <Minus size={14} />,         title: 'Line / Connector' },
]
const SHAPE_MODES = new Set(SHAPE_TOOLS.map(t => t.mode))

const CONTAINER_CONTROLS: ToolButton[] = [
  { mode: 'insert-panel',  icon: <PanelLeft size={14} />,     title: 'Titled Panel' },
  { mode: 'insert-frame',  icon: <LayoutPanelLeft size={14} />, title: 'Panel' },
  { mode: 'insert-dialog', icon: <AppWindow size={14} />,     title: 'Dialog' },
]

const FORM_CONTROLS: ToolButton[] = [
  { mode: 'insert-button',    icon: <RectangleHorizontal size={14} />, title: 'Button' },
  { mode: 'insert-slider',    icon: <SlidersHorizontal size={14} />,   title: 'Slider' },
  { mode: 'insert-label',     icon: <Tag size={14} />,                 title: 'Label' },
  { mode: 'insert-textfield', icon: <TextCursorInput size={14} />,     title: 'Text Field' },
  { mode: 'insert-checkbox',  icon: <CheckSquare size={14} />,         title: 'Checkbox' },
  { mode: 'insert-toggle',    icon: <ToggleLeft size={14} />,          title: 'Toggle' },
  { mode: 'insert-radio',     icon: <CircleDot size={14} />,           title: 'Radio Button' },
  { mode: 'insert-select',    icon: <List size={14} />,                title: 'Select' },
  { mode: 'insert-progress',  icon: <GanttChart size={14} />,          title: 'Progress Bar' },
  { mode: 'insert-stepper',   icon: <Hash size={14} />,                title: 'Number Stepper' },
]

const ALL_COMPONENT_TOOLS = [...CONTAINER_CONTROLS, ...FORM_CONTROLS]
const COMPONENT_MODES = new Set(ALL_COMPONENT_TOOLS.map(t => t.mode))

export function Toolbar() {
  const { state, canUndo, canRedo } = useAppState()
  const dispatch = useAppDispatch()
  const [showShapesMenu, setShowShapesMenu] = useState(false)
  const [showComponentMenu, setShowComponentMenu] = useState(false)

  const activeShapeTool = SHAPE_TOOLS.find(t => t.mode === state.toolMode)
  const activeComponentTool = ALL_COMPONENT_TOOLS.find(t => t.mode === state.toolMode)

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
        {/* Select + Pan */}
        <button
          className={`${styles.btn} ${state.toolMode === 'select' ? styles.active : ''}`}
          onClick={() => dispatch({ type: 'SET_TOOL_MODE', mode: 'select' })}
          title="Select (V)"
        ><MousePointer2 size={15} /></button>
        <button
          className={`${styles.btn} ${state.toolMode === 'pan' ? styles.active : ''}`}
          onClick={() => dispatch({ type: 'SET_TOOL_MODE', mode: 'pan' })}
          title="Pan (H)"
        ><Hand size={15} /></button>

        {/* Shapes dropdown (Rect / Circle / Line) */}
        <div style={{ position: 'relative' }}>
          <button
            className={`${styles.btn} ${styles.formBtn} ${SHAPE_MODES.has(state.toolMode) ? styles.active : ''}`}
            title="Shapes"
            onClick={() => setShowShapesMenu(v => !v)}
          >
            {activeShapeTool ? activeShapeTool.icon : <Square size={14} />}
            <ChevronDown size={10} />
          </button>
          {showShapesMenu && (
            <div className={styles.formMenu}>
              {SHAPE_TOOLS.map(t => (
                <button
                  key={t.mode}
                  className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                  onClick={() => { dispatch({ type: 'SET_TOOL_MODE', mode: t.mode }); setShowShapesMenu(false) }}
                >
                  {t.icon}
                  <span>{t.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text + Image + Page (individual) */}
        <button
          className={`${styles.btn} ${state.toolMode === 'insert-text' ? styles.active : ''}`}
          onClick={() => dispatch({ type: 'SET_TOOL_MODE', mode: 'insert-text' })}
          title="Text"
        ><Type size={15} /></button>
        <button
          className={`${styles.btn} ${state.toolMode === 'insert-image' ? styles.active : ''}`}
          onClick={() => dispatch({ type: 'SET_TOOL_MODE', mode: 'insert-image' })}
          title="Image"
        ><Image size={15} /></button>
        <button
          className={styles.btn}
          onClick={() => {
            const page = createShape('page')
            dispatch({ type: 'ADD_SHAPE', parentId: null, shape: page })
            dispatch({ type: 'SET_ACTIVE_PAGE', pageId: page.id })
          }}
          title="Add Page"
        ><FileText size={15} /></button>

        {/* Components dropdown (Containers + Form Controls) */}
        <div style={{ position: 'relative' }}>
          <button
            className={`${styles.btn} ${styles.formBtn} ${COMPONENT_MODES.has(state.toolMode) ? styles.active : ''}`}
            title="Components"
            onClick={() => setShowComponentMenu(v => !v)}
          >
            {activeComponentTool ? activeComponentTool.icon : <RectangleHorizontal size={14} />}
            <ChevronDown size={10} />
          </button>
          {showComponentMenu && (
            <div className={styles.formMenu}>
              <div className={styles.formMenuSection}>Containers</div>
              {CONTAINER_CONTROLS.map(t => (
                <button
                  key={t.mode}
                  className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                  onClick={() => { dispatch({ type: 'SET_TOOL_MODE', mode: t.mode }); setShowComponentMenu(false) }}
                >
                  {t.icon}
                  <span>{t.title}</span>
                </button>
              ))}
              <div className={styles.formMenuDivider} />
              <div className={styles.formMenuSection}>Form Controls</div>
              {FORM_CONTROLS.map(t => (
                <button
                  key={t.mode}
                  className={`${styles.formMenuItem} ${state.toolMode === t.mode ? styles.formMenuItemActive : ''}`}
                  onClick={() => { dispatch({ type: 'SET_TOOL_MODE', mode: t.mode }); setShowComponentMenu(false) }}
                >
                  {t.icon}
                  <span>{t.title}</span>
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
            dispatch({ type: 'ZOOM_TO', zoom: next, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 20 } })
          }}
        ><ZoomOut size={15} /></button>
        <select
          className={styles.zoomSelect}
          value={Math.round(state.viewTransform.zoom * 100)}
          onChange={e => {
            const zoom = parseInt(e.target.value) / 100
            dispatch({ type: 'ZOOM_TO', zoom, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 20 } })
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
            dispatch({ type: 'ZOOM_TO', zoom: next, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 20 } })
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
        <button
          className={styles.btn}
          onClick={() => dispatch({ type: 'TOGGLE_SHORTCUTS_MODAL' })}
          title="Keyboard shortcuts (?)"
        ><HelpCircle size={15} /></button>
      </div>
    </div>
  )
}
