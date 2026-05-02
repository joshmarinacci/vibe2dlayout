import {useDocumentShortcuts} from '@hooks/useDocumentShortcuts'
import {usePanZoom} from '@hooks/usePanZoom'
import {getActiveTheme} from '@model/theme'
import {useAppDispatch, useAppState} from '@store/context'
import {buildParentMap, getAbsoluteTransform} from '@utils/geometry'
import {getEffectiveGridSettings} from '@utils/snapping'
import {useEffect, useRef, useState} from 'react'
import {CanvasContextMenu, type CssDialogState} from './CanvasContextMenu'
import {CanvasGrid} from './CanvasGrid'
import {CanvasGuides} from './CanvasGuides'
import {CanvasRuler, RULER_SIZE} from './CanvasRuler'
import styles from './CanvasView.module.css'
import {PixelEditorOverlay} from './PixelEditorOverlay'
import {SelectionOverlay} from './SelectionOverlay'
import {ShapeRenderer} from './ShapeRenderer'
import {SnapGuides} from './SnapGuides'
import {TextCssDialog} from './TextCssDialog'
import {useCanvasPointer} from './useCanvasPointer'

export function CanvasView() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const {handleWheel} = usePanZoom()
    const containerRef = useRef<HTMLDivElement>(null)

    useDocumentShortcuts()

    // Attach wheel listener (non-passive for preventDefault)
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        el.addEventListener('wheel', handleWheel, {passive: false})
        return () => el.removeEventListener('wheel', handleWheel)
    }, [handleWheel])

    const {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onDoubleClick,
        onContextMenu,
        ghostRect,
        marqueeRect,
        contextMenu,
        closeContextMenu,
        spaceHeld,
        snapGuides,
        guidePreview
    } = useCanvasPointer(containerRef)
    const [cssDialog, setCssDialog] = useState<CssDialogState | null>(null)

    const {panX, panY, zoom} = state.viewTransform

    const activeNode = state.activePageId
        ? state.document.rootNodes.find(n => n.id === state.activePageId)
        : null

    const activePage = state.activePageId
        ? state.document.shapes[state.activePageId]
        : null

    const bgColor = activePage?.type === 'page' ? activePage.background : '#f0f0f0'

    const pixelAssetsMap = Object.fromEntries(
        state.document.pixelAssets.map(a => [a.id, a])
    )
    const editingPixelAsset = state.editingPixelAssetId
        ? pixelAssetsMap[state.editingPixelAssetId]
        : null

    const pageOriginX = activePage?.type === 'page' ? activePage.transform.x : 0
    const pageOriginY = activePage?.type === 'page' ? activePage.transform.y : 0

    return (
        <div
            ref={containerRef}
            className={styles.container}
            tabIndex={-1}
            style={{
                cursor: (state.toolMode === 'pan' || spaceHeld) ? 'grab' : 'default',
                outline: 'none'
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
        >
            {/* Canvas background (offset by ruler) */}
            <div className={styles.background} style={{top: RULER_SIZE, left: RULER_SIZE}}/>

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

                {/* Grid */}
                <CanvasGrid
                    settings={getEffectiveGridSettings(state.activePageId, state.document.shapes, state.document.gridSettings)}/>

                {/* Shape tree */}
                {activeNode && (
                    <ShapeRenderer
                        nodes={activeNode.children}
                        shapes={state.document.shapes}
                        selectedIds={state.selection.ids}
                        editingTextId={state.selection.editingTextId}
                        dispatch={dispatch}
                        handDrawn={getActiveTheme(state.document).handDrawn}
                        themeFontFamily={getActiveTheme(state.document).fontFamily}
                        variables={state.document.variables}
                        pixelAssets={pixelAssetsMap}
                    />
                )}

                {/* Selection overlay (inside transform so coords match) */}
                <SelectionOverlay containerRef={containerRef}/>

                {/* Alignment snap guide lines */}
                <SnapGuides guides={snapGuides} zoom={zoom}/>

                {/* Persistent user guide lines */}
                {state.activePageId && (
                    <CanvasGuides
                        guides={activePage?.type === 'page' ? (activePage.guides ?? []) : []}
                        previewGuide={guidePreview}
                        zoom={zoom}
                        pageId={state.activePageId}
                        dispatch={dispatch}
                    />
                )}

                {/* Drill-in scope border — one per level in the stack */}
                {state.drilledInContainerStack.map((containerId, i) => {
                    const parentMap = buildParentMap(state.document.rootNodes)
                    const abs = getAbsoluteTransform(containerId, state.document.shapes, parentMap)
                    if (!abs) return null
                    const pad = 2 / zoom
                    const isInnermost = i === state.drilledInContainerStack.length - 1
                    return (
                        <div key={containerId} style={{
                            position: 'absolute',
                            left: abs.x - pad,
                            top: abs.y - pad,
                            width: abs.width + pad * 2,
                            height: abs.height + pad * 2,
                            border: `${2 / zoom}px solid ${isInnermost ? 'rgba(251, 146, 60, 0.85)' : 'rgba(251, 146, 60, 0.35)'}`,
                            borderRadius: 2 / zoom,
                            pointerEvents: 'none',
                            zIndex: 9999,
                            boxSizing: 'border-box',
                        }}/>
                    )
                })}
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

            {/* Drill-in breadcrumb label */}
            {state.drilledInContainerStack.length > 0 && (() => {
                const labels = state.drilledInContainerStack.map(id => {
                    const shape = state.document.shapes[id]
                    return shape && 'name' in shape ? (shape as { name: string }).name : 'Container'
                })
                return (
                    <div style={{
                        position: 'absolute',
                        top: RULER_SIZE + 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(251, 146, 60, 0.9)',
                        color: 'white',
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: 4,
                        pointerEvents: 'none',
                        zIndex: 10000,
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                    }}>
                        Editing: {labels.join(' › ')}
                    </div>
                )
            })()}

            {contextMenu && (
                <CanvasContextMenu
                    menuState={contextMenu}
                    shapes={state.document.shapes}
                    rootNodes={state.document.rootNodes}
                    activePageId={state.activePageId}
                    dispatch={dispatch}
                    onClose={closeContextMenu}
                    onShowCssDialog={setCssDialog}
                />
            )}

            {cssDialog && (
                <TextCssDialog
                    css={cssDialog.css}
                    shapeName={cssDialog.name}
                    onClose={() => setCssDialog(null)}
                />
            )}

            {/* Pixel editor overlay */}
            {editingPixelAsset && (
                <PixelEditorOverlay
                    asset={editingPixelAsset}
                    palettes={state.document.palettes}
                    dispatch={dispatch}
                />
            )}
        </div>
    )
}
