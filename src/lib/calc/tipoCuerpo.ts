/* Tipo de cuerpo con medidas caseras.
   - Linealidad (ectomorfia) del método Heath-Carter: solo necesita altura y peso (Carter 2002).
   - Contextura ósea por circunferencia de muñeca y altura (MedlinePlus).
   - La "tendencia" que combina linealidad y grasa estimada es una decisión de diseño de la app,
     NO el somatotipo completo de Heath-Carter (ese necesita pliegues de piel y diámetros óseos medidos con calibre).
   Fuentes en src/content/normas/tipo-cuerpo.json. */
import normas from '../../content/normas/tipo-cuerpo.json'
import type { Sexo } from './cardio'

export type Contextura = 'chica' | 'mediana' | 'grande'
export type Tendencia = 'lineal' | 'intermedia' | 'robusta' | 'redondeada'

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

/** Decisión de diseño (no es un estándar publicado): los extremos se marcan solo cuando se apartan bastante del medio.
    4 o más = lineal; grasa por encima del umbral = redondeada; menos de 1,5 = robusta; el resto, intermedia. */
export function tendencia(linealidadValor: number, grasaAlta: boolean): Tendencia {
  if (linealidadValor >= 4) return 'lineal'
  if (grasaAlta) return 'redondeada'
  if (linealidadValor < 1.5) return 'robusta'
  return 'intermedia'
}
