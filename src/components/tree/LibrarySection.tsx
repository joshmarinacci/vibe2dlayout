import type {GradientDef} from '@model/document'
import type {Library} from '@model/library'
import type {MimeType} from '@model/shapes'
import type {AppAction} from '@store/types'
import {gradientCSS} from '@utils/fillCSS'
import {generateId} from '@utils/idgen'
import {useLibraryFontMetadataEnrichment} from '@hooks/useLibraryFontMetadataEnrichment'
import type {Dispatch, ReactNode, RefObject} from 'react'
import {createPortal} from 'react-dom'
import {useRef, useState} from 'react'
import type {Shape} from '@model/shapes'
import {DimensionRow} from './DimensionRow'
import {DimensionAddDialog} from './DimensionAddDialog'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import styles from './LibrarySection.module.css'

const MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

interface Props {
    library: Library
    selectedId: string | null
    selectedType: 'gradient' | 'image' | 'font' | 'dimension' | null
    shapes: Record<string, Shape>
    dispatch: Dispatch<AppAction>
}

interface CtxState {
    x: number
    y: number
    id: string
    itemType: 'gradient' | 'image' | 'font' | 'dimension'
}

function swatchCSS(g: GradientDef): string {
    return gradientCSS({
        type: 'gradient',
        gradientType: 'linear',
        angle: 90,
        stops: g.stops,
        opacity: 1,
    })
}

function SubSection({
    title,
    collapsed,
    onToggle,
    onAdd,
    addTitle,
    addButtonRef,
    children,
}: {
    title: string
    collapsed: boolean
    onToggle: () => void
    onAdd?: () => void
    addTitle?: string
    addButtonRef?: RefObject<HTMLButtonElement>
    children: ReactNode
}) {
    return (
        <div>
            <div className={styles.subHeader}>
                <div className={styles.subHeaderLabel} onClick={onToggle}>
                    <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.subLabel}>{title}</span>
                </div>
                {onAdd && (
                    <button ref={addButtonRef} className={styles.addBtn} onClick={onAdd} title={addTitle}>+</button>
                )}
            </div>
            {!collapsed && children}
        </div>
    )
}

export function LibrarySection({library, selectedId, selectedType, shapes, dispatch}: Props) {
    useLibraryFontMetadataEnrichment(library.fonts, dispatch)

    const [gradientsCollapsed, setGradientsCollapsed] = useState(false)
    const [imagesCollapsed, setImagesCollapsed] = useState(false)
    const [dimensionsCollapsed, setDimensionsCollapsed] = useState(false)
    const [fontsCollapsed, setFontsCollapsed] = useState(false)
    const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renameText, setRenameText] = useState('')
    const [showFontInput, setShowFontInput] = useState(false)
    const [fontInputText, setFontInputText] = useState('')
    const [showDimensionInput, setShowDimensionInput] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dimensionAddButtonRef = useRef<HTMLButtonElement>(null)

    const openContextMenu = (e: React.MouseEvent, id: string, itemType: 'gradient' | 'image' | 'font' | 'dimension') => {
        e.preventDefault()
        e.stopPropagation()
        setCtxMenu({x: e.clientX, y: e.clientY, id, itemType})
    }

    const startRename = (id: string, currentName: string) => {
        setRenamingId(id)
        setRenameText(currentName)
    }

    const commitRename = (itemType: 'gradient' | 'image' | 'font' | 'dimension') => {
        if (renamingId && renameText.trim()) {
            if (itemType === 'dimension') {
                dispatch({type: 'RENAME_LIBRARY_ITEM', id: renamingId, name: renameText.trim(), itemType})
            } else {
                dispatch({type: 'RENAME_LIBRARY_ITEM', id: renamingId, name: renameText.trim(), itemType})
            }
        }
        setRenamingId(null)
    }

    const addToDocument = (id: string, itemType: 'gradient' | 'image' | 'font' | 'dimension') => {
        if (itemType === 'gradient') {
            const g = library.gradients.find(x => x.id === id)
            if (g) dispatch({type: 'ADD_GRADIENT', gradient: {id: generateId(), name: g.name, stops: [...g.stops]}})
        } else if (itemType === 'image') {
            const img = library.images.find(x => x.id === id)
            if (img) dispatch({type: 'ADD_IMAGE_ASSET', asset: {id: generateId(), name: img.name, src: img.src, mimeType: img.mimeType, width: img.width, height: img.height}})
        } else if (itemType === 'dimension') {
            const dim = library.dimensions.find(x => x.id === id)
            if (dim) dispatch({type: 'ADD_DIMENSION_ASSET', asset: {id: generateId(), name: dim.name, width: dim.width, height: dim.height}})
        } else if (itemType === 'font') {
            const f = library.fonts.find(x => x.id === id)
            if (f) dispatch({type: 'ADD_CUSTOM_FONT', font: {id: crypto.randomUUID(), name: f.name, isVariable: f.isVariable, axes: [...f.axes], metadataVersion: f.metadataVersion}})
        }
    }

    const deleteItem = (id: string, itemType: 'gradient' | 'image' | 'font' | 'dimension') => {
        if (itemType === 'gradient') dispatch({type: 'DELETE_LIBRARY_GRADIENT', id})
        else if (itemType === 'image') dispatch({type: 'DELETE_LIBRARY_IMAGE', id})
        else if (itemType === 'dimension') dispatch({type: 'DELETE_LIBRARY_DIMENSION', id})
        else if (itemType === 'font') dispatch({type: 'DELETE_LIBRARY_FONT', id})
    }

    const ctxGroups: ContextMenuGroup[] = ctxMenu ? [
        {items: [{label: 'Add to Document', onClick: () => addToDocument(ctxMenu.id, ctxMenu.itemType)}]},
        {items: [
            {label: 'Rename', onClick: () => {
                const item =
                    ctxMenu.itemType === 'gradient' ? library.gradients.find(g => g.id === ctxMenu.id) :
                    ctxMenu.itemType === 'image' ? library.images.find(i => i.id === ctxMenu.id) :
                    ctxMenu.itemType === 'dimension' ? library.dimensions.find(d => d.id === ctxMenu.id) :
                    library.fonts.find(f => f.id === ctxMenu.id)
                if (item) startRename(ctxMenu.id, item.name)
            }},
            {label: 'Delete', danger: true, onClick: () => deleteItem(ctxMenu.id, ctxMenu.itemType)},
        ]},
    ] : []

    const addGradient = () => {
        dispatch({
            type: 'ADD_LIBRARY_GRADIENT',
            gradient: {
                id: generateId(),
                name: 'New Gradient',
                stops: [{color: '#000000', position: 0}, {color: '#ffffff', position: 1}],
            },
        })
    }

    const addImage = () => fileInputRef.current?.click()

    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !MIME_TYPES.includes(file.type)) return
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.split(',')[1] ?? ''
            const img = new Image()
            img.onload = () => {
                const id = generateId()
                dispatch({
                    type: 'ADD_LIBRARY_IMAGE',
                    image: {id, name: file.name.replace(/\.[^.]+$/, ''), src: base64, mimeType: file.type as MimeType, width: img.naturalWidth, height: img.naturalHeight},
                })
            }
            img.src = dataUrl
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const commitFontInput = () => {
        const name = fontInputText.trim()
        if (name) {
            dispatch({type: 'ADD_LIBRARY_FONT', font: {id: generateId(), name, isVariable: null, axes: [], metadataVersion: 0}})
        }
        setShowFontInput(false)
        setFontInputText('')
    }

    const selectItem = (id: string, itemType: 'gradient' | 'image' | 'font' | 'dimension') => {
        dispatch({type: 'SELECT_LIBRARY_ITEM', id, itemType})
    }

    return (
        <div className={styles.sectionWrap}>
            <input
                ref={fileInputRef}
                type="file"
                accept={MIME_TYPES.join(',')}
                style={{display: 'none'}}
                onChange={handleImageFile}
            />

            {/* Gradients subsection */}
            <SubSection
                title="Gradients"
                collapsed={gradientsCollapsed}
                onToggle={() => setGradientsCollapsed(v => !v)}
                onAdd={addGradient}
                addTitle="Add gradient"
            >
                {library.gradients.map(g => (
                    <div
                        key={g.id}
                        className={`${styles.row} ${selectedId === g.id && selectedType === 'gradient' ? styles.rowSelected : ''}`}
                        onClick={() => selectItem(g.id, 'gradient')}
                        onDoubleClick={() => startRename(g.id, g.name)}
                        onContextMenu={e => openContextMenu(e, g.id, 'gradient')}
                    >
                        <div className={styles.swatch} style={{background: swatchCSS(g)}}/>
                        {renamingId === g.id
                            ? <input
                                autoFocus
                                className={styles.renameInput}
                                value={renameText}
                                onChange={e => setRenameText(e.target.value)}
                                onBlur={() => commitRename('gradient')}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitRename('gradient')
                                    if (e.key === 'Escape') setRenamingId(null)
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                            : <span className={styles.rowName}>{g.name}</span>
                        }
                    </div>
                ))}
                {library.gradients.length === 0 && <div className={styles.empty}>No gradients</div>}
            </SubSection>

            {/* Images subsection */}
            <SubSection
                title="Images"
                collapsed={imagesCollapsed}
                onToggle={() => setImagesCollapsed(v => !v)}
                onAdd={addImage}
                addTitle="Add image"
            >
                {library.images.map(img => (
                    <div
                        key={img.id}
                        className={`${styles.row} ${selectedId === img.id && selectedType === 'image' ? styles.rowSelected : ''}`}
                        onClick={() => selectItem(img.id, 'image')}
                        onDoubleClick={() => startRename(img.id, img.name)}
                        onContextMenu={e => openContextMenu(e, img.id, 'image')}
                    >
                        <img
                            className={styles.thumb}
                            src={`data:${img.mimeType};base64,${img.src}`}
                            alt={img.name}
                        />
                        {renamingId === img.id
                            ? <input
                                autoFocus
                                className={styles.renameInput}
                                value={renameText}
                                onChange={e => setRenameText(e.target.value)}
                                onBlur={() => commitRename('image')}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitRename('image')
                                    if (e.key === 'Escape') setRenamingId(null)
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                            : <span className={styles.rowName}>{img.name}</span>
                        }
                    </div>
                ))}
                {library.images.length === 0 && <div className={styles.empty}>No images</div>}
            </SubSection>

            {/* Dimensions subsection */}
            <SubSection
                title="Dimensions"
                collapsed={dimensionsCollapsed}
                onToggle={() => setDimensionsCollapsed(v => !v)}
                onAdd={() => setShowDimensionInput(v => !v)}
                addButtonRef={dimensionAddButtonRef}
                addTitle="Add dimension"
            >
                <DimensionAddDialog
                    open={showDimensionInput}
                    anchorRef={dimensionAddButtonRef}
                    title="Dimension"
                    onCancel={() => setShowDimensionInput(false)}
                    onCreate={asset => dispatch({type: 'ADD_LIBRARY_DIMENSION', dimension: asset})}
                />
                {library.dimensions.map(dim => (
                    <DimensionRow
                        key={dim.id}
                        asset={dim}
                        isSelected={dim.id === selectedId && selectedType === 'dimension'}
                        scope="library"
                        dispatch={dispatch}
                        usageCount={Object.values(shapes).filter(s => s.type === 'page' && (s as {
                            pageSize?: { kind: 'asset'; scope: 'document' | 'library'; assetId: string }
                        }).pageSize?.kind === 'asset' && (s as {
                            pageSize?: { kind: 'asset'; scope: 'document' | 'library'; assetId: string }
                        }).pageSize?.scope === 'library' && (s as {
                            pageSize?: { kind: 'asset'; scope: 'document' | 'library'; assetId: string }
                        }).pageSize?.assetId === dim.id).length}
                    />
                ))}
                {library.dimensions.length === 0 && !showDimensionInput && <div className={styles.empty}>No dimensions</div>}
            </SubSection>

            {/* Fonts subsection */}
            <SubSection
                title="Fonts"
                collapsed={fontsCollapsed}
                onToggle={() => setFontsCollapsed(v => !v)}
                onAdd={() => setShowFontInput(true)}
                addTitle="Add font"
            >
                {showFontInput && (
                    <div className={styles.fontInputRow}>
                        <input
                            autoFocus
                            className={styles.fontInput}
                            placeholder="Google Font name…"
                            value={fontInputText}
                            onChange={e => setFontInputText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') commitFontInput()
                                if (e.key === 'Escape') { setShowFontInput(false); setFontInputText('') }
                            }}
                        />
                        <button className={styles.fontAddBtn} onClick={commitFontInput}>Add</button>
                    </div>
                )}
                {library.fonts.map(f => {
                    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.name)}&display=swap`
                    return (
                        <div key={f.id}>
                            <link rel="stylesheet" href={href}/>
                            <div
                                className={`${styles.row} ${selectedId === f.id && selectedType === 'font' ? styles.rowSelected : ''}`}
                                onClick={() => selectItem(f.id, 'font')}
                                onDoubleClick={() => startRename(f.id, f.name)}
                                onContextMenu={e => openContextMenu(e, f.id, 'font')}
                            >
                                <div className={styles.fontIcon} style={{fontFamily: `'${f.name}', sans-serif`}}>A</div>
                                {renamingId === f.id
                                    ? <input
                                        autoFocus
                                        className={styles.renameInput}
                                        value={renameText}
                                        onChange={e => setRenameText(e.target.value)}
                                        onBlur={() => commitRename('font')}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') commitRename('font')
                                            if (e.key === 'Escape') setRenamingId(null)
                                        }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    : <span className={styles.rowName}>{f.name}</span>
                                }
                            </div>
                        </div>
                    )
                })}
                {library.fonts.length === 0 && !showFontInput && <div className={styles.empty}>No fonts</div>}
            </SubSection>

            {ctxMenu && createPortal(
                <ContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    groups={ctxGroups}
                    onClose={() => setCtxMenu(null)}
                />,
                document.body,
            )}
        </div>
    )
}
