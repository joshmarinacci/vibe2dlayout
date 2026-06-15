import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {clearLogRecords, createLogger} from '../../src/logging'

const dispatch = vi.fn()

vi.mock('@store/context', () => ({
    useAppState: () => ({
        state: {showLogConsole: true},
    }),
    useAppDispatch: () => dispatch,
}))

import {LogConsole} from '../../src/components/layout/LogConsole'

beforeEach(() => {
    clearLogRecords()
    dispatch.mockClear()
})

describe('LogConsole', () => {
    it('filters log entries by search text', async () => {
        const user = userEvent.setup()
        createLogger('renderer').info('Canvas ready', {pageId: 'page-1'})
        createLogger('importer').warn('Import failed', {filePath: '/tmp/test.json'})

        render(<LogConsole/>)

        expect(screen.getByText('2/2')).toBeInTheDocument()

        await user.type(screen.getByPlaceholderText('Search logs'), 'Canvas')

        expect(screen.getByText('1/2')).toBeInTheDocument()
        expect(screen.getByText('Canvas ready')).toBeInTheDocument()
        expect(screen.queryByText('Import failed')).not.toBeInTheDocument()
    })

    it('renders expandable JSON payloads', async () => {
        const user = userEvent.setup()
        createLogger('exporter').info('Export complete', {format: 'pdf', pageCount: 3})

        render(<LogConsole/>)

        await user.click(screen.getByText('Export complete').closest('button') as HTMLElement)

        const payload = screen.getByText('JSON').parentElement
        expect(payload).toHaveTextContent('"format": "pdf"')
        expect(payload).toHaveTextContent('"pageCount": 3')
    })

    it('clears visible logs', async () => {
        const user = userEvent.setup()
        createLogger('renderer').info('Canvas ready', {pageId: 'page-1'})

        render(<LogConsole/>)

        await user.click(screen.getByTitle('Clear logs'))

        expect(screen.getByText('No matching log entries.')).toBeInTheDocument()
        expect(screen.getByText('0/0')).toBeInTheDocument()
    })
})
