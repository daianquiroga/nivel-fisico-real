/* Cómo se recorre una sesión en "Entrenar ahora" y cómo se achica según el control diario
   (ESPECIFICACION.md, secciones 8 y 9). Reglas de diseño de la especificación, no un estándar publicado. */
import { EJERCICIOS, ejercicio, evitarPorLimitacion, type Ejercicio, type Patron } from '../ejercicios'
import type { EntradaPlan, SesionPlan } from './generador'
import { alternativas } from './generador'

export interface Paso {
  /** Índice del ejercicio en la sesión. */
  ej: number
  /** Número de serie, desde 1. */
  serie: number
  total: number
  /** Segundos de pausa después de este paso (0 = seguir directo). */
  descanso: number
}

/** Ordena las series: clásico (todas de un ejercicio), superseries (alternando el grupo) o circuito (vueltas). */
export function armarCola(s: SesionPlan): Paso[] {
  const cola: Paso[] = []
  const xs = s.ejercicios
  let i = 0
  while (i < xs.length) {
    const grupo = xs[i].grupo
    if (!grupo) {
      for (let n = 1; n <= xs[i].series; n++) cola.push({ ej: i, serie: n, total: xs[i].series, descanso: xs[i].descansoSeg })
      i++
      continue
    }
    const miembros: number[] = []
    while (i < xs.length && xs[i].grupo === grupo) miembros.push(i++)
    const vueltas = Math.max(...miembros.map((m) => xs[m].series))
    for (let n = 1; n <= vueltas; n++) {
      const enVuelta = miembros.filter((m) => xs[m].series >= n)
      enVuelta.forEach((m, k) => {
        const ultimo = k === enVuelta.length - 1
        const pausa = ultimo ? (grupo === 'C' ? 90 : Math.max(...miembros.map((x) => xs[x].descansoSeg))) : grupo === 'C' ? 15 : 0
        cola.push({ ej: m, serie: n, total: xs[m].series, descanso: pausa })
      })
    }
  }
  if (cola.length) cola[cola.length - 1].descanso = 0
  return cola
}

export type Version = 'completa' | 'reducida' | 'minima' | 'movilidad'

export const NOMBRES_VERSION: Record<Version, string> = {
  completa: 'Completa',
  reducida: 'Reducida',
  minima: 'Mínima (10 min)',
  movilidad: 'Solo movilidad suave',
}

/** Achica la sesión: reducida = una serie menos; mínima = 3 ejercicios en circuito de 2 vueltas; movilidad = solo movilidad. */
export function aplicarVersion(s: SesionPlan, version: Version, entrada?: EntradaPlan | null, zona?: string): SesionPlan {
  let r: SesionPlan = structuredClone(s)
  if (zona && entrada) r = cambiarPorZona(r, entrada, zona)
  if (version === 'reducida') {
    r.ejercicios.forEach((x) => {
      if (x.rol !== 'movilidad' && x.rol !== 'cardio') x.series = Math.max(1, x.series - 1)
      if (x.rol === 'cardio') x.rango = [Math.max(10, Math.round(x.rango[0] * 0.66)), Math.max(10, Math.round(x.rango[0] * 0.66))]
    })
    r.titulo += ' · reducida'
  }
  if (version === 'minima') {
    if (r.tipo === 'cardio') r.ejercicios.forEach((x) => (x.rango = [10, 10]))
    else {
      r.ejercicios = r.ejercicios.filter((x) => x.rol !== 'movilidad').slice(0, 3).map((x) => ({ ...x, series: 2, grupo: 'C' }))
      r.metodo = 'circuito'
    }
    r.minutos = 10
    r.titulo += ' · mínima'
  }
  if (version === 'movilidad') {
    const lim = zona ? [zona] : []
    const ids = EJERCICIOS.filter((e) => e.patron === 'movilidad' && !evitarPorLimitacion(e, lim) && !(zona && e.limitaciones[zona])).map((e) => e.id)
    r = {
      ...r,
      tipo: 'movilidad',
      titulo: 'Movilidad suave',
      intensidad: 'suave',
      metodo: 'clasico',
      minutos: 10,
      ejercicios: ids.slice(0, 3).map((id) => ({ id, patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: ejercicio(id)!.rango, descansoSeg: 0 })),
    }
  }
  return r
}

/** Con molestia en una zona: cambia los ejercicios que la cargan por uno equivalente que no. */
export function cambiarPorZona(s: SesionPlan, entrada: EntradaPlan, zona: string): SesionPlan {
  const r = structuredClone(s)
  const lim = [...new Set([...entrada.limitaciones, zona])]
  const conZona = { ...entrada, limitaciones: lim }
  r.ejercicios = r.ejercicios.flatMap((x) => {
    const e = ejercicio(x.id)
    if (!e || !e.limitaciones[zona]) return [x]
    if (e.limitaciones[zona]?.nivel === 'adaptar') return [x]
    const usados = r.ejercicios.map((y) => y.id)
    const parecidos: Record<string, Patron[]> = {
      'empuje-vertical': ['empuje'],
      empuje: ['empuje-vertical'],
      'traccion-vertical': ['traccion'],
      traccion: ['traccion-vertical'],
      sentadilla: ['zancada', 'bisagra'],
      zancada: ['sentadilla', 'bisagra'],
      bisagra: ['sentadilla'],
    }
    const probar = [x.patrones, ...(parecidos[e.patron] ?? []).map((p) => [p])]
    let alt: Ejercicio | undefined
    for (const patrones of probar) {
      alt = alternativas(conZona, r.lugar, { ...x, patrones }, usados)[0]
      if (alt) break
    }
    return alt ? [{ ...x, id: alt.id, patrones: [alt.patron], rango: alt.rango }] : []
  })
  return r
}

/* ---------- Control diario ---------- */

export type Dolor = 'ninguno' | 'molestia' | 'dolor'

export interface ControlDia {
  fecha: string
  sueno: number
  energia: number
  dolor: Dolor
  zona?: string
  /** Lo que eligió la persona. */
  version?: Version
}

export interface Recomendacion {
  version: Version
  texto: string
  consultar?: boolean
}

export function recomendar(hoy: ControlDia, ayer?: ControlDia): Recomendacion {
  if (hoy.dolor === 'dolor') {
    return {
      version: 'movilidad',
      consultar: true,
      texto: 'Con dolor (no una molestia), hoy solo movilidad suave de otras zonas. Si es punzante, sigue o empeora, consultá a un profesional.',
    }
  }
  const cansado = hoy.sueno < 6 || hoy.energia <= 2
  const ayerReducida = ayer && (ayer.version === 'reducida' || ayer.version === 'minima' || ayer.sueno < 6 || ayer.energia <= 2)
  if (cansado && ayerReducida) {
    return { version: 'minima', texto: 'Dos días seguidos con poca energía o poco sueño: hoy hacé la versión mínima o descansá. Recuperar también es entrenar.' }
  }
  if (cansado) {
    return {
      version: 'reducida',
      texto: hoy.sueno < 6 ? 'Dormiste menos de 6 horas: hoy una serie menos por ejercicio y nada al máximo.' : 'Poca energía: hoy una serie menos por ejercicio y nada al máximo.',
    }
  }
  if (hoy.dolor === 'molestia') {
    return { version: 'completa', texto: 'Con molestia: cambiamos los ejercicios que cargan esa zona. Si la molestia aumenta durante la sesión, pará.' }
  }
  return { version: 'completa', texto: 'Todo bien: sesión completa.' }
}

export const fechaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
