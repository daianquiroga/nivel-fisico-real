/* Rutinas que se pueden elegir para combinar o comparar: tu plan actual, las guardadas, las plantillas de gimnasio
   y el sistema completo de combate, armadas con tus días y horarios. */
import type { EntradaPlan, PlanSemana } from './generador'
import { PLANTILLAS, semanaPlantilla } from './plantillas'
import { NOMBRE_ORIGEN, type RutinaGuardada } from './rutinas'
import { semanaSistema } from './sistemaSemana'

export interface FuenteRutina {
  clave: string
  nombre: string
  /** Nombre corto para encabezados de tabla y columnas. */
  corto: string
  detalle: string
  plan: PlanSemana
  rutina?: RutinaGuardada
}

const recortar = (t: string, n = 18) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t)

export function fuentesRutinas(o: { actual?: PlanSemana | null; rutinas: RutinaGuardada[]; entrada?: EntradaPlan | null; plantillas?: boolean; creado?: string }): FuenteRutina[] {
  const f: FuenteRutina[] = []
  if (o.actual) f.push({ clave: 'actual', nombre: 'Tu plan actual', corto: 'Tu plan', detalle: 'El que usás hoy en Plan.', plan: o.actual })
  for (const r of [...o.rutinas].reverse())
    f.push({ clave: r.id, nombre: r.nombre, corto: recortar(r.nombre), detalle: `${NOMBRE_ORIGEN[r.origen]} · guardada el ${new Date(r.creado).toLocaleDateString('es-AR')}`, plan: r.plan, rutina: r })
  if (o.entrada && o.plantillas)
    for (const p of PLANTILLAS) {
      const corto = p.nombre.split(' · ')[0]
      f.push({ clave: `plantilla:${p.id}`, nombre: p.nombre, corto: recortar(corto), detalle: `Rutina de gimnasio lista. ${p.para}`, plan: semanaPlantilla(p, o.entrada, o.creado) })
    }
  if (o.entrada) f.push({ clave: 'sistema', nombre: 'Sistema completo de combate', corto: 'Sistema completo', detalle: 'Boxeo, muay thai y kick, suelo, krav magá e integración, en tus días y horarios.', plan: semanaSistema(o.entrada) })
  return f
}

export interface DiaLadoALado {
  dia: number
  /** Entrenamientos de cada rutina ese día (sin las movilidades opcionales), ordenados por hora. */
  a: { desde?: string; titulo: string; minutos: number }[]
  b: { desde?: string; titulo: string; minutos: number }[]
}

const sesionesDelDia = (p: PlanSemana, d: number) =>
  (p.dias[d]?.sesiones ?? [])
    .filter((s) => !s.titulo.includes('opcional'))
    .map((s) => ({ desde: s.desde, titulo: s.titulo, minutos: s.minutos }))
    .sort((x, y) => (x.desde ?? '99').localeCompare(y.desde ?? '99'))

/** La semana de dos rutinas día por día, para verlas en dos columnas. */
export function semanaLadoALado(a: PlanSemana, b: PlanSemana): DiaLadoALado[] {
  return Array.from({ length: 7 }, (_, dia) => ({ dia, a: sesionesDelDia(a, dia), b: sesionesDelDia(b, dia) }))
}
