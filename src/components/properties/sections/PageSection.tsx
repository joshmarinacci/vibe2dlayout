import type {DimensionAsset} from '@model/dimensionAsset'
import type {PageShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {findBuiltInPageDimension, BUILTIN_PAGE_DIMENSIONS, resolvePageSize} from '@model/pageDimensions'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {NumberInput} from '../inputs/NumberInput'
import {ToggleInput} from '../inputs/ToggleInput'
import styles from '../PropertiesPanel.module.css'

type PageSizeChoice =
    | 'infinite'
    | 'custom'
    | `preset:${string}`
    | `document:${string}`
    | `library:${string}`

interface Props {
    shape: PageShape
    documentDimensions: DimensionAsset[]
    libraryDimensions: DimensionAsset[]
    dispatch: Dispatch<AppAction>
}

function concreteSizeFor(shape: PageShape, documentDimensions: DimensionAsset[], libraryDimensions: DimensionAsset[]): {width: number; height: number} | null {
    return resolvePageSize(shape.pageSize, documentDimensions, libraryDimensions) ?? shape.fixedSize
}

function choiceForPageSize(pageSize: PageShape['pageSize']): PageSizeChoice {
    if (!pageSize) return 'infinite'
    if (pageSize.kind === 'preset') return `preset:${pageSize.presetId}`
    if (pageSize.kind === 'custom') return 'custom'
    return `${pageSize.scope}:${pageSize.assetId}`
}

export function PageSection({shape, documentDimensions, libraryDimensions, dispatch}: Props) {
    const patch = (p: Partial<PageShape>) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: p})

    const pageSize = shape.pageSize ?? (shape.fixedSize
        ? {kind: 'custom' as const, width: shape.fixedSize.width, height: shape.fixedSize.height}
        : null)
    const concreteSize = concreteSizeFor(shape, documentDimensions, libraryDimensions)
    const choice = choiceForPageSize(pageSize)

    const setInfinite = () => patch({pageSize: null, fixedSize: null})

    const setPreset = (presetId: string) => {
        const preset = findBuiltInPageDimension(presetId)
        if (!preset) return
        patch({
            pageSize: {kind: 'preset', presetId},
            fixedSize: {width: preset.width, height: preset.height},
            transform: {...shape.transform, width: preset.width, height: preset.height},
        })
    }

    const setCustom = (width: number, height: number) => {
        patch({
            pageSize: {kind: 'custom', width, height},
            fixedSize: {width, height},
            transform: {...shape.transform, width, height},
        })
    }

    const setDocumentAsset = (assetId: string) => {
        const asset = documentDimensions.find(a => a.id === assetId)
        if (!asset) return
        patch({
            pageSize: {kind: 'asset', scope: 'document', assetId},
            fixedSize: {width: asset.width, height: asset.height},
            transform: {...shape.transform, width: asset.width, height: asset.height},
        })
    }

    const setLibraryAsset = (assetId: string) => {
        const asset = libraryDimensions.find(a => a.id === assetId)
        if (!asset) return
        patch({
            pageSize: {kind: 'asset', scope: 'library', assetId},
            fixedSize: {width: asset.width, height: asset.height},
            transform: {...shape.transform, width: asset.width, height: asset.height},
        })
    }

    const concreteWidth = concreteSize?.width ?? shape.fixedSize?.width ?? 800
    const concreteHeight = concreteSize?.height ?? shape.fixedSize?.height ?? 600
    const handleChoiceChange = (value: PageSizeChoice) => {
        if (value === 'infinite') setInfinite()
        else if (value === 'custom') setCustom(concreteWidth, concreteHeight)
        else if (value.startsWith('preset:')) setPreset(value.slice('preset:'.length))
        else if (value.startsWith('document:')) setDocumentAsset(value.slice('document:'.length))
        else if (value.startsWith('library:')) setLibraryAsset(value.slice('library:'.length))
    }

    return (
        <CollapsibleSection title="Page">
            <div className={`${styles.row} stretch-full`}>
                <span className={styles.label}>Size</span>
                <select
                    className={styles.textInput}
                    value={choice}
                    onChange={e => {
                        handleChoiceChange(e.target.value as PageSizeChoice)
                    }}
                >
                    <option value="infinite">Infinite</option>
                    <optgroup label="Built-in presets">
                        {BUILTIN_PAGE_DIMENSIONS.map(preset => (
                            <option key={preset.id} value={`preset:${preset.id}`}>
                                {preset.name} ({preset.width} × {preset.height})
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Document dimensions">
                        {documentDimensions.length === 0
                            ? <option value="document:" disabled>No dimensions</option>
                            : documentDimensions.map(asset => (
                                <option key={asset.id} value={`document:${asset.id}`}>
                                    {asset.name} ({asset.width} × {asset.height})
                                </option>
                            ))
                        }
                    </optgroup>
                    <optgroup label="Library dimensions">
                        {libraryDimensions.length === 0
                            ? <option value="library:" disabled>No dimensions</option>
                            : libraryDimensions.map(asset => (
                                <option key={asset.id} value={`library:${asset.id}`}>
                                    {asset.name} ({asset.width} × {asset.height})
                                </option>
                            ))
                        }
                    </optgroup>
                    <option value="custom">Custom</option>
                </select>
            </div>

            {choice === 'custom' && (
                <>
                    <NumberInput
                        label="Width"
                        value={concreteWidth}
                        min={1}
                        onChange={v => setCustom(v, concreteHeight)}
                        unit="px"
                        className={'left'}
                    />
                    <NumberInput
                        label="Height"
                        value={concreteHeight}
                        min={1}
                        onChange={v => setCustom(concreteWidth, v)}
                        unit="px"
                        className={'right'}
                    />
                </>
            )}

            {concreteSize && (
                <div className={styles.row}>
                    <span className={styles.label}>Resolved</span>
                    <span className={styles.value}>{concreteSize.width} × {concreteSize.height} px</span>
                </div>
            )}

            <ToggleInput
                className={'left'}
                label="Clip"
                value={shape.clipChildren}
                onChange={v => patch({clipChildren: v})}
            />
        </CollapsibleSection>
    )
}
