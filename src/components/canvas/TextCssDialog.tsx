import {useRef} from 'react'
import {createPortal} from 'react-dom'

interface Props {
    css: string
    shapeName: string
    onClose: () => void
}

export function TextCssDialog({css, shapeName, onClose}: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleCopy = () => {
        navigator.clipboard.writeText(css).catch(() => {
            // Fallback for environments without clipboard API
            textareaRef.current?.select()
            document.execCommand('copy')
        })
    }

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onPointerDown={e => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                width: 480,
                maxWidth: 'calc(100vw - 32px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
          <span style={{fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)'}}>
            CSS — {shapeName}
          </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-disabled)',
                            fontSize: 18,
                            lineHeight: 1,
                            padding: '0 2px',
                        }}
                        title="Close"
                    >×
                    </button>
                </div>

                {/* CSS textarea */}
                <textarea
                    ref={textareaRef}
                    readOnly
                    value={css}
                    spellCheck={false}
                    style={{
                        margin: 16,
                        padding: 12,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: 'var(--color-text-primary)',
                        background: 'var(--color-bg-panel)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 4,
                        resize: 'none',
                        outline: 'none',
                        height: 200,
                        whiteSpace: 'pre',
                        overflowX: 'auto',
                    }}
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                />

                {/* Actions */}
                <div style={{
                    padding: '0 16px 14px',
                    display: 'flex', justifyContent: 'flex-end', gap: 8,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '5px 14px',
                            fontSize: 12,
                            border: '1px solid var(--color-border)',
                            borderRadius: 4,
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                        }}
                    >Dismiss
                    </button>
                    <button
                        onClick={handleCopy}
                        style={{
                            padding: '5px 14px', fontSize: 12,
                            border: '1px solid var(--color-accent)', borderRadius: 4,
                            background: 'var(--color-accent)', color: '#fff',
                            cursor: 'pointer',
                        }}
                    >Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}
