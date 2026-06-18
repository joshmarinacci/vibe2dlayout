import type {ImageAsset} from '@model/imageAsset'
import type {AppAction} from '@store/types'
import {generateId} from '@utils/idgen'
import {type Dispatch, useState} from 'react'
import {createPortal} from 'react-dom'
import rowStyles from './AssetRow.module.css'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import styles from './StyleRow.module.css'

interface Props {
    asset: ImageAsset
    isSelected: boolean
    usageCount: number
    dispatch: Dispatch<AppAction>
}

export function AssetRow({asset, isSelected, usageCount, dispatch}: Props) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState(asset.name)

    const commitRename = () => {
        const trimmed = editName.trim()
        if (trimmed && trimmed !== asset.name) {
            dispatch({type: 'UPDATE_IMAGE_ASSET', asset: {...asset, name: trimmed}})
        }
        setIsEditingName(false)
    }

    const contextGroups: ContextMenuGroup[] = [
        {
            items: [
                {
                    label: 'Rename', onClick: () => {
                        setEditName(asset.name);
                        setIsEditingName(true)
                    }
                },
                {
                    label: 'Add to Library',
                    onClick: () => dispatch({
                        type: 'ADD_LIBRARY_IMAGE',
                        image: {...asset, id: generateId()},
                    }),
                },
            ],
        },
        {
            items: [
                {
                    label: 'Delete Image',
                    danger: true,
                    onClick: () => {
                        if (window.confirm(`Delete image "${asset.name}"? Shapes using it will keep their current appearance but become unlinked.`)) {
                            dispatch({type: 'DELETE_IMAGE_ASSET', assetId: asset.id})
                        }
                    },
                },
            ],
        },
    ]

    // Build src for thumbnail: base64 needs the data URI prefix restored
    const thumbSrc = asset.src.startsWith('data:') || asset.src.startsWith('http')
        ? asset.src
        : `data:${asset.mimeType};base64,${asset.src}`

    return (
        <div
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            onClick={() => dispatch({type: 'SELECT_IMAGE_ASSET', assetId: asset.id})}
            onDoubleClick={() => {
                setEditName(asset.name);
                setIsEditingName(true)
            }}
            onContextMenu={e => {
                e.preventDefault();
                setContextMenu({x: e.clientX, y: e.clientY})
            }}
        >
            <img
                src={thumbSrc}
                className={rowStyles.thumbnail}
                alt=""
                onError={e => {
                    (e.target as HTMLImageElement).style.opacity = '0.3'
                }}
            />

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
                    <span className={styles.preview}>({usageCount})</span>
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
