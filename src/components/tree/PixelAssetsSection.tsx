import { useState, type Dispatch } from 'react'
import type { PixelAsset } from '@model/pixelAsset'
import type { Shape } from '@model/shapes'
import type { AppAction } from '@store/types'
import sectionStyles from './StylesSection.module.css'
import rowStyles from './StyleRow.module.css'
import assetStyles from './AssetsSection.module.css'

interface Props {
  assets: PixelAsset[]
  selectedPixelAssetId: string | null
  dispatch: Dispatch<AppAction>
  shapes: Record<string, Shape>
}

export function PixelAssetsSection({ assets, selectedPixelAssetId, dispatch, shapes }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const usageCount = (assetId: string) =>
    Object.values(shapes).filter(s => s.type === 'pixelimage' && (s as { assetId?: string }).assetId === assetId).length

  return (
    <div>
      <div className={sectionStyles.header}>
        <div className={sectionStyles.headerLabel} onClick={() => setCollapsed(v => !v)}>
          <span className={`${sectionStyles.chevron} ${collapsed ? '' : sectionStyles.chevronOpen}`}>›</span>
          <span className={sectionStyles.label}>Pixel Images</span>
        </div>
      </div>
      {!collapsed && assets.length === 0 && (
        <div className={assetStyles.empty}>No pixel images</div>
      )}
      {!collapsed && assets.map(asset => (
        <div
          key={asset.id}
          className={`${rowStyles.row} ${asset.id === selectedPixelAssetId ? rowStyles.selected : ''}`}
          onClick={() => dispatch({ type: 'SELECT_PIXEL_ASSET', assetId: asset.id })}
        >
          {renamingId === asset.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => {
                const name = renameValue.trim() || asset.name
                dispatch({ type: 'UPDATE_PIXEL_ASSET', asset: { ...asset, name } })
                setRenamingId(null)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setRenamingId(null)
              }}
              className={rowStyles.nameInput}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className={rowStyles.name}
              style={{ flex: 1 }}
              onDoubleClick={e => {
                e.stopPropagation()
                setRenamingId(asset.id)
                setRenameValue(asset.name)
              }}
            >
              {asset.name}
            </span>
          )}
          <span className={rowStyles.preview}>{asset.width}×{asset.height}</span>
          {usageCount(asset.id) > 0 && (
            <span className={rowStyles.preview} style={{ flexShrink: 0, flex: 'none' }}>
              ×{usageCount(asset.id)}
            </span>
          )}
          <button
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-disabled)',
              cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px', flexShrink: 0,
            }}
            onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_PIXEL_ASSET', assetId: asset.id }) }}
            title="Delete pixel image"
          >×</button>
        </div>
      ))}
    </div>
  )
}
