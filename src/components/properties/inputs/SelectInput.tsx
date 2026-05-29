interface Props {
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void,
    className?: string
}

function clss(names:Record<string,boolean>, extra?:string):string {
    let output:Array<string> = []
    Object.keys(names).forEach(key => {
        if(names[key]) {
            output.push(key)
        }
    })
    if(extra) {
        output.push(extra)
    }
    return output.join(' ')
}

export function SelectInput({label, value, options, onChange, className}: Props) {
    return (
        <section className={clss({'select-input':true},className)}>
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
