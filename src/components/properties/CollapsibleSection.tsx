import {useState} from 'react'
import "./propsheet.css"

interface Props {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

// Module-level map so open/closed state survives selection changes
const sectionState = new Map<string, boolean>()

export function CollapsibleSection({title, children, defaultOpen = true}: Props) {
    return (
        <details className={"collapsible-section"}>
            <summary>{title}</summary>
            <article>{children}</article>
        </details>
    )
}
