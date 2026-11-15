/* Composición corporal: relación cintura/altura (guía NICE, Ashwell) y % de grasa estimado
   con la fórmula RFM (Woolcott y Bergman 2018). Fuentes en src/content/normas/composicion.json. */
import normas from '../../content/normas/composicion.json'
import type { Sexo } from './cardio'
import { limitar } from './percentiles'

export function cinturaAltura(cinturaCm: number, alturaCm: number): number {
  return cinturaCm / alturaCm
}

export function zonaCinturaAltura(relacion: number): string {
  return normas.cinturaAltura.zonas.find((z) => relacion >= z.desde && relacion < z.hasta)?.nombre ?? 'Alta'
}

/** Porcentaje de grasa estimado (RFM). */
export function grasaRfm(sexo: Sexo, alturaCm: number, cinturaCm: number): number {
  return normas.rfm.constante[sexo] - normas.rfm.factor * (alturaCm / cinturaCm)
}

export function superaUmbralObesidad(sexo: Sexo, grasa: number): boolean {
  return grasa >= normas.rfm.umbralObesidad[sexo]
}

/** Puntaje de composición de 5 a 95, por zonas para no premiar la delgadez extrema (EVALUACION.md, sección 8).
    Es una decisión de diseño, no un estándar publicado. */
export function puntajeComposicion(sexo: Sexo, relacion: number, grasa: number): number {
  let p: number
  if (relacion < 0.4) p = 75
  else if (relacion < 0.5) p = 85
  else p = Math.max(10, 70 - ((relacion - 0.5) / 0.05) * 15)
  if (superaUmbralObesidad(sexo, grasa)) p -= 10
  return limitar(p, 5, 95)
}
