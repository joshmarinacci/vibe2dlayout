
## 2026-06-22 — Unit tests for shapeMenuGroups

- Added `tests/utils/shapeMenuGroups.test.tsx` with 50 tests covering all four builder functions
- Tests verify group structure, item labels, keyboard shortcuts, dispatch actions, disabled states, and callback invocations

## 2026-06-22 — Consolidate shape/page context menu actions

- Extracted shared `src/utils/shapeMenuGroups.tsx` with four builder functions: `buildAddShapeGroups`, `buildSingleShapeGroups`, `buildPageGroups`, `buildMultiSelectGroups`
- Canvas and tree right-click menus now use identical action sets for shapes and pages (same items, order, labels, and keyboard shortcuts)
- Page right-click in canvas now shows the full page menu (Set Active, Export HTML, Save as Template, reorder, etc.) instead of only the Add shapes submenu
- Unified "Add shapes" submenu structure: separate Containers, Form Controls, and Mockups submenus in both views
- Tree's `addShapeTo` now correctly handles pixelimage type (creates a linked pixel asset)
- Reorder labels standardized to "Move Up / Move Down / Bring to Front / Send to Back" across both views

## 2026-06-20 — Tree section add menus

- Added top-level `+` buttons to the Assets and Library tree headers
- Each header now opens a dropdown menu for creating the section’s item types from one place
- Assets actions include image URL adds, dimension presets, pixel images, custom fonts, gradients, and sketch styles
- Library actions include gradients, image imports, dimension presets, custom fonts, and template creation from the current selection/page

## 2026-06-20 — Fixed-unit gradient sizing

- Gradient fills and strokes now render in fixed SVG user space instead of object-bounding-box space, so rectangular shapes no longer squish the gradient
- Added shared gradient angle bounds/clamping, and negative angles like `-45` now stay valid in the property sheet
- Repeat/mirror gradients keep using the same editor controls, with the span setting controlling how visible the tiling is

## 2026-06-20 — Library gradients in property pickers

- Fill, stroke, and text gradient pickers in the property sheet now show gradients from both the current document and the library
- Added a shared `mergeUniqueById` helper plus a `mergedGradients` wrapper so the doc-first, library-fallback behavior stays consistent

## 2026-06-18 — Fix tree view drag-and-drop reliability

All fixes in `src/components/tree/TreeNode.tsx`:

- **Stale drop zone on drop**: `handleDrop` was reading `dropZone` from React state (which could be stale by the time the drop event fired). Fixed by adding a `dropZoneRef` written synchronously in `handleDragOver`/`handleDragLeave` and read in `handleDrop`. Drops now always land in the correct position.
- **Drop indicator flickering over children**: `onDragOver/onDragLeave/onDrop` were on the inner `.node` div; when the mouse moved into the `.children` sibling div, `dragLeave` fired and cleared the indicator. Moved the three handlers to the outer `.nodeWrapper` div so children are correctly seen as "inside" the drag target.
- **Non-container shapes can't receive children**: `handleDrop` now validates that `zone === 'into'` is only allowed for container shape types (`page`, `frame`, `panel`, `scrollpanel`, `group`, `tabbed-panel`); otherwise demoted to `'after'`.
- **Pages can't be dragged inside other pages**: `handleDrop` rejects the drop entirely when dragging a page onto a non-root-level target (`parentId !== null`). A module-level `draggingPageFlag` (set in `handleDragStart`, cleared in `handleDragEnd`) lets `handleDragOver` suppress the drop indicator and skip `preventDefault` on invalid targets, so the browser shows the "not allowed" cursor rather than a misleading highlight.

## 2026-06-18 — Library template rename and canvas "Save to Library"

- Template rename: double-click on a shape or page template in the Library panel now triggers inline rename (consistent with gradients/images); place/create actions remain in the right-click context menu only
- Canvas context menu: "Save to Library" now appears in the right-click menu on the canvas when a shape is selected, matching the tree view behavior

## 2026-06-18 — Library templates and asset promotion

- **Save shape to library**: right-click any shape in the layer tree → "Save to Library" — captures the shape and all descendants as a reusable `ShapeTemplate`
- **Save page as template**: right-click a page → "Save as Template" — captures the full page subtree as a `PageTemplate`
- **Place shape template**: double-click a shape template in the Library panel → places a fresh copy with new IDs on the active page at (50, 50)
- **Create page from template**: double-click a page template in the Library panel → creates a new page from the template and makes it active
- **Promote document assets to library**: right-click context menus on document Images, Gradients, Fonts, and Dimensions now include "Add to Library"
- Library model bumped from v2 to v3; `normalizeLibrary` in `libraryStorage.ts` populates empty arrays for new fields when loading older libraries
- New library actions: `ADD_LIBRARY_SHAPE_TEMPLATE`, `DELETE_LIBRARY_SHAPE_TEMPLATE`, `ADD_LIBRARY_PAGE_TEMPLATE`, `DELETE_LIBRARY_PAGE_TEMPLATE`
- New document actions (undo-able): `PLACE_SHAPE_TEMPLATE`, `PLACE_PAGE_TEMPLATE`
- Extended `RENAME_LIBRARY_ITEM` and `SELECT_LIBRARY_ITEM` to include `'shape-template'` and `'page-template'` item types

## 2026-06-17 — Collapsible Assets and Library sections in tree panel

- "Assets" and "Library" section headers in the layer tree are now collapsible
- Click the header to toggle; a chevron indicates open/closed state
- Extended `SectionHeader` with optional `collapsible`/`collapsed`/`onToggle` props; non-collapsible usage unchanged

## 2026-06-17 — Page management in layer tree context menu

- Added "Duplicate" to the right-click context menu for page items in the layer tree; duplicated page gets " copy" appended to its name
- Added "Move Up", "Move Down", "Move to Top", "Move to Bottom" to the page context menu for reordering pages
- Both features work on any page, not just slides powerup pages
- Reuses existing `DUPLICATE_SHAPES` and `REORDER_SHAPE` reducer actions

## 2026-06-16 — Limn PNG file format (.limn)

- Added `.limn` file format: a valid PNG (thumbnail of the first page) with the full document JSON embedded in a `tEXt` metadata chunk
- New `src/utils/pngMeta.ts`: pure PNG byte manipulation — `injectTextChunk` and `extractTextChunk` with a hand-rolled CRC32 implementation; no DOM dependencies, fully unit-tested
- New `src/utils/limnFile.ts`: `encodeLimnPng`, `decodeLimnPng`, `downloadLimnFile`, `uploadLimnFile` — encodes JSON as UTF-8 → base64 in the PNG metadata chunk; `decodeLimnPng` runs the full `fromJSON` migration pipeline so older documents are auto-upgraded
- Added `renderPageToBytes` to `src/utils/exportPng.tsx`: renders the active page via html2canvas, scales to fit within 1200px on the longest side, and adds a white border with a small "Limn" label in the corner; throws (rather than alerting) when the page has no fixed size
- Added "Save as Limn..." and "Open Limn..." to the File menu in `Toolbar.tsx` (web build)
- Added `menu:save-limn` and `menu:open-limn` event handlers in `useTauriMenu.ts` (Tauri build)
- Added `tauriSaveLimnFile`, `tauriSaveAsLimnFile`, `tauriOpenLimnFile` to `tauriStorage.ts`
- Document `version` field (currently 4) is preserved in the embedded JSON; existing migration logic handles upgrading any older `.limn` file automatically on open
- 14 new unit tests: 8 in `tests/utils/pngMeta.test.ts` (chunk injection/extraction, CRC, chunk ordering, unicode, large values) and 6 in `tests/utils/limnFile.test.ts` (round-trip, v3→v4 migration, error cases, unicode preservation)

## 2026-06-15 — Client-side logging console

- Added a shared client-side logging layer on top of `debug`, with typed log records, structured payload support, and subsystem namespaces for renderer, importer, exporter, and power-ups
- Added a docked logging console that opens from the View menu and native Tauri menu, with level filters, subsystem filters, incremental search, copy/clear controls, and expandable JSON payloads
- The console now resizes vertically via a drag handle above the panel, and the log list scrolls instead of compressing entries when space is tight
- Instrumented representative renderer, import/export, menu, and power-up paths to emit structured logs into the new console

## 2026-06-15 — Page dimensions with presets, assets, and custom sizes

- Page settings now support a unified size picker with built-in presets, document `Dimension` assets, library `Dimension` assets, and custom width/height entry
- Added reusable `Dimension` creation dialog in both the document assets and library sections so both flows look and behave the same
- Document and library dimension assets can be selected directly in the page properties panel, and the page resolves to a concrete size for export/layout
- Legacy documents upgrade old fixed-size pages to custom page sizes automatically when loaded

## 2026-06-14 — Physics HTML export

New **Powerups → Export Physics HTML...** menu item (web + Tauri) exports a self-contained `.html` file that runs a live Matter.js physics simulation in any browser.

- The exported page embeds all shapes from the active page as absolutely-positioned divs with their fill/stroke/border-radius styles
- Only shapes with physics bodies assigned participate in the simulation; others appear as static visuals
- Uses the document's gravity (X/Y) and solver iteration settings, 100px boundary walls around the page, and the same dt-clamped RAF loop as the in-app runtime
- Users can drag shapes with the mouse (Matter.js `MouseConstraint`) and use Pause/Resume/Reset controls
- Loads Matter.js 0.20.0 from unpkg CDN (requires internet to open)
- New `src/utils/exportPhysicsHtml.ts` reuses `fillBackground`, `strokeColor`, and `getAllIds` utilities

## 2026-06-13 — Mobile support (pinch-to-zoom, responsive toolbar, panel auto-collapse)

- **Pinch-to-zoom + two-finger pan**: new `usePinchGestures` hook attaches native pointer listeners to the canvas, tracks two active pointers, and dispatches `ZOOM_TO` / `PAN_BY` with the touch centroid as zoom origin. Uses `queueMicrotask` to defer flag clearing so React's synthetic handlers don't accidentally commit a drag after a pinch ends.
- **useCanvasPointer**: accepts optional `multiTouchActiveRef`; all three pointer handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) bail out while multi-touch is active to avoid conflating pinch with selection/drag.
- **`touch-action: none`** added to the canvas element so iOS/Android don't intercept touch events for native scroll/zoom.
- **Toolbar responsive collapse**: at ≤640px, the File/Edit/View/Powerups menu bar and document name are hidden via CSS media query; toolbar gets `overflow-x: auto` as a fallback.
- **Panel auto-collapse**: panels start hidden on viewports narrower than 768px; `max-width: 100%` prevents them from overflowing the screen edge when resized.

## 2026-06-13 — Side panels as translucent canvas overlays

- Canvas now spans the full browser width; the layer and properties panels float above it as translucent overlays
- Panels use `backdrop-filter: blur` and a semi-transparent version of the panel background color
- Panel opacity is configurable via Settings → Panels → "Side panel opacity" slider (10–100%, default 92%)
- Panel visibility state moved from local component state into Redux (`leftPanelVisible` / `rightPanelVisible`)
- View menu gains "Show/Hide Layer Panel" and "Show/Hide Properties Panel" items (web and Tauri)
- Status bar toggle buttons continue to work unchanged
- Panels remain resizable (150–500 px) via drag handles at their inner edges

## 2026-06-13 — Split menu bar into File, Edit, View, Powerups

- Replaced the single "File" dropdown with four top-level menus: **File**, **Edit**, **View**, and **Powerups**
- **File**: New, Open, Save, Save As, Import/Export JSON/PNG/PDF, About
- **Edit**: Undo, Redo, Edit Palettes, Edit Themes, Settings, Document Settings
- **View**: Show/Hide Grid, Enable/Disable Snap, Dark/Light Mode toggle
- **Powerups**: Add/Remove powerups from document, Power Up Actions
- Removed the nested Power Ups submenu; Powerups is now a peer menu in the bar

## 2026-06-10 — Fix post-SVG-migration bugs

- **Solid border on rect/circle**: `svgStroke` was applying `strokeDasharray` whenever the `dash` array was non-empty, but the CSS code only did so when `stroke.type === 'dashed'`. The default stroke has `type:'solid'` with `dash:[5,3]` (stored for when the user switches to dashed), so the fix is to guard: `stroke.type === 'dashed' && dash.length > 0`.
- **Text not multiline**: `position:absolute; inset:0` inside `<foreignObject>` doesn't reliably constrain width for text wrapping in all browsers. Fixed by using explicit `width:${w}px; height:${h}px; box-sizing:border-box` on the root div and textarea inside the foreignObject.
- **Variable font axes (Honk etc.)**: Added `transform: translateZ(0)` to the text display div when `fontVariationSettings` is present — this forces the browser to create a new GPU compositing layer and re-evaluate font axes, working around a known Chromium bug where `font-variation-settings` inside SVG `<foreignObject>` can become stale.
- **ImageShape missing CSS rotation**: `transform: buildCSSTransform(transform)` was missing from the outer `<svg>` element, so rotated/scaled images weren't rotated visually.
- **ImageShape clipping**: Replaced `<clipPath>` with a nested `<svg x=0 y=0 width={w} height={h} overflow="hidden">` which is simpler and correctly clips the image (including when crop is set) to the shape bounds.

## 2026-06-10 — Migrate core shapes to SVG rendering

Replaced DOM `<div>` rendering with SVG elements for all core primitive shapes:

**New utility files (`src/utils/`):**
- `fillSVG.tsx` — converts `FillStyle` to SVG `fill` attribute + inline `<linearGradient>`, `<radialGradient>`, or `<pattern>` defs
- `strokeStyleSVG.tsx` — converts `StrokeStyle` to SVG `stroke` attributes + optional gradient defs; includes `cornerRadiiPath()` for per-corner SVG path
- `shadowSVG.tsx` — converts `BoxShadow[]` to an SVG `<filter>` element using `<feDropShadow>`, `<feGaussianBlur>`, and `<feMerge>` for multiple/inset shadows
- `svgTransform.ts` — converts `BoundingBox` rotation/scale/skew to an SVG `transform` attribute string

**Shape changes:**
- `RectShape.tsx` — DOM container div + SVG visual layer (`<rect>` or `<path>` for per-corner radii); eliminates the webkit-mask gradient stroke hack
- `CircleShape.tsx` — DOM container div + SVG `<ellipse>` visual layer
- `TextShape.tsx` — pure SVG island (`<svg>` with background `<rect>` + `<foreignObject>` containing textarea in edit mode and styled div in display mode)
- `ImageShape.tsx` — pure SVG island using `<image>` + `<clipPath>` for cropping
- `GroupShape.tsx` — DOM container div + SVG visual layer for dashed selection border and optional shadow
- `PageShape.tsx` — DOM container div + SVG visual layer with native `<feDropShadow>` filter

Form/mockup shapes (button, dialog, table, etc.) are unchanged.

## 2026-06-09 13:40 — Move ImageMock and ChartMock to Forms powerup

- Added `'mockups'` as a valid category to `PowerUpShapeTypeDefinition`.
- Added `imagemock` and `chartmock` shape type definitions to `formsBuiltIn.tsx` (`category: 'mockups'`), including `createDefault` factories and `renderShape` implementations.
- Removed hardcoded `imagemock`/`chartmock` cases from `ShapeRenderer.tsx`, `shapeFactory.ts`, and `PropertiesPanel.tsx`; they now go through the registry fallthrough.
- All three context menus (`CanvasContextMenu`, `TreeNode`, `TreePanel`) now drive their "Mockups" section from the registry; the section is hidden when the Forms powerup is inactive.

## 2026-06-09 12:30 — Context menus gated by Forms powerup

- `CanvasContextMenu.tsx`: removed hardcoded `CONTAINER_TYPES`/`FORM_CONTROLS` arrays; "Forms" submenu (containers + form controls + mockups) now only appears when forms shapes are registered; falls back to just "Mockups" when powerup is inactive.
- `TreeNode.tsx`: same — "Containers" and "Form Controls" context menu submenus are conditionally rendered from registry.
- `TreePanel.tsx`: same — Containers and Form Controls sections in the "+" add menu are hidden when powerup is inactive.

## 2026-06-09 — Move forms to a powerup

- Added `PowerUpShapeTypeDefinition` interface to `src/powerups/types.ts` with `createDefault`, `renderShape`, `renderProperties`, category, and behavior flags (`isTextEditable`, `isDrillable`).
- Created `src/powerups/shapeRegistry.ts`: a runtime registry that powerups write to on load/unload, with a `useShapeRegistry()` React hook for reactive updates.
- Created `src/powerups/formsBuiltIn.tsx`: defines all 18 form shape types (buttons, checkboxes, panels, sliders, etc.) as a "Forms" powerup.
- Added "Forms" stub entry to `BUILT_IN_POWER_UPS` in `builtIns.tsx` using a dynamic import in its lifecycle hooks to avoid a circular dependency (CollapsibleSection → @store/context → reducer → registry → builtIns → formsBuiltIn).
- `ShapeRenderer.tsx`: removed hardcoded form shape cases and imports; added registry fallthrough in the `default` case; updated `TEXT_EDITABLE`/`DRILLABLE` sets to check registry for form shape behaviors.
- `Toolbar.tsx`: removed hardcoded `FORM_CONTROLS`/`CONTAINER_CONTROLS` arrays; Components dropdown now reads from `useShapeRegistry()` and is hidden entirely when no forms powerup is active.
- `store/types.ts`: widened `ToolMode` to accept `string & {}` for powerup-registered tool modes.
- `useCanvasPointer.ts`: replaced static `TOOL_SHAPE` map with `getToolShapeType()` that merges core modes with registry entries.
- `shapeFactory.ts`: added registry fallthrough in `createShape()`.
- `PropertiesPanel.tsx`: removed all form shape cases from the switch; added registry fallthrough in `default` case; secondary fills (`thumbFill`, `progressFill`) handled inline.
- `tests/setup.ts`: registers form shapes via dynamic import in `beforeAll` to avoid circular in test environment.

## 2026-05-29 — Gradient detail panel; library and CSS refinements

- Clicking a document gradient in the Assets tree now selects it and shows an editable detail panel in the properties sheet: name, gradient preview strip, interactive stop bar (drag to reposition, click to add, drag down to delete), per-stop color picker and position input, and Delete Gradient button. Added `selectedGradientId` state and `SELECT_GRADIENT` action.
- Fixed properties panel not clearing when switching from a library item to a document shape selection.
- Library fonts now run the same variable-axis metadata detection as document fonts (`useLibraryFontMetadataEnrichment`); the library font properties panel shows Name, Type, and Variable Axes matching the document font panel, plus Add to Document and Delete from Library buttons.
- Added `UPDATE_LIBRARY_FONT` action so detected font metadata is persisted in the library.
- Consolidated library types: `LibraryGradient` → `GradientDef`, `LibraryImage` → `ImageAsset`, `LibraryFont` → `CustomFont` (no separate library-only types). Added `id` field to `CustomFont`; serialization migration adds a UUID to existing documents without one.
- Added `--color-selected` CSS variable (light: `#dbeafe`, dark: `#1e3554`) to complement `--color-selected-hover`; tree rows use `--color-selected` for selected state.
- `NumberInput` Shift+arrow now increments by `step × 10`, matching wheel behaviour.

## 2026-05-29 — Cross-document Library

Added a global, persistent Library feature — a store of reusable assets (gradients, images, Google Fonts) that lives outside any single document and survives across sessions.

**New files:**
- `src/model/library.ts` — `Library`, `LibraryGradient`, `LibraryImage`, `LibraryFont` types
- `src/utils/libraryStorage.ts` — `loadLibrary`/`saveLibrary` with localStorage (web) and `appDataDir` (Tauri)
- `src/components/tree/LibrarySection.tsx` — tree panel section with collapsible Gradients / Images / Fonts subsections, context menus, inline rename, file picker
- `src/components/tree/LibrarySection.module.css`
- `src/components/properties/sections/LibraryItemSection.tsx` — properties panel for selected library items

**Modified files:**
- `src/store/types.ts` — added `LibraryAction`, `AppState.library/selectedLibraryItemId/selectedLibraryItemType`
- `src/store/reducer.ts` — library action handlers with auto-save; initialState extended
- `src/store/context.tsx` — loads library from storage on app mount
- `src/components/tree/TreePanel.tsx` — renders LibrarySection below Assets
- `src/components/properties/PropertiesPanel.tsx` — shows LibraryItemSection when library item selected
- `src/components/properties/PropertiesPanel.module.css` — added `.textInput` and `.danger` classes
- `src/index.css` — added `--color-selected` variable (light: `#dbeafe`, dark: `#1e3554`)
- `src/components/tree/StyleRow.module.css`, `DocumentRow.module.css` — use `--color-selected` instead of `--color-accent-subtle`

## 2026-05-28 — New app icon for Limn

Created `app-icon.svg`: a calligraphic "L" in warm cream (`#e8dfc8`) on a deep indigo rounded square (`#1c1b38`). Generated all required platform icon sizes via `npx tauri icon app-icon.svg`, replacing all files in `src-tauri/icons/`.

## 2026-05-28 — Rename app to Limn

Renamed the application from "Vibe 2D Layout" to "Limn" across all config and source files: `package.json`, `tauri.conf.json`, `Cargo.toml`, `index.html`, `Toolbar.tsx` (About modal), and `README.md`. The `.vibe2d` file extension and `vibe2d:` localStorage keys are unchanged to preserve compatibility with existing saved documents.

## 2026-05-28 — Fix multi-select transform inputs (arrow keys + scroll wheel)

The X/Y/W/H inputs shown when multiple shapes are selected were raw `<input type="number">` elements with no arrow key or scroll wheel support. Fixed by:
- Exporting `TField` from `TransformSection.tsx` and widening its `value` type to `number | null` (to handle mixed values across selected shapes)
- Replacing the raw inputs in `PropertiesPanel.tsx` multi-select path with `TField`

All numeric inputs in the properties panel now consistently support arrow keys and scroll wheel.

- `src/components/properties/sections/TransformSection.tsx` — export `TField`, accept `value: number | null`
- `src/components/properties/PropertiesPanel.tsx` — use `TField` for multi-select transform

## 2026-05-28 — Add edit actions to Tauri native menu

Duplicate (⌘D), Group (⌘G), Ungroup (⌘⇧G), Bring Forward (⌘]), Send Backward (⌘[), and Delete now appear in the native Edit menu in Tauri. Handlers in `useTauriMenu.ts` read the current selection via `stateRef` and dispatch the same actions as the keyboard shortcuts, also firing the shortcut indicator.

- `src-tauri/src/lib.rs` — new `MenuItem` entries in the Edit submenu
- `src/hooks/useTauriMenu.ts` — event listeners for `menu:duplicate`, `menu:group`, `menu:ungroup`, `menu:bring-forward`, `menu:send-backward`, `menu:delete`

## 2026-05-28 — Keyboard shortcut display and floating indicator

### Shortcut hints in menus
- Shortcut labels now appear right-aligned in the canvas context menu (Duplicate ⌘D, Group ⌘G, Ungroup ⌘⇧G, Move Up ⌘], Move Down ⌘[, Delete ⌫)
- Web-mode File toolbar dropdown now shows shortcut hints for New ⌘N, Open ⌘O, Save ⌘S, Save As ⌘⇧S
- Tauri native menu bar already showed accelerators natively — no changes needed there

### Floating shortcut indicator
- New `ShortcutIndicator` component renders a pill-shaped overlay near the bottom of the canvas when any keyboard shortcut fires, showing the key combo and action name, then fades out after ~2.5 seconds
- Can be toggled on/off in Settings → Shortcuts → "Show shortcut indicator" (default: on)

### Shared shortcut definitions
- New `src/utils/shortcutDefs.ts` — single source of truth for all shortcut labels; `ShortcutsModal` now imports from here
- New `src/utils/shortcutEvents.ts` — lightweight pub/sub bus wiring `useDocumentShortcuts` to `ShortcutIndicator` without touching AppState

### Files changed
- `src/utils/shortcutDefs.ts` — new
- `src/utils/shortcutEvents.ts` — new
- `src/components/layout/ShortcutIndicator.tsx` — new
- `src/components/layout/ShortcutIndicator.module.css` — new
- `src/hooks/useDocumentShortcuts.ts` — emit events after each shortcut
- `src/components/tree/ContextMenu.tsx` — `shortcut?` field on `ContextMenuItem`
- `src/components/tree/ContextMenu.module.css` — `.shortcut` style
- `src/components/canvas/CanvasContextMenu.tsx` — shortcut labels on 6 items
- `src/components/toolbar/Toolbar.tsx` — shortcut hints in web File menu
- `src/components/toolbar/Toolbar.module.css` — `.menuShortcut` style
- `src/components/layout/AppShell.tsx` — mounts `<ShortcutIndicator/>`
- `src/components/layout/ShortcutsModal.tsx` — imports from `shortcutDefs`
- `src/store/types.ts` — `showShortcutIndicator` in `UserSettings`
- `src/components/layout/SettingsModal.tsx` — settings toggle checkbox

## 2026-05-27 — Image support improvements

### Drag-to-add images
Drop image files (PNG, JPEG, GIF, WebP, SVG) directly onto the canvas. Works in the browser via the HTML5 File API and in Tauri via the `tauri://drag-drop` event + `@tauri-apps/plugin-fs`. Multiple files dropped at once each create their own image shape and asset centred at the drop position, scaled to fit within 400 × 400 px.
- New `src/components/canvas/useCanvasDrop.ts`
- `src/components/canvas/CanvasView.tsx` — wires `onDragOver`/`onDrop`; Tauri listener registered on mount
- `src-tauri/capabilities/default.json` — added `fs:allow-read-file`

### Image format in asset panel
The Source section of the image asset property panel now shows a **Format** row (PNG, JPEG, GIF, WebP, SVG) for both embedded and URL images.
- `src/components/properties/sections/ImageAssetSection.tsx`

### Interactive crop
Select an image shape with content and click **Crop** / **Edit Crop** (prop panel or right-click menu) to enter crop mode. A full-screen overlay shows 8 drag handles, a solid crop border, a dashed boundary showing the full image extent, and dark masks outside the crop region. Drag handles to adjust; click **Done** to apply, **Reset** to clear the crop, **Cancel** or Escape to abort.
- Applying the crop resizes the shape bounds to the selected region and composes the absolute image crop fraction so repeated crops narrow correctly into the already-cropped area.
- Locked images cannot enter crop mode.
- New `src/components/canvas/CropOverlay.tsx`
- `src/model/shapes.ts` — added `ImageCrop` type and `crop?` field to `ImageShape`
- `src/store/types.ts` — added `croppingShapeId` to `AppState`; added `ENTER_CROP_MODE` / `EXIT_CROP_MODE` to `ViewAction`
- `src/store/reducer.ts` — handles new actions; adds `croppingShapeId: null` to initial state
- `src/components/canvas/shapes/ImageShape.tsx` — renders crop via CSS `position: absolute` / percentage offsets
- `src/components/canvas/CanvasView.tsx` — renders `<CropOverlay>` when cropping
- `src/components/properties/sections/ImageSection.tsx` — Crop / Edit Crop button
- `src/components/canvas/CanvasContextMenu.tsx` — Crop / Edit Crop context menu item

### Actual Size action
When a linked asset has known pixel dimensions an **Actual Size (W × H)** button appears in the Image prop panel and as a context menu item. Both account for any active crop, so the reported and applied size reflects the cropped region, not the full image.
- `src/components/properties/sections/ImageSection.tsx`
- `src/components/properties/PropertiesPanel.tsx` — passes linked asset to `ImageSection`
- `src/components/canvas/CanvasContextMenu.tsx`

### Shift-resize snaps to image aspect ratio
Holding Shift while resizing an image shape constrains to the image's natural aspect ratio (accounting for any crop) instead of 1:1.
- `src/components/canvas/SelectionOverlay.tsx`

## 2026-05-18 — Version info in About menu; hide inline file menu in Tauri

- **`vite.config.ts`**: Injects `__APP_VERSION__` (from `package.json`) and `__BUILD_TIME__` (ISO timestamp at build time) as Vite `define` constants available in all frontend code.
- **`src/vite-env.d.ts`**: Added `declare const` for `__APP_VERSION__` and `__BUILD_TIME__`.
- **`src-tauri/build.rs`**: Emits `BUILD_TIME` env var at Rust compile time using Hinnant's civil-date algorithm — no external crates needed.
- **`src-tauri/src/lib.rs`**: Passes `AboutMetadata` (version + build timestamp) to the native macOS About dialog.
- **`src/components/toolbar/Toolbar.tsx`**: Inline File menu is hidden in Tauri mode (native menu bar handles all file operations). Web mode gets an "About…" item at the bottom of the File menu that shows a modal with version and build time.

## 2026-05-18 — Quality of life improvements (round 2)

- **`src/components/layout/StatusBar.tsx`**: Now shows `W × H  at  (X, Y)` next to the shape name when one or more shapes are selected, using `computeBoundingBox` from `SelectionOverlay`.
- **`src/components/properties/sections/TransformSection.tsx`**: Transform panel `TField` inputs now support mouse wheel to increment/decrement, matching `NumberInput` behavior.
- **`src/hooks/useDocumentShortcuts.ts`**: Added Cmd+0 to reset the view.
- **`src/components/layout/ShortcutsModal.tsx`**: Added Cmd+0 and F2 to the shortcuts cheat sheet.
- **`src/components/properties/IconPickerDialog.tsx`**: Active icon now scrolls into view when the picker is opened.
- **`src/components/tree/TreeNode.tsx`**: F2 now starts inline rename for the selected layer, matching standard OS rename behavior.
- **`src/components/properties/inputs/NumberInput.tsx`**: Shift+wheel now jumps by 10× step. Also fixed macOS behavior where holding Shift converts vertical scroll to horizontal (deltaY=0, deltaX non-zero) by falling back to deltaX.
- **`src/components/properties/sections/TransformSection.tsx`**: Same Shift+wheel and macOS deltaX fixes applied to Transform panel inputs.

## 2026-05-18 — Quality of life improvements

- **`src/components/toolbar/Toolbar.tsx`**: Removed duplicate divider in the File menu.
- **`src/components/layout/ShortcutsModal.tsx`**: Added Cmd+S, Cmd+G, Cmd+Shift+G, Cmd+], and Cmd+[ to the shortcuts cheat sheet.
- **`src/components/properties/sections/TransformSection.tsx`**: Shift+Arrow now nudges by 10 in the Transform panel inputs, matching canvas behavior.
- **`src/hooks/useDocumentShortcuts.ts`**: Added Cmd+G (group), Cmd+Shift+G (ungroup), Cmd+] (bring forward), Cmd+[ (send backward) keyboard shortcuts.

## 2026-05-17 — Drag gradient stops past each other to reorder

- **`src/utils/fillCSS.ts`**: `gradientCSS` now sorts stops by position before generating CSS, so out-of-order stops (from mid-drag crossing) always render correctly.
- **`src/components/properties/sections/GradientStopBar.tsx`**: Added optional `onDragEnd` prop; fires on mouseup when a stop is released without being deleted. Lets the parent re-sort the data model after drag completes.
- **`src/components/layout/GradientEditorModal.tsx`**: Added `handleDragEnd` — sorts stops by position, then updates `selectedStopIdx` to track the moved stop in its new sorted position. Also replaced the local `previewCSS` with `gradientCSS` from fillCSS so list swatches benefit from the same sort.

## 2026-05-17 — Gradient stop bar editor in dialog

- **`src/components/properties/sections/GradientStopBar.tsx`** (new): Visual gradient bar with draggable triangular handles. Click the bar to add a stop (color interpolated from surrounding stops); click a handle to select it; drag to reposition; drag far off the bar (>40px) to delete (min 2 stops enforced).
- **`src/components/properties/sections/GradientStopBar.module.css`** (new): Styles for the bar and handle triangles with selected/hover states.
- **`src/components/layout/GradientEditorModal.tsx`**: Replaced per-stop slider rows + static preview bar with the new `GradientStopBar`. Stop details (color picker + position input) now appear below the bar for the selected stop. Added `interpolateHex` helper for color blending when inserting new stops.
- **`src/components/layout/GradientEditorModal.module.css`**: Added `.stopDetails` flex row style.
- **`src/components/properties/sections/FillSection.tsx`**: Gradient tab reverted to the simple preset-picker layout — stop editing lives entirely in the dialog.

## 2026-05-14 — Mouse wheel increment/decrement on NumberInput

- **`src/components/properties/inputs/NumberInput.tsx`**: Scrolling the mouse wheel while a numeric input is focused now increments/decrements by `step` (same as ArrowUp/Down). Uses a native non-passive `wheel` event listener (mounted once via `useEffect`) so `preventDefault()` actually stops the properties panel from scrolling. A `wheelStateRef` keeps the handler reading current `localText`, `step`, `min`, `max`, and `onChange` without stale closures.

## 2026-05-14 — Fix emoji insertion in ContentSection controlled textarea

- **`src/components/canvas/shapes/useEmojiCompletion.ts`**: Added optional `onValueChange(newValue, newCursorPos)` parameter. When provided, all insertion paths (Enter/Tab keyboard, mouse click, auto-replace on closing `:`) call this callback instead of DOM mutation + synthetic `input` event. DOM mutation is unreliable for React controlled textareas because React may reconcile the `value` prop back before the store update commits.
- **`src/components/properties/sections/ContentSection.tsx`**: Passes an `onValueChange` callback to `useEmojiCompletion` that dispatches `COMMIT_TEXT_EDIT` directly and uses `requestAnimationFrame` to restore the cursor position after React reconciles the controlled textarea.

## 2026-05-14 — Emoji insertion via colon codes

- **`src/utils/emojiData.ts`** (new): ~300 emoji entries as `[name, char]` tuples covering smileys, gestures, hearts, animals, food, travel, objects, and symbols. `searchEmojis(query)` returns prefix matches first (sorted shortest-name-first), then contains matches.
- **`src/components/canvas/shapes/useEmojiCompletion.ts`** (new): Hook that detects `:query` patterns in a textarea as the user types, manages completion state, handles keyboard navigation (ArrowUp/Down selects, Enter/Tab inserts, Escape closes without cancelling the edit), and auto-replaces when a closing `:` completes a known name (e.g. `:fire:`). `insertEmoji` directly mutates the uncontrolled textarea value and fires a synthetic `input` event so React stays in sync.
- **`src/components/canvas/shapes/EmojiCompletionPopup.tsx`** (new): `createPortal`-based popup rendered at `position:fixed` to escape canvas transforms and `overflow:hidden`. Positioned below the textarea with viewport clamping and above-flip fallback. Mouse-hover updates selection; `onMouseDown` inserts without blurring the textarea.
- **`src/components/canvas/shapes/useTextEdit.ts`**: Integrates `useEmojiCompletion`; routes `onKeyDown` through emoji completion first; closes popup on edit start/end transitions.
- **TextShape, LabelShape, StickyNoteShape, ButtonShape**: Render `<EmojiCompletionPopup>` in the editing branch.
- **`src/components/properties/sections/ContentSection.tsx`**: Added ref + `useEmojiCompletion` + popup for the property panel content textarea.
- **`tests/utils/emojiData.test.ts`** (new): 9 unit tests for `searchEmojis`.

## 2026-05-14 — Fix text shadow rendering on top of gradient text

- **`src/utils/textStyleCSS.ts`**: CSS paints `text-shadow` after `background` (including `background-clip:text`), so an inherited shadow lands on top of the gradient. Fix: `textExtraCSS` now skips `textShadow` when a gradient is active; `textGradientSpanCSS` accepts `textShadow` and applies it as `filter: drop-shadow(...)` instead — which runs after compositing so the shadow correctly appears behind the gradient text. Also cancels the inherited `textShadow` on the span to prevent double-shadow if the parent still emits it.

## 2026-05-14 — Fix Chrome background-clip:text stale-cache bug

- **`src/utils/textStyleCSS.ts`**: Added `textGradientKey(text)` helper that returns a string derived from the gradient CSS. Used as a React `key` prop to force span remount when gradient changes, working around the Chrome bug where `background-clip: text` is not re-applied when React only patches the `background` style property.
- **`src/components/canvas/shapes/TextShape.tsx`**, **`LabelShape.tsx`**, **`StickyNoteShape.tsx`**, **`PanelShape.tsx`**, **`TextFieldShape.tsx`**, **`ButtonShape.tsx`**: All gradient spans now use `key={textGradientKey(text)}` so Chrome remounts the element and correctly re-applies the clip whenever the gradient stops or angle changes.

## 2026-05-14 — Gradient text color and stroke

### Add gradient options to Text shape color and stroke

- **`src/model/shapes.ts`**: Added `textStrokeGradient?: GradientFill | null` to `TextStyle`, alongside the existing `textGradient` field.
- **`src/utils/textStyleCSS.ts`**: `textGradientSpanCSS` now handles both fill gradient and stroke gradient. Stroke gradient uses CSS `paint-order: stroke fill` + `background-clip: text` + transparent text fill to show the gradient through the stroke outline. `textStrokeCSS` skips solid stroke output when `textStrokeGradient` is active.
- **`src/components/properties/sections/TextSection.tsx`**: Replaced the plain `ColorInput` in the Color section with a two-tab panel (Color | Gradient), and replaced the stroke color row with the same two-tab pattern. Both gradient pickers reuse `GradientPicker` and `TabbedPanel` components from `TabbedPanel.tsx`. Width input stays outside the tabs.
- **`src/utils/exportHtml.ts`**: `textContentHtml` now wraps text in a gradient span for both fill gradient and stroke gradient cases, matching canvas rendering fidelity.

## 2026-05-14 — Gradient stroke support

### Add gradient stroke type to StrokeStyle

- **`src/model/shapes.ts`**: Replaced flat `StrokeStyle` interface with a discriminated union `ColorStroke | GradientStroke | SketchStroke`, mirroring the existing `FillStyle` pattern. Added `strokeColor(stroke)` helper to extract a representative color from any stroke variant.
- **`src/utils/strokeStyleCSS.ts`**: Updated `strokeBorderCSS` to handle all three stroke variants. Gradient strokes set a transparent CSS border (to reserve layout space) and rely on an SVG overlay for the visual.
- **`src/components/canvas/shapes/RectShape.tsx`**: Added `GradientStrokeSVG` component that renders an absolutely-positioned SVG with a `<linearGradient>` or `<radialGradient>` definition and a stroked `<rect>` with corner radius support — rendered when `stroke.type === 'gradient'`.
- **`src/components/properties/TabbedPanel.tsx`** (new): Extracted `TabbedPanel`, `TabbedPanelTabs`, `TabbedPanelTab`, `TabbedPanelContent`, and `GradientPicker` from `FillSection.tsx` into a shared file.
- **`src/components/properties/sections/FillSection.tsx`**: Updated to import tab components from the new shared `TabbedPanel.tsx`.
- **`src/components/properties/sections/StrokeSection.tsx`**: Rewritten with three-tab structure (Color / Gradient / Sketch), matching the FillSection pattern. Color tab has dash style selector (None/Solid/Dashed/Dotted) and opacity. Gradient tab reuses document-level gradients with type and angle controls. Sketch tab has color picker.
- All shape components and `exportHtml.ts` updated to use `strokeColor(stroke)` helper instead of direct `stroke.color` access.

## 2026-05-14

### Include custom/Google Fonts in HTML export

- `src/utils/exportHtml.ts`: `buildFontImports` now looks up each used font family in `doc.customFonts` and calls `buildGoogleFontHref()` to generate the correct `@import` URL — including full variable-font axis ranges. Previously, custom fonts were incorrectly excluded from the import.

### Fix text shape default fill opacity

- `src/utils/shapeFactory.ts`: new text shapes now default to `fill.opacity: 1` instead of `0`. The background colour stays `transparent`, but `opacity` applies to the entire shape element — setting it to 0 was hiding the text content as well.



### Export HTML from page tree context menu

- **`src/components/tree/TreeNode.tsx`**: Added "Export HTML…" item to the right-click context menu on page nodes in the tree view. The item is disabled when the page has no fixed size; otherwise it exports that specific page (not necessarily the active one) directly to a `.html` file.

### Export page as self-contained HTML

- **`src/utils/exportHtml.ts`** (new): Pure TypeScript HTML string generator that walks the shape tree and emits inline-styled HTML for every shape type — rect, circle, text, image, line (SVG), group, frame, panel, tabbed-panel, button, icon, label, textfield, checkbox, toggle, radio, select, slider, progress, stepper, stickynote, list, table, dialog, scrollpanel, imagemock, chartmock, pixelimage. Fills (color, gradient, sketch), strokes, box shadows, CSS transforms (rotation/scale/skew), and all text style properties — including variable font axes (`font-variation-settings`), text gradients, text shadows, and text stroke — are faithfully reproduced as inline CSS. Font families are auto-imported from Google Fonts. Pixel assets render as embedded SVG data URIs. The exported file is fully self-contained and downloads via Blob URL.
- **`src/hooks/useTauriMenu.ts`**: Added `menu:export-html` listener that calls `exportPageAsHtml()`.
- **`src-tauri/src/lib.rs`**: Added "Export HTML..." menu item to the File menu.
- **`tests/utils/exportHtml.test.ts`** (new): 57 Vitest unit tests covering RectShape (fill types, corner radii, box shadow, stroke, transform), CircleShape, TextShape (all text properties including variable fonts, text gradient, text shadow, text stroke), ImageShape, LineShape (SVG output, arrows, dash), GroupShape with children, and `generatePageHtml` structure.



### Prevent browser text selection when dragging shapes

- Added `user-select: none` to `.shape` in `Shape.module.css` so text inside shapes can't be selected during mouse drag interactions

### Text stroke rendering and property editor

- Added `textStrokeCSS()` utility in `src/utils/textStyleCSS.ts` — converts `TextStrokeStyle` to `WebkitTextStroke` CSS
- Updated `TextShape.tsx` to spread stroke CSS into the display-mode text style (not applied to textarea edit mode, where `-webkit-text-stroke` is unsupported)
- Added collapsible **Stroke** section to `TextSection.tsx` with a toggle checkbox, color picker, and width number input

## 2026-05-11

### Tauri native file I/O; web localStorage unchanged

- **`src/utils/tauriStorage.ts`** (new): Tauri-specific file helpers — `tauriOpenFile()`, `tauriSaveFile()`, `tauriSaveAsFile()` — using `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` with dynamic imports so they never run in a browser bundle.
- **`src/store/types.ts` / `reducer.ts`**: added `currentFilePath: string | null` to `AppState` and a `SET_FILE_PATH` action to track the open file path in Tauri mode.
- **`src/hooks/useTauriMenu.ts`**: replaced localStorage save/load handlers with native file I/O. `menu:open` → file open dialog, `menu:save` → write in-place (or Save As if no path yet), `menu:save-as` → save dialog. Removed `menu:import-json` and `menu:export-json` listeners.
- **`src-tauri/src/lib.rs`**: registered `tauri_plugin_dialog` and `tauri_plugin_fs`; removed Import JSON and Export JSON from the native File menu.
- **`src-tauri/capabilities/default.json`**: added `dialog:default`, `fs:default`, `fs:allow-read-text-file`, `fs:allow-write-text-file` permissions.
- **`src-tauri/Cargo.toml`**: added `tauri-plugin-dialog = "2"` and `tauri-plugin-fs = "2"` dependencies.
- **`src/components/toolbar/Toolbar.tsx`**: Import/Export JSON toolbar items hidden in Tauri mode (`IS_TAURI` guard); Open/Save/Save As toolbar handlers no-op in Tauri (native menu is the entry point).
- **`src/hooks/useDocumentShortcuts.ts`**: Cmd+S localStorage save guarded to web-only; Tauri handles it via the native menu accelerator.

## 2026-05-08

### Gradient editor improvements

- **`GradientDef` simplified**: removed `gradientType` and `angle` — the def now stores only a named stop collection (`id`, `name`, `stops[]`). Type and angle are per-shape settings in the fill picker.
- **`FillSection` gradient tab**: added Type (linear/radial/conic) and Angle controls that write directly to the shape's `GradientFill`. Selecting a document gradient only swaps the stops, leaving type/angle untouched.
- **Custom gradient swatch picker**: replaced the plain `<select>` for the stops dropdown with a custom `GradientPicker` component that renders a live gradient swatch next to each name in both the trigger and the dropdown.
- **Stop delete buttons always visible**: fixed `GradientEditorModal` CSS — stop-row delete buttons now have `opacity: 1` (previously hidden because they only revealed on `.row:hover` which didn't apply to `.stopRow`).
- **Gradient-to-shape sync**: `UPDATE_GRADIENT` now calls `applyGradientToShapes` in the reducer, propagating updated stops to every shape whose `GradientFill.gradientId` matches — same pattern as palette colour sync. Editing stops in the dialog now immediately re-renders linked shapes.
- **Draggable non-modal gradient editor**: `GradientEditorModal` is no longer modal. The backdrop overlay is removed; the panel is `position: fixed` and draggable by its header (grab cursor, `mousedown` on header starts drag via `window` mousemove/mouseup listeners).

## 2026-05-07

### FillStyle discriminated union type system

- **`src/model/shapes.ts`**: Replaced `LinearGradient` + flat `FillStyle` with a proper discriminated union: `ColorFill | GradientFill | SketchFill`, each with a `type` property. Added `fillColor()` helper for rough.js consumers. Updated `defaultFill()`.
- **`src/model/document.ts`**: Added `GradientDef` and `SketchStyleDef` asset types; extended `VibeDocument` with `gradients: GradientDef[]` and `sketchStyles: SketchStyleDef[]`.
- **`src/store/types.ts`**: Added 6 new `DocumentAction` variants (ADD/UPDATE/DELETE for gradients and sketch styles), 2 new `ViewAction` variants (TOGGLE_GRADIENT_MODAL, TOGGLE_SKETCH_STYLE_MODAL), and 2 new `AppState` booleans.
- **`src/store/reducer.ts`**: Default gradients (Sunset, Ocean, Forest, Grayscale) and sketch styles (Solid, Hatched, Cross Hatch, No Fill) added to `createInitialDocument()`. Handles all 6 new document actions. Palette sync updated to handle the union type.
- **`src/utils/fillCSS.ts`**: Rewritten — `gradientCSS()`, `sketchFillCSS()`, and `fillBackground()` handle all three fill types. Linear/radial/conic gradients and CSS hatching via `repeating-linear-gradient`.
- **`src/utils/shapeFactory.ts`**: `themeFill()` returns `ColorFill`. All hardcoded fills include `type: 'color'`.
- **`src/utils/serialization.ts`**: Added `migrateFill()` migration; `fromJSON()` migrates legacy fills on all shape fields, and adds missing `gradients`/`sketchStyles` arrays.
- **Canvas shape components** (`IconShape`, `CheckboxShape`, `RadioShape`, `StepperShape`, `ToggleShape`, `SliderShape`, `ProgressShape`, `ChartMockShape`, `ImageMockShape`): replaced `fill.color` with `fillColor(fill)` helper.
- **`src/components/properties/sections/FillSection.tsx`**: Full rewrite — color tab uses `ColorFill`, gradient tab shows document gradient picker + "Edit Gradients…" button, sketch tab shows document sketch style picker + color input + "Edit Sketch Styles…" button. Tab switching converts fill to the appropriate type.
- **`src/components/layout/GradientEditorModal.tsx`** (new): Two-column portal modal (state-driven by `showGradientModal`). Left: gradient list with live swatch. Right: name, type, angle, stop list with color pickers + position sliders, live preview strip.
- **`src/components/layout/SketchStyleEditorModal.tsx`** (new): Two-column portal modal (state-driven by `showSketchStyleModal`). Left: style list with preview swatch. Right: name, fill style selector, hachure params (conditional), preview.
- **`src/components/toolbar/Toolbar.tsx`**: Mounts `GradientEditorModal` and `SketchStyleEditorModal`.
- **`src/components/tree/GradientsSection.tsx`** (new): Collapsible tree panel section listing gradients with swatch previews; opens modal on click.
- **`src/components/tree/SketchStylesSection.tsx`** (new): Same pattern for sketch styles.
- **`src/components/tree/TreePanel.tsx`**: Includes both new sections below Fonts.
- **Tests** (new): `tests/model/fillStyle.test.ts`, `tests/utils/fillCSS.test.ts`, `tests/utils/fillSerialization.test.ts`, `tests/store/gradients.test.ts` — 24 new tests covering `fillColor()`, `defaultFill()`, `gradientCSS()`, `sketchFillCSS()`, `fillBackground()`, fill migration, and all 6 gradient/sketch-style store actions.

## 2026-05-08

### Tauri 2.0 desktop app integration
- Added `@tauri-apps/api` and `@tauri-apps/cli` packages
- Scaffolded `src-tauri/` with `tauri init` (Cargo.toml, tauri.conf.json, capabilities, icons)
- `src-tauri/src/lib.rs`: native menu bar with App / File / Edit / Window menus; File menu contains all 12 actions matching the web UI (New, Open, Save, Save As, Edit Palettes, Edit Themes, Settings, Document Settings, Import JSON, Export JSON, Export PNG, Export PDF); each item emits a `menu:*` event to the webview
- `src/hooks/useTauriMenu.ts` (new): registers Tauri event listeners that map each native menu event to the same store dispatches and utility functions used by the web UI toolbar; uses a stateRef to avoid stale closures without re-registering on every state change
- `src/store/types.ts` / `reducer.ts`: added `pendingDocumentsModalMode` signal field so the Tauri hook can trigger Toolbar's DocumentsModal (Open / Save As) without reaching into local state
- `src/components/toolbar/Toolbar.tsx`: added `useEffect` watching `pendingDocumentsModalMode` to open the modal on demand
- `src/App.tsx`: thin `AppInner` wrapper mounts `useTauriMenu` inside the store context
- `vite.config.ts`: added `server: { port: 1420, strictPort: true }` for Tauri's dev server
- `src/vite-env.d.ts`: added `Window.__TAURI_INTERNALS__` type declaration
- `package.json`: added `tauri:dev` and `tauri:build` scripts
- `.gitignore`: added `src-tauri/target/` and `src-tauri/gen/`

## 2026-05-01
reformat code. added 2k LOC. :( 18383

## 2026-04-30

Manually refactoring the code that Claude generated. Removing tons of duplicate code. -26 LOC.

## 2026-04-28

### Fix Pixel Image inserted via context menu having no asset

Context menu `addShape` was using the generic path which left `assetId: ''`, disabling the "Edit
Pixels" button. Now creates and attaches an empty pixel asset when inserting a pixelimage from the
context menu.

### Move Pixel Image to Shapes submenu; add dividers in Forms submenu

Pixel Image moved from Forms to the Shapes submenu. Added dividers between Containers, Form
Controls, and Mockups sections within the Forms submenu (required adding `divider` support to
`ContextMenuItem`).

### Merge Containers, Form Controls, and Mockups into a single "Forms" submenu

Combined the three context menu submenus into one "Forms" submenu to reduce clutter.

### Fix table header text color (black-on-black)

Header text in TableShape was using `fill.color` against a `stroke.color` background — both could be
dark, making text invisible. Fixed to always use white for header text in both normal and hand-drawn
modes.

### Add TabbedPanel container shape

New shape type `tabbed-panel` that renders a tab bar at the top and a content area below. Users
enter a comma-separated list of tab titles as the text content, and choose which tab is visually
active (1-indexed in the UI, stored 0-indexed). All child shapes are always visible — tabs are
wireframing decoration only.

- `src/model/shapes.ts` — Added `TabbedPanelShape` interface and added to `Shape` union
- `src/store/types.ts` — Added `'insert-tabbed-panel'` to `ToolMode`
- `src/utils/shapeFactory.ts` — Factory case with 3 default tabs
- `src/components/toolbar/Toolbar.tsx` — `NotebookTabs` icon added to Containers submenu
- `src/components/canvas/shapes/TabbedPanelShape.tsx` — New rendering component; supports hand-drawn
  mode with rough SVG tab separators and divider
- `src/components/canvas/ShapeRenderer.tsx` — Import and `case 'tabbed-panel'`; added to
  TEXT_EDITABLE and DRILLABLE sets
- `src/store/reducer.ts` — `COMMIT_TEXT_EDIT` handler updates `tabs.content`
- `src/components/properties/PropertiesPanel.tsx` — Properties case with Content, Tabs (active tab),
  Fill, Stroke, Text, Shadow, and Panel sections

## 2026-04-25 09:00

### Variable font axes: use sliders instead of number inputs

`src/components/properties/sections/TextSection.tsx` — each variable axis now renders a
`NumberInput` (for precise editing) paired with a `range` slider below it, matching the font-size
control pattern.

## 2026-04-23 22:00

### Fix variable font axis sliders not appearing for Roboto Flex

Two fixes:

- `src/utils/fontFeatures.ts` — the broad CSS2 API request (`ital,opsz,wdth,wght@0,...`) was using
  an invalid tuple format (mixing a discrete ital value with axis ranges), causing a 400 for many
  fonts. Replaced with a `wdth,wght@25..151,100..900` request (valid for all Google variable fonts)
  with a simpler `wght@100..900` fallback.
- `src/components/properties/PropertiesPanel.tsx` — `activeFont` was derived from the raw
  `shape.text.fontFamily`, which is wrong when the font is inherited from a named text style. Now
  uses `resolveTextStyle(...)` to get the effective font family, matching what TextSection actually
  displays.

## 2026-04-23 21:45

### Fix variable font detection always showing "Detecting…"

Root cause: `detectVariableAxes` used opentype.js to parse the font file, but modern browsers always
receive WOFF2 from Google Fonts (which opentype.js cannot parse), so `resolveFontUrl` always
returned `null`. Replaced with a CSS2 API approach:

- Fetches the font with a broad axis range request (`ital,opsz,wdth,wght@0,6..144,...`); if Google
  Fonts rejects it (HTTP 400 for unsupported axes), falls back to a simpler `wght@1..1000` request
- Parses the CSS response: `font-weight: X Y` (range) → wght axis; `font-stretch: X% Y%` → wdth;
  `font-style: oblique Xdeg Ydeg` → slnt
- Static fonts return only discrete weight values — no range match → empty axes array →
  `isVariable: false`

## 2026-04-23 21:00

### Google Fonts improvements: validation, font info panel, variable font axes

**Data model**

- `src/model/document.ts` — `customFonts: string[]` upgraded to `customFonts: CustomFont[]`; added
  `FontAxis` and `CustomFont` interfaces (`name`, `isVariable: boolean | null`, `axes: FontAxis[]`)
- `src/model/shapes.ts` — added `fontVariationSettings?: Record<string, number>` to `TextStyle`
- `src/utils/serialization.ts` — migration: existing `string[]` entries are converted to
  `{ name, isVariable: null, axes: [] }` on load

**Store**

- `src/store/types.ts` — `ADD_CUSTOM_FONT` payload changed to `font: CustomFont`; added
  `UPDATE_CUSTOM_FONT_META`, `SELECT_FONT` actions; added `selectedFontName: string | null` to
  `AppState`
- `src/store/reducer.ts` — updated all font cases; `SELECT_FONT` clears other selections;
  `selectedFontName` cleared on any selection action; `LOAD_DOCUMENT` normalizes the string→object
  migration
- `src/store/history.ts` — `UPDATE_CUSTOM_FONT_META` added as undoable

**Variable font detection**

- `src/utils/fontFeatures.ts` — added `detectVariableAxes(fontFamily)` using opentype.js fvar
  table (reuses existing `resolveFontUrl` helper)
- `src/hooks/useFontMetadataEnrichment.ts` — new hook; watches `customFonts` for
  `isVariable === null` entries and enriches them asynchronously via `detectVariableAxes`
- `src/components/layout/AppShell.tsx` — added `useFontMetadataEnrichment` call alongside
  `useDynamicFonts`

**CSS rendering**

- `src/utils/textStyleCSS.ts` — `textExtraCSS` now includes `fontVariationSettings` →
  `font-variation-settings` CSS (covers all shape renderers)
- `src/utils/textShapeCss.ts` — `textStyleToCss` also outputs `font-variation-settings` for CSS
  export

**Tree panel**

- `src/components/tree/FontsSection.tsx` — validation: fetches Google Fonts CSS2 API before
  dispatching, shows error if `@font-face` absent; font rows are clickable (dispatches
  `SELECT_FONT`); "var" badge shown for variable fonts; selected row highlighted
- `src/components/tree/TreePanel.tsx` — passes `selectedFontName` to `FontsSection`

**Properties panel**

- `src/components/properties/sections/FontInfoSection.tsx` — new: shows font name (in its own
  typeface), variable/static/detecting label, read-only axes table, Remove button
- `src/components/properties/sections/TextSection.tsx` — added `activeFont?: CustomFont | null`
  prop; axis sliders rendered when font is variable; `fontVariationSettings` added to `STYLE_FIELDS`
- `src/components/properties/PropertiesPanel.tsx` — `selectedFontName` guard renders
  `FontInfoSection`; all `TextSection` calls pass `customFontNames` and `activeFont`

## 2026-04-23 20:15

### Fix "Export CSS" menu item doing nothing

Root cause: `onClose()` was unmounting `CanvasContextMenu` before the local `setCssDialogShape`
state update committed, so the dialog never rendered. Fixed by lifting dialog state to `CanvasView`:

- `CanvasContextMenu` — removed local `cssDialogShape` state; now accepts `onShowCssDialog` prop and
  calls it before `onClose()`; `CssDialogState` interface exported for callers
- `CanvasView` — holds `cssDialog` state, passes `onShowCssDialog={setCssDialog}` to
  `CanvasContextMenu`, renders `<TextCssDialog>` when `cssDialog !== null`

## 2026-04-23 20:00

### Export CSS for text shapes

- `src/utils/textShapeCss.ts` — `textStyleToCss(text, selector)` converts a `TextStyle` to a CSS
  rule block covering font-family, font-size, font-weight, font-style, text-align, line-height,
  letter-spacing, text-decoration, text-transform, font-variant-caps, color (or gradient via
  background-clip trick), and text-shadow
- `src/components/canvas/TextCssDialog.tsx` — modal dialog with a read-only monospace textarea (
  click to select all), a "Copy to Clipboard" button, and a "Dismiss" button; rendered via portal so
  it sits above everything
- Added "Export CSS" context menu item (Code2 icon) for `text` shapes in `CanvasContextMenu`; the
  selector is derived from the shape name

## 2026-04-23 19:30

### Fix context menu: shapes not added when selected from sub-menu

The window `pointerdown` capture listener in `ContextMenu` was calling `onClose()` immediately when
a click landed inside a portal-rendered sub-menu (because the portal node is outside `menuRef`),
unmounting the component before the `click` event fired and the `onClick` dispatch ran. Fix: use
`e.composedPath()` to also check whether the click landed inside any element with
`data-submenu="true"`, and skip `onClose()` in that case.

## 2026-04-23 19:00

### Fix sub-menu dismissal on mouse-out

- Replace instant `onMouseLeave` close with a 300 ms debounced close in both `ContextMenu.tsx` (
  portal-based sub-menus) and `Toolbar.tsx` (component dropdown sub-menus)
- `cancelClose`/`scheduleClose` (ContextMenu) and `cancelSubMenuClose`/`scheduleSubMenuClose` (
  Toolbar) cancel the timer whenever the cursor enters either the parent row or the sub-menu, giving
  the cursor time to travel across any gap
- Reduced the sub-menu offset from +2 px to –4 px overlap in `ContextMenu` so the parent row and
  sub-menu share a common hover zone with no gap

## 2026-04-23 18:00

### Pixel image editor

- New `PixelAsset` document asset (`src/model/pixelAsset.ts`): flat RGBA pixel array,
  `createEmptyPixelAsset`, `setPixel`, `hexToRgba` helpers
- `VibeDocument` gains `pixelAssets: PixelAsset[]`; serialization migration fills it in for older
  documents
- New `PixelImageShape` shape type (`type: 'pixelimage'`, `assetId` reference); added to shape
  union, `shapeFactory`, `ShapeRenderer`
- Store: `ADD_PIXEL_ASSET`, `UPDATE_PIXEL_ASSET`, `DELETE_PIXEL_ASSET` document actions (
  undo-tracked); `START_PIXEL_EDIT`, `STOP_PIXEL_EDIT`, `SELECT_PIXEL_ASSET` view actions;
  `editingPixelAssetId` and `selectedPixelAssetId` in `AppState`; `DELETE_PIXEL_ASSET` also removes
  referencing shapes
- `PixelImageShapeComp`: renders pixels as `cellW×cellH` rectangles on a `<canvas>`; checkerboard
  CSS background for transparent pixels; "16×16" placeholder when asset missing
- `PixelEditorOverlay`: full in-place pixel editor opened by double-clicking a pixel image shape.
  Pencil, line (Bresenham), and eraser tools; palette color swatches + custom color picker; grid
  lines; double-click outside canvas to close; each completed stroke dispatches one
  `UPDATE_PIXEL_ASSET` for undo
- Toolbar: added "Pixel Image" (`Grid2X2` icon) to the Shapes dropdown; `insert-pixelimage` tool
  mode creates asset + shape together on pointer up
- Tree panel: `PixelAssetsSection` lists pixel assets under Assets with rename (double-click), usage
  count, and delete
- Properties panel: `PixelImageSection` for `pixelimage` shapes (asset name, pixel size, "Edit
  Pixels" button); separate panel for selected pixel asset (size, usage count, "Edit Pixels" button)

## 2026-04-23 16:30

### Unit tests for export bounds computation

- Extracted `applyTransform`, `shapeCorners`, `computeVisualBounds` from `exportPng.tsx` into
  `src/utils/exportBounds.ts` so they can be tested independently
- Added `tests/utils/exportBounds.test.ts` with 18 tests covering: identity, 90°/180° rotation,
  scaleX/Y, skewX/Y, axis-aligned bounds, rotated bounds (including the 100×20 @ 45° case that
  reveals visual width ≈ 84.9px — less than 100), multi-shape spanning, scaled shapes, skewed
  shapes, and line-shape filtering

## 2026-04-23 16:15

### Fix group PNG export clipping transformed shapes

- Render into a padded container (200px each side) so CSS-transformed shapes (rotation/scale/skew)
  that visually overflow their bounding box are not clipped
- After html2canvas captures the padded canvas, crop back to the exact group dimensions using a
  secondary canvas `drawImage` call

## 2026-04-23 16:00

### Export group as PNG

- Added `exportGroupAsPng(groupId, state)` to `src/utils/exportPng.tsx`: renders the group's
  children into an off-screen container sized to the group's bounding box and captures it with
  html2canvas (transparent background)
- Added "Export as PNG" context menu item (with FileImage icon) for group shapes in
  `CanvasContextMenu.tsx`, alongside the existing Ungroup item

## 2026-04-23 15:30

### UX improvements batch

**Snap toggle (Feature 1):**

- Added `snapAlignment: boolean` field to `GridSettings` in `src/model/grid.ts` (default `true`)
- Added migration in `src/utils/serialization.ts` for older docs missing this field
- Added Magnet toolbar button next to grid snap button to toggle alignment/guide snap on/off
- `src/components/canvas/useCanvasPointer.ts` reads `gridSettings.snapAlignment` to conditionally
  call `computeAlignmentSnap`

**NumberInput arrow keys (Feature 2):**

- `src/components/properties/inputs/NumberInput.tsx`: ArrowUp/Down keys now increment/decrement the
  value by `step` (default 1) when the field contains a plain number (not a `@variable` reference)

**Reset transform button (Feature 3):**

- `src/components/properties/sections/TransformSection.tsx`: Added "Reset transform" button below
  the grid; resets rotation to 0, scaleX/scaleY to 1, skewX/skewY to 0

**Components sub-menus (Feature 4):**

- `src/components/toolbar/Toolbar.tsx`: Components dropdown now shows "Containers ›" and "Form
  Controls ›" items; hovering each reveals a flyout sub-menu with the respective tools

**Single undo for drag (Feature 5):**

- Added `MOVE_SHAPES_START` action (DocumentAction): records the undo anchor exactly once when a
  drag begins
- Added `DRAG_SHAPES` action (DragAction, NOT in history): applies incremental moves without
  creating undo entries
- `src/store/types.ts`: Added `MOVE_SHAPES_START` to `DocumentAction` and new `DragAction` union;
  added `DragAction` to `AppAction`
- `src/store/history.ts`: Added `MOVE_SHAPES_START` to `DOCUMENT_ACTION_TYPES`
- `src/store/reducer.ts`: Routes `MOVE_SHAPES_START` through `applyDocumentAction` (no-op); routes
  `DRAG_SHAPES` to `MOVE_SHAPES` logic without history recording
- `src/components/canvas/useCanvasPointer.ts`: Dispatches `MOVE_SHAPES_START` once when drag
  threshold is crossed, then `DRAG_SHAPES` for each subsequent mouse move

**CollapsibleSection persistence (Feature 6):**

- `src/components/properties/CollapsibleSection.tsx`: Module-level `Map<string, boolean>` stores
  open/closed state by section title; state is preserved when switching selected objects

## 2026-04-23 14:00

### Multiple box shadows + gradient editor fixes

**Multiple box shadows:**

- Changed `ShapeBase.boxShadow` from `BoxShadow | null` to `BoxShadow[]` (array) in
  `src/model/shapes.ts`
- Updated `src/utils/shadowCSS.ts` to map the array into a comma-joined CSS `box-shadow` value
- Added migration in `src/utils/serialization.ts`: old `BoxShadow | null` values are converted to
  `[]` or `[shadow]` on document load
- Redesigned `ShadowSection` component: shows "+ Add Shadow" button, each shadow in a compact
  sub-panel with Color, X/Y row, Blur/Spread row, Inset checkbox, and × remove button

**Gradient editor fixes:**

- Wrapped gradient controls in a visually distinct sub-panel that only appears when Gradient mode is
  active; Solid/Gradient toggle always visible
- Added a gradient preview bar (12px tall CSS linear-gradient div) at the top of the sub-panel
- Redesigned stop rows: removed "Stop N" label, color swatch fills available width (`flex: 1`),
  position input is explicitly `60px` wide so it no longer overflows
- Fixed gradient rendering bug: extracted gradient CSS from `textExtraCSS` into new
  `textGradientSpanCSS()` in `src/utils/textStyleCSS.ts`; each text-rendering shape now wraps
  content in an inline `<span>` with the gradient styles (inline elements have reliable
  `background-clip: text` support)
- Updated shapes: `TextShape`, `LabelShape`, `ButtonShape`, `StickyNoteShape`, `PanelShape`,
  `TextFieldShape`

## 2026-04-23 12:15

- Moved Color/Gradient and Shadow to the bottom of the Text section (they are appearance effects,
  not core typography properties)
- Final Text section order: Style → Font → Size → Weight/Italic/SmallCaps → Alignment → Spacing →
  Decoration → Transform → Color → Shadow

## 2026-04-23 12:00

- Reorganized Text section properties into 8 logical groups (matching Figma/Sketch conventions):
    1. Named Style selector
    2. Font Family → Font Size (identity first)
    3. Font Weight + Italic + Small Caps (style variants)
    4. Color / Gradient
    5. Alignment — H-align and V-align combined onto one row (saves a row)
    6. Spacing — Line Height and Letter Spacing side-by-side (saves a row)
    7. Decoration (underline/strikethrough) + Text Transform
    8. Shadow (moved to bottom as an effect)

## 2026-04-23 11:45

- Context menu now scrolls when it's taller than the viewport (`max-height: calc(100vh - 16px)` +
  `overflow-y: auto`)
- Repositioning logic improved: clamps to all four viewport edges with 8px margin (previously only
  handled right/bottom overflow)

## 2026-04-23 11:30

- Added `fontVariantCaps?: 'normal' | 'small-caps'` to `TextStyle` model
- Applied via `fontVariant: 'small-caps'` CSS in `textExtraCSS`
- Added Small Caps toggle (ALargeSmall icon) next to italic button in TextSection
- Added `src/utils/fontFeatures.ts` with `detectSmallCaps()` using opentype.js:
    - Fetches the Google Fonts CSS link tag for the current font
    - Extracts a TTF/WOFF1 URL (opentype.js cannot parse WOFF2)
    - Parses GSUB feature tables to check for the `smcp` OpenType feature
    - Returns null when detection is impossible (WOFF2 only / not a Google Font)
- Toggle shows dimmed when font is confirmed to lack native smcp; full opacity when supported or
  unknown
- Installed `opentype.js` + `@types/opentype.js`

## 2026-04-23 11:15

- Double-clicking any item in the tree view opens an inline name editor
    - Shapes and pages: dispatches `PATCH_SHAPE` with new name on commit
    - Document row: dispatches `SET_DOCUMENT_META` with new name on commit
    - Page folders: already supported (no change needed)
- Enter/Blur commits; Escape cancels; drag is disabled while editing

## 2026-04-23 11:00

- Font weight dropdown now detects which weights the selected font actually supports via the CSS
  Font Loading API (`document.fonts`)
- System fonts (not in `document.fonts`) fall back to showing all 9 weights
- Web fonts (Google Fonts, custom fonts) show only their registered weight variants
- Re-checks after `document.fonts.ready` resolves so async-loaded fonts are handled correctly

## 2026-04-23 10:45

- Added italic toggle button to Text section in PropertiesPanel (toggles `fontStyle` between
  `'normal'` and `'italic'`)
- Expanded font weight dropdown from Normal/Bold to full 9-step range: Thin (100), ExtraLight (200),
  Light (300), Normal (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800), Black (900)
- Reset-to-style buttons shown for both `fontWeight` and `fontStyle` when a named text style is
  active

## 2026-04-23 09:25

- Reordered Transform section fields: X/Y → W/H → SX/SY → KX/KY → °
- Widened `.tlabel` from 10px to 14px to fit 2-char labels

## 2026-04-23 09:15

- Added `scaleX`, `scaleY`, `skewX`, `skewY` optional fields to `BoundingBox` in
  `src/model/transform.ts`
- Added `buildCSSTransform(t)` utility that composes rotate/scale/skew into a single CSS transform
  string
- Updated all 25 shape renderers to use `buildCSSTransform(transform)` instead of inline rotate-only
  expression
- Added SX (scale X %), SY (scale Y %), KX (skew X °), KY (skew Y °) inputs to `TransformSection`

## 2026-04-23 09:05

- Added `CollapsibleSection` component (`src/components/properties/CollapsibleSection.tsx`) with
  chevron toggle and `defaultOpen` prop
- Added `.sectionTitleRow`, `.sectionChevron`, `.sectionChevronOpen`, `.sectionBody` CSS classes to
  `PropertiesPanel.module.css`
- Converted all 15 standalone section components to use `<CollapsibleSection>` in place of the raw
  `<div className={styles.section}>` pattern
- Converted all 21 inline `<div className={styles.section}>` blocks in `PropertiesPanel.tsx` to use
  `<CollapsibleSection>`
- Removed now-unused `styles` import from ContentSection, FillSection, PageSection, ShadowSection,
  StrokeSection

## 2026-04-23 (gradient text fill + dynamic gradient stops)

- Added `textGradient?: LinearGradient | null` to `TextStyle` in `src/model/shapes.ts` and to
  `TextStyleDef`
- `textExtraCSS()` handles `textGradient` via CSS `background-clip: text` +
  `WebkitTextFillColor: transparent`
- `TextSection` color control replaced with Solid / Gradient toggle matching the fill gradient
  editor
- `FillSection` and `TextSection` gradient editors now support dynamic stop count: add stops (
  inserted into largest gap), remove stops (min 2), per-stop position input (%)

## 2026-04-23 (Phases 2–4: stroke dash, per-corner radius, box shadow, linear gradients)

### Phase 2: Stroke dash style + per-corner border radius

**Stroke dash style:**

- Added Solid / Dashed / Dotted selector to the Stroke section in the properties panel
- Stroke `dash` array was already in the model; now exposed in the UI
- Created `src/utils/strokeStyleCSS.ts` with `strokeBorderCSS` and `dashToBorderStyle` utilities
- All 17 CSS-rendered shape components updated to use `strokeBorderCSS` instead of the `border:`
  shorthand

**Per-corner border radius:**

- Added `CornerRadii` interface to `src/model/shapes.ts`
- Added `cornerRadii?: CornerRadii` to RectShape, ButtonShape, FrameShape, PanelShape,
  ScrollPanelShape
- Added `cornerRadiiCSS(uniform, radii?)` utility to `strokeStyleCSS.ts`
- All 5 relevant shape renderers updated to use `cornerRadiiCSS`
- Properties panel: new `CornerRadiusControl` component — shows a single radius input with a toggle
  button (⌗) to expand into 4 per-corner inputs (TL/TR/BR/BL)

### Phase 3: Box shadow on shapes

- Added `BoxShadow` interface to `src/model/shapes.ts` and `boxShadow?` to `ShapeBase` (applies to
  all shapes)
- Created `src/utils/shadowCSS.ts` with `boxShadowCSS` utility
- All 25 non-line, non-page shape renderers updated to spread `boxShadowCSS(shape)` onto the outer
  div
- Created `src/components/properties/sections/ShadowSection.tsx` with enable/disable toggle, Color,
  X, Y, Blur, Spread, and Inset controls
- `ShadowSection` added to all non-line shape cases in `PropertiesPanel`

### Phase 4: Linear gradients on fills

- Added `LinearGradient` interface and `gradient?: LinearGradient | null` to `FillStyle` in
  `src/model/shapes.ts`
- Created `src/utils/fillCSS.ts` with `fillBackground(fill)` — returns linear-gradient CSS when
  gradient is set, otherwise returns solid color
- All 16 shape renderers that render a fill background updated to use `fillBackground(fill)` instead
  of `fill.color`
- `FillSection` updated with Solid / Gradient mode toggle; gradient mode shows: angle input, start
  color, end color, opacity

## 2026-04-22 (Phase 1: extended text typography properties)

### Feature: Line height, letter spacing, text decoration, text transform

Added four new optional text properties to all text shapes and named text styles:

- **Line Height** — CSS multiplier (0.5–4); number input in Text section
- **Letter Spacing** — pixel offset (–10 to 50px); number input in Text section
- **Text Decoration** — Underline / Strikethrough / both; icon toggle buttons (Lucide icons)
- **Text Transform** — None / Uppercase / Lowercase / Capitalize; select dropdown

All four fields:

- Live in `TextStyle` in `src/model/shapes.ts` as optional fields (no migration needed)
- Are rendered via the expanded `textExtraCSS()` utility in `src/utils/textStyleCSS.ts` (replaces
  `textShadowCSS`)
- Apply in all 13 text-rendering shape components (ButtonShape, CheckboxShape, LabelShape,
  ListShape, PanelShape, RadioShape, SelectShape, StepperShape, StickyNoteShape, TableShape,
  TextFieldShape, TextShape, ToggleShape)
- Are tracked as style overrides when a named text style is applied
- Are editable in named text style definitions (TextStyleDefSection) with optional field checkboxes

`textShadowCSS` is kept as a deprecated alias so nothing breaks.

## 2026-04-22 (custom Google Fonts)

### Feature: Add custom Google Fonts to a document

Users can now type any Google Fonts family name in Document Settings → Custom Fonts and click Add (
or press Enter). The font is saved to the document, dynamically loaded via a `<link>` tag injection,
and immediately available in the Font dropdown across all text shapes and text style definitions.

- Fonts persist in the document JSON and are re-loaded on open
- Undo/redo supported for add/remove operations
- Font names shown in their own typeface in the font list
- Old documents without `customFonts` field migrate automatically

**Files added:** `src/hooks/useDynamicFonts.ts`  
**Files modified:** `src/model/document.ts`, `src/store/types.ts`, `src/store/history.ts`,
`src/store/reducer.ts`, `src/components/layout/AppShell.tsx`,
`src/components/layout/DocumentSettingsModal.tsx`,
`src/components/properties/sections/TextSection.tsx`,
`src/components/properties/sections/TextStyleDefSection.tsx`,
`src/components/properties/PropertiesPanel.tsx`

## 2026-04-22 14:00 (text-shadow CSS support for all text shapes)

### Feature: text-shadow applied to all display-mode text renderers

Added `import { textShadowCSS } from '@utils/textStyleCSS'` and spread `...textShadowCSS(text)` (or
`title` for PanelShape) into the display-mode text style object of every text-rendering shape
component. Textarea/input editing styles are intentionally unchanged.

**Files modified:**

- `src/components/canvas/shapes/TextShape.tsx`
- `src/components/canvas/shapes/LabelShape.tsx`
- `src/components/canvas/shapes/ButtonShape.tsx`
- `src/components/canvas/shapes/CheckboxShape.tsx`
- `src/components/canvas/shapes/RadioShape.tsx`
- `src/components/canvas/shapes/ToggleShape.tsx`
- `src/components/canvas/shapes/SelectShape.tsx`
- `src/components/canvas/shapes/TextFieldShape.tsx`
- `src/components/canvas/shapes/StickyNoteShape.tsx`
- `src/components/canvas/shapes/ListShape.tsx`
- `src/components/canvas/shapes/PanelShape.tsx`
- `src/components/canvas/shapes/StepperShape.tsx`
- `src/components/canvas/shapes/TableShape.tsx`

## 2026-04-22 (fix guide snap stale closure)

### Fix: shapes not snapping to user guide lines

`onPointerMove`'s `useCallback` had a stale closure that didn't include `state.document` in its
deps, so newly-added guides were invisible to the snap computation. Fix: extract guide positions
into a `pageGuidesRef` that's updated on every render (outside any callback), so the snap logic
always reads fresh guide data via the ref.

**Files modified:** `src/components/canvas/useCanvasPointer.ts`

## 2026-04-22 (page snap + user guides)

### Add page boundary snapping and user-created guide lines

**Page boundary snapping:** When a fixed-size page is active, its edges and center lines are
included as snap targets alongside other shapes.

**User guide lines:**

- Drag from the horizontal ruler (top) to create a horizontal guide line
- Drag from the vertical ruler (left) to create a vertical guide line
- Drag an existing guide line to reposition it
- Double-click a guide to delete it
- Guides persist in the document (saved per-page), are undoable/redoable, and act as snap targets
  when dragging shapes

Guide lines render in blue (`#4d94ff`) inside the canvas. Snap guide lines (pink) still render over
them during alignment snapping.

**Files added:** `src/model/guide.ts`, `src/components/canvas/CanvasGuides.tsx`  
**Files modified:** `src/model/shapes.ts`, `src/store/types.ts`, `src/store/reducer.ts`,
`src/store/history.ts`, `src/utils/alignmentSnap.ts`, `src/components/canvas/useCanvasPointer.ts`,
`src/components/canvas/CanvasView.tsx`

## 2026-04-22 (alignment snapping)

### Add shape alignment snapping (smart guides)

When dragging a shape, the tool now shows alignment guide lines and snaps to other shapes — similar
to Figma/Google Slides smart guides.

**Behavior:**

- While dragging, the left/right/center-X and top/bottom/center-Y edges of the dragged shape are
  compared against all other visible shapes on the active page
- When any pair of edges comes within ~8 screen pixels, the shape snaps to the aligned position and
  a pink guide line appears across the canvas
- X and Y axes snap independently
- When multiple shapes are selected and dragged together, their collective bounding box is used
- Hold **Alt/Option** to temporarily disable alignment snapping
- Alignment snapping takes priority over grid snap on any axis where it fires; grid snap remains
  active on the other axis
- Guide lines disappear on mouse release

**Files added:** `src/utils/alignmentSnap.ts`, `src/components/canvas/SnapGuides.tsx`  
**Files modified:** `src/components/canvas/useCanvasPointer.ts`,
`src/components/canvas/CanvasView.tsx`

## 2026-04-21

### Add ImageMock and ChartMock shapes

Two new wireframe placeholder shapes:

- **Image Mock** (`imagemock`): A rectangle with a smiley face drawn inside — head circle, two dot
  eyes, and a curved smile. Renders in both plain SVG and hand-drawn (RoughJS) modes. Background
  fill and stroke are configurable.
- **Chart Mock** (`chartmock`): A generic chart with axes and either bars or a line series (5 data
  points). Toggle between bar and line chart in the properties panel. Bar/line color is configurable
  via Fill. Renders in both plain SVG and hand-drawn modes.

Both shapes appear in:

- Canvas right-click context menu → Mockups section
- Tree panel "+" dropdown → Mockups section
- Tree panel node context menu → Mockups section

Files modified: `src/model/shapes.ts`, `src/utils/shapeFactory.ts`,
`src/components/canvas/ShapeRenderer.tsx`, `src/components/canvas/shapes/ImageMockShape.tsx` (new),
`src/components/canvas/shapes/ChartMockShape.tsx` (new),
`src/components/canvas/CanvasContextMenu.tsx`, `src/components/tree/TreeNode.tsx`,
`src/components/tree/TreePanel.tsx`, `src/components/properties/PropertiesPanel.tsx`.

## 2026-04-22

### Add tick marks to Progress Bar shape

Same as the Slider tick marks feature. `ProgressShape` gets a `ticks: number` field (0 = none).
Ticks render below the bar using the bar fill color. Configurable via "Ticks" input (0–20) in the
properties panel.

### Add tick marks to Slider shape

- `SliderShape` model: new `ticks: number` field (0 = no ticks, n = number of tick marks evenly
  distributed across the track).
- `SliderShape.tsx`: renders tick marks below the track in both plain and hand-drawn modes. Plain
  mode uses small divs; hand-drawn uses `roughLine`.
- `shapeFactory.ts`: default `ticks: 0`.
- Properties panel: "Ticks" number input (0–20) in the Slider section.

### Improve dark mode system preference handling

`useTheme` now tracks a `null` (follow system) vs explicit override state separately.

- OS preference changes are observed live via `MediaQueryList.addEventListener` and applied
  immediately when no override is set.
- The toggle button cycles between "override to opposite" and "clear override (return to system)"
  rather than always writing to localStorage.
- `localStorage` key `"ui-theme"` is only present when the user has explicitly overridden; it is
  removed when following system.

## 2026-04-21

### Add Icon shape

Added a new "Icon" shape type that displays a single lucide-react icon.

- `src/model/shapes.ts`: New `IconShape` interface with `transform`, `icon: { name }`, `fill`, and
  `stroke` properties. Added to the `Shape` union.
- `src/store/types.ts`: Added `'insert-icon'` to `ToolMode`.
- `src/utils/shapeFactory.ts`: Factory case for `'icon'` — 40×40px, defaults to "Star" icon with
  foreground color.
- `src/components/canvas/shapes/IconShape.tsx`: New component that renders the selected lucide icon
  centered in the shape bounds. Icon color is controlled by `fill.color`.
- `src/components/canvas/ShapeRenderer.tsx`: Import and dispatch for the `'icon'` case.
- `src/components/canvas/useCanvasPointer.ts`: Maps `'insert-icon'` tool mode to `'icon'` shape
  type.
- `src/components/toolbar/Toolbar.tsx`: Added "Icon" entry with Star icon to the FORM_CONTROLS
  dropdown.
- `src/components/properties/sections/IconSection.tsx`: New section component for picking the icon (
  reuses the existing IconPickerDialog).
- `src/components/properties/PropertiesPanel.tsx`: Added `case 'icon'` with Transform, Icon, and
  Fill sections.
- `src/components/tree/TreeNode.tsx`: Added `'icon'` to `FORM_CONTROL_TYPES` so it appears with the
  label "Icon" in the tree.

### Add dark mode

Added a dark/light mode toggle to the UI.

- `src/index.css`: Added CSS custom property tokens for all UI colors under `:root` (light) and
  `html[data-theme="dark"]` (dark). Updated `html/body/#root` to use the new variables.
- `src/hooks/useTheme.ts`: New hook that reads/writes `localStorage` key `"ui-theme"`, sets
  `data-theme` attribute on `<html>`, and auto-detects system preference on first visit.
- `src/components/toolbar/Toolbar.tsx`: Added Sun/Moon toggle button (right side of toolbar). Fixed
  3 hardcoded inline colors on the document name input/span. Imports `useTheme`.
- All 25 `*.module.css` files: Replaced hardcoded hex color values with CSS variables. The
  `contentTextarea` code-editor element intentionally retains its dark background in both modes.

## 2026-04-21 16:18

### Make tree sidebar sections collapsible

The Images, Variables, and Styles sections in the tree panel can now be collapsed by clicking their
header label. A `›` chevron rotates 90° when the section is expanded. The `+` add button remains
visible and functional while collapsed.

## 2026-04-21 16:13

### Add image assets section

The Assets section of the tree panel now lists every image imported into the document.

**Model:**

- New `ImageAsset` type (`src/model/imageAsset.ts`): id, name, src (base64 data URI or http URL),
  mimeType, optional width/height
- `assetId?` added to `ImageShape` to link shapes to their asset
- `images: ImageAsset[]` added to `VibeDocument`

**State/actions:**

- `selectedAssetId: string | null` in AppState
- New document actions (tracked in undo history): ADD_IMAGE_ASSET, UPDATE_IMAGE_ASSET,
  DELETE_IMAGE_ASSET
- UPDATE_IMAGE_ASSET propagates src/mimeType changes to all linked shapes automatically
- DELETE_IMAGE_ASSET unlinks shapes (they keep their current src)
- SELECT_IMAGE_ASSET view action; all selection actions reset `selectedAssetId`

**Tree panel:**

- `AssetsSection` component lists image assets with thumbnail, name, and usage count
- `+` button opens a name + URL form to add a URL-based image asset
- Double-click to rename; right-click for Rename/Delete context menu

**Properties panel:**

- Clicking an asset row shows `ImageAssetSection` with: editable name, source info (embedded: size
  in KB + pixel dimensions; URL: editable URL field), and a usage list of linked shape names

**Image upload:**

- `ImageSection` now creates an `ImageAsset` on first upload and links the shape to it
- Re-uploading to a linked shape updates the existing asset, propagating to all shapes using it

**Migration:**

- Serialization migration guard: `images: []` for old documents
- LOAD_DOCUMENT auto-creates assets for any image shapes that have no assetId, so existing documents
  populate the assets panel automatically

## 2026-04-21 15:28

### Add variable binding to transform X/Y/W/H fields

`TransformSection` now supports number variable binding for X, Y, Width, and Height. Type `@` in any
of those fields to trigger an autocomplete dropdown of number variables. Bound fields show
`@varName` with a × to clear. The rotation field does not support variable binding.

- Updated `TField` (local to TransformSection) to use `type="text"` with `@` interception, matching
  the NumberInput pattern
- Added optional `xVar`, `yVar`, `wVar`, `hVar` VarProps to `TransformSection`
- All 22 `TransformSection` call sites in PropertiesPanel now pass variable binding props via the
  existing `vp()` shorthand

## 2026-04-21 14:47

### Add document-level variables system

Named variables (number, string, boolean, color) that can be bound to shape properties. Editing a
variable value re-renders all shapes using it automatically via live resolution at render time.

**Data model:**

- `src/model/variable.ts` — `Variable` interface, `resolveVariableBindings` (chains with
  `resolveShapeText` in ShapeRenderer)
- `variableBindings?: Record<string, string>` (propPath → variableId) added to `BaseShape`
- `variables: Variable[]` added to `VibeDocument`

**State / actions:**

- `selectedVariableId: string | null` in AppState
- New document actions: ADD_VARIABLE, UPDATE_VARIABLE, DELETE_VARIABLE, REORDER_VARIABLE,
  BIND_VARIABLE (all tracked in undo history)
- SELECT_VARIABLE view action; all selection actions reset `selectedVariableId`
- DELETE_VARIABLE walks all shapes removing orphaned bindings (no baking needed — shapes fall back
  to stored literal values)

**Input components:**

- `NumberInput`, `ColorInput`, `ToggleInput` — new optional props
  `variableId?, variables?, onVariableChange?`; existing call sites unchanged
- `@` in a number/color input triggers autocomplete dropdown of matching variables; bound inputs
  show `@varName` + × clear button

**New UI:**

- `VariableRow` — tree row with type icon, inline rename, context menu, value preview
- `VariablesSection` — tree section with `+` type-picker menu (Number/String/Boolean/Color)
- `VariableSection` — properties panel section for editing a variable's name and value

**PropertiesPanel wiring:**

- Early return for `selectedVariableId !== null` renders VariableSection
- `makeVarProps` helper builds binding props for a given shape/path/type; passed as `colorVar`,
  `widthVar`, `opacityVar` into FillSection/StrokeSection and directly to NumberInput/ToggleInput
  call sites

**Serialization:** migration guard `if (!Array.isArray(docObj.variables)) docObj.variables = []`

## 2026-04-21 14:15

### Fix text style override tracking

Two bugs in `TextSection` where property edits didn't behave correctly when a style was applied:

- **Style connection lost on edit**: `onChange` was spreading the resolved text (which has no
  `textStyleId`), so every property change was silently unlinking the shape from its style. Fixed by
  using `rawText` as the base in all `onChange` calls.
- **Override not tracked when value matches raw**: The PATCH_SHAPE reducer tracks overrides by
  diffing old vs new raw values. If `rawText.align = 'left'` and the style provides `'center'`,
  clicking 'left' produced no diff → no override added → style's value kept winning. Fixed by adding
  an `applyChange` helper in `TextSection` that explicitly adds the changed field to
  `textStyleOverrides` whenever a style is set, regardless of value equality.

## 2026-04-21 14:05

### Text Styles system

- **Named text styles**: Users can create document-level `TextStyleDef` objects in the Styles
  section of the tree panel. Each style is a named collection of optional text properties (font
  family, size, weight, style, color, align, verticalAlign).
- **Built-in styles**: Three default styles are created with every new document — Title (32px bold),
  Subtitle (20px 600-weight), Paragraph (14px normal). Old documents auto-migrate with the defaults.
- **Style assignment**: Any shape with text shows a "Style" selector at the top of the Text section
  in the properties panel. Selecting a style applies its properties live; shapes re-render
  immediately when the style is edited.
- **Per-field overrides**: After applying a style, individual text properties can still be
  overridden. Modified fields show a ↺ reset button to restore the style's value. Override tracking
  is automatic in the reducer when `PATCH_SHAPE` changes text fields on a styled shape.
- **Style editor**: Clicking a style in the Styles tree section shows it in the properties panel.
  Each field has a checkbox to include/exclude it from the style. Changes apply live — no save
  button needed.
- **Delete bakes values**: Deleting a style bakes its resolved values into all shapes that
  referenced it, then disconnects them.
- **Data model**: Added `TextStyleDef`, `TextStyleField`, `TEXT_STYLE_FIELDS`,
  `BUILT_IN_TEXT_STYLES`, `resolveTextStyle`, `resolveShapeText` in new `src/model/textStyle.ts`.
  Added `textStyleId?` and `textStyleOverrides?` to `TextStyle` in `shapes.ts`. Added
  `textStyles: TextStyleDef[]` to `VibeDocument`.
- **State**: Added `selectedStyleId: string | null` to `AppState`. New document actions:
  `ADD_TEXT_STYLE`, `UPDATE_TEXT_STYLE`, `DELETE_TEXT_STYLE`, `REORDER_TEXT_STYLE`,
  `APPLY_TEXT_STYLE`, `CLEAR_TEXT_OVERRIDE`. New view action: `SELECT_STYLE`.
- **Canvas**: `ShapeRenderer` calls `resolveShapeText` before passing shapes to sub-renderers, so
  all text renders with resolved style values without needing to store resolved values in shape
  data.
- **New files**: `src/model/textStyle.ts`, `StyleRow.tsx/css`, `StylesSection.tsx`,
  `TextStyleDefSection.tsx`
- **Modified**: `TextSection` updated with new prop signature (style selector, override reset
  buttons, font family selector); all 14 call sites in `PropertiesPanel.tsx` updated.

## 2026-04-21

### Tree panel overhaul — Document item, Page Folders, section headers

- **Document row**: A "Document" item at the very top of the tree panel. Click it to select the
  document and see its properties in the right panel (document name, grid settings, active theme).
- **Page Folders**: New organizational folder type for pages. Folders have no canvas presence — just
  a name and an ordered list of pages they contain. Features:
    - Create via the `+` menu → "Folder"
    - Inline rename (double-click or context menu → Rename)
    - Collapse/expand with chevron button
    - Context menu: Add Page to Folder, Rename, Move Up/Down, Delete Folder (keep pages), Delete
      Folder and Pages
    - Drag a page node onto a folder to assign it to that folder
- **Section headers**: Static "Assets", "Variables", "Styles" sections below pages (empty for now,
  placeholders for future content)
- **Data model**: Added `PageFolder` interface and `pageFolders: PageFolder[]` to `VibeDocument`.
  Helper functions `findFolderForPage` and `getUnfiledPageIds` in `document.ts`. Old documents
  auto-migrate with `pageFolders: []`.
- **State**: Added `documentSelected: boolean` to `AppState`. New actions: `SELECT_DOCUMENT`,
  `SET_FOLDER_COLLAPSED` (view, not undoable); `ADD_PAGE_FOLDER`, `DELETE_PAGE_FOLDER`,
  `RENAME_PAGE_FOLDER`, `ASSIGN_PAGES_TO_FOLDER`, `REMOVE_PAGES_FROM_FOLDER`,
  `REORDER_PAGE_FOLDER` (document, tracked in undo history).
- **New files**: `DocumentRow.tsx/css`, `PageFolderRow.tsx/css`, `SectionHeader.tsx/css`,
  `DocumentSection.tsx`

## 2026-04-20 (7)

### Palette import from Lospec & Coolors

- New utility `src/utils/paletteImport.ts` with parsers for `.hex`/`.txt` files, GIMP `.gpl` files,
  Coolors.co URLs, and a Lospec.com JSON API fetcher
- Added "Import" section to the bottom of the palette list in the Palette Editor modal with:
    - URL input: paste a `lospec.com/palette-list/<slug>` or `coolors.co/<hex>-<hex>-…` URL and
      click Import
    - File upload: pick a `.hex`, `.txt`, or `.gpl` file from disk
    - Error display for bad URLs, failed fetches, or invalid files
- Imported palette is automatically selected after import
- 33 new unit tests covering all parser functions and the fetch helper
- Fixed palette editor dialog height jumping when switching between palettes — set fixed
  `height: 500px` on the modal

## 2026-04-20 (6)

### Grid snapping bug fixes

- Fixed: grid not visible until something moved — SVG grid had `width: 100%; height: 100%` on a
  zero-size canvas div; changed to explicit `left: -10000, top: -10000, width: 20000, height: 20000`
  so it paints immediately on mount
- Fixed: turning off grid snap still snapped shapes until zoom changed — `snapEnabled`/`gridSize`
  were missing from `onPointerMove`'s `useCallback` dependency array, causing stale closure
- Fixed: drag-move snapped shapes to offset grid positions — was snapping absolute cursor position
  then subtracting unsnapped initial position; now snaps total displacement from drag start so
  movement is always in clean grid-size increments

## 2026-04-20 (5)

### Grid snapping

- Added `GridSettings` model (`src/model/grid.ts`) with `size`, `style` ('lines' | 'dots' | 'none'),
  and `snapEnabled` fields; default is 10px lines, snap off
- Added `gridSettings: GridSettings` to `VibeDocument`; old documents load with defaults via
  fallback
- Added optional `gridSettings?: Partial<GridSettings>` per-page override to `PageShape`
- New `UPDATE_GRID_SETTINGS` document action and `TOGGLE_DOCUMENT_SETTINGS_MODAL` view action
- `CanvasGrid` component renders an SVG pattern grid (lines or dots) inside the canvas transform
  div; inherits zoom/pan scaling
- Grid snapping during shape drag: pointer position snapped to grid before computing move delta
- Grid snapping during shape insertion (drag-insert and click-insert): origin, size snapped to grid
- Grid snapping during resize (`SelectionOverlay`): x, y, width, height snapped before
  `SET_TRANSFORM`
- Arrow key nudge uses `gridSize` as step distance when snap is enabled (instead of 1 or 10px)
- Toolbar: grid toggle button (Grid icon) highlights when snap is on; File menu has "Document
  Settings..." entry
- `DocumentSettingsModal`: controls for snap enabled, grid size (1–200 px), and grid style
- `PropertiesPanel`: page shape now shows a "Grid Override" section to set per-page grid settings
- `src/utils/snapping.ts`: `snapToGrid(value, size)` and
  `getEffectiveGridSettings(pageId, shapes, docSettings)` utilities
- 11 new unit tests for `snapToGrid` and `getEffectiveGridSettings` (14 test files, 136 tests total)

## 2026-04-20 (4)

### Bug fixes for nested group editing

- Fixed: double-clicking a nested group while already drilled into a parent group now correctly
  enters the inner group's drill mode
- Fixed: moving a shape inside an inner group was incorrectly moving the outer group instead;
  hit-test bubble-up now exempts all containers in the drill stack, not just the innermost one

## 2026-04-20 (3)

### Nested group drill-mode stack

- Drill mode now supports arbitrary nesting depth using a stack instead of a single
  `drilledInContainerId`
- Double-clicking a nested group while already drilled in pushes the inner group onto the stack
- Pressing Escape pops one level at a time, returning to the parent group rather than jumping to the
  top level
- The breadcrumb label shows the full drill path with `›` separators (e.g. "Editing: Outer Group ›
  Inner Group")
- Outer drill levels remain visible with a faded orange border; the innermost active level shows a
  solid orange border

## 2026-04-20

### Group feature

- **Group shape**: A transparent container that wraps multiple shapes into a logical unit. Bounds
  are auto-computed as the union of all children's bounding boxes.
- **Create group**: Select 2+ shapes → right-click → "Group". The group is placed at the same tree
  level as the selected shapes and all selected shapes become its children.
- **Ungroup**: Right-click a group → "Ungroup" to unwrap children back to the group's parent at
  their original canvas positions.
- **Drill mode**: Double-click a group to enter drill mode and interact with individual children.
  Escape exits drill mode.
- **Hit testing**: Clicking a child of an undrilled group selects/moves the group instead of the
  child.
- **Group bounds recomputation**: Group bounds automatically update when children are moved or
  resized while drilled in.
- **Empty group**: Add an empty group from the Layers panel "+" button under Containers → Group,
  then drag shapes into it.
- **Drag-to-reparent**: Shapes dragged onto a group in the canvas or tree will be reparented into
  it.
- **Nested groups**: Groups can be nested indefinitely; drill mode scopes to the innermost drilled
  group.
- **Delete group**: Deletes the group and all its children.

## 2026-04-19 (2)

### New shape

- **Table**: Grid shape where each line of text is a row and commas separate columns. The first row
  is always the header (bold, filled with stroke color). Double-click to edit raw CSV-style text;
  Cmd/Ctrl+Enter commits. Available in Components > Form Controls. Supports hand-drawn rendering.

## 2026-04-19

### New shapes

- **Sticky Note**: A yellow note shape with a folded top-right corner. Supports editable text (
  double-click). Available in Components > Containers. Works in both clean and hand-drawn themes.
- **List**: A multi-item list control. Text content is newline-separated items. The selected row is
  highlighted with a light blue background. `selectedIndex` (-1 = none) is editable in the
  Properties panel. Double-click to edit items. Available in Components > Form Controls.
- **Scroll Panel**: A titled panel with a decorative scrollbar on the right side. `scrollPosition` (
  0–1) controls the thumb position and is editable in the Properties panel. Title is double-click
  editable. Available in Components > Containers.

All three shapes support hand-drawn (rough) rendering and integrate with undo/redo, selection, and
the canvas context menu.

## 2026-04-17

### Bug fixes

- **Shift+click now removes items from selection**: Shift+clicking an already-selected shape on the
  canvas now deselects it. Previously, `draggingIds` was filtered correctly but no dispatch was made
  to update the selection state, so the item stayed selected.

## 2026-04-16 (3)

### Build

- **Configurable base URL**: Added `base` option to `vite.config.ts` using
  `process.env.VITE_BASE_PATH` (defaults to `/`). Set `VITE_BASE_PATH=/your-path/` at build time to
  deploy to a subdirectory. Installed `@types/node` to support `process.env` in the Vite config.

## 2026-04-16 (2)

### Bug fixes

- **TextField and Select shapes now respect handDrawn theme**: Both components were missing the
  `handDrawn` prop and always rendered with RoughJS. Added plain CSS rendering (border,
  border-radius, background) when the active theme has `handDrawn: false`.
- **Dialog title font now follows active theme**: `DialogShape` model gained `titleFontFamily` and
  `titleColor` fields. New dialogs are created with the active theme's font and foreground color.
  Existing dialogs without those fields fall back to the active theme font passed through
  `ShapeRenderer` (`themeFontFamily` prop), so switching themes updates them without requiring a
  manual reset.
- **Dialog text color separated from border color**: Title text, Cancel label, and OK label now use
  `titleColor` (theme foreground) rather than `stroke.color`, matching how the Panel shape separates
  text from border colors. "Reset to theme" also updates `titleColor`.
- **Inter web font loaded**: Added Inter (weights 400/500/600) to the Google Fonts request in
  `index.html` so the Plain Light and Plain Dark themes render with the correct font rather than
  falling back to the system font.
- **Theme editor duplicate button**: Built-in themes now show an explicit "Duplicate to customize"
  button in the read-only notice. The sidebar "Add theme" button also changes to "Duplicate" (with a
  copy icon) when a built-in theme is selected.

## 2026-04-16

### Features

- **Document themes**: Added a theming system with three built-in themes — Hand Drawn, Plain Light,
  and Plain Dark.
- **Theme model** (`src/model/theme.ts`): `Theme` interface defines foreground, background, border
  color/width/radius, hand-drawn toggle, and font family/size. `getActiveTheme()` helper reads
  active theme from document.
- **Theme Editor** (File → "Edit Themes..."): Left sidebar lists themes (built-ins are
  locked/read-only with a lock icon; custom themes are deletable). Right panel lets you edit all
  theme properties. "Set as active theme" applies the theme to new shapes; "Apply to all shapes"
  resets all existing shapes in the document to the theme's values.
- **New shapes use active theme**: All shape creation paths (canvas draw, context menu, tree panel,
  toolbar) use `getActiveTheme(doc)` to initialize colors, fonts, border styles, and corner radii.
- **Reset to theme**: A "Reset to theme (…)" button in the Properties Panel resets the selected
  shape(s) to the active theme's values (fill color, stroke color/width, corner radius, font
  family/size, text color). Does not affect content (text, images, etc.).
- **handDrawn toggle**: Each of the 11 rough-rendered shape components (Button, Panel, Dialog,
  Checkbox, Radio, Slider, Toggle, Frame, Label, Progress, Stepper) now supports a
  `handDrawn: boolean` prop — when false, renders with plain CSS (border, border-radius, background)
  instead of RoughJS SVG paths. The active theme's `handDrawn` setting is applied document-wide;
  individual shapes can override it via `shape.handDrawn`.
- **Document migration**: Existing documents that don't have `themes`/`activeThemeId` fields are
  automatically migrated to the built-in themes on load.

## 2026-04-14 (3)

### Features

- **Export document as PDF**: Added "Export PDF..." to the File menu. Renders all fixed-size pages
  in document order, one per PDF page, and downloads as `<document-name>.pdf`. Each page uses its
  own dimensions. Pages without a fixed size are skipped.

## 2026-04-14 (2)

### Features

- **Export page as PNG**: Added "Export PNG..." to the File menu. Renders the active page off-screen
  at 1:1 scale (using html2canvas) and downloads it as `<document-name>.png`. Requires the page to
  have a fixed size set; shows a helpful message if the page uses infinite canvas mode.

## 2026-04-14

### Features

- **Settings dialog**: Added a Settings modal (File → Settings...) with configurable zoom speeds.
  Pinch zoom speed (trackpad gesture) and scroll wheel zoom step (mouse wheel) can each be adjusted
  via sliders, with a "Reset to defaults" button. Settings are stored in app state.
- **Smarter pinch detection**: `usePanZoom` now distinguishes pinch gestures (`deltaMode === 0`)
  from mouse wheel clicks (`deltaMode === 1`) and applies separate configurable multipliers to each.

## 2026-04-10 (8)

### Features

- **Drill-in container editing**: Double-clicking a frame, panel, or dialog on the canvas enters a
  focused editing mode for that container. While drilled in, all canvas interactions (hit-testing,
  drag-marquee selection, shape movement) are scoped exclusively to the container's children.
- **Visual feedback**: An orange border highlights the active container and a small "
  Editing: [name]" label appears at the top of the canvas while in drill mode.
- **Exit options**: Double-click outside the container or press Escape to return to normal
  page-level editing.
- **Auto-exit on page change**: Switching the active page automatically clears drill mode.

### Technical

- Added `drilledInContainerId: string | null` to `AppState` (view-only, non-undoable).
- Added `ENTER_DRILL_MODE` and `EXIT_DRILL_MODE` `ViewAction` variants; handled in reducer alongside
  `SET_ACTIVE_PAGE` reset.
- `useCanvasPointer.ts`: `hitTestShapes` and marquee selection both scope to the drilled container's
  `TreeNode.children` when `drilledInContainerId` is set. `onDoubleClick` routes to drill-in vs.
  text-edit based on shape type and current drill state.
- `useDocumentShortcuts.ts`: Escape priority chain is now text-edit → drill-exit → deselect.

---

## 2026-04-10 (7)

### Features

- **Reparent with position compensation**: Moving a shape to a different parent (via the layer tree
  or by dragging on the canvas) now preserves its visual position. The shape's local coordinates are
  recalculated so it appears at the same canvas location after the parent changes.
- **Canvas drag-to-reparent**: Dragging a shape on the canvas so its center lands inside a frame or
  panel automatically reparents it into that container. Dragging it out of all containers reparents
  it back to the active page. Position is compensated in both cases.
- **Tree panel reparent fix**: Drag-and-drop reordering in the layer panel now adjusts local
  coordinates when the parent changes, so the shape stays visually in place.

### Technical

- Added `getContentOrigin(parentId, shapes, parentMap)` to `src/utils/geometry.ts` — returns the
  canvas-space content origin of a given parent shape (used to compute new local coords when
  reparenting).
- Extended `REPARENT_SHAPE` action with optional `x?: number; y?: number` fields; reducer applies
  them atomically with the tree move (single undo step).
- `useCanvasPointer.ts`: on pointer-up after a drag, checks whether each dragged shape has moved
  into or out of a frame/panel and dispatches `REPARENT_SHAPE` with adjusted coordinates if needed.

---

## 2026-04-10 (6)

### Features

- **Color palettes**: Documents now include named color palettes (multiple palettes supported). A
  default "Colors" palette ships with 14 swatches (black, white, grays, blue, green, red, yellow,
  orange, purple, brown, teal, pink).
- **Palette-linked colors**: Every color field (fill, stroke, text color, track/thumb fills, page
  background) can be linked to a palette swatch via `paletteColorId`. Editing a palette color
  instantly updates all linked shapes on the canvas.
- **Swatches in color pickers**: Every `ColorInput` shows a row of circular swatches from all
  palettes. Click a swatch to link the color; using the system picker or hex field sets a raw color
  and unlinks any palette reference.
- **Palette editor**: File → Edit Palettes opens a two-column modal to add/rename/delete palettes
  and their colors. Editing a color dispatches `UPDATE_PALETTE_COLOR` which propagates to all linked
  shapes.
- **Document migration**: v1 documents (no `palettes` field) are automatically migrated to v2 with
  the default palette on load. Document version is now 2.
- **Undo/redo**: All palette actions (`ADD/DELETE/RENAME_PALETTE`,
  `ADD/DELETE/UPDATE_PALETTE_COLOR`) are fully undoable.

### Tests

- New `tests/store/palette.test.ts` — 11 tests covering all palette actions, shape color
  propagation, non-linked shape immunity, name-only updates, and undo.

## 2026-04-10 (5)

### Features

- **Multi-selection properties**: When 2+ shapes are selected the Properties panel now shows
  Transform (x/y/w/h with mixed-value placeholder), Fill, and Stroke sections in addition to
  Visible/Locked toggles. Changing a field applies to all selected shapes.
- **Shape alignment**: New `ALIGN_SHAPES` document action (undoable) aligns selected shapes in 8
  modes: left, center-h, right, top, middle-v, bottom, match-width, match-height. Uses canvas-space
  coordinate math via `computeAlignedTransforms()` in `src/utils/alignment.ts`.
- **Multi-select context menu**: Right-clicking when 2+ shapes are selected (and the target is
  already in the selection) preserves the multi-selection and shows a dedicated menu: Duplicate, 8
  alignment actions, Delete.
- **Bug fix**: `ALIGN_SHAPES` and `DUPLICATE_SHAPES` were not tracked in `DOCUMENT_ACTION_TYPES`, so
  undo/redo did not work for them. Both are now registered.

### Tests

- New `tests/utils/alignment.test.ts`: covers all 8 alignment types plus line-shape exclusion and
  empty-ids edge case.
- New `tests/store/alignment.test.ts`: tests `ALIGN_SHAPES` via `appReducer` and undo via
  `historyReducer`.
- Extended `tests/store/reducer.test.ts`: multi-shape `DELETE_SHAPES` and `DUPLICATE_SHAPES` test
  cases added.

## 2026-04-10 (4)

### Features

- **Full lucide icon picker for Button icon**: Replaced the inline 35-icon grid with a dialog that
  lists all ~1000 lucide-react icons. Type to search by name; active icon highlighted; click to
  select.
- New `src/utils/allLucideIcons.ts` enumerates every exported lucide icon at runtime.
- New `src/components/properties/IconPickerDialog.tsx` — searchable 8-column grid modal.
- `getButtonIcon` now resolves any lucide icon name (not just the original 35).
- Bundle size increases from ~316KB to ~1.1MB uncompressed (~226KB gzip) due to including all icons.
- **Bug fix**: Initial implementation filtered lucide exports by `typeof === 'function'`, which
  excluded all icons because lucide wraps them with `React.forwardRef()` (returns an object, not a
  function). Fixed by using lucide-react's built-in `icons` named export instead.

## 2026-04-10 (3)

### UI

- **Text alignment icon buttons**: Replaced the Align and V-Align dropdowns in the Text properties
  section with icon button groups. Align uses `AlignLeft/Center/Right`; V-Align uses
  `AlignVerticalJustifyStart/Center/End`. Active value highlighted in blue.
- Added `.iconBtnGroup`, `.iconBtn`, `.iconBtnActive` CSS classes to `inputs.module.css` for reuse.

## 2026-04-10 (2)

### Bug Fixes

- **Label vertical alignment**: `LabelShape` was ignoring `text.verticalAlign` — its display div
  used `alignItems: center` (hardcoded) instead of `flexDirection: column` + `justifyContent`. Now
  matches `TextShape` behaviour.

### Refactoring

- Extracted `useTextEdit` hook (`src/components/canvas/shapes/useTextEdit.ts`) containing the
  `useRef`/`useEffect` edit-state logic and textarea event handlers previously duplicated across 6
  shapes.
- Extracted `vAlignToJustify` helper into the same file.
- `TextShape`, `LabelShape`, `ButtonShape`, `CheckboxShape`, `RadioShape`, `ToggleShape` all use
  `useTextEdit` — no more copy-pasted boilerplate.

## 2026-04-10

### Features

- **localStorage document persistence**: Documents can now be saved to and loaded from browser
  localStorage. The Load/Save toolbar buttons are replaced by a "File" dropdown menu containing:
    - **Open...** — shows a list of previously saved documents; click any to load it
    - **Save** — saves the current document (overwrites if previously saved, otherwise prompts via
      Save As)
    - **Save As...** — save with a new name or overwrite an existing document
    - **Import JSON...** / **Export JSON...** — existing file-based import/export, unchanged
- Document name is displayed in the toolbar to show which document is active.
- New files: `src/utils/localStorageDB.ts`, `src/components/layout/DocumentsModal.tsx/.module.css`
- `AppState` gains `documentId` and `documentName` fields; new `SET_DOCUMENT_META` action.
- **New document**: File menu includes a "New" item that creates a blank document without reloading
  the browser.
- **Inline rename**: Clicking the document name in the toolbar makes it editable in-place (Enter or
  blur to confirm, Escape to cancel).
- **Toolbar reorganisation**: File menu and document name moved to the far left; spacer pushes
  drawing tools to the centre; help button anchored to the far right; separator added between Pan
  and Shapes tools.

## 2026-04-09

### Bug Fixes

- **Selection handles offset on new pages**: `getAbsoluteTransform` and `getParentContentOrigin`
  were adding the page's own `transform.x/y` as a coordinate offset for all child shapes. Since
  shapes are stored in absolute canvas coordinates (not page-relative), the page parent is now
  skipped when walking the transform chain. Was invisible on Page 1 (`x:0, y:0`) but caused a
  visible offset on any page created with a non-zero position.
- **New page default position**: `createShape('page')` now defaults to `x:0, y:0` instead of the
  generic `x:50, y:50`.

## 2026-04-08 13:38

### Bug Fixes

- **Ruler numbers legible**: Increased RULER_SIZE from 20 → 28px; vertical labels now use
  `ctx.measureText` for proper centering instead of a fixed char-width estimate; labels drawn in the
  non-tick area of each ruler.
- **Page button now activates new page**: After inserting a page shape from the toolbar,
  `SET_ACTIVE_PAGE` is now dispatched so the canvas immediately switches to the new empty page.

## 2026-04-08 13:10

### Bug Fixes & Improvements

- **Select control text editing**: Double-click to edit the selected value directly on the canvas (
  inline `<input>`). Commit with Enter or Cmd+Enter, cancel with Escape.
- **Text style properties on all text controls**: Added TextSection (font size, weight, family,
  alignment, color) to textfield, select, stepper, checkbox, toggle, and radio in the Properties
  panel.
- **Checkbox/Toggle/Radio now use TextStyle**: Model updated to replace `label: string` with
  `text: TextStyle`, giving full typography control. Renderers updated to use
  `text.fontFamily/fontSize/fontWeight/color`.
- **Canvas ruler numbers fixed**: Ruler canvases now dynamically match their CSS rendered size (
  ×devicePixelRatio for sharpness), so labels render at full size instead of being scaled down from
  a 4000px buffer. Font increased to 11px; minimum tick spacing increased to 12px screen pixels.
- **Toolbar dropdowns no longer render behind canvas**: Added `position: relative` and increased
  z-index to 100 on the toolbar container, ensuring dropdowns always appear above canvas content.
- **Page button in toolbar now works**: Inserting a page shape now uses `parentId: null` (root
  level) instead of the current active page, so pages appear at the document root.

## 2026-04-08 12:40

### Features

- **Canvas ruler**: 20px horizontal and vertical rulers positioned in screen space, origin (0
  label + blue line) aligned to the active page's top-left corner. Ticks adapt their interval based
  on zoom level; origin marker moves correctly with pan/zoom.
- **Titled Panel / plain Panel split**: Existing "Panel" shape is now labelled "Titled Panel"
  everywhere (type remains `'panel'` for document compatibility). A new "Panel" (`type: 'frame'`) is
  a simple container with no title bar — rough rect outline with children nested inside.
- **Dialog shape**: New `'dialog'` type with a rough title bar, a scrollable body area for child
  shapes, a rough footer divider, and two rough-rect buttons (Cancel / OK) with configurable labels.
- **Cmd+drag to duplicate-and-move**: Holding Cmd while dragging a shape creates a duplicate at the
  original position and drags the clone. Pre-generates clone IDs so the drag is immediately
  transferred to the new shape.
- **Lucide icons in context menus**: All unicode glyph icons (`⧉`, `↑↓⬆⬇`, `👁🚫🔒🔓`, `✕`, `📄`)
  replaced with lucide-react components. `ContextMenuItem.icon` widened from `string` to
  `React.ReactNode`.
- **Shapes dropdown in toolbar**: Rect, Circle, and Line moved into a single dropdown button (same
  pattern as Form Controls). Shows the icon of the last-used shape tool.
- **Components dropdown in toolbar**: Renamed from "Form Controls"; now has a "Containers" section (
  Titled Panel, Panel, Dialog) and a "Form Controls" section. Help `?` button added to the right
  side of the toolbar.
- **4 new form controls**: Radio Button (`'radio'`), Select/Dropdown (`'select'`), Progress Bar (
  `'progress'`), Number Stepper (`'stepper'`) — all rendered with rough.js hand-drawn style.
- **Tree view auto-switches active page**: Clicking any non-page shape in the layer tree that
  belongs to a different page now automatically switches the active page.
- **Help modal (`?`)**: Press `?` or click the `?` toolbar button to open a keyboard + mouse
  shortcuts reference modal. Escape or clicking the overlay closes it.

### Internal

- `findAncestorPage` helper added to `document.ts`
- All ruler, pan, zoom, and resize-handle coordinate conversions updated to account for the 20px
  ruler offset
- `DUPLICATE_SHAPES` action accepts an optional `rootIds` array for pre-seeded clone IDs (used by
  Cmd+drag)
- `AppState.showShortcutsModal` + `TOGGLE_SHORTCUTS_MODAL` view action added

## 2026-04-08

### Features

- **Cmd+Enter exits text editing**: Pressing Cmd+Enter (or Ctrl+Enter) while editing text in any
  shape commits the edit and exits text editing mode. Applies to all 7 editable shapes: Text,
  Button, Panel, Label, TextField, Checkbox, Toggle.
- **Duplicate action**: Added `DUPLICATE_SHAPES` document action that deep-clones a shape subtree
  with new IDs, offsets the root clone by (10, 10) in local space, and inserts it after the original
  in the tree. Accessible via Cmd+D keyboard shortcut, canvas right-click context menu, and tree
  node right-click context menu.
- **Zoom 300%/400%**: Added 300% and 400% presets to the zoom dropdown and zoom in/out step
  sequence.
- **Status bar**: Added a 24px status bar at the bottom of the screen. Left corner has a button to
  collapse/expand the layer panel (‹/›), right corner for the properties panel. Center displays the
  name of the currently selected shape, or "N shapes selected" for multi-selection.

### Bug fixes

- **Subshape positioned at mouse cursor**: When right-clicking a shape to add a subshape, the new
  shape's position is now converted from absolute canvas coordinates to parent-local coordinates, so
  it appears under the cursor rather than at the raw canvas position.

## 2026-04-07 11:20

### Features

- **Button icon support**: Buttons can now display a Lucide icon alongside their label. In the
  Properties panel, a new "Icon" section shows a 6-column grid of 36 common icons (arrows, chevrons,
  UI actions, etc.) to pick from. Left/Right radio buttons control which side the icon appears on; "
  None" clears the icon. The icon scales with the button's font size (`fontSize × 1.1`), matches the
  button's text color, and uses a `strokeWidth` of 1.5 for a lighter hand-drawn look. The
  `ButtonShape` model gains an `icon: { name: string; side: 'left' | 'right' } | null` field (
  defaults to `null` for new buttons).

## 2026-04-07 11:10

### Features

- **Caveat handwritten font for form controls**:
  Added [Caveat](https://fonts.google.com/specimen/Caveat) (Google Fonts) to `index.html`. All form
  control shapes default to `Caveat, cursive` — button text, panel title, label, textfield
  value/placeholder display, checkbox label, and toggle label all render in the hand-drawn font,
  complementing the RoughJS sketchy outlines.

## 2026-04-07 11:00

### Features

- **4 new form control shapes with RoughJS rendering**:
    - `Label` — text label with a subtle rough underline. Double-click to edit text.
    - `Text Field` — rough rect with placeholder text (shown in gray when value is empty).
      Double-click to edit displayed value.
    - `Checkbox` — rough 16×16 tick box with a rough checkmark when checked, and a label to the
      right. Double-click to edit label.
    - `Toggle` — rough pill track with a sliding rough circle thumb (moves left/right based on
      `checked` state), label to the right. Double-click to edit label.
- **Form Controls dropdown in toolbar**: Replaced the three individual button/panel/slider toolbar
  buttons with a single "Form Controls" dropdown. Shows the icon of the currently active form
  control; clicking opens a menu with all 7 controls (Button, Panel, Slider, Label, Text Field,
  Checkbox, Toggle).
- **Form Controls section in all context menus**: Both the canvas right-click menu and the tree node
  right-click menu now have separate "Shapes" and "Form Controls" sections when adding shapes. Same
  split applied to the Layers panel `+` add menu.
- **Properties panel**: Added property sections for all 4 new shapes (transform, content, text style
  for label; placeholder, fill, stroke for textfield; checked toggle, fill, stroke for
  checkbox/toggle).

## 2026-04-07 10:10

### Features

- **Space+drag to pan**: Holding Space while dragging on the canvas pans the view regardless of the
  active tool. The cursor changes to `grab` while Space is held. Space key is captured on `keydown`
  when the canvas container is focused to prevent browser scroll.

## 2026-04-07 10:00

### Features

- **Zoom control in toolbar**: Replaced the static zoom label with a `−` / dropdown / `+` control.
  The dropdown offers 25%, 50%, 75%, 100%, 150%, 200% presets; if the current zoom is outside that
  list (e.g. from pinch/scroll) it shows the actual percentage as an extra option. The `−`/`+`
  buttons step through the same presets. All zoom changes use `ZOOM_TO` centered on the viewport so
  the canvas center stays fixed.

## 2026-04-07 09:50

### Features

- **Compact transform panel**: X/Y/W/H/° fields redesigned with a tight grid layout. Each field is a
  bordered pill containing a small label (`X`, `Y`, `W`, `H`, `°`) left-aligned and the number input
  right-aligned, matching the label to its field visually. X+Y share one row, W+H share the next, °
  sits alone on the third row at half-width. Replaced generic `NumberInput` wrappers with a local
  `TField` component for full layout control.

## 2026-04-07 09:35

### Bug fixes

- **Text editing commit on click-outside**: Clicking outside a text textarea was not committing
  changes (text reverted). Root cause: `pointerdown` fires on the canvas before `blur` fires on the
  textarea, so `DESELECT_ALL` cleared `editingTextId` first, causing the textarea to unmount before
  `onBlur` could run. Fixed by watching `isEditing` transitioning `true → false` in a `useEffect`
  instead of relying on `onBlur`. A `cancelRef` tracks whether Escape was pressed so the effect
  knows whether to commit or discard. **Escape** reverts. Clicking anywhere outside commits. Enter
  inserts a newline (multi-line). Applied to `TextShape`, `ButtonShape`, and `PanelShape`.
- **Unit tests**: Added `tests/store/textEditCommitOnDeselect.test.ts` with 7 tests covering:
  `DESELECT_ALL` clears `editingTextId`, `COMMIT_TEXT_EDIT` after `DESELECT_ALL` still saves
  content, cancel path (`STOP_TEXT_EDIT` without commit) for all three shape types, and full commit
  sequences for button and panel.

## 2026-04-07 09:30

### Features

- **Multi-line text with alignment for all text shapes**: `TextShape`, `ButtonShape`, and
  `PanelShape` title now support multi-line text (`white-space: pre-wrap`, `word-break: break-word`)
  and correctly apply both horizontal (`text-align`) and vertical alignment. Display uses a
  `flexDirection: column` container with `justifyContent` for vertical positioning and an inner
  `div` with `textAlign` for horizontal — the inner div has `width: 100%` so alignment applies
  across the full width. `ButtonShape` and `PanelShape` title were also changed from `<input>` to
  `<textarea>` for multi-line editing. Vertical alignment is reflected in the
  `TextStyle.verticalAlign` field already present in the model.

## 2026-04-07 09:25

### Bug fixes

- **Resize handles broken for nested shapes**: `startBbox` in `ResizeHandle` is in canvas space (
  from `getAbsoluteTransform`), but `SET_TRANSFORM` stores coordinates in parent-local space. Added
  `getParentContentOrigin` to `geometry.ts` which returns the canvas-space origin of a shape's
  parent content area. The resize handler now subtracts this origin before dispatching
  `SET_TRANSFORM`, converting canvas-space back to local coordinates.

## 2026-04-07 09:20

### Features

- **Marquee (rubber-band) selection**: Clicking and dragging on the empty canvas background draws a
  selection rectangle. On release, all shapes whose absolute bounding boxes intersect the rectangle
  are selected. Shift+drag adds to the existing selection without deselecting first. The marquee is
  rendered as a thin blue overlay in screen space; hit testing converts the rectangle to canvas
  space and uses `getAbsoluteTransform` to correctly handle nested shapes.

## 2026-04-07 09:15

### Features

- **Shift-constrained square resize**: Holding Shift while dragging any resize handle constrains
  width and height to be equal (square). For corner handles the opposite corner stays fixed. For
  edge handles the shape grows symmetrically around the perpendicular axis.

## 2026-04-07 09:10

### Features

- **Tree view drag-and-drop reparenting**: Each tree row is now draggable. Hovering the top 25% of a
  row shows a "before" indicator (blue top border), the bottom 25% shows "after" (blue bottom
  border), and the middle shows "into" (blue background highlight). Dropping dispatches
  `REPARENT_SHAPE` with the correct `newParentId` and `index`, including same-parent index
  adjustment (when dragging within the same parent, the target's index shifts after removal). Added
  `parentId` and `nodeIndex` props to `TreeNodeComp` to carry the positional context needed for the
  index calculation.

## 2026-04-07 09:00

### Bug fixes

- **Nested shape click selection and selection overlay**: Shapes inside panels (or other containers)
  couldn't be clicked to select in the canvas, and the selection overlay was drawn at the wrong
  position. Root cause: both `hitTestShapes` and `SelectionOverlay` were treating shape
  `transform.x/y` as canvas-absolute coordinates, but for nested shapes those are parent-relative.
  Fixed by adding `buildParentMap` and `getAbsoluteTransform` helpers to `geometry.ts` that walk the
  tree to compute absolute canvas-space positions (including the panel title-bar Y offset for panel
  children). Both `useCanvasPointer` and `SelectionOverlay` now use these helpers.

## 2026-04-07 08:55

### Bug fixes

- **Canvas context menu delete not working**: Clicking a menu item in the canvas context menu (a
  React portal) was bubbling `pointerdown`/`pointerup`/`click` through the React component tree into
  the canvas container's `onPointerDown` handler, which called `setPointerCapture` and dispatched
  `DESELECT_ALL`, preventing delete from completing and the menu from closing. Fixed by adding
  `stopPropagation` for `onPointerDown`, `onPointerUp`, `onClick`, and `onContextMenu` on the
  `ContextMenu` div — applies to both canvas and tree context menus.
- **Unit test**: Added `tests/store/canvasContextMenu.test.ts` with 5 tests covering the delete
  action sequence (shape removed from map, removed from tree, selection cleared, other shapes
  unaffected, full action sequence).

## 2026-04-07 08:34

### Features & fixes

- **Canvas context menu**: Right-clicking anywhere on the canvas now shows a context menu.
  Right-clicking a shape selects it and shows: Add Child Shape submenu, Bring to Front/Send to
  Back/Move Up/Move Down, Hide/Show, Lock/Unlock, Delete. Right-clicking empty canvas shows an Add
  Shape submenu (all types inserted at the cursor position, added to the active page). Implemented
  in `CanvasContextMenu.tsx`; `useCanvasPointer` exposes `onContextMenu`/`contextMenu`/
  `closeContextMenu`.
- **Stable rough.js seeds**: `seedFromId` helper derives a deterministic seed from each shape's UUID
  so hand-drawn paths don't jitter on re-render when shapes are moved. Added to `roughPaths.ts`;
  used in ButtonShape, PanelShape, and SliderShape.

## 2026-04-06 15:10

### Features & fixes

- **Hand-drawn UI components via rough.js**: `ButtonShape`, `PanelShape`, and `SliderShape` now
  render using the rough.js generator API (`roughRect`, `roughCircle`, `roughLine`) producing
  sketchy/hand-drawn SVG paths. Each component renders an absolute SVG overlay with `RoughSvgPaths`
  for the background, plus HTML overlay for text/children. PanelShape includes a rough divider line
  below the title bar. SliderShape renders a rough rect track and rough circle thumb positioned by
  `value`.
- Added `src/utils/roughPaths.ts` (generator utilities) and `src/utils/RoughSvgPaths.tsx` (SVG path
  component).

## 2026-04-06 14:53

### Features & fixes

- **Context menu on tree nodes**: Right-click any tree item to get a contextual menu. Pages show "
  Set as Active Page" + "Add Shape" submenu (all shape types). Non-page shapes show "Add Child
  Shape" submenu + Move Up/Down/To Front/To Back + Hide/Lock + Delete.
- **Light mode theme**: All panels, toolbar, canvas, and inputs converted from dark to light.
- **Wider properties panel**: Default 300px, resizable.
- **Resizable sidebars**: Drag handles between panels allow resizing both the left tree sidebar and
  right properties panel (min 150px, max 500px).
- **Locked shapes**: Locked shapes cannot be moved or have properties changed via the reducer (
  `MOVE_SHAPES`, `SET_TRANSFORM`, `PATCH_SHAPE` all bail out for locked shapes, except
  visibility/lock toggles). Properties panel shows a yellow banner and dims/disables the property
  sections while still showing values.
- **Selection overlay pan offset fix**: `SelectionOverlay` was rendering inside the CSS-transformed
  canvas div but then re-applying `panX/panY/zoom`, doubling the offset. Fixed to use canvas-space
  coordinates directly; handle sizes divided by `zoom` to stay visually constant.
- **Line rendering fix**: SVG path coordinates were in world space but the SVG was positioned at
  `(minX, minY)`. Path points now subtract `minX/minY` to be in SVG-local space.
- **Line selection fix**: Hit testing was skipping all lines. Added `pointNearLine` hit test with a
  tolerance scaled by `1/zoom`.
- **Lucide-react icons**: Replaced emoji/unicode icons in toolbar and tree panel with lucide-react
  icons.
- **Reparenting via context menu**: "Move into" shape nesting is available via the context menu "Add
  Child Shape" flow (creates shape as child of target node).

## 2026-04-06 14:42

### Bug fixes

- **Double-click text editing broken**: `setPointerCapture` on the canvas container retargets all
  derived mouse events (including `dblclick`) to itself, so `onDoubleClick` on shape divs never
  fired. Fixed by adding `onDoubleClick` directly to the container in `useCanvasPointer` — it
  hit-tests the position and dispatches `START_TEXT_EDIT` for text-bearing shapes (text, button,
  panel).
- **Text content not editable from properties panel**: `TextSection` only exposed style properties (
  color, font size, alignment). Added a `ContentSection` component with a textarea that dispatches
  `COMMIT_TEXT_EDIT` on change. Added to the properties panel for `text`, `button`, and `panel`
  shape types.
- Added 10 unit tests covering `START_TEXT_EDIT`, `STOP_TEXT_EDIT`, `COMMIT_TEXT_EDIT` (for all
  three shape types, undoability, no-ops), and `PATCH_SHAPE` for text style properties.

## 2026-04-06 12:07

Initial implementation of Vibe 2D Layout.

### Data Model (`src/model/`)

- `shapes.ts`: Discriminated union of all shape types (rect, circle, line, text, image, page,
  button, panel, slider) with shared style interfaces (FillStyle, StrokeStyle, TextStyle)
- `document.ts`: VibeDocument with flat normalized shape map + separate TreeNode topology; tree
  helpers (findNode, removeNode, insertNode, getAllIds)
- `transform.ts`: BoundingBox, Point, Anchor types
- `connector.ts`: ConnectorEndpoint (free | attached) and ConnectorRoute

### Store (`src/store/`)

- `types.ts`: AppState, all AppAction discriminated union (DocumentAction, SelectionAction,
  ViewAction, HistoryAction)
- `reducer.ts`: Pure reducer handling all actions; screen↔canvas coordinate helpers
- `history.ts`: Undo/redo via snapshot ring-buffer (max 100); only DocumentActions create history
  entries
- `context.tsx`: Two separate React contexts (state + dispatch) to avoid unnecessary re-renders
- `selectors.ts`: Derived state helpers

### Utilities (`src/utils/`)

- `geometry.ts`: anchorPoint, pointInBox, pointNearLine, unionBoxes, distance, rotatePoint
- `connectors.ts`: resolveEndpoint, buildConnectorPath (straight/orthogonal/curved), arrowMarkerPath
- `serialization.ts`: toJSON/fromJSON with validation, downloadJSON, uploadJSON
- `shapeFactory.ts`: createShape factory with sensible defaults per type
- `idgen.ts`: crypto.randomUUID-based ID generation

### Components (`src/components/`)

- Three-column app shell (sidebar 220px | canvas flex | properties 260px) with dark theme
- **Canvas**: Pan/zoom, shape rendering (HTML div-based), selection overlay with 8 resize handles,
  connector line rendering (SVG), inline text editing
- **Toolbar**: Tool mode buttons, undo/redo, zoom display, save/load
- **Tree panel**: Recursive tree view, expand/collapse, visibility/lock/delete per node, add shape
  menu
- **Properties panel**: Per-shape type sections (Transform, Fill, Stroke, Text, Image, Connector,
  Page)

### Hooks (`src/hooks/`)

- `useCanvasPointer`: Pointer state machine for select/pan/insert tool modes
- `usePanZoom`: Wheel event handler for zoom (Ctrl+wheel) and pan
- `useDocumentShortcuts`: Keyboard shortcuts (undo, redo, delete, arrows, escape, select-all)

### Tests (`tests/`)

- 64 unit tests across 6 test files covering document tree operations, geometry, connector routing,
  serialization, reducer actions, and undo/redo history

## 2026-04-23 09:05

- Converted all inline `<div className={styles.section}>` blocks in `PropertiesPanel.tsx` to use
  `<CollapsibleSection>` (21 sections total)
- Removed unused `styles` import from ContentSection, FillSection, PageSection, ShadowSection,
  StrokeSection

## 2026-04-23 09:15

- Added `scaleX`, `scaleY`, `skewX`, `skewY` optional fields to `BoundingBox` in
  `src/model/transform.ts`
- Added `buildCSSTransform(t)` utility that composes rotate/scale/skew into a CSS transform string
- Updated all 25 shape renderers to use `buildCSSTransform(transform)` instead of inline rotate-only
  expression
- Added SX (scale X %), SY (scale Y %), KX (skew X °), KY (skew Y °) inputs to `TransformSection`

## 2026-04-23 09:25

- Reordered Transform section fields: X/Y, W/H, SX/SY, KX/KY, °
- Widened `.tlabel` from 10px to 14px to fit 2-char labels (SX, SY, KX, KY)

## 2026-04-23 09:40

- Fix: shapes being dragged on a secondary page could be silently reparented to containers on
  another page
- Root cause: `findDropTarget` in `useCanvasPointer.ts` walked all pages' shape trees; since pages
  default to canvas origin (0,0), page 1 containers matched drop targets for shapes on page 2
- Fix: scope `findDropTarget` to active page's children only, via new `activePageId` parameter
