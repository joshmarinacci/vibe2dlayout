import { useState } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import type { ShapeType } from '@model/shapes'
import { createShape } from '@utils/shapeFactory'
import { getActiveTheme } from '@model/theme'
import { TreeNodeComp } from './TreeNode'
import styles from './TreePanel.module.css'

const BASIC_SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'rect',   label: 'Rectangle' },
  { type: 'circle', label: 'Circle' },
  { type: 'line',   label: 'Line' },
  { type: 'text',   label: 'Text' },
  { type: 'image',  label: 'Image' },
]

const CONTAINER_TYPES: { type: ShapeType; label: string }[] = [
  { type: 'panel',   label: 'Titled Panel' },
  { type: 'frame',   label: 'Panel' },
  { type: 'dialog',  label: 'Dialog' },
]

const FORM_CONTROLS: { type: ShapeType; label: string }[] = [
  { type: 'button',    label: 'Button' },
  { type: 'slider',    label: 'Slider' },
  { type: 'label',     label: 'Label' },
  { type: 'textfield', label: 'Text Field' },
  { type: 'checkbox',  label: 'Checkbox' },
  { type: 'toggle',    label: 'Toggle' },
  { type: 'radio',     label: 'Radio Button' },
  { type: 'select',    label: 'Select' },
  { type: 'progress',  label: 'Progress Bar' },
  { type: 'stepper',   label: 'Number Stepper' },
]

export function TreePanel() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const [showAddMenu, setShowAddMenu] = useState(false)

  const { rootNodes, shapes } = state.document

  const addShape = (type: ShapeType) => {
    const shape = createShape(type, 50, 50, getActiveTheme(state.document))
    dispatch({ type: 'ADD_SHAPE', parentId: state.activePageId, shape })
    dispatch({ type: 'SELECT_SHAPES', ids: [shape.id], additive: false })
    setShowAddMenu(false)
  }

  const addPage = () => {
    const shape = createShape('page')
    dispatch({ type: 'ADD_SHAPE', parentId: null, shape })
    dispatch({ type: 'SET_ACTIVE_PAGE', pageId: shape.id })
    setShowAddMenu(false)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Layers</span>
        <div className={styles.headerActions}>
          <div style={{ position: 'relative' }}>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddMenu(v => !v)}
              title="Add shape"
            >+</button>
            {showAddMenu && (
              <div className={styles.addMenu}>
                <div className={styles.addMenuGroup}>
                  <div className={styles.addMenuLabel}>Page</div>
                  <button className={styles.addMenuItem} onClick={addPage}>Page</button>
                </div>
                <div className={styles.addMenuDivider} />
                <div className={styles.addMenuGroup}>
                  <div className={styles.addMenuLabel}>Shapes</div>
                  {BASIC_SHAPES.map(opt => (
                    <button key={opt.type} className={styles.addMenuItem} onClick={() => addShape(opt.type)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className={styles.addMenuDivider} />
                <div className={styles.addMenuGroup}>
                  <div className={styles.addMenuLabel}>Containers</div>
                  {CONTAINER_TYPES.map(opt => (
                    <button key={opt.type} className={styles.addMenuItem} onClick={() => addShape(opt.type)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className={styles.addMenuDivider} />
                <div className={styles.addMenuGroup}>
                  <div className={styles.addMenuLabel}>Form Controls</div>
                  {FORM_CONTROLS.map(opt => (
                    <button key={opt.type} className={styles.addMenuItem} onClick={() => addShape(opt.type)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tree}>
        {rootNodes.map((node, i) => (
          <TreeNodeComp
            key={node.id}
            node={node}
            rootNodes={rootNodes}
            shapes={shapes}
            depth={0}
            selectedIds={state.selection.ids}
            activePageId={state.activePageId}
            dispatch={dispatch}
            parentId={null}
            nodeIndex={i}
          />
        ))}
      </div>
    </div>
  )
}
