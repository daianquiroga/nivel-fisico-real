/* Orden de los ejercicios dentro de una sesión y cómo encadenarlos.
   Fuentes:
   - Simão R y otros 2012, "Exercise order in resistance training", Sports Med 42(3):251-265: el ejercicio que va primero
     rinde más repeticiones en varias series, sea grande o chico. Nunes JP y otros 2021 (Eur J Sport Sci 21(2):149-157):
     a largo plazo el orden casi no cambia la fuerza total; por eso se recomienda poner primero lo que más importa.
   - Eddens L y otros 2018, Sports Med 48(1):177-188: fuerza antes que resistencia en la misma sesión dio algo más de fuerza
     de piernas (6,9 %).
   - Behm DG y otros 2016, Appl Physiol Nutr Metab 41(1):1-11: estirar quieto 60 s o más por músculo justo antes resta un poco
     de rendimiento (−4,6 %); la movilidad en movimiento antes de entrenar suma un poco.
   - Potencia y técnica sin cansancio: recomendación usual de entrenamiento (NSCA); el orden exacto de las fases es decisión de diseño. */
import { ejercicio } from '../ejercicios'

export type Fase = 'calor' | 'tecnica' | 'potencia' | 'principal' | 'accesorio' | 'core' | 'cardio' | 'vuelta'

export const FASES: Record<Fase, { nombre: string; porque: string }> = {
  calor: { nombre: 'Entrada en calor', porque: 'Movilidad en movimiento: prepara las articulaciones y no te quita fuerza.' },
  tecnica: { nombre: 'Técnica', porque: 'Con la cabeza fresca: la técnica se aprende mejor sin cansancio.' },
  potencia: { nombre: 'Potencia', porque: 'Antes del cansancio: si saltás cansado, el salto baja y deja de ser potencia.' },
  principal: { nombre: 'Ejercicios grandes', porque: 'Lo que va primero rinde más: poné primero el que más te importa (Simão 2012).' },
  accesorio: { nombre: 'Ejercicios chicos', porque: 'Los de un solo músculo, después de los grandes.' },
  core: { nombre: 'Zona media', porque: 'Al final de la fuerza: si la cansás antes, te falta firmeza en los ejercicios grandes.' },
  cardio: { nombre: 'Cardio', porque: 'Después de la fuerza: así la fuerza de piernas progresa un poco más (Eddens 2018).' },
  vuelta: { nombre: 'Estiramientos quietos', porque: 'Al final: estirar quieto un minuto o más justo antes de saltar o levantar resta un poco de fuerza (Behm 2016).' },
}

const ORDEN: Fase[] = ['calor', 'tecnica', 'potencia', 'principal', 'accesorio', 'core', 'cardio', 'vuelta']
const ESTATICOS = new Set(['aductores-mariposa'])

/** En qué parte de la sesión va cada ejercicio. */
export function faseDe(id: string): Fase {
  const e = ejercicio(id)
  if (!e) return 'principal'
  if (e.combate) return 'tecnica'
  if (e.patron === 'potencia') return 'potencia'
  if (e.patron === 'movilidad') return id.startsWith('estiramiento') || ESTATICOS.has(id) ? 'vuelta' : 'calor'
  if (e.patron === 'cardio') return 'cardio'
  if (e.patron === 'core' || e.patron === 'transporte') return 'core'
  if (e.patron === 'accesorio') return 'accesorio'
  return 'principal'
}

const rango = (id: string) => ORDEN.indexOf(faseDe(id))

/** Orden recomendado: por fases y, dentro de cada fase, en el orden que eligió la persona. */
export function ordenRecomendado<T extends { id: string }>(xs: T[]): T[] {
  return xs
    .map((x, i) => [x, i] as const)
    .sort((a, b) => rango(a[0].id) - rango(b[0].id) || a[1] - b[1])
    .map(([x]) => x)
}

export interface ProblemaOrden {
  /** El ejercicio que conviene subir. */
  id: string
  /** El que está antes y debería ir después. */
  antesDe: string
  texto: string
}

/** Qué está fuera de lugar. La movilidad en movimiento puede ir al principio o al final (como vuelta a la calma), así que no se marca. */
export function revisarOrden(xs: { id: string }[]): ProblemaOrden[] {
  const out: ProblemaOrden[] = []
  const vistos = new Set<string>()
  for (let j = 0; j < xs.length; j++) {
    const fj = faseDe(xs[j].id)
    if (fj === 'calor') continue
    const i = xs.findIndex((x, k) => k < j && faseDe(x.id) !== 'calor' && rango(x.id) > rango(xs[j].id))
    if (i < 0 || vistos.has(xs[j].id)) continue
    vistos.add(xs[j].id)
    const a = ejercicio(xs[i].id)?.nombre ?? xs[i].id
    const b = ejercicio(xs[j].id)?.nombre ?? xs[j].id
    out.push({ id: xs[j].id, antesDe: xs[i].id, texto: `"${b}" conviene antes que "${a}". ${FASES[fj].porque}` })
  }
  return out
}

/** Fases que aparecen en la sesión, en el orden recomendado, con el porqué. */
export function fasesDe(xs: { id: string }[]): { fase: Fase; nombre: string; porque: string; ejercicios: string[] }[] {
  return ORDEN.map((fase) => ({ fase, ...FASES[fase], ejercicios: xs.filter((x) => faseDe(x.id) === fase).map((x) => x.id) })).filter((f) => f.ejercicios.length)
}

/** Cómo pasar de un ejercicio a otro (decisión de diseño). */
export const COMO_ENCADENAR = [
  'Hacé todas las series de un ejercicio, con su pausa, y recién ahí pasá al siguiente (salvo que tengan la misma letra: esos van juntos).',
  'Al cambiar de parte (por ejemplo, de potencia a ejercicios grandes), tomá 1 o 2 minutos: agua y preparar lo que sigue.',
  'Si un día tenés poco tiempo, sacá ejercicios del final, no los del principio.',
]
