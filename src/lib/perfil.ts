/* Datos del primer inicio: opciones, valores por defecto y guardado. */
import { db, type Lugar, type MetodoSeries, type Perfil, type TipoLugar } from './db/db'

export type Objetivos = { estetica: number; condicion: number; combate: number }
export type ClaveObjetivo = keyof Objetivos

export const OBJETIVOS: { clave: ClaveObjetivo; nombre: string; detalle: string; color: string }[] = [
  { clave: 'estetica', nombre: 'Verme mejor', detalle: 'Estética: grasa, músculo, postura', color: 'var(--accent)' },
  { clave: 'condicion', nombre: 'Estar en forma', detalle: 'Condición física y salud', color: 'var(--done)' },
  { clave: 'combate', nombre: 'Saber defenderme', detalle: 'Técnica y poder de pelea', color: 'var(--soft)' },
]

const ORDEN: ClaveObjetivo[] = ['estetica', 'condicion', 'combate']

/** Suma o resta 10 puntos a un objetivo manteniendo el total en 100.
    Al sumar, se descuenta del objetivo con más puntos; al restar, se le da al siguiente. */
export function ajustarObjetivos(o: Objetivos, clave: ClaveObjetivo, delta: 10 | -10): Objetivos {
  const nuevo = { ...o }
  const otros = ORDEN.filter((k) => k !== clave)
  if (delta > 0) {
    if (nuevo[clave] >= 100) return o
    const donante = otros.sort((a, b) => nuevo[b] - nuevo[a])[0]
    if (nuevo[donante] < 10) return o
    nuevo[clave] += 10
    nuevo[donante] -= 10
  } else {
    if (nuevo[clave] < 10) return o
    const receptor = ORDEN[(ORDEN.indexOf(clave) + 1) % ORDEN.length]
    nuevo[clave] -= 10
    nuevo[receptor] += 10
  }
  return nuevo
}

export const ZONAS = [
  { valor: 'panza', texto: 'Panza' },
  { valor: 'postura', texto: 'Postura' },
  { valor: 'espalda', texto: 'Espalda' },
  { valor: 'brazos', texto: 'Brazos' },
  { valor: 'pecho', texto: 'Pecho' },
  { valor: 'piernas', texto: 'Piernas' },
  { valor: 'gluteos', texto: 'Glúteos' },
  { valor: 'definicion', texto: 'Definición general' },
]

export const EQUIPO = [
  { valor: 'bandas', texto: 'Bandas elásticas' },
  { valor: 'anclaje', texto: 'Anclaje de puerta para bandas' },
  { valor: 'mancuernas', texto: 'Mancuernas o discos' },
  { valor: 'barra-dominadas', texto: 'Barra de dominadas' },
  { valor: 'kettlebell', texto: 'Kettlebell (pesa rusa)' },
  { valor: 'soga', texto: 'Soga' },
  { valor: 'pelota', texto: 'Pelota medicinal (sin rebote)' },
  { valor: 'bolsa', texto: 'Bolsa de boxeo' },
  { valor: 'banco', texto: 'Banco' },
  { valor: 'silla', texto: 'Silla firme' },
  { valor: 'colchoneta', texto: 'Colchoneta' },
]

export const EQUIPO_AIRE_LIBRE = [
  { valor: 'barras-plaza', texto: 'Barras de plaza' },
  { valor: 'paralelas', texto: 'Paralelas' },
  { valor: 'escaleras', texto: 'Escaleras' },
  { valor: 'banco', texto: 'Banco' },
  { valor: 'pista', texto: 'Lugar para correr' },
  { valor: 'bandas', texto: 'Llevo bandas' },
  { valor: 'soga', texto: 'Llevo soga' },
]

export const TIPOS_LUGAR: { valor: TipoLugar; texto: string }[] = [
  { valor: 'casa', texto: 'Casa' },
  { valor: 'gimnasio', texto: 'Gimnasio' },
  { valor: 'aire-libre', texto: 'Aire libre' },
]

export const PREFERENCIAS_GYM: { valor: string; texto: string; consejo: string }[] = [
  {
    valor: 'maquinas',
    texto: 'Máquinas',
    consejo: 'Fáciles de aprender y seguras para empezar: el recorrido ya viene guiado. Contra: dependés de que estén libres y no entrenan tanto el equilibrio.',
  },
  {
    valor: 'barra',
    texto: 'Barra y discos',
    consejo: 'La mejor herramienta para ganar fuerza en sentadilla, peso muerto y press. Pide aprender bien la técnica: los primeros meses, cargas cómodas.',
  },
  {
    valor: 'mancuernas',
    texto: 'Mancuernas',
    consejo: 'Trabajan cada lado por separado y corrigen diferencias entre brazos o piernas. Permiten agarres con la muñeca recta, buenos si te molesta la muñeca.',
  },
  {
    valor: 'poleas',
    texto: 'Poleas',
    consejo: 'Tensión pareja en todo el recorrido y mucha variedad de ángulos. Buenas para trabajar músculos puntuales y para la postura (por ejemplo, tirones a la cara).',
  },
  {
    valor: 'peso-corporal',
    texto: 'Peso corporal',
    consejo: 'Dominadas, fondos y similares: lo que aprendas te sirve en cualquier lado, incluso en casa.',
  },
]

export const METODOS_SERIES: { valor: MetodoSeries; texto: string; consejo: string }[] = [
  {
    valor: 'clasico',
    texto: 'Clásico con pausa',
    consejo: 'Una serie, descanso y otra serie del mismo ejercicio. Lo mejor para ganar fuerza: en ejercicios pesados conviene descansar 2 a 3 minutos.',
  },
  {
    valor: 'superseries',
    texto: 'Superseries',
    consejo: 'Dos ejercicios seguidos de músculos distintos (por ejemplo, empuje y tirón) y después la pausa. Ahorrás tiempo casi sin perder rendimiento.',
  },
  {
    valor: 'circuito',
    texto: 'Circuito',
    consejo: 'Varios ejercicios seguidos con poca pausa. Más cardio y menos tiempo, pero se levanta menos peso. Bueno para días con poco tiempo.',
  },
  {
    valor: 'app',
    texto: 'Que decida la app',
    consejo: 'La app elige según el día: clásico en los ejercicios pesados, superseries en los accesorios y circuito si tenés poco tiempo.',
  },
]

export const ESPACIOS = [
  { valor: '1x1' as const, texto: '1 × 1 m' },
  { valor: '2x2' as const, texto: '2 × 2 m' },
  { valor: 'amplio' as const, texto: 'Más amplio' },
]

export const LIMITACIONES = [
  { valor: 'muneca', texto: 'Muñeca' },
  { valor: 'rodilla', texto: 'Rodilla' },
  { valor: 'hombro', texto: 'Hombro' },
  { valor: 'espalda-baja', texto: 'Espalda baja' },
  { valor: 'cuello', texto: 'Cuello' },
  { valor: 'tobillo', texto: 'Tobillo' },
]

export const PREGUNTAS_SALUD = [
  '¿Algún médico te dijo que tenés un problema de corazón o presión alta?',
  '¿Sentís dolor en el pecho al hacer esfuerzo o en reposo?',
  '¿Te mareaste o perdiste el conocimiento en el último año?',
  '¿Tenés algún problema de huesos o articulaciones que empeora con el ejercicio?',
  '¿Tomás medicación para el corazón o la presión?',
]

export type TipoDia = 'laboral' | 'sabado' | 'domingo'

export interface Hueco {
  desde: string
  hasta: string
}

export interface DiaTipo {
  despertar: string
  dormir: string
  /** Obsoleto desde la versión 0.3: ahora se usa Semana.lugaresPorDia. */
  lugar?: string
  huecos: Hueco[]
}

export interface Semana {
  /** Tipo de día de lunes (0) a domingo (6). */
  dias: TipoDia[]
  tipos: Record<TipoDia, DiaTipo>
  /** Dónde entrena cada día, de lunes (0) a domingo (6). Lista vacía = descanso. Puede haber más de un lugar. */
  lugaresPorDia: string[][]
  /** Horarios propios de cada día (lunes 0 a domingo 6). Si un día tiene horarios acá, se usan en vez de los de su tipo. */
  huecosPorDia?: Hueco[][]
}

/** Horarios libres para entrenar de un día: los propios del día o, si no tiene, los de su tipo (días de semana, sábado, domingo). */
export function huecosDelDia(semana: Semana, d: number): Hueco[] {
  const propios = semana.huecosPorDia?.[d]
  return propios && propios.length ? propios : (semana.tipos[semana.dias[d]]?.huecos ?? [])
}

export const NOMBRES_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const NOMBRES_TIPO_DIA: Record<TipoDia, string> = {
  laboral: 'Días de semana',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export function semanaPorDefecto(lugar = 'Casa'): Semana {
  const dia = (despertar: string, dormir: string, huecos: Hueco[]): DiaTipo => ({ despertar, dormir, huecos })
  return {
    dias: ['laboral', 'laboral', 'laboral', 'laboral', 'laboral', 'sabado', 'domingo'],
    tipos: {
      laboral: dia('07:00', '23:30', [{ desde: '20:00', hasta: '21:00' }]),
      sabado: dia('08:30', '00:00', [{ desde: '10:00', hasta: '11:00' }]),
      domingo: dia('09:00', '23:30', []),
    },
    lugaresPorDia: [[lugar], [lugar], [lugar], [lugar], [lugar], [lugar], []],
  }
}

/** Ajusta la semana a los lugares actuales: completa datos viejos (sin lugaresPorDia),
    saca lugares borrados o renombrados y deja como máximo 2 lugares por día. */
export function normalizarSemana(semana: Semana, nombres: string[]): Semana {
  const validos = (xs: string[]) => [...new Set(xs.filter((x) => nombres.includes(x)))].slice(0, 2)
  let porDia = semana.lugaresPorDia
  if (!porDia || porDia.length !== 7) {
    porDia = semana.dias.map((t) => {
      const viejo = semana.tipos[t]?.lugar
      return viejo ? [viejo] : []
    })
  }
  return { ...semana, lugaresPorDia: porDia.map(validos) }
}

export function tipoDeLugar(l: Lugar): TipoLugar {
  return l.tipo ?? 'casa'
}

/** Índice de hoy con lunes = 0. */
export function diaDeHoy(fecha = new Date()): number {
  return (fecha.getDay() + 6) % 7
}

/** Horas disponibles para dormir entre la hora de acostarse y la de despertarse. */
export function horasDeSueno(dormir: string, despertar: string): number {
  const min = (h: string) => {
    const [a, b] = h.split(':').map(Number)
    return a * 60 + b
  }
  return (((min(despertar) - min(dormir)) % 1440) + 1440) % 1440 / 60
}

export async function cargarInicio(): Promise<{ perfil?: Perfil; lugares: Lugar[]; semana?: Semana }> {
  const [perfil, lugares, ajusteSemana] = await Promise.all([
    db.perfil.get('yo'),
    db.lugares.toArray(),
    db.ajustes.get('semana'),
  ])
  const guardada = ajusteSemana?.valor as Semana | undefined
  const semana = guardada ? normalizarSemana(guardada, lugares.map((l) => l.nombre)) : undefined
  return { perfil, lugares, semana }
}

export async function guardarInicio(perfil: Perfil, lugares: Lugar[], semana: Semana): Promise<void> {
  await db.transaction('rw', [db.perfil, db.lugares, db.ajustes], async () => {
    await db.perfil.put({ ...perfil, actualizado: new Date().toISOString() })
    await db.lugares.clear()
    await db.lugares.bulkAdd(lugares.map(({ id: _id, ...resto }) => resto))
    await db.ajustes.put({ clave: 'semana', valor: semana })
  })
}
