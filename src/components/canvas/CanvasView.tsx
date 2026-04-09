import { useEffect, useRef } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import { usePanZoom } from '@hooks/usePanZoom'
import { useDocumentShortcuts } from '@hooks/useDocumentShortcuts'
import { ShapeRenderer } from './ShapeRenderer'
import { SelectionOverlay } from './SelectionOverlay'
import { useCanvasPointer } from './useCanvasPointer'
import { CanvasContextMenu } from './CanvasContextMenu'
import { CanvasRuler, RULER_SIZE } from './CanvasRuler'
import styles from './CanvasView.module.css'

export function CanvasView() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const { handleWheel } = usePanZoom()
  const containerRef = useRef<HTMLDivElement>(null)

  useDocumentShortcuts()

  // Attach wheel listener (non-passive for preventDefault)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const { onPointerDown, onPointerMove, onPointerUp, onDoubleClick, onContextMenu, ghostRect, marqueeRect, contextMenu, closeContextMenu, spaceHeld } = useCanvasPointer(containerRef)

  const { panX, panY, zoom } = state.viewTransform

  const activeNode = state.activePageId
    ? state.document.rootNodes.find(n => n.id === state.activePageId)
    : null

  const activePage = state.activePageId
    ? state.document.shapes[state.activePageId]
    : null

  const bgColor = activePage?.type === 'page' ? activePage.background : '#f0f0f0'

  const pageOriginX = activePage?.type === 'page' ? activePage.transform.x : 0
  const pageOriginY = activePage?.type === 'page' ? activePage.transform.y : 0

  return (
    <div
      ref={containerRef}
      className={styles.container}
      tabIndex={-1}
      style={{ cursor: (state.toolMode === 'pan' || spaceHeld) ? 'grab' : 'default', outline: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {/* Canvas background (offset by ruler) */}
      <div className={styles.background} style={{ top: RULER_SIZE, left: RULER_SIZE }} />

      {/* Ruler overlay */}
      <CanvasRuler
        viewTransform={state.viewTransform}
        pageOriginX={pageOriginX}
        pageOriginY={pageOriginY}
      />

      {/* Transformed canvas content (offset by ruler) */}
      <div
        className={styles.canvas}
        style={{
          top: RULER_SIZE,
          left: RULER_SIZE,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Page background */}
        {activePage?.type === 'page' && (
          <div
            className={styles.pageBg}
            style={{
              width: activePage.fixedSize?.width ?? 4000,
              height: activePage.fixedSize?.height ?? 4000,
              left: activePage.fixedSize ? 0 : -2000,
              top: activePage.fixedSize ? 0 : -2000,
              background: bgColor,
            }}
          />
        )}

        {/* Shape tree */}
        {activeNode && (
          <ShapeRenderer
            nodes={activeNode.children}
            shapes={state.document.shapes}
            selectedIds={state.selection.ids}
            editingTextId={state.selection.editingTextId}
            dispatch={dispatch}
          />
        )}

        {/* Selection overlay (inside transform so coords match) */}
        <SelectionOverlay containerRef={containerRef} />
      </div>

      {/* Ghost rect for insert tool */}
      {ghostRect && (
        <div
          className={styles.ghostRect}
          style={{
            left: ghostRect.x,
            top: ghostRect.y,
            width: ghostRect.width,
            height: ghostRect.height,
          }}
        />
      )}
      {/* Marquee selection rectangle */}
      {marqueeRect && (
        <div
          className={styles.marqueeRect}
          style={{
            left: marqueeRect.x,
            top: marqueeRect.y,
            width: marqueeRect.width,
            height: marqueeRect.height,
          }}
        />
      )}

      {contextMenu && (
        <CanvasContextMenu
          menuState={contextMenu}
          shapes={state.document.shapes}
          rootNodes={state.document.rootNodes}
          activePageId={state.activePageId}
          dispatch={dispatch}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
