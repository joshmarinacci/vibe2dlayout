import {AppShell} from '@components/layout/AppShell'
import {AppProvider} from '@store/context'

export default function App() {
    return (
        <AppProvider>
            <AppShell/>
        </AppProvider>
    )
}
