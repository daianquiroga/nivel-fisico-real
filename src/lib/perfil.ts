/* Datos del primer inicio: opciones, valores por defecto y guardado. */
import { db, type Lugar, type Perfil } from './db/db'

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
  { valor: 'bolsa', texto: 'Bolsa de boxeo' },
  { valor: 'banco', texto: 'Banco' },
  { valor: 'silla', texto: 'Silla firme' },
  { valor: 'colchoneta', texto: 'Colchoneta' },
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
  lugar: string
  huecos: Hueco[]
}

export interface Semana {
  /** Tipo de día de lunes (0) a domingo (6). */
  dias: TipoDia[]
  tipos: Record<TipoDia, DiaTipo>
}

export const NOMBRES_TIPO_DIA: Record<TipoDia, string> = {
  laboral: 'Días de semana',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export function semanaPorDefecto(lugar = 'Casa'): Semana {
  const dia = (despertar: string, dormir: string, huecos: Hueco[]): DiaTipo => ({ despertar, dormir, lugar, huecos })
  return {
    dias: ['laboral', 'laboral', 'laboral', 'laboral', 'laboral', 'sabado', 'domingo'],
    tipos: {
      laboral: dia('07:00', '23:30', [{ desde: '20:00', hasta: '21:00' }]),
      sabado: dia('08:30', '00:00', [{ desde: '10:00', hasta: '11:00' }]),
      domingo: dia('09:00', '23:30', []),
    },
  }
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
  return { perfil, lugares, semana: ajusteSemana?.valor as Semana | undefined }
}

export async function guardarInicio(perfil: Perfil, lugares: Lugar[], semana: Semana): Promise<void> {
  await db.transaction('rw', [db.perfil, db.lugares, db.ajustes], async () => {
    await db.perfil.put({ ...perfil, actualizado: new Date().toISOString() })
    await db.lugares.clear()
    await db.lugares.bulkAdd(lugares.map(({ id: _id, ...resto }) => resto))
    await db.ajustes.put({ clave: 'semana', valor: semana })
  })
}
