import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SettingsProvider } from './context/SettingsContext'
import AppRoutes from './routes'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
