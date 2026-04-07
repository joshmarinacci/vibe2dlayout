import styles from './inputs.module.css'

interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

export function NumberInput({ label, value, onChange, min, max, step = 1, unit }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        <input
          type="number"
          className={styles.numberInput}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(v)
          }}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  )
}
