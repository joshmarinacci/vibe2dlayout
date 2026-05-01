import type {ImageAsset} from '@model/imageAsset'
import type {Shape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {generateId} from '@utils/idgen'
import {type Dispatch, useState} from 'react'
import {AssetRow} from './AssetRow'
import sectionStyles from './AssetsSection.module.css'
import styles from './StylesSection.module.css'

interface Props {
    assets: ImageAsset[]
    selectedAssetId: string | null
    dispatch: Dispatch<AppAction>
    shapes: Record<string, Shape>
}

export function AssetsSection({assets, selectedAssetId, dispatch, shapes}: Props) {
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [urlInput, setUrlInput] = useState('')
    const [nameInput, setNameInput] = useState('')

    const usageCount = (assetId: string) =>
        Object.values(shapes).filter(s => s.type === 'image' && (s as {
            assetId?: string
        }).assetId === assetId).length

    const addUrlAsset = () => {
        const url = urlInput.trim()
        if (!url) return
        const name = nameInput.trim() || 'Image'
        // Guess mimeType from URL extension
        const ext = url.split('.').pop()?.toLowerCase() ?? ''
        const mimeMap: Record<string, ImageAsset['mimeType']> = {
            png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
        }
        const mimeType = mimeMap[ext] ?? 'image/png'
        const asset: ImageAsset = {id: generateId(), name, src: url, mimeType}
        dispatch({type: 'ADD_IMAGE_ASSET', asset})
        dispatch({type: 'SELECT_IMAGE_ASSET', assetId: asset.id})
        setUrlInput('')
        setNameInput('')
        setShowAddMenu(false)
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
                    <span
                        className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.label}>Images</span>
                </div>
                <div style={{position: 'relative'}}>
                    <button
                        className={styles.addBtn}
                        onClick={() => setShowAddMenu(v => !v)}
                        title="Add image from URL"
                    >+
                    </button>
                    {showAddMenu && (
                        <div className={sectionStyles.addUrlMenu}>
                            <div className={sectionStyles.addUrlField}>
                                <label className={sectionStyles.addUrlLabel}>Name</label>
                                <input
                                    className={sectionStyles.addUrlInput}
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    placeholder="Image name"
                                />
                            </div>
                            <div className={sectionStyles.addUrlField}>
                                <label className={sectionStyles.addUrlLabel}>URL</label>
                                <input
                                    className={sectionStyles.addUrlInput}
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://..."
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') addUrlAsset()
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div className={sectionStyles.addUrlActions}>
                                <button className={sectionStyles.addUrlCancel}
                                        onClick={() => setShowAddMenu(false)}>Cancel
                                </button>
                                <button className={sectionStyles.addUrlConfirm}
                                        onClick={addUrlAsset}>Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {!collapsed && assets.length === 0 && (
                <div className={sectionStyles.empty}>No images</div>
            )}
            {!collapsed && assets.map(asset => (
                <AssetRow
                    key={asset.id}
                    asset={asset}
                    isSelected={asset.id === selectedAssetId}
                    usageCount={usageCount(asset.id)}
                    dispatch={dispatch}
                />
            ))}
        </div>
    )
}
