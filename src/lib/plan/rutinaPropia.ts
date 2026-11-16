/* Rutina propia: armarla tildando ejercicios o pegarla como texto (por ejemplo, la que te dio el gimnasio).
   El texto se lee línea por línea: días ("Lunes", "Día 2"), horarios ("19:30", "19h"), ejercicios con series
   ("Press banca 4x10", "Sentadilla 3 x 8-12") o minutos ("Caminata 30 min"). Lo que no se reconoce se muestra para elegirlo a mano. */
import { normalizar } from '../aprender'
import { EJERCICIOS, ejercicio, implemento, variantesDe, type Ejercicio } from '../ejercicios'
import { nuevoEjercicioPlan } from './editar'
import { agrupar, estimarMinutos, type EjercicioPlan, type PlanSemana, type SesionPlan } from './generador'

/** Nombres comunes de gimnasio → ejercicio de la biblioteca (sin tildes, en minúscula). Gana el más largo que aparezca. */
const ALIAS: [string, string][] = [
  ['press de banca con mancuernas', 'press-banca-mancuernas'],
  ['press banca con mancuernas', 'press-banca-mancuernas'],
  ['press banca', 'press-banca-barra'],
  ['press de banca', 'press-banca-barra'],
  ['press plano', 'press-banca-barra'],
  ['pecho plano', 'press-banca-barra'],
  ['press pecho maquina', 'press-pecho-maquina'],
  ['press de pecho', 'press-pecho-maquina'],
  ['press militar', 'press-militar-barra'],
  ['press de hombros', 'press-hombros-mancuernas'],
  ['press hombro', 'press-hombros-mancuernas'],
  ['remo inclinado', 'remo-barra'],
  ['remo con barra', 'remo-barra'],
  ['curl martillo', 'curl-martillo'],
  ['martillo', 'curl-martillo'],
  ['encogimientos', 'encogimientos-mancuernas'],
  ['shrugs', 'encogimientos-mancuernas'],
  ['vuelos posteriores', 'pajaro-mancuernas'],
  ['pajaro', 'pajaro-mancuernas'],
  ['face pull', 'face-pull-banda'],
  ['vuelos laterales', 'elevaciones-laterales'],
  ['elevaciones laterales', 'elevaciones-laterales'],
  ['laterales', 'elevaciones-laterales'],
  ['sentadilla bulgara', 'sentadilla-bulgara'],
  ['sentadilla goblet', 'sentadilla-goblet'],
  ['sentadilla con barra', 'sentadilla-barra'],
  ['sentadillas', 'sentadilla'],
  ['sentadilla', 'sentadilla'],
  ['prensa', 'prensa'],
  ['sillon de cuadriceps', 'extension-cuadriceps'],
  ['sillon cuadriceps', 'extension-cuadriceps'],
  ['extension de cuadriceps', 'extension-cuadriceps'],
  ['extensiones de cuadriceps', 'extension-cuadriceps'],
  ['camilla femoral', 'curl-femoral'],
  ['camilla de isquios', 'curl-femoral'],
  ['curl femoral', 'curl-femoral'],
  ['isquiotibiales', 'curl-femoral'],
  ['peso muerto rumano', 'peso-muerto-rumano-mancuernas'],
  ['peso muerto', 'peso-muerto-barra'],
  ['hip thrust', 'hip-thrust'],
  ['puente de gluteos', 'puente-gluteo'],
  ['estocadas', 'zancada-atras'],
  ['estocada', 'zancada-atras'],
  ['zancadas', 'zancada-atras'],
  ['subida al banco', 'subida-banco'],
  ['step', 'subida-banco'],
  ['gemelos', 'elevacion-talones'],
  ['pantorrillas', 'elevacion-talones'],
  ['dominadas', 'dominada'],
  ['dominada', 'dominada'],
  ['jalon al pecho', 'jalon-polea'],
  ['jalon', 'jalon-polea'],
  ['polea al pecho', 'jalon-polea'],
  ['remo con mancuerna', 'remo-mancuerna'],
  ['serrucho', 'remo-mancuerna'],
  ['remo bajo', 'remo-polea'],
  ['remo en polea', 'remo-polea'],
  ['remo sentado', 'remo-polea'],
  ['remo invertido', 'remo-invertido'],
  ['remo', 'remo-mancuerna'],
  ['curl de biceps', 'curl-biceps'],
  ['curl biceps', 'curl-biceps'],
  ['biceps', 'curl-biceps'],
  ['extension de triceps', 'extension-triceps'],
  ['triceps', 'extension-triceps'],
  ['fondos', 'fondos'],
  ['paralelas', 'fondos'],
  ['flexiones de brazos', 'flexion'],
  ['flexiones', 'flexion'],
  ['lagartijas', 'flexion'],
  ['abdominales', 'crunch'],
  ['crunch', 'crunch'],
  ['abdomen', 'crunch'],
  ['plancha lateral', 'plancha-lateral'],
  ['plancha', 'plancha'],
  ['bird dog', 'bird-dog'],
  ['dead bug', 'dead-bug'],
  ['granjero', 'caminata-granjero'],
  ['swing', 'swing-kettlebell'],
  ['kettlebell', 'swing-kettlebell'],
  ['caminata', 'caminata-rapida'],
  ['caminar', 'caminata-rapida'],
  ['cinta', 'caminata-rapida'],
  ['trote', 'trote-suave'],
  ['correr', 'trote-suave'],
  ['running', 'trote-suave'],
  ['soga', 'soga'],
  ['comba', 'soga'],
  ['sombra', 'sombra'],
  ['juego de pies', 'juego-pies'],
  ['muay thai', 'clase-golpes'],
  ['kickboxing', 'clase-golpes'],
  ['kick boxing', 'clase-golpes'],
  ['boxeo', 'clase-golpes'],
  ['bjj', 'clase-agarre'],
  ['jiu jitsu', 'clase-agarre'],
  ['judo', 'clase-agarre'],
  ['lucha', 'clase-agarre'],
  ['movilidad de tobillo', 'movilidad-tobillo'],
  ['gato camello', 'gato-camello'],
  ['estiramientos', 'estiramiento-flexor-cadera'],
  ['elongacion', 'estiramiento-flexor-cadera'],
].map(([a, b]) => [normalizar(a), b] as [string, string])

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

/** Si el texto nombra el implemento ("con barra", "con mancuernas", "con banda"…), elige esa variante. */
function conImplemento(e: Ejercicio | undefined, t: string): Ejercicio | undefined {
  if (!e?.familia) return e
  const pide = [
    ['barra', 'Barra'],
    ['mancuerna', 'Mancuernas'],
    ['mancuernas', 'Mancuernas'],
    ['banda', 'Banda'],
    ['elastico', 'Banda'],
    ['liga', 'Banda'],
    ['maquina', 'Máquina'],
    ['polea', 'Polea'],
  ].find(([w]) => t.includes(` ${w} `))?.[1]
  return (pide && variantesDe(e.id).find((v) => implemento(v) === pide)) || e
}

/** Busca el ejercicio de la biblioteca que corresponde a un nombre escrito a mano. */
export function reconocer(texto: string): Ejercicio | undefined {
  const t = ` ${normalizar(texto)} `
  let mejor: [string, string] | undefined
  for (const a of ALIAS) if (t.includes(` ${a[0]} `) && (!mejor || a[0].length > mejor[0].length)) mejor = a
  if (mejor) return conImplemento(ejercicio(mejor[1]), t)
  // Si no hay alias, nombre de la biblioteca contenido en el texto (o al revés).
  const n = normalizar(texto)
  return EJERCICIOS.find((e) => {
    const nombre = normalizar(e.nombre)
    return n.length >= 5 && (nombre.includes(n) || n.includes(nombre))
  })
}

export interface ItemRutina {
  id: string
  series?: number
  rango?: [number, number]
}

export interface DiaRutina {
  dia: number
  /** Número de entrenamiento dentro del día (0 = el primero). Permite más de uno por día. */
  turno?: number
  desde?: string
  lugar?: string
  items: ItemRutina[]
}

export interface LecturaTexto {
  dias: DiaRutina[]
  noReconocidas: { dia: number; texto: string }[]
}

const SERIES = /(\d{1,2})\s*(?:x|×|\*|por)\s*(\d{1,3})(?:\s*(?:-|a|\/)\s*(\d{1,3}))?/i
const MINUTOS = /(\d{1,3})\s*(?:min(?:utos?)?|'|m\b)/i
const HORA = /\b(\d{1,2})(?::|\.|h)(\d{2})?\s*(?:h|hs)?\b/i

/** Lee una rutina escrita a mano. Si no dice días, todo va al lunes. "Día 1", "Día 2"… se ubican lunes, martes… */
export function leerTexto(texto: string): LecturaTexto {
  const dias = new Map<number, DiaRutina>()
  const noReconocidas: LecturaTexto['noReconocidas'] = []
  let actual = 0
  const dia = (d: number) => {
    if (!dias.has(d)) dias.set(d, { dia: d, items: [] })
    return dias.get(d)!
  }
  for (const cruda of texto.split(/\r?\n/)) {
    let linea = cruda.replace(/^[\s\-•*·\d.)]+(?=[a-záéíóúñ])/i, '').trim()
    if (!linea) continue
    const n = normalizar(linea)
    const d = DIAS.findIndex((x) => n.startsWith(x))
    const diaN = n.match(/^dia\s*(\d)/)
    if (d >= 0 || diaN) {
      actual = d >= 0 ? d : Math.min(6, Math.max(0, Number(diaN![1]) - 1))
      const r = dia(actual)
      const h = linea.match(HORA)
      if (h && Number(h[1]) < 24) r.desde = `${h[1].padStart(2, '0')}:${h[2] ?? '00'}`
      // Lo que sigue al día (después de ":" o "-") puede traer ejercicios: "Viernes: dominadas 3x6, peso muerto 3x5".
      const resto = linea.split(/[:\-–]/).slice(1).join(':')
      if (!resto.trim() || HORA.test(resto) && !SERIES.test(resto) && !reconocer(resto)) continue
      linea = resto
    }
    for (const parte of linea.split(/[,;+]/)) {
      const p = parte.trim()
      if (!p) continue
      const e = reconocer(p.replace(SERIES, ' ').replace(MINUTOS, ' '))
      if (!e) {
        if (/[a-záéíóúñ]{3}/i.test(p)) noReconocidas.push({ dia: actual, texto: p })
        continue
      }
      const s = p.match(SERIES)
      const m = p.match(MINUTOS)
      const item: ItemRutina = { id: e.id }
      if (e.tipo === 'minutos') {
        const min = m ? Number(m[1]) : s ? Number(s[2]) : undefined
        if (min) item.rango = [min, min]
      } else if (s) {
        item.series = Number(s[1])
        const a = Number(s[2])
        const b = s[3] ? Number(s[3]) : a
        item.rango = [Math.min(a, b), Math.max(a, b)]
      }
      dia(actual).items.push(item)
    }
  }
  return { dias: [...dias.values()].filter((x) => x.items.length).sort((a, b) => a.dia - b.dia), noReconocidas }
}

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Arma el plan de la semana con lo elegido: una sesión por día (fuerza, cardio o movilidad según lo que tenga). */
export function armarPlanPropio(dias: DiaRutina[], creado = new Date().toISOString()): PlanSemana {
  const plan: PlanSemana = { creado, editado: true, dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) }
  for (const d of dias) {
    const ejercicios: EjercicioPlan[] = []
    for (const it of d.items) {
      const e = ejercicio(it.id)
      if (!e) continue
      const x = nuevoEjercicioPlan(e)
      if (it.series) x.series = Math.max(1, Math.min(10, it.series))
      if (it.rango) x.rango = it.rango
      ejercicios.push(x)
    }
    if (!ejercicios.length) continue
    const fuerza = ejercicios.filter((x) => x.rol !== 'cardio' && x.rol !== 'movilidad')
    const cardio = ejercicios.filter((x) => x.rol === 'cardio')
    // Primero la fuerza, después el cardio y al final la movilidad.
    const orden = [...fuerza, ...cardio, ...ejercicios.filter((x) => x.rol === 'movilidad')]
    const minCardio = cardio.reduce((a, x) => a + x.rango[0] * Math.max(1, x.series), 0)
    const tipo: SesionPlan['tipo'] = fuerza.length ? 'fuerza' : cardio.length ? 'cardio' : 'movilidad'
    if (tipo === 'fuerza') agrupar(orden, 'clasico', false)
    const minutos = tipo === 'fuerza' ? estimarMinutos(orden.filter((x) => x.rol !== 'cardio')) + minCardio : tipo === 'cardio' ? minCardio : Math.max(5, orden.length * 2)
    const vigoroso = cardio.some((x) => ['soga', 'trote-suave', 'clase-golpes', 'clase-agarre'].includes(x.id))
    const combate = cardio.some((x) => ejercicio(x.id)?.combate)
    plan.dias[d.dia].sesiones.push({
      id: `propia-${d.dia}-${d.turno ?? 0}`,
      tipo,
      titulo: tipo === 'fuerza' ? 'Mi rutina · fuerza' : combate ? 'Mi rutina · combate' : tipo === 'cardio' ? 'Mi rutina · cardio' : 'Mi rutina · movilidad',
      lugar: d.lugar,
      desde: d.desde,
      hasta: d.desde ? aHora(aMin(d.desde) + minutos) : undefined,
      minutos,
      intensidad: tipo === 'fuerza' || vigoroso ? 'fuerte' : 'suave',
      metodo: 'clasico',
      ejercicios: orden,
    })
    plan.dias[d.dia].sesiones.sort((a, b) => (a.desde ?? '99').localeCompare(b.desde ?? '99'))
  }
  return plan
}

/** Pasa un plan a la selección por días (para editar el plan actual con el armador). */
export function seleccionDesdePlan(plan: PlanSemana): DiaRutina[] {
  // Cada entrenamiento del día es un turno; las movilidades opcionales de los días libres no se cargan.
  return plan.dias.flatMap((d, i) =>
    d.sesiones
      .filter((s) => !s.titulo.includes('opcional') && s.ejercicios.length)
      .map((s, turno) => ({
        dia: i,
        turno,
        desde: s.desde,
        lugar: s.lugar && s.lugar !== 'Afuera' ? s.lugar : undefined,
        items: s.ejercicios.map((x) => ({ id: x.id, series: x.series, rango: x.rango })),
      })),
  )
}
