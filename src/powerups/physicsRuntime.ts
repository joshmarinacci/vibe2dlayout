import type {Shape} from '@model/shapes'
import type {PowerUpActionContext} from './types'
import {
    Bodies,
    Body,
    Composite,
    Engine,
    type Engine as MatterEngine,
    type Body as MatterBody,
} from 'matter-js'
import {createPowerUpLogger} from '@logging'

interface PhysicsBodySettings {
    bodyType: 'dynamic' | 'static' | 'kinematic'
    mass: number
    friction: number
}

function toPhysicsSettings(raw: Record<string, unknown>): PhysicsBodySettings {
    const bodyType =
        raw.bodyType === 'static' || raw.bodyType === 'kinematic' || raw.bodyType === 'dynamic'
            ? raw.bodyType
            : 'dynamic'
    return {
        bodyType,
        mass: typeof raw.mass === 'number' ? Math.max(0, raw.mass) : 1,
        friction: typeof raw.friction === 'number' ? Math.max(0, Math.min(1, raw.friction)) : 0.3,
    }
}

function hasTransform(shape: Shape): shape is Shape & { transform: { x: number; y: number; width: number; height: number; rotation: number } } {
    return 'transform' in shape
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI
}

function rounded(value: number): number {
    return Math.round(value * 1000) / 1000
}

class PhysicsSession {
    private readonly engine: MatterEngine
    private readonly shapeBodies = new Map<string, MatterBody>()
    private readonly dispatch: PowerUpActionContext['dispatch']
    private readonly baseShapes: Record<string, Shape>
    private readonly initialTransforms = new Map<string, { x: number; y: number; rotation: number }>()
    private lastTick = 0
    private rafId: number | null = null
    private readonly logger = createPowerUpLogger('physics')

    constructor(ctx: PowerUpActionContext) {
        this.dispatch = ctx.dispatch
        this.baseShapes = ctx.state.document.shapes

        const physicsPowerUp = ctx.state.document.powerUps.find(p => p.id === 'powerup.physics')
        const settings = physicsPowerUp?.settings ?? {}
        const gravityX = typeof settings.gravityX === 'number' ? settings.gravityX : 0
        const gravityY = typeof settings.gravityY === 'number' ? settings.gravityY : 9.8
        const iterations = typeof settings.iterations === 'number' ? Math.max(1, Math.round(settings.iterations)) : 8

        this.engine = Engine.create({
            positionIterations: iterations,
            velocityIterations: Math.max(2, Math.round(iterations / 2)),
            constraintIterations: Math.max(2, Math.round(iterations / 3)),
        })
        this.engine.gravity.x = gravityX
        this.engine.gravity.y = gravityY
        this.engine.gravity.scale = 0.001

        this.addStaticPageBoundaries(ctx.state.document.shapes)
        this.addPhysicsBodies(ctx.state.document.shapes)
        this.logger.info('Physics session created', {
            gravityX,
            gravityY,
            iterations,
        })
    }

    start(): void {
        this.logger.info('Physics session started')
        this.lastTick = performance.now()
        this.tick()
    }

    stop(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
        const restoreUpdates = [...this.initialTransforms.entries()].map(([id, t]) => ({
            id,
            x: t.x,
            y: t.y,
            rotation: t.rotation,
        }))
        if (restoreUpdates.length > 0) {
            this.dispatch({type: 'APPLY_PHYSICS_TRANSFORMS', updates: restoreUpdates})
        }
        Composite.clear(this.engine.world, false, true)
        this.logger.info('Physics session stopped', {restoredShapes: restoreUpdates.length})
    }

    private addStaticPageBoundaries(shapes: Record<string, Shape>): void {
        const wallThickness = 100
        for (const shape of Object.values(shapes)) {
            if (shape.type !== 'page') continue
            const t = shape.transform
            const centerX = t.x + t.width / 2
            const centerY = t.y + t.height / 2
            const left = Bodies.rectangle(t.x - wallThickness / 2, centerY, wallThickness, t.height + wallThickness * 2, {isStatic: true})
            const right = Bodies.rectangle(t.x + t.width + wallThickness / 2, centerY, wallThickness, t.height + wallThickness * 2, {isStatic: true})
            const top = Bodies.rectangle(centerX, t.y - wallThickness / 2, t.width + wallThickness * 2, wallThickness, {isStatic: true})
            const bottom = Bodies.rectangle(centerX, t.y + t.height + wallThickness / 2, t.width + wallThickness * 2, wallThickness, {isStatic: true})
            Composite.add(this.engine.world, [left, right, top, bottom])
        }
    }

    private addPhysicsBodies(shapes: Record<string, Shape>): void {
        for (const shape of Object.values(shapes)) {
            if (!shape.powerUps || shape.powerUps.length === 0) continue
            if (!hasTransform(shape) || shape.type === 'page') continue

            const powerUp = shape.powerUps.find(p => p.id === 'powerup.physics')
            const featureSettings = powerUp?.features['physics-body']
            if (!featureSettings) continue
            this.initialTransforms.set(shape.id, {
                x: shape.transform.x,
                y: shape.transform.y,
                rotation: shape.transform.rotation,
            })

            const config = toPhysicsSettings(featureSettings)
            const cx = shape.transform.x + shape.transform.width / 2
            const cy = shape.transform.y + shape.transform.height / 2

            const body = shape.type === 'circle'
                ? Bodies.circle(cx, cy, Math.max(1, Math.min(shape.transform.width, shape.transform.height) / 2), {
                    friction: config.friction,
                    isStatic: config.bodyType !== 'dynamic',
                })
                : Bodies.rectangle(cx, cy, Math.max(1, shape.transform.width), Math.max(1, shape.transform.height), {
                    friction: config.friction,
                    isStatic: config.bodyType !== 'dynamic',
                })

            Body.setAngle(body, toRadians(shape.transform.rotation))
            if (config.bodyType === 'dynamic' && config.mass > 0) {
                Body.setMass(body, config.mass)
            }
            if (config.bodyType === 'kinematic') {
                body.isSensor = true
            }

            this.shapeBodies.set(shape.id, body)
            Composite.add(this.engine.world, body)
        }
    }

    private tick = (): void => {
        const now = performance.now()
        const dt = Math.min(1000 / 30, Math.max(1000 / 120, now - this.lastTick))
        this.lastTick = now

        Engine.update(this.engine, dt)

        const updates: Array<{ id: string; x: number; y: number; rotation: number }> = []
        for (const [shapeId, body] of this.shapeBodies.entries()) {
            const shape = this.baseShapes[shapeId]
            if (!shape || !hasTransform(shape)) continue

            const x = rounded(body.position.x - shape.transform.width / 2)
            const y = rounded(body.position.y - shape.transform.height / 2)
            const rotation = rounded(toDegrees(body.angle))

            updates.push({id: shapeId, x, y, rotation})
        }

        if (updates.length > 0) {
            this.dispatch({type: 'APPLY_PHYSICS_TRANSFORMS', updates})
        }

        this.rafId = requestAnimationFrame(this.tick)
    }
}

let activeSession: PhysicsSession | null = null

export function isPhysicsSimulationRunning(): boolean {
    return activeSession !== null
}

export function stopPhysicsSimulation(): void {
    if (!activeSession) return
    activeSession.stop()
    activeSession = null
}

export function togglePhysicsSimulation(ctx: PowerUpActionContext): void {
    if (activeSession) {
        stopPhysicsSimulation()
        ctx.dispatch({type: 'SET_PHYSICS_SIMULATION_RUNNING', running: false})
        return
    }
    createPowerUpLogger('physics').debug('Starting physics simulation')
    const session = new PhysicsSession(ctx)
    activeSession = session
    ctx.dispatch({type: 'SET_PHYSICS_SIMULATION_RUNNING', running: true})
    session.start()
}
