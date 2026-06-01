# Power Ups

This project includes a built-in plugin-style extension system called **Power Ups**.

## Overview

Power Ups are enabled per-document and persisted in document JSON. A document can contain at most one instance of a given power up ID.

When enabled, a power up can contribute:
- Document-level settings UI
- Shape-level feature settings UI
- Toolbar actions
- File menu actions
- Lifecycle hooks

Core identity fields:
- `id` (unique)
- `name` (display name)
- `version` (for migrations)

## Persistence Model

Document-level:
- `document.powerUps[]`
- Each entry: `{ id, version, settings }`

Shape-level:
- `shape.powerUps[]`
- Each entry: `{ id, version, features }`
- `features` is a map of feature id -> feature settings object.

If a document power up is removed, all related shape-level entries for that power up are removed.

Unknown power ups are preserved as inert data when loading documents.

## Built-in Power Ups

### Physics (`powerup.physics`)

Document settings:
- `gravityX`
- `gravityY`
- `iterations`

Shape feature:
- `physics-body`
- Settings: `bodyType` (`dynamic` | `static` | `kinematic`), `mass`, `friction`

Behavior:
- Uses Matter.js runtime simulation.
- Toolbar action toggles run/stop.
- While running, toolbar button becomes a red **Stop** button.
- On stop, shapes restore to their original pre-simulation transforms.

### XML Export (`powerup.export.xml`)

Document settings:
- `pretty`
- `includeLibrary`

Actions:
- Toolbar export action
- File menu export action

### PNG Export (`powerup.export.png`)

Document settings:
- `scale`
- `transparentBackground`

Actions:
- Toolbar export action
- File menu export action

## Runtime and Lifecycle

Power up runtime hooks are wired through `usePowerUpsRuntime`:
- `onInstall`
- `onLoad`
- `onUnload`
- `onNodeSelected`
- `onDocumentSaved`

## Key Files

- `src/powerups/types.ts`
- `src/powerups/registry.ts`
- `src/powerups/builtIns.tsx`
- `src/powerups/physicsRuntime.ts`
- `src/components/properties/sections/PowerUpsSection.tsx`
- `src/hooks/usePowerUpsRuntime.ts`

## Development Notes

- Add a new power up by creating a definition and registering it in `BUILT_IN_POWER_UPS`.
- Use migration hooks to evolve settings schema safely across versions.
- Toolbar/menu action conflicts are resolved with **last one wins** by action id.
