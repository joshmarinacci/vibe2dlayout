# Code Quality Audit — Limn

**Date:** 2026-06-18  
**Scope:** `src/` — all TypeScript and TSX source files  
**Total lines audited:** ~29,859

---

## Priority 1 — Fix Now (Correctness Risk)

These issues can cause silent data corruption, runtime crashes, or incorrect behavior.

---

### 1.1 Unsafe `as` casts in `reducer.ts` (~21 instances)

**File:** `src/store/reducer.ts`

**Problem:**  
The reducer uses `as` casts pervasively to bypass the TypeScript type system rather than narrowing types properly. This makes refactoring dangerous — TypeScript will not catch mismatches.

**Key examples:**

```typescript
// Line 666 — double cast is always a red flag
rest as unknown as Shape

// Lines 521–526 — no type guard before casting
const img = shape as ImageShape
img.assetId = action.assetId  // crashes silently if shape is not ImageShape

// Line 300 — patch can add or remove required fields
{ ...shape, ...action.patch } as Shape
```

**Why it matters:**  
A `as SomeType` cast tells TypeScript "trust me, this is correct" but gives you nothing at runtime. If a shape that is not an `ImageShape` ends up in a code path that casts it to one, the app silently reads `undefined` fields instead of throwing — making bugs very hard to trace.

**Fix:**  
Replace `as` casts with discriminated union narrowing using the `type` field already present on shapes:

```typescript
// Before
const img = shape as ImageShape

// After
if (shape.type !== 'image') return state  // or throw in dev
const img = shape  // TypeScript now knows this is ImageShape
```

For `action.patch`, define typed patch interfaces per action instead of spreading into a generic `Shape`.

---

### 1.2 Stale closure in `onPointerMove` — `useCanvasPointer.ts`

**File:** `src/components/canvas/useCanvasPointer.ts`, ~line 462

**Problem:**  
The `onPointerMove` callback accesses `drilledInContainerId` from the outer scope but does not include it in the `useCallback` dependency array. When the user drills into a container and then moves a shape, the handler still sees the stale (pre-drill) value of `drilledInContainerId`.

```typescript
const onPointerMove = useCallback((e: PointerEvent) => {
  // ...
  if (drilledInContainerId) {  // <-- stale reference
    // snapping is calculated relative to wrong container
  }
}, [state.toolMode, dispatch, getCanvasPos, containerRef, snapEnabled, snapAlignment, gridSize])
//  ^ drilledInContainerId missing
```

**Why it matters:**  
Stale closures in pointer handlers cause subtle, intermittent bugs — the move handler operates with a snapshot of state from before the last render. This is the kind of bug that shows up only when the user drills into a container, starts a drag, then releases in an unexpected position.

**Fix:**  
Add `drilledInContainerId` to the dependency array. If this causes performance issues (re-registering the handler too often), consider using a ref for the drilled ID and reading `.current` inside the callback instead.

---

### 1.3 Non-null assertions on `containerRef` in hot paths — `useCanvasPointer.ts`

**File:** `src/components/canvas/useCanvasPointer.ts`, lines 177, 382, 689

**Problem:**  
`containerRef.current!.getBoundingClientRect()` is called without checking if `current` is non-null. These calls are inside pointer event handlers registered on the container itself, but React refs can be `null` briefly during unmount.

```typescript
// Line 177
const rect = containerRef.current!.getBoundingClientRect()

// Line 382 — inside drag handler
const rect = containerRef.current!.getBoundingClientRect()

// Line 689 — inside mouse wheel handler
const rect = containerRef.current!.getBoundingClientRect()
```

**Why it matters:**  
If a pointer event fires while the canvas is being torn down (e.g., switching documents), this will throw `Cannot read properties of null (reading 'getBoundingClientRect')`. The `!` suppresses the TypeScript warning, hiding the risk.

**Fix:**  
Add an early return guard at the top of each handler:

```typescript
if (!containerRef.current) return
const rect = containerRef.current.getBoundingClientRect()
```

---

## Priority 2 — Fix Soon (Performance / Reliability)

These issues don't cause immediate crashes but hurt performance or create fragile code.

---

### 2.1 Missing `useMemo` in `PropertiesPanel.tsx`

**File:** `src/components/properties/PropertiesPanel.tsx`, lines 44–48 and 239–248

**Problem:**  
Two expensive computations run on every render of the properties panel:

**Issue A — `commonValue()` uses `JSON.stringify` for equality:**

```typescript
function commonValue<T>(shapes: Shape[], key: keyof Shape): T | undefined {
  const values = shapes.map(s => JSON.stringify(s[key]))
  return values.every(v => v === values[0]) ? shapes[0][key] as T : undefined
}
```

`JSON.stringify` on complex fill/stroke objects runs on every property panel re-render. The panel re-renders on every canvas mouse-move because its parent tracks cursor position.

**Issue B — Shape category arrays rebuilt every render:**

```typescript
const withFill = selected.filter(s => 'fill' in s) as Extract<Shape, { fill: FillStyle }>[]
const withStroke = selected.filter(s => 'stroke' in s) as ...
const withText = selected.filter(s => 'textStyle' in s) as ...
```

These create new arrays every render even when `selected` hasn't changed.

**Fix:**

```typescript
const withFill = useMemo(
  () => selected.filter(s => 'fill' in s) as Extract<Shape, { fill: FillStyle }>[],
  [selected]
)
// Same for withStroke, withText

const commonFillValue = useMemo(
  () => commonValue(withFill, 'fill'),
  [withFill]
)
```

---

### 2.2 Inconsistent error handling in `Toolbar.tsx`

**File:** `src/components/toolbar/Toolbar.tsx`, lines 158 and 192

**Problem:**  
`handleSave()` calls `notifyPowerUpsDocumentSaved()` without a `.catch()`, but `handleSaveAs()` does have error handling. If power-up notification throws, the error is swallowed silently.

```typescript
// handleSave — line 158, no .catch()
await notifyPowerUpsDocumentSaved()

// handleSaveAs — line 192, has .catch()  
await notifyPowerUpsDocumentSaved().catch(err => console.error(err))
```

Additionally, error handlers use `alert()` but don't log the full error object:

```typescript
} catch (err) {
  alert('Save failed')  // err is swallowed, no console.error
}
```

**Fix:**  
Apply consistent error handling across all save paths. Log the full error before showing the alert:

```typescript
} catch (err) {
  appLogger.error('Save failed', { error: err })
  alert('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
}
```

---

### 2.3 Alignment snapping recalculated every `mousemove`

**File:** `src/components/canvas/useCanvasPointer.ts`, lines 426–440

**Problem:**  
During a drag, the alignment snap calculation runs inside `onPointerMove`, meaning it executes on every mouse move event (potentially 60+ times per second). The snapping algorithm iterates over all shapes on the canvas to find alignment guides.

```typescript
const onPointerMove = useCallback((e: PointerEvent) => {
  // ...
  const snapResult = calculateAlignmentSnap(
    movedShapes,
    allOtherShapes,  // <-- all shapes iterated every frame
    gridSize,
    snapEnabled
  )
})
```

**Why it matters:**  
On canvases with hundreds of shapes, this runs O(n) every frame during drag, contributing to jank. The set of "all other shapes" doesn't change during a drag.

**Fix:**  
Cache `allOtherShapes` in a ref at drag start, and only recompute it when drag begins (in `onPointerDown`), not on every move:

```typescript
const snapCandidatesRef = useRef<Shape[]>([])

// In onPointerDown / drag start:
snapCandidatesRef.current = getAllOtherShapes(state, draggingIds)

// In onPointerMove:
const snapResult = calculateAlignmentSnap(movedShapes, snapCandidatesRef.current, ...)
```

---

### 2.4 Non-idempotent state migration in `reducer.ts`

**File:** `src/store/reducer.ts`, lines 544–551

**Problem:**  
During document load, the migration code calls `crypto.randomUUID()` to generate IDs for custom fonts. If this migration runs every time the document loads (not just on first migration), it generates new IDs on each load, potentially breaking references.

```typescript
// Runs on every LOAD_DOCUMENT action
const migratedFonts = doc.customFonts?.map(font => ({
  ...font,
  id: font.id ?? crypto.randomUUID()  // generates new UUID if id missing
}))
```

**Why it matters:**  
If `id` is ever `undefined` or `null` due to an older save format, a new UUID is generated each time the document opens. Any shape that referenced the old ID (by its absence or previous value) will be broken.

**Fix:**  
Track migration version in the document. Only run each migration once, keyed by a `schemaVersion` field on the document object. Mark it applied and re-save.

---

## Priority 3 — Refactor (Maintainability)

These issues don't cause bugs today but make the codebase harder to change safely.

---

### 3.1 `reducer.ts` is 1,936 lines of undifferentiated switch cases

**File:** `src/store/reducer.ts`

**Problem:**  
The entire app state mutation lives in a single file with a single `switch` statement. As the app grows, finding and changing any single action requires reading past hundreds of unrelated cases. Related actions (e.g., all shape geometry actions) are not grouped together.

**Recommended split:**

| New file | Actions it handles |
|---|---|
| `reducer/shapes.ts` | ADD_SHAPE, REMOVE_SHAPE, UPDATE_SHAPE, MOVE_SHAPE, RESIZE_SHAPE, GROUP_SHAPE, UNGROUP_SHAPE |
| `reducer/assets.ts` | ADD_IMAGE_ASSET, UPDATE_IMAGE_ASSET, DELETE_IMAGE_ASSET, ADD_PIXEL_ASSET |
| `reducer/pages.ts` | ADD_PAGE, REMOVE_PAGE, REORDER_PAGE, UPDATE_PAGE, ADD_PAGE_FOLDER |
| `reducer/powerups.ts` | ADD_SHAPE_POWER_UP, REMOVE_SHAPE_POWER_UP, UPDATE_SHAPE_POWER_UP_FEATURE |
| `reducer/document.ts` | LOAD_DOCUMENT, LOAD_LIBRARY, SET_DOCUMENT_NAME |
| `reducer/ui.ts` | SET_TOOL_MODE, SET_ZOOM, SCROLL_CANVAS, SET_SELECTION |

Each sub-reducer receives `(state, action)` and returns a new state slice, then `reducer.ts` becomes an orchestrating dispatcher.

---

### 3.2 `exportHtml.ts` is 1,007 lines of unorganized helpers

**File:** `src/utils/exportHtml.ts`

**Problem:**  
The file mixes top-level orchestration (building the full HTML document) with per-shape rendering functions, CSS generation helpers, and font embedding. All shapes' render logic is in one file with no clear grouping.

**Recommended split:**

| New file | Responsibility |
|---|---|
| `export/exportHtml.ts` | Entry point: assembles HTML document |
| `export/htmlShapeRenderers.ts` | Per-shape `renderShapeToHtml()` functions |
| `export/htmlCssHelpers.ts` | CSS generation (fill, stroke, text) |
| `export/htmlFontEmbed.ts` | Font loading and base64 embedding |

---

### 3.3 `Toolbar.tsx` is 964 lines with mixed concerns

**File:** `src/components/toolbar/Toolbar.tsx`

**Problem:**  
The Toolbar component handles file I/O, menu construction, keyboard shortcuts, power-up state, and rendering all in one component. Action handlers like `handleSave`, `handleExportPng`, `handleImportJSON` are defined inline.

**Recommended split:**

- Extract all file/export action handlers into `hooks/useToolbarActions.ts` — returns an object of named callbacks
- Keep `Toolbar.tsx` as pure presentation: receives actions as props or from the hook

---

### 3.4 `useCanvasPointer.ts` mixes four distinct concerns (776 lines)

**File:** `src/components/canvas/useCanvasPointer.ts`

**Problem:**  
One hook handles: pointer-down shape selection, drag/move/resize, guide dragging, marquee selection, and drill-in to containers. These are independent interaction modes that happen to share some state.

**Recommended split:**

- `usePointerSelection.ts` — click-to-select, deselect on background click
- `usePointerDrag.ts` — move/resize with snapping
- `usePointerMarquee.ts` — rubber-band multi-select
- `useCanvasPointer.ts` — thin orchestrator that composes the above based on `toolMode`

---

### 3.5 Duplicated asset-finding logic in `PropertiesPanel.tsx`

**File:** `src/components/properties/PropertiesPanel.tsx`, lines 92–95, 133–140, 172

**Problem:**  
Three separate places filter the shape list to find shapes using a given asset, each using inline `as` casts:

```typescript
// Line 92 — pixelimage shapes
const pixelShapes = selected.filter(s => (s as any).assetId === asset.id)

// Line 134 — page shapes with pageSize
const pageShapes = selected.filter(s => (s as any).pageSize?.assetId === asset.id)

// Line 172 — image shapes
const imageShapes = selected.filter(s => (s as ImageShape).assetId === asset.id)
```

**Fix:**  
Add a selector in `src/store/selectors.ts`:

```typescript
export function selectShapesUsingAsset(shapes: Shape[], assetId: string): Shape[] {
  return shapes.filter(s => {
    if (s.type === 'image' || s.type === 'pixelimage') return s.assetId === assetId
    if (s.type === 'page') return s.pageSize?.assetId === assetId
    return false
  })
}
```

---

### 3.6 Duplicated guard patterns in `reducer.ts`

**File:** `src/store/reducer.ts`

**Problem:**  
Two pairs of related actions repeat the same guard pattern without sharing code.

**Pattern A** — Power-up null guard, repeated for `REMOVE` and `UPDATE`:

```typescript
// Repeated in both REMOVE_SHAPE_POWER_UP_FEATURE and UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS
if (!shape || !shape.powerUps || shape.powerUps.length === 0) return state
const entry = shape.powerUps.find(p => p.powerUpId === action.powerUpId)
if (!entry) return state
```

**Pattern B** — Iterating all shapes to find image shapes, repeated for `UPDATE_IMAGE_ASSET` and `DELETE_IMAGE_ASSET`:

```typescript
// Both actions do:
Object.entries(doc.shapes).filter(([_, s]) => s.type === 'image')
```

**Fix:** Extract `findShapePowerUpEntry(shape, powerUpId)` and `getImageShapes(doc)` helper functions.

---

## Priority 4 — Low-Hanging Fruit

Small issues that are quick to fix.

---

### 4.1 Mixed null-check patterns

**Files:** Multiple files across `src/`

Three different ways of expressing the same null fallback appear in the same file:

```typescript
gridSettings ?? []        // nullish coalescing
page.guides ?? []         // nullish coalescing  
parentNode ? parentNode.children : doc.rootNodes  // ternary
x || []                   // truthy fallback (different semantics for 0/false)
```

The `||` form has different semantics from `??` when the value could be `0`, `false`, or `""`. Standardize on `??` for "undefined or null" cases.

---

### 4.2 Possible dead code in `selectors.ts`

**File:** `src/store/selectors.ts`, lines 6–8 and 16–19

`selectShape()` and `selectActivePageNode()` have no import sites found in the codebase. If these are genuinely unused, they should be removed. If they're kept as public API for power-ups, they should be documented.

---

### 4.3 Missing return type annotations on exported selectors

**File:** `src/store/selectors.ts`

Exported selector functions rely on TypeScript inference for their return types. While this works, explicit return types serve as documentation and catch the case where a refactor accidentally widens a return type:

```typescript
// Before
export function selectShape(state: AppState, id: string) { ... }

// After
export function selectShape(state: AppState, id: string): Shape | undefined { ... }
```

---

## Recommended Fix Order

| # | Issue | File(s) | Effort | Risk if unfixed |
|---|---|---|---|---|
| 1 | Stale closure in `onPointerMove` | `useCanvasPointer.ts:462` | Small | Drag bugs in drill-in mode |
| 2 | Non-null `containerRef` assertions | `useCanvasPointer.ts:177,382,689` | Small | Crash on unmount during drag |
| 3 | Missing `useMemo` in PropertiesPanel | `PropertiesPanel.tsx:239–248` | Small | Perf on large selections |
| 4 | Inconsistent error handling | `Toolbar.tsx:158,192` | Small | Silent power-up failures |
| 5 | Replace `as` casts with type guards | `reducer.ts` (21 sites) | Medium | Silent data corruption |
| 6 | Cache snap candidates per drag | `useCanvasPointer.ts:426–440` | Medium | Drag jank on large canvases |
| 7 | Idempotent state migration | `reducer.ts:544–551` | Medium | Broken font refs on load |
| 8 | Deduplicate asset-finding logic | `PropertiesPanel.tsx` | Small | Maintenance debt |
| 9 | Deduplicate reducer guards | `reducer.ts` | Small | Maintenance debt |
| 10 | Split `reducer.ts` | `reducer.ts` | Large | Maintenance debt |
| 11 | Split `exportHtml.ts` | `exportHtml.ts` | Large | Maintenance debt |
| 12 | Split `Toolbar.tsx` | `Toolbar.tsx` | Medium | Maintenance debt |
| 13 | Split `useCanvasPointer.ts` | `useCanvasPointer.ts` | Large | Maintenance debt |
| 14 | Standardize null-check patterns | Multiple files | Small | Maintenance debt |
| 15 | Remove/document dead selectors | `selectors.ts` | Trivial | Maintenance debt |
