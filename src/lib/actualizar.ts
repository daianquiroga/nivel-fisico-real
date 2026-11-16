import { Capacitor } from '@capacitor/core'
import { registerSW } from 'virtual:pwa-register'

/* Actualización automática: cada vez que la app se abre o vuelve a primer plano, pregunta si hay
   una versión nueva. Si la hay, la instala y recarga la pantalla sola. */
export function registrarActualizaciones() {
  // En la app de Android los archivos ya vienen dentro de la app: no hace falta el service worker.
  if (!('serviceWorker' in navigator) || Capacitor.isNativePlatform()) return
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registro) {
      if (!registro) return
      const buscar = () => {
        if (navigator.onLine) void registro.update()
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') buscar()
      })
      setInterval(buscar, 30 * 60 * 1000)
    },
  })
}
