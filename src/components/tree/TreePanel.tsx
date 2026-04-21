import { useState } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import type { ShapeType } from '@model/shapes'
import { createShape } from '@utils/shapeFactory'
import { getActiveTheme } from '@model/theme'
import { getUnfiledPageIds } from '@model/document'
import { generateId } from '@utils/idgen'
import { TreeNodeComp } from './TreeNode'
import { DocumentRow } from './DocumentRow'
import { PageFolderRow } from './PageFolderRow'
import { SectionHeader } from './SectionHeader'
import { StylesSection } from './StylesSection'
import { VariablesSection } from './VariablesSection'
import { AssetsSection } from './AssetsSection'
import styles from './TreePanel.module.css'

const BASIC_SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'rect',   label: 'Rectangle' },
  { type: 'circle', label: 'Circle' },
  { type: 'line',   label: 'Line' },
  { type: 'text',   label: 'Text' },
  { type: 'image',  label: 'Image' },
]

const CONTAINER_TYPES: { type: ShapeType; label: string }[] = [
  { type: 'group',   label: 'Group' },
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

  const { rootNodes, shapes, pageFolders } = state.document

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

  const addFolder = () => {
    const folder = {
      id: generateId(),
      name: 'New Folder',
      pageIds: [],
      collapsed: false,
    }
    dispatch({ type: 'ADD_PAGE_FOLDER', folder })
    setShowAddMenu(false)
  }

  const unfiledPageIds = getUnfiledPageIds(rootNodes, pageFolders, shapes)

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
                  <button className={styles.addMenuItem} onClick={addFolder}>Folder</button>
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
        {/* Document item at top */}
        <DocumentRow
          documentName={state.documentName}
          documentSelected={state.documentSelected}
          dispatch={dispatch}
        />

        <div className={styles.separator} />

        {/* Page folders */}
        {pageFolders.map((folder, i) => (
          <PageFolderRow
            key={folder.id}
            folder={folder}
            rootNodes={rootNodes}
            shapes={shapes}
            selectedIds={state.selection.ids}
            activePageId={state.activePageId}
            dispatch={dispatch}
            isFirst={i === 0}
            isLast={i === pageFolders.length - 1}
          />
        ))}

        {/* Unfiled pages */}
        {unfiledPageIds.map((id, i) => {
          const node = rootNodes.find(n => n.id === id)
          if (!node) return null
          return (
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
          )
        })}

        <div className={styles.separator} />

        {/* Asset sections */}
        <SectionHeader label="Assets" />
        <AssetsSection
          assets={state.document.images}
          selectedAssetId={state.selectedAssetId}
          dispatch={dispatch}
          shapes={state.document.shapes}
        />
        <VariablesSection
          variables={state.document.variables}
          selectedVariableId={state.selectedVariableId}
          dispatch={dispatch}
        />
        <StylesSection
          textStyles={state.document.textStyles}
          selectedStyleId={state.selectedStyleId}
          dispatch={dispatch}
        />
      </div>
    </div>
  )
}
