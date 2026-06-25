import type {PixelAsset} from '@model/pixelAsset'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import styles from '../PropertiesPanel.module.css'

interface Props {
    asset: PixelAsset
    usageCount: number
    dispatch: Dispatch<AppAction>
}

export function PixelAssetSection({asset, usageCount, dispatch}: Props) {
    return (
        <div className={styles.section}>
            <div className={styles.row}>
                <span className={styles.label}>Size</span>
                <span className={styles.value}>{asset.width}×{asset.height} px</span>
            </div>
            <div className={styles.row}>
                <span className={styles.label}>Used by</span>
                <span className={styles.value}>{usageCount} shape{usageCount !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.row}>
                <button
                    className={styles.actionBtn}
                    onClick={() => dispatch({type: 'START_PIXEL_EDIT', assetId: asset.id})}
                >
                    Edit Pixels
                </button>
            </div>
        </div>
    )
}
