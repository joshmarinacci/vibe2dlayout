import "./propsheet.css"

interface Props {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

export function CollapsibleSection({title, children, defaultOpen = true}: Props) {
    return (
        <details className={"collapsible-section"} open={defaultOpen}>
            <summary>{title}</summary>
            <article>{children}</article>
        </details>
    )
}
