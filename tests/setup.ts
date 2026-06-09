import '@testing-library/jest-dom'
import {beforeAll} from 'vitest'

// Register form shapes so tests can call createShape() for form types.
// Uses dynamic import to avoid the circular: formsBuiltIn → FillSection → context → reducer → registry → builtIns → formsBuiltIn
beforeAll(async () => {
    const [{FORMS_POWER_UP}, {shapeRegistry}] = await Promise.all([
        import('../src/powerups/formsBuiltIn'),
        import('../src/powerups/shapeRegistry'),
    ])
    shapeRegistry.register(FORMS_POWER_UP.shapeTypes ?? [])
})
