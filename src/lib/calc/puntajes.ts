/* Puntajes finales: condición física (0 a 100), habilidad de movimiento y nivel por área.
   Pesos y reglas en EVALUACION.md, sección 8. Los pesos son una decisión de diseño, no un estándar publicado. */

export type Area = 'cardio' | 'fuerza' | 'composicion' | 'movilidad' | 'equilibrio'

export const PESOS: Record<Area, number> = {
  cardio: 0.35,
  fuerza: 0.3,
  composicion: 0.2,
  movilidad: 0.075,
  equilibrio: 0.075,
}

export const NOMBRES_AREA: Record<Area, string> = {
  cardio: 'Cardio',
  fuerza: 'Fuerza y resistencia',
  composicion: 'Composición',
  movilidad: 'Movilidad',
  equilibrio: 'Equilibrio',
}

/** Valores por área (0 a 100); cada área puede tener varias pruebas o ninguna. */
export type ValoresPorArea = Partial<Record<Area, number[]>>

export interface Condicion {
  puntaje: number
  porArea: Partial<Record<Area, number>>
  parcial: boolean
  areasFaltantes: Area[]
}

const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Promedio ponderado de las áreas. Si un área no tiene pruebas, su peso se reparte entre las demás. */
export function condicionFisica(valores: ValoresPorArea): Condicion | null {
  const porArea: Partial<Record<Area, number>> = {}
  for (const area of Object.keys(PESOS) as Area[]) {
    const xs = valores[area]?.filter((x) => Number.isFinite(x))
    if (xs && xs.length) porArea[area] = promedio(xs)
  }
  const presentes = Object.keys(porArea) as Area[]
  if (!presentes.length) return null
  const pesoTotal = presentes.reduce((s, a) => s + PESOS[a], 0)
  const puntaje = presentes.reduce((s, a) => s + (porArea[a]! * PESOS[a]) / pesoTotal, 0)
  const areasFaltantes = (Object.keys(PESOS) as Area[]).filter((a) => porArea[a] === undefined)
  return { puntaje, porArea, parcial: areasFaltantes.length > 0, areasFaltantes }
}

/** Calidad de movimiento: suma de 5 movimientos puntuados de 0 a 3 (máximo 15) llevada a 0–100. */
export function calidadMovimiento(puntos: number[]): number {
  const suma = puntos.reduce((a, b) => a + b, 0)
  return (suma / 15) * 100
}

/** Habilidad de movimiento: 60% calidad en video + 40% percentil de equilibrio. */
export function habilidadMovimiento(calidad: number | null, equilibrio: number | null): number | null {
  if (calidad === null && equilibrio === null) return null
  if (calidad === null) return equilibrio
  if (equilibrio === null) return calidad
  return 0.6 * calidad + 0.4 * equilibrio
}

export const NIVELES = ['Inicial', 'Base', 'En marcha', 'Sólido', 'Avanzado'] as const

/** Nivel 1 a 5 según percentil (0–20, 20–40, 40–60, 60–80, 80–100). */
export function nivelPorPercentil(p: number): { nivel: 1 | 2 | 3 | 4 | 5; nombre: (typeof NIVELES)[number]; avance: number } {
  const n = Math.min(5, Math.max(1, Math.floor(p / 20) + 1)) as 1 | 2 | 3 | 4 | 5
  const avance = n === 5 ? Math.min(1, (p - 80) / 20) : (p - (n - 1) * 20) / 20
  return { nivel: n, nombre: NIVELES[n - 1], avance }
}
