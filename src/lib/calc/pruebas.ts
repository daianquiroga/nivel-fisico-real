/* Percentiles de las pruebas de fuerza, movilidad y equilibrio. Tablas en src/content/normas/,
   métodos en EVALUACION.md (secciones 4 a 6 y 8). */
import equilibrio from '../../content/normas/equilibrio.json'
import flexiones from '../../content/normas/flexiones.json'
import plancha from '../../content/normas/plancha.json'
import rodilla from '../../content/normas/rodilla-pared.json'
import sentarse from '../../content/normas/sentarse-pararse.json'
import type { Sexo } from './cardio'
import { limitar, normalAcumulada, percentilDesdeCategorias, percentilDesdePuntos } from './percentiles'

export interface ResultadoPercentil {
  percentil: number
  /** Aviso cuando la referencia no corresponde exactamente a la persona. */
  nota?: string
}

function grupoPorEdad<T extends { desde: number; hasta: number }>(grupos: T[], edad: number): { grupo: T; fuera: boolean } {
  const exacto = grupos.find((g) => edad >= g.desde && edad <= g.hasta)
  if (exacto) return { grupo: exacto, fuera: false }
  return { grupo: edad < grupos[0].desde ? grupos[0] : grupos[grupos.length - 1], fuera: true }
}

/** Sentarse y pararse en 1 minuto (Strassmann 2013). */
export function percentilSentarse(sexo: Sexo, edad: number, repeticiones: number): ResultadoPercentil {
  const { grupo, fuera } = grupoPorEdad(sentarse.grupos, edad)
  const puntos = sentarse.percentiles.map((p, i) => ({ p, v: grupo[sexo][i] }))
  return {
    percentil: percentilDesdePuntos(repeticiones, puntos),
    nota: fuera ? `Comparado con el grupo de ${grupo.desde} a ${grupo.hasta} años.` : undefined,
  }
}

/** Flexiones máximas (normas canadienses). */
export function percentilFlexiones(sexo: Sexo, edad: number, repeticiones: number): ResultadoPercentil | null {
  const grupos = flexiones[sexo]
  if (!grupos.length) return null
  const { grupo, fuera } = grupoPorEdad(grupos, edad)
  return {
    percentil: percentilDesdeCategorias(repeticiones, grupo.cortes as [number, number, number, number]),
    nota: fuera ? `Comparado con el grupo de ${grupo.desde} a ${grupo.hasta} años (falta la tabla de tu edad).` : undefined,
  }
}

/** Plancha: solo hay normas de 18 a 25 años; fuera de ese rango no se puntúa. */
export function percentilPlancha(sexo: Sexo, edad: number, segundos: number): ResultadoPercentil | null {
  if (edad < plancha.edadMin || edad > plancha.edadMax) return null
  const r = plancha[sexo]
  return {
    percentil: percentilDesdePuntos(segundos, [
      { p: 25, v: r.p25 },
      { p: 50, v: r.p50 },
      { p: 75, v: r.p75 },
    ]),
  }
}

/** Rodilla a la pared (promedio de las dos piernas), por edad y sexo (McBride y otros 2026). */
export function percentilRodillaPared(cm: number, sexo: Sexo = 'h', edad = 30): ResultadoPercentil {
  const { grupo, fuera } = grupoPorEdad(rodilla.grupos, edad)
  return {
    percentil: limitar(percentilDesdePuntos(cm, rodilla.percentiles.map((p, i) => ({ p, v: grupo[sexo][i] }))), 1, 99),
    nota: fuera ? `Comparado con el grupo de ${grupo.desde} a ${grupo.hasta} años.` : undefined,
  }
}

/** Equilibrio en un pie (Springer 2007). Menores de 60: ojos cerrados; desde 60: ojos abiertos.
    Los tiempos tienen distribución sesgada, así que se usa una normal sobre el logaritmo. */
export function percentilEquilibrio(edad: number, segundos: number, ojos: 'abiertos' | 'cerrados'): ResultadoPercentil {
  const { grupo } = grupoPorEdad(equilibrio.grupos, edad)
  const [media, desvio] = grupo[ojos]
  const sigma2 = Math.log(1 + (desvio * desvio) / (media * media))
  const mu = Math.log(media) - sigma2 / 2
  const x = limitar(segundos, 0.5, equilibrio.maximo)
  return { percentil: limitar(100 * normalAcumulada((Math.log(x) - mu) / Math.sqrt(sigma2)), 1, 99) }
}

export function ojosParaEquilibrio(edad: number): 'abiertos' | 'cerrados' {
  return edad < 60 ? 'cerrados' : 'abiertos'
}
