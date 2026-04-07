import styles from './inputs.module.css'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
}

export function ColorInput({ label, value, onChange }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        <input
          type="color"
          className={styles.colorSwatch}
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="text"
          className={styles.textInput}
          value={value}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
