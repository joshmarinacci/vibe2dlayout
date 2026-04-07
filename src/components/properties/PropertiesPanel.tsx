import { useAppState, useAppDispatch } from '@store/context'
import { selectSelectedShapes } from '@store/selectors'
import { NumberInput } from './inputs/NumberInput'
import { ToggleInput } from './inputs/ToggleInput'
import { TransformSection } from './sections/TransformSection'
import { FillSection } from './sections/FillSection'
import { StrokeSection } from './sections/StrokeSection'
import { TextSection } from './sections/TextSection'
import { ImageSection } from './sections/ImageSection'
import { ConnectorSection } from './sections/ConnectorSection'
import { PageSection } from './sections/PageSection'
import { ContentSection } from './sections/ContentSection'
import { ButtonIconSection } from './sections/ButtonIconSection'
import type { BoundingBox } from '@model/transform'
import type { FillStyle, StrokeStyle, Shape } from '@model/shapes'
import styles from './PropertiesPanel.module.css'

export function PropertiesPanel() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const selected = selectSelectedShapes(state)

  if (selected.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>No selection</div>
      </div>
    )
  }

  if (selected.length > 1) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>{selected.length} shapes selected</div>
        {/* Multi-select: only move/visibility controls */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Common</div>
          <ToggleInput
            label="Visible"
            value={selected.every(s => s.visible)}
            onChange={v => selected.forEach(s =>
              dispatch({ type: 'PATCH_SHAPE', id: s.id, patch: { visible: v } })
            )}
          />
          <ToggleInput
            label="Locked"
            value={selected.every(s => s.locked)}
            onChange={v => selected.forEach(s =>
              dispatch({ type: 'PATCH_SHAPE', id: s.id, patch: { locked: v } })
            )}
          />
        </div>
      </div>
    )
  }

  const shape = selected[0]

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.shapeType}>{shape.type}</span>
        <span className={styles.shapeName}>{shape.name}</span>
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
          onChange={e => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { name: e.target.value } })}
        />
      </div>

      <div className={styles.visibilityRow}>
        <ToggleInput
          label="Visible"
          value={shape.visible}
          onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { visible: v } })}
        />
        <ToggleInput
          label="Locked"
          value={shape.locked}
          onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { locked: v } })}
        />
      </div>

      <div style={shape.locked ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
        <ShapeProperties shape={shape} dispatch={dispatch} />
      </div>
    </div>
  )
}

function ShapeProperties({ shape, dispatch }: { shape: Shape; dispatch: ReturnType<typeof useAppDispatch> }) {
  const patchTransform = (t: BoundingBox) =>
    dispatch({ type: 'SET_TRANSFORM', id: shape.id, transform: t })
  const patchFill = (f: FillStyle) =>
    dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { fill: f } as Partial<Shape> })
  const patchStroke = (s: StrokeStyle) =>
    dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { stroke: s } as Partial<Shape> })

  switch (shape.type) {
    case 'rect':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <FillSection fill={shape.fill} onChange={patchFill} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Rectangle</div>
            <NumberInput
              label="Radius"
              value={shape.cornerRadius}
              min={0}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { cornerRadius: v } })}
              unit="px"
            />
            <ToggleInput
              label="Clip"
              value={shape.clipChildren}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { clipChildren: v } })}
            />
          </div>
        </>
      )

    case 'circle':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <FillSection fill={shape.fill} onChange={patchFill} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
        </>
      )

    case 'line':
      return (
        <>
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
          <ConnectorSection shape={shape} dispatch={dispatch} />
        </>
      )

    case 'text':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch} />
          <TextSection
            text={shape.text}
            onChange={t => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { text: t } })}
          />
          <FillSection fill={shape.fill} onChange={patchFill} />
        </>
      )

    case 'image':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ImageSection shape={shape} dispatch={dispatch} />
        </>
      )

    case 'page':
      return (
        <>
          <PageSection shape={shape} dispatch={dispatch} />
        </>
      )

    case 'button':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch} />
          <FillSection fill={shape.fill} onChange={patchFill} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
          <TextSection
            text={shape.text}
            onChange={t => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { text: t } })}
          />
          <ButtonIconSection
            icon={shape.icon}
            onChange={ic => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { icon: ic } })}
          />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Button</div>
            <NumberInput
              label="Radius"
              value={shape.cornerRadius}
              min={0}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { cornerRadius: v } })}
              unit="px"
            />
          </div>
        </>
      )

    case 'panel':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          {shape.title && (
            <ContentSection id={shape.id} content={shape.title.content} dispatch={dispatch} />
          )}
          <FillSection fill={shape.fill} onChange={patchFill} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
          {shape.title && (
            <TextSection
              text={shape.title}
              onChange={t => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { title: t } })}
            />
          )}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Panel</div>
            <NumberInput
              label="Radius"
              value={shape.cornerRadius}
              min={0}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { cornerRadius: v } })}
              unit="px"
            />
            <ToggleInput
              label="Clip"
              value={shape.clipChildren}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { clipChildren: v } })}
            />
          </div>
        </>
      )

    case 'slider':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Slider</div>
            <NumberInput
              label="Value"
              value={Math.round(shape.value * 100)}
              min={0} max={100}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { value: v / 100 } })}
              unit="%"
            />
          </div>
          <FillSection fill={shape.trackFill} onChange={f => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { trackFill: f } })} />
          <FillSection fill={shape.thumbFill} onChange={f => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { thumbFill: f } })} />
        </>
      )

    case 'label':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch} />
          <TextSection
            text={shape.text}
            onChange={t => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { text: t } })}
          />
        </>
      )

    case 'textfield':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ContentSection id={shape.id} content={shape.text.content} dispatch={dispatch} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Text Field</div>
            <input
              className={styles.nameInput}
              value={shape.placeholder}
              placeholder="Placeholder text"
              onChange={e => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { placeholder: e.target.value } as Partial<Shape> })}
            />
          </div>
          <FillSection fill={shape.fill} onChange={patchFill} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
        </>
      )

    case 'checkbox':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ContentSection id={shape.id} content={shape.label} dispatch={dispatch} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Checkbox</div>
            <ToggleInput
              label="Checked"
              value={shape.checked}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { checked: v } })}
            />
          </div>
          <FillSection fill={shape.fill} onChange={patchFill} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
        </>
      )

    case 'toggle':
      return (
        <>
          <TransformSection transform={shape.transform} onChange={patchTransform} />
          <ContentSection id={shape.id} content={shape.label} dispatch={dispatch} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Toggle</div>
            <ToggleInput
              label="Checked"
              value={shape.checked}
              onChange={v => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { checked: v } })}
            />
          </div>
          <FillSection fill={shape.trackFill} onChange={f => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { trackFill: f } })} />
          <FillSection fill={shape.thumbFill} onChange={f => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { thumbFill: f } })} />
          <StrokeSection stroke={shape.stroke} onChange={patchStroke} />
        </>
      )
  }
}
