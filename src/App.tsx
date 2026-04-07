import { AppProvider } from '@store/context'
import { AppShell } from '@components/layout/AppShell'

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
