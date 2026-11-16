/* Hábitos y constancia (ESPECIFICACION.md 12).
   - Racha en semanas cumplidas, no en días (para no castigar los descansos).
   - Semana cumplida: al menos el 70 % de las sesiones planeadas (las mínimas cuentan). El 70 % es decisión de diseño.
   - Regla de no faltar dos veces seguidas.
   - Formar un hábito lleva una mediana de 66 días (de 18 a 254) según Lally y colegas (2010). */
import type { PlanSemana, SesionPlan } from './plan/generador'
import { fechaLocal } from './plan/sesion'

export const UMBRAL_SEMANA = 0.7
export const DIAS_HABITO = { mediana: 66, min: 18, max: 254 }

/** Lunes de la semana de una fecha (YYYY-MM-DD). */
export function lunesDe(fecha: string): string {
  const d = new Date(`${fecha.slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return fechaLocal(d)
}

/** Sesiones que cuentan para la constancia: fuerza y cardio con ejercicios (no la movilidad opcional). */
export function sesionesQueCuentan(plan: PlanSemana | null): { dia: number; sesion: SesionPlan }[] {
  if (!plan) return []
  return plan.dias.flatMap((d, dia) => d.sesiones.filter((s) => s.tipo !== 'movilidad' && s.ejercicios.length > 0).map((sesion) => ({ dia, sesion })))
}

/** Cuántas sesiones se hicieron por semana (clave: lunes). */
export function hechasPorSemana(fechas: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const f of fechas) {
    const l = lunesDe(f)
    m.set(l, (m.get(l) ?? 0) + 1)
  }
  return m
}

export function semanaCumplida(hechas: number, planeadas: number): boolean {
  return planeadas > 0 && hechas >= Math.ceil(planeadas * UMBRAL_SEMANA)
}

/** Racha de semanas cumplidas hasta hoy. La semana actual suma solo si ya está cumplida (si no, no corta la racha). */
export function racha(fechasHechas: string[], planeadasPorSemana: number, hoy = new Date()): number {
  const porSemana = hechasPorSemana(fechasHechas)
  const actual = lunesDe(fechaLocal(hoy))
  let n = semanaCumplida(porSemana.get(actual) ?? 0, planeadasPorSemana) ? 1 : 0
  const d = new Date(`${actual}T12:00:00`)
  for (let i = 0; i < 520; i++) {
    d.setDate(d.getDate() - 7)
    if (!semanaCumplida(porSemana.get(fechaLocal(d)) ?? 0, planeadasPorSemana)) break
    n++
  }
  return n
}

/** ¿Faltó a la sesión planeada de ayer? (para la regla de no faltar dos veces seguidas). */
export function faltoAyer(plan: PlanSemana | null, fechasHechas: string[], hoy = new Date()): boolean {
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  const diaAyer = (ayer.getDay() + 6) % 7
  const habia = sesionesQueCuentan(plan).some((s) => s.dia === diaAyer)
  if (!habia) return false
  if (plan && new Date(plan.creado) > ayer) return false
  return !fechasHechas.some((f) => f.slice(0, 10) === fechaLocal(ayer))
}

/** Intención "cuando… entonces…" por defecto para una sesión. */
export function intencionPorDefecto(dia: string, s: SesionPlan): string {
  const lugar = s.lugar && s.lugar !== 'Afuera' ? s.lugar : null
  const cuando = s.desde ? `El ${dia.toLowerCase()} a las ${s.desde}` : `El ${dia.toLowerCase()}`
  const disparador = s.tipo === 'cardio' ? 'cuando me pongo las zapatillas' : lugar ? `cuando llego a ${lugar}` : 'cuando termino lo que estoy haciendo'
  return `${cuando}, ${disparador}, me cambio y hago ${s.titulo.split(' · ')[0].toLowerCase()}${s.titulo.includes('·') ? ` (${s.titulo.split(' · ').slice(1).join(', ')})` : ''}.`
}

/* ---------- Logros ---------- */

export interface DatosLogros {
  sesiones: string[]
  evaluaciones: number
  controles: string[]
  diasAgua: string[]
  diasPasosMeta: number
  medidas: number
  fotos: number
  rachaSemanas: number
  /** Semanas seguidas sin faltar dos veces seguidas. */
  semanasSinDobleFalta: number
}

export interface Logro {
  id: string
  nombre: string
  texto: string
  logrado: boolean
  progreso?: string
}

export function logros(d: DatosLogros): Logro[] {
  const l = (id: string, nombre: string, texto: string, actual: number, meta: number): Logro => ({
    id,
    nombre,
    texto,
    logrado: actual >= meta,
    progreso: actual >= meta ? undefined : `${Math.min(actual, meta)} de ${meta}`,
  })
  return [
    l('primera', 'Primer paso', 'Terminaste tu primera sesión.', d.sesiones.length, 1),
    l('semana', 'Semana cumplida', 'Hiciste al menos el 70 % de lo planeado en una semana.', d.rachaSemanas, 1),
    l('sin-doble', 'Nunca dos veces', '4 semanas sin faltar dos veces seguidas.', d.semanasSinDobleFalta, 4),
    l('racha-4', 'Un mes firme', '4 semanas cumplidas seguidas.', d.rachaSemanas, 4),
    l('racha-12', 'Ya es un hábito', '12 semanas cumplidas seguidas (más que la mediana de 66 días para formar un hábito).', d.rachaSemanas, 12),
    l('diez', '10 sesiones', 'Diez sesiones terminadas.', d.sesiones.length, 10),
    l('cincuenta', '50 sesiones', 'Cincuenta sesiones terminadas.', d.sesiones.length, 50),
    l('retest', 'Primer retest', 'Te volviste a evaluar para ver cuánto mejoraste.', d.evaluaciones, 2),
    l('control-30', 'Te conocés', '30 días con control diario.', new Set(d.controles).size, 30),
    l('agua-7', 'Bien hidratado', '7 días anotando el agua.', new Set(d.diasAgua).size, 7),
    l('pasos-7', 'Caminante', '7 días llegando a tu meta de pasos.', d.diasPasosMeta, 7),
    l('cuerpo', 'Punto de partida', 'Anotaste tus medidas o sacaste tu primera foto.', d.medidas + d.fotos, 1),
  ]
}

/* ---------- Revisión del mes ---------- */

export interface RevisionMes {
  hechas: number
  planeadas: number
  cumplimiento: number
  mejoras: string[]
  estancados: string[]
  sugerencia: string
}

export function revisionMes(hechas: number, planeadas: number, mejoras: string[], estancados: string[]): RevisionMes {
  const cumplimiento = planeadas ? Math.min(1, hechas / planeadas) : 0
  let sugerencia: string
  if (planeadas === 0) sugerencia = 'Armá tu plan para que el mes que viene haya algo que medir.'
  else if (cumplimiento < 0.5)
    sugerencia = 'Hiciste menos de la mitad de lo planeado. El mes que viene, achicá: menos días o la versión mínima de 10 minutos los días difíciles. Mejor poco y seguido.'
  else if (estancados.length)
    sugerencia = `Buena constancia. En ${estancados.slice(0, 2).join(' y ')} no estás mejorando: probá una variante o hacé una semana de descarga.`
  else if (cumplimiento >= 0.9) sugerencia = 'Mes excelente. Si te sobra energía, sumá un poco: una serie más en los ejercicios principales o 10 minutos de cardio.'
  else sugerencia = 'Buen mes. Mantené el plan y buscá no faltar dos veces seguidas.'
  return { hechas, planeadas, cumplimiento, mejoras, estancados, sugerencia }
}

/** Semanas desde la última vez que se faltó a dos sesiones planeadas seguidas (o desde que se armó el plan). */
export function semanasSinDobleFalta(plan: PlanSemana | null, fechasHechas: string[], hoy = new Date()): number {
  if (!plan) return 0
  const dias = new Set(sesionesQueCuentan(plan).map((s) => s.dia))
  if (!dias.size) return 0
  const hechas = new Set(fechasHechas.map((f) => f.slice(0, 10)))
  const inicio = new Date(plan.creado)
  inicio.setHours(12, 0, 0, 0)
  const d = new Date(inicio)
  let seguidas = 0
  let desde = new Date(inicio)
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  while (d <= ayer) {
    if (dias.has((d.getDay() + 6) % 7)) {
      if (hechas.has(fechaLocal(d))) seguidas = 0
      else if (++seguidas >= 2) desde = new Date(d)
    }
    d.setDate(d.getDate() + 1)
  }
  const hoyMedio = new Date(hoy)
  hoyMedio.setHours(12, 0, 0, 0)
  desde.setHours(12, 0, 0, 0)
  return Math.floor(Math.round((hoyMedio.getTime() - desde.getTime()) / 86_400_000) / 7)
}

/** Sesiones planeadas seguidas que no se hicieron, de ayer hacia atrás (hasta 14 días y desde que existe el plan). */
export function faltasSeguidas(plan: PlanSemana | null, fechasHechas: string[], hoy = new Date()): number {
  if (!plan) return 0
  const hechas = new Set(fechasHechas.map((f) => f.slice(0, 10)))
  const dias = new Set(sesionesQueCuentan(plan).map((s) => s.dia))
  const creado = fechaLocal(new Date(plan.creado))
  let n = 0
  for (let i = 1; i <= 14; i++) {
    const d = new Date(hoy)
    d.setDate(d.getDate() - i)
    const f = fechaLocal(d)
    if (f < creado) break
    if (hechas.has(f)) break
    if (dias.has((d.getDay() + 6) % 7)) n++
  }
  return n
}
