import styles from './inputs.module.css'

interface Props {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

export function ToggleInput({ label, value, onChange }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className={styles.checkbox}
      />
    </div>
  )
}
