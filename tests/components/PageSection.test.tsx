import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import type {Dispatch} from 'react'
import {describe, expect, it, vi} from 'vitest'
import type {DimensionAsset} from '../../src/model/dimensionAsset'
import type {PageShape} from '../../src/model/shapes'
import type {AppAction} from '../../src/store/types'
import {PageSection} from '../../src/components/properties/sections/PageSection'

vi.mock('../../src/components/properties/CollapsibleSection', () => ({
    CollapsibleSection: ({title, children}: {title: string; children: ReactNode}) => (
        <section data-testid={`section-${title}`}>{children}</section>
    ),
}))

function makePage(overrides: Partial<PageShape> = {}): PageShape {
    const page = {
        id: 'page-1',
        name: 'Page 1',
        type: 'page',
        locked: false,
        visible: true,
        transform: {x: 0, y: 0, width: 800, height: 600, rotation: 0},
        fixedSize: {width: 800, height: 600},
        pageSize: {kind: 'preset', presetId: 'presentation-4-3'},
        background: '#ffffff',
        clipChildren: false,
        ...overrides,
    } as PageShape
    return page
}

describe('PageSection', () => {
    it('selects a built-in preset', async () => {
        const user = userEvent.setup()
        const dispatch = vi.fn()
        render(
            <PageSection
                shape={makePage({fixedSize: null, pageSize: null})}
                documentDimensions={[]}
                libraryDimensions={[]}
                dispatch={dispatch}
            />,
        )

        await user.selectOptions(screen.getByDisplayValue('Infinite'), 'preset:presentation-4-3')
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'PATCH_SHAPE',
            id: 'page-1',
            patch: expect.objectContaining({
                pageSize: {kind: 'preset', presetId: 'presentation-4-3'},
                fixedSize: {width: 800, height: 600},
            }),
        }))
    })

    it('uses a document dimension asset', async () => {
        const user = userEvent.setup()
        const dispatch = vi.fn()
        const dimension: DimensionAsset = {id: 'dim-1', name: 'Poster', width: 1200, height: 1800}
        render(
            <PageSection
                shape={makePage({fixedSize: null, pageSize: null})}
                documentDimensions={[dimension]}
                libraryDimensions={[]}
                dispatch={dispatch}
            />,
        )

        await user.selectOptions(screen.getByDisplayValue('Infinite'), 'document:dim-1')
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'PATCH_SHAPE',
            id: 'page-1',
            patch: expect.objectContaining({
                pageSize: {kind: 'asset', scope: 'document', assetId: 'dim-1'},
                fixedSize: {width: 1200, height: 1800},
            }),
        }))
    })

    it('uses a library dimension asset', async () => {
        const user = userEvent.setup()
        const dispatch = vi.fn()
        const dimension: DimensionAsset = {id: 'dim-2', name: 'Backdrop', width: 1920, height: 1080}
        render(
            <PageSection
                shape={makePage({fixedSize: null, pageSize: null})}
                documentDimensions={[]}
                libraryDimensions={[dimension]}
                dispatch={dispatch}
            />,
        )

        await user.selectOptions(screen.getByDisplayValue('Infinite'), 'library:dim-2')
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'PATCH_SHAPE',
            id: 'page-1',
            patch: expect.objectContaining({
                pageSize: {kind: 'asset', scope: 'library', assetId: 'dim-2'},
                fixedSize: {width: 1920, height: 1080},
            }),
        }))
    })

    it('updates custom width and height', async () => {
        const user = userEvent.setup()
        let page: PageShape = makePage({pageSize: {kind: 'custom', width: 800, height: 600}})
        const dispatchSpy = vi.fn()
        const dispatch = ((action: AppAction) => {
            dispatchSpy(action)
            if (action.type === 'PATCH_SHAPE' && action.patch) {
                page = {...page, ...action.patch} as PageShape
                view.rerender(
                    <PageSection
                        shape={page}
                        documentDimensions={[]}
                        libraryDimensions={[]}
                        dispatch={dispatch}
                    />,
                )
            }
        }) as Dispatch<AppAction>
        const view = render(
            <PageSection
                shape={page}
                documentDimensions={[]}
                libraryDimensions={[]}
                dispatch={dispatch}
            />,
        )

        const [widthInput, heightInput] = screen.getAllByRole('textbox')
        await user.clear(widthInput)
        await user.type(widthInput, '1024')
        await user.tab()
        await user.clear(heightInput)
        await user.type(heightInput, '768')
        await user.tab()

        expect(dispatchSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'PATCH_SHAPE',
            id: 'page-1',
            patch: expect.objectContaining({
                pageSize: {kind: 'custom', width: 1024, height: 600},
                fixedSize: {width: 1024, height: 600},
            }),
        }))
        expect(dispatchSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
            type: 'PATCH_SHAPE',
            id: 'page-1',
            patch: expect.objectContaining({
                pageSize: {kind: 'custom', width: 1024, height: 768},
                fixedSize: {width: 1024, height: 768},
            }),
        }))
    })
})
