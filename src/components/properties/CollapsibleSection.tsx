import "./propsheet.css"
import {usePropsheetState} from "@store/context.tsx";


interface Props {
    title: string
    children: React.ReactNode
}

export function CollapsibleSection({title, children}: Props) {
    const ctx = usePropsheetState()
    return (
        <details className={"collapsible-section stretch-full"} open={ctx.isOpen(title)}
                 onToggle={(e) => {
                     ctx.setOpen(title, (e.currentTarget as HTMLDetailsElement).open)
                 }}
        >
            <summary>{title}</summary>
            <article>{children}</article>
        </details>
    )
}
