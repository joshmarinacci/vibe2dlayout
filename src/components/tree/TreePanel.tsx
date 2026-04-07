import { useState } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import type { ShapeType } from '@model/shapes'
import { createShape } from '@utils/shapeFactory'
import { TreeNodeComp } from './TreeNode'
import styles from './TreePanel.module.css'

const ADD_SHAPE_OPTIONS: { type: ShapeType; label: string }[] = [
  { type: 'rect',   label: 'Rectangle' },
  { type: 'circle', label: 'Circle' },
  { type: 'line',   label: 'Line' },
  { type: 'text',   label: 'Text' },
  { type: 'image',  label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'panel',  label: 'Panel' },
  { type: 'slider', label: 'Slider' },
  { type: 'page',   label: 'Page' },
]

export function TreePanel() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const [showAddMenu, setShowAddMenu] = useState(false)

  const { rootNodes, shapes } = state.document

  const addShape = (type: ShapeType) => {
    const shape = createShape(type)
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
                  {ADD_SHAPE_OPTIONS.filter(o => o.type !== 'page').map(opt => (
                    <button
                      key={opt.type}
                      className={styles.addMenuItem}
                      onClick={() => addShape(opt.type)}
                    >
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
        {rootNodes.map(node => (
          <TreeNodeComp
            key={node.id}
            node={node}
            shapes={shapes}
            depth={0}
            selectedIds={state.selection.ids}
            activePageId={state.activePageId}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  )
}
