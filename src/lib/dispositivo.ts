import { useEffect } from 'react'

/* Pitidos, vibración y pantalla encendida. Todo es opcional: si el celular no lo permite, la app sigue igual. */

let contexto: AudioContext | null = null

/** Pitido corto. Llamar primero desde un toque del usuario para que el navegador habilite el sonido. */
export function pitido(frecuencia = 880, duracionMs = 160, volumen = 0.25) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    contexto ??= new AC()
    if (contexto.state === 'suspended') void contexto.resume()
    const osc = contexto.createOscillator()
    const gan = contexto.createGain()
    osc.frequency.value = frecuencia
    gan.gain.value = volumen
    osc.connect(gan).connect(contexto.destination)
    const t = contexto.currentTime
    gan.gain.setValueAtTime(volumen, t)
    gan.gain.exponentialRampToValueAtTime(0.001, t + duracionMs / 1000)
    osc.start(t)
    osc.stop(t + duracionMs / 1000 + 0.02)
  } catch {
    /* sin sonido */
  }
}

export function vibrar(patron: number | number[] = 120) {
  try {
    navigator.vibrate?.(patron)
  } catch {
    /* sin vibración */
  }
}

export function avisoFin() {
  pitido(660, 220)
  setTimeout(() => pitido(990, 400), 260)
  vibrar([200, 100, 300])
}

/** Mantiene la pantalla encendida mientras el componente está activo. */
export function usarPantallaEncendida(activa = true) {
  useEffect(() => {
    if (!activa || !('wakeLock' in navigator)) return
    let bloqueo: WakeLockSentinel | null = null
    let cancelado = false
    const pedir = async () => {
      try {
        bloqueo = await navigator.wakeLock.request('screen')
        if (cancelado) void bloqueo.release()
      } catch {
        /* el navegador no lo permitió */
      }
    }
    void pedir()
    const alVolver = () => document.visibilityState === 'visible' && void pedir()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', alVolver)
      void bloqueo?.release()
    }
  }, [activa])
}
