import type {DimensionAsset} from '@model/dimensionAsset'
import type {Shape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {type Dispatch, useRef, useState} from 'react'
import {DimensionRow} from './DimensionRow'
import {DimensionAddDialog} from './DimensionAddDialog'
import sectionStyles from './AssetsSection.module.css'
import styles from './StylesSection.module.css'

interface Props {
    assets: DimensionAsset[]
    selectedDimensionAssetId: string | null
    dispatch: Dispatch<AppAction>
    shapes: Record<string, Shape>
}

export function DimensionsSection({assets, selectedDimensionAssetId, dispatch, shapes}: Props) {
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const addButtonWrapRef = useRef<HTMLDivElement>(null)

    const usageCount = (assetId: string) =>
        Object.values(shapes).filter(s => s.type === 'page' && (s as {
            pageSize?: { kind: 'asset'; scope: 'document' | 'library'; assetId: string }
        }).pageSize?.kind === 'asset' && (s as {
            pageSize?: { kind: 'asset'; scope: 'document' | 'library'; assetId: string }
        }).pageSize?.scope === 'document' && (s as {
            pageSize?: { kind: 'asset'; scope: 'document' | 'library'; assetId: string }
        }).pageSize?.assetId === assetId).length

    const openMenu = () => {
        setShowAddMenu(v => !v)
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
                    <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.label}>Dimensions</span>
                </div>
                <div ref={addButtonWrapRef} style={{position: 'relative'}}>
                    <button
                        className={styles.addBtn}
                        onClick={openMenu}
                        title="Add dimension"
                    >+
                    </button>
                </div>
            </div>
            <DimensionAddDialog
                open={showAddMenu}
                anchorRef={addButtonWrapRef}
                title="Dimension"
                onCancel={() => setShowAddMenu(false)}
                onCreate={asset => {
                    dispatch({type: 'ADD_DIMENSION_ASSET', asset})
                    dispatch({type: 'SELECT_DIMENSION_ASSET', assetId: asset.id})
                }}
            />
            {!collapsed && assets.length === 0 && (
                <div className={sectionStyles.empty}>No dimensions</div>
            )}
            {!collapsed && assets.map(asset => (
                <DimensionRow
                    key={asset.id}
                    asset={asset}
                    isSelected={asset.id === selectedDimensionAssetId}
                    scope="document"
                    usageCount={usageCount(asset.id)}
                    dispatch={dispatch}
                />
            ))}
        </div>
    )
}
