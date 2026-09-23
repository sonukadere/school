import { AppConfigProvider } from './context/AppConfigContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SettingsProvider } from './context/SettingsContext'
import { NotificationProvider } from './context/NotificationContext'
import AppRoutes from './routes'

function App() {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <ToastProvider>
          <SettingsProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </SettingsProvider>
        </ToastProvider>
      </AuthProvider>
    </AppConfigProvider>
  )
}

export default App
