import type {DimensionAsset} from '@model/dimensionAsset'
import type {AppAction} from '@store/types'
import {type Dispatch, useState} from 'react'
import {createPortal} from 'react-dom'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import styles from './StyleRow.module.css'

interface Props {
    asset: DimensionAsset
    isSelected: boolean
    scope: 'document' | 'library'
    dispatch: Dispatch<AppAction>
    usageCount?: number
}

export function DimensionRow({asset, isSelected, scope, dispatch, usageCount}: Props) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState(asset.name)

    const commitRename = () => {
        const trimmed = editName.trim()
        if (trimmed && trimmed !== asset.name) {
            if (scope === 'document') {
                dispatch({type: 'UPDATE_DIMENSION_ASSET', asset: {...asset, name: trimmed}})
            } else {
                dispatch({type: 'RENAME_LIBRARY_ITEM', id: asset.id, name: trimmed, itemType: 'dimension'})
            }
        }
        setIsEditingName(false)
    }

    const deleteAsset = () => {
        if (scope === 'document') {
            if (window.confirm(`Delete dimension "${asset.name}"? Pages using it will keep their current size but become custom dimensions.`)) {
                dispatch({type: 'DELETE_DIMENSION_ASSET', assetId: asset.id})
            }
            return
        }
        if (window.confirm(`Delete dimension "${asset.name}" from the library? Pages using it will keep their current size.`)) {
            dispatch({type: 'DELETE_LIBRARY_DIMENSION', id: asset.id})
        }
    }

    const contextGroups: ContextMenuGroup[] = [
        {
            items: [
                {
                    label: 'Rename',
                    onClick: () => {
                        setEditName(asset.name)
                        setIsEditingName(true)
                    },
                },
                ...(scope === 'library' ? [{
                    label: 'Add to Document',
                    onClick: () => dispatch({type: 'ADD_DIMENSION_ASSET', asset: {...asset, id: crypto.randomUUID()}}),
                }] : [{
                    label: 'Add to Library',
                    onClick: () => dispatch({type: 'ADD_LIBRARY_DIMENSION', dimension: {...asset, id: crypto.randomUUID()}}),
                }]),
            ],
        },
        {
            items: [
                {
                    label: scope === 'library' ? 'Delete from Library' : 'Delete Dimension',
                    danger: true,
                    onClick: deleteAsset,
                },
            ],
        },
    ]

    return (
        <div
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            onClick={() => {
                if (scope === 'document') {
                    dispatch({type: 'SELECT_DIMENSION_ASSET', assetId: asset.id})
                } else {
                    dispatch({type: 'SELECT_LIBRARY_ITEM', id: asset.id, itemType: 'dimension'})
                }
            }}
            onDoubleClick={() => {
                setEditName(asset.name)
                setIsEditingName(true)
            }}
            onContextMenu={e => {
                e.preventDefault()
                setContextMenu({x: e.clientX, y: e.clientY})
            }}
        >
            {isEditingName ? (
                <input
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
                <>
                    <span className={styles.name}>{asset.name}</span>
                    <span className={styles.preview}>{asset.width}×{asset.height}px{usageCount !== undefined ? ` · ${usageCount}` : ''}</span>
                </>
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
