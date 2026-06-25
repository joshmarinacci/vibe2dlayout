import {findNode, getAllIds, getUnfiledPageIds} from '@model/document'
import type {ImageAsset} from '@model/imageAsset'
import type {PageTemplate, ShapeTemplate} from '@model/library'
import type {MimeType} from '@model/shapes'
import type {Shape, ShapeType} from '@model/shapes'
import {getActiveTheme} from '@model/theme'
import {useShapeRegistry} from '@powerups/shapeRegistry'
import {useAppDispatch, useAppState} from '@store/context'
import {generateId} from '@utils/idgen'
import {createEmptyPixelAsset} from '@model/pixelAsset'
import {createShape} from '@utils/shapeFactory'
import {useEffect, useRef, useState, type ChangeEvent, type MouseEvent} from 'react'
import {AssetsSection} from './AssetsSection'
import {DimensionAddDialog} from './DimensionAddDialog'
import {DimensionsSection} from './DimensionsSection'
import {FontAddDialog} from './FontAddDialog'
import {DocumentRow} from './DocumentRow'
import {FontsSection} from './FontsSection'
import {GradientsSection} from './GradientsSection'
import {LibrarySection} from './LibrarySection'
import {ImageUrlAddDialog} from './ImageUrlAddDialog'
import {PageFolderRow} from './PageFolderRow'
import {PixelAssetsSection} from './PixelAssetsSection'
import {SectionHeader} from './SectionHeader'
import {SketchStylesSection} from './SketchStylesSection'
import {RichTextStyleSetsSection} from './RichTextStyleSetsSection'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import {TreeNodeComp} from './TreeNode'
import {createPortal} from 'react-dom'
import styles from './TreePanel.module.css'

const BASIC_SHAPES: { type: ShapeType; label: string }[] = [
    {type: 'rect', label: 'Rectangle'},
    {type: 'circle', label: 'Circle'},
    {type: 'line', label: 'Line'},
    {type: 'text', label: 'Text'},
    {type: 'image', label: 'Image'},
]

const MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']


export function TreePanel() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const registeredShapes = useShapeRegistry()
    const containerTypes = registeredShapes.filter(s => s.category === 'containers')
    const formControls = registeredShapes.filter(s => s.category === 'forms')
    const mockupTypes = registeredShapes.filter(s => s.category === 'mockups')
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [assetsCollapsed, setAssetsCollapsed] = useState(false)
    const [libraryCollapsed, setLibraryCollapsed] = useState(false)
    const addMenuRef = useRef<HTMLDivElement>(null)
    const assetsActionButtonRef = useRef<HTMLButtonElement>(null)
    const libraryActionButtonRef = useRef<HTMLButtonElement>(null)
    const libraryImageInputRef = useRef<HTMLInputElement>(null)
    const [sectionMenu, setSectionMenu] = useState<{x: number; y: number; section: 'assets' | 'library'} | null>(null)
    const [showAssetImageDialog, setShowAssetImageDialog] = useState(false)
    const [showAssetDimensionDialog, setShowAssetDimensionDialog] = useState(false)
    const [showAssetFontDialog, setShowAssetFontDialog] = useState(false)
    const [showLibraryDimensionDialog, setShowLibraryDimensionDialog] = useState(false)
    const [showLibraryFontDialog, setShowLibraryFontDialog] = useState(false)

    // Close menu when clicking outside (but not inside the menu itself)
    useEffect(() => {
        if (!showAddMenu) return
        const handler = (e: PointerEvent) => {
            if (addMenuRef.current?.contains(e.target as Node)) return
            setShowAddMenu(false)
        }
        window.addEventListener('pointerdown', handler, {capture: true})
        return () => window.removeEventListener('pointerdown', handler, {capture: true})
    }, [showAddMenu])

    const {rootNodes, shapes, pageFolders} = state.document

    const addShape = (type: string) => {
        const shape = createShape(type, 50, 50, getActiveTheme(state.document))
        dispatch({type: 'ADD_SHAPE', parentId: state.activePageId, shape})
        dispatch({type: 'SELECT_SHAPES', ids: [shape.id], additive: false})
        setShowAddMenu(false)
    }

    const addPage = () => {
        const shape = createShape('page')
        dispatch({type: 'ADD_SHAPE', parentId: null, shape})
        dispatch({type: 'SET_ACTIVE_PAGE', pageId: shape.id})
        setShowAddMenu(false)
    }

    const addFolder = () => {
        const folder = {
            id: generateId(),
            name: 'New Folder',
            pageIds: [],
            collapsed: false,
        }
        dispatch({type: 'ADD_PAGE_FOLDER', folder})
        setShowAddMenu(false)
    }

    const addDocumentImage = (asset: ImageAsset) => {
        dispatch({type: 'ADD_IMAGE_ASSET', asset})
        dispatch({type: 'SELECT_IMAGE_ASSET', assetId: asset.id})
    }

    const addLibraryImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !MIME_TYPES.includes(file.type)) return
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.split(',')[1] ?? ''
            const img = new Image()
            img.onload = () => {
                const id = generateId()
                dispatch({
                    type: 'ADD_LIBRARY_IMAGE',
                    image: {
                        id,
                        name: file.name.replace(/\.[^.]+$/, ''),
                        src: base64,
                        mimeType: file.type as MimeType,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                    },
                })
            }
            img.src = dataUrl
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const addLibraryGradient = () => {
        dispatch({
            type: 'ADD_LIBRARY_GRADIENT',
            gradient: {
                id: generateId(),
                name: 'New Gradient',
                stops: [{color: '#000000', position: 0}, {color: '#ffffff', position: 1}],
            },
        })
    }

    const addDocumentPixelImage = () => {
        const asset = createEmptyPixelAsset(generateId(), 'Pixel Image')
        dispatch({type: 'ADD_PIXEL_ASSET', asset})
        dispatch({type: 'SELECT_PIXEL_ASSET', assetId: asset.id})
    }

    const selectedShapeId = state.selection.ids.find(id => {
        const shape = state.document.shapes[id]
        return shape && shape.type !== 'page'
    }) ?? null
    const selectedShapeNode = selectedShapeId ? findNode(state.document.rootNodes, selectedShapeId) : null
    const activePageNode = state.activePageId ? findNode(state.document.rootNodes, state.activePageId) : null

    const saveSelectedShapeTemplate = () => {
        if (!selectedShapeId || !selectedShapeNode) return
        const ids = getAllIds([selectedShapeNode])
        const templateShapes: Record<string, Shape> = {}
        for (const id of ids) {
            if (state.document.shapes[id]) templateShapes[id] = state.document.shapes[id]
        }
        const shape = state.document.shapes[selectedShapeId]
        const template: ShapeTemplate = {
            id: generateId(),
            name: shape?.name ?? 'Shape',
            rootNode: selectedShapeNode,
            shapes: templateShapes,
        }
        dispatch({type: 'ADD_LIBRARY_SHAPE_TEMPLATE', template})
    }

    const saveActivePageTemplate = () => {
        if (!state.activePageId || !activePageNode) return
        const ids = getAllIds([activePageNode])
        const templateShapes: Record<string, Shape> = {}
        for (const id of ids) {
            if (state.document.shapes[id]) templateShapes[id] = state.document.shapes[id]
        }
        const page = state.document.shapes[state.activePageId]
        const template: PageTemplate = {
            id: generateId(),
            name: page?.name ?? 'Page',
            rootNode: activePageNode,
            shapes: templateShapes,
        }
        dispatch({type: 'ADD_LIBRARY_PAGE_TEMPLATE', template})
    }

    const assetsMenuGroups: ContextMenuGroup[] = [
        {
            items: [
                {label: 'Images', onClick: () => setShowAssetImageDialog(true)},
                {label: 'Dimensions', onClick: () => setShowAssetDimensionDialog(true)},
                {label: 'Pixel Images', onClick: addDocumentPixelImage},
            ],
        },
        {
            items: [
                {label: 'Fonts', onClick: () => setShowAssetFontDialog(true)},
                {label: 'Gradients', onClick: () => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})},
                {label: 'Sketch Styles', onClick: () => dispatch({type: 'TOGGLE_SKETCH_STYLE_MODAL'})},
            ],
        },
    ]

    const libraryMenuGroups: ContextMenuGroup[] = [
        {
            items: [
                {label: 'Gradients', onClick: addLibraryGradient},
                {label: 'Images', onClick: () => libraryImageInputRef.current?.click()},
                {label: 'Dimensions', onClick: () => setShowLibraryDimensionDialog(true)},
                {label: 'Fonts', onClick: () => setShowLibraryFontDialog(true)},
            ],
        },
        {
            items: [
                {label: 'Shape Templates', onClick: saveSelectedShapeTemplate, disabled: !selectedShapeNode},
                {label: 'Page Templates', onClick: saveActivePageTemplate, disabled: !activePageNode},
            ],
        },
    ]

    const openSectionMenu = (section: 'assets' | 'library', e: MouseEvent<HTMLButtonElement>) => {
        setSectionMenu({x: e.clientX, y: e.clientY, section})
    }

    const unfiledPageIds = getUnfiledPageIds(rootNodes, pageFolders, shapes)

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.title}>Layers</span>
                <div className={styles.headerActions}>
                    <div ref={addMenuRef} style={{position: 'relative'}}>
                        <button
                            className={styles.addBtn}
                            onClick={() => setShowAddMenu(v => !v)}
                            title="Add shape"
                        >+
                        </button>
                        {showAddMenu && (
                            <div className={styles.addMenu}>
                                <div className={styles.addMenuGroup}>
                                    <div className={styles.addMenuLabel}>Page</div>
                                    <button className={styles.addMenuItem} onClick={addPage}>Page
                                    </button>
                                    <button className={styles.addMenuItem}
                                            onClick={addFolder}>Folder
                                    </button>
                                </div>
                                <div className={styles.addMenuDivider}/>
                                <div className={styles.addMenuGroup}>
                                    <div className={styles.addMenuLabel}>Shapes</div>
                                    {BASIC_SHAPES.map(opt => (
                                        <button key={opt.type} className={styles.addMenuItem}
                                                onClick={() => addShape(opt.type)}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {containerTypes.length > 0 && <>
                                    <div className={styles.addMenuDivider}/>
                                    <div className={styles.addMenuGroup}>
                                        <div className={styles.addMenuLabel}>Containers</div>
                                        {containerTypes.map(s => (
                                            <button key={s.type} className={styles.addMenuItem}
                                                    onClick={() => addShape(s.type)}>
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </>}
                                {formControls.length > 0 && <>
                                    <div className={styles.addMenuDivider}/>
                                    <div className={styles.addMenuGroup}>
                                        <div className={styles.addMenuLabel}>Form Controls</div>
                                        {formControls.map(s => (
                                            <button key={s.type} className={styles.addMenuItem}
                                                    onClick={() => addShape(s.type)}>
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </>}
                                {mockupTypes.length > 0 && <>
                                    <div className={styles.addMenuDivider}/>
                                    <div className={styles.addMenuGroup}>
                                        <div className={styles.addMenuLabel}>Mockups</div>
                                        {mockupTypes.map(s => (
                                            <button key={s.type} className={styles.addMenuItem}
                                                    onClick={() => addShape(s.type)}>
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tree}>
                {/* Document item at top */}
                <DocumentRow
                    documentName={state.documentName}
                    documentSelected={state.panelSelection?.kind === 'document'}
                    dispatch={dispatch}
                    onAddPage={addPage}
                    onRename={name => dispatch({
                        type: 'SET_DOCUMENT_META',
                        id: state.documentId,
                        name
                    })}
                />

                <div className={styles.separator}/>

                {/* Page folders */}
                {pageFolders.map((folder, i) => (
                    <PageFolderRow
                        key={folder.id}
                        folder={folder}
                        rootNodes={rootNodes}
                        shapes={shapes}
                        selectedIds={state.selection.ids}
                        activePageId={state.activePageId}
                        dispatch={dispatch}
                        isFirst={i === 0}
                        isLast={i === pageFolders.length - 1}
                    />
                ))}

                {/* Unfiled pages */}
                {unfiledPageIds.map((id, i) => {
                    const node = rootNodes.find(n => n.id === id)
                    if (!node) return null
                    return (
                        <TreeNodeComp
                            key={node.id}
                            node={node}
                            rootNodes={rootNodes}
                            shapes={shapes}
                            depth={0}
                            selectedIds={state.selection.ids}
                            activePageId={state.activePageId}
                            dispatch={dispatch}
                            parentId={null}
                            nodeIndex={i}
                        />
                    )
                })}

                <div className={styles.separator}/>

                {/* Asset sections */}
                <SectionHeader
                    label="Assets"
                    collapsible
                    collapsed={assetsCollapsed}
                    onToggle={() => setAssetsCollapsed(v => !v)}
                    actionButtonRef={assetsActionButtonRef}
                    actionTitle="Add asset"
                    onAction={e => openSectionMenu('assets', e)}
                />
                {!assetsCollapsed && <>
                    <AssetsSection
                        assets={state.document.images}
                        selectedAssetId={state.panelSelection?.kind === 'image-asset' ? state.panelSelection.id : null}
                        dispatch={dispatch}
                        shapes={state.document.shapes}
                    />
                    <DimensionsSection
                        assets={state.document.dimensions}
                        selectedDimensionAssetId={state.panelSelection?.kind === 'dimension-asset' ? state.panelSelection.id : null}
                        dispatch={dispatch}
                        shapes={state.document.shapes}
                    />
                    <PixelAssetsSection
                        assets={state.document.pixelAssets}
                        selectedPixelAssetId={state.panelSelection?.kind === 'pixel-asset' ? state.panelSelection.id : null}
                        dispatch={dispatch}
                        shapes={state.document.shapes}
                    />
                    <FontsSection
                        customFonts={state.document.customFonts}
                        selectedFontName={state.panelSelection?.kind === 'font' ? state.panelSelection.name : null}
                        dispatch={dispatch}
                    />
                    <GradientsSection
                        gradients={state.document.gradients ?? []}
                        selectedGradientId={state.panelSelection?.kind === 'gradient' ? state.panelSelection.id : null}
                        dispatch={dispatch}
                    />
                    <SketchStylesSection
                        sketchStyles={state.document.sketchStyles ?? []}
                        dispatch={dispatch}
                    />
                    <RichTextStyleSetsSection />
                </>}

                <div className={styles.separator}/>
                <SectionHeader
                    label="Library"
                    collapsible
                    collapsed={libraryCollapsed}
                    onToggle={() => setLibraryCollapsed(v => !v)}
                    actionButtonRef={libraryActionButtonRef}
                    actionTitle="Add library item"
                    onAction={e => openSectionMenu('library', e)}
                />
                {!libraryCollapsed && <LibrarySection
                    library={state.library}
                    selectedId={state.panelSelection?.kind === 'library-item' ? state.panelSelection.id : null}
                    selectedType={state.panelSelection?.kind === 'library-item' ? state.panelSelection.itemType : null}
                    shapes={state.document.shapes}
                    activePageId={state.activePageId}
                    dispatch={dispatch}
                />}
            </div>

            {sectionMenu && createPortal(
                <ContextMenu
                    x={sectionMenu.x}
                    y={sectionMenu.y}
                    groups={sectionMenu.section === 'assets' ? assetsMenuGroups : libraryMenuGroups}
                    onClose={() => setSectionMenu(null)}
                />,
                document.body,
            )}

            <ImageUrlAddDialog
                open={showAssetImageDialog}
                anchorRef={assetsActionButtonRef}
                title="Image"
                onCancel={() => setShowAssetImageDialog(false)}
                onCreate={addDocumentImage}
            />

            <DimensionAddDialog
                open={showAssetDimensionDialog}
                anchorRef={assetsActionButtonRef}
                title="Dimension"
                onCancel={() => setShowAssetDimensionDialog(false)}
                onCreate={asset => {
                    dispatch({type: 'ADD_DIMENSION_ASSET', asset})
                    dispatch({type: 'SELECT_DIMENSION_ASSET', assetId: asset.id})
                }}
            />

            <FontAddDialog
                open={showAssetFontDialog}
                anchorRef={assetsActionButtonRef}
                title="Font"
                onCancel={() => setShowAssetFontDialog(false)}
                onCreate={font => dispatch({type: 'ADD_CUSTOM_FONT', font})}
            />

            <DimensionAddDialog
                open={showLibraryDimensionDialog}
                anchorRef={libraryActionButtonRef}
                title="Dimension"
                onCancel={() => setShowLibraryDimensionDialog(false)}
                onCreate={asset => dispatch({type: 'ADD_LIBRARY_DIMENSION', dimension: asset})}
            />

            <FontAddDialog
                open={showLibraryFontDialog}
                anchorRef={libraryActionButtonRef}
                title="Font"
                onCancel={() => setShowLibraryFontDialog(false)}
                onCreate={font => dispatch({type: 'ADD_LIBRARY_FONT', font})}
            />

            <input
                ref={libraryImageInputRef}
                type="file"
                accept={MIME_TYPES.join(',')}
                style={{display: 'none'}}
                onChange={addLibraryImage}
            />
        </div>
    )
}
