import type {DimensionAsset} from '@model/dimensionAsset'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {useEffect, useState} from 'react'
import styles from '../PropertiesPanel.module.css'

interface Props {
    asset: DimensionAsset
    usageCount: number
    dispatch: Dispatch<AppAction>
}

export function DimensionAssetSection({asset, usageCount, dispatch}: Props) {
    const [nameDraft, setNameDraft] = useState(asset.name)
    const [widthDraft, setWidthDraft] = useState(String(asset.width))
    const [heightDraft, setHeightDraft] = useState(String(asset.height))

    useEffect(() => {
        setNameDraft(asset.name)
        setWidthDraft(String(asset.width))
        setHeightDraft(String(asset.height))
    }, [asset.id, asset.name, asset.width, asset.height])

    const commit = () => {
        const width = Number(widthDraft)
        const height = Number(heightDraft)
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return
        dispatch({
            type: 'UPDATE_DIMENSION_ASSET',
            asset: {
                ...asset,
                name: nameDraft.trim() || asset.name,
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
                        value={nameDraft}
                        onChange={e => setNameDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setNameDraft(asset.name)
                        }}
                    />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Width</span>
                    <input
                        className={styles.textInput}
                        value={widthDraft}
                        onChange={e => setWidthDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setWidthDraft(String(asset.width))
                        }}
                    />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Height</span>
                    <input
                        className={styles.textInput}
                        value={heightDraft}
                        onChange={e => setHeightDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setHeightDraft(String(asset.height))
                        }}
                    />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Used by</span>
                    <span className={styles.value}>{usageCount} page{usageCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div className={styles.section}>
                <div className={styles.row}>
                    <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => {
                            if (window.confirm(`Delete dimension "${asset.name}"? Pages using it will keep their current size but become custom dimensions.`)) {
                                dispatch({type: 'DELETE_DIMENSION_ASSET', assetId: asset.id})
                            }
                        }}
                    >
                        Delete Dimension
                    </button>
                </div>
            </div>
        </>
    )
}
