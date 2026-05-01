import type {GridStyle} from '@model/grid'
import type {CornerRadii, FillStyle, Shape, StrokeStyle, TextStyle} from '@model/shapes'
import {
    type FilledShape,
    hasFill,
    hasStroke,
    hasText,
    hasTransform,
    type ImageShape,
    type ShapeWithText,
    type StrokedShape,
    type TransformedShape
} from '@model/shapes'
import {resolveTextStyle} from '@model/textStyle'
import {getActiveTheme} from '@model/theme'
import type {BoundingBox} from '@model/transform'
import type {Variable, VariableType} from '@model/variable'
import {useAppDispatch, useAppState} from '@store/context'
import {selectSelectedShapes} from '@store/selectors'
import {RotateCcw} from 'lucide-react'
import {CollapsibleSection} from './CollapsibleSection'
import {ColorInput} from './inputs/ColorInput'
import {NumberInput} from './inputs/NumberInput'
import {ToggleInput} from './inputs/ToggleInput'
import styles from './PropertiesPanel.module.css'
import {ButtonIconSection} from './sections/ButtonIconSection'
import {ConnectorSection} from './sections/ConnectorSection'
import {ContentSection} from './sections/ContentSection'
import {DocumentSection} from './sections/DocumentSection'
import {FillSection} from './sections/FillSection'
import {FontInfoSection} from './sections/FontInfoSection'
import {IconSection} from './sections/IconSection'
import {ImageAssetSection} from './sections/ImageAssetSection'
import {ImageSection} from './sections/ImageSection'
import {PageSection} from './sections/PageSection'
import {PixelImageSection} from './sections/PixelImageSection'
import {ShadowSection} from './sections/ShadowSection'
import {StrokeSection} from './sections/StrokeSection'
import {TextSection} from './sections/TextSection'
import {TextStyleDefSection} from './sections/TextStyleDefSection'
import {TransformSection} from './sections/TransformSection'
import {VariableSection} from './sections/VariableSection'

function commonValue<T>(vals: T[]): T | null {
    if (vals.length === 0) return null
    const first = vals[0]
    return vals.every(v => JSON.stringify(v) === JSON.stringify(first)) ? first : null
}

// Helper to build variable binding props for a given shape property path and variable type.
// All call sites just spread the result into the input component props.
function makeVarProps(
    shape: Shape,
    propPath: string,
    type: VariableType,
    variables: Variable[],
    dispatch: ReturnType<typeof useAppDispatch>,
) {
    return {
        variableId: (shape as unknown as {
            variableBindings?: Record<string, string>
        }).variableBindings?.[propPath] ?? null,
        variables: variables.filter(v => v.type === type),
        onVariableChange: (id: string | null) =>
            dispatch({type: 'BIND_VARIABLE', shapeId: shape.id, propPath, variableId: id}),
    }
}

export function PropertiesPanel() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const selected = selectSelectedShapes(state)

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

    if (state.selectedVariableId !== null) {
        const variable = state.document.variables.find(v => v.id === state.selectedVariableId)
        if (variable) {
            return (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <span className={styles.shapeType}>variable</span>
                        <span className={styles.shapeName}>{variable.name}</span>
                    </div>
                    <VariableSection variable={variable} dispatch={dispatch}/>
                </div>
            )
        }
    }

    if (state.selectedStyleId !== null) {
        const style = state.document.textStyles.find(s => s.id === state.selectedStyleId)
        if (style) {
            return (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <span className={styles.shapeType}>style</span>
                        <span className={styles.shapeName}>{style.name}</span>
                    </div>
                    <TextStyleDefSection style={style} dispatch={dispatch}
                                         customFonts={state.document.customFonts.map(f => f.name)}/>
                </div>
            )
        }
    }

    if (state.documentSelected) {
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
        const commonFillColor = commonValue(withFill.map(s => s.fill.color))
        const commonFillOpacity = commonValue(withFill.map(s => s.fill.opacity))

        // Shapes with stroke (show section if any have it; apply only to those that do)
        const withStroke = selected.filter(s => 'stroke' in s) as Extract<Shape, {
            stroke: StrokeStyle
        }>[]
        const commonStrokeColor = commonValue(withStroke.map(s => s.stroke.color))
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
                        <div className={styles.transformGrid}>
                            {(['x', 'y', 'width', 'height'] as (keyof BoundingBox)[]).map((key, i) => {
                                const label = ['X', 'Y', 'W', 'H'][i]
                                const val = [cx, cy, cw, ch][i]
                                return (
                                    <div key={key} className={styles.tfield}>
                                        <span className={styles.tlabel}>{label}</span>
                                        <input
                                            type="number"
                                            className={styles.tinput}
                                            value={val !== null ? Math.round(val) : ''}
                                            placeholder="—"
                                            step={1}
                                            min={key === 'width' || key === 'height' ? 1 : undefined}
                                            onChange={e => {
                                                const v = parseFloat(e.target.value)
                                                if (!isNaN(v)) applyTransformField(key, v)
                                            }}
                                        />
                                    </div>
                                )
                            })}
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
                        text={resolveTextStyle(repText, state.document.textStyles)}
                        rawText={repText}
                        textStyles={state.document.textStyles}
                        shapeId={withText[0].id}
                        onChange={onChangeText}
                        dispatch={dispatch}
                        customFonts={state.document.customFonts.map(f => f.name)}
                        activeFont={repText.fontFamily ? (state.document.customFonts.find(f => f.name === repText.fontFamily) ?? null) : null}
                    />
                )}
            </div>
        )
    }

    const shape = selected[0]
    const resetToTheme = () => dispatch({type: 'RESET_SHAPES_TO_THEME', ids: [shape.id]})
    const variables = state.document.variables

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
                <ShapeProperties shape={shape} dispatch={dispatch} state={state}
                                 variables={variables}/>
            </div>
        </div>
    )
}

function ShapeProperties({shape, dispatch, state, variables}: {
    shape: Shape
    dispatch: ReturnType<typeof useAppDispatch>
    state: ReturnType<typeof useAppState>['state']
    variables: Variable[]
}) {
    const patchTransform = (t: BoundingBox) =>
        dispatch({type: 'SET_TRANSFORM', id: shape.id, transform: t})
    const patchFill = (f: FillStyle) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {fill: f} as Partial<Shape>})
    const patchStroke = (s: StrokeStyle) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {stroke: s} as Partial<Shape>})

    const textStyles = state.document.textStyles
    const customFontNames = state.document.customFonts.map(f => f.name)
    // Use the resolved font family (accounts for inherited text styles) for activeFont lookup
    const shapeRawText = (shape as unknown as {
        text?: { fontFamily?: string; textStyleId?: string; textStyleOverrides?: string[] }
    }).text
    const resolvedFontFamily = shapeRawText
        ? resolveTextStyle(shapeRawText as Parameters<typeof resolveTextStyle>[0], textStyles).fontFamily
        : undefined
    const activeFont = resolvedFontFamily
        ? (state.document.customFonts.find(f => f.name === resolvedFontFamily) ?? null)
        : null

    // Shorthand for building variable binding props for this shape's property path
    const vp = (path: string, type: VariableType) => makeVarProps(shape, path, type, variables, dispatch)

    const common = []

    if (hasText(shape)) {
        const texted: ShapeWithText = shape as ShapeWithText
        common.push(<TextSection
            text={resolveTextStyle(texted.text, textStyles)}
            rawText={texted.text}
            textStyles={textStyles}
            shapeId={shape.id}
            onChange={t => dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {text: t}})}
            dispatch={dispatch}
            customFonts={customFontNames}
            activeFont={activeFont}
        />)
    }
    if (hasFill(shape)) {
        const filled: FilledShape = shape as FilledShape
        common.push(<FillSection fill={filled.fill} onChange={patchFill}
                                 colorVar={vp('fill.color', 'color')}
                                 opacityVar={vp('fill.opacity', 'number')}/>)
    }
    if (hasStroke(shape)) {
        const stroked: StrokedShape = shape as StrokedShape
        common.push(<StrokeSection stroke={stroked.stroke} onChange={patchStroke}
                                   colorVar={vp('stroke.color', 'color')}
                                   widthVar={vp('stroke.width', 'number')}
                                   opacityVar={vp('stroke.opacity', 'number')}/>)
    }
    if (hasTransform(shape)) {
        const transformed: TransformedShape = shape as TransformedShape
        common.push(<TransformSection transform={transformed.transform} onChange={patchTransform}
                                      xVar={vp('transform.x', 'number')}
                                      yVar={vp('transform.y', 'number')}
                                      wVar={vp('transform.width', 'number')}
                                      hVar={vp('transform.height', 'number')}/>)
    }
    common.push(<ShadowSection shape={shape} dispatch={dispatch}/>)
    switch (shape.type) {
        case 'rect':
            return (
                <>
                    <CollapsibleSection title="Rectangle">
                        <CornerRadiusControl
                            cornerRadius={shape.cornerRadius}
                            cornerRadii={shape.cornerRadii}
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
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'circle':
            return (<>{common}</>)

        case 'line':
            return (
                <>
                    <StrokeSection stroke={shape.stroke} onChange={patchStroke}
                                   colorVar={vp('stroke.color', 'color')}
                                   widthVar={vp('stroke.width', 'number')}
                                   opacityVar={vp('stroke.opacity', 'number')}/>
                    <ConnectorSection shape={shape} dispatch={dispatch}/>
                </>
            )

        case 'text':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                </>
            )

        case 'image':
            return (
                <>
                    <ImageSection shape={shape} dispatch={dispatch}/>
                    {common}
                </>
            )

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
                </>
            )
        }

        case 'button':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                    <ButtonIconSection
                        icon={shape.icon}
                        onChange={ic => dispatch({
                            type: 'PATCH_SHAPE',
                            id: shape.id,
                            patch: {icon: ic}
                        })}
                    />
                    <CollapsibleSection title="Button">
                        <CornerRadiusControl
                            cornerRadius={shape.cornerRadius}
                            cornerRadii={shape.cornerRadii}
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
                    </CollapsibleSection>
                </>
            )

        case 'icon':
            return (
                <>
                    <IconSection
                        icon={shape.icon}
                        onChange={ic => dispatch({
                            type: 'PATCH_SHAPE',
                            id: shape.id,
                            patch: {icon: ic}
                        })}
                    />
                    {common}
                </>
            )

        case 'panel':
            return (
                <>
                    {shape.text && (
                        <ContentSection id={shape.id} content={shape.text.content}
                                        dispatch={dispatch}/>
                    )}
                    {common}
                    <CollapsibleSection title="Panel">
                        <CornerRadiusControl
                            cornerRadius={shape.cornerRadius}
                            cornerRadii={shape.cornerRadii}
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
                        <ToggleInput
                            label="Clip"
                            value={shape.clipChildren}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {clipChildren: v}
                            })}
                        />
                    </CollapsibleSection>
                </>
            )

        case 'tabbed-panel':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Tabs">
                        <NumberInput
                            label="Active Tab"
                            value={shape.activeTab + 1}
                            min={1}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {activeTab: Math.max(0, Math.round(v) - 1)}
                            })}
                        />
                    </CollapsibleSection>
                    {common}
                    <CollapsibleSection title="Panel">
                        <CornerRadiusControl
                            cornerRadius={shape.cornerRadius}
                            cornerRadii={shape.cornerRadii}
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
                        <ToggleInput
                            label="Clip"
                            value={shape.clipChildren}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {clipChildren: v}
                            })}
                        />
                    </CollapsibleSection>
                </>
            )

        case 'slider':
            return (
                <>
                    <CollapsibleSection title="Slider">
                        <NumberInput
                            label="Value"
                            value={Math.round(shape.value * 100)}
                            min={0} max={100}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {value: v / 100}
                            })}
                            unit="%"
                            {...vp('value', 'number')}
                        />
                        <NumberInput
                            label="Ticks"
                            value={shape.ticks ?? 0}
                            min={0} max={20}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {ticks: Math.round(v)}
                            })}
                        />
                    </CollapsibleSection>
                    <FillSection fill={shape.trackFill} onChange={f => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {trackFill: f}
                    })}
                                 colorVar={vp('trackFill.color', 'color')}/>
                    <FillSection fill={shape.thumbFill} onChange={f => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {thumbFill: f}
                    })}
                                 colorVar={vp('thumbFill.color', 'color')}/>
                </>
            )

        case 'label':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                </>
            )

        case 'textfield':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Text Field">
                        <input
                            className={styles.nameInput}
                            value={shape.placeholder}
                            placeholder="Placeholder text"
                            onChange={e => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {placeholder: e.target.value} as Partial<Shape>
                            })}
                        />
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'checkbox':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Checkbox">
                        <ToggleInput
                            label="Checked"
                            value={shape.checked}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {checked: v}
                            })}
                            {...vp('checked', 'boolean')}
                        />
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'toggle':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Toggle">
                        <ToggleInput
                            label="Checked"
                            value={shape.checked}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {checked: v}
                            })}
                            {...vp('checked', 'boolean')}
                        />
                    </CollapsibleSection>
                    <FillSection fill={shape.trackFill} onChange={f => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {trackFill: f}
                    })}
                                 colorVar={vp('trackFill.color', 'color')}/>
                    <FillSection fill={shape.thumbFill} onChange={f => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {thumbFill: f}
                    })}
                                 colorVar={vp('thumbFill.color', 'color')}/>
                    <StrokeSection stroke={shape.stroke} onChange={patchStroke}
                                   colorVar={vp('stroke.color', 'color')}
                                   widthVar={vp('stroke.width', 'number')}
                                   opacityVar={vp('stroke.opacity', 'number')}/>
                </>
            )

        case 'frame':
            return (
                <>
                    {common}
                    <CollapsibleSection title="Panel">
                        <CornerRadiusControl
                            cornerRadius={shape.cornerRadius}
                            cornerRadii={shape.cornerRadii}
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
                        <ToggleInput
                            label="Clip"
                            value={shape.clipChildren}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {clipChildren: v}
                            })}
                        />
                    </CollapsibleSection>
                </>
            )

        case 'dialog':
            return (
                <>
                    {common}
                    <CollapsibleSection title="Dialog">
                        <input
                            className={styles.nameInput}
                            value={shape.title}
                            placeholder="Title"
                            onChange={e => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {title: e.target.value} as Partial<Shape>
                            })}
                        />
                        <input
                            className={styles.nameInput}
                            value={shape.okLabel}
                            placeholder="OK label"
                            onChange={e => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {okLabel: e.target.value} as Partial<Shape>
                            })}
                        />
                        <input
                            className={styles.nameInput}
                            value={shape.cancelLabel}
                            placeholder="Cancel label"
                            onChange={e => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {cancelLabel: e.target.value} as Partial<Shape>
                            })}
                        />
                    </CollapsibleSection>
                </>
            )

        case 'radio':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                    <CollapsibleSection title="Radio Button">
                        <ToggleInput
                            label="Checked"
                            value={shape.checked}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {checked: v}
                            })}
                            {...vp('checked', 'boolean')}
                        />
                    </CollapsibleSection>
                </>
            )

        case 'select':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Select">
                        <input
                            className={styles.nameInput}
                            value={shape.placeholder}
                            placeholder="Placeholder"
                            onChange={e => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {placeholder: e.target.value} as Partial<Shape>
                            })}
                        />
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'progress':
            return (
                <>
                    <CollapsibleSection title="Progress Bar">
                        <NumberInput
                            label="Value"
                            value={shape.value}
                            min={0} max={100}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {value: v}
                            })}
                            unit="%"
                            {...vp('value', 'number')}
                        />
                        <NumberInput
                            label="Ticks"
                            value={shape.ticks ?? 0}
                            min={0} max={20}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {ticks: Math.round(v)}
                            })}
                        />
                    </CollapsibleSection>
                    <FillSection fill={shape.trackFill} onChange={f => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shape.id,
                        patch: {trackFill: f}
                    })}
                                 colorVar={vp('trackFill.color', 'color')}/>
                    {common}
                </>
            )

        case 'stepper':
            return (
                <>
                    <CollapsibleSection title="Number Stepper">
                        <NumberInput
                            label="Value"
                            value={shape.value}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {value: v}
                            })}
                            {...vp('value', 'number')}
                        />
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'table':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                </>
            )

        case 'stickynote':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    {common}
                </>
            )

        case 'list':
            return (
                <>
                    <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="List">
                        <NumberInput
                            label="Selected row"
                            value={shape.selectedIndex}
                            min={-1}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {selectedIndex: Math.round(v)}
                            })}
                        />
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'scrollpanel':
            return (
                <>
                    <CollapsibleSection title="Scroll Panel">
                        <CornerRadiusControl
                            cornerRadius={shape.cornerRadius}
                            cornerRadii={shape.cornerRadii}
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
                        <NumberInput
                            label="Scroll"
                            value={shape.scrollPosition}
                            min={0} max={1}
                            step={0.05}
                            onChange={v => dispatch({
                                type: 'PATCH_SHAPE',
                                id: shape.id,
                                patch: {scrollPosition: Math.max(0, Math.min(1, v))}
                            })}
                            {...vp('scrollPosition', 'number')}
                        />
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'imagemock':
            return (
                <>
                    {common}
                </>
            )

        case 'chartmock':
            return (
                <>
                    <CollapsibleSection title="Chart Mock">
                        <div className={styles.row}>
                            <label className={styles.label}>Type</label>
                            <select
                                value={shape.chartType}
                                onChange={e => dispatch({
                                    type: 'PATCH_SHAPE',
                                    id: shape.id,
                                    patch: {chartType: e.target.value as 'bar' | 'line'} as Partial<Shape>
                                })}
                                style={{fontSize: 12}}
                            >
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                            </select>
                        </div>
                    </CollapsibleSection>
                    {common}
                </>
            )

        case 'pixelimage': {
            const pixelAsset = state.document.pixelAssets.find(a => a.id === shape.assetId)
            return (
                <>
                    <PixelImageSection shape={shape} asset={pixelAsset} dispatch={dispatch}/>
                </>
            )
        }
    }
}

// ─── Per-corner radius control ─────────────────────────────────────────────

interface CornerRadiusControlProps {
    cornerRadius: number
    cornerRadii?: CornerRadii
    onChangeUniform: (v: number) => void
    onChangeRadii: (r: CornerRadii | undefined) => void
}

function CornerRadiusControl({
                                 cornerRadius,
                                 cornerRadii,
                                 onChangeUniform,
                                 onChangeRadii
                             }: CornerRadiusControlProps) {
    const perCorner = !!cornerRadii

    const togglePerCorner = () => {
        if (perCorner) {
            onChangeRadii(undefined)
        } else {
            onChangeRadii({
                topLeft: cornerRadius,
                topRight: cornerRadius,
                bottomRight: cornerRadius,
                bottomLeft: cornerRadius
            })
        }
    }

    return (
        <>
            <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                <div style={{flex: 1}}>
                    <NumberInput
                        label="Radius"
                        value={perCorner ? Math.round((cornerRadii!.topLeft + cornerRadii!.topRight + cornerRadii!.bottomRight + cornerRadii!.bottomLeft) / 4) : cornerRadius}
                        min={0}
                        onChange={v => {
                            if (perCorner) {
                                onChangeRadii({
                                    topLeft: v,
                                    topRight: v,
                                    bottomRight: v,
                                    bottomLeft: v
                                })
                            } else {
                                onChangeUniform(v)
                            }
                        }}
                        unit="px"
                    />
                </div>
                <button
                    onClick={togglePerCorner}
                    title={perCorner ? 'Use uniform radius' : 'Set per-corner radius'}
                    style={{
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        border: '1px solid var(--color-border)',
                        borderRadius: 3,
                        background: perCorner ? 'var(--color-accent)' : 'transparent',
                        color: perCorner ? '#fff' : 'var(--color-text-muted)',
                        fontSize: 9,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    ⌗
                </button>
            </div>
            {perCorner && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                    paddingLeft: 4
                }}>
                    <NumberInput label="TL" value={cornerRadii!.topLeft} min={0}
                                 onChange={v => onChangeRadii({...cornerRadii!, topLeft: v})}
                                 unit="px"/>
                    <NumberInput label="TR" value={cornerRadii!.topRight} min={0}
                                 onChange={v => onChangeRadii({...cornerRadii!, topRight: v})}
                                 unit="px"/>
                    <NumberInput label="BR" value={cornerRadii!.bottomRight} min={0}
                                 onChange={v => onChangeRadii({...cornerRadii!, bottomRight: v})}
                                 unit="px"/>
                    <NumberInput label="BL" value={cornerRadii!.bottomLeft} min={0}
                                 onChange={v => onChangeRadii({...cornerRadii!, bottomLeft: v})}
                                 unit="px"/>
                </div>
            )}
        </>
    )
}
