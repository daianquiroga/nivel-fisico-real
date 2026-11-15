/* Tipo de cuerpo con medidas caseras.
   - Linealidad (ectomorfia) del método Heath-Carter: solo necesita altura y peso (Carter 2002).
   - Contextura ósea por circunferencia de muñeca y altura (MedlinePlus).
   - La "tendencia" que combina linealidad y grasa estimada es una decisión de diseño de la app,
     NO el somatotipo completo de Heath-Carter (ese necesita pliegues de piel y diámetros óseos medidos con calibre).
   Fuentes en src/content/normas/tipo-cuerpo.json. */
import normas from '../../content/normas/tipo-cuerpo.json'
import type { Sexo } from './cardio'

export type Contextura = 'chica' | 'mediana' | 'grande'
/** Tipo dominante con nombres clásicos. 'mixto' = ningún componente domina con las medidas caseras. */
export type Tendencia = 'ectomorfo' | 'mesomorfo' | 'endomorfo' | 'mixto'

/** Evaluaciones guardadas con la versión 0.5.0 usaban otros nombres. */
export function tendenciaActual(t: string | undefined): Tendencia | undefined {
  const viejos: Record<string, Tendencia> = { lineal: 'ectomorfo', robusta: 'mesomorfo', redondeada: 'endomorfo', intermedia: 'mixto' }
  return (viejos[t ?? ''] ?? t) as Tendencia | undefined
}

/** HWR = altura / raíz cúbica del peso. */
export function indiceAlturaPeso(alturaCm: number, pesoKg: number): number {
  return alturaCm / Math.cbrt(pesoKg)
}

/** Ectomorfia (linealidad) de Heath-Carter. */
export function linealidad(alturaCm: number, pesoKg: number): number {
  const hwr = indiceAlturaPeso(alturaCm, pesoKg)
  const tramo = normas.linealidad.tramos.find((t) => hwr >= t.hwrDesde)
  const valor = tramo ? tramo.factor * hwr - tramo.resta : normas.linealidad.minimo
  return Math.max(normas.linealidad.minimo, valor)
}

export function nivelLinealidad(valor: number): string {
  return normas.linealidad.niveles.find((n) => valor < n.hasta)?.nombre ?? 'Muy alta'
}

export function contextura(sexo: Sexo, alturaCm: number, munecaCm: number): Contextura {
  const fila = normas.contextura[sexo].find((f) => alturaCm < f.alturaHasta) ?? normas.contextura[sexo][normas.contextura[sexo].length - 1]
  if (munecaCm < fila.chicaHasta) return 'chica'
  if (munecaCm <= fila.medianaHasta) return 'mediana'
  return 'grande'
}

/** Estimación casera del tipo dominante. Decisión de diseño (no es un estándar publicado):
    mucha linealidad (4 o más) = ectomorfo; grasa estimada por encima del umbral = endomorfo;
    muy poca linealidad (menos de 1,5: mucho peso para la altura) sin grasa alta = mesomorfo (el peso es músculo y hueso); el resto, mixto. */
export function tendencia(linealidadValor: number, grasaAlta: boolean): Tendencia {
  if (linealidadValor >= 4) return 'ectomorfo'
  if (grasaAlta) return 'endomorfo'
  if (linealidadValor < 1.5) return 'mesomorfo'
  return 'mixto'
}

/* ---- Somatotipo completo de Heath-Carter (con plicómetro, cinta y calibre) ---- */

/** Endomorfia corregida por altura. sumaPliegues = tríceps + subescapular + supraespinal (mm). */
export function endomorfia(sumaPlieguesMm: number, alturaCm: number): number {
  const x = sumaPlieguesMm * (170.18 / alturaCm)
  return Math.max(0.1, -0.7182 + 0.1451 * x - 0.00068 * x ** 2 + 0.0000014 * x ** 3)
}

export interface MedidasMesomorfia {
  alturaCm: number
  humeroCm: number
  femurCm: number
  brazoCm: number
  pantorrillaCm: number
  pliegueTricepsMm: number
  plieguePantorrillaMm: number
}

/** Mesomorfia: perímetros corregidos restando el pliegue (pasado a cm). */
export function mesomorfia(m: MedidasMesomorfia): number {
  const brazo = m.brazoCm - m.pliegueTricepsMm / 10
  const pantorrilla = m.pantorrillaCm - m.plieguePantorrillaMm / 10
  return Math.max(0.1, 0.858 * m.humeroCm + 0.601 * m.femurCm + 0.188 * brazo + 0.161 * pantorrilla - 0.131 * m.alturaCm + 4.5)
}

export type Componente = 'endo' | 'meso' | 'ecto'
const NOMBRE: Record<Componente, string> = { endo: 'endomorfo', meso: 'mesomorfo', ecto: 'ectomorfo' }
const ADJETIVO: Record<Componente, string> = { endo: 'endomórfico', meso: 'mesomórfico', ecto: 'ectomórfico' }

/** Categoría según Carter (2002): central si ningún componente se aparta más de 1 de los otros;
    dos componentes "iguales" si difieren 0,5 o menos. */
export function categoriaSomatotipo(endo: number, meso: number, ecto: number): { dominante: Componente | null; nombre: string; tipo: Tendencia } {
  const v: [Componente, number][] = [
    ['endo', endo],
    ['meso', meso],
    ['ecto', ecto],
  ]
  v.sort((a, b) => b[1] - a[1])
  const [[c1, v1], [c2, v2], [, v3]] = v
  const aTipo: Record<Componente, Tendencia> = { endo: 'endomorfo', meso: 'mesomorfo', ecto: 'ectomorfo' }
  if (v1 - v3 <= 1) return { dominante: null, nombre: 'Central', tipo: 'mixto' }
  if (v1 - v2 <= 0.5) return { dominante: c1, nombre: `${cap(NOMBRE[c1])}-${NOMBRE[c2]}`, tipo: aTipo[c1] }
  if (v2 - v3 <= 0.5) return { dominante: c1, nombre: `${cap(NOMBRE[c1])} balanceado`, tipo: aTipo[c1] }
  return { dominante: c1, nombre: `${cap(NOMBRE[c1])} ${ADJETIVO[c2]}`, tipo: aTipo[c1] }
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
