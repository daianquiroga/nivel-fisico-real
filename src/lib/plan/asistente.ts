/* Asistente "Armar mi rutina paso a paso": unas pocas preguntas simples se convierten en la entrada del generador.
   El reparto de puntos entre objetivos según lo que se prioriza es una decisión de diseño de la app. */
import { huecosDelDia, type Semana } from '../perfil'
import type { EjercicioPlan, EntradaPlan, PlanSemana, SesionPlan } from './generador'

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

/** Un horario para entrenar: a qué hora empieza y cuántos minutos hay. */
export interface Horario {
  hora: string
  minutos: number
}

export interface Respuestas {
  dias: number[]
  /** Hora y minutos por defecto (para todos los días que no tengan horarios propios). */
  hora: string
  lugar: string
  minutos: number
  /** Horarios de cada día, de lunes (0) a domingo (6). Un día puede tener más de uno. */
  horarios?: Horario[][]
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

/** Horarios de cada día elegido: los propios del día o, si no tiene, la hora y los minutos por defecto. */
export function horariosDe(r: Pick<Respuestas, 'dias' | 'hora' | 'minutos' | 'horarios'>): Horario[][] {
  return Array.from({ length: 7 }, (_, d) => {
    if (!r.dias.includes(d)) return []
    const propios = r.horarios?.[d]?.filter((h) => h.minutos > 0)
    return propios && propios.length ? propios : [{ hora: r.hora, minutos: r.minutos }]
  })
}

export const aHueco = (h: Horario) => ({ desde: h.hora, hasta: aHora(aMin(h.hora) + h.minutos) })

/** Semana con los días elegidos en el mismo lugar, cada uno con sus horarios y su tiempo disponible. */
export function semanaDe(base: Semana, r: Respuestas): Semana {
  const hueco = aHueco({ hora: r.hora, minutos: r.minutos })
  const tipos = Object.fromEntries(Object.entries(base.tipos).map(([k, t]) => [k, { ...t, huecos: [hueco] }])) as Semana['tipos']
  return {
    ...base,
    tipos,
    lugaresPorDia: Array.from({ length: 7 }, (_, d) => (r.dias.includes(d) ? [r.lugar] : [])),
    huecosPorDia: horariosDe(r).map((hs) => hs.map(aHueco)),
  }
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
  const hora = hueco?.desde ?? '19:00'
  const horarios = Array.from({ length: 7 }, (_, d) =>
    huecosDelDia(base.semana, d)
      .slice(0, 2)
      .map((h) => ({ hora: h.desde, minutos: Math.max(10, Math.min(120, Math.round(((((aMin(h.hasta) - aMin(h.desde)) % 1440) + 1440) % 1440) / 5) * 5)) })),
  )
  return { dias: dias.length ? dias : [0, 2, 4], hora, lugar, minutos, horarios, prioridades: [], zonas: base.zonas.filter((z) => z !== 'definicion') }
}

export type Extra = 'cardio' | 'combate' | 'movilidad'

/** Entrenamientos que se pueden sumar a un día (además del que ya tiene). Minutos: decisión de diseño. */
export const EXTRAS: { valor: Extra; texto: string; detalle: string }[] = [
  { valor: 'cardio', texto: 'Cardio', detalle: 'Caminata rápida de 30 minutos.' },
  { valor: 'combate', texto: 'Combate', detalle: 'Juego de pies y sombra, 15 minutos.' },
  { valor: 'movilidad', texto: 'Movilidad', detalle: '10 minutos para soltar el cuerpo.' },
]

const ep = (id: string, rol: EjercicioPlan['rol'], minutosOReps: [number, number]): EjercicioPlan => ({
  id,
  patrones: [rol === 'cardio' ? 'cardio' : 'movilidad'],
  rol,
  series: 1,
  rango: minutosOReps,
  descansoSeg: 0,
})

/** Suma otro entrenamiento a un día, a la hora elegida. Los entrenamientos del día quedan ordenados por hora. */
export function sumarEntrenamiento(plan: PlanSemana, dia: number, extra: Extra, desde: string, lugar?: string, minutosElegidos?: number): PlanSemana {
  const p: PlanSemana = structuredClone(plan)
  const usados = new Set(p.dias.flatMap((d) => d.sesiones.map((s) => s.id)))
  let n = 1
  while (usados.has(`extra-${dia}-${n}`)) n++
  const minutos = minutosElegidos
    ? extra === 'movilidad'
      ? Math.min(15, minutosElegidos)
      : Math.max(extra === 'combate' ? 12 : 10, minutosElegidos)
    : extra === 'cardio'
      ? 30
      : extra === 'combate'
        ? 15
        : 10
  const ejercicios =
    extra === 'cardio'
      ? [ep('caminata-rapida', 'cardio', [minutos, minutos])]
      : extra === 'combate'
        ? [ep('juego-pies', 'cardio', [6, 6]), ep('sombra', 'cardio', [minutos - 6, minutos - 6])]
        : [ep('gato-camello', 'movilidad', [8, 10]), ep('mejor-estiramiento', 'movilidad', [4, 6]), ep('cadera-90-90', 'movilidad', [8, 10]), ep('sentadilla-profunda-balanceo', 'movilidad', [45, 60]), ep('circulos-hombro', 'movilidad', [4, 6])]
  const s: SesionPlan = {
    id: `extra-${dia}-${n}`,
    tipo: extra === 'movilidad' ? 'movilidad' : 'cardio',
    titulo: extra === 'cardio' ? 'Cardio' : extra === 'combate' ? 'Combate: pies y sombra' : 'Movilidad',
    lugar,
    desde,
    hasta: aHora(aMin(desde) + minutos),
    minutos,
    intensidad: extra === 'combate' ? 'fuerte' : 'suave',
    metodo: 'clasico',
    ejercicios,
  }
  p.dias[dia].sesiones.push(s)
  p.dias[dia].sesiones.sort((a, b) => (a.desde ?? '99').localeCompare(b.desde ?? '99'))
  return p
}

/** Saca las movilidades opcionales que el generador pone en los días libres. */
export function sinOpcionales(plan: PlanSemana): PlanSemana {
  return { ...plan, dias: plan.dias.map((d) => ({ ...d, sesiones: d.sesiones.filter((s) => !s.titulo.includes('opcional')) })) }
}

/** Saca los entrenamientos que quedaron sin ejercicios. */
export function sinVacias(plan: PlanSemana): PlanSemana {
  return { ...plan, dias: plan.dias.map((d) => ({ ...d, sesiones: d.sesiones.filter((s) => s.ejercicios.length > 0) })) }
}

/** Qué conviene poner en un segundo horario del día según lo que se prioriza (decisión de diseño). */
export function extraPara(prioridades: Prioridad[]): Extra {
  if (prioridades.includes('defensa')) return 'combate'
  if (prioridades.includes('cardio') || prioridades.includes('grasa')) return 'cardio'
  return 'movilidad'
}

/** Llena los horarios que el generador dejó vacíos (el segundo horario de un día) con un entrenamiento corto. */
export function completarHorarios(plan: PlanSemana, r: Respuestas): PlanSemana {
  let p = plan
  horariosDe(r).forEach((hs, d) => {
    for (const h of hs) {
      const ocupado = p.dias[d].sesiones.some((s) => s.desde && aMin(s.desde) <= aMin(h.hora) && aMin(s.hasta ?? s.desde) > aMin(h.hora))
      if (!ocupado) p = sumarEntrenamiento(p, d, extraPara(r.prioridades), h.hora, r.lugar, h.minutos)
    }
  })
  return p
}
