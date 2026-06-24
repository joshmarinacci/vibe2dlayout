import type {ActionDefinition} from '@actions/types'
import type {DocumentPowerUpEntry, ShapePowerUpEntry} from '@model/powerUps'
import type {Shape} from '@model/shapes'
import type {Theme} from '@model/theme'
import type {AppAction, AppState} from '@store/types'
import type {Dispatch, MouseEvent, ReactNode} from 'react'

export interface PowerUpDefinition {
    id: string
    name: string
    version: number
    createDefaultDocumentSettings: () => Record<string, unknown>
    documentSettingsRenderer?: (props: PowerUpDocumentSettingsRendererProps) => ReactNode
    nodeFeatures?: PowerUpNodeFeatureDefinition[]
    shapeTypes?: PowerUpShapeTypeDefinition[]
    toolbarActions?: PowerUpToolbarActionDefinition[]
    menuActions?: PowerUpMenuActionDefinition[]
    // New unified actions — registered into the action registry on install, unregistered on unload.
    // These appear in the command palette automatically. Use surfaces: ['toolbar'] to also render
    // in the toolbar alongside toolbarActions.
    actions?: ActionDefinition[]
    lifecycle?: PowerUpLifecycleHooks
    migrateDocument?: (ctx: PowerUpDocumentMigrationContext) => DocumentPowerUpEntry
    migrateShape?: (ctx: PowerUpShapeMigrationContext) => ShapePowerUpEntry
}

export interface ShapeRenderProps {
    shape: Shape
    isSelected: boolean
    isEditingText: boolean
    handDrawn: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: MouseEvent) => void
    onDoubleClick: (e: MouseEvent) => void
    children: ReactNode | null
}

export interface ShapePropertiesProps {
    shape: Shape
    dispatch: Dispatch<AppAction>
}

export interface PowerUpShapeTypeDefinition {
    type: string
    name: string
    toolMode: string
    icon: ReactNode
    category: 'shapes' | 'containers' | 'forms' | 'mockups'
    isTextEditable?: boolean
    isDrillable?: boolean
    createDefault: (x: number, y: number, theme?: Theme) => Shape
    renderShape: (props: ShapeRenderProps) => ReactNode
    renderProperties?: (props: ShapePropertiesProps) => ReactNode
}

export interface PowerUpDocumentSettingsRendererProps {
    settings: Record<string, unknown>
    update: (patch: Record<string, unknown>) => void
}

export interface PowerUpNodeFeaturePropsRendererProps {
    settings: Record<string, unknown>
    shape: Shape
    update: (patch: Record<string, unknown>) => void
}

export interface PowerUpNodeFeatureDefinition {
    id: string
    name: string
    createDefaultSettings: () => Record<string, unknown>
    canAttachToShape?: (shape: Shape) => boolean
    propsRenderer: (props: PowerUpNodeFeaturePropsRendererProps) => ReactNode
}

export interface PowerUpActionContext {
    state: AppState
    dispatch: Dispatch<AppAction>
}

export interface PowerUpToolbarActionDefinition {
    id: string
    title: string
    icon: ReactNode
    run: (ctx: PowerUpActionContext) => void | Promise<void>
    isEnabled?: (ctx: PowerUpActionContext) => boolean
}

export interface PowerUpMenuActionDefinition {
    id: string
    title: string
    run: (ctx: PowerUpActionContext) => void | Promise<void>
    isEnabled?: (ctx: PowerUpActionContext) => boolean
    tauriMenuId?: string
}

export interface PowerUpLifecycleHooks {
    onInstall?: (ctx: PowerUpActionContext, entry: DocumentPowerUpEntry) => void | Promise<void>
    onLoad?: (ctx: PowerUpActionContext, entry: DocumentPowerUpEntry) => void | Promise<void>
    onUnload?: (ctx: PowerUpActionContext, entry: DocumentPowerUpEntry) => void | Promise<void>
    onNodeSelected?: (ctx: PowerUpActionContext, payload: PowerUpNodeSelectedPayload) => void | Promise<void>
    onDocumentSaved?: (ctx: PowerUpActionContext, entry: DocumentPowerUpEntry) => void | Promise<void>
}

export interface PowerUpNodeSelectedPayload {
    shape: Shape
    shapePowerUp: ShapePowerUpEntry
    documentPowerUp: DocumentPowerUpEntry
}

export interface PowerUpDocumentMigrationContext {
    entry: DocumentPowerUpEntry
}

export interface PowerUpShapeMigrationContext {
    entry: ShapePowerUpEntry
    shape: Shape
}

export interface RegisteredPowerUp {
    definition: PowerUpDefinition
    documentEntry: DocumentPowerUpEntry
}
