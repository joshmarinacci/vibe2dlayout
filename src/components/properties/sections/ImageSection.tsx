import type { ImageShape, MimeType } from '@model/shapes'
import type { ImageAsset } from '@model/imageAsset'
import type { AppAction } from '@store/types'
import type { Dispatch } from 'react'
import { generateId } from '@utils/idgen'
import { ToggleInput } from '../inputs/ToggleInput'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
  shape: ImageShape
  dispatch: Dispatch<AppAction>
}

export function ImageSection({ shape, dispatch }: Props) {
  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const mimeType = file.type as MimeType
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        // Strip the data:...;base64, prefix to get raw base64
        const base64 = dataUrl.split(',')[1] ?? ''
        // Load image to get intrinsic dimensions
        const img = new Image()
        img.onload = () => {
          if (shape.assetId) {
            // Re-upload: update the existing asset (propagates to all linked shapes)
            const updatedAsset: ImageAsset = {
              id: shape.assetId,
              name: shape.name,
              src: base64,
              mimeType,
              width: img.naturalWidth,
              height: img.naturalHeight,
            }
            dispatch({ type: 'UPDATE_IMAGE_ASSET', asset: updatedAsset })
          } else {
            // First upload: create a new asset and link this shape
            const asset: ImageAsset = {
              id: generateId(),
              name: shape.name,
              src: base64,
              mimeType,
              width: img.naturalWidth,
              height: img.naturalHeight,
            }
            dispatch({ type: 'ADD_IMAGE_ASSET', asset })
            dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { src: base64, mimeType, assetId: asset.id } as Partial<ImageShape> })
          }
        }
        img.onerror = () => {
          // Fallback: no dimension info
          if (shape.assetId) {
            dispatch({ type: 'UPDATE_IMAGE_ASSET', asset: { id: shape.assetId, name: shape.name, src: base64, mimeType } })
          } else {
            const asset: ImageAsset = { id: generateId(), name: shape.name, src: base64, mimeType }
            dispatch({ type: 'ADD_IMAGE_ASSET', asset })
            dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { src: base64, mimeType, assetId: asset.id } as Partial<ImageShape> })
          }
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Image</div>
      <button className={styles.uploadBtn} onClick={handleUpload}>
        {shape.src ? 'Replace Image' : 'Upload Image'}
      </button>
      <ToggleInput
        label="Keep Ratio"
        value={shape.preserveAspectRatio}
        onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { preserveAspectRatio: v } })}
      />
      <NumberInput
        label="Opacity"
        value={Math.round(shape.opacity * 100)}
        min={0} max={100}
        onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { opacity: v / 100 } })}
        unit="%"
      />
    </div>
  )
}
