/* Módulo de combate: técnicas por disciplina y distancia, programa de sombra (niveles 1 a 5)
   y juego de pies (niveles 1 a 6). Todo el contenido está en src/content/combate/. */
import tecnicasJson from '../content/combate/tecnicas.json'
import programas from '../content/combate/programas.json'
import artesJson from '../content/combate/artes.json'
import sistemaJson from '../content/combate/sistema.json'
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
  /** Consejos propios de la disciplina para cada nivel de sombra y de pies (clave = nivel). */
  sombra?: Record<string, string[]>
  pies?: Record<string, string[]>
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
  /** Para el poder de pelea y el simulador. */
  experienciaGolpes?: string
  experienciaAgarre?: string
  sparring?: boolean
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
  for (const d of DISCIPLINAS) {
    for (const k of Object.keys(d.sombra ?? {})) if (!NIVELES_SOMBRA.some((n) => String(n.nivel) === k)) e.push(`${d.id}: sombra ${k}`)
    for (const k of Object.keys(d.pies ?? {})) if (!NIVELES_PIES.some((n) => String(n.nivel) === k)) e.push(`${d.id}: pies ${k}`)
  }
  if (CRITERIOS_GENERALES.length !== 4) e.push('criterios generales')
  NIVELES_SOMBRA.forEach((n, i) => n.nivel !== i + 1 && e.push(`sombra ${n.nivel}`))
  NIVELES_PIES.forEach((n, i) => {
    if (n.nivel !== i + 1) e.push(`pies ${n.nivel}`)
    if (!existePie(n.nivel)) e.push(`pies ${n.nivel}: sin dibujo`)
  })
  return e
}

/* ---------- Las 10 artes y el sistema completo ---------- */

export interface Postura {
  nombre: string
  /** Porcentaje del peso en la pierna de adelante (sin dato en posiciones de suelo). */
  del?: number
  uso: string
  altura?: Altura
}
export type Altura = 'muy baja' | 'baja' | 'media' | 'alta'
export interface Perfil {
  del: number
  /** 0 = suelo, 1 = baja, 2 = media, 3 = alta. */
  altura: number
  distancias: Distancia[]
  debil?: string
}
export interface Arte {
  id: string
  nombre: string
  idea: string
  posturas: Postura[]
  notas: { titulo: string; texto: string }[]
  sombra: string[]
  pies: string[]
  encadenamientos: { combo: string; porque: string }[]
  combinacion: { con: string[]; texto: string; alternativa: string; alt: string[] }
  perfil: Perfil
  evidencia?: string
}

export const ARTES = artesJson.artes as unknown as Arte[]
export const ANALISIS_ARTES = { fuente: artesJson.fuente, ejes: artesJson.ejes, regla: artesJson.regla, formula: artesJson.formula }
export const SISTEMA = sistemaJson
export const arte = (id: string) => ARTES.find((a) => a.id === id)

/** Perfil de una disciplina para combinarla (guardia, altura y distancias fuertes). */
export function perfilDe(id: string): Perfil | undefined {
  return arte(id)?.perfil ?? (artesJson.perfiles as unknown as Record<string, Perfil>)[id]
}

/** Lo que ya trae cada sistema combinado. */
const INCLUYE: Record<string, string[]> = {
  hibrido: ['boxeo', 'kick', 'muaythai'],
  completo: ['boxeo', 'kick', 'muaythai', 'kravmaga', 'bjj', 'hibrido'],
  mma: [],
}

/** Distancias que la segunda disciplina suma y la base no tiene. */
export function distanciasNuevas(base: string, segunda: string): Distancia[] {
  const a = perfilDe(base)
  const b = perfilDe(segunda)
  if (!a || !b) return []
  return DISTANCIAS.map((d) => d.valor).filter((d) => !a.distancias.includes(d) && b.distancias.includes(d))
}

/** Qué tan bien se combina una segunda disciplina con tu base (20 a 100) y por qué. Fórmula: ANALISIS_ARTES.formula. */
export function compatibilidad(base: string, segunda: string): { porcentaje: number; porque: string } | null {
  const a = perfilDe(base)
  const b = perfilDe(segunda)
  if (!a || !b || base === segunda) return null
  const nb = disciplina(segunda)?.nombre.split(':')[0] ?? segunda
  if (INCLUYE[base]?.includes(segunda) || INCLUYE[segunda]?.includes(base))
    return { porcentaje: 100, porque: INCLUYE[base]?.includes(segunda) ? `${nb} ya está dentro de tu base.` : `Ya incluye a tu base: si querés todo junto, elegí ${nb.toLowerCase()} como base.` }
  const faltan = DISTANCIAS.map((d) => d.valor).filter((d) => !a.distancias.includes(d))
  const nuevas = distanciasNuevas(base, segunda)
  const complemento = faltan.length ? nuevas.length / faltan.length : 0
  const ra = arte(base)?.combinacion
  const rb = arte(segunda)?.combinacion
  const recomendada = ra?.con.includes(segunda) || rb?.con.includes(base) ? 1 : ra?.alt.includes(segunda) || rb?.alt.includes(base) ? 0.5 : 0
  const guardia = 1 - Math.min(1, Math.abs(a.del - b.del) / 40)
  const altura = 1 - Math.abs(a.altura - b.altura) / 3
  const parecido = (guardia + altura) / 2
  const puntaje = 0.5 * complemento + 0.3 * recomendada + 0.2 * parecido
  const porcentaje = Math.round(20 + 80 * puntaje)
  const nombres = (ds: Distancia[]) => ds.map((d) => DISTANCIAS.find((x) => x.valor === d)!.texto.toLowerCase()).join(', ')
  const partes = [
    nuevas.length ? `Te suma ${nombres(nuevas)}.` : faltan.length ? 'No te suma distancias nuevas: casi todo se repite.' : 'Tu base ya cubre todas las distancias: suma técnica, no distancias.',
    `Guardias ${parecido >= 0.75 ? 'parecidas' : parecido >= 0.5 ? 'algo distintas' : 'muy distintas'} (${a.del}/${100 - a.del} y ${b.del}/${100 - b.del}).`,
    recomendada === 1 ? 'El análisis la recomienda como complemento.' : recomendada === 0.5 ? 'El análisis la da como alternativa.' : '',
  ]
  return { porcentaje, porque: partes.filter(Boolean).join(' ') }
}

/** Texto del análisis sobre por qué combinar estas dos (si el análisis la recomienda). */
export function textoCombinacion(base: string, segunda: string): string | undefined {
  const ra = arte(base)?.combinacion
  if (ra?.con.includes(segunda)) return ra.texto
  const rb = arte(segunda)?.combinacion
  if (rb?.con.includes(base)) return rb.texto
  return undefined
}
