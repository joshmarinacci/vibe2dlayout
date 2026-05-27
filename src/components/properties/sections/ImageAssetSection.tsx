import type {ImageAsset} from '@model/imageAsset'
import type {AppAction} from '@store/types'
import {type Dispatch, useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import styles from '../PropertiesPanel.module.css'

interface Props {
    asset: ImageAsset
    usageCount: number
    usedByShapes: { id: string; name: string }[]
    dispatch: Dispatch<AppAction>
}

function formatBytes(base64: string): string {
    const bytes = Math.round((base64.length * 3) / 4)
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FORMAT_LABELS: Record<string, string> = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/svg+xml': 'SVG',
}

function guessMimeType(url: string, fallback: ImageAsset['mimeType']): ImageAsset['mimeType'] {
    const ext = url.split('.').pop()?.split('?')[0].toLowerCase() ?? ''
    const map: Record<string, ImageAsset['mimeType']> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    }
    return map[ext] ?? fallback
}

const MAX_SHAPES_SHOWN = 5

export function ImageAssetSection({asset, usageCount, usedByShapes, dispatch}: Props) {
    const [urlDraft, setUrlDraft] = useState<string | null>(null)

    const commitUrl = () => {
        if (urlDraft === null) return
        const url = urlDraft.trim()
        if (url && url !== asset.src) {
            dispatch({
                type: 'UPDATE_IMAGE_ASSET',
                asset: {...asset, src: url, mimeType: guessMimeType(url, asset.mimeType)},
            })
        }
        setUrlDraft(null)
    }

    const isEmbedded = asset.src.startsWith('data:') || (!asset.src.startsWith('http') && !asset.src.startsWith('//'))

    return (
        <>
            <CollapsibleSection title="Image Asset">
                <div className={styles.nameRow}>
                    <input
                        className={styles.nameInput}
                        value={asset.name}
                        onChange={e => dispatch({
                            type: 'UPDATE_IMAGE_ASSET',
                            asset: {...asset, name: e.target.value}
                        })}
                        placeholder="Asset name"
                    />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Source">
                {isEmbedded ? (
                    <>
                        <div className={styles.row}>
                            <label className={styles.label}>Type</label>
                            <span style={{fontSize: 12, color: '#555'}}>Embedded</span>
                        </div>
                        <div className={styles.row}>
                            <label className={styles.label}>Format</label>
                            <span style={{fontSize: 12, color: '#555'}}>{FORMAT_LABELS[asset.mimeType] ?? asset.mimeType}</span>
                        </div>
                        <div className={styles.row}>
                            <label className={styles.label}>Size</label>
                            <span style={{
                                fontSize: 12,
                                color: '#555'
                            }}>{formatBytes(asset.src)}</span>
                        </div>
                        {(asset.width !== undefined && asset.height !== undefined) && (
                            <div className={styles.row}>
                                <label className={styles.label}>Dimensions</label>
                                <span style={{
                                    fontSize: 12,
                                    color: '#555'
                                }}>{asset.width} × {asset.height} px</span>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles.row}>
                            <label className={styles.label}>Format</label>
                            <span style={{fontSize: 12, color: '#555'}}>{FORMAT_LABELS[asset.mimeType] ?? asset.mimeType}</span>
                        </div>
                        <div className={styles.row}>
                            <label className={styles.label}>URL</label>
                            <input
                                className={styles.nameInput}
                                value={urlDraft ?? asset.src}
                                onChange={e => setUrlDraft(e.target.value)}
                                onFocus={() => setUrlDraft(asset.src)}
                                onBlur={commitUrl}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitUrl();
                                    if (e.key === 'Escape') setUrlDraft(null)
                                }}
                                placeholder="https://..."
                            />
                        </div>
                        {(asset.width !== undefined && asset.height !== undefined) && (
                            <div className={styles.row}>
                                <label className={styles.label}>Dimensions</label>
                                <span style={{
                                    fontSize: 12,
                                    color: '#555'
                                }}>{asset.width} × {asset.height} px</span>
                            </div>
                        )}
                    </>
                )}
            </CollapsibleSection>

            <CollapsibleSection title="Usage">
                <div className={styles.row}>
                    <label className={styles.label}>Shapes</label>
                    <span style={{fontSize: 12, color: '#555'}}>{usageCount}</span>
                </div>
                {usedByShapes.slice(0, MAX_SHAPES_SHOWN).map(s => (
                    <div key={s.id} className={styles.row} style={{paddingLeft: 8}}>
    <span style={{
        fontSize: 11,
        color: '#666',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    }}>
      {s.name || '(unnamed)'}
    </span>
                    </div>
                ))}
                {usedByShapes.length > MAX_SHAPES_SHOWN && (
                    <div className={styles.row} style={{paddingLeft: 8}}>
                        <span style={{
                            fontSize: 11,
                            color: '#aaa'
                        }}>…and {usedByShapes.length - MAX_SHAPES_SHOWN} more</span>
                    </div>
                )}
            </CollapsibleSection>
        </>
    )
}
