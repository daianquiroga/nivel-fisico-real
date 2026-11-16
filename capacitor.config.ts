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
    // Actualizaciones de la parte web dentro de la app, bajadas de la página de GitHub del propio repositorio.
    // Modo manual: el plugin no consulta a ningún servidor de terceros y no manda estadísticas (statsUrl vacío).
    CapacitorUpdater: {
      autoUpdate: false,
      statsUrl: '',
      updateUrl: '',
      channelUrl: '',
    },
  },
}

export default config
