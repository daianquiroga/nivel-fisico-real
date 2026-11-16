/* Checklist de técnica de los 6 ejercicios básicos (requisito para pasar de etapa, ESPECIFICACION.md sección 5).
   Un ejercicio por movimiento base: sentadilla, empuje, tracción, bisagra, zancada y tronco. Se elige el que la persona
   ya tiene en su plan o, si no, el primero de la biblioteca que puede hacer con su equipo. Los puntos a revisar salen
   de los errores comunes de cada ficha. Se aprueba con todos los puntos tildados (decisión de diseño). */
import { EJERCICIOS, ejercicio, escaleraDe, evitarPorLimitacion, sePuedeHacer, type Ejercicio, type Patron } from './ejercicios'
import type { PlanSemana } from './plan/generador'

export const MOVIMIENTOS_BASE: { patron: Patron; texto: string }[] = [
  { patron: 'sentadilla', texto: 'Sentadilla' },
  { patron: 'empuje', texto: 'Empuje' },
  { patron: 'traccion', texto: 'Tracción' },
  { patron: 'bisagra', texto: 'Bisagra de cadera' },
  { patron: 'zancada', texto: 'Zancada' },
  { patron: 'core', texto: 'Tronco' },
]

export interface PruebaTecnica {
  fecha: string
  ejercicio: string
  criterios: boolean[]
  aprobado: boolean
}

/** Los 6 ejercicios a revisar para esta persona. */
export function basicosPara(plan: PlanSemana | null, equipo: Set<string>, limitaciones: string[]): Ejercicio[] {
  const enPlan = (plan?.dias ?? []).flatMap((d) => d.sesiones.flatMap((s) => s.ejercicios.map((x) => x.id)))
  const out: Ejercicio[] = []
  for (const m of MOVIMIENTOS_BASE) {
    const propios = [m.patron, ...(m.patron === 'traccion' ? (['traccion-vertical'] as Patron[]) : [])]
    const delPlan = enPlan.map((id) => ejercicio(id)).find((e) => e && propios.includes(e.patron))
    const deBiblioteca = EJERCICIOS.filter((e) => propios.includes(e.patron) && !e.combate && (!equipo.size || sePuedeHacer(e, equipo)) && !evitarPorLimitacion(e, limitaciones)).sort(
      (a, b) => (escaleraDe(a.id) ? 1 : 0) - (escaleraDe(b.id) ? 1 : 0),
    )[0]
    const e = delPlan ?? deBiblioteca
    if (e) out.push(e)
  }
  return out
}

/** Puntos a revisar en el video: uno por cada error común de la ficha, más la constancia de la forma. */
export function criteriosTecnica(e: Ejercicio): string[] {
  return [...e.errores.map((x) => `Sin "${x.error.charAt(0).toLowerCase()}${x.error.slice(1)}": ${x.detectar}`), 'Las 5 repeticiones salen con la misma forma, sin apurarte.']
}

export const apruebaTecnica = (criterios: boolean[]) => criterios.length > 0 && criterios.every(Boolean)

/** Cuántos de los ejercicios dados tienen la técnica aprobada alguna vez. */
export function aprobados(pruebas: PruebaTecnica[], ids: string[]): number {
  const ok = new Set(pruebas.filter((p) => p.aprobado).map((p) => p.ejercicio))
  return ids.filter((id) => ok.has(id)).length
}
