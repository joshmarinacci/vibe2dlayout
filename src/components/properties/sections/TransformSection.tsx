import type { BoundingBox } from '@model/transform'
import styles from '../PropertiesPanel.module.css'

interface Props {
  transform: BoundingBox
  onChange: (t: BoundingBox) => void
}

function TField({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className={styles.tfield}>
      <span className={styles.tlabel}>{label}</span>
      <input
        type="number"
        className={styles.tinput}
        value={value}
        min={min}
        step={1}
        onChange={e => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(min !== undefined ? Math.max(min, v) : v)
        }}
      />
    </div>
  )
}

export function TransformSection({ transform, onChange }: Props) {
  const set = (key: keyof BoundingBox) => (v: number) =>
    onChange({ ...transform, [key]: v })

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Transform</div>
      <div className={styles.transformGrid}>
        <TField label="X" value={Math.round(transform.x)} onChange={set('x')} />
        <TField label="Y" value={Math.round(transform.y)} onChange={set('y')} />
        <TField label="W" value={Math.round(transform.width)} onChange={set('width')} min={1} />
        <TField label="H" value={Math.round(transform.height)} onChange={set('height')} min={1} />
        <TField label="°" value={transform.rotation} onChange={set('rotation')} />
      </div>
    </div>
  )
}
