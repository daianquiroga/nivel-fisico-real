/* Carga de entrenamiento con el método del esfuerzo de la sesión (session-RPE).
   Fuente: Foster y otros 2001; revisión de validez: Haddad y otros 2017, Frontiers in Neuroscience 11:612
   (36 estudios validan el método). Carga de una sesión = esfuerzo (1 a 10, escala CR-10) × minutos.

   Comparar la última semana con el promedio de las 3 anteriores se inspira en la relación carga aguda : crónica
   (Gabbett 2016). Esa relación NO sirve para predecir lesiones (Impellizzeri y otros 2020, Journal of Athletic
   Training 55:893), así que la app solo avisa de un cambio brusco, sin hablar de riesgo de lesión.
   El corte de 1,5 veces (subida) y 0,5 (bajada) es decisión de diseño de la app. */

export interface SesionConEsfuerzo {
  /** Fecha ISO. */
  fecha: string
  minutos: number
  esfuerzo?: number
}

export const SUBIDA = 1.5
export const BAJADA = 0.5

export const cargaSesion = (esfuerzo: number, minutos: number) => Math.round(esfuerzo * minutos)

const DIA = 86_400_000

/** Carga de cada uno de los últimos `n` bloques de 7 días (el último es el de los 7 días hasta hoy). */
export function cargasSemanales(sesiones: SesionConEsfuerzo[], hoy = new Date(), n = 4): number[] {
  const fin = new Date(hoy)
  fin.setHours(23, 59, 59, 999)
  const out = Array.from({ length: n }, () => 0)
  for (const s of sesiones) {
    if (!s.esfuerzo) continue
    const atras = Math.floor((fin.getTime() - new Date(s.fecha).getTime()) / (7 * DIA))
    if (atras >= 0 && atras < n) out[n - 1 - atras] += cargaSesion(s.esfuerzo, s.minutos)
  }
  return out
}

export type EstadoCarga = 'sin-datos' | 'normal' | 'subida' | 'bajada'

/** Compara los últimos 7 días con el promedio de las 3 semanas anteriores (sin contarlos: no se mezclan). */
export function estadoCarga(semanas: number[]): { estado: EstadoCarga; relacion: number | null; promedio: number } {
  const actual = semanas[semanas.length - 1]
  const previas = semanas.slice(0, -1)
  const conDatos = previas.filter((x) => x > 0)
  if (conDatos.length < 2) return { estado: 'sin-datos', relacion: null, promedio: 0 }
  const promedio = previas.reduce((a, b) => a + b, 0) / previas.length
  const relacion = promedio ? actual / promedio : null
  if (relacion === null) return { estado: 'sin-datos', relacion, promedio }
  return { estado: relacion > SUBIDA ? 'subida' : relacion < BAJADA ? 'bajada' : 'normal', relacion, promedio }
}
