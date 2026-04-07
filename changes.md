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
