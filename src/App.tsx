import {AppShell} from '@components/layout/AppShell'
import {usePowerUpsRuntime} from '@hooks/usePowerUpsRuntime'
import {useTauriMenu} from '@hooks/useTauriMenu'
import {AppProvider} from '@store/context'

function AppInner() {
    useTauriMenu()
    usePowerUpsRuntime()
    return <AppShell/>
}

export default function App() {
    return (
        <AppProvider>
            <AppInner/>
        </AppProvider>
    )
}
