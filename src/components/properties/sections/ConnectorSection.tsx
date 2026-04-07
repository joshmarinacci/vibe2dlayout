import type { LineShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import type { Dispatch } from 'react'
import { SelectInput } from '../inputs/SelectInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
  shape: LineShape
  dispatch: Dispatch<AppAction>
}

const ARROW_OPTIONS = [
  { value: 'none',    label: 'None' },
  { value: 'arrow',   label: 'Arrow' },
  { value: 'circle',  label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
]

const ROUTE_OPTIONS = [
  { value: 'straight',    label: 'Straight' },
  { value: 'orthogonal',  label: 'Orthogonal' },
  { value: 'curved',      label: 'Curved' },
]

export function ConnectorSection({ shape, dispatch }: Props) {
  const patch = (p: Partial<LineShape>) =>
    dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: p })

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Connector</div>
      <SelectInput
        label="Routing"
        value={shape.route.mode}
        options={ROUTE_OPTIONS}
        onChange={v => patch({ route: { ...shape.route, mode: v as LineShape['route']['mode'] } })}
      />
      <SelectInput
        label="Start"
        value={shape.startArrow}
        options={ARROW_OPTIONS}
        onChange={v => patch({ startArrow: v as LineShape['startArrow'] })}
      />
      <SelectInput
        label="End"
        value={shape.endArrow}
        options={ARROW_OPTIONS}
        onChange={v => patch({ endArrow: v as LineShape['endArrow'] })}
      />
      <div className={styles.connectorInfo}>
        <div className={styles.connectorEndpoint}>
          <span className={styles.endpointLabel}>Start:</span>
          <span className={styles.endpointValue}>
            {shape.start.kind === 'attached'
              ? `Attached (${shape.start.anchor})`
              : `Free (${Math.round(shape.start.point.x)}, ${Math.round(shape.start.point.y)})`}
          </span>
        </div>
        <div className={styles.connectorEndpoint}>
          <span className={styles.endpointLabel}>End:</span>
          <span className={styles.endpointValue}>
            {shape.end.kind === 'attached'
              ? `Attached (${shape.end.anchor})`
              : `Free (${Math.round(shape.end.point.x)}, ${Math.round(shape.end.point.y)})`}
          </span>
        </div>
      </div>
    </div>
  )
}
