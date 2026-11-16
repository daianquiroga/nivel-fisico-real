/* Módulo de combate: técnicas por disciplina y distancia, programa de sombra (niveles 1 a 5)
   y juego de pies (niveles 1 a 6). Todo el contenido está en src/content/combate/. */
import tecnicasJson from '../content/combate/tecnicas.json'
import programas from '../content/combate/programas.json'
import { db } from './db/db'

export type Distancia = 'larga' | 'media' | 'corta' | 'clinch' | 'suelo'
export type Peso = 'adelante' | 'centro' | 'atras'

export interface Tecnica {
  id: string
  nombre: string
  disciplinas: string[]
  distancia: Distancia
  tipo: string
  lado: 'adelante' | 'atras' | 'ambos'
  /** Dónde queda el peso al terminar la técnica (para armar combinaciones con sentido). */
  peso: Peso
  pasos: string[]
  errores: string[]
}

export interface Disciplina {
  id: string
  nombre: string
  detalle: string
  basicas: string[]
  criterios: string[]
}

export interface Rounds {
  rondas: number
  trabajo: number
  descanso: number
}

export interface NivelSombra {
  nivel: number
  nombre: string
  objetivo: string
  rounds: Rounds
  pasos: string[]
}

export interface NivelPies extends NivelSombra {
  que: string
  pasar: string
}

export const TECNICAS = tecnicasJson as Tecnica[]
export const DISCIPLINAS = programas.disciplinas as Disciplina[]
export const CRITERIOS_GENERALES = programas.criteriosGenerales
export const NIVELES_SOMBRA = programas.nivelesSombra as NivelSombra[]
export const NIVELES_PIES = programas.nivelesPies as unknown as NivelPies[]
export const FUENTE_PROGRAMAS = programas.fuente

export const DISTANCIAS: { valor: Distancia; texto: string }[] = [
  { valor: 'larga', texto: 'Larga' },
  { valor: 'media', texto: 'Media' },
  { valor: 'corta', texto: 'Corta' },
  { valor: 'clinch', texto: 'Clinch' },
  { valor: 'suelo', texto: 'Suelo' },
]

export const NOMBRES_TIPO: Record<string, string> = {
  golpe: 'Golpe',
  patada: 'Patada',
  rodilla: 'Rodilla',
  codo: 'Codo',
  defensa: 'Defensa',
  derribo: 'Derribo',
  agarre: 'Agarre',
  caida: 'Caída',
  suelo: 'Suelo',
}

const POR_ID = new Map(TECNICAS.map((t) => [t.id, t]))
export const tecnica = (id: string) => POR_ID.get(id)
export const disciplina = (id: string) => DISCIPLINAS.find((d) => d.id === id)

export function tecnicasDe(disc: string | null, dist: Distancia | null): Tecnica[] {
  return TECNICAS.filter((t) => (!disc || t.disciplinas.includes(disc)) && (!dist || t.distancia === dist))
}

/** Los 8 criterios para aprobar un nivel de sombra: 4 generales y 4 de la disciplina. */
export const criteriosDe = (disc: string): string[] => [...CRITERIOS_GENERALES, ...(disciplina(disc)?.criterios ?? [])]

/* ---------- Progreso guardado ---------- */

export interface PruebaSombra {
  fecha: string
  disciplina: string
  nivel: number
  criterios: boolean[]
  aprobado: boolean
}

export interface PruebaPies {
  fecha: string
  nivel: number
}

/** Para aprobar un nivel de sombra hacen falta los 8 criterios (decisión de diseño de la app). */
export const aprueba = (criterios: boolean[]) => criterios.length === 8 && criterios.every(Boolean)

/** Nivel de sombra alcanzado en una disciplina (0 si todavía no aprobó ninguno). Se sube de a uno. */
export function nivelSombra(pruebas: PruebaSombra[], disc: string): number {
  let n = 0
  for (const p of [...pruebas].sort((a, b) => a.fecha.localeCompare(b.fecha))) if (p.disciplina === disc && p.aprobado && p.nivel === n + 1) n = p.nivel
  return Math.min(n, NIVELES_SOMBRA.length)
}

/** Nivel de pies aprobado (0 a 6). */
export function nivelPies(pruebas: PruebaPies[]): number {
  let n = 0
  for (const p of [...pruebas].sort((a, b) => a.fecha.localeCompare(b.fecha))) if (p.nivel === n + 1) n = p.nivel
  return Math.min(n, NIVELES_PIES.length)
}

export interface AjustesCombate {
  disciplina: string
  /** Disciplina que se suma después (recomendado tras 6 a 12 meses con la base). */
  segunda?: string
  desde: string
}

export async function leerAjustesCombate(): Promise<AjustesCombate | null> {
  return ((await db.ajustes.get('combate'))?.valor as AjustesCombate | undefined) ?? null
}

export async function guardarAjustesCombate(a: AjustesCombate) {
  await db.ajustes.put({ clave: 'combate', valor: a })
}

/** Meses desde que se eligió la disciplina base (para recomendar sumar otra a los 6 a 12 meses). */
export function mesesCon(a: AjustesCombate, hoy = new Date()): number {
  return Math.max(0, Math.floor((hoy.getTime() - new Date(a.desde).getTime()) / (30.44 * 86_400_000)))
}

/** Revisa que el contenido sea coherente. */
export function revisarCombate(existeDibujo: (id: string) => boolean, existePie: (n: number) => boolean): string[] {
  const e: string[] = []
  const discs = new Set(DISCIPLINAS.map((d) => d.id))
  const dists = new Set(DISTANCIAS.map((d) => d.valor))
  for (const t of TECNICAS) {
    if (!t.disciplinas.length || t.disciplinas.some((d) => !discs.has(d))) e.push(`${t.id}: disciplina`)
    if (!dists.has(t.distancia)) e.push(`${t.id}: distancia`)
    if (!NOMBRES_TIPO[t.tipo]) e.push(`${t.id}: tipo`)
    if (!['adelante', 'centro', 'atras'].includes(t.peso)) e.push(`${t.id}: peso`)
    if (t.pasos.length < 3 || t.errores.length < 2) e.push(`${t.id}: pasos o errores`)
    if (!existeDibujo(t.id)) e.push(`${t.id}: sin dibujo`)
  }
  for (const d of DISCIPLINAS) {
    if (d.criterios.length !== 4) e.push(`${d.id}: 4 criterios`)
    for (const b of d.basicas) if (!POR_ID.get(b)?.disciplinas.includes(d.id)) e.push(`${d.id}: básica ${b}`)
  }
  if (CRITERIOS_GENERALES.length !== 4) e.push('criterios generales')
  NIVELES_SOMBRA.forEach((n, i) => n.nivel !== i + 1 && e.push(`sombra ${n.nivel}`))
  NIVELES_PIES.forEach((n, i) => {
    if (n.nivel !== i + 1) e.push(`pies ${n.nivel}`)
    if (!existePie(n.nivel)) e.push(`pies ${n.nivel}: sin dibujo`)
  })
  return e
}
