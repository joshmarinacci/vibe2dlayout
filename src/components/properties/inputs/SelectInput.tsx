interface Props {
    label: string
    value: string
    options: { value: string; label: string }[]
    onChange: (v: string) => void
}

export function SelectInput({label, value, options, onChange}: Props) {
    return (
        <section className={'select-input'}>
            <label>{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </section>
    )
}
