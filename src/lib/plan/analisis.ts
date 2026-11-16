/* Análisis de una rutina semanal: qué trabaja, cómo, qué aporta a lo físico, lo estético y lo marcial, y qué le falta.
   Fuentes:
   - Series semanales por músculo: Schoenfeld, Ogborn y Krieger 2017 (src/content/normas/volumen.json): menos de 5, 5 a 9, 10 o más.
   - Cardio y fuerza: OMS 2020 (src/content/normas/actividad-oms.json); un minuto vigoroso (6 MET o más) cuenta como dos moderados.
   - MET de cada actividad: Compendium 2024 (src/content/normas/mets.json).
   Los tres puntajes (físico, estético y marcial) y sus pesos son una decisión de diseño de la app: sirven para comparar
   rutinas entre sí y ver qué cambia al sumar o sacar algo, no son una medida publicada. */
import mets from '../../content/normas/mets.json'
import oms from '../../content/normas/actividad-oms.json'
import volumen from '../../content/normas/volumen.json'
import { EJERCICIOS, ejercicio, escaleraDe, evitarPorLimitacion, sePuedeHacer, type Ejercicio, type Patron } from '../ejercicios'
import { NOMBRES_DIAS } from '../perfil'
import type { PlanSemana, SesionPlan } from './generador'

export const GRUPOS: { id: string; texto: string; de: string[] }[] = [
  { id: 'pecho', texto: 'Pecho', de: ['pecho'] },
  { id: 'espalda', texto: 'Espalda', de: ['dorsales', 'espalda alta', 'trapecios'] },
  { id: 'hombros', texto: 'Hombros', de: ['hombros', 'hombros (parte de atrás)', 'hombros (parte del costado)', 'manguito rotador'] },
  { id: 'biceps', texto: 'Bíceps', de: ['bíceps', 'antebrazos'] },
  { id: 'triceps', texto: 'Tríceps', de: ['tríceps'] },
  { id: 'cuadriceps', texto: 'Cuádriceps', de: ['cuádriceps', 'piernas'] },
  { id: 'isquios', texto: 'Isquiotibiales', de: ['isquiotibiales'] },
  { id: 'gluteos', texto: 'Glúteos', de: ['glúteos', 'aductores'] },
  { id: 'pantorrillas', texto: 'Pantorrillas', de: ['pantorrillas'] },
  { id: 'tronco', texto: 'Abdomen y tronco', de: ['abdomen', 'oblicuos', 'zona lumbar', 'columna'] },
]

/** Zonas que la persona quiere mejorar → grupos que pesan el doble en lo estético. */
const ZONA_A_GRUPOS: Record<string, string[]> = {
  brazos: ['biceps', 'triceps'],
  pecho: ['pecho'],
  espalda: ['espalda'],
  postura: ['espalda', 'hombros', 'tronco'],
  piernas: ['cuadriceps', 'isquios', 'pantorrillas'],
  gluteos: ['gluteos'],
  panza: ['tronco'],
  definicion: [],
}

export const PATRONES_BASE: { id: string; texto: string; incluye: Patron[] }[] = [
  { id: 'empuje', texto: 'Empujar (pecho, hombros, tríceps)', incluye: ['empuje', 'empuje-vertical'] },
  { id: 'traccion', texto: 'Tirar (espalda, bíceps)', incluye: ['traccion', 'traccion-vertical'] },
  { id: 'rodilla', texto: 'Piernas: sentadilla o zancada', incluye: ['sentadilla', 'zancada'] },
  { id: 'cadera', texto: 'Cadera: bisagra (glúteos, isquios)', incluye: ['bisagra'] },
  { id: 'tronco', texto: 'Tronco (abdomen, zona lumbar)', incluye: ['core', 'transporte'] },
]

const TECNICA = new Set(['sombra', 'juego-pies', 'clase-golpes', 'clase-agarre'])
const INTERVALOS = new Set(['soga', 'sombra', 'juego-pies', 'clase-golpes', 'clase-agarre', 'trote-suave'])

export interface ContextoAnalisis {
  objetivos: { estetica: number; condicion: number; combate: number }
  zonas: string[]
  limitaciones: string[]
  /** Equipo disponible en algún lugar (para sugerir solo lo que se puede hacer). Vacío = no filtrar. */
  equipo: Set<string>
}

export interface Falta {
  area: 'cardio' | 'fuerza' | 'patron' | 'musculo' | 'equilibrio' | 'movilidad' | 'descanso' | 'combate'
  /** Más alto = más importante para los objetivos de la persona. */
  prioridad: number
  texto: string
  /** Ejercicios de la biblioteca que lo resuelven. */
  sugerencias: string[]
}

export interface SesionAnalizada {
  dia: string
  titulo: string
  minutos: number
  series: number
  ejercicios: number
  trabaja: string[]
  intensidad: 'fuerte' | 'suave'
}

export interface Analisis {
  series: Record<string, number>
  patrones: Record<string, number>
  diasFuerza: number
  diasMovilidad: number
  diasDescanso: number
  minutosCardio: number
  /** Minutos moderados equivalentes (los vigorosos cuentan doble). */
  cardioEquivalente: number
  minutosTecnica: number
  minutosIntervalos: number
  combate: { golpes: boolean; agarre: boolean; pies: boolean }
  puntajes: { fisico: number; estetico: number; marcial: number; objetivos: number }
  /** Si la rutina es buena para los objetivos de la persona, en una frase. */
  veredicto: { buena: boolean; texto: string }
  sesiones: SesionAnalizada[]
  faltas: Falta[]
  fuerte: string[]
}

const porEjercicio = mets.porEjercicio as Record<string, { actividad: string; variante: string }>
const actividades = mets.actividades as Record<string, { variantes: Record<string, { met: number }> }>
const metDe = (id: string): number => {
  const m = porEjercicio[id]
  return m ? (actividades[m.actividad]?.variantes[m.variante]?.met ?? 4) : 4
}

const esFuerza = (e: Ejercicio) => e.patron !== 'cardio' && e.patron !== 'movilidad'
const lim01 = (x: number) => Math.max(0, Math.min(1, x))
const redondear = (x: number) => Math.round(x * 10) / 10

/** Sugerencias: primero lo que usa el equipo que tenés (pesas, máquinas) y no los escalones más fáciles de cada escalera. */
function sugerir(filtro: (e: Ejercicio) => boolean, ctx: ContextoAnalisis, ya: Set<string>, n = 3): string[] {
  const puntaje = (e: Ejercicio) => {
    let p = 0
    if (e.equipo.length && ctx.equipo.size && sePuedeHacer(e, ctx.equipo)) p += 2
    const esc = escaleraDe(e.id)
    if (esc && esc.indice < 2) p -= 2
    return p
  }
  return EJERCICIOS.filter((e) => filtro(e) && !ya.has(e.id) && !evitarPorLimitacion(e, ctx.limitaciones) && (!ctx.equipo.size || sePuedeHacer(e, ctx.equipo)) && !e.combate)
    .map((e, i) => ({ e, p: puntaje(e), i }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .slice(0, n)
    .map((x) => x.e.id)
}

export function analizarRutina(plan: PlanSemana, ctx: ContextoAnalisis): Analisis {
  const series: Record<string, number> = Object.fromEntries(GRUPOS.map((g) => [g.id, 0]))
  const patrones: Record<string, number> = Object.fromEntries(PATRONES_BASE.map((p) => [p.id, 0]))
  const grupoDe = (musculo: string) => GRUPOS.find((g) => g.de.includes(musculo))?.id
  const ya = new Set<string>()
  let diasFuerza = 0
  let diasMovilidad = 0
  let diasDescanso = 0
  let minutosCardio = 0
  let cardioEquivalente = 0
  let minutosTecnica = 0
  let minutosIntervalos = 0
  const combate = { golpes: false, agarre: false, pies: false }
  const sesiones: SesionAnalizada[] = []

  plan.dias.forEach((d, i) => {
    let fuerzaHoy = false
    let movHoy = false
    if (!d.sesiones.some((s) => s.intensidad === 'fuerte')) diasDescanso++
    for (const s of d.sesiones) {
      const trabajaSesion: Record<string, number> = {}
      let seriesSesion = 0
      for (const ep of s.ejercicios) {
        const e = ejercicio(ep.id)
        if (!e) continue
        ya.add(e.id)
        if (e.patron === 'movilidad') {
          movHoy = true
          continue
        }
        if (e.patron === 'cardio') {
          const min = ep.rango[0] * Math.max(1, ep.series)
          minutosCardio += min
          cardioEquivalente += metDe(e.id) >= 6 ? min * 2 : min
          if (TECNICA.has(e.id)) minutosTecnica += min
          if (INTERVALOS.has(e.id)) minutosIntervalos += min
          if (e.id === 'sombra' || e.id === 'clase-golpes') combate.golpes = true
          if (e.id === 'clase-agarre') combate.agarre = true
          if (e.id === 'juego-pies' || e.id === 'clase-golpes') combate.pies = true
          continue
        }
        if (!esFuerza(e)) continue
        fuerzaHoy = true
        seriesSesion += ep.series
        const p = PATRONES_BASE.find((x) => x.incluye.includes(e.patron))
        if (p) patrones[p.id] += ep.series
        const vistos = new Set<string>()
        for (const m of e.principal) {
          const g = grupoDe(m)
          if (g && !vistos.has(g)) {
            vistos.add(g)
            series[g] += ep.series
            trabajaSesion[g] = (trabajaSesion[g] ?? 0) + ep.series
          }
        }
        for (const m of e.secundarios) {
          const g = grupoDe(m)
          if (g && !vistos.has(g)) {
            vistos.add(g)
            series[g] += ep.series * 0.5
            trabajaSesion[g] = (trabajaSesion[g] ?? 0) + ep.series * 0.5
          }
        }
      }
      if (s.ejercicios.length)
        sesiones.push({
          dia: NOMBRES_DIAS[i],
          titulo: s.titulo,
          minutos: s.minutos,
          series: seriesSesion,
          ejercicios: s.ejercicios.length,
          intensidad: s.intensidad,
          trabaja: Object.entries(trabajaSesion)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([g]) => GRUPOS.find((x) => x.id === g)!.texto.toLowerCase()),
        })
    }
    if (fuerzaHoy) diasFuerza++
    if (movHoy) diasMovilidad++
  })
  for (const g of GRUPOS) series[g.id] = redondear(series[g.id])

  // ---------- Puntajes (decisión de diseño) ----------
  const cubiertos = PATRONES_BASE.filter((p) => patrones[p.id] > 0).length
  const c = lim01(cardioEquivalente / oms.cardioMinutos.min)
  const f = lim01(diasFuerza / oms.fuerzaDias.min) * (cubiertos / PATRONES_BASE.length)
  const m = lim01(diasMovilidad / 3)
  const r = diasDescanso >= 1 ? 1 : 0.4
  const fisico = 100 * (0.35 * c + 0.35 * f + 0.15 * m + 0.15 * r)

  const zonaGrupos = new Set(ctx.zonas.flatMap((z) => ZONA_A_GRUPOS[z] ?? []))
  let sumaV = 0
  let pesoV = 0
  for (const g of GRUPOS) {
    const peso = zonaGrupos.has(g.id) ? 2 : 1
    sumaV += peso * lim01(series[g.id] / volumen.bueno)
    pesoV += peso
  }
  const v = sumaV / pesoV
  const estetico = 100 * (0.7 * v + 0.15 * c + 0.15 * lim01(diasFuerza / 3))

  const t = lim01(minutosTecnica / 120)
  const ac = lim01(minutosIntervalos / 60)
  const pot = ['empuje', 'traccion', 'rodilla', 'cadera'].filter((p) => patrones[p] > 0).length / 4
  const tr = lim01(series.tronco / volumen.bueno)
  const marcial = 100 * (0.4 * t + 0.2 * ac + 0.2 * pot + 0.1 * tr + 0.1 * m)

  const o = ctx.objetivos
  const totalO = Math.max(1, o.estetica + o.condicion + o.combate)
  const objetivos = (estetico * o.estetica + fisico * o.condicion + marcial * o.combate) / totalO

  // ---------- Qué falta ----------
  const faltas: Falta[] = []
  const pesoObj = (k: 'estetica' | 'condicion' | 'combate') => o[k] / totalO
  if (cardioEquivalente < oms.cardioMinutos.min) {
    const faltan = Math.round(oms.cardioMinutos.min - cardioEquivalente)
    faltas.push({
      area: 'cardio',
      prioridad: 90 * (0.5 + pesoObj('condicion')),
      texto: `Cardio: tenés ${Math.round(cardioEquivalente)} de ${oms.cardioMinutos.min} minutos semanales que recomienda la OMS. Te faltan unos ${faltan} minutos moderados (o la mitad si son vigorosos, como soga o trote).`,
      sugerencias: sugerir((e) => e.patron === 'cardio', ctx, ya),
    })
  }
  if (diasFuerza < oms.fuerzaDias.min) {
    faltas.push({
      area: 'fuerza',
      prioridad: 85,
      texto: `Fuerza: ${diasFuerza} ${diasFuerza === 1 ? 'día' : 'días'} por semana; la OMS recomienda al menos ${oms.fuerzaDias.min}.`,
      sugerencias: sugerir((e) => e.patron === 'sentadilla' || e.patron === 'empuje' || e.patron === 'traccion', ctx, ya),
    })
  }
  for (const p of PATRONES_BASE) {
    if (patrones[p.id] > 0) continue
    faltas.push({
      area: 'patron',
      prioridad: 70,
      texto: `No hay ningún ejercicio de ${p.texto.toLowerCase()}. Es uno de los 5 movimientos base: sumá al menos uno.`,
      sugerencias: sugerir((e) => p.incluye.includes(e.patron), ctx, ya),
    })
  }
  for (const g of GRUPOS) {
    const meta = zonaGrupos.has(g.id) ? volumen.bueno : volumen.bajo
    if (series[g.id] >= meta) continue
    const sinPatron = PATRONES_BASE.some((p) => patrones[p.id] === 0 && faltas.some((x) => x.area === 'patron'))
    faltas.push({
      area: 'musculo',
      prioridad: (zonaGrupos.has(g.id) ? 60 : 35) * (0.5 + pesoObj('estetica')) - (sinPatron ? 5 : 0),
      texto: `${g.texto}: ${String(series[g.id]).replace('.', ',')} series por semana. ${zonaGrupos.has(g.id) ? `Es una zona que querés mejorar: para que crezca conviene llegar a ${volumen.bueno} o más.` : `Con menos de ${volumen.bajo} crece poco; apuntá a ${volumen.bajo} a ${volumen.bueno}.`}`,
      sugerencias: sugerir((e) => esFuerza(e) && e.principal.some((x) => g.de.includes(x)), ctx, ya),
    })
  }
  if (patrones.empuje > 0 && patrones.traccion < patrones.empuje * 0.7) {
    faltas.push({
      area: 'equilibrio',
      prioridad: 55,
      texto: `Empujás más de lo que tirás (${patrones.empuje} series contra ${patrones.traccion}). Para los hombros y la postura conviene tirar al menos tanto como empujás.`,
      sugerencias: sugerir((e) => e.patron === 'traccion' || e.patron === 'traccion-vertical', ctx, ya),
    })
  }
  if (diasMovilidad < 2) {
    faltas.push({
      area: 'movilidad',
      prioridad: 30,
      texto: `Movilidad: ${diasMovilidad} ${diasMovilidad === 1 ? 'día' : 'días'}. Con 5 a 10 minutos 2 o 3 veces por semana alcanza.`,
      sugerencias: sugerir((e) => e.patron === 'movilidad', ctx, ya),
    })
  }
  if (diasDescanso === 0) {
    faltas.push({ area: 'descanso', prioridad: 65, texto: 'No hay ningún día sin sesión fuerte: dejá al menos uno suave o de descanso para recuperarte.', sugerencias: [] })
  }
  if (o.combate >= 20 && minutosTecnica < 60) {
    faltas.push({
      area: 'combate',
      prioridad: 80 * (0.5 + pesoObj('combate')),
      texto: `Saber defenderte pesa ${o.combate} de 100 en tus objetivos, pero hay ${minutosTecnica} minutos de técnica por semana. Sumá rounds de sombra y de pies (o una clase) para llegar a 1 o 2 horas.`,
      sugerencias: ['sombra', 'juego-pies', 'clase-golpes'].filter((x) => !ya.has(x)),
    })
  }
  if (o.combate >= 20 && combate.golpes && !combate.agarre && minutosTecnica >= 60) {
    faltas.push({ area: 'combate', prioridad: 25, texto: 'Para defensa personal, más adelante conviene sumar algo de agarre y suelo (BJJ, judo o lucha).', sugerencias: ['clase-agarre'] })
  }

  const fuerte = GRUPOS.filter((g) => series[g.id] >= volumen.bueno).map((g) => g.texto)
  return {
    series,
    patrones,
    diasFuerza,
    diasMovilidad,
    diasDescanso,
    minutosCardio,
    cardioEquivalente,
    minutosTecnica,
    minutosIntervalos,
    combate,
    puntajes: { fisico: Math.round(fisico), estetico: Math.round(estetico), marcial: Math.round(marcial), objetivos: Math.round(objetivos) },
    veredicto: veredicto({ fisico: Math.round(fisico), estetico: Math.round(estetico), marcial: Math.round(marcial), objetivos: Math.round(objetivos) }, ctx.objetivos),
    sesiones,
    faltas: faltas.sort((a, b) => b.prioridad - a.prioridad),
    fuerte,
  }
}

/** Sesión de la que se habla en un texto para la persona (ej. "Lunes: Fuerza A"). */
export const nombreSesion = (dia: number, s: SesionPlan) => `${NOMBRES_DIAS[dia]}: ${s.titulo}`

/* ---------- Cómo leer los puntajes ----------
   Cortes 40 / 65 / 85: decisión de diseño de la app (no son un estándar publicado). Con 65 una área ya cumple lo
   básico de su meta (por ejemplo, cardio cerca de los 150 minutos y 2 días de fuerza completos para Físico). */
export const CORTES = { base: 40, buena: 65, completa: 85 }

export type Calificacion = 'falta' | 'base' | 'buena' | 'completa'

export function calificar(n: number): { nivel: Calificacion; texto: string } {
  if (n >= CORTES.completa) return { nivel: 'completa', texto: 'Muy completa' }
  if (n >= CORTES.buena) return { nivel: 'buena', texto: 'Buena' }
  if (n >= CORTES.base) return { nivel: 'base', texto: 'Base, se puede mejorar' }
  return { nivel: 'falta', texto: 'Le falta bastante' }
}

const AREAS = [
  { clave: 'fisico', objetivo: 'condicion', nombre: 'físico' },
  { clave: 'estetico', objetivo: 'estetica', nombre: 'estético' },
  { clave: 'marcial', objetivo: 'combate', nombre: 'marcial' },
] as const

/** Veredicto en una frase: la rutina es buena si el puntaje de tus objetivos llega a 65 y ninguna área que te importa
    (20 % o más de tus objetivos) queda debajo de 40. Las áreas que no elegiste pueden dar bajo y está bien. */
export function veredicto(p: Analisis['puntajes'], objetivos: ContextoAnalisis['objetivos']): { buena: boolean; texto: string } {
  const total = Math.max(1, objetivos.estetica + objetivos.condicion + objetivos.combate)
  const importan = AREAS.filter((a) => objetivos[a.objetivo] / total >= 0.2)
  const flojas = importan.filter((a) => p[a.clave] < CORTES.base).map((a) => a.nombre)
  if (p.objetivos >= CORTES.buena && flojas.length === 0)
    return { buena: true, texto: p.objetivos >= CORTES.completa ? 'Rutina muy completa para lo que buscás.' : 'Buena rutina para lo que buscás. Ahora lo que suma es la constancia.' }
  if (flojas.length) return { buena: false, texto: `Todavía le falta en lo ${flojas.join(' y lo ')}, que es parte de lo que buscás. Mirá abajo qué sumar.` }
  return { buena: false, texto: `Va bien, pero para ser buena tiene que llegar a ${CORTES.buena}. Mirá abajo qué sumar.` }
}
