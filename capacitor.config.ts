import type { CapacitorConfig } from '@capacitor/cli'

// App de Android: la misma app web, envuelta con Capacitor (entrega 7).
const config: CapacitorConfig = {
  appId: 'ar.nivelfisicoreal.app',
  appName: 'Nivel Físico Real',
  webDir: 'dist',
  android: {
    backgroundColor: '#0D0F12',
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#B8233F',
    },
  },
}

export default config
