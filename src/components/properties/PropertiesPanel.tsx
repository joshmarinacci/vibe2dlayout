import type {GridStyle} from '@model/grid'
import type {FillStyle, Shape, ShapeWithCorners, StrokeStyle, TextStyle} from '@model/shapes'
import {getPowerUpDefinition, getRegisteredDocumentPowerUps} from '@powerups/registry'
import {shapeRegistry} from '@powerups/shapeRegistry'
import {
    fillColor,
    type FilledShape,
    type ImageShape,
    type ShapeWithText,
    strokeColor,
    type StrokedShape,
    type TransformedShape
} from '@model/shapes'
import {ShapeSupervisor} from "@model/ShapeSupervisor.ts";
import {getActiveTheme} from '@model/theme'
import type {BoundingBox} from '@model/transform'
import {useAppDispatch, useAppState} from '@store/context'
import {selectSelectedShapes} from '@store/selectors'
import {RotateCcw} from 'lucide-react'
import {CollapsibleSection} from './CollapsibleSection'
import {ColorInput} from './inputs/ColorInput'
import {NumberInput} from './inputs/NumberInput'
import {ToggleInput} from './inputs/ToggleInput'
import styles from './PropertiesPanel.module.css'
import {ConnectorSection} from './sections/ConnectorSection'
import {ContentSection} from './sections/ContentSection'
import {DocumentSection} from './sections/DocumentSection'
import {FillSection} from './sections/FillSection'
import {FontInfoSection} from './sections/FontInfoSection'
import {ImageAssetSection} from './sections/ImageAssetSection'
import {ImageSection} from './sections/ImageSection'
import {DocumentGradientSection} from './sections/DocumentGradientSection'
import {LibraryItemSection} from './sections/LibraryItemSection'
import {PageSection} from './sections/PageSection'
import {PixelImageSection} from './sections/PixelImageSection'
import {DocumentPowerUpsSection, ShapePowerUpsSection, UnknownDocumentPowerUpsSection} from './sections/PowerUpsSection'
import {ShadowSection} from './sections/ShadowSection'
import {StrokeSection} from './sections/StrokeSection'
import {TextSection} from './sections/TextSection'
import {TField, TransformSection} from './sections/TransformSection'
import {CornerRadiusControl} from "./inputs/CornerRadiusControl";

function commonValue<T>(vals: T[]): T | null {
    if (vals.length === 0) return null
    const first = vals[0]
    return vals.every(v => JSON.stringify(v) === JSON.stringify(first)) ? first : null
}

export function PropertiesPanel() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const selected = selectSelectedShapes(state)

    if (state.selectedGradientId !== null) {
        const gradient = (state.document.gradients ?? []).find(g => g.id === state.selectedGradientId)
        if (gradient) {
            return (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <span className={styles.shapeType}>gradient</span>
                        <span className={styles.shapeName}>{gradient.name}</span>
                    </div>
                    <DocumentGradientSection gradient={gradient} dispatch={dispatch}/>
                </div>
            )
        }
    }

    if (state.selectedLibraryItemId !== null && state.selectedLibraryItemType !== null) {
        const typeLabel = state.selectedLibraryItemType
        return (
            <div className={styles.panel}>
                <div className={styles.header}>
                    <span className={styles.shapeType}>library</span>
                    <span className={styles.shapeName}>{typeLabel}</span>
                </div>
                <LibraryItemSection
                    library={state.library}
                    itemId={state.selectedLibraryItemId}
                    itemType={state.selectedLibraryItemType}
                    dispatch={dispatch}
                />
            </div>
        )
    }

    if (state.selectedPixelAssetId !== null) {
        const pixelAsset = state.document.pixelAssets.find(a => a.id === state.selectedPixelAssetId)
        if (pixelAsset) {
            const usedByShapes = Object.values(state.document.shapes)
                .filter(s => s.type === 'pixelimage' && (s as {
                    assetId?: string
                }).assetId === pixelAsset.id)
            return (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <span className={styles.shapeType}>pixel image</span>
                        <span className={styles.shapeName}>{pixelAsset.name}</span>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.row}>
                            <span className={styles.label}>Size</span>
                            <span
                                className={styles.value}>{pixelAsset.width}×{pixelAsset.height} px</span>
                        </div>
                        <div className={styles.row}>
                            <span className={styles.label}>Used by</span>
                            <span
                                className={styles.value}>{usedByShapes.length} shape{usedByShapes.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className={styles.row}>
                            <button
                                className={styles.actionBtn}
                                onClick={() => dispatch({
                                    type: 'START_PIXEL_EDIT',
                                    assetId: pixelAsset.id
                                })}
                            >
                                Edit Pixels
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
    }

    if (state.selectedFontName !== null) {
        const font = state.document.customFonts.find(f => f.name === state.selectedFontName)
        if (font) {
            return (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <span className={styles.shapeType}>font</span>
                        <span className={styles.shapeName}>{font.name}</span>
                    </div>
                    <FontInfoSection font={font} dispatch={dispatch}/>
                </div>
            )
        }
    }

    if (state.selectedAssetId !== null) {
        const asset = state.document.images.find(a => a.id === state.selectedAssetId)
        if (asset) {
            const usedByShapes = Object.values(state.document.shapes)
                .filter(s => s.type === 'image' && (s as ImageShape).assetId === asset.id)
            return (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <span className={styles.shapeType}>asset</span>
                        <span className={styles.shapeName}>{asset.name}</span>
                    </div>
                    <ImageAssetSection
                        asset={asset}
                        usageCount={usedByShapes.length}
                        usedByShapes={usedByShapes.map(s => ({id: s.id, name: s.name}))}
                        dispatch={dispatch}
                    />
                </div>
            )
        }
    }

    if (state.documentSelected) {
        const registeredPowerUps = getRegisteredDocumentPowerUps(state.document)
        const unknownPowerUps = (state.document.powerUps ?? [])
            .filter(entry => !getPowerUpDefinition(entry.id))
            .map(entry => ({id: entry.id, version: entry.version}))
        return (
            <div className={styles.panel}>
                <div className={styles.header}>
                    <span className={styles.shapeType}>document</span>
                    <span className={styles.shapeName}>{state.documentName}</span>
                </div>
                <DocumentSection
                    documentName={state.documentName}
                    documentId={state.documentId}
                    gridSettings={state.document.gridSettings}
                    activeThemeName={getActiveTheme(state.document).name}
                    dispatch={dispatch}
                />
                <DocumentPowerUpsSection registeredPowerUps={registeredPowerUps} dispatch={dispatch}/>
                <UnknownDocumentPowerUpsSection unknownEntries={unknownPowerUps} dispatch={dispatch}/>
            </div>
        )
    }

    if (selected.length === 0) {
        return (
            <div className={styles.panel}>
                <div className={styles.empty}>No selection</div>
            </div>
        )
    }

    if (selected.length > 1) {
        // Shapes with a transform (non-line, non-page)
        const transformable = selected.filter(s => s.type !== 'line' && s.type !== 'page') as Extract<Shape, {
            transform: BoundingBox
        }>[]
        const cx = commonValue(transformable.map(s => s.transform.x))
        const cy = commonValue(transformable.map(s => s.transform.y))
        const cw = commonValue(transformable.map(s => s.transform.width))
        const ch = commonValue(transformable.map(s => s.transform.height))

        const applyTransformField = (key: keyof BoundingBox, val: number) => {
            for (const s of transformable) {
                dispatch({type: 'SET_TRANSFORM', id: s.id, transform: {...s.transform, [key]: val}})
            }
        }

        // Shapes with fill (show section if any have it; apply only to those that do)
        const withFill = selected.filter(s => 'fill' in s) as Extract<Shape, { fill: FillStyle }>[]
        const commonFillColor = commonValue(withFill.map(s => fillColor(s.fill)))
        const commonFillOpacity = commonValue(withFill.map(s => s.fill.opacity))

        // Shapes with stroke (show section if any have it; apply only to those that do)
        const withStroke = selected.filter(s => 'stroke' in s) as Extract<Shape, {
            stroke: StrokeStyle
        }>[]
        const commonStrokeColor = commonValue(withStroke.map(s => strokeColor(s.stroke)))
        const commonStrokeWidth = commonValue(withStroke.map(s => s.stroke.width))
        const commonStrokeOpacity = commonValue(withStroke.map(s => s.stroke.opacity))

        // Shapes with text style (show section if any have it; apply only to those that do)
        const withText = selected.filter(s => 'text' in s) as Extract<Shape, { text: TextStyle }>[]
        // Use first shape's text as representative; on change, apply only the changed fields to each shape
        const repText = withText[0]?.text
        const onChangeText = (newText: TextStyle) => {
            const delta = (Object.keys(newText) as (keyof TextStyle)[]).reduce((acc, k) => {
                if (newText[k] !== repText[k]) acc[k] = newText[k] as never
                return acc
            }, {} as Partial<TextStyle>)
            for (const s of withText) {
                dispatch({
                    type: 'PATCH_SHAPE',
                    id: s.id,
                    patch: {text: {...s.text, ...delta}} as Partial<Shape>
                })
            }
        }

        const resetToTheme = () => dispatch({
            type: 'RESET_SHAPES_TO_THEME',
            ids: selected.map(s => s.id)
        })

        return (
            <div className={styles.panel}>
                <div className={styles.header}>{selected.length} shapes selected</div>
                <div className={styles.resetRow}>
                    <button className={styles.resetThemeBtn} onClick={resetToTheme}
                            title="Reset selected shapes to active theme values">
                        <RotateCcw size={11}/> Reset to theme ({getActiveTheme(state.document).name})
                    </button>
                </div>
                <CollapsibleSection title="Common">
                    <ToggleInput
                        label="Visible"
                        value={selected.every(s => s.visible)}
                        onChange={v => selected.forEach(s =>
                            dispatch({type: 'PATCH_SHAPE', id: s.id, patch: {visible: v}})
                        )}
                    />
                    <ToggleInput
                        label="Locked"
                        value={selected.every(s => s.locked)}
                        onChange={v => selected.forEach(s =>
                            dispatch({type: 'PATCH_SHAPE', id: s.id, patch: {locked: v}})
                        )}
                    />
                </CollapsibleSection>
                {transformable.length > 0 && (
                    <CollapsibleSection title="Transform">
                        <div>
                            <TField label="X" value={cx} onChange={v => applyTransformField('x', v)}/>
                            <TField label="Y" value={cy} onChange={v => applyTransformField('y', v)}/>
                            <TField label="W" value={cw} onChange={v => applyTransformField('width', v)} min={1}/>
                            <TField label="H" value={ch} onChange={v => applyTransformField('height', v)} min={1}/>
                        </div>
                    </CollapsibleSection>
                )}
                {withFill.length > 0 && (
                    <CollapsibleSection title="Fill">
                        <ColorInput
                            label="Color"
                            value={{color: commonFillColor ?? '#808080'}}
                            onChange={ref => withFill.forEach(s =>
                                dispatch({
                                    type: 'PATCH_SHAPE',
                                    id: s.id,
                                    patch: {
                                        fill: {
                                            ...s.fill,
                                            color: ref.color,
                                            paletteColorId: ref.paletteColorId
                                        }
                                    } as Partial<Shape>
                                })
                            )}
                        />
                        <NumberInput
                            label="Opacity"
                            value={commonFillOpacity !== null ? Math.round(commonFillOpacity * 100) : 0}
                            min={0} max={100} unit="%"
                            onChange={v => withFill.forEach(s =>
                                dispatch({
                                    type: 'PATCH_SHAPE',
                                    id: s.id,
                                    patch: {fill: {...s.fill, opacity: v / 100}} as Partial<Shape>
                                })
                            )}
                        />
                    </CollapsibleSection>
                )}
                {withStroke.length > 0 && (
                    <CollapsibleSection title="Stroke">
                        <ColorInput
                            label="Color"
                            value={{color: commonStrokeColor ?? '#808080'}}
                            onChange={ref => withStroke.forEach(s =>
                                dispatch({
                                    type: 'PATCH_SHAPE',
                                    id: s.id,
                                    patch: {
                                        stroke: {
                                            ...s.stroke,
                                            color: ref.color,
                                            paletteColorId: ref.paletteColorId
                                        }
                                    } as Partial<Shape>
                                })
                            )}
                        />
                        <NumberInput
                            label="Width"
                            value={commonStrokeWidth ?? 0}
                            min={0} step={0.5} unit="px"
                            onChange={v => withStroke.forEach(s =>
                                dispatch({
                                    type: 'PATCH_SHAPE',
                                    id: s.id,
                                    patch: {stroke: {...s.stroke, width: v}} as Partial<Shape>
                                })
                            )}
                        />
                        <NumberInput
                            label="Opacity"
                            value={commonStrokeOpacity !== null ? Math.round(commonStrokeOpacity * 100) : 0}
                            min={0} max={100} unit="%"
                            onChange={v => withStroke.forEach(s =>
                                dispatch({
                                    type: 'PATCH_SHAPE',
                                    id: s.id,
                                    patch: {
                                        stroke: {
                                            ...s.stroke,
                                            opacity: v / 100
                                        }
                                    } as Partial<Shape>
                                })
                            )}
                        />
                    </CollapsibleSection>
                )}
                {repText && withText[0] && (
                    <TextSection
                        text={repText}
                        onChange={onChangeText}
                        customFonts={state.document.customFonts.map(f => f.name)}
                        activeFont={repText.fontFamily ? (state.document.customFonts.find(f => f.name === repText.fontFamily) ?? null) : null}
                    />
                )}
            </div>
        )
    }

    const shape = selected[0]
    const resetToTheme = () => dispatch({type: 'RESET_SHAPES_TO_THEME', ids: [shape.id]})

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.shapeType}>{shape.type}</span>
                <span className={styles.shapeName}>{shape.name}</span>
            </div>

            <div className={styles.resetRow}>
                <button className={styles.resetThemeBtn} onClick={resetToTheme}
                        disabled={shape.locked} title="Reset this shape to active theme values">
                    <RotateCcw size={11}/> Reset to theme ({getActiveTheme(state.document).name})
                </button>
            </div>

            {shape.locked && (
                <div className={styles.lockedBanner}>
                    🔒 Locked — unlock to edit properties
                </div>
            )}

            <div className={styles.nameRow}>
                <input
                    className={styles.nameInput}
                    value={shape.name}
                    disabled={shape.locked}
                    onChange={e => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {name: e.target.value}
                    })}
                />
            </div>

            <div className={styles.visibilityRow}>
                <ToggleInput
                    label="Visible"
                    value={shape.visible}
                    onChange={v => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {visible: v}
                    })}
                />
                <ToggleInput
                    label="Locked"
                    value={shape.locked}
                    onChange={v => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {locked: v}
                    })}
                />
            </div>

                <div style={shape.locked ? {opacity: 0.5, pointerEvents: 'none'} : undefined}>
                <ShapeProperties shape={shape} dispatch={dispatch} state={state}/>
            </div>
        </div>
    )
}

function ShapeProperties({shape, dispatch, state}: {
    shape: Shape
    dispatch: ReturnType<typeof useAppDispatch>
    state: ReturnType<typeof useAppState>['state']
}) {
    const activePowerUps = getRegisteredDocumentPowerUps(state.document)
    const patchTransform = (t: BoundingBox) =>
        dispatch({type: 'SET_TRANSFORM', id: shape.id, transform: t})
    const patchFill = (f: FillStyle) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {fill: f} as Partial<Shape>})
    const patchStroke = (s: StrokeStyle) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {stroke: s} as Partial<Shape>})

    const customFontNames = state.document.customFonts.map(f => f.name)
    const shapeRawText = (shape as unknown as { text?: { fontFamily?: string } }).text
    const resolvedFontFamily = shapeRawText?.fontFamily
    const activeFont = resolvedFontFamily
        ? (state.document.customFonts.find(f => f.name === resolvedFontFamily) ?? null)
        : null


    const common = []

    if (ShapeSupervisor.hasCornerRadius(shape)) {
        const cornered = shape as ShapeWithCorners
        common.push(<CollapsibleSection title="Corners">
            <CornerRadiusControl
                cornerRadius={cornered.cornerRadius}
                cornerRadii={cornered.cornerRadii}
                onChangeUniform={v => dispatch({
                    type: 'PATCH_SHAPE',
                    id: shape.id,
                    patch: {cornerRadius: v}
                })}
                onChangeRadii={r => dispatch({
                    type: 'PATCH_SHAPE',
                    id: shape.id,
                    patch: {cornerRadii: r}
                })}
            />
        </CollapsibleSection>)

    }
    if (ShapeSupervisor.hasText(shape)) {
        const texted: ShapeWithText = shape as ShapeWithText
        common.push(<TextSection
            text={texted.text}
            onChange={t => dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {text: t}})}
            customFonts={customFontNames}
            activeFont={activeFont}
        />)
    }
    if (ShapeSupervisor.hasFill(shape)) {
        const filled: FilledShape = shape as FilledShape
        common.push(<FillSection fill={filled.fill} onChange={patchFill}/>)
    }
    if (ShapeSupervisor.hasStroke(shape)) {
        const stroked: StrokedShape = shape as StrokedShape
        common.push(<StrokeSection stroke={stroked.stroke} onChange={patchStroke}/>)
    }
    if (ShapeSupervisor.hasTransform(shape)) {
        const transformed: TransformedShape = shape as TransformedShape
        common.push(<TransformSection transform={transformed.transform} onChange={patchTransform}/>)
    }
    common.push(<ShadowSection shape={shape} dispatch={dispatch}/>)
    switch (shape.type) {
        case 'rect':
            return (
                <>
                    {common}
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )

        case 'circle':
            return (
                <>
                    {common}
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )

        case 'line':
            return (
                <>
                    <StrokeSection stroke={shape.stroke} onChange={patchStroke}/>
                    <ConnectorSection shape={shape} dispatch={dispatch}/>
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )

        case 'text':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )

        case 'image': {
            const linkedAsset = shape.assetId
                ? state.document.images.find(a => a.id === shape.assetId) ?? null
                : null
            return (
                <>
                    <ImageSection shape={shape} asset={linkedAsset} dispatch={dispatch}/>
                    {common}
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )
        }

        case 'page': {
            const pageGridOverride = shape.gridSettings
            const docGrid = state.document.gridSettings
            return (
                <>
                    <PageSection shape={shape} dispatch={dispatch}/>
                    <CollapsibleSection title="Grid Override">
                        <div className={styles.row}>
                            <label className={styles.label}>Override document grid</label>
                            <input
                                type="checkbox"
                                checked={!!pageGridOverride}
                                onChange={e => {
                                    if (e.target.checked) {
                                        dispatch({
                                            type: 'PATCH_SHAPE',
                                            id: shape.id,
                                            patch: {gridSettings: {...docGrid}}
                                        })
                                    } else {
                                        dispatch({
                                            type: 'PATCH_SHAPE',
                                            id: shape.id,
                                            patch: {gridSettings: undefined}
                                        })
                                    }
                                }}
                            />
                        </div>
                        {pageGridOverride && (
                            <>
                                <div className={styles.row}>
                                    <label className={styles.label}>Snap Enabled</label>
                                    <input
                                        type="checkbox"
                                        checked={pageGridOverride.snapEnabled ?? docGrid.snapEnabled}
                                        onChange={e => dispatch({
                                            type: 'PATCH_SHAPE',
                                            id: shape.id,
                                            patch: {
                                                gridSettings: {
                                                    ...pageGridOverride,
                                                    snapEnabled: e.target.checked
                                                }
                                            }
                                        })}
                                    />
                                </div>
                                <NumberInput
                                    label="Grid Size"
                                    value={pageGridOverride.size ?? docGrid.size}
                                    min={1}
                                    onChange={v => dispatch({
                                        type: 'PATCH_SHAPE',
                                        id: shape.id,
                                        patch: {gridSettings: {...pageGridOverride, size: v}}
                                    })}
                                    unit="px"
                                />
                                <div className={styles.row}>
                                    <label className={styles.label}>Grid Style</label>
                                    <select
                                        value={pageGridOverride.style ?? docGrid.style}
                                        onChange={e => dispatch({
                                            type: 'PATCH_SHAPE',
                                            id: shape.id,
                                            patch: {
                                                gridSettings: {
                                                    ...pageGridOverride,
                                                    style: e.target.value as GridStyle
                                                }
                                            }
                                        })}
                                        style={{fontSize: 12}}
                                    >
                                        <option value="lines">Lines</option>
                                        <option value="dots">Dots</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </CollapsibleSection>
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )
        }

        case 'pixelimage': {
            const pixelAsset = state.document.pixelAssets.find(a => a.id === shape.assetId)
            return (
                <>
                    <PixelImageSection shape={shape} asset={pixelAsset} dispatch={dispatch}/>
                    <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                </>
            )
        }

        default: {
            const regDef = shapeRegistry.get(shape.type)
            if (regDef) {
                // Secondary fills (thumbFill, progressFill) that can't be imported in formsBuiltIn
                // due to circular dep via FillSection → context → reducer → registry → builtIns
                const secondaryFill = 'thumbFill' in shape
                    ? <FillSection key="thumb" title="Thumb Fill"
                                   fill={(shape as {thumbFill: FillStyle}).thumbFill}
                                   onChange={f => dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {thumbFill: f} as Partial<Shape>})}/>
                    : 'progressFill' in shape
                        ? <FillSection key="progress" title="Progress Fill"
                                       fill={(shape as {progressFill: FillStyle}).progressFill}
                                       onChange={f => dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {progressFill: f} as Partial<Shape>})}/>
                        : null
                return (
                    <>
                        {regDef.renderProperties?.({shape, dispatch})}
                        {secondaryFill}
                        {common}
                        <ShapePowerUpsSection shape={shape} activePowerUps={activePowerUps} dispatch={dispatch}/>
                    </>
                )
            }
            return null
        }
    }
}
