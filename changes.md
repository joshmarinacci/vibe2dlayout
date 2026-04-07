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
