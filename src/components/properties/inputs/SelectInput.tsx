import styles from './inputs.module.css'

interface Props {
    label: string
    value: string
    options: { value: string; label: string }[]
    onChange: (v: string) => void
}

export function SelectInput({label, value, options, onChange}: Props) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            <select
                className={styles.select}
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}
