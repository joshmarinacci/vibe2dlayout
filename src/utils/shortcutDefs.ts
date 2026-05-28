export interface ShortcutDef {
    keys: string
    description: string
}

export const KEYBOARD_SHORTCUTS: ShortcutDef[] = [
    {keys: '⌘Z', description: 'Undo'},
    {keys: '⌘⇧Z', description: 'Redo'},
    {keys: '⌘S', description: 'Save'},
    {keys: 'Del / Backspace', description: 'Delete selected'},
    {keys: '⌘A', description: 'Select all'},
    {keys: '⌘D', description: 'Duplicate selected'},
    {keys: '⌘G', description: 'Group selected'},
    {keys: '⌘⇧G', description: 'Ungroup'},
    {keys: '⌘]', description: 'Bring forward'},
    {keys: '⌘[', description: 'Send backward'},
    {keys: '⌘Enter', description: 'Commit text edit'},
    {keys: 'Escape', description: 'Cancel / deselect'},
    {keys: '↑ ↓ ← →', description: 'Nudge 1px'},
    {keys: '⇧ + Arrow', description: 'Nudge 10px'},
    {keys: '⌘0', description: 'Reset view'},
    {keys: 'V', description: 'Select tool'},
    {keys: 'H', description: 'Pan tool'},
    {keys: 'F2', description: 'Rename selected layer'},
    {keys: '?', description: 'Show/hide this help'},
]

export const MOUSE_SHORTCUTS: ShortcutDef[] = [
    {keys: 'Click', description: 'Select shape'},
    {keys: '⇧ Click', description: 'Add to / remove from selection'},
    {keys: 'Drag shape', description: 'Move shape'},
    {keys: '⌘ Drag shape', description: 'Duplicate and move'},
    {keys: 'Drag canvas', description: 'Marquee select'},
    {keys: 'Space + Drag', description: 'Pan canvas'},
    {keys: 'Double-click', description: 'Edit text'},
    {keys: 'Right-click', description: 'Context menu'},
    {keys: 'Ctrl + Scroll', description: 'Zoom in / out'},
    {keys: 'Scroll', description: 'Pan canvas'},
    {keys: 'Pinch', description: 'Zoom in / out'},
]
