/* Poder de pelea (ESPECIFICACION.md, sección 14). Escala propia de la app, no un estándar publicado:
   poder = 10 × factor físico × técnica × peso
   - factor físico = e^(0,35 × z promedio), con z sacado del percentil de cada área de la evaluación;
   - técnica = experiencia (1,0 a 3,8, reducida si nunca hizo sparring) × ajuste por nivel de sombra y pies (0,8 a 1,2);
   - peso = (peso / 75)^0,33.
   Con esto, una persona promedio sin entrenamiento de combate da 10 y un campeón del mundo, alrededor de 100. */

/** Inversa de la normal estándar (aproximación de Acklam, error menor a 1,2 × 10⁻⁹). */
export function zDePercentil(percentil: number): number {
  const p = Math.min(0.99, Math.max(0.01, percentil / 100))
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const bajo = 0.02425
  if (p < bajo) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - bajo) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** Niveles de experiencia en combate: factor técnico (1,0 a 3,8) y técnica de 0 a 100 para el simulador (decisión de diseño). */
export const EXPERIENCIAS = [
  { valor: 'ninguna', texto: 'Nunca entrené', factor: 1.0, tecnica: 10 },
  { valor: 'meses', texto: 'Menos de 6 meses', factor: 1.3, tecnica: 25 },
  { valor: 'anio', texto: '6 a 12 meses', factor: 1.6, tecnica: 35 },
  { valor: 'anios', texto: '1 a 3 años', factor: 2.1, tecnica: 50 },
  { valor: 'muchos', texto: '3 a 5 años', factor: 2.6, tecnica: 62 },
  { valor: 'veterano', texto: 'Más de 5 años', factor: 3.0, tecnica: 72 },
  { valor: 'amateur', texto: 'Compito como amateur', factor: 3.3, tecnica: 82 },
  { valor: 'pro', texto: 'Profesional', factor: 3.8, tecnica: 95 },
] as const

export type Experiencia = (typeof EXPERIENCIAS)[number]['valor']
export const experiencia = (v: string) => EXPERIENCIAS.find((e) => e.valor === v) ?? EXPERIENCIAS[0]

/** Sin sparring, la experiencia vale el 60 % de lo que pasa de 1 (decisión de diseño). */
export function factorExperiencia(v: string, sparring: boolean): number {
  const f = experiencia(v).factor
  return sparring ? f : 1 + (f - 1) * 0.6
}

/** Ajuste de 0,8 a 1,2 por los niveles de sombra (de 5) y de pies (de 6). Si nunca entrenó, no se aplica (1,0). */
export function ajusteNiveles(nivelSombra: number, nivelPies: number, entrena: boolean): number {
  if (!entrena) return 1
  const avance = (Math.min(5, nivelSombra) / 5 + Math.min(6, nivelPies) / 6) / 2
  return 0.8 + 0.4 * avance
}

export const factorPeso = (kg: number) => Math.pow(kg / 75, 0.33)

export const factorFisico = (percentiles: number[]) =>
  percentiles.length ? Math.exp(0.35 * (percentiles.reduce((a, p) => a + zDePercentil(p), 0) / percentiles.length)) : 1

export interface EntradaPoder {
  percentiles: number[]
  /** La mayor experiencia entre golpes y agarre. */
  experiencia: string
  sparring: boolean
  nivelSombra: number
  nivelPies: number
  pesoKg: number
}

export interface Poder {
  poder: number
  fisico: number
  tecnica: number
  peso: number
}

export function poderDePelea(e: EntradaPoder): Poder {
  const fisico = factorFisico(e.percentiles)
  const tecnica = factorExperiencia(e.experiencia, e.sparring) * ajusteNiveles(e.nivelSombra, e.nivelPies, e.experiencia !== 'ninguna' || e.nivelSombra + e.nivelPies > 0)
  const peso = factorPeso(e.pesoKg)
  return { poder: Math.round(10 * fisico * tecnica * peso), fisico, tecnica, peso }
}

/** Experiencia más alta de dos (para el poder de pelea se toma la mejor). */
export function mejorExperiencia(a: string, b: string): string {
  const i = (v: string) => EXPERIENCIAS.findIndex((x) => x.valor === v)
  return i(a) >= i(b) ? a : b
}
