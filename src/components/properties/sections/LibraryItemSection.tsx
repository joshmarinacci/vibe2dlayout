import type {Library} from '@model/library'
import type {AppAction} from '@store/types'
import {gradientCSS} from '@utils/fillCSS'
import type {Dispatch} from 'react'
import {useEffect, useState} from 'react'
import styles from '../PropertiesPanel.module.css'

interface Props {
    library: Library
    itemId: string
    itemType: 'gradient' | 'image' | 'font' | 'dimension'
    dispatch: Dispatch<AppAction>
}

function LibraryDimensionSection({
    dim,
    dispatch,
}: {
    dim: NonNullable<Library['dimensions'][number]>
    dispatch: Dispatch<AppAction>
}) {
    const [nameText, setNameText] = useState<string>(dim.name)
    const [widthText, setWidthText] = useState<string>(String(dim.width))
    const [heightText, setHeightText] = useState<string>(String(dim.height))

    useEffect(() => {
        setNameText(dim.name)
        setWidthText(String(dim.width))
        setHeightText(String(dim.height))
    }, [dim.id, dim.name, dim.width, dim.height])

    const commit = () => {
        const width = Number(widthText)
        const height = Number(heightText)
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return
        dispatch({
            type: 'UPDATE_LIBRARY_DIMENSION',
            dimension: {
                ...dim,
                name: nameText.trim() || dim.name,
                width: Math.round(width),
                height: Math.round(height),
            },
        })
    }

    return (
        <>
            <div className={styles.section}>
                <div className={styles.row}>
                    <span className={styles.label}>Name</span>
                    <input
                        className={styles.textInput}
                        value={nameText}
                        onChange={e => setNameText(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setNameText(dim.name)
                        }}
                    />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Width</span>
                    <input
                        className={styles.textInput}
                        value={widthText}
                        onChange={e => setWidthText(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setWidthText(String(dim.width))
                        }}
                    />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Height</span>
                    <input
                        className={styles.textInput}
                        value={heightText}
                        onChange={e => setHeightText(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setHeightText(String(dim.height))
                        }}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.row}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => dispatch({type: 'ADD_DIMENSION_ASSET', asset: {id: crypto.randomUUID(), name: dim.name, width: dim.width, height: dim.height}})}
                    >
                        Add to Document
                    </button>
                </div>
                <div className={styles.row}>
                    <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => dispatch({type: 'DELETE_LIBRARY_DIMENSION', id: dim.id})}
                    >
                        Delete from Library
                    </button>
                </div>
            </div>
        </>
    )
}

export function LibraryItemSection({library, itemId, itemType, dispatch}: Props) {
    const [nameText, setNameText] = useState<string | null>(null)

    if (itemType === 'gradient') {
        const g = library.gradients.find(x => x.id === itemId)
        if (!g) return null
        const previewCSS = gradientCSS({type: 'gradient', gradientType: 'linear', angle: 90, stops: g.stops, opacity: 1})
        const displayName = nameText ?? g.name

        return (
            <>
                <div className={styles.section}>
                    <div className={styles.row}>
                        <span className={styles.label}>Name</span>
                        <input
                            className={styles.textInput}
                            value={displayName}
                            onChange={e => setNameText(e.target.value)}
                            onBlur={() => {
                                if (nameText !== null && nameText.trim()) {
                                    dispatch({type: 'RENAME_LIBRARY_ITEM', id: g.id, name: nameText.trim(), itemType: 'gradient'})
                                }
                                setNameText(null)
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                if (e.key === 'Escape') setNameText(null)
                            }}
                        />
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Preview</span>
                        <div style={{height: 20, flex: 1, borderRadius: 3, border: '1px solid rgba(0,0,0,0.15)', background: previewCSS}}/>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Stops</span>
                        <span className={styles.value}>{g.stops.length}</span>
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.row}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => dispatch({type: 'ADD_GRADIENT', gradient: {id: crypto.randomUUID(), name: g.name, stops: [...g.stops]}})}
                        >
                            Add to Document
                        </button>
                    </div>
                    <div className={styles.row}>
                        <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => dispatch({type: 'DELETE_LIBRARY_GRADIENT', id: g.id})}
                        >
                            Delete from Library
                        </button>
                    </div>
                </div>
            </>
        )
    }

    if (itemType === 'image') {
        const img = library.images.find(x => x.id === itemId)
        if (!img) return null
        const displayName = nameText ?? img.name
        const dataUrl = `data:${img.mimeType};base64,${img.src}`

        return (
            <>
                <div className={styles.section}>
                    <div className={styles.row}>
                        <span className={styles.label}>Name</span>
                        <input
                            className={styles.textInput}
                            value={displayName}
                            onChange={e => setNameText(e.target.value)}
                            onBlur={() => {
                                if (nameText !== null && nameText.trim()) {
                                    dispatch({type: 'RENAME_LIBRARY_ITEM', id: img.id, name: nameText.trim(), itemType: 'image'})
                                }
                                setNameText(null)
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                if (e.key === 'Escape') setNameText(null)
                            }}
                        />
                    </div>
                    {img.width && img.height && (
                        <div className={styles.row}>
                            <span className={styles.label}>Size</span>
                            <span className={styles.value}>{img.width}×{img.height}</span>
                        </div>
                    )}
                    <div className={styles.row}>
                        <span className={styles.label}>Format</span>
                        <span className={styles.value}>{img.mimeType.split('/')[1]?.toUpperCase()}</span>
                    </div>
                </div>
                <div className={styles.section}>
                    <img src={dataUrl} alt={img.name} style={{width: '100%', borderRadius: 4, border: '1px solid var(--color-border)'}}/>
                </div>
                <div className={styles.section}>
                    <div className={styles.row}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => dispatch({type: 'ADD_IMAGE_ASSET', asset: {id: crypto.randomUUID(), name: img.name, src: img.src, mimeType: img.mimeType, width: img.width, height: img.height}})}
                        >
                            Add to Document
                        </button>
                    </div>
                    <div className={styles.row}>
                        <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => dispatch({type: 'DELETE_LIBRARY_IMAGE', id: img.id})}
                        >
                            Delete from Library
                        </button>
                    </div>
                </div>
            </>
        )
    }

    if (itemType === 'dimension') {
        const dim = library.dimensions.find(x => x.id === itemId)
        if (!dim) return null
        return <LibraryDimensionSection dim={dim} dispatch={dispatch}/>
    }

    if (itemType === 'font') {
        const f = library.fonts.find(x => x.id === itemId)
        if (!f) return null

        const variableLabel =
            f.isVariable === null ? 'Detecting…' :
            f.isVariable ? 'Variable font' : 'Static font'

        return (
            <>
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Font</div>
                    <div className={styles.row}>
                        <span className={styles.label}>Name</span>
                        <span className={styles.value} style={{fontFamily: f.name, fontSize: 14}}>{f.name}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Type</span>
                        <span className={styles.value}>{variableLabel}</span>
                    </div>
                </div>

                {f.isVariable === true && f.axes.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Variable Axes</div>
                        {f.axes.map(axis => (
                            <div key={axis.tag} className={styles.row}>
                                <span className={styles.label} style={{fontFamily: 'ui-monospace, monospace'}}>
                                    {axis.name ? `${axis.name} (${axis.tag})` : axis.tag}
                                </span>
                                <span className={styles.value}>{axis.min} – {axis.default} – {axis.max}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.section}>
                    <div className={styles.row}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => dispatch({type: 'ADD_CUSTOM_FONT', font: {id: crypto.randomUUID(), name: f.name, isVariable: f.isVariable, axes: [...f.axes], metadataVersion: f.metadataVersion}})}
                        >
                            Add to Document
                        </button>
                    </div>
                    <div className={styles.row}>
                        <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => dispatch({type: 'DELETE_LIBRARY_FONT', id: f.id})}
                        >
                            Delete from Library
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return null
}
