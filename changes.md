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
