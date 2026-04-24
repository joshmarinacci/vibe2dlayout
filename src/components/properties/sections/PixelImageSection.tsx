import type { Dispatch } from 'react'
import type { PixelImageShape } from '@model/shapes'
import type { PixelAsset } from '@model/pixelAsset'
import type { AppAction } from '@store/types'
import styles from '../PropertiesPanel.module.css'

interface Props {
  shape: PixelImageShape
  asset: PixelAsset | undefined
  dispatch: Dispatch<AppAction>
}

export function PixelImageSection({ shape, asset, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Pixel Image</div>
      <div className={styles.row}>
        <span className={styles.label}>Asset</span>
        <span className={styles.value}>{asset ? asset.name : '(none)'}</span>
      </div>
      {asset && (
        <div className={styles.row}>
          <span className={styles.label}>Size</span>
          <span className={styles.value}>{asset.width}×{asset.height} px</span>
        </div>
      )}
      <div className={styles.row}>
        <button
          className={styles.actionBtn}
          onClick={() => dispatch({ type: 'START_PIXEL_EDIT', assetId: shape.assetId })}
          disabled={!shape.assetId}
        >
          Edit Pixels
        </button>
      </div>
    </div>
  )
}
