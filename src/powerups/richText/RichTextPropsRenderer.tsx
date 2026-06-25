import {CollapsibleSection} from '@components/properties/CollapsibleSection'
import {ColorInput} from '@components/properties/inputs/ColorInput'
import {SelectInput} from '@components/properties/inputs/SelectInput'
import {ToggleInput} from '@components/properties/inputs/ToggleInput'
import type {RichTextShape} from '@model/shapes'
import type {Shape} from '@model/shapes'
import {useAppState} from '@store/context'
import type {AppAction} from '@store/types'
import {createPortal} from 'react-dom'
import {useState} from 'react'
import type {Dispatch} from 'react'
import {generateId} from '@utils/idgen'
import {DEFAULT_STYLE_SET, DEFAULT_STYLE_SET_ID} from './defaultStyleSet'
import {StyleSetEditor} from './StyleSetEditor'
import type {RichTextDocumentSettings} from './types'

const POWER_UP_ID = 'powerup.rich-text'

function getRichTextSettings(state: ReturnType<typeof useAppState>['state']): RichTextDocumentSettings {
    const entry = state.document.powerUps?.find(p => p.id === POWER_UP_ID)
    const settings = entry?.settings as RichTextDocumentSettings | undefined
    return settings ?? {styleSets: [DEFAULT_STYLE_SET], defaultStyleSetId: DEFAULT_STYLE_SET_ID}
}

interface Props {
    shape: Shape
    dispatch: Dispatch<AppAction>
}

export function RichTextPropsRenderer({shape, dispatch}: Props) {
    const s = shape as RichTextShape
    const {state} = useAppState()
    const settings = getRichTextSettings(state)
    const [editorOpen, setEditorOpen] = useState(false)

    const styleSetOptions = settings.styleSets.map(ss => ({value: ss.id, label: ss.name}))

    const patchShape = (patch: Partial<RichTextShape>) =>
        dispatch({type: 'PATCH_SHAPE', id: s.id, patch: patch as Partial<Shape>})

    const updateSettings = (patch: Partial<RichTextDocumentSettings>) =>
        dispatch({type: 'UPDATE_DOCUMENT_POWER_UP_SETTINGS', powerUpId: POWER_UP_ID, patch})

    const handleNewStyleSet = () => {
        const copy = JSON.parse(JSON.stringify(
            settings.styleSets.find(ss => ss.id === s.styleSetId) ??
            settings.styleSets[0] ??
            DEFAULT_STYLE_SET
        ))
        copy.id = generateId()
        copy.name = copy.name + ' Copy'
        const newSets = [...settings.styleSets, copy]
        updateSettings({styleSets: newSets})
        patchShape({styleSetId: copy.id})
    }

    return (
        <>
            <CollapsibleSection title="Rich Text">
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0'}}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                        <label style={{fontSize: 12, color: 'var(--color-text-muted, #666)'}}>Content (Markdown)</label>
                        <textarea
                            value={s.content}
                            onChange={e => patchShape({content: e.target.value})}
                            rows={6}
                            style={{
                                width: '100%',
                                resize: 'vertical',
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: 12,
                                lineHeight: 1.5,
                                padding: '6px 8px',
                                boxSizing: 'border-box',
                                border: '1px solid var(--color-border, #ddd)',
                                borderRadius: 4,
                                background: 'var(--color-surface, #fff)',
                                color: 'var(--color-text, #111)',
                            }}
                        />
                    </div>

                    <SelectInput
                        label="Style Set"
                        value={s.styleSetId}
                        options={styleSetOptions.length > 0 ? styleSetOptions : [{value: DEFAULT_STYLE_SET_ID, label: 'Default'}]}
                        onChange={id => patchShape({styleSetId: id})}
                    />

                    <div style={{display: 'flex', gap: 6}}>
                        <button
                            onClick={() => setEditorOpen(true)}
                            style={{flex: 1, fontSize: 12, padding: '4px 8px', cursor: 'pointer'}}
                        >
                            Edit Style Set…
                        </button>
                        <button
                            onClick={handleNewStyleSet}
                            style={{flex: 1, fontSize: 12, padding: '4px 8px', cursor: 'pointer'}}
                        >
                            New Style Set
                        </button>
                    </div>

                    <ToggleInput
                        label="Background Fill"
                        value={s.backgroundColor !== undefined}
                        onChange={on => patchShape({backgroundColor: on ? '#ffffff' : undefined})}
                    />

                    {s.backgroundColor !== undefined && (
                        <ColorInput
                            label="Background"
                            value={{color: s.backgroundColor}}
                            onChange={ref => patchShape({backgroundColor: ref.color})}
                        />
                    )}
                </div>
            </CollapsibleSection>

            {editorOpen && createPortal(
                <StyleSetEditor
                    styleSetId={s.styleSetId}
                    settings={settings}
                    dispatch={dispatch}
                    onClose={() => setEditorOpen(false)}
                />,
                document.body
            )}
        </>
    )
}
