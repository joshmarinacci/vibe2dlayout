## 2026-04-23 22:00

### Fix variable font axis sliders not appearing for Roboto Flex

Two fixes:
- `src/utils/fontFeatures.ts` — the broad CSS2 API request (`ital,opsz,wdth,wght@0,...`) was using an invalid tuple format (mixing a discrete ital value with axis ranges), causing a 400 for many fonts. Replaced with a `wdth,wght@25..151,100..900` request (valid for all Google variable fonts) with a simpler `wght@100..900` fallback.
- `src/components/properties/PropertiesPanel.tsx` — `activeFont` was derived from the raw `shape.text.fontFamily`, which is wrong when the font is inherited from a named text style. Now uses `resolveTextStyle(...)` to get the effective font family, matching what TextSection actually displays.

## 2026-04-23 21:45

### Fix variable font detection always showing "Detecting…"

Root cause: `detectVariableAxes` used opentype.js to parse the font file, but modern browsers always receive WOFF2 from Google Fonts (which opentype.js cannot parse), so `resolveFontUrl` always returned `null`. Replaced with a CSS2 API approach:

- Fetches the font with a broad axis range request (`ital,opsz,wdth,wght@0,6..144,...`); if Google Fonts rejects it (HTTP 400 for unsupported axes), falls back to a simpler `wght@1..1000` request
- Parses the CSS response: `font-weight: X Y` (range) → wght axis; `font-stretch: X% Y%` → wdth; `font-style: oblique Xdeg Ydeg` → slnt
- Static fonts return only discrete weight values — no range match → empty axes array → `isVariable: false`

## 2026-04-23 21:00

### Google Fonts improvements: validation, font info panel, variable font axes

**Data model**
- `src/model/document.ts` — `customFonts: string[]` upgraded to `customFonts: CustomFont[]`; added `FontAxis` and `CustomFont` interfaces (`name`, `isVariable: boolean | null`, `axes: FontAxis[]`)
- `src/model/shapes.ts` — added `fontVariationSettings?: Record<string, number>` to `TextStyle`
- `src/utils/serialization.ts` — migration: existing `string[]` entries are converted to `{ name, isVariable: null, axes: [] }` on load

**Store**
- `src/store/types.ts` — `ADD_CUSTOM_FONT` payload changed to `font: CustomFont`; added `UPDATE_CUSTOM_FONT_META`, `SELECT_FONT` actions; added `selectedFontName: string | null` to `AppState`
- `src/store/reducer.ts` — updated all font cases; `SELECT_FONT` clears other selections; `selectedFontName` cleared on any selection action; `LOAD_DOCUMENT` normalizes the string→object migration
- `src/store/history.ts` — `UPDATE_CUSTOM_FONT_META` added as undoable

**Variable font detection**
- `src/utils/fontFeatures.ts` — added `detectVariableAxes(fontFamily)` using opentype.js fvar table (reuses existing `resolveFontUrl` helper)
- `src/hooks/useFontMetadataEnrichment.ts` — new hook; watches `customFonts` for `isVariable === null` entries and enriches them asynchronously via `detectVariableAxes`
- `src/components/layout/AppShell.tsx` — added `useFontMetadataEnrichment` call alongside `useDynamicFonts`

**CSS rendering**
- `src/utils/textStyleCSS.ts` — `textExtraCSS` now includes `fontVariationSettings` → `font-variation-settings` CSS (covers all shape renderers)
- `src/utils/textShapeCss.ts` — `textStyleToCss` also outputs `font-variation-settings` for CSS export

**Tree panel**
- `src/components/tree/FontsSection.tsx` — validation: fetches Google Fonts CSS2 API before dispatching, shows error if `@font-face` absent; font rows are clickable (dispatches `SELECT_FONT`); "var" badge shown for variable fonts; selected row highlighted
- `src/components/tree/TreePanel.tsx` — passes `selectedFontName` to `FontsSection`

**Properties panel**
- `src/components/properties/sections/FontInfoSection.tsx` — new: shows font name (in its own typeface), variable/static/detecting label, read-only axes table, Remove button
- `src/components/properties/sections/TextSection.tsx` — added `activeFont?: CustomFont | null` prop; axis sliders rendered when font is variable; `fontVariationSettings` added to `STYLE_FIELDS`
- `src/components/properties/PropertiesPanel.tsx` — `selectedFontName` guard renders `FontInfoSection`; all `TextSection` calls pass `customFontNames` and `activeFont`

## 2026-04-23 20:15

### Fix "Export CSS" menu item doing nothing

Root cause: `onClose()` was unmounting `CanvasContextMenu` before the local `setCssDialogShape` state update committed, so the dialog never rendered. Fixed by lifting dialog state to `CanvasView`:
- `CanvasContextMenu` — removed local `cssDialogShape` state; now accepts `onShowCssDialog` prop and calls it before `onClose()`; `CssDialogState` interface exported for callers
- `CanvasView` — holds `cssDialog` state, passes `onShowCssDialog={setCssDialog}` to `CanvasContextMenu`, renders `<TextCssDialog>` when `cssDialog !== null`

## 2026-04-23 20:00

### Export CSS for text shapes

- `src/utils/textShapeCss.ts` — `textStyleToCss(text, selector)` converts a `TextStyle` to a CSS rule block covering font-family, font-size, font-weight, font-style, text-align, line-height, letter-spacing, text-decoration, text-transform, font-variant-caps, color (or gradient via background-clip trick), and text-shadow
- `src/components/canvas/TextCssDialog.tsx` — modal dialog with a read-only monospace textarea (click to select all), a "Copy to Clipboard" button, and a "Dismiss" button; rendered via portal so it sits above everything
- Added "Export CSS" context menu item (Code2 icon) for `text` shapes in `CanvasContextMenu`; the selector is derived from the shape name

## 2026-04-23 19:30

### Fix context menu: shapes not added when selected from sub-menu

The window `pointerdown` capture listener in `ContextMenu` was calling `onClose()` immediately when a click landed inside a portal-rendered sub-menu (because the portal node is outside `menuRef`), unmounting the component before the `click` event fired and the `onClick` dispatch ran. Fix: use `e.composedPath()` to also check whether the click landed inside any element with `data-submenu="true"`, and skip `onClose()` in that case.

## 2026-04-23 19:00

### Fix sub-menu dismissal on mouse-out

- Replace instant `onMouseLeave` close with a 300 ms debounced close in both `ContextMenu.tsx` (portal-based sub-menus) and `Toolbar.tsx` (component dropdown sub-menus)
- `cancelClose`/`scheduleClose` (ContextMenu) and `cancelSubMenuClose`/`scheduleSubMenuClose` (Toolbar) cancel the timer whenever the cursor enters either the parent row or the sub-menu, giving the cursor time to travel across any gap
- Reduced the sub-menu offset from +2 px to –4 px overlap in `ContextMenu` so the parent row and sub-menu share a common hover zone with no gap

## 2026-04-23 18:00

### Pixel image editor

- New `PixelAsset` document asset (`src/model/pixelAsset.ts`): flat RGBA pixel array, `createEmptyPixelAsset`, `setPixel`, `hexToRgba` helpers
- `VibeDocument` gains `pixelAssets: PixelAsset[]`; serialization migration fills it in for older documents
- New `PixelImageShape` shape type (`type: 'pixelimage'`, `assetId` reference); added to shape union, `shapeFactory`, `ShapeRenderer`
- Store: `ADD_PIXEL_ASSET`, `UPDATE_PIXEL_ASSET`, `DELETE_PIXEL_ASSET` document actions (undo-tracked); `START_PIXEL_EDIT`, `STOP_PIXEL_EDIT`, `SELECT_PIXEL_ASSET` view actions; `editingPixelAssetId` and `selectedPixelAssetId` in `AppState`; `DELETE_PIXEL_ASSET` also removes referencing shapes
- `PixelImageShapeComp`: renders pixels as `cellW×cellH` rectangles on a `<canvas>`; checkerboard CSS background for transparent pixels; "16×16" placeholder when asset missing
- `PixelEditorOverlay`: full in-place pixel editor opened by double-clicking a pixel image shape. Pencil, line (Bresenham), and eraser tools; palette color swatches + custom color picker; grid lines; double-click outside canvas to close; each completed stroke dispatches one `UPDATE_PIXEL_ASSET` for undo
- Toolbar: added "Pixel Image" (`Grid2X2` icon) to the Shapes dropdown; `insert-pixelimage` tool mode creates asset + shape together on pointer up
- Tree panel: `PixelAssetsSection` lists pixel assets under Assets with rename (double-click), usage count, and delete
- Properties panel: `PixelImageSection` for `pixelimage` shapes (asset name, pixel size, "Edit Pixels" button); separate panel for selected pixel asset (size, usage count, "Edit Pixels" button)

## 2026-04-23 16:30

### Unit tests for export bounds computation

- Extracted `applyTransform`, `shapeCorners`, `computeVisualBounds` from `exportPng.tsx` into `src/utils/exportBounds.ts` so they can be tested independently
- Added `tests/utils/exportBounds.test.ts` with 18 tests covering: identity, 90°/180° rotation, scaleX/Y, skewX/Y, axis-aligned bounds, rotated bounds (including the 100×20 @ 45° case that reveals visual width ≈ 84.9px — less than 100), multi-shape spanning, scaled shapes, skewed shapes, and line-shape filtering

## 2026-04-23 16:15

### Fix group PNG export clipping transformed shapes

- Render into a padded container (200px each side) so CSS-transformed shapes (rotation/scale/skew) that visually overflow their bounding box are not clipped
- After html2canvas captures the padded canvas, crop back to the exact group dimensions using a secondary canvas `drawImage` call

## 2026-04-23 16:00

### Export group as PNG

- Added `exportGroupAsPng(groupId, state)` to `src/utils/exportPng.tsx`: renders the group's children into an off-screen container sized to the group's bounding box and captures it with html2canvas (transparent background)
- Added "Export as PNG" context menu item (with FileImage icon) for group shapes in `CanvasContextMenu.tsx`, alongside the existing Ungroup item

## 2026-04-23 15:30

### UX improvements batch

**Snap toggle (Feature 1):**
- Added `snapAlignment: boolean` field to `GridSettings` in `src/model/grid.ts` (default `true`)
- Added migration in `src/utils/serialization.ts` for older docs missing this field
- Added Magnet toolbar button next to grid snap button to toggle alignment/guide snap on/off
- `src/components/canvas/useCanvasPointer.ts` reads `gridSettings.snapAlignment` to conditionally call `computeAlignmentSnap`

**NumberInput arrow keys (Feature 2):**
- `src/components/properties/inputs/NumberInput.tsx`: ArrowUp/Down keys now increment/decrement the value by `step` (default 1) when the field contains a plain number (not a `@variable` reference)

**Reset transform button (Feature 3):**
- `src/components/properties/sections/TransformSection.tsx`: Added "Reset transform" button below the grid; resets rotation to 0, scaleX/scaleY to 1, skewX/skewY to 0

**Components sub-menus (Feature 4):**
- `src/components/toolbar/Toolbar.tsx`: Components dropdown now shows "Containers ›" and "Form Controls ›" items; hovering each reveals a flyout sub-menu with the respective tools

**Single undo for drag (Feature 5):**
- Added `MOVE_SHAPES_START` action (DocumentAction): records the undo anchor exactly once when a drag begins
- Added `DRAG_SHAPES` action (DragAction, NOT in history): applies incremental moves without creating undo entries
- `src/store/types.ts`: Added `MOVE_SHAPES_START` to `DocumentAction` and new `DragAction` union; added `DragAction` to `AppAction`
- `src/store/history.ts`: Added `MOVE_SHAPES_START` to `DOCUMENT_ACTION_TYPES`
- `src/store/reducer.ts`: Routes `MOVE_SHAPES_START` through `applyDocumentAction` (no-op); routes `DRAG_SHAPES` to `MOVE_SHAPES` logic without history recording
- `src/components/canvas/useCanvasPointer.ts`: Dispatches `MOVE_SHAPES_START` once when drag threshold is crossed, then `DRAG_SHAPES` for each subsequent mouse move

**CollapsibleSection persistence (Feature 6):**
- `src/components/properties/CollapsibleSection.tsx`: Module-level `Map<string, boolean>` stores open/closed state by section title; state is preserved when switching selected objects

## 2026-04-23 14:00

### Multiple box shadows + gradient editor fixes

**Multiple box shadows:**
- Changed `ShapeBase.boxShadow` from `BoxShadow | null` to `BoxShadow[]` (array) in `src/model/shapes.ts`
- Updated `src/utils/shadowCSS.ts` to map the array into a comma-joined CSS `box-shadow` value
- Added migration in `src/utils/serialization.ts`: old `BoxShadow | null` values are converted to `[]` or `[shadow]` on document load
- Redesigned `ShadowSection` component: shows "+ Add Shadow" button, each shadow in a compact sub-panel with Color, X/Y row, Blur/Spread row, Inset checkbox, and × remove button

**Gradient editor fixes:**
- Wrapped gradient controls in a visually distinct sub-panel that only appears when Gradient mode is active; Solid/Gradient toggle always visible
- Added a gradient preview bar (12px tall CSS linear-gradient div) at the top of the sub-panel
- Redesigned stop rows: removed "Stop N" label, color swatch fills available width (`flex: 1`), position input is explicitly `60px` wide so it no longer overflows
- Fixed gradient rendering bug: extracted gradient CSS from `textExtraCSS` into new `textGradientSpanCSS()` in `src/utils/textStyleCSS.ts`; each text-rendering shape now wraps content in an inline `<span>` with the gradient styles (inline elements have reliable `background-clip: text` support)
- Updated shapes: `TextShape`, `LabelShape`, `ButtonShape`, `StickyNoteShape`, `PanelShape`, `TextFieldShape`

## 2026-04-23 12:15

- Moved Color/Gradient and Shadow to the bottom of the Text section (they are appearance effects, not core typography properties)
- Final Text section order: Style → Font → Size → Weight/Italic/SmallCaps → Alignment → Spacing → Decoration → Transform → Color → Shadow

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

- Context menu now scrolls when it's taller than the viewport (`max-height: calc(100vh - 16px)` + `overflow-y: auto`)
- Repositioning logic improved: clamps to all four viewport edges with 8px margin (previously only handled right/bottom overflow)

## 2026-04-23 11:30

- Added `fontVariantCaps?: 'normal' | 'small-caps'` to `TextStyle` model
- Applied via `fontVariant: 'small-caps'` CSS in `textExtraCSS`
- Added Small Caps toggle (ALargeSmall icon) next to italic button in TextSection
- Added `src/utils/fontFeatures.ts` with `detectSmallCaps()` using opentype.js:
  - Fetches the Google Fonts CSS link tag for the current font
  - Extracts a TTF/WOFF1 URL (opentype.js cannot parse WOFF2)
  - Parses GSUB feature tables to check for the `smcp` OpenType feature
  - Returns null when detection is impossible (WOFF2 only / not a Google Font)
- Toggle shows dimmed when font is confirmed to lack native smcp; full opacity when supported or unknown
- Installed `opentype.js` + `@types/opentype.js`

## 2026-04-23 11:15

- Double-clicking any item in the tree view opens an inline name editor
  - Shapes and pages: dispatches `PATCH_SHAPE` with new name on commit
  - Document row: dispatches `SET_DOCUMENT_META` with new name on commit
  - Page folders: already supported (no change needed)
- Enter/Blur commits; Escape cancels; drag is disabled while editing

## 2026-04-23 11:00

- Font weight dropdown now detects which weights the selected font actually supports via the CSS Font Loading API (`document.fonts`)
- System fonts (not in `document.fonts`) fall back to showing all 9 weights
- Web fonts (Google Fonts, custom fonts) show only their registered weight variants
- Re-checks after `document.fonts.ready` resolves so async-loaded fonts are handled correctly

## 2026-04-23 10:45

- Added italic toggle button to Text section in PropertiesPanel (toggles `fontStyle` between `'normal'` and `'italic'`)
- Expanded font weight dropdown from Normal/Bold to full 9-step range: Thin (100), ExtraLight (200), Light (300), Normal (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800), Black (900)
- Reset-to-style buttons shown for both `fontWeight` and `fontStyle` when a named text style is active

## 2026-04-23 09:25

- Reordered Transform section fields: X/Y → W/H → SX/SY → KX/KY → °
- Widened `.tlabel` from 10px to 14px to fit 2-char labels

## 2026-04-23 09:15

- Added `scaleX`, `scaleY`, `skewX`, `skewY` optional fields to `BoundingBox` in `src/model/transform.ts`
- Added `buildCSSTransform(t)` utility that composes rotate/scale/skew into a single CSS transform string
- Updated all 25 shape renderers to use `buildCSSTransform(transform)` instead of inline rotate-only expression
- Added SX (scale X %), SY (scale Y %), KX (skew X °), KY (skew Y °) inputs to `TransformSection`

## 2026-04-23 09:05

- Added `CollapsibleSection` component (`src/components/properties/CollapsibleSection.tsx`) with chevron toggle and `defaultOpen` prop
- Added `.sectionTitleRow`, `.sectionChevron`, `.sectionChevronOpen`, `.sectionBody` CSS classes to `PropertiesPanel.module.css`
- Converted all 15 standalone section components to use `<CollapsibleSection>` in place of the raw `<div className={styles.section}>` pattern
- Converted all 21 inline `<div className={styles.section}>` blocks in `PropertiesPanel.tsx` to use `<CollapsibleSection>`
- Removed now-unused `styles` import from ContentSection, FillSection, PageSection, ShadowSection, StrokeSection

## 2026-04-23 (gradient text fill + dynamic gradient stops)

- Added `textGradient?: LinearGradient | null` to `TextStyle` in `src/model/shapes.ts` and to `TextStyleDef`
- `textExtraCSS()` handles `textGradient` via CSS `background-clip: text` + `WebkitTextFillColor: transparent`
- `TextSection` color control replaced with Solid / Gradient toggle matching the fill gradient editor
- `FillSection` and `TextSection` gradient editors now support dynamic stop count: add stops (inserted into largest gap), remove stops (min 2), per-stop position input (%)

## 2026-04-23 (Phases 2–4: stroke dash, per-corner radius, box shadow, linear gradients)

### Phase 2: Stroke dash style + per-corner border radius

**Stroke dash style:**
- Added Solid / Dashed / Dotted selector to the Stroke section in the properties panel
- Stroke `dash` array was already in the model; now exposed in the UI
- Created `src/utils/strokeStyleCSS.ts` with `strokeBorderCSS` and `dashToBorderStyle` utilities
- All 17 CSS-rendered shape components updated to use `strokeBorderCSS` instead of the `border:` shorthand

**Per-corner border radius:**
- Added `CornerRadii` interface to `src/model/shapes.ts`
- Added `cornerRadii?: CornerRadii` to RectShape, ButtonShape, FrameShape, PanelShape, ScrollPanelShape
- Added `cornerRadiiCSS(uniform, radii?)` utility to `strokeStyleCSS.ts`
- All 5 relevant shape renderers updated to use `cornerRadiiCSS`
- Properties panel: new `CornerRadiusControl` component — shows a single radius input with a toggle button (⌗) to expand into 4 per-corner inputs (TL/TR/BR/BL)

### Phase 3: Box shadow on shapes

- Added `BoxShadow` interface to `src/model/shapes.ts` and `boxShadow?` to `ShapeBase` (applies to all shapes)
- Created `src/utils/shadowCSS.ts` with `boxShadowCSS` utility
- All 25 non-line, non-page shape renderers updated to spread `boxShadowCSS(shape)` onto the outer div
- Created `src/components/properties/sections/ShadowSection.tsx` with enable/disable toggle, Color, X, Y, Blur, Spread, and Inset controls
- `ShadowSection` added to all non-line shape cases in `PropertiesPanel`

### Phase 4: Linear gradients on fills

- Added `LinearGradient` interface and `gradient?: LinearGradient | null` to `FillStyle` in `src/model/shapes.ts`
- Created `src/utils/fillCSS.ts` with `fillBackground(fill)` — returns linear-gradient CSS when gradient is set, otherwise returns solid color
- All 16 shape renderers that render a fill background updated to use `fillBackground(fill)` instead of `fill.color`
- `FillSection` updated with Solid / Gradient mode toggle; gradient mode shows: angle input, start color, end color, opacity

## 2026-04-22 (Phase 1: extended text typography properties)

### Feature: Line height, letter spacing, text decoration, text transform

Added four new optional text properties to all text shapes and named text styles:

- **Line Height** — CSS multiplier (0.5–4); number input in Text section
- **Letter Spacing** — pixel offset (–10 to 50px); number input in Text section
- **Text Decoration** — Underline / Strikethrough / both; icon toggle buttons (Lucide icons)
- **Text Transform** — None / Uppercase / Lowercase / Capitalize; select dropdown

All four fields:
- Live in `TextStyle` in `src/model/shapes.ts` as optional fields (no migration needed)
- Are rendered via the expanded `textExtraCSS()` utility in `src/utils/textStyleCSS.ts` (replaces `textShadowCSS`)
- Apply in all 13 text-rendering shape components (ButtonShape, CheckboxShape, LabelShape, ListShape, PanelShape, RadioShape, SelectShape, StepperShape, StickyNoteShape, TableShape, TextFieldShape, TextShape, ToggleShape)
- Are tracked as style overrides when a named text style is applied
- Are editable in named text style definitions (TextStyleDefSection) with optional field checkboxes

`textShadowCSS` is kept as a deprecated alias so nothing breaks.

## 2026-04-22 (custom Google Fonts)

### Feature: Add custom Google Fonts to a document

Users can now type any Google Fonts family name in Document Settings → Custom Fonts and click Add (or press Enter). The font is saved to the document, dynamically loaded via a `<link>` tag injection, and immediately available in the Font dropdown across all text shapes and text style definitions.

- Fonts persist in the document JSON and are re-loaded on open
- Undo/redo supported for add/remove operations
- Font names shown in their own typeface in the font list
- Old documents without `customFonts` field migrate automatically

**Files added:** `src/hooks/useDynamicFonts.ts`  
**Files modified:** `src/model/document.ts`, `src/store/types.ts`, `src/store/history.ts`, `src/store/reducer.ts`, `src/components/layout/AppShell.tsx`, `src/components/layout/DocumentSettingsModal.tsx`, `src/components/properties/sections/TextSection.tsx`, `src/components/properties/sections/TextStyleDefSection.tsx`, `src/components/properties/PropertiesPanel.tsx`

## 2026-04-22 14:00 (text-shadow CSS support for all text shapes)

### Feature: text-shadow applied to all display-mode text renderers

Added `import { textShadowCSS } from '@utils/textStyleCSS'` and spread `...textShadowCSS(text)` (or `title` for PanelShape) into the display-mode text style object of every text-rendering shape component. Textarea/input editing styles are intentionally unchanged.

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

`onPointerMove`'s `useCallback` had a stale closure that didn't include `state.document` in its deps, so newly-added guides were invisible to the snap computation. Fix: extract guide positions into a `pageGuidesRef` that's updated on every render (outside any callback), so the snap logic always reads fresh guide data via the ref.

**Files modified:** `src/components/canvas/useCanvasPointer.ts`

## 2026-04-22 (page snap + user guides)

### Add page boundary snapping and user-created guide lines

**Page boundary snapping:** When a fixed-size page is active, its edges and center lines are included as snap targets alongside other shapes.

**User guide lines:**
- Drag from the horizontal ruler (top) to create a horizontal guide line
- Drag from the vertical ruler (left) to create a vertical guide line  
- Drag an existing guide line to reposition it
- Double-click a guide to delete it
- Guides persist in the document (saved per-page), are undoable/redoable, and act as snap targets when dragging shapes

Guide lines render in blue (`#4d94ff`) inside the canvas. Snap guide lines (pink) still render over them during alignment snapping.

**Files added:** `src/model/guide.ts`, `src/components/canvas/CanvasGuides.tsx`  
**Files modified:** `src/model/shapes.ts`, `src/store/types.ts`, `src/store/reducer.ts`, `src/store/history.ts`, `src/utils/alignmentSnap.ts`, `src/components/canvas/useCanvasPointer.ts`, `src/components/canvas/CanvasView.tsx`

## 2026-04-22 (alignment snapping)

### Add shape alignment snapping (smart guides)

When dragging a shape, the tool now shows alignment guide lines and snaps to other shapes — similar to Figma/Google Slides smart guides.

**Behavior:**
- While dragging, the left/right/center-X and top/bottom/center-Y edges of the dragged shape are compared against all other visible shapes on the active page
- When any pair of edges comes within ~8 screen pixels, the shape snaps to the aligned position and a pink guide line appears across the canvas
- X and Y axes snap independently
- When multiple shapes are selected and dragged together, their collective bounding box is used
- Hold **Alt/Option** to temporarily disable alignment snapping
- Alignment snapping takes priority over grid snap on any axis where it fires; grid snap remains active on the other axis
- Guide lines disappear on mouse release

**Files added:** `src/utils/alignmentSnap.ts`, `src/components/canvas/SnapGuides.tsx`  
**Files modified:** `src/components/canvas/useCanvasPointer.ts`, `src/components/canvas/CanvasView.tsx`

## 2026-04-21

### Add ImageMock and ChartMock shapes

Two new wireframe placeholder shapes:

- **Image Mock** (`imagemock`): A rectangle with a smiley face drawn inside — head circle, two dot eyes, and a curved smile. Renders in both plain SVG and hand-drawn (RoughJS) modes. Background fill and stroke are configurable.
- **Chart Mock** (`chartmock`): A generic chart with axes and either bars or a line series (5 data points). Toggle between bar and line chart in the properties panel. Bar/line color is configurable via Fill. Renders in both plain SVG and hand-drawn modes.

Both shapes appear in:
- Canvas right-click context menu → Mockups section
- Tree panel "+" dropdown → Mockups section
- Tree panel node context menu → Mockups section

Files modified: `src/model/shapes.ts`, `src/utils/shapeFactory.ts`, `src/components/canvas/ShapeRenderer.tsx`, `src/components/canvas/shapes/ImageMockShape.tsx` (new), `src/components/canvas/shapes/ChartMockShape.tsx` (new), `src/components/canvas/CanvasContextMenu.tsx`, `src/components/tree/TreeNode.tsx`, `src/components/tree/TreePanel.tsx`, `src/components/properties/PropertiesPanel.tsx`.

## 2026-04-22

### Add tick marks to Progress Bar shape

Same as the Slider tick marks feature. `ProgressShape` gets a `ticks: number` field (0 = none). Ticks render below the bar using the bar fill color. Configurable via "Ticks" input (0–20) in the properties panel.

### Add tick marks to Slider shape

- `SliderShape` model: new `ticks: number` field (0 = no ticks, n = number of tick marks evenly distributed across the track).
- `SliderShape.tsx`: renders tick marks below the track in both plain and hand-drawn modes. Plain mode uses small divs; hand-drawn uses `roughLine`.
- `shapeFactory.ts`: default `ticks: 0`.
- Properties panel: "Ticks" number input (0–20) in the Slider section.

### Improve dark mode system preference handling

`useTheme` now tracks a `null` (follow system) vs explicit override state separately.

- OS preference changes are observed live via `MediaQueryList.addEventListener` and applied immediately when no override is set.
- The toggle button cycles between "override to opposite" and "clear override (return to system)" rather than always writing to localStorage.
- `localStorage` key `"ui-theme"` is only present when the user has explicitly overridden; it is removed when following system.

## 2026-04-21

### Add Icon shape

Added a new "Icon" shape type that displays a single lucide-react icon.

- `src/model/shapes.ts`: New `IconShape` interface with `transform`, `icon: { name }`, `fill`, and `stroke` properties. Added to the `Shape` union.
- `src/store/types.ts`: Added `'insert-icon'` to `ToolMode`.
- `src/utils/shapeFactory.ts`: Factory case for `'icon'` — 40×40px, defaults to "Star" icon with foreground color.
- `src/components/canvas/shapes/IconShape.tsx`: New component that renders the selected lucide icon centered in the shape bounds. Icon color is controlled by `fill.color`.
- `src/components/canvas/ShapeRenderer.tsx`: Import and dispatch for the `'icon'` case.
- `src/components/canvas/useCanvasPointer.ts`: Maps `'insert-icon'` tool mode to `'icon'` shape type.
- `src/components/toolbar/Toolbar.tsx`: Added "Icon" entry with Star icon to the FORM_CONTROLS dropdown.
- `src/components/properties/sections/IconSection.tsx`: New section component for picking the icon (reuses the existing IconPickerDialog).
- `src/components/properties/PropertiesPanel.tsx`: Added `case 'icon'` with Transform, Icon, and Fill sections.
- `src/components/tree/TreeNode.tsx`: Added `'icon'` to `FORM_CONTROL_TYPES` so it appears with the label "Icon" in the tree.

### Add dark mode

Added a dark/light mode toggle to the UI.

- `src/index.css`: Added CSS custom property tokens for all UI colors under `:root` (light) and `html[data-theme="dark"]` (dark). Updated `html/body/#root` to use the new variables.
- `src/hooks/useTheme.ts`: New hook that reads/writes `localStorage` key `"ui-theme"`, sets `data-theme` attribute on `<html>`, and auto-detects system preference on first visit.
- `src/components/toolbar/Toolbar.tsx`: Added Sun/Moon toggle button (right side of toolbar). Fixed 3 hardcoded inline colors on the document name input/span. Imports `useTheme`.
- All 25 `*.module.css` files: Replaced hardcoded hex color values with CSS variables. The `contentTextarea` code-editor element intentionally retains its dark background in both modes.

## 2026-04-21 16:18

### Make tree sidebar sections collapsible

The Images, Variables, and Styles sections in the tree panel can now be collapsed by clicking their header label. A `›` chevron rotates 90° when the section is expanded. The `+` add button remains visible and functional while collapsed.

## 2026-04-21 16:13

### Add image assets section

The Assets section of the tree panel now lists every image imported into the document.

**Model:**
- New `ImageAsset` type (`src/model/imageAsset.ts`): id, name, src (base64 data URI or http URL), mimeType, optional width/height
- `assetId?` added to `ImageShape` to link shapes to their asset
- `images: ImageAsset[]` added to `VibeDocument`

**State/actions:**
- `selectedAssetId: string | null` in AppState
- New document actions (tracked in undo history): ADD_IMAGE_ASSET, UPDATE_IMAGE_ASSET, DELETE_IMAGE_ASSET
- UPDATE_IMAGE_ASSET propagates src/mimeType changes to all linked shapes automatically
- DELETE_IMAGE_ASSET unlinks shapes (they keep their current src)
- SELECT_IMAGE_ASSET view action; all selection actions reset `selectedAssetId`

**Tree panel:**
- `AssetsSection` component lists image assets with thumbnail, name, and usage count
- `+` button opens a name + URL form to add a URL-based image asset
- Double-click to rename; right-click for Rename/Delete context menu

**Properties panel:**
- Clicking an asset row shows `ImageAssetSection` with: editable name, source info (embedded: size in KB + pixel dimensions; URL: editable URL field), and a usage list of linked shape names

**Image upload:**
- `ImageSection` now creates an `ImageAsset` on first upload and links the shape to it
- Re-uploading to a linked shape updates the existing asset, propagating to all shapes using it

**Migration:**
- Serialization migration guard: `images: []` for old documents
- LOAD_DOCUMENT auto-creates assets for any image shapes that have no assetId, so existing documents populate the assets panel automatically

## 2026-04-21 15:28

### Add variable binding to transform X/Y/W/H fields

`TransformSection` now supports number variable binding for X, Y, Width, and Height. Type `@` in any of those fields to trigger an autocomplete dropdown of number variables. Bound fields show `@varName` with a × to clear. The rotation field does not support variable binding.

- Updated `TField` (local to TransformSection) to use `type="text"` with `@` interception, matching the NumberInput pattern
- Added optional `xVar`, `yVar`, `wVar`, `hVar` VarProps to `TransformSection`
- All 22 `TransformSection` call sites in PropertiesPanel now pass variable binding props via the existing `vp()` shorthand

## 2026-04-21 14:47

### Add document-level variables system

Named variables (number, string, boolean, color) that can be bound to shape properties. Editing a variable value re-renders all shapes using it automatically via live resolution at render time.

**Data model:**
- `src/model/variable.ts` — `Variable` interface, `resolveVariableBindings` (chains with `resolveShapeText` in ShapeRenderer)
- `variableBindings?: Record<string, string>` (propPath → variableId) added to `BaseShape`
- `variables: Variable[]` added to `VibeDocument`

**State / actions:**
- `selectedVariableId: string | null` in AppState
- New document actions: ADD_VARIABLE, UPDATE_VARIABLE, DELETE_VARIABLE, REORDER_VARIABLE, BIND_VARIABLE (all tracked in undo history)
- SELECT_VARIABLE view action; all selection actions reset `selectedVariableId`
- DELETE_VARIABLE walks all shapes removing orphaned bindings (no baking needed — shapes fall back to stored literal values)

**Input components:**
- `NumberInput`, `ColorInput`, `ToggleInput` — new optional props `variableId?, variables?, onVariableChange?`; existing call sites unchanged
- `@` in a number/color input triggers autocomplete dropdown of matching variables; bound inputs show `@varName` + × clear button

**New UI:**
- `VariableRow` — tree row with type icon, inline rename, context menu, value preview
- `VariablesSection` — tree section with `+` type-picker menu (Number/String/Boolean/Color)
- `VariableSection` — properties panel section for editing a variable's name and value

**PropertiesPanel wiring:**
- Early return for `selectedVariableId !== null` renders VariableSection
- `makeVarProps` helper builds binding props for a given shape/path/type; passed as `colorVar`, `widthVar`, `opacityVar` into FillSection/StrokeSection and directly to NumberInput/ToggleInput call sites

**Serialization:** migration guard `if (!Array.isArray(docObj.variables)) docObj.variables = []`

## 2026-04-21 14:15

### Fix text style override tracking

Two bugs in `TextSection` where property edits didn't behave correctly when a style was applied:

- **Style connection lost on edit**: `onChange` was spreading the resolved text (which has no `textStyleId`), so every property change was silently unlinking the shape from its style. Fixed by using `rawText` as the base in all `onChange` calls.
- **Override not tracked when value matches raw**: The PATCH_SHAPE reducer tracks overrides by diffing old vs new raw values. If `rawText.align = 'left'` and the style provides `'center'`, clicking 'left' produced no diff → no override added → style's value kept winning. Fixed by adding an `applyChange` helper in `TextSection` that explicitly adds the changed field to `textStyleOverrides` whenever a style is set, regardless of value equality.

## 2026-04-21 14:05

### Text Styles system

- **Named text styles**: Users can create document-level `TextStyleDef` objects in the Styles section of the tree panel. Each style is a named collection of optional text properties (font family, size, weight, style, color, align, verticalAlign).
- **Built-in styles**: Three default styles are created with every new document — Title (32px bold), Subtitle (20px 600-weight), Paragraph (14px normal). Old documents auto-migrate with the defaults.
- **Style assignment**: Any shape with text shows a "Style" selector at the top of the Text section in the properties panel. Selecting a style applies its properties live; shapes re-render immediately when the style is edited.
- **Per-field overrides**: After applying a style, individual text properties can still be overridden. Modified fields show a ↺ reset button to restore the style's value. Override tracking is automatic in the reducer when `PATCH_SHAPE` changes text fields on a styled shape.
- **Style editor**: Clicking a style in the Styles tree section shows it in the properties panel. Each field has a checkbox to include/exclude it from the style. Changes apply live — no save button needed.
- **Delete bakes values**: Deleting a style bakes its resolved values into all shapes that referenced it, then disconnects them.
- **Data model**: Added `TextStyleDef`, `TextStyleField`, `TEXT_STYLE_FIELDS`, `BUILT_IN_TEXT_STYLES`, `resolveTextStyle`, `resolveShapeText` in new `src/model/textStyle.ts`. Added `textStyleId?` and `textStyleOverrides?` to `TextStyle` in `shapes.ts`. Added `textStyles: TextStyleDef[]` to `VibeDocument`.
- **State**: Added `selectedStyleId: string | null` to `AppState`. New document actions: `ADD_TEXT_STYLE`, `UPDATE_TEXT_STYLE`, `DELETE_TEXT_STYLE`, `REORDER_TEXT_STYLE`, `APPLY_TEXT_STYLE`, `CLEAR_TEXT_OVERRIDE`. New view action: `SELECT_STYLE`.
- **Canvas**: `ShapeRenderer` calls `resolveShapeText` before passing shapes to sub-renderers, so all text renders with resolved style values without needing to store resolved values in shape data.
- **New files**: `src/model/textStyle.ts`, `StyleRow.tsx/css`, `StylesSection.tsx`, `TextStyleDefSection.tsx`
- **Modified**: `TextSection` updated with new prop signature (style selector, override reset buttons, font family selector); all 14 call sites in `PropertiesPanel.tsx` updated.

## 2026-04-21

### Tree panel overhaul — Document item, Page Folders, section headers

- **Document row**: A "Document" item at the very top of the tree panel. Click it to select the document and see its properties in the right panel (document name, grid settings, active theme).
- **Page Folders**: New organizational folder type for pages. Folders have no canvas presence — just a name and an ordered list of pages they contain. Features:
  - Create via the `+` menu → "Folder"
  - Inline rename (double-click or context menu → Rename)
  - Collapse/expand with chevron button
  - Context menu: Add Page to Folder, Rename, Move Up/Down, Delete Folder (keep pages), Delete Folder and Pages
  - Drag a page node onto a folder to assign it to that folder
- **Section headers**: Static "Assets", "Variables", "Styles" sections below pages (empty for now, placeholders for future content)
- **Data model**: Added `PageFolder` interface and `pageFolders: PageFolder[]` to `VibeDocument`. Helper functions `findFolderForPage` and `getUnfiledPageIds` in `document.ts`. Old documents auto-migrate with `pageFolders: []`.
- **State**: Added `documentSelected: boolean` to `AppState`. New actions: `SELECT_DOCUMENT`, `SET_FOLDER_COLLAPSED` (view, not undoable); `ADD_PAGE_FOLDER`, `DELETE_PAGE_FOLDER`, `RENAME_PAGE_FOLDER`, `ASSIGN_PAGES_TO_FOLDER`, `REMOVE_PAGES_FROM_FOLDER`, `REORDER_PAGE_FOLDER` (document, tracked in undo history).
- **New files**: `DocumentRow.tsx/css`, `PageFolderRow.tsx/css`, `SectionHeader.tsx/css`, `DocumentSection.tsx`

## 2026-04-20 (7)

### Palette import from Lospec & Coolors

- New utility `src/utils/paletteImport.ts` with parsers for `.hex`/`.txt` files, GIMP `.gpl` files, Coolors.co URLs, and a Lospec.com JSON API fetcher
- Added "Import" section to the bottom of the palette list in the Palette Editor modal with:
  - URL input: paste a `lospec.com/palette-list/<slug>` or `coolors.co/<hex>-<hex>-…` URL and click Import
  - File upload: pick a `.hex`, `.txt`, or `.gpl` file from disk
  - Error display for bad URLs, failed fetches, or invalid files
- Imported palette is automatically selected after import
- 33 new unit tests covering all parser functions and the fetch helper
- Fixed palette editor dialog height jumping when switching between palettes — set fixed `height: 500px` on the modal

## 2026-04-20 (6)

### Grid snapping bug fixes

- Fixed: grid not visible until something moved — SVG grid had `width: 100%; height: 100%` on a zero-size canvas div; changed to explicit `left: -10000, top: -10000, width: 20000, height: 20000` so it paints immediately on mount
- Fixed: turning off grid snap still snapped shapes until zoom changed — `snapEnabled`/`gridSize` were missing from `onPointerMove`'s `useCallback` dependency array, causing stale closure
- Fixed: drag-move snapped shapes to offset grid positions — was snapping absolute cursor position then subtracting unsnapped initial position; now snaps total displacement from drag start so movement is always in clean grid-size increments

## 2026-04-20 (5)

### Grid snapping

- Added `GridSettings` model (`src/model/grid.ts`) with `size`, `style` ('lines' | 'dots' | 'none'), and `snapEnabled` fields; default is 10px lines, snap off
- Added `gridSettings: GridSettings` to `VibeDocument`; old documents load with defaults via fallback
- Added optional `gridSettings?: Partial<GridSettings>` per-page override to `PageShape`
- New `UPDATE_GRID_SETTINGS` document action and `TOGGLE_DOCUMENT_SETTINGS_MODAL` view action
- `CanvasGrid` component renders an SVG pattern grid (lines or dots) inside the canvas transform div; inherits zoom/pan scaling
- Grid snapping during shape drag: pointer position snapped to grid before computing move delta
- Grid snapping during shape insertion (drag-insert and click-insert): origin, size snapped to grid
- Grid snapping during resize (`SelectionOverlay`): x, y, width, height snapped before `SET_TRANSFORM`
- Arrow key nudge uses `gridSize` as step distance when snap is enabled (instead of 1 or 10px)
- Toolbar: grid toggle button (Grid icon) highlights when snap is on; File menu has "Document Settings..." entry
- `DocumentSettingsModal`: controls for snap enabled, grid size (1–200 px), and grid style
- `PropertiesPanel`: page shape now shows a "Grid Override" section to set per-page grid settings
- `src/utils/snapping.ts`: `snapToGrid(value, size)` and `getEffectiveGridSettings(pageId, shapes, docSettings)` utilities
- 11 new unit tests for `snapToGrid` and `getEffectiveGridSettings` (14 test files, 136 tests total)

## 2026-04-20 (4)

### Bug fixes for nested group editing

- Fixed: double-clicking a nested group while already drilled into a parent group now correctly enters the inner group's drill mode
- Fixed: moving a shape inside an inner group was incorrectly moving the outer group instead; hit-test bubble-up now exempts all containers in the drill stack, not just the innermost one

## 2026-04-20 (3)

### Nested group drill-mode stack

- Drill mode now supports arbitrary nesting depth using a stack instead of a single `drilledInContainerId`
- Double-clicking a nested group while already drilled in pushes the inner group onto the stack
- Pressing Escape pops one level at a time, returning to the parent group rather than jumping to the top level
- The breadcrumb label shows the full drill path with `›` separators (e.g. "Editing: Outer Group › Inner Group")
- Outer drill levels remain visible with a faded orange border; the innermost active level shows a solid orange border

## 2026-04-20

### Group feature

- **Group shape**: A transparent container that wraps multiple shapes into a logical unit. Bounds are auto-computed as the union of all children's bounding boxes.
- **Create group**: Select 2+ shapes → right-click → "Group". The group is placed at the same tree level as the selected shapes and all selected shapes become its children.
- **Ungroup**: Right-click a group → "Ungroup" to unwrap children back to the group's parent at their original canvas positions.
- **Drill mode**: Double-click a group to enter drill mode and interact with individual children. Escape exits drill mode.
- **Hit testing**: Clicking a child of an undrilled group selects/moves the group instead of the child.
- **Group bounds recomputation**: Group bounds automatically update when children are moved or resized while drilled in.
- **Empty group**: Add an empty group from the Layers panel "+" button under Containers → Group, then drag shapes into it.
- **Drag-to-reparent**: Shapes dragged onto a group in the canvas or tree will be reparented into it.
- **Nested groups**: Groups can be nested indefinitely; drill mode scopes to the innermost drilled group.
- **Delete group**: Deletes the group and all its children.

## 2026-04-19 (2)

### New shape

- **Table**: Grid shape where each line of text is a row and commas separate columns. The first row is always the header (bold, filled with stroke color). Double-click to edit raw CSV-style text; Cmd/Ctrl+Enter commits. Available in Components > Form Controls. Supports hand-drawn rendering.

## 2026-04-19

### New shapes

- **Sticky Note**: A yellow note shape with a folded top-right corner. Supports editable text (double-click). Available in Components > Containers. Works in both clean and hand-drawn themes.
- **List**: A multi-item list control. Text content is newline-separated items. The selected row is highlighted with a light blue background. `selectedIndex` (-1 = none) is editable in the Properties panel. Double-click to edit items. Available in Components > Form Controls.
- **Scroll Panel**: A titled panel with a decorative scrollbar on the right side. `scrollPosition` (0–1) controls the thumb position and is editable in the Properties panel. Title is double-click editable. Available in Components > Containers.

All three shapes support hand-drawn (rough) rendering and integrate with undo/redo, selection, and the canvas context menu.

## 2026-04-17

### Bug fixes

- **Shift+click now removes items from selection**: Shift+clicking an already-selected shape on the canvas now deselects it. Previously, `draggingIds` was filtered correctly but no dispatch was made to update the selection state, so the item stayed selected.

## 2026-04-16 (3)

### Build

- **Configurable base URL**: Added `base` option to `vite.config.ts` using `process.env.VITE_BASE_PATH` (defaults to `/`). Set `VITE_BASE_PATH=/your-path/` at build time to deploy to a subdirectory. Installed `@types/node` to support `process.env` in the Vite config.

## 2026-04-16 (2)

### Bug fixes

- **TextField and Select shapes now respect handDrawn theme**: Both components were missing the `handDrawn` prop and always rendered with RoughJS. Added plain CSS rendering (border, border-radius, background) when the active theme has `handDrawn: false`.
- **Dialog title font now follows active theme**: `DialogShape` model gained `titleFontFamily` and `titleColor` fields. New dialogs are created with the active theme's font and foreground color. Existing dialogs without those fields fall back to the active theme font passed through `ShapeRenderer` (`themeFontFamily` prop), so switching themes updates them without requiring a manual reset.
- **Dialog text color separated from border color**: Title text, Cancel label, and OK label now use `titleColor` (theme foreground) rather than `stroke.color`, matching how the Panel shape separates text from border colors. "Reset to theme" also updates `titleColor`.
- **Inter web font loaded**: Added Inter (weights 400/500/600) to the Google Fonts request in `index.html` so the Plain Light and Plain Dark themes render with the correct font rather than falling back to the system font.
- **Theme editor duplicate button**: Built-in themes now show an explicit "Duplicate to customize" button in the read-only notice. The sidebar "Add theme" button also changes to "Duplicate" (with a copy icon) when a built-in theme is selected.

## 2026-04-16

### Features

- **Document themes**: Added a theming system with three built-in themes — Hand Drawn, Plain Light, and Plain Dark.
- **Theme model** (`src/model/theme.ts`): `Theme` interface defines foreground, background, border color/width/radius, hand-drawn toggle, and font family/size. `getActiveTheme()` helper reads active theme from document.
- **Theme Editor** (File → "Edit Themes..."): Left sidebar lists themes (built-ins are locked/read-only with a lock icon; custom themes are deletable). Right panel lets you edit all theme properties. "Set as active theme" applies the theme to new shapes; "Apply to all shapes" resets all existing shapes in the document to the theme's values.
- **New shapes use active theme**: All shape creation paths (canvas draw, context menu, tree panel, toolbar) use `getActiveTheme(doc)` to initialize colors, fonts, border styles, and corner radii.
- **Reset to theme**: A "Reset to theme (…)" button in the Properties Panel resets the selected shape(s) to the active theme's values (fill color, stroke color/width, corner radius, font family/size, text color). Does not affect content (text, images, etc.).
- **handDrawn toggle**: Each of the 11 rough-rendered shape components (Button, Panel, Dialog, Checkbox, Radio, Slider, Toggle, Frame, Label, Progress, Stepper) now supports a `handDrawn: boolean` prop — when false, renders with plain CSS (border, border-radius, background) instead of RoughJS SVG paths. The active theme's `handDrawn` setting is applied document-wide; individual shapes can override it via `shape.handDrawn`.
- **Document migration**: Existing documents that don't have `themes`/`activeThemeId` fields are automatically migrated to the built-in themes on load.

## 2026-04-14 (3)

### Features

- **Export document as PDF**: Added "Export PDF..." to the File menu. Renders all fixed-size pages in document order, one per PDF page, and downloads as `<document-name>.pdf`. Each page uses its own dimensions. Pages without a fixed size are skipped.

## 2026-04-14 (2)

### Features

- **Export page as PNG**: Added "Export PNG..." to the File menu. Renders the active page off-screen at 1:1 scale (using html2canvas) and downloads it as `<document-name>.png`. Requires the page to have a fixed size set; shows a helpful message if the page uses infinite canvas mode.

## 2026-04-14

### Features

- **Settings dialog**: Added a Settings modal (File → Settings...) with configurable zoom speeds. Pinch zoom speed (trackpad gesture) and scroll wheel zoom step (mouse wheel) can each be adjusted via sliders, with a "Reset to defaults" button. Settings are stored in app state.
- **Smarter pinch detection**: `usePanZoom` now distinguishes pinch gestures (`deltaMode === 0`) from mouse wheel clicks (`deltaMode === 1`) and applies separate configurable multipliers to each.

## 2026-04-10 (8)

### Features

- **Drill-in container editing**: Double-clicking a frame, panel, or dialog on the canvas enters a focused editing mode for that container. While drilled in, all canvas interactions (hit-testing, drag-marquee selection, shape movement) are scoped exclusively to the container's children.
- **Visual feedback**: An orange border highlights the active container and a small "Editing: [name]" label appears at the top of the canvas while in drill mode.
- **Exit options**: Double-click outside the container or press Escape to return to normal page-level editing.
- **Auto-exit on page change**: Switching the active page automatically clears drill mode.

### Technical

- Added `drilledInContainerId: string | null` to `AppState` (view-only, non-undoable).
- Added `ENTER_DRILL_MODE` and `EXIT_DRILL_MODE` `ViewAction` variants; handled in reducer alongside `SET_ACTIVE_PAGE` reset.
- `useCanvasPointer.ts`: `hitTestShapes` and marquee selection both scope to the drilled container's `TreeNode.children` when `drilledInContainerId` is set. `onDoubleClick` routes to drill-in vs. text-edit based on shape type and current drill state.
- `useDocumentShortcuts.ts`: Escape priority chain is now text-edit → drill-exit → deselect.

---

## 2026-04-10 (7)

### Features

- **Reparent with position compensation**: Moving a shape to a different parent (via the layer tree or by dragging on the canvas) now preserves its visual position. The shape's local coordinates are recalculated so it appears at the same canvas location after the parent changes.
- **Canvas drag-to-reparent**: Dragging a shape on the canvas so its center lands inside a frame or panel automatically reparents it into that container. Dragging it out of all containers reparents it back to the active page. Position is compensated in both cases.
- **Tree panel reparent fix**: Drag-and-drop reordering in the layer panel now adjusts local coordinates when the parent changes, so the shape stays visually in place.

### Technical

- Added `getContentOrigin(parentId, shapes, parentMap)` to `src/utils/geometry.ts` — returns the canvas-space content origin of a given parent shape (used to compute new local coords when reparenting).
- Extended `REPARENT_SHAPE` action with optional `x?: number; y?: number` fields; reducer applies them atomically with the tree move (single undo step).
- `useCanvasPointer.ts`: on pointer-up after a drag, checks whether each dragged shape has moved into or out of a frame/panel and dispatches `REPARENT_SHAPE` with adjusted coordinates if needed.

---

## 2026-04-10 (6)

### Features

- **Color palettes**: Documents now include named color palettes (multiple palettes supported). A default "Colors" palette ships with 14 swatches (black, white, grays, blue, green, red, yellow, orange, purple, brown, teal, pink).
- **Palette-linked colors**: Every color field (fill, stroke, text color, track/thumb fills, page background) can be linked to a palette swatch via `paletteColorId`. Editing a palette color instantly updates all linked shapes on the canvas.
- **Swatches in color pickers**: Every `ColorInput` shows a row of circular swatches from all palettes. Click a swatch to link the color; using the system picker or hex field sets a raw color and unlinks any palette reference.
- **Palette editor**: File → Edit Palettes opens a two-column modal to add/rename/delete palettes and their colors. Editing a color dispatches `UPDATE_PALETTE_COLOR` which propagates to all linked shapes.
- **Document migration**: v1 documents (no `palettes` field) are automatically migrated to v2 with the default palette on load. Document version is now 2.
- **Undo/redo**: All palette actions (`ADD/DELETE/RENAME_PALETTE`, `ADD/DELETE/UPDATE_PALETTE_COLOR`) are fully undoable.

### Tests

- New `tests/store/palette.test.ts` — 11 tests covering all palette actions, shape color propagation, non-linked shape immunity, name-only updates, and undo.

## 2026-04-10 (5)

### Features

- **Multi-selection properties**: When 2+ shapes are selected the Properties panel now shows Transform (x/y/w/h with mixed-value placeholder), Fill, and Stroke sections in addition to Visible/Locked toggles. Changing a field applies to all selected shapes.
- **Shape alignment**: New `ALIGN_SHAPES` document action (undoable) aligns selected shapes in 8 modes: left, center-h, right, top, middle-v, bottom, match-width, match-height. Uses canvas-space coordinate math via `computeAlignedTransforms()` in `src/utils/alignment.ts`.
- **Multi-select context menu**: Right-clicking when 2+ shapes are selected (and the target is already in the selection) preserves the multi-selection and shows a dedicated menu: Duplicate, 8 alignment actions, Delete.
- **Bug fix**: `ALIGN_SHAPES` and `DUPLICATE_SHAPES` were not tracked in `DOCUMENT_ACTION_TYPES`, so undo/redo did not work for them. Both are now registered.

### Tests

- New `tests/utils/alignment.test.ts`: covers all 8 alignment types plus line-shape exclusion and empty-ids edge case.
- New `tests/store/alignment.test.ts`: tests `ALIGN_SHAPES` via `appReducer` and undo via `historyReducer`.
- Extended `tests/store/reducer.test.ts`: multi-shape `DELETE_SHAPES` and `DUPLICATE_SHAPES` test cases added.

## 2026-04-10 (4)

### Features

- **Full lucide icon picker for Button icon**: Replaced the inline 35-icon grid with a dialog that lists all ~1000 lucide-react icons. Type to search by name; active icon highlighted; click to select.
- New `src/utils/allLucideIcons.ts` enumerates every exported lucide icon at runtime.
- New `src/components/properties/IconPickerDialog.tsx` — searchable 8-column grid modal.
- `getButtonIcon` now resolves any lucide icon name (not just the original 35).
- Bundle size increases from ~316KB to ~1.1MB uncompressed (~226KB gzip) due to including all icons.
- **Bug fix**: Initial implementation filtered lucide exports by `typeof === 'function'`, which excluded all icons because lucide wraps them with `React.forwardRef()` (returns an object, not a function). Fixed by using lucide-react's built-in `icons` named export instead.

## 2026-04-10 (3)

### UI

- **Text alignment icon buttons**: Replaced the Align and V-Align dropdowns in the Text properties section with icon button groups. Align uses `AlignLeft/Center/Right`; V-Align uses `AlignVerticalJustifyStart/Center/End`. Active value highlighted in blue.
- Added `.iconBtnGroup`, `.iconBtn`, `.iconBtnActive` CSS classes to `inputs.module.css` for reuse.

## 2026-04-10 (2)

### Bug Fixes

- **Label vertical alignment**: `LabelShape` was ignoring `text.verticalAlign` — its display div used `alignItems: center` (hardcoded) instead of `flexDirection: column` + `justifyContent`. Now matches `TextShape` behaviour.

### Refactoring

- Extracted `useTextEdit` hook (`src/components/canvas/shapes/useTextEdit.ts`) containing the `useRef`/`useEffect` edit-state logic and textarea event handlers previously duplicated across 6 shapes.
- Extracted `vAlignToJustify` helper into the same file.
- `TextShape`, `LabelShape`, `ButtonShape`, `CheckboxShape`, `RadioShape`, `ToggleShape` all use `useTextEdit` — no more copy-pasted boilerplate.

## 2026-04-10

### Features

- **localStorage document persistence**: Documents can now be saved to and loaded from browser localStorage. The Load/Save toolbar buttons are replaced by a "File" dropdown menu containing:
  - **Open...** — shows a list of previously saved documents; click any to load it
  - **Save** — saves the current document (overwrites if previously saved, otherwise prompts via Save As)
  - **Save As...** — save with a new name or overwrite an existing document
  - **Import JSON...** / **Export JSON...** — existing file-based import/export, unchanged
- Document name is displayed in the toolbar to show which document is active.
- New files: `src/utils/localStorageDB.ts`, `src/components/layout/DocumentsModal.tsx/.module.css`
- `AppState` gains `documentId` and `documentName` fields; new `SET_DOCUMENT_META` action.
- **New document**: File menu includes a "New" item that creates a blank document without reloading the browser.
- **Inline rename**: Clicking the document name in the toolbar makes it editable in-place (Enter or blur to confirm, Escape to cancel).
- **Toolbar reorganisation**: File menu and document name moved to the far left; spacer pushes drawing tools to the centre; help button anchored to the far right; separator added between Pan and Shapes tools.

## 2026-04-09

### Bug Fixes

- **Selection handles offset on new pages**: `getAbsoluteTransform` and `getParentContentOrigin` were adding the page's own `transform.x/y` as a coordinate offset for all child shapes. Since shapes are stored in absolute canvas coordinates (not page-relative), the page parent is now skipped when walking the transform chain. Was invisible on Page 1 (`x:0, y:0`) but caused a visible offset on any page created with a non-zero position.
- **New page default position**: `createShape('page')` now defaults to `x:0, y:0` instead of the generic `x:50, y:50`.

## 2026-04-08 13:38

### Bug Fixes

- **Ruler numbers legible**: Increased RULER_SIZE from 20 → 28px; vertical labels now use `ctx.measureText` for proper centering instead of a fixed char-width estimate; labels drawn in the non-tick area of each ruler.
- **Page button now activates new page**: After inserting a page shape from the toolbar, `SET_ACTIVE_PAGE` is now dispatched so the canvas immediately switches to the new empty page.

## 2026-04-08 13:10

### Bug Fixes & Improvements

- **Select control text editing**: Double-click to edit the selected value directly on the canvas (inline `<input>`). Commit with Enter or Cmd+Enter, cancel with Escape.
- **Text style properties on all text controls**: Added TextSection (font size, weight, family, alignment, color) to textfield, select, stepper, checkbox, toggle, and radio in the Properties panel.
- **Checkbox/Toggle/Radio now use TextStyle**: Model updated to replace `label: string` with `text: TextStyle`, giving full typography control. Renderers updated to use `text.fontFamily/fontSize/fontWeight/color`.
- **Canvas ruler numbers fixed**: Ruler canvases now dynamically match their CSS rendered size (×devicePixelRatio for sharpness), so labels render at full size instead of being scaled down from a 4000px buffer. Font increased to 11px; minimum tick spacing increased to 12px screen pixels.
- **Toolbar dropdowns no longer render behind canvas**: Added `position: relative` and increased z-index to 100 on the toolbar container, ensuring dropdowns always appear above canvas content.
- **Page button in toolbar now works**: Inserting a page shape now uses `parentId: null` (root level) instead of the current active page, so pages appear at the document root.

## 2026-04-08 12:40

### Features

- **Canvas ruler**: 20px horizontal and vertical rulers positioned in screen space, origin (0 label + blue line) aligned to the active page's top-left corner. Ticks adapt their interval based on zoom level; origin marker moves correctly with pan/zoom.
- **Titled Panel / plain Panel split**: Existing "Panel" shape is now labelled "Titled Panel" everywhere (type remains `'panel'` for document compatibility). A new "Panel" (`type: 'frame'`) is a simple container with no title bar — rough rect outline with children nested inside.
- **Dialog shape**: New `'dialog'` type with a rough title bar, a scrollable body area for child shapes, a rough footer divider, and two rough-rect buttons (Cancel / OK) with configurable labels.
- **Cmd+drag to duplicate-and-move**: Holding Cmd while dragging a shape creates a duplicate at the original position and drags the clone. Pre-generates clone IDs so the drag is immediately transferred to the new shape.
- **Lucide icons in context menus**: All unicode glyph icons (`⧉`, `↑↓⬆⬇`, `👁🚫🔒🔓`, `✕`, `📄`) replaced with lucide-react components. `ContextMenuItem.icon` widened from `string` to `React.ReactNode`.
- **Shapes dropdown in toolbar**: Rect, Circle, and Line moved into a single dropdown button (same pattern as Form Controls). Shows the icon of the last-used shape tool.
- **Components dropdown in toolbar**: Renamed from "Form Controls"; now has a "Containers" section (Titled Panel, Panel, Dialog) and a "Form Controls" section. Help `?` button added to the right side of the toolbar.
- **4 new form controls**: Radio Button (`'radio'`), Select/Dropdown (`'select'`), Progress Bar (`'progress'`), Number Stepper (`'stepper'`) — all rendered with rough.js hand-drawn style.
- **Tree view auto-switches active page**: Clicking any non-page shape in the layer tree that belongs to a different page now automatically switches the active page.
- **Help modal (`?`)**: Press `?` or click the `?` toolbar button to open a keyboard + mouse shortcuts reference modal. Escape or clicking the overlay closes it.

### Internal

- `findAncestorPage` helper added to `document.ts`
- All ruler, pan, zoom, and resize-handle coordinate conversions updated to account for the 20px ruler offset
- `DUPLICATE_SHAPES` action accepts an optional `rootIds` array for pre-seeded clone IDs (used by Cmd+drag)
- `AppState.showShortcutsModal` + `TOGGLE_SHORTCUTS_MODAL` view action added

## 2026-04-08

### Features

- **Cmd+Enter exits text editing**: Pressing Cmd+Enter (or Ctrl+Enter) while editing text in any shape commits the edit and exits text editing mode. Applies to all 7 editable shapes: Text, Button, Panel, Label, TextField, Checkbox, Toggle.
- **Duplicate action**: Added `DUPLICATE_SHAPES` document action that deep-clones a shape subtree with new IDs, offsets the root clone by (10, 10) in local space, and inserts it after the original in the tree. Accessible via Cmd+D keyboard shortcut, canvas right-click context menu, and tree node right-click context menu.
- **Zoom 300%/400%**: Added 300% and 400% presets to the zoom dropdown and zoom in/out step sequence.
- **Status bar**: Added a 24px status bar at the bottom of the screen. Left corner has a button to collapse/expand the layer panel (‹/›), right corner for the properties panel. Center displays the name of the currently selected shape, or "N shapes selected" for multi-selection.

### Bug fixes

- **Subshape positioned at mouse cursor**: When right-clicking a shape to add a subshape, the new shape's position is now converted from absolute canvas coordinates to parent-local coordinates, so it appears under the cursor rather than at the raw canvas position.

## 2026-04-07 11:20

### Features

- **Button icon support**: Buttons can now display a Lucide icon alongside their label. In the Properties panel, a new "Icon" section shows a 6-column grid of 36 common icons (arrows, chevrons, UI actions, etc.) to pick from. Left/Right radio buttons control which side the icon appears on; "None" clears the icon. The icon scales with the button's font size (`fontSize × 1.1`), matches the button's text color, and uses a `strokeWidth` of 1.5 for a lighter hand-drawn look. The `ButtonShape` model gains an `icon: { name: string; side: 'left' | 'right' } | null` field (defaults to `null` for new buttons).

## 2026-04-07 11:10

### Features

- **Caveat handwritten font for form controls**: Added [Caveat](https://fonts.google.com/specimen/Caveat) (Google Fonts) to `index.html`. All form control shapes default to `Caveat, cursive` — button text, panel title, label, textfield value/placeholder display, checkbox label, and toggle label all render in the hand-drawn font, complementing the RoughJS sketchy outlines.

## 2026-04-07 11:00

### Features

- **4 new form control shapes with RoughJS rendering**:
  - `Label` — text label with a subtle rough underline. Double-click to edit text.
  - `Text Field` — rough rect with placeholder text (shown in gray when value is empty). Double-click to edit displayed value.
  - `Checkbox` — rough 16×16 tick box with a rough checkmark when checked, and a label to the right. Double-click to edit label.
  - `Toggle` — rough pill track with a sliding rough circle thumb (moves left/right based on `checked` state), label to the right. Double-click to edit label.
- **Form Controls dropdown in toolbar**: Replaced the three individual button/panel/slider toolbar buttons with a single "Form Controls" dropdown. Shows the icon of the currently active form control; clicking opens a menu with all 7 controls (Button, Panel, Slider, Label, Text Field, Checkbox, Toggle).
- **Form Controls section in all context menus**: Both the canvas right-click menu and the tree node right-click menu now have separate "Shapes" and "Form Controls" sections when adding shapes. Same split applied to the Layers panel `+` add menu.
- **Properties panel**: Added property sections for all 4 new shapes (transform, content, text style for label; placeholder, fill, stroke for textfield; checked toggle, fill, stroke for checkbox/toggle).

## 2026-04-07 10:10

### Features

- **Space+drag to pan**: Holding Space while dragging on the canvas pans the view regardless of the active tool. The cursor changes to `grab` while Space is held. Space key is captured on `keydown` when the canvas container is focused to prevent browser scroll.

## 2026-04-07 10:00

### Features

- **Zoom control in toolbar**: Replaced the static zoom label with a `−` / dropdown / `+` control. The dropdown offers 25%, 50%, 75%, 100%, 150%, 200% presets; if the current zoom is outside that list (e.g. from pinch/scroll) it shows the actual percentage as an extra option. The `−`/`+` buttons step through the same presets. All zoom changes use `ZOOM_TO` centered on the viewport so the canvas center stays fixed.

## 2026-04-07 09:50

### Features

- **Compact transform panel**: X/Y/W/H/° fields redesigned with a tight grid layout. Each field is a bordered pill containing a small label (`X`, `Y`, `W`, `H`, `°`) left-aligned and the number input right-aligned, matching the label to its field visually. X+Y share one row, W+H share the next, ° sits alone on the third row at half-width. Replaced generic `NumberInput` wrappers with a local `TField` component for full layout control.

## 2026-04-07 09:35

### Bug fixes

- **Text editing commit on click-outside**: Clicking outside a text textarea was not committing changes (text reverted). Root cause: `pointerdown` fires on the canvas before `blur` fires on the textarea, so `DESELECT_ALL` cleared `editingTextId` first, causing the textarea to unmount before `onBlur` could run. Fixed by watching `isEditing` transitioning `true → false` in a `useEffect` instead of relying on `onBlur`. A `cancelRef` tracks whether Escape was pressed so the effect knows whether to commit or discard. **Escape** reverts. Clicking anywhere outside commits. Enter inserts a newline (multi-line). Applied to `TextShape`, `ButtonShape`, and `PanelShape`.
- **Unit tests**: Added `tests/store/textEditCommitOnDeselect.test.ts` with 7 tests covering: `DESELECT_ALL` clears `editingTextId`, `COMMIT_TEXT_EDIT` after `DESELECT_ALL` still saves content, cancel path (`STOP_TEXT_EDIT` without commit) for all three shape types, and full commit sequences for button and panel.

## 2026-04-07 09:30

### Features

- **Multi-line text with alignment for all text shapes**: `TextShape`, `ButtonShape`, and `PanelShape` title now support multi-line text (`white-space: pre-wrap`, `word-break: break-word`) and correctly apply both horizontal (`text-align`) and vertical alignment. Display uses a `flexDirection: column` container with `justifyContent` for vertical positioning and an inner `div` with `textAlign` for horizontal — the inner div has `width: 100%` so alignment applies across the full width. `ButtonShape` and `PanelShape` title were also changed from `<input>` to `<textarea>` for multi-line editing. Vertical alignment is reflected in the `TextStyle.verticalAlign` field already present in the model.

## 2026-04-07 09:25

### Bug fixes

- **Resize handles broken for nested shapes**: `startBbox` in `ResizeHandle` is in canvas space (from `getAbsoluteTransform`), but `SET_TRANSFORM` stores coordinates in parent-local space. Added `getParentContentOrigin` to `geometry.ts` which returns the canvas-space origin of a shape's parent content area. The resize handler now subtracts this origin before dispatching `SET_TRANSFORM`, converting canvas-space back to local coordinates.

## 2026-04-07 09:20

### Features

- **Marquee (rubber-band) selection**: Clicking and dragging on the empty canvas background draws a selection rectangle. On release, all shapes whose absolute bounding boxes intersect the rectangle are selected. Shift+drag adds to the existing selection without deselecting first. The marquee is rendered as a thin blue overlay in screen space; hit testing converts the rectangle to canvas space and uses `getAbsoluteTransform` to correctly handle nested shapes.

## 2026-04-07 09:15

### Features

- **Shift-constrained square resize**: Holding Shift while dragging any resize handle constrains width and height to be equal (square). For corner handles the opposite corner stays fixed. For edge handles the shape grows symmetrically around the perpendicular axis.

## 2026-04-07 09:10

### Features

- **Tree view drag-and-drop reparenting**: Each tree row is now draggable. Hovering the top 25% of a row shows a "before" indicator (blue top border), the bottom 25% shows "after" (blue bottom border), and the middle shows "into" (blue background highlight). Dropping dispatches `REPARENT_SHAPE` with the correct `newParentId` and `index`, including same-parent index adjustment (when dragging within the same parent, the target's index shifts after removal). Added `parentId` and `nodeIndex` props to `TreeNodeComp` to carry the positional context needed for the index calculation.

## 2026-04-07 09:00

### Bug fixes

- **Nested shape click selection and selection overlay**: Shapes inside panels (or other containers) couldn't be clicked to select in the canvas, and the selection overlay was drawn at the wrong position. Root cause: both `hitTestShapes` and `SelectionOverlay` were treating shape `transform.x/y` as canvas-absolute coordinates, but for nested shapes those are parent-relative. Fixed by adding `buildParentMap` and `getAbsoluteTransform` helpers to `geometry.ts` that walk the tree to compute absolute canvas-space positions (including the panel title-bar Y offset for panel children). Both `useCanvasPointer` and `SelectionOverlay` now use these helpers.

## 2026-04-07 08:55

### Bug fixes

- **Canvas context menu delete not working**: Clicking a menu item in the canvas context menu (a React portal) was bubbling `pointerdown`/`pointerup`/`click` through the React component tree into the canvas container's `onPointerDown` handler, which called `setPointerCapture` and dispatched `DESELECT_ALL`, preventing delete from completing and the menu from closing. Fixed by adding `stopPropagation` for `onPointerDown`, `onPointerUp`, `onClick`, and `onContextMenu` on the `ContextMenu` div — applies to both canvas and tree context menus.
- **Unit test**: Added `tests/store/canvasContextMenu.test.ts` with 5 tests covering the delete action sequence (shape removed from map, removed from tree, selection cleared, other shapes unaffected, full action sequence).

## 2026-04-07 08:34

### Features & fixes

- **Canvas context menu**: Right-clicking anywhere on the canvas now shows a context menu. Right-clicking a shape selects it and shows: Add Child Shape submenu, Bring to Front/Send to Back/Move Up/Move Down, Hide/Show, Lock/Unlock, Delete. Right-clicking empty canvas shows an Add Shape submenu (all types inserted at the cursor position, added to the active page). Implemented in `CanvasContextMenu.tsx`; `useCanvasPointer` exposes `onContextMenu`/`contextMenu`/`closeContextMenu`.
- **Stable rough.js seeds**: `seedFromId` helper derives a deterministic seed from each shape's UUID so hand-drawn paths don't jitter on re-render when shapes are moved. Added to `roughPaths.ts`; used in ButtonShape, PanelShape, and SliderShape.

## 2026-04-06 15:10

### Features & fixes

- **Hand-drawn UI components via rough.js**: `ButtonShape`, `PanelShape`, and `SliderShape` now render using the rough.js generator API (`roughRect`, `roughCircle`, `roughLine`) producing sketchy/hand-drawn SVG paths. Each component renders an absolute SVG overlay with `RoughSvgPaths` for the background, plus HTML overlay for text/children. PanelShape includes a rough divider line below the title bar. SliderShape renders a rough rect track and rough circle thumb positioned by `value`.
- Added `src/utils/roughPaths.ts` (generator utilities) and `src/utils/RoughSvgPaths.tsx` (SVG path component).

## 2026-04-06 14:53

### Features & fixes

- **Context menu on tree nodes**: Right-click any tree item to get a contextual menu. Pages show "Set as Active Page" + "Add Shape" submenu (all shape types). Non-page shapes show "Add Child Shape" submenu + Move Up/Down/To Front/To Back + Hide/Lock + Delete.
- **Light mode theme**: All panels, toolbar, canvas, and inputs converted from dark to light.
- **Wider properties panel**: Default 300px, resizable.
- **Resizable sidebars**: Drag handles between panels allow resizing both the left tree sidebar and right properties panel (min 150px, max 500px).
- **Locked shapes**: Locked shapes cannot be moved or have properties changed via the reducer (`MOVE_SHAPES`, `SET_TRANSFORM`, `PATCH_SHAPE` all bail out for locked shapes, except visibility/lock toggles). Properties panel shows a yellow banner and dims/disables the property sections while still showing values.
- **Selection overlay pan offset fix**: `SelectionOverlay` was rendering inside the CSS-transformed canvas div but then re-applying `panX/panY/zoom`, doubling the offset. Fixed to use canvas-space coordinates directly; handle sizes divided by `zoom` to stay visually constant.
- **Line rendering fix**: SVG path coordinates were in world space but the SVG was positioned at `(minX, minY)`. Path points now subtract `minX/minY` to be in SVG-local space.
- **Line selection fix**: Hit testing was skipping all lines. Added `pointNearLine` hit test with a tolerance scaled by `1/zoom`.
- **Lucide-react icons**: Replaced emoji/unicode icons in toolbar and tree panel with lucide-react icons.
- **Reparenting via context menu**: "Move into" shape nesting is available via the context menu "Add Child Shape" flow (creates shape as child of target node).

## 2026-04-06 14:42

### Bug fixes

- **Double-click text editing broken**: `setPointerCapture` on the canvas container retargets all derived mouse events (including `dblclick`) to itself, so `onDoubleClick` on shape divs never fired. Fixed by adding `onDoubleClick` directly to the container in `useCanvasPointer` — it hit-tests the position and dispatches `START_TEXT_EDIT` for text-bearing shapes (text, button, panel).
- **Text content not editable from properties panel**: `TextSection` only exposed style properties (color, font size, alignment). Added a `ContentSection` component with a textarea that dispatches `COMMIT_TEXT_EDIT` on change. Added to the properties panel for `text`, `button`, and `panel` shape types.
- Added 10 unit tests covering `START_TEXT_EDIT`, `STOP_TEXT_EDIT`, `COMMIT_TEXT_EDIT` (for all three shape types, undoability, no-ops), and `PATCH_SHAPE` for text style properties.

## 2026-04-06 12:07

Initial implementation of Vibe 2D Layout.

### Data Model (`src/model/`)
- `shapes.ts`: Discriminated union of all shape types (rect, circle, line, text, image, page, button, panel, slider) with shared style interfaces (FillStyle, StrokeStyle, TextStyle)
- `document.ts`: VibeDocument with flat normalized shape map + separate TreeNode topology; tree helpers (findNode, removeNode, insertNode, getAllIds)
- `transform.ts`: BoundingBox, Point, Anchor types
- `connector.ts`: ConnectorEndpoint (free | attached) and ConnectorRoute

### Store (`src/store/`)
- `types.ts`: AppState, all AppAction discriminated union (DocumentAction, SelectionAction, ViewAction, HistoryAction)
- `reducer.ts`: Pure reducer handling all actions; screen↔canvas coordinate helpers
- `history.ts`: Undo/redo via snapshot ring-buffer (max 100); only DocumentActions create history entries
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
- **Canvas**: Pan/zoom, shape rendering (HTML div-based), selection overlay with 8 resize handles, connector line rendering (SVG), inline text editing
- **Toolbar**: Tool mode buttons, undo/redo, zoom display, save/load
- **Tree panel**: Recursive tree view, expand/collapse, visibility/lock/delete per node, add shape menu
- **Properties panel**: Per-shape type sections (Transform, Fill, Stroke, Text, Image, Connector, Page)

### Hooks (`src/hooks/`)
- `useCanvasPointer`: Pointer state machine for select/pan/insert tool modes
- `usePanZoom`: Wheel event handler for zoom (Ctrl+wheel) and pan
- `useDocumentShortcuts`: Keyboard shortcuts (undo, redo, delete, arrows, escape, select-all)

### Tests (`tests/`)
- 64 unit tests across 6 test files covering document tree operations, geometry, connector routing, serialization, reducer actions, and undo/redo history
## 2026-04-23 09:05

- Converted all inline `<div className={styles.section}>` blocks in `PropertiesPanel.tsx` to use `<CollapsibleSection>` (21 sections total)
- Removed unused `styles` import from ContentSection, FillSection, PageSection, ShadowSection, StrokeSection

## 2026-04-23 09:15

- Added `scaleX`, `scaleY`, `skewX`, `skewY` optional fields to `BoundingBox` in `src/model/transform.ts`
- Added `buildCSSTransform(t)` utility that composes rotate/scale/skew into a CSS transform string
- Updated all 25 shape renderers to use `buildCSSTransform(transform)` instead of inline rotate-only expression
- Added SX (scale X %), SY (scale Y %), KX (skew X °), KY (skew Y °) inputs to `TransformSection`

## 2026-04-23 09:25

- Reordered Transform section fields: X/Y, W/H, SX/SY, KX/KY, °
- Widened `.tlabel` from 10px to 14px to fit 2-char labels (SX, SY, KX, KY)

## 2026-04-23 09:40

- Fix: shapes being dragged on a secondary page could be silently reparented to containers on another page
- Root cause: `findDropTarget` in `useCanvasPointer.ts` walked all pages' shape trees; since pages default to canvas origin (0,0), page 1 containers matched drop targets for shapes on page 2
- Fix: scope `findDropTarget` to active page's children only, via new `activePageId` parameter
