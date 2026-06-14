import {NumberInput} from '@components/properties/inputs/NumberInput'
import {ToggleInput} from '@components/properties/inputs/ToggleInput'
import {CollapsibleSection} from '@components/properties/CollapsibleSection'
import {stopPhysicsSimulation, togglePhysicsSimulation} from '@powerups/physicsRuntime'
import {exportPhysicsHtml} from '@utils/exportPhysicsHtml'
import {exportPageAsPng} from '@utils/exportPng'
import {downloadDocumentXml} from '@utils/exportXml'
import {Download, Play, ScrollText} from 'lucide-react'
import type {PowerUpDefinition} from './types'

const PHYSICS_POWER_UP_ID = 'powerup.physics'
const XML_EXPORT_POWER_UP_ID = 'powerup.export.xml'
const PNG_EXPORT_POWER_UP_ID = 'powerup.export.png'
const FORMS_POWER_UP_ID = 'powerup.forms'

// Forms powerup uses a dynamic import in its lifecycle to avoid a circular dependency:
// formsBuiltIn → CollapsibleSection → @store/context → reducer → registry → builtIns → formsBuiltIn
const FORMS_POWER_UP_STUB: PowerUpDefinition = {
    id: FORMS_POWER_UP_ID,
    name: 'Forms',
    version: 1,
    createDefaultDocumentSettings: () => ({}),
    lifecycle: {
        onLoad: async () => {
            const [{FORMS_POWER_UP}, {shapeRegistry}] = await Promise.all([
                import('./formsBuiltIn'),
                import('./shapeRegistry'),
            ])
            shapeRegistry.register(FORMS_POWER_UP.shapeTypes ?? [])
        },
        onUnload: async () => {
            const [{FORMS_POWER_UP}, {shapeRegistry}] = await Promise.all([
                import('./formsBuiltIn'),
                import('./shapeRegistry'),
            ])
            shapeRegistry.unregister((FORMS_POWER_UP.shapeTypes ?? []).map(t => t.type))
        },
    },
}

export const BUILT_IN_POWER_UPS: PowerUpDefinition[] = [
    FORMS_POWER_UP_STUB,
    {
        id: PHYSICS_POWER_UP_ID,
        name: 'Physics',
        version: 1,
        createDefaultDocumentSettings: () => ({gravityX: 0, gravityY: 9.8, iterations: 8}),
        documentSettingsRenderer: ({settings, update}) => {
            const gravityX = typeof settings.gravityX === 'number' ? settings.gravityX : 0
            const gravityY = typeof settings.gravityY === 'number' ? settings.gravityY : 9.8
            const iterations = typeof settings.iterations === 'number' ? settings.iterations : 8
            return (
                <CollapsibleSection title="Physics">
                    <NumberInput label="Gravity X" value={gravityX} step={0.1}
                                 onChange={v => update({gravityX: v})}/>
                    <NumberInput label="Gravity Y" value={gravityY} step={0.1}
                                 onChange={v => update({gravityY: v})}/>
                    <NumberInput label="Solver Iterations" value={iterations} min={1} max={64}
                                 onChange={v => update({iterations: Math.max(1, Math.round(v))})}/>
                </CollapsibleSection>
            )
        },
        nodeFeatures: [
            {
                id: 'physics-body',
                name: 'Physics Body',
                createDefaultSettings: () => ({bodyType: 'dynamic', mass: 1, friction: 0.3}),
                canAttachToShape: shape => shape.type !== 'page',
                propsRenderer: ({settings, update}) => {
                    const bodyType =
                        settings.bodyType === 'static' || settings.bodyType === 'kinematic' || settings.bodyType === 'dynamic'
                            ? settings.bodyType
                            : 'dynamic'
                    const mass = typeof settings.mass === 'number' ? settings.mass : 1
                    const friction = typeof settings.friction === 'number' ? settings.friction : 0.3
                    return (
                        <>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                                <label style={{fontSize: 12}}>Body Type</label>
                                <select
                                    value={bodyType}
                                    onChange={e => update({bodyType: e.target.value})}
                                    style={{fontSize: 12}}
                                >
                                    <option value="dynamic">Dynamic</option>
                                    <option value="static">Static</option>
                                    <option value="kinematic">Kinematic</option>
                                </select>
                            </div>
                            <NumberInput label="Mass" value={mass} min={0} step={0.1}
                                         onChange={v => update({mass: Math.max(0, v)})}/>
                            <NumberInput label="Friction" value={friction} min={0} max={1} step={0.05}
                                         onChange={v => update({friction: Math.max(0, Math.min(1, v))})}/>
                        </>
                    )
                },
            },
        ],
        toolbarActions: [
            {
                id: 'physics-simulate',
                title: 'Physics',
                icon: <Play size={15}/>,
                run: (ctx) => {
                    togglePhysicsSimulation(ctx)
                },
            },
        ],
        menuActions: [
            {
                id: 'physics-simulate',
                title: 'Run/Stop Physics',
                tauriMenuId: 'menu:powerups:action:physics:simulate',
                run: (ctx) => {
                    togglePhysicsSimulation(ctx)
                },
            },
            {
                id: 'physics-export-html',
                title: 'Export Physics HTML...',
                tauriMenuId: 'menu:powerups:action:physics:export-html',
                isEnabled: ({state}) => !!state.activePageId,
                run: ({state}) => {
                    exportPhysicsHtml(state, `${state.documentName || 'physics'}-simulation.html`)
                },
            },
        ],
        lifecycle: {
            onUnload: async (ctx) => {
                stopPhysicsSimulation()
                ctx.dispatch({type: 'SET_PHYSICS_SIMULATION_RUNNING', running: false})
            },
        },
    },
    {
        id: XML_EXPORT_POWER_UP_ID,
        name: 'XML Export',
        version: 1,
        createDefaultDocumentSettings: () => ({pretty: true, includeLibrary: false}),
        documentSettingsRenderer: ({settings, update}) => {
            const pretty = settings.pretty !== false
            const includeLibrary = settings.includeLibrary === true
            return (
                <CollapsibleSection title="XML Export">
                    <ToggleInput label="Pretty Print" value={pretty} onChange={v => update({pretty: v})}/>
                    <ToggleInput label="Include Library" value={includeLibrary}
                                 onChange={v => update({includeLibrary: v})}/>
                </CollapsibleSection>
            )
        },
        toolbarActions: [
            {
                id: 'xml-export',
                title: 'XML',
                icon: <ScrollText size={15}/>,
                run: ({state}) => {
                    downloadDocumentXml(state.document, `${state.documentName || 'export'}.xml`)
                },
            },
        ],
        menuActions: [
            {
                id: 'xml-export',
                title: 'Export XML...',
                tauriMenuId: 'menu:powerups:action:xml-export:export',
                run: ({state}) => {
                    downloadDocumentXml(state.document, `${state.documentName || 'export'}.xml`)
                },
            },
        ],
    },
    {
        id: PNG_EXPORT_POWER_UP_ID,
        name: 'PNG Export',
        version: 1,
        createDefaultDocumentSettings: () => ({scale: 2, transparentBackground: false}),
        documentSettingsRenderer: ({settings, update}) => {
            const scale = typeof settings.scale === 'number' ? settings.scale : 2
            const transparentBackground = settings.transparentBackground === true
            return (
                <CollapsibleSection title="PNG Export">
                    <NumberInput
                        label="Scale"
                        value={scale}
                        min={1}
                        max={8}
                        step={1}
                        onChange={v => update({scale: Math.max(1, Math.min(8, Math.round(v)))})}
                    />
                    <ToggleInput
                        label="Transparent"
                        value={transparentBackground}
                        onChange={v => update({transparentBackground: v})}
                    />
                </CollapsibleSection>
            )
        },
        toolbarActions: [
            {
                id: 'png-export',
                title: 'PNG',
                icon: <Download size={15}/>,
                run: async ({state}) => {
                    const settings = state.document.powerUps.find(p => p.id === PNG_EXPORT_POWER_UP_ID)?.settings ?? {}
                    await exportPageAsPng(state, {
                        scale: typeof settings.scale === 'number' ? settings.scale : 2,
                        transparentBackground: settings.transparentBackground === true,
                    })
                },
            },
        ],
        menuActions: [
            {
                id: 'png-export',
                title: 'Export PNG (Power Up)...',
                tauriMenuId: 'menu:powerups:action:png-export:export',
                run: async ({state}) => {
                    const settings = state.document.powerUps.find(p => p.id === PNG_EXPORT_POWER_UP_ID)?.settings ?? {}
                    await exportPageAsPng(state, {
                        scale: typeof settings.scale === 'number' ? settings.scale : 2,
                        transparentBackground: settings.transparentBackground === true,
                    })
                },
            },
        ],
    },
]

export const BUILT_IN_POWER_UP_IDS = {
    PHYSICS_POWER_UP_ID,
    XML_EXPORT_POWER_UP_ID,
    PNG_EXPORT_POWER_UP_ID,
    FORMS_POWER_UP_ID,
}
