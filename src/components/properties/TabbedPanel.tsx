import type {GradientDef} from '@model/document'
import React, {useEffect, useRef, useState} from 'react'

function gradientSwatchCSS(g: GradientDef): string {
    const stops = g.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')
    return `linear-gradient(90deg, ${stops})`
}

interface GradientPickerProps {
    gradients: GradientDef[]
    value: string
    onChange: (id: string) => void
    showCustom: boolean
    className?: string
}

export function GradientPicker({gradients, value, onChange, showCustom, className}: GradientPickerProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler, true)
        return () => document.removeEventListener('mousedown', handler, true)
    }, [open])

    const selected = gradients.find(g => g.id === value)

    return (
        <div ref={ref} className={className} style={{position: 'relative', gridColumn: 'inherit'}}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', height: 24,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4, padding: '0 6px',
                    cursor: 'pointer', fontSize: 12,
                    color: 'var(--color-text-primary)',
                }}
            >
                {selected ? (
                    <>
                        <span style={{
                            display: 'inline-block', width: 36, height: 12, borderRadius: 2,
                            background: gradientSwatchCSS(selected),
                            border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0,
                        }}/>
                        <span style={{flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{selected.name}</span>
                    </>
                ) : (
                    <span style={{flex: 1, textAlign: 'left', color: 'var(--color-text-muted)'}}>Custom…</span>
                )}
                <span style={{color: 'var(--color-text-muted)', fontSize: 9}}>▾</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginTop: 2, overflow: 'hidden',
                }}>
                    {gradients.map(g => (
                        <div
                            key={g.id}
                            onMouseDown={() => { onChange(g.id); setOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '5px 8px', cursor: 'pointer', fontSize: 12,
                                color: 'var(--color-text-primary)',
                                background: g.id === value ? 'var(--color-accent-bg)' : undefined,
                            }}
                            onMouseEnter={e => { if (g.id !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-panel)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = g.id === value ? 'var(--color-accent-bg)' : '' }}
                        >
                            <span style={{
                                display: 'inline-block', width: 40, height: 14, borderRadius: 2, flexShrink: 0,
                                background: gradientSwatchCSS(g),
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}/>
                            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{g.name}</span>
                        </div>
                    ))}
                    {showCustom && (
                        <div
                            onMouseDown={() => { onChange(''); setOpen(false) }}
                            style={{
                                padding: '5px 8px', cursor: 'pointer', fontSize: 12,
                                color: 'var(--color-text-muted)',
                                borderTop: gradients.length > 0 ? '1px solid var(--color-border-subtle)' : undefined,
                            }}
                        >Custom…</div>
                    )}
                </div>
            )}
        </div>
    )
}

export function TabbedPanelTab<T>(props: {
    title: string,
    tab: T,
    selectedTab: T,
    setSelectedTab: (value: (((prevState: T) => T) | T)) => void,
    onChange?: () => void
}) {
    return <div
        className={'tabbed-panel-tab ' + ((props.tab === props.selectedTab) ? 'selected' : 'hidden')}
        onClick={() => {
            props.setSelectedTab(props.tab)
            if (props.onChange) {
                props.onChange()
            }
        }}
    >
        {props.title}
    </div>
}

export function TabbedPanelContent<T>(props: {
    children: React.ReactNode,
    tab: T,
    selectedTab: T,
    setSelectedTab: (value: (((prevState: T) => T) | T)) => void
}) {
    return <div
        className={'tabbed-panel-content ' + ((props.tab === props.selectedTab) ? 'selected' : 'hidden')}>
        {props.children}
    </div>
}

export function TabbedPanel(props: { children: React.ReactNode }) {
    return <div className={'tabbed-panel-panel'}>
        {props.children}
    </div>
}

export function TabbedPanelTabs(props: { children: React.ReactNode }) {
    return <div className={'tabbed-panel-tabs'}>{props.children}</div>
}
