import type { BoundingBox } from '@model/transform'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
  transform: BoundingBox
  onChange: (t: BoundingBox) => void
}

export function TransformSection({ transform, onChange }: Props) {
  const set = (key: keyof BoundingBox) => (v: number) =>
    onChange({ ...transform, [key]: v })

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Transform</div>
      <div className={styles.grid2}>
        <NumberInput label="X" value={Math.round(transform.x)} onChange={set('x')} step={1} unit="px" />
        <NumberInput label="Y" value={Math.round(transform.y)} onChange={set('y')} step={1} unit="px" />
        <NumberInput label="W" value={Math.round(transform.width)} onChange={v => set('width')(Math.max(1, v))} step={1} unit="px" />
        <NumberInput label="H" value={Math.round(transform.height)} onChange={v => set('height')(Math.max(1, v))} step={1} unit="px" />
        <NumberInput label="°" value={transform.rotation} onChange={set('rotation')} step={1} unit="°" />
      </div>
    </div>
  )
}
