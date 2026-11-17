/* Rutinas guardadas para combinar (fuerza, marcial, propia…) y cómo se juntan en una semana.
   Se guardan solo en el celular (tabla ajustes, clave "rutinas").
   Reglas para juntar (decisión de diseño): si dos entrenamientos se pisan, el segundo empieza 15 minutos después del primero;
   si empiezan a la misma hora, va primero el de técnica (combate), después fuerza, cardio y movilidad, porque la técnica
   se aprende mejor sin cansancio (orden recomendado en entrenamiento concurrente para deportes de combate). */
import { db } from '../db/db'
import type { PlanSemana, SesionPlan } from './generador'

export type OrigenRutina = 'fuerza' | 'marcial' | 'propia' | 'plantilla' | 'sistema' | 'combinada'

export interface RutinaGuardada {
  id: string
  nombre: string
  origen: OrigenRutina
  creado: string
  plan: PlanSemana
}

const CLAVE = 'rutinas'

export const NOMBRE_ORIGEN: Record<OrigenRutina, string> = {
  fuerza: 'Fuerza (paso a paso)',
  marcial: 'Marcial',
  propia: 'Armada a mano',
  plantilla: 'Rutina de gimnasio',
  sistema: 'Sistema completo',
  combinada: 'Combinada',
}

export async function leerRutinas(): Promise<RutinaGuardada[]> {
  const a = await db.ajustes.get(CLAVE)
  return (a?.valor as RutinaGuardada[] | undefined) ?? []
}

export async function guardarRutina(nombre: string, origen: OrigenRutina, plan: PlanSemana): Promise<RutinaGuardada> {
  const lista = await leerRutinas()
  const r: RutinaGuardada = { id: `r${Date.now().toString(36)}`, nombre: nombre.trim() || NOMBRE_ORIGEN[origen], origen, creado: new Date().toISOString(), plan: structuredClone(plan) }
  await db.ajustes.put({ clave: CLAVE, valor: [...lista, r] })
  return r
}

export async function borrarRutina(id: string) {
  const lista = await leerRutinas()
  await db.ajustes.put({ clave: CLAVE, valor: lista.filter((r) => r.id !== id) })
}

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Orden cuando dos entrenamientos empiezan a la misma hora: técnica primero. */
export function prioridad(s: SesionPlan): number {
  if (s.combate || s.titulo.startsWith('Combate')) return 0
  return s.tipo === 'fuerza' ? 1 : s.tipo === 'cardio' ? 2 : 3
}

export interface Combinacion {
  plan: PlanSemana
  /** Entrenamientos que se movieron de hora para no pisarse. */
  movidos: { dia: number; titulo: string; antes: string; ahora: string }[]
  /** Minutos totales por día. */
  minutosPorDia: number[]
}

/** Junta 2 o más rutinas en una sola semana, sin pisar horarios. Saca las movilidades opcionales de los días libres. */
export function combinarPlanes(planes: PlanSemana[], creado = new Date().toISOString()): Combinacion {
  const plan: PlanSemana = { creado, editado: true, dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) }
  const movidos: Combinacion['movidos'] = []
  for (let d = 0; d < 7; d++) {
    const todas = planes.flatMap((p, k) =>
      (p.dias[d]?.sesiones ?? []).filter((s) => !s.titulo.includes('opcional') && s.ejercicios.length > 0).map((s, j) => ({ ...structuredClone(s), id: `c${k}-${d}-${j}-${s.id}` })),
    )
    todas.sort((a, b) => (a.desde && b.desde ? aMin(a.desde) - aMin(b.desde) : a.desde ? -1 : b.desde ? 1 : 0) || prioridad(a) - prioridad(b))
    let finAnterior: number | null = null
    for (const s of todas) {
      if (s.desde && finAnterior !== null && aMin(s.desde) < finAnterior) {
        const ahora = aHora(finAnterior + 15)
        movidos.push({ dia: d, titulo: s.titulo, antes: s.desde, ahora })
        s.desde = ahora
        s.hasta = aHora(aMin(ahora) + s.minutos)
      }
      if (s.desde) {
        s.hasta = aHora(aMin(s.desde) + s.minutos)
        finAnterior = aMin(s.desde) + s.minutos
      }
      plan.dias[d].sesiones.push(s)
    }
  }
  return { plan, movidos, minutosPorDia: plan.dias.map((d) => d.sesiones.reduce((a, s) => a + s.minutos, 0)) }
}
