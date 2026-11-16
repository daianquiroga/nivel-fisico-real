/* Asistente "Armar mi rutina paso a paso": unas pocas preguntas simples se convierten en la entrada del generador.
   El reparto de puntos entre objetivos según lo que se prioriza es una decisión de diseño de la app. */
import type { Semana } from '../perfil'
import type { EntradaPlan } from './generador'

export type Prioridad = 'musculo' | 'grasa' | 'fuerza' | 'cardio' | 'defensa' | 'movilidad'

export const PRIORIDADES: { valor: Prioridad; texto: string; detalle: string }[] = [
  { valor: 'musculo', texto: 'Ganar músculo', detalle: 'Verte más marcado y con más forma' },
  { valor: 'grasa', texto: 'Bajar grasa', detalle: 'Panza y definición' },
  { valor: 'fuerza', texto: 'Más fuerza', detalle: 'Levantar más, sentirte fuerte' },
  { valor: 'cardio', texto: 'Más aire', detalle: 'Cansarte menos, correr o subir escaleras' },
  { valor: 'defensa', texto: 'Defenderme', detalle: 'Sombra, juego de pies y técnica' },
  { valor: 'movilidad', texto: 'Moverme mejor', detalle: 'Postura y menos dolores de estar sentado' },
]

export const DURACIONES = [20, 30, 45, 60]

export interface Respuestas {
  dias: number[]
  hora: string
  lugar: string
  minutos: number
  prioridades: Prioridad[]
  zonas: string[]
}

const PUNTOS: Record<Prioridad, { estetica: number; condicion: number; combate: number }> = {
  musculo: { estetica: 40, condicion: 0, combate: 0 },
  grasa: { estetica: 15, condicion: 25, combate: 0 },
  fuerza: { estetica: 20, condicion: 10, combate: 0 },
  cardio: { estetica: 0, condicion: 40, combate: 0 },
  defensa: { estetica: 0, condicion: 5, combate: 40 },
  movilidad: { estetica: 5, condicion: 15, combate: 0 },
}

/** Objetivos de 0 a 100 que suman 100, desde lo que la persona prioriza. */
export function objetivosDe(prioridades: Prioridad[]): { estetica: number; condicion: number; combate: number } {
  if (!prioridades.length) return { estetica: 34, condicion: 33, combate: 33 }
  const s = { estetica: 0, condicion: 0, combate: 0 }
  for (const p of prioridades) {
    s.estetica += PUNTOS[p].estetica
    s.condicion += PUNTOS[p].condicion
    s.combate += PUNTOS[p].combate
  }
  const total = s.estetica + s.condicion + s.combate || 1
  const estetica = Math.round((s.estetica / total) * 100)
  const combate = Math.round((s.combate / total) * 100)
  return { estetica, combate, condicion: 100 - estetica - combate }
}

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Semana con los días elegidos, todos en el mismo lugar y a la misma hora, con el tiempo disponible. */
export function semanaDe(base: Semana, r: Respuestas): Semana {
  const hueco = { desde: r.hora, hasta: aHora(aMin(r.hora) + r.minutos) }
  const tipos = Object.fromEntries(Object.entries(base.tipos).map(([k, t]) => [k, { ...t, huecos: [hueco] }])) as Semana['tipos']
  return { ...base, tipos, lugaresPorDia: Array.from({ length: 7 }, (_, d) => (r.dias.includes(d) ? [r.lugar] : [])) }
}

export function entradaDesdeRespuestas(base: EntradaPlan, r: Respuestas): EntradaPlan {
  const zonas = [...new Set([...r.zonas, ...(r.prioridades.includes('grasa') ? ['definicion'] : []), ...(r.prioridades.includes('movilidad') ? ['postura'] : [])])]
  return {
    ...base,
    objetivos: objetivosDe(r.prioridades),
    zonas,
    lugares: base.lugares.filter((l) => l.nombre === r.lugar).length ? base.lugares.filter((l) => l.nombre === r.lugar) : base.lugares,
    semana: semanaDe(base.semana, r),
  }
}

/** Respuestas iniciales a partir de lo que ya cargó la persona (días, horario y lugar de su semana). */
export function respuestasIniciales(base: EntradaPlan): Respuestas {
  const dias = base.semana.lugaresPorDia.map((l, i) => (l.length ? i : -1)).filter((i) => i >= 0)
  const primero = dias[0] ?? 0
  const hueco = base.semana.tipos[base.semana.dias[primero]]?.huecos[0]
  const lugar = base.semana.lugaresPorDia[primero]?.[0] ?? base.lugares[0]?.nombre ?? 'Casa'
  const minutos = hueco ? DURACIONES.reduce((a, b) => (Math.abs(b - (aMin(hueco.hasta) - aMin(hueco.desde))) < Math.abs(a - (aMin(hueco.hasta) - aMin(hueco.desde))) ? b : a)) : 45
  return { dias: dias.length ? dias : [0, 2, 4], hora: hueco?.desde ?? '19:00', lugar, minutos, prioridades: [], zonas: base.zonas.filter((z) => z !== 'definicion') }
}
