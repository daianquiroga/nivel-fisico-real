/* Cardio: VO2max estimado sin ejercicio, edad física y percentil.
   Fórmulas de Nes y colegas 2011 (estudio HUNT); promedios por edad de CERG NTNU / Loe 2013.
   Fuentes y enlaces en src/content/normas/vo2max-hunt.json y EVALUACION.md, sección 2. */
import normas from '../../content/normas/vo2max-hunt.json'
import { interpolar, limitar, percentilNormal } from './percentiles'

export type Sexo = 'h' | 'm'

/** Índice de actividad HUNT = frecuencia × intensidad × duración. */
export function indiceActividad(frecuencia: number, intensidad: number, duracion: number): number {
  return frecuencia * intensidad * duracion
}

/** VO2max estimado en ml/kg/min (cintura en cm, pulso en latidos por minuto). */
export function vo2maxEstimado(p: { sexo: Sexo; edad: number; cinturaCm: number; pulso: number; indice: number }): number {
  const f = normas.formula[p.sexo]
  return f.constante + f.edad * p.edad + f.cintura * p.cinturaCm + f.pulso * p.pulso + f.pa * p.indice
}

/** VO2max promedio de la población para una edad (interpolando entre los puntos medios de cada década). */
export function vo2maxPromedio(sexo: Sexo, edad: number): number {
  const { edades } = normas.promedios
  return interpolar(edades, normas.promedios[sexo], limitar(edad, 20, 90))
}

/** Edad a la que el promedio de la población iguala el VO2max dado. Entre 20 y 85 años. */
export function edadFisica(sexo: Sexo, vo2: number): number {
  const edades = [...normas.promedios.edades].reverse()
  const valores = [...normas.promedios[sexo]].reverse()
  return limitar(interpolar(valores, edades, vo2), 20, 85)
}

export function percentilCardio(sexo: Sexo, edad: number, vo2: number): number {
  return percentilNormal(vo2, vo2maxPromedio(sexo, edad), normas.desvioPoblacion)
}
