/* Generador del plan semanal (ESPECIFICACION.md, sección 7.2).
   Metas semanales: OMS 2020 (src/content/normas/actividad-oms.json).
   El reparto de sesiones, la elección de ejercicios y los tiempos son decisiones de diseño de la app. */
import oms from '../../content/normas/actividad-oms.json'
import tiposCuerpo from '../../content/tipos-cuerpo.json'
import type { Tendencia } from '../calc/tipoCuerpo'
import type { Lugar, MetodoSeries } from '../db/db'
import { EJERCICIOS, ESCALERAS, equipoDeLugar, escaleraDe, evitarPorLimitacion, sePuedeHacer, type Ejercicio, type Patron } from '../ejercicios'
import type { Semana } from '../perfil'

export type TipoSesion = 'fuerza' | 'cardio' | 'movilidad'
export type Metodo = 'clasico' | 'superseries' | 'circuito'

export interface EjercicioPlan {
  id: string
  /** Patrones que cumplen el mismo rol (para cambiar por uno equivalente). */
  patrones: Patron[]
  rol: 'principal' | 'accesorio' | 'core' | 'movilidad' | 'cardio'
  series: number
  rango: [number, number]
  descansoSeg: number
  /** Misma letra = se hacen juntos (superserie o circuito). */
  grupo?: string
}

export interface SesionPlan {
  id: string
  tipo: TipoSesion
  titulo: string
  lugar?: string
  desde?: string
  hasta?: string
  minutos: number
  intensidad: 'fuerte' | 'suave'
  metodo: Metodo
  ejercicios: EjercicioPlan[]
  nota?: string
}

export interface DiaPlan {
  sesiones: SesionPlan[]
}

export interface PlanSemana {
  creado: string
  dias: DiaPlan[]
}

export interface EntradaPlan {
  objetivos: { estetica: number; condicion: number; combate: number }
  zonas: string[]
  limitaciones: string[]
  lugares: Lugar[]
  semana: Semana
  /** Nivel de 1 a 5 en fuerza y cardio (de la última evaluación); 2 si no hay datos. */
  nivelFuerza: number
  nivelCardio: number
  tipoCuerpo?: Tendencia
  /** Índice del escalón actual en cada escalera (id de la escalera → índice). */
  escalones: Record<string, number>
}

/* ---------- Utilidades ---------- */

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const duracionHueco = (h: { desde: string; hasta: string }) => (((aMin(h.hasta) - aMin(h.desde)) % 1440) + 1440) % 1440

const ORDEN_ESPACIO = { '1x1': 0, '2x2': 1, amplio: 2 } as const
function espacioDeLugar(l: Lugar): number {
  return l.tipo === 'gimnasio' || l.tipo === 'aire-libre' ? 2 : ORDEN_ESPACIO[l.espacio] ?? 0
}

/** Escalón de cada escalera: el último anotado o, si no hay, según el nivel de fuerza. */
export function escalonesIniciales(nivelFuerza: number, anotados: string[] = []): Record<string, number> {
  const r: Record<string, number> = {}
  for (const esc of ESCALERAS) {
    const largo = esc.pasos.length
    r[esc.id] = Math.max(0, Math.min(largo - 1, Math.round(((nivelFuerza - 1) / 4) * (largo - 2))))
  }
  for (const id of anotados) {
    const e = escaleraDe(id)
    if (e) r[e.escalera.id] = e.indice
  }
  return r
}

/* ---------- Elección de ejercicios ---------- */

interface Slot {
  patrones: Patron[]
  rol: EjercicioPlan['rol']
  ids?: string[]
}

const SLOTS = {
  A: [
    { patrones: ['sentadilla'], rol: 'principal' },
    { patrones: ['empuje'], rol: 'principal' },
    { patrones: ['traccion-vertical', 'traccion'], rol: 'principal' },
    { patrones: ['bisagra'], rol: 'principal' },
    { patrones: ['core'], rol: 'core' },
  ],
  B: [
    { patrones: ['zancada', 'sentadilla'], rol: 'principal' },
    { patrones: ['empuje-vertical', 'empuje'], rol: 'principal' },
    { patrones: ['traccion', 'traccion-vertical'], rol: 'principal' },
    { patrones: ['bisagra'], rol: 'principal' },
    { patrones: ['core', 'transporte'], rol: 'core' },
  ],
  superior: [
    { patrones: ['empuje'], rol: 'principal' },
    { patrones: ['traccion-vertical', 'traccion'], rol: 'principal' },
    { patrones: ['empuje-vertical', 'empuje'], rol: 'principal' },
    { patrones: ['traccion', 'traccion-vertical'], rol: 'principal' },
    { patrones: ['core'], rol: 'core' },
  ],
  inferior: [
    { patrones: ['sentadilla'], rol: 'principal' },
    { patrones: ['bisagra'], rol: 'principal' },
    { patrones: ['zancada', 'sentadilla'], rol: 'principal' },
    { patrones: ['core', 'transporte'], rol: 'core' },
  ],
} satisfies Record<string, Slot[]>

/** Accesorios por zona elegida ("Verme mejor"). */
const ACCESORIOS_POR_ZONA: Record<string, { patrones: Patron[]; ids: string[]; enSuperior: boolean }> = {
  brazos: { patrones: ['accesorio'], ids: ['curl-biceps', 'extension-triceps'], enSuperior: true },
  pecho: { patrones: ['empuje'], ids: [], enSuperior: true },
  espalda: { patrones: ['traccion'], ids: ['face-pull-banda', 'remo-banda', 'remo-mancuerna'], enSuperior: true },
  postura: { patrones: ['traccion'], ids: ['face-pull-banda', 'remo-banda'], enSuperior: true },
  gluteos: { patrones: ['bisagra'], ids: ['hip-thrust', 'puente-gluteo', 'puente-una-pierna'], enSuperior: false },
  piernas: { patrones: ['zancada', 'accesorio'], ids: ['subida-banco', 'elevacion-talones'], enSuperior: false },
  panza: { patrones: ['core'], ids: [], enSuperior: false },
  definicion: { patrones: ['core'], ids: [], enSuperior: false },
}

interface Contexto {
  entrada: EntradaPlan
  lugar: Lugar
  equipo: Set<string>
  espacio: number
  base: Set<string>
}

function contexto(entrada: EntradaPlan, lugar: Lugar): Contexto {
  const tipo = entrada.tipoCuerpo
  const base = new Set<string>(tipo ? (tiposCuerpo.tipos as Record<string, { ejercicios: string[] }>)[tipo]?.ejercicios ?? [] : [])
  return { entrada, lugar, equipo: equipoDeLugar(lugar), espacio: espacioDeLugar(lugar), base }
}

/** Ejercicios posibles para un rol en un lugar, de mejor a peor. */
export function candidatos(patrones: Patron[], ctx: Contexto, usados: Set<string> = new Set(), ids?: string[]): Ejercicio[] {
  const { entrada, lugar, equipo, espacio, base } = ctx
  const prefs = lugar.gimnasio?.prefiere ?? []
  const muneca = entrada.limitaciones.includes('muneca')
  const lista = EJERCICIOS.filter((e) => {
    if (!patrones.includes(e.patron) || usados.has(e.id)) return false
    if (ids && ids.length && !ids.includes(e.id)) return false
    if (!sePuedeHacer(e, equipo) || evitarPorLimitacion(e, entrada.limitaciones)) return false
    // "2 × 2" solo pide el largo del cuerpo en el piso (al lado de la cama alcanza); lo amplio necesita gimnasio o aire libre.
    if (e.patron !== 'cardio' && e.espacio === 'amplio' && espacio < 2) return false
    const esc = escaleraDe(e.id)
    if (esc && entrada.escalones[esc.escalera.id] !== undefined && esc.indice !== entrada.escalones[esc.escalera.id]) return false
    return true
  })
  const puntaje = (e: Ejercicio) => {
    let p = 0
    if (base.has(e.id)) p += 2
    const usa = (x: string) => e.equipo.includes(x)
    if (lugar.tipo === 'gimnasio') {
      if (prefs.length) {
        if (prefs.includes('maquinas') && (usa('maquinas') || usa('poleas'))) p += 2
        if (prefs.includes('barra') && usa('barra')) p += 2
        if (prefs.includes('mancuernas') && usa('mancuernas')) p += 2
        if (prefs.includes('poleas') && usa('poleas')) p += 2
        if (prefs.includes('peso-corporal') && e.carga === 'corporal') p += 2
      } else if (usa('mancuernas') || usa('barra')) p += 1
    } else if (e.carga === 'externa' && entrada.nivelFuerza >= 2) p += 3
    else if (e.carga === 'corporal' && entrada.nivelFuerza < 2) p += 1
    if (muneca) {
      if (e.limitaciones.muneca?.nivel === 'adaptar') p -= 1
      if (usa('mancuernas') || usa('maquinas')) p += 1
      if (usa('barra')) p -= 2
    }
    if (entrada.nivelFuerza <= 2 && usa('barra')) p -= 1
    return p
  }
  return lista.map((e, i) => ({ e, p: puntaje(e), i })).sort((a, b) => b.p - a.p || a.i - b.i).map((x) => x.e)
}

function armarFuerza(entrada: EntradaPlan, lugar: Lugar, foco: keyof typeof SLOTS, minutos: number, id: string): SesionPlan {
  const ctx = contexto(entrada, lugar)
  const usados = new Set<string>()
  const ejercicios: EjercicioPlan[] = []
  const estetica = entrada.objetivos.estetica
  const variar = foco === 'B'

  const agregar = (slot: Slot) => {
    // Los patrones van en orden de preferencia: el segundo solo si no hay nada del primero.
    let lista: Ejercicio[] = []
    for (const pat of slot.patrones) {
      lista = candidatos([pat], ctx, usados, slot.ids)
      if (lista.length) break
    }
    const elegido = variar && lista.length > 1 && !escaleraDe(lista[0].id) ? lista[1] : lista[0]
    if (!elegido) return
    usados.add(elegido.id)
    const principal = slot.rol === 'principal'
    ejercicios.push({
      id: elegido.id,
      patrones: slot.patrones,
      rol: slot.rol,
      series: principal ? 3 : estetica >= 50 && slot.rol === 'accesorio' ? 3 : 2,
      rango: elegido.rango,
      descansoSeg: principal ? (elegido.carga === 'externa' ? 120 : 90) : slot.rol === 'accesorio' ? 60 : 45,
    })
  }

  SLOTS[foco].forEach(agregar)
  // Accesorios según las zonas que se quieren mejorar (si "Verme mejor" pesa).
  if (estetica >= 30) {
    const superior = foco !== 'inferior'
    for (const z of entrada.zonas) {
      const a = ACCESORIOS_POR_ZONA[z]
      if (!a) continue
      if (foco === 'superior' && !a.enSuperior) continue
      if (foco === 'inferior' && a.enSuperior) continue
      if (!superior && a.enSuperior) continue
      agregar({ patrones: a.patrones, rol: 'accesorio', ids: a.ids })
    }
  }
  // Un ejercicio de movilidad al final.
  const mov = candidatos(['movilidad'], ctx, usados)
  if (mov.length) {
    const m = foco === 'inferior' || foco === 'B' ? mov.find((x) => x.id === 'estiramiento-flexor-cadera') ?? mov[0] : mov[0]
    usados.add(m.id)
    ejercicios.push({ id: m.id, patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: m.rango, descansoSeg: 0 })
  }

  // Método de series.
  const elegido: MetodoSeries = lugar.gimnasio?.metodo ?? 'app'
  const metodo: Metodo = elegido === 'app' ? (minutos < 25 ? 'circuito' : 'superseries') : elegido
  agrupar(ejercicios, metodo, elegido === 'app')

  // Ajustar al tiempo disponible: sacar accesorios, después bajar series.
  while (estimarMinutos(ejercicios) > minutos && ejercicios.some((x) => x.rol === 'accesorio')) {
    ejercicios.splice(ejercicios.map((x) => x.rol).lastIndexOf('accesorio'), 1)
  }
  for (const x of ejercicios) if (estimarMinutos(ejercicios) > minutos && x.rol === 'principal' && x.series > 2) x.series = 2
  while (estimarMinutos(ejercicios) > minutos && ejercicios.length > 3) {
    const i = ejercicios.map((x) => x.rol).lastIndexOf('core')
    ejercicios.splice(i >= 0 ? i : ejercicios.length - 1, 1)
  }
  agrupar(ejercicios, metodo, elegido === 'app')

  const titulos = { A: 'Fuerza · cuerpo completo A', B: 'Fuerza · cuerpo completo B', superior: 'Fuerza · tren superior', inferior: 'Fuerza · tren inferior' }
  return {
    id,
    tipo: 'fuerza',
    titulo: titulos[foco],
    lugar: lugar.nombre,
    minutos: Math.min(minutos, Math.max(20, estimarMinutos(ejercicios))),
    intensidad: 'fuerte',
    metodo,
    ejercicios,
    nota:
      metodo === 'circuito'
        ? 'Circuito: un ejercicio atrás del otro, descansando lo justo; al terminar la vuelta, 1 a 2 minutos y otra vuelta.'
        : metodo === 'superseries'
          ? 'Los ejercicios con la misma letra van juntos: hacé una serie de cada uno y después descansá.'
          : 'Series clásicas: todas las series de un ejercicio, con su pausa, y después el siguiente.',
  }
}

/** Letras de grupo según el método. Con "que decida la app", los principales van en series clásicas. */
function agrupar(ejercicios: EjercicioPlan[], metodo: Metodo, app: boolean) {
  ejercicios.forEach((x) => (x.grupo = undefined))
  if (metodo === 'clasico') return
  if (metodo === 'circuito') {
    ejercicios.filter((x) => x.rol !== 'movilidad').forEach((x) => (x.grupo = 'C'))
    return
  }
  const juntables = ejercicios.filter((x) => x.rol !== 'movilidad' && (!app || x.rol !== 'principal'))
  let letra = 0
  for (let i = 0; i + 1 < juntables.length; i += 2) {
    const g = String.fromCharCode(65 + letra++)
    juntables[i].grupo = g
    juntables[i + 1].grupo = g
  }
}

/** Minutos aproximados: 5 de entrada en calor + 45 s de trabajo por serie + pausas. */
export function estimarMinutos(ejercicios: EjercicioPlan[]): number {
  let seg = 5 * 60
  const vistos = new Set<string>()
  for (const x of ejercicios) {
    if (x.rol === 'movilidad') {
      seg += 90
      continue
    }
    const trabajo = x.series * 45
    if (x.grupo) {
      seg += trabajo
      if (!vistos.has(x.grupo)) {
        vistos.add(x.grupo)
        seg += x.series * (x.grupo === 'C' ? 60 : x.descansoSeg)
      }
    } else seg += trabajo + (x.series - 1) * x.descansoSeg + 30
  }
  return Math.round(seg / 60)
}

function armarCardio(entrada: EntradaPlan, lugar: Lugar, minutos: number, id: string): SesionPlan {
  const ctx = contexto(entrada, lugar)
  const lista = candidatos(['cardio'], ctx)
  const bajoImpacto = entrada.tipoCuerpo === 'endomorfo' || entrada.limitaciones.some((l) => l === 'rodilla' || l === 'tobillo')
  const preferido = (id: string) => lista.find((x) => x.id === id)
  let e: Ejercicio | undefined
  if (bajoImpacto) e = preferido('caminata-rapida') ?? preferido('marcha-rodillas-altas')
  else if (entrada.nivelCardio >= 3 && lugar.tipo === 'aire-libre') e = preferido('trote-suave')
  e ??= preferido('soga') && minutos <= 25 ? preferido('soga') : undefined
  e ??= lugar.tipo === 'casa' && espacioDeLugar(lugar) < 2 && minutos <= 25 ? preferido('marcha-rodillas-altas') : undefined
  e ??= preferido('caminata-rapida') ?? lista[0]
  const ejercicios: EjercicioPlan[] = e ? [{ id: e.id, patrones: ['cardio'], rol: 'cardio', series: 1, rango: [minutos, minutos], descansoSeg: 0 }] : []
  return {
    id,
    tipo: 'cardio',
    titulo: 'Cardio moderado',
    lugar: e?.id === 'caminata-rapida' || e?.id === 'trote-suave' ? 'Afuera' : lugar.nombre,
    minutos,
    intensidad: 'suave',
    metodo: 'clasico',
    ejercicios,
    nota: 'Moderado: podés hablar pero no cantar. Cuenta para los 150 a 300 minutos semanales que recomienda la OMS.',
  }
}

function armarMovilidad(entrada: EntradaPlan, lugar: Lugar | undefined, id: string): SesionPlan {
  const l = lugar ?? { nombre: 'Casa', equipo: [], espacio: '1x1' as const }
  const ctx = contexto(entrada, l)
  const lista = candidatos(['movilidad'], ctx).slice(0, 3)
  return {
    id,
    tipo: 'movilidad',
    titulo: 'Movilidad (10 minutos)',
    lugar: lugar?.nombre,
    minutos: 10,
    intensidad: 'suave',
    metodo: 'clasico',
    ejercicios: lista.map((e) => ({ id: e.id, patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: e.rango, descansoSeg: 0 })),
    nota: 'Suave, sin dolor. Ideal en una pausa del trabajo si pasás muchas horas sentado.',
  }
}

/* ---------- Reparto de la semana ---------- */

/** Elige k días de la lista evitando días seguidos (domingo y lunes cuentan como seguidos). */
export function elegirDias(dias: number[], k: number, peso: (d: number) => number = () => 0): number[] {
  if (k >= dias.length) return [...dias]
  let mejor: number[] = []
  let mejorPuntaje = -Infinity
  const combinar = (inicio: number, actual: number[]) => {
    if (actual.length === k) {
      let seguidos = 0
      for (let i = 0; i < actual.length; i++) {
        const a = actual[i]
        const b = actual[(i + 1) % actual.length]
        if (actual.length > 1 && ((b - a + 7) % 7 === 1)) seguidos++
      }
      const puntaje = -seguidos * 100 + actual.reduce((s, d) => s + peso(d), 0)
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje
        mejor = [...actual]
      }
      return
    }
    for (let i = inicio; i < dias.length; i++) combinar(i + 1, [...actual, dias[i]])
  }
  combinar(0, [])
  return mejor
}

export function cuantasDeFuerza(diasDisponibles: number, estetica: number): number {
  if (diasDisponibles <= 3) return diasDisponibles
  return estetica >= 40 ? 4 : 3
}

export function generarPlan(entrada: EntradaPlan, hoy = new Date()): PlanSemana {
  const { semana, lugares } = entrada
  const porNombre = new Map(lugares.map((l) => [l.nombre, l]))
  const dias: DiaPlan[] = Array.from({ length: 7 }, () => ({ sesiones: [] }))

  const huecosDe = (d: number) => [...(semana.tipos[semana.dias[d]]?.huecos ?? [])].sort((a, b) => duracionHueco(b) - duracionHueco(a))
  const lugaresDe = (d: number) =>
    (semana.lugaresPorDia[d] ?? [])
      .map((n) => porNombre.get(n))
      .filter((l): l is Lugar => Boolean(l))
      .sort((a, b) => equipoDeLugar(b).size - equipoDeLugar(a).size)
  const disponibles = [0, 1, 2, 3, 4, 5, 6].filter((d) => lugaresDe(d).length > 0)

  const k = cuantasDeFuerza(disponibles.length, entrada.objetivos.estetica)
  const fuerza = elegirDias(disponibles, k, (d) => Math.min(90, huecosDe(d)[0] ? duracionHueco(huecosDe(d)[0]) : 30) / 100)
  const cardio = disponibles.filter((d) => !fuerza.includes(d))
  const focos: (keyof typeof SLOTS)[] = k === 4 && entrada.objetivos.estetica >= 40 ? ['superior', 'inferior', 'superior', 'inferior'] : ['A', 'B', 'A', 'B']

  const minutosCardio = cardio.length
    ? Math.max(20, Math.min(45, Math.ceil(oms.cardioMinutos.min / cardio.length / 5) * 5))
    : 0

  let n = 0
  const nuevoId = () => `s${++n}`
  for (const d of disponibles) {
    const [principal, otro] = lugaresDe(d)
    const [h1, h2] = huecosDe(d)
    const minutosHueco = h1 ? duracionHueco(h1) : 45
    let sesion: SesionPlan
    if (fuerza.includes(d)) {
      sesion = armarFuerza(entrada, principal, focos[fuerza.indexOf(d)], Math.min(75, minutosHueco), nuevoId())
    } else {
      sesion = armarCardio(entrada, principal, Math.min(minutosCardio, minutosHueco), nuevoId())
    }
    if (h1) {
      sesion.desde = h1.desde
      sesion.hasta = aHora(aMin(h1.desde) + sesion.minutos)
    }
    dias[d].sesiones.push(sesion)
    // Segundo lugar del día: algo corto.
    if (otro) {
      const corta = armarMovilidad(entrada, otro, nuevoId())
      if (h2) {
        corta.desde = h2.desde
        corta.hasta = aHora(aMin(h2.desde) + corta.minutos)
      }
      dias[d].sesiones.push(corta)
    }
  }
  // Movilidad corta en los días sin entrenamiento (opcional).
  for (let d = 0; d < 7; d++) {
    if (dias[d].sesiones.length) continue
    const m = armarMovilidad(entrada, lugares[0], nuevoId())
    m.titulo = 'Movilidad (opcional, 10 minutos)'
    dias[d].sesiones.push(m)
  }
  return { creado: hoy.toISOString(), dias }
}

/** Ejercicios equivalentes para cambiar uno del plan (mismo rol, posibles en ese lugar, sin los que ya están). */
export function alternativas(entrada: EntradaPlan, lugarNombre: string | undefined, ej: EjercicioPlan, usados: string[]): Ejercicio[] {
  const lugar = entrada.lugares.find((l) => l.nombre === lugarNombre) ?? entrada.lugares[0] ?? { nombre: '', equipo: [], espacio: '1x1' as const }
  const sinEscalon = { ...entrada, escalones: {} }
  return candidatos(ej.patrones, contexto(sinEscalon, lugar), new Set(usados))
}
