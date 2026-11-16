/* Biblioteca de ejercicios: carga el contenido de src/content/ejercicios y lo filtra por equipo y limitaciones. */
import coreAccesorios from '../content/ejercicios/core-accesorios.json'
import empuje from '../content/ejercicios/empuje.json'
import movilidadCardio from '../content/ejercicios/movilidad-cardio.json'
import escalerasJson from '../content/ejercicios/escaleras.json'
import piernas from '../content/ejercicios/piernas.json'
import traccion from '../content/ejercicios/traccion.json'
import combate from '../content/ejercicios/combate.json'
import gimnasio from '../content/ejercicios/gimnasio.json'
import variantes from '../content/ejercicios/variantes.json'
import potencia from '../content/ejercicios/potencia.json'
import type { Lugar } from './db/db'

export type NivelLimitacion = 'adaptar' | 'evitar'
export type Patron = 'empuje' | 'empuje-vertical' | 'traccion' | 'traccion-vertical' | 'sentadilla' | 'zancada' | 'bisagra' | 'core' | 'transporte' | 'accesorio' | 'movilidad' | 'cardio' | 'potencia'

export interface Ejercicio {
  id: string
  nombre: string
  patron: Patron
  principal: string[]
  secundarios: string[]
  equipo: string[]
  espacio: '1x1' | '2x2' | 'amplio'
  tipo: 'reps' | 'segundos' | 'minutos'
  carga: 'corporal' | 'externa' | 'banda'
  rango: [number, number]
  inicial: string
  pasos: string[]
  respiracion: string
  errores: { error: string; detectar: string }[]
  facil: string | null
  dificil: string | null
  limitaciones: Partial<Record<string, { nivel: NivelLimitacion; texto: string }>>
  subir: string
  pesoInicial?: string
  video: string
  /** Sombra, pies y clases: el generador no los elige solos como cardio (se suman a propósito). */
  combate?: boolean
  /** Mismo ejercicio con otro implemento (barra, mancuernas, banda…): comparten familia. */
  familia?: string
}

// El JSON no conserva los tipos exactos; revisarContenido() (con test) verifica los valores.
export const EJERCICIOS = [...empuje, ...traccion, ...piernas, ...coreAccesorios, ...movilidadCardio, ...gimnasio, ...variantes, ...potencia, ...combate] as unknown as Ejercicio[]
const POR_ID = new Map(EJERCICIOS.map((e) => [e.id, e]))

export const ejercicio = (id: string): Ejercicio | undefined => POR_ID.get(id)

const IMPLEMENTOS: [string, string][] = [
  ['barra', 'Barra'],
  ['mancuernas', 'Mancuernas'],
  ['kettlebell', 'Kettlebell'],
  ['bandas', 'Banda'],
  ['maquinas', 'Máquina'],
  ['poleas', 'Polea'],
]

/** Con qué se hace: barra, mancuernas, banda, máquina, polea o sin equipo. */
export function implemento(e: Ejercicio): string {
  return IMPLEMENTOS.find(([q]) => e.equipo.includes(q))?.[1] ?? 'Sin equipo'
}

/** El mismo ejercicio con otros implementos (incluye el propio), en orden barra, mancuernas, banda, máquina, polea. */
export function variantesDe(id: string): Ejercicio[] {
  const e = POR_ID.get(id)
  if (!e?.familia) return e ? [e] : []
  const orden = (x: Ejercicio) => {
    const i = IMPLEMENTOS.findIndex(([q]) => x.equipo.includes(q))
    return i < 0 ? 99 : i
  }
  return EJERCICIOS.filter((x) => x.familia === e.familia).sort((a, b) => orden(a) - orden(b))
}

export const ESCALERAS = escalerasJson.escaleras
export const CRITERIO_ESCALERA = escalerasJson.criterio

export const PATRONES: { valor: string; texto: string; incluye: Patron[] }[] = [
  { valor: 'empuje', texto: 'Empuje', incluye: ['empuje', 'empuje-vertical'] },
  { valor: 'traccion', texto: 'Tracción', incluye: ['traccion', 'traccion-vertical'] },
  { valor: 'piernas', texto: 'Piernas', incluye: ['sentadilla', 'zancada'] },
  { valor: 'cadera', texto: 'Cadera', incluye: ['bisagra'] },
  { valor: 'core', texto: 'Tronco', incluye: ['core', 'transporte'] },
  { valor: 'potencia', texto: 'Potencia y saltos', incluye: ['potencia'] },
  { valor: 'accesorio', texto: 'Brazos y otros', incluye: ['accesorio'] },
  { valor: 'movilidad', texto: 'Movilidad', incluye: ['movilidad'] },
  { valor: 'cardio', texto: 'Cardio', incluye: ['cardio'] },
]

export const NOMBRES_EQUIPO: Record<string, string> = {
  bandas: 'bandas',
  anclaje: 'anclaje de puerta',
  mancuernas: 'mancuernas',
  'barra-dominadas': 'barra de dominadas',
  kettlebell: 'kettlebell',
  banco: 'banco',
  barra: 'barra y discos',
  maquinas: 'máquinas',
  poleas: 'poleas',
  'barras-plaza': 'barra baja',
  soga: 'soga',
  pelota: 'pelota medicinal',
}

/** Lo que suele haber en cualquier gimnasio. */
const EQUIPO_GIMNASIO = ['mancuernas', 'banco', 'barra', 'maquinas', 'poleas', 'barra-dominadas', 'kettlebell', 'barras-plaza', 'bandas', 'pelota']

/** Equipo disponible en un lugar. */
export function equipoDeLugar(l: Lugar): Set<string> {
  const base = new Set(l.equipo)
  if (l.tipo === 'gimnasio') EQUIPO_GIMNASIO.forEach((x) => base.add(x))
  return base
}

/** Equipo disponible sumando todos los lugares. */
export function equipoDisponible(lugares: Lugar[]): Set<string> {
  const total = new Set<string>()
  lugares.forEach((l) => equipoDeLugar(l).forEach((x) => total.add(x)))
  return total
}

export function sePuedeHacer(e: Ejercicio, equipo: Set<string>): boolean {
  return e.equipo.every((x) => equipo.has(x))
}

export function avisosLimitacion(e: Ejercicio, limitaciones: string[]) {
  return limitaciones.flatMap((l) => {
    const a = e.limitaciones[l]
    return a ? [{ limitacion: l, ...a }] : []
  })
}

export function evitarPorLimitacion(e: Ejercicio, limitaciones: string[]): boolean {
  return avisosLimitacion(e, limitaciones).some((a) => a.nivel === 'evitar')
}

/** Escalera a la que pertenece un ejercicio y su posición (empieza en 0). */
export function escaleraDe(id: string) {
  for (const esc of ESCALERAS) {
    const i = esc.pasos.indexOf(id)
    if (i >= 0) return { escalera: esc, indice: i }
  }
  return null
}

export function urlVideo(e: Ejercicio): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(e.video)}`
}

export function textoRango(e: Ejercicio): string {
  const [a, b] = e.rango
  return e.tipo === 'segundos' ? `${a} a ${b} segundos` : e.tipo === 'minutos' ? `${a} a ${b} minutos` : `${a} a ${b} repeticiones`
}

/** Revisa que el contenido sea coherente. Devuelve la lista de problemas (vacía si está todo bien). */
export function revisarContenido(): string[] {
  const errores: string[] = []
  const ids = new Set<string>()
  for (const e of EJERCICIOS) {
    if (ids.has(e.id)) errores.push(`id repetido: ${e.id}`)
    ids.add(e.id)
    for (const ref of [e.facil, e.dificil]) if (ref && !POR_ID.has(ref)) errores.push(`${e.id} apunta a ${ref}, que no existe`)
    if (e.rango.length !== 2 || e.rango[0] >= e.rango[1]) errores.push(`${e.id}: rango mal`)
    if (!PATRONES.some((p) => p.incluye.includes(e.patron))) errores.push(`${e.id}: patrón desconocido ${e.patron}`)
    if (!['reps', 'segundos', 'minutos'].includes(e.tipo)) errores.push(`${e.id}: tipo desconocido`)
    if (!['corporal', 'externa', 'banda'].includes(e.carga)) errores.push(`${e.id}: carga desconocida`)
    if (!['1x1', '2x2', 'amplio'].includes(e.espacio)) errores.push(`${e.id}: espacio desconocido`)
    for (const x of e.equipo) if (!NOMBRES_EQUIPO[x]) errores.push(`${e.id}: equipo desconocido ${x}`)
    if (e.familia) {
      const otros = EJERCICIOS.filter((x) => x.familia === e.familia && x.id !== e.id)
      if (!otros.length) errores.push(`${e.id}: familia ${e.familia} sin otras variantes`)
      if (otros.some((x) => implemento(x) === implemento(e))) errores.push(`${e.id}: dos variantes con el mismo implemento`)
    }
    for (const [l, a] of Object.entries(e.limitaciones)) if (!['muneca', 'rodilla', 'hombro', 'espalda-baja', 'cuello', 'tobillo'].includes(l) || !a || !['adaptar', 'evitar'].includes(a.nivel)) errores.push(`${e.id}: limitación mal (${l})`)
    if (e.pasos.length < 3) errores.push(`${e.id}: menos de 3 pasos`)
    if (e.errores.length < 3) errores.push(`${e.id}: menos de 3 errores`)
    if (e.carga !== 'corporal' && !e.pesoInicial) errores.push(`${e.id}: falta cómo elegir el peso inicial`)
  }
  for (const esc of ESCALERAS) for (const p of esc.pasos) if (!POR_ID.has(p)) errores.push(`escalera ${esc.id}: ${p} no existe`)
  return errores
}
