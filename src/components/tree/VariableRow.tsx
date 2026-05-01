import type {Variable} from '@model/variable'
import type {AppAction} from '@store/types'
import {Hash, ToggleLeft, Type} from 'lucide-react'
import {type Dispatch, useState} from 'react'
import {createPortal} from 'react-dom'
import inputStyles from '../properties/inputs/inputs.module.css'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import styles from './StyleRow.module.css'

interface Props {
    variable: Variable
    isSelected: boolean
    isFirst: boolean
    isLast: boolean
    dispatch: Dispatch<AppAction>
}

export function VariableRow({variable, isSelected, isFirst, isLast, dispatch}: Props) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState(variable.name)

    const commitRename = () => {
        const trimmed = editName.trim()
        if (trimmed && trimmed !== variable.name) {
            dispatch({type: 'UPDATE_VARIABLE', variable: {...variable, name: trimmed}})
        }
        setIsEditingName(false)
    }

    const contextGroups: ContextMenuGroup[] = [
        {
            items: [
                {
                    label: 'Rename', onClick: () => {
                        setEditName(variable.name);
                        setIsEditingName(true)
                    }
                },
                {
                    label: 'Move Up',
                    onClick: () => dispatch({
                        type: 'REORDER_VARIABLE',
                        variableId: variable.id,
                        direction: 'up'
                    }),
                    disabled: isFirst
                },
                {
                    label: 'Move Down',
                    onClick: () => dispatch({
                        type: 'REORDER_VARIABLE',
                        variableId: variable.id,
                        direction: 'down'
                    }),
                    disabled: isLast
                },
            ],
        },
        {
            items: [
                {
                    label: 'Delete Variable',
                    danger: true,
                    onClick: () => {
                        if (window.confirm(`Delete variable "${variable.name}"? Shapes bound to it will revert to their stored values.`)) {
                            dispatch({type: 'DELETE_VARIABLE', variableId: variable.id})
                        }
                    },
                },
            ],
        },
    ]

    const Icon = variable.type === 'number' ? Hash
        : variable.type === 'boolean' ? ToggleLeft
            : Type  // string and color both use Type; color has swatch below

    const preview = variable.type === 'color'
        ? null
        : variable.type === 'boolean'
            ? String(variable.value)
            : String(variable.value).slice(0, 20)

    return (
        <div
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            onClick={() => dispatch({type: 'SELECT_VARIABLE', variableId: variable.id})}
            onDoubleClick={() => {
                setEditName(variable.name);
                setIsEditingName(true)
            }}
            onContextMenu={e => {
                e.preventDefault();
                setContextMenu({x: e.clientX, y: e.clientY})
            }}
        >
            {variable.type === 'color' ? (
                <div
                    className={inputStyles.varColorSwatch}
                    style={{background: String(variable.value), flexShrink: 0}}
                />
            ) : (
                <Icon size={12} className={styles.icon}/>
            )}

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
                    <span className={styles.name}>{variable.name}</span>
                    {preview !== null && (
                        <span className={styles.preview}>{preview}</span>
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
