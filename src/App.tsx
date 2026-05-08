import {AppShell} from '@components/layout/AppShell'
import {useTauriMenu} from '@hooks/useTauriMenu'
import {AppProvider} from '@store/context'

function AppInner() {
    useTauriMenu()
    return <AppShell/>
}

export default function App() {
    return (
        <AppProvider>
            <AppInner/>
        </AppProvider>
    )
}
