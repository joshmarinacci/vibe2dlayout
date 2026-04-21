import { useState, useRef, useCallback, type Dispatch } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, ChevronDown, Folder } from 'lucide-react'
import type { PageFolder, TreeNode } from '@model/document'
import type { Shape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { createShape } from '@utils/shapeFactory'
import { TreeNodeComp } from './TreeNode'
import { ContextMenu, type ContextMenuGroup } from './ContextMenu'
import styles from './PageFolderRow.module.css'

const DRAG_TYPE = 'application/vibe-tree-drag'

interface Props {
  folder: PageFolder
  rootNodes: TreeNode[]
  shapes: Record<string, Shape>
  selectedIds: string[]
  activePageId: string | null
  dispatch: Dispatch<AppAction>
  isFirst: boolean
  isLast: boolean
}

export function PageFolderRow({
  folder,
  rootNodes,
  shapes,
  selectedIds,
  activePageId,
  dispatch,
  isFirst,
  isLast,
}: Props) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [isDragOver, setIsDragOver] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isActive = activePageId !== null && folder.pageIds.includes(activePageId)

  const startRename = useCallback(() => {
    setEditName(folder.name)
    setIsEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 0)
  }, [folder.name])

  const commitRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== folder.name) {
      dispatch({ type: 'RENAME_PAGE_FOLDER', folderId: folder.id, name: trimmed })
    }
    setIsEditingName(false)
  }, [dispatch, editName, folder.id, folder.name])

  const addPageToFolder = useCallback(() => {
    const shape = createShape('page')
    dispatch({ type: 'ADD_SHAPE', parentId: null, shape })
    dispatch({ type: 'SET_ACTIVE_PAGE', pageId: shape.id })
    dispatch({ type: 'ASSIGN_PAGES_TO_FOLDER', folderId: folder.id, pageIds: [shape.id] })
  }, [dispatch, folder.id])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    setIsDragOver(false)
    const raw = e.dataTransfer.getData(DRAG_TYPE)
    if (!raw) return
    e.preventDefault()
    const payload = JSON.parse(raw) as { id: string }
    const shape = shapes[payload.id]
    if (!shape || shape.type !== 'page') return
    dispatch({ type: 'ASSIGN_PAGES_TO_FOLDER', folderId: folder.id, pageIds: [payload.id] })
  }, [dispatch, folder.id, shapes])

  const contextGroups: ContextMenuGroup[] = [
    {
      items: [
        { label: 'Add Page to Folder', onClick: addPageToFolder },
        { label: 'Rename', onClick: startRename },
      ],
    },
    {
      items: [
        { label: 'Move Up', onClick: () => dispatch({ type: 'REORDER_PAGE_FOLDER', folderId: folder.id, direction: 'up' }), disabled: isFirst },
        { label: 'Move Down', onClick: () => dispatch({ type: 'REORDER_PAGE_FOLDER', folderId: folder.id, direction: 'down' }), disabled: isLast },
      ],
    },
    {
      items: [
        {
          label: 'Delete Folder (keep pages)',
          danger: true,
          onClick: () => dispatch({ type: 'DELETE_PAGE_FOLDER', folderId: folder.id, deletionMode: 'unfolder' }),
        },
        {
          label: 'Delete Folder and Pages',
          danger: true,
          onClick: () => {
            if (window.confirm(`Delete folder "${folder.name}" and all its pages? This cannot be undone easily.`)) {
              dispatch({ type: 'DELETE_PAGE_FOLDER', folderId: folder.id, deletionMode: 'delete-pages' })
            }
          },
        },
      ],
    },
  ]

  // Get child TreeNodes for pages in this folder, in folder order
  const childNodes = folder.pageIds
    .map(id => rootNodes.find(n => n.id === id))
    .filter((n): n is TreeNode => n !== undefined)

  return (
    <div>
      <div
        className={`${styles.row} ${isActive ? styles.active : ''} ${isDragOver ? styles.dragOver : ''}`}
        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }) }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDoubleClick={startRename}
      >
        <button
          className={styles.chevron}
          onClick={() => dispatch({ type: 'SET_FOLDER_COLLAPSED', folderId: folder.id, collapsed: !folder.collapsed })}
          title={folder.collapsed ? 'Expand' : 'Collapse'}
        >
          {folder.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
        <Folder size={13} className={styles.icon} />
        {isEditingName ? (
          <input
            ref={nameInputRef}
            className={styles.nameInput}
            value={editName}
            autoFocus
            onChange={e => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setIsEditingName(false)
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={styles.name}>{folder.name}</span>
        )}
      </div>

      {!folder.collapsed && childNodes.length > 0 && (
        <div className={styles.children}>
          {childNodes.map((node, i) => (
            <TreeNodeComp
              key={node.id}
              node={node}
              rootNodes={rootNodes}
              shapes={shapes}
              depth={1}
              selectedIds={selectedIds}
              activePageId={activePageId}
              dispatch={dispatch}
              parentId={null}
              nodeIndex={i}
            />
          ))}
        </div>
      )}

      {contextMenu && createPortal(
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          groups={contextGroups}
          onClose={() => setContextMenu(null)}
        />,
        document.body,
      )}
    </div>
  )
}
