import type {TextStyleDef} from '@model/textStyle'
import type {AppAction} from '@store/types'
import {Type} from 'lucide-react'
import {type Dispatch, useState} from 'react'
import {createPortal} from 'react-dom'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import styles from './StyleRow.module.css'

interface Props {
    style: TextStyleDef
    isSelected: boolean
    isFirst: boolean
    isLast: boolean
    dispatch: Dispatch<AppAction>
}

export function StyleRow({style, isSelected, isFirst, isLast, dispatch}: Props) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState(style.name)

    const commitRename = () => {
        const trimmed = editName.trim()
        if (trimmed && trimmed !== style.name) {
            dispatch({type: 'UPDATE_TEXT_STYLE', style: {...style, name: trimmed}})
        }
        setIsEditingName(false)
    }

    const previewParts: string[] = []
    if (style.fontSize) previewParts.push(`${style.fontSize}px`)
    if (style.fontWeight && style.fontWeight !== 'normal') previewParts.push(style.fontWeight)
    if (style.fontFamily) previewParts.push(style.fontFamily.split(',')[0].trim())

    const contextGroups: ContextMenuGroup[] = [
        {
            items: [
                {
                    label: 'Rename', onClick: () => {
                        setEditName(style.name);
                        setIsEditingName(true)
                    }
                },
                {
                    label: 'Move Up',
                    onClick: () => dispatch({
                        type: 'REORDER_TEXT_STYLE',
                        styleId: style.id,
                        direction: 'up'
                    }),
                    disabled: isFirst
                },
                {
                    label: 'Move Down',
                    onClick: () => dispatch({
                        type: 'REORDER_TEXT_STYLE',
                        styleId: style.id,
                        direction: 'down'
                    }),
                    disabled: isLast
                },
            ],
        },
        {
            items: [
                {
                    label: 'Delete Style',
                    danger: true,
                    onClick: () => {
                        if (window.confirm(`Delete style "${style.name}"? Shapes using it will keep their current appearance.`)) {
                            dispatch({type: 'DELETE_TEXT_STYLE', styleId: style.id})
                        }
                    },
                },
            ],
        },
    ]

    return (
        <div
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            onClick={() => dispatch({type: 'SELECT_STYLE', styleId: style.id})}
            onDoubleClick={() => {
                setEditName(style.name);
                setIsEditingName(true)
            }}
            onContextMenu={e => {
                e.preventDefault();
                setContextMenu({x: e.clientX, y: e.clientY})
            }}
        >
            <Type size={12} className={styles.icon}/>
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
                    <span className={styles.name}>{style.name}</span>
                    {previewParts.length > 0 && (
                        <span className={styles.preview}>{previewParts.join(' · ')}</span>
                    )}
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
