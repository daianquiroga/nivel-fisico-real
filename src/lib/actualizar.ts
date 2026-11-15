import { registerSW } from 'virtual:pwa-register'

/* Actualización automática: cada vez que la app se abre o vuelve a primer plano, pregunta si hay
   una versión nueva. Si la hay, la instala y recarga la pantalla sola. */
export function registrarActualizaciones() {
  if (!('serviceWorker' in navigator)) return
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
