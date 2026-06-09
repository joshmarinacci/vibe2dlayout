import {CollapsibleSection} from '@components/properties/CollapsibleSection'
import {NumberInput} from '@components/properties/inputs/NumberInput'
import {ToggleInput} from '@components/properties/inputs/ToggleInput'
import {ButtonIconSection} from '@components/properties/sections/ButtonIconSection'
import {ContentSection} from '@components/properties/sections/ContentSection'
import {IconSection} from '@components/properties/sections/IconSection'
import {ButtonShapeComp} from '@components/canvas/shapes/ButtonShape'
import {CheckboxShapeComp} from '@components/canvas/shapes/CheckboxShape'
import {DialogShapeComp} from '@components/canvas/shapes/DialogShape'
import {FrameShapeComp} from '@components/canvas/shapes/FrameShape'
import {IconShapeComp} from '@components/canvas/shapes/IconShape'
import {LabelShapeComp} from '@components/canvas/shapes/LabelShape'
import {ListShapeComp} from '@components/canvas/shapes/ListShape'
import {PanelShapeComp} from '@components/canvas/shapes/PanelShape'
import {ProgressShapeComp} from '@components/canvas/shapes/ProgressShape'
import {RadioShapeComp} from '@components/canvas/shapes/RadioShape'
import {ScrollPanelShapeComp} from '@components/canvas/shapes/ScrollPanelShape'
import {SelectShapeComp} from '@components/canvas/shapes/SelectShape'
import {SliderShapeComp} from '@components/canvas/shapes/SliderShape'
import {StepperShapeComp} from '@components/canvas/shapes/StepperShape'
import {StickyNoteShapeComp} from '@components/canvas/shapes/StickyNoteShape'
import {TabbedPanelShapeComp} from '@components/canvas/shapes/TabbedPanelShape'
import {ChartMockShapeComp} from '@components/canvas/shapes/ChartMockShape'
import {ImageMockShapeComp} from '@components/canvas/shapes/ImageMockShape'
import {TableShapeComp} from '@components/canvas/shapes/TableShape'
import {TextFieldShapeComp} from '@components/canvas/shapes/TextFieldShape'
import {ToggleShapeComp} from '@components/canvas/shapes/ToggleShape'
import type {
    ButtonShape,
    ChartMockShape,
    CheckboxShape,
    DialogShape,
    FrameShape,
    IconShape,
    ImageMockShape,
    LabelShape,
    ListShape,
    PanelShape,
    ProgressShape,
    RadioShape,
    ScrollPanelShape,
    SelectShape,
    Shape,
    SliderShape,
    StepperShape,
    StickyNoteShape,
    TabbedPanelShape,
    TableShape,
    TextFieldShape,
    ToggleShape,
} from '@model/shapes'
import {defaultStroke, defaultText, defaultTransform} from '@model/shapes'
import type {Theme} from '@model/theme'
import {generateId} from '@utils/idgen'
import {
    AppWindow,
    BarChart2,
    CheckSquare,
    CircleDot,
    GanttChart,
    Hash,
    Image,
    LayoutPanelLeft,
    List,
    ListOrdered,
    NotebookTabs,
    PanelLeft,
    RectangleHorizontal,
    ScrollText,
    SlidersHorizontal,
    Star,
    StickyNote,
    Table2,
    Tag,
    TextCursorInput,
    ToggleLeft,
} from 'lucide-react'
import type {PowerUpDefinition, PowerUpShapeTypeDefinition} from './types'
const FORMS_POWER_UP_ID = 'powerup.forms'

function base(type: string) {
    return {id: generateId(), name: type, locked: false, visible: true, powerUps: []}
}

function themeDefaults(theme?: Theme) {
    return {
        fg: theme?.foreground ?? '#333333',
        bg: theme?.background ?? '#ffffff',
        bdr: theme?.border ?? '#333333',
        bdrW: theme?.borderWidth ?? 1.5,
        bdrR: theme?.borderRadius ?? 4,
        font: theme?.fontFamily ?? 'Caveat, cursive',
        size: theme?.fontSize ?? 16,
    }
}

function formStroke() {
    return {...defaultStroke(), type: 'sketch' as const, color: '#000000', width: 1}
}


function themeFill(theme?: Theme) {
    const {bg} = themeDefaults(theme)
    return {type: 'color' as const, color: bg, opacity: 1}
}

function themeText(content: string, theme?: Theme) {
    const {font, size, fg} = themeDefaults(theme)
    return {...defaultText(content), fontFamily: font, fontSize: size, color: fg}
}

const FORM_SHAPE_TYPES: PowerUpShapeTypeDefinition[] = [
    {
        type: 'button',
        name: 'Button',
        toolMode: 'insert-button',
        icon: <RectangleHorizontal size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg, bg, bdrR} = themeDefaults(theme)
            return {
                ...base('button'), type: 'button',
                transform: defaultTransform(x, y, 100, 36),
                fill: {type: 'color', color: theme ? bg : '#3b82f6', opacity: 1},
                stroke: formStroke(),
                cornerRadius: bdrR,
                text: {...themeText('Button', theme), color: theme ? fg : '#ffffff'},
                icon: null,
            } as ButtonShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <ButtonShapeComp shape={shape as ButtonShape} isSelected={isSelected}
                             isEditing={isEditingText} dispatch={dispatch}
                             handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as ButtonShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <ButtonIconSection icon={s.icon} onChange={ic => dispatch({
                        type: 'PATCH_SHAPE', id: s.id, patch: {icon: ic} as Partial<Shape>
                    })}/>
                </>
            )
        },
    },
    {
        type: 'icon',
        name: 'Icon',
        toolMode: 'insert-icon',
        icon: <Star size={14}/>,
        category: 'forms',
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('icon'), type: 'icon',
                transform: defaultTransform(x, y, 40, 40),
                icon: {name: 'Star'},
                fill: {type: 'color', color: theme ? fg : '#333333', opacity: 1},
                stroke: {type: 'solid' as const, color: theme ? fg : '#333333', width: 0, dash: [], opacity: 1},
            } as IconShape
        },
        renderShape: ({shape, isSelected, onClick, onDoubleClick}) =>
            <IconShapeComp shape={shape as IconShape} isSelected={isSelected}
                           onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as IconShape
            return (
                <IconSection icon={s.icon} onChange={ic => dispatch({
                    type: 'PATCH_SHAPE', id: s.id, patch: {icon: ic} as Partial<Shape>
                })}/>
            )
        },
    },
    {
        type: 'panel',
        name: 'Titled Panel',
        toolMode: 'insert-panel',
        icon: <PanelLeft size={14}/>,
        category: 'containers',
        isTextEditable: true,
        isDrillable: true,
        createDefault: (x, y, theme) => {
            const {bdrR} = themeDefaults(theme)
            return {
                ...base('panel'), type: 'panel',
                transform: defaultTransform(x, y, 200, 150),
                fill: themeFill(theme),
                stroke: formStroke(),
                cornerRadius: bdrR,
                text: {...themeText('Panel', theme), align: 'left', fontWeight: 'bold'},
                clipChildren: false,
            } as PanelShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick, children}) =>
            <PanelShapeComp shape={shape as PanelShape} isSelected={isSelected}
                            isEditing={isEditingText} dispatch={dispatch}
                            handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}>
                {children}
            </PanelShapeComp>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as PanelShape
            return (
                <>
                    {s.text && <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>}
                    <CollapsibleSection title="Panel">
                        <ToggleInput label="Clip" value={s.clipChildren}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id, patch: {clipChildren: v} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'tabbed-panel',
        name: 'Tabbed Panel',
        toolMode: 'insert-tabbed-panel',
        icon: <NotebookTabs size={14}/>,
        category: 'containers',
        isTextEditable: true,
        isDrillable: true,
        createDefault: (x, y, theme) => {
            const {bdrR} = themeDefaults(theme)
            return {
                ...base('tabbed-panel'), name: 'Tabbed Panel', type: 'tabbed-panel',
                transform: defaultTransform(x, y, 240, 180),
                fill: themeFill(theme),
                stroke: formStroke(),
                cornerRadius: bdrR,
                text: {...themeText('Tab 1, Tab 2, Tab 3', theme), align: 'center', fontWeight: 'normal'},
                activeTab: 0,
                clipChildren: false,
            } as TabbedPanelShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick, children}) =>
            <TabbedPanelShapeComp shape={shape as TabbedPanelShape} isSelected={isSelected}
                                  isEditing={isEditingText} dispatch={dispatch}
                                  handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}>
                {children}
            </TabbedPanelShapeComp>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as TabbedPanelShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Tabs">
                        <NumberInput label="Active Tab" value={s.activeTab + 1} min={1}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id,
                                         patch: {activeTab: Math.max(0, Math.round(v) - 1)} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                    <CollapsibleSection title="Panel">
                        <ToggleInput label="Clip" value={s.clipChildren}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id, patch: {clipChildren: v} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'frame',
        name: 'Panel',
        toolMode: 'insert-frame',
        icon: <LayoutPanelLeft size={14}/>,
        category: 'containers',
        isDrillable: true,
        createDefault: (x, y, theme) => {
            const {bdrR} = themeDefaults(theme)
            return {
                ...base('frame'), name: 'Frame', type: 'frame',
                transform: defaultTransform(x, y, 200, 150),
                fill: themeFill(theme),
                stroke: formStroke(),
                cornerRadius: bdrR,
                clipChildren: false,
            } as FrameShape
        },
        renderShape: ({shape, isSelected, handDrawn, dispatch, onClick, onDoubleClick, children}) =>
            <FrameShapeComp shape={shape as FrameShape} isSelected={isSelected}
                            dispatch={dispatch} handDrawn={handDrawn}
                            onClick={onClick} onDoubleClick={onDoubleClick}>
                {children}
            </FrameShapeComp>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as FrameShape
            return (
                <CollapsibleSection title="Frame">
                    <ToggleInput label="Clip" value={s.clipChildren}
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id, patch: {clipChildren: v} as Partial<Shape>
                                 })}/>
                </CollapsibleSection>
            )
        },
    },
    {
        type: 'dialog',
        name: 'Dialog',
        toolMode: 'insert-dialog',
        icon: <AppWindow size={14}/>,
        category: 'containers',
        isDrillable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('dialog'), name: 'Dialog', type: 'dialog',
                transform: defaultTransform(x, y, 320, 220),
                fill: themeFill(theme),
                stroke: formStroke(),
                title: 'Dialog',
                text: {...themeText('Checkbox', theme), align: 'left', color: theme ? fg : '#333333'},
                okLabel: 'OK',
                cancelLabel: 'Cancel',
            } as DialogShape
        },
        renderShape: ({shape, isSelected, handDrawn, dispatch, onClick, onDoubleClick, children}) =>
            <DialogShapeComp shape={shape as DialogShape} isSelected={isSelected}
                             dispatch={dispatch} handDrawn={handDrawn}
                             onClick={onClick} onDoubleClick={onDoubleClick}>
                {children}
            </DialogShapeComp>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as DialogShape
            return (
                <CollapsibleSection title="Dialog">
                    <input value={s.title} placeholder="Title"
                           style={{fontSize: 12, padding: '2px 6px', width: '100%'}}
                           onChange={e => dispatch({
                               type: 'PATCH_SHAPE', id: s.id, patch: {title: e.target.value} as Partial<Shape>
                           })}/>
                    <input value={s.okLabel} placeholder="OK label"
                           style={{fontSize: 12, padding: '2px 6px', width: '100%', marginTop: 4}}
                           onChange={e => dispatch({
                               type: 'PATCH_SHAPE', id: s.id, patch: {okLabel: e.target.value} as Partial<Shape>
                           })}/>
                    <input value={s.cancelLabel} placeholder="Cancel label"
                           style={{fontSize: 12, padding: '2px 6px', width: '100%', marginTop: 4}}
                           onChange={e => dispatch({
                               type: 'PATCH_SHAPE', id: s.id, patch: {cancelLabel: e.target.value} as Partial<Shape>
                           })}/>
                </CollapsibleSection>
            )
        },
    },
    {
        type: 'scrollpanel',
        name: 'Scroll Panel',
        toolMode: 'insert-scrollpanel',
        icon: <ScrollText size={14}/>,
        category: 'containers',
        isDrillable: true,
        createDefault: (x, y, theme) => {
            const {bdrR} = themeDefaults(theme)
            return {
                ...base('scrollpanel'), name: 'Scroll Panel', type: 'scrollpanel',
                transform: defaultTransform(x, y, 200, 180),
                fill: themeFill(theme),
                stroke: formStroke(),
                cornerRadius: bdrR,
                scrollPosition: 0.2,
                clipChildren: false,
            } as ScrollPanelShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick, children}) =>
            <ScrollPanelShapeComp shape={shape as ScrollPanelShape} isSelected={isSelected}
                                  isEditing={isEditingText} dispatch={dispatch}
                                  handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}>
                {children}
            </ScrollPanelShapeComp>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as ScrollPanelShape
            return (
                <CollapsibleSection title="Scroll Panel">
                    <NumberInput label="Scroll" value={s.scrollPosition} min={0} max={1} step={0.05}
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id,
                                     patch: {scrollPosition: Math.max(0, Math.min(1, v))} as Partial<Shape>
                                 })}/>
                </CollapsibleSection>
            )
        },
    },
    {
        type: 'slider',
        name: 'Slider',
        toolMode: 'insert-slider',
        icon: <SlidersHorizontal size={14}/>,
        category: 'forms',
        createDefault: (x, y, theme) => {
            const {bdr} = themeDefaults(theme)
            return {
                ...base('slider'), type: 'slider',
                transform: defaultTransform(x, y, 160, 24),
                value: 0.5,
                ticks: 0,
                fill: {type: 'color', color: '#e5e7eb', opacity: 1},
                thumbFill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                stroke: formStroke(),
            } as SliderShape
        },
        renderShape: ({shape, isSelected, handDrawn, onClick, onDoubleClick}) =>
            <SliderShapeComp shape={shape as SliderShape} isSelected={isSelected}
                             handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as SliderShape
            return (
                <CollapsibleSection title="Slider">
                    <NumberInput label="Value" value={Math.round(s.value * 100)} min={0} max={100} unit="%"
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id, patch: {value: v / 100} as Partial<Shape>
                                 })}/>
                    <NumberInput label="Ticks" value={s.ticks ?? 0} min={0} max={20}
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id,
                                     patch: {ticks: Math.round(v)} as Partial<Shape>
                                 })}/>
                </CollapsibleSection>
            )
        },
    },
    {
        type: 'label',
        name: 'Label',
        toolMode: 'insert-label',
        icon: <Tag size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('label'), type: 'label',
                transform: defaultTransform(x, y, 100, 20),
                text: {...themeText('Label', theme), align: 'left', color: theme ? fg : '#555555'},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as LabelShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <LabelShapeComp shape={shape as LabelShape} isSelected={isSelected}
                            isEditing={isEditingText} dispatch={dispatch}
                            handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as LabelShape
            return <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
        },
    },
    {
        type: 'textfield',
        name: 'Text Field',
        toolMode: 'insert-textfield',
        icon: <TextCursorInput size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('textfield'), type: 'textfield',
                transform: defaultTransform(x, y, 160, 32),
                placeholder: 'Placeholder...',
                text: {...themeText('', theme), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as TextFieldShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <TextFieldShapeComp shape={shape as TextFieldShape} isSelected={isSelected}
                                isEditing={isEditingText} dispatch={dispatch}
                                handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as TextFieldShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Text Field">
                        <input value={s.placeholder} placeholder="Placeholder text"
                               style={{fontSize: 12, padding: '2px 6px', width: '100%'}}
                               onChange={e => dispatch({
                                   type: 'PATCH_SHAPE', id: s.id,
                                   patch: {placeholder: e.target.value} as Partial<Shape>
                               })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'checkbox',
        name: 'Checkbox',
        toolMode: 'insert-checkbox',
        icon: <CheckSquare size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('checkbox'), type: 'checkbox',
                transform: defaultTransform(x, y, 120, 20),
                checked: false,
                text: {...themeText('Checkbox', theme), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as CheckboxShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <CheckboxShapeComp shape={shape as CheckboxShape} isSelected={isSelected}
                               isEditing={isEditingText} dispatch={dispatch}
                               handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as CheckboxShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Checkbox">
                        <ToggleInput label="Checked" value={s.checked}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id, patch: {checked: v} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'toggle',
        name: 'Toggle',
        toolMode: 'insert-toggle',
        icon: <ToggleLeft size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg, bdr} = themeDefaults(theme)
            return {
                ...base('toggle'), type: 'toggle',
                transform: defaultTransform(x, y, 130, 24),
                checked: false,
                text: {...themeText('Toggle', theme), align: 'left', color: theme ? fg : '#333333'},
                thumbFill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as ToggleShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <ToggleShapeComp shape={shape as ToggleShape} isSelected={isSelected}
                             isEditing={isEditingText} dispatch={dispatch}
                             handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as ToggleShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Toggle">
                        <ToggleInput label="Checked" value={s.checked}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id, patch: {checked: v} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'radio',
        name: 'Radio Button',
        toolMode: 'insert-radio',
        icon: <CircleDot size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('radio'), name: 'Radio', type: 'radio',
                transform: defaultTransform(x, y, 120, 20),
                checked: false,
                text: {...themeText('Option', theme), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as RadioShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <RadioShapeComp shape={shape as RadioShape} isSelected={isSelected}
                            isEditing={isEditingText} dispatch={dispatch}
                            handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as RadioShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Radio Button">
                        <ToggleInput label="Checked" value={s.checked}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id, patch: {checked: v} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'select',
        name: 'Select',
        toolMode: 'insert-select',
        icon: <List size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('select'), name: 'Select', type: 'select',
                transform: defaultTransform(x, y, 160, 32),
                value: '',
                placeholder: 'Select...',
                text: {...themeText('', theme), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as SelectShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <SelectShapeComp shape={shape as SelectShape} isSelected={isSelected}
                             isEditing={isEditingText} dispatch={dispatch}
                             handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as SelectShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="Select">
                        <input value={s.placeholder} placeholder="Placeholder"
                               style={{fontSize: 12, padding: '2px 6px', width: '100%'}}
                               onChange={e => dispatch({
                                   type: 'PATCH_SHAPE', id: s.id,
                                   patch: {placeholder: e.target.value} as Partial<Shape>
                               })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'progress',
        name: 'Progress Bar',
        toolMode: 'insert-progress',
        icon: <GanttChart size={14}/>,
        category: 'forms',
        createDefault: (x, y, theme) => {
            const {bdr} = themeDefaults(theme)
            return {
                ...base('progress'), name: 'Progress', type: 'progress',
                transform: defaultTransform(x, y, 200, 16),
                value: 60,
                ticks: 0,
                fill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                progressFill: {type: 'color', color: '#e5e7eb', opacity: 1},
                stroke: formStroke(),
            } as ProgressShape
        },
        renderShape: ({shape, isSelected, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <ProgressShapeComp shape={shape as ProgressShape} isSelected={isSelected}
                               dispatch={dispatch} handDrawn={handDrawn}
                               onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as ProgressShape
            return (
                <CollapsibleSection title="Progress Bar">
                    <NumberInput label="Value" value={s.value} min={0} max={100} unit="%"
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id, patch: {value: v} as Partial<Shape>
                                 })}/>
                    <NumberInput label="Ticks" value={s.ticks ?? 0} min={0} max={20}
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id,
                                     patch: {ticks: Math.round(v)} as Partial<Shape>
                                 })}/>
                </CollapsibleSection>
            )
        },
    },
    {
        type: 'stepper',
        name: 'Number Stepper',
        toolMode: 'insert-stepper',
        icon: <Hash size={14}/>,
        category: 'forms',
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('stepper'), name: 'Stepper', type: 'stepper',
                transform: defaultTransform(x, y, 140, 32),
                value: 0,
                text: {...themeText('0', theme), color: theme ? fg : '#333333', align: 'center', verticalAlign: 'middle'},
                fill: themeFill(theme),
                stroke: formStroke(),
            } as StepperShape
        },
        renderShape: ({shape, isSelected, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <StepperShapeComp shape={shape as StepperShape} isSelected={isSelected}
                              dispatch={dispatch} handDrawn={handDrawn}
                              onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as StepperShape
            return (
                <CollapsibleSection title="Number Stepper">
                    <NumberInput label="Value" value={s.value}
                                 onChange={v => dispatch({
                                     type: 'PATCH_SHAPE', id: s.id, patch: {value: v} as Partial<Shape>
                                 })}/>
                </CollapsibleSection>
            )
        },
    },
    {
        type: 'stickynote',
        name: 'Sticky Note',
        toolMode: 'insert-stickynote',
        icon: <StickyNote size={14}/>,
        category: 'containers',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg, bg} = themeDefaults(theme)
            return {
                ...base('stickynote'), name: 'Sticky Note', type: 'stickynote',
                transform: defaultTransform(x, y, 160, 140),
                fill: {type: 'color', color: theme ? bg : '#fef08a', opacity: 1},
                stroke: formStroke(),
                text: {...themeText('Note...', theme), align: 'left', verticalAlign: 'top', color: theme ? fg : '#333333'},
            } as StickyNoteShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <StickyNoteShapeComp shape={shape as StickyNoteShape} isSelected={isSelected}
                                 isEditing={isEditingText} dispatch={dispatch}
                                 handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as StickyNoteShape
            return <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
        },
    },
    {
        type: 'list',
        name: 'List',
        toolMode: 'insert-list',
        icon: <ListOrdered size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('list'), name: 'List', type: 'list',
                transform: defaultTransform(x, y, 180, 160),
                fill: themeFill(theme),
                stroke: formStroke(),
                text: {...themeText('Item One\nItem Two\nItem Three', theme), align: 'left', verticalAlign: 'top', color: theme ? fg : '#333333'},
                selectedIndex: 0,
            } as ListShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <ListShapeComp shape={shape as ListShape} isSelected={isSelected}
                           isEditing={isEditingText} dispatch={dispatch}
                           handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as ListShape
            return (
                <>
                    <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
                    <CollapsibleSection title="List">
                        <NumberInput label="Selected row" value={s.selectedIndex} min={-1}
                                     onChange={v => dispatch({
                                         type: 'PATCH_SHAPE', id: s.id,
                                         patch: {selectedIndex: Math.round(v)} as Partial<Shape>
                                     })}/>
                    </CollapsibleSection>
                </>
            )
        },
    },
    {
        type: 'table',
        name: 'Table',
        toolMode: 'insert-table',
        icon: <Table2 size={14}/>,
        category: 'forms',
        isTextEditable: true,
        createDefault: (x, y, theme) => {
            const {fg} = themeDefaults(theme)
            return {
                ...base('table'), name: 'Table', type: 'table',
                transform: defaultTransform(x, y, 240, 120),
                fill: themeFill(theme),
                stroke: formStroke(),
                text: {
                    ...themeText('Name,Age,City\nAlice,30,NYC\nBob,25,LA', theme),
                    align: 'left', verticalAlign: 'top', color: theme ? fg : '#333333',
                },
            } as TableShape
        },
        renderShape: ({shape, isSelected, isEditingText, handDrawn, dispatch, onClick, onDoubleClick}) =>
            <TableShapeComp shape={shape as TableShape} isSelected={isSelected}
                            isEditing={isEditingText} dispatch={dispatch}
                            handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as TableShape
            return <ContentSection id={s.id} content={s.text.content} dispatch={dispatch}/>
        },
    },
    {
        type: 'imagemock',
        name: 'Image Mock',
        toolMode: 'insert-imagemock',
        icon: <Image size={14}/>,
        category: 'mockups',
        createDefault: (x, y, theme) => ({
            ...base('imagemock'), name: 'Image Mock', type: 'imagemock',
            transform: defaultTransform(x, y, 160, 120),
            fill: themeFill(theme),
            stroke: formStroke(),
        } as ImageMockShape),
        renderShape: ({shape, isSelected, handDrawn, onClick, onDoubleClick}) =>
            <ImageMockShapeComp shape={shape as ImageMockShape} isSelected={isSelected}
                                handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
    },
    {
        type: 'chartmock',
        name: 'Chart Mock',
        toolMode: 'insert-chartmock',
        icon: <BarChart2 size={14}/>,
        category: 'mockups',
        createDefault: (x, y, theme) => {
            const {bdr} = themeDefaults(theme)
            return {
                ...base('chartmock'), name: 'Chart Mock', type: 'chartmock',
                transform: defaultTransform(x, y, 200, 140),
                fill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                stroke: formStroke(),
                chartType: 'bar',
            } as ChartMockShape
        },
        renderShape: ({shape, isSelected, handDrawn, onClick, onDoubleClick}) =>
            <ChartMockShapeComp shape={shape as ChartMockShape} isSelected={isSelected}
                                handDrawn={handDrawn} onClick={onClick} onDoubleClick={onDoubleClick}/>,
        renderProperties: ({shape, dispatch}) => {
            const s = shape as ChartMockShape
            return (
                <div style={{padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12}}>
                    <label>Type</label>
                    <select value={s.chartType} style={{fontSize: 12}}
                            onChange={e => dispatch({
                                type: 'PATCH_SHAPE', id: s.id,
                                patch: {chartType: e.target.value as 'bar' | 'line'} as Partial<Shape>
                            })}>
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                    </select>
                </div>
            )
        },
    },
]

export const FORMS_POWER_UP: PowerUpDefinition = {
    id: FORMS_POWER_UP_ID,
    name: 'Forms',
    version: 1,
    createDefaultDocumentSettings: () => ({}),
    shapeTypes: FORM_SHAPE_TYPES,
}
