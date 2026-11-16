/* Evaluación: datos que carga el usuario y cálculo de todos los resultados (EVALUACION.md). */
import { edadFisica, indiceActividad, percentilCardio, vo2maxEstimado, vo2maxPromedio, type Sexo } from './calc/cardio'
import { cinturaAltura, grasaRfm, puntajeComposicion, superaUmbralObesidad, zonaCinturaAltura } from './calc/composicion'
import {
  ojosParaEquilibrio,
  percentilEquilibrio,
  percentilFlexiones,
  percentilPlancha,
  percentilRodillaPared,
  percentilSentarse,
  type ResultadoPercentil,
} from './calc/pruebas'
import { contextura, linealidad, nivelLinealidad, tendencia, type Contextura, type Tendencia } from './calc/tipoCuerpo'
import { calidadMovimiento, condicionFisica, habilidadMovimiento, type Area } from './calc/puntajes'

export type VarianteFlexion = 'completa' | 'rodillas' | 'punos'

export interface DatosEvaluacion {
  pulsos?: number[]
  alturaCm?: number
  cinturaCm?: number
  /** Opcionales, para el tipo de cuerpo. */
  pesoKg?: number
  munecaCm?: number
  actividad?: { frecuencia: number; intensidad: number; duracion: number }
  rodilla?: { izq: number; der: number }
  equilibrio?: { ojos: 'abiertos' | 'cerrados'; segundos: number }
  sentarse?: number
  flexiones?: { reps: number; variante: VarianteFlexion }
  plancha?: number
  /** 5 movimientos puntuados de 0 a 3 (null = no hecho). */
  calidad?: (number | null)[]
}

export type Prueba = 'cardio' | 'sentarse' | 'flexiones' | 'plancha' | 'rodilla' | 'equilibrio'

export interface Resultados {
  vo2?: number
  vo2Promedio?: number
  edadFisica?: number
  pulso?: number
  percentiles: Partial<Record<Prueba, ResultadoPercentil>>
  composicion?: { relacion: number; zona: string; grasa: number; obesidad: boolean; puntaje: number }
  areas: Partial<Record<Area, number>>
  condicion?: number
  parcial: boolean
  areasFaltantes: Area[]
  calidad?: number
  habilidad?: number
  diferenciaRodillas?: number
  tipoCuerpo?: { linealidad?: number; nivelLinealidad?: string; contextura?: Contextura; tendencia?: Tendencia; grasaAlta?: boolean }
}

const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export function calcularResultados(sexo: Sexo, edad: number, d: DatosEvaluacion): Resultados {
  const r: Resultados = { percentiles: {}, areas: {}, parcial: true, areasFaltantes: [] }
  const valores: Partial<Record<Area, number[]>> = {}
  const sumar = (area: Area, x: number) => (valores[area] = [...(valores[area] ?? []), x])

  const pulsos = (d.pulsos ?? []).filter((p) => p > 0)
  if (pulsos.length) r.pulso = Math.round(promedio(pulsos))

  if (r.pulso && d.cinturaCm && d.actividad) {
    const indice = indiceActividad(d.actividad.frecuencia, d.actividad.intensidad, d.actividad.duracion)
    r.vo2 = vo2maxEstimado({ sexo, edad, cinturaCm: d.cinturaCm, pulso: r.pulso, indice })
    r.vo2Promedio = vo2maxPromedio(sexo, edad)
    r.edadFisica = edadFisica(sexo, r.vo2)
    r.percentiles.cardio = { percentil: percentilCardio(sexo, edad, r.vo2) }
    sumar('cardio', r.percentiles.cardio.percentil)
  }

  if (d.cinturaCm && d.alturaCm) {
    const relacion = cinturaAltura(d.cinturaCm, d.alturaCm)
    const grasa = grasaRfm(sexo, d.alturaCm, d.cinturaCm)
    const puntaje = puntajeComposicion(sexo, relacion, grasa)
    r.composicion = { relacion, zona: zonaCinturaAltura(relacion), grasa, obesidad: superaUmbralObesidad(sexo, grasa), puntaje }
    sumar('composicion', puntaje)
  }

  if (d.alturaCm && (d.pesoKg || d.munecaCm)) {
    const t: NonNullable<Resultados['tipoCuerpo']> = { grasaAlta: r.composicion?.obesidad }
    if (d.pesoKg) {
      t.linealidad = linealidad(d.alturaCm, d.pesoKg)
      t.nivelLinealidad = nivelLinealidad(t.linealidad)
      t.tendencia = tendencia(t.linealidad, Boolean(r.composicion?.obesidad))
    }
    if (d.munecaCm) t.contextura = contextura(sexo, d.alturaCm, d.munecaCm)
    r.tipoCuerpo = t
  }

  if (d.sentarse !== undefined) {
    r.percentiles.sentarse = percentilSentarse(sexo, edad, d.sentarse)
    sumar('fuerza', r.percentiles.sentarse.percentil)
  }

  if (d.flexiones) {
    // Las tablas usan flexión completa en hombres y con rodillas en mujeres; en puños o mancuernas cuenta como completa.
    const variante = d.flexiones.variante === 'punos' ? 'completa' : d.flexiones.variante
    const esperada = sexo === 'h' ? 'completa' : 'rodillas'
    if (variante === esperada) {
      const p = percentilFlexiones(sexo, edad, d.flexiones.reps)
      if (p) {
        r.percentiles.flexiones = p
        sumar('fuerza', p.percentil)
      }
    } else {
      r.percentiles.flexiones = undefined
    }
  }

  if (d.plancha !== undefined) {
    const p = percentilPlancha(sexo, edad, d.plancha)
    if (p) {
      r.percentiles.plancha = p
      sumar('fuerza', p.percentil)
    }
  }

  if (d.rodilla) {
    const prom = (d.rodilla.izq + d.rodilla.der) / 2
    r.percentiles.rodilla = percentilRodillaPared(prom, sexo, edad)
    r.diferenciaRodillas = Math.abs(d.rodilla.izq - d.rodilla.der)
    sumar('movilidad', r.percentiles.rodilla.percentil)
  }

  let pEquilibrio: number | null = null
  if (d.equilibrio) {
    r.percentiles.equilibrio = percentilEquilibrio(edad, d.equilibrio.segundos, d.equilibrio.ojos)
    if (d.equilibrio.ojos !== ojosParaEquilibrio(edad)) {
      r.percentiles.equilibrio.nota = `Para tu edad se recomienda con ojos ${ojosParaEquilibrio(edad)}.`
    }
    pEquilibrio = r.percentiles.equilibrio.percentil
    sumar('equilibrio', pEquilibrio)
  }

  const cond = condicionFisica(valores)
  if (cond) {
    r.condicion = cond.puntaje
    r.areas = cond.porArea
    r.parcial = cond.parcial
    r.areasFaltantes = cond.areasFaltantes
  }

  const calidad = d.calidad?.filter((x): x is number => x !== null)
  if (calidad && calidad.length === 5) r.calidad = calidadMovimiento(calidad)
  const hab = habilidadMovimiento(r.calidad ?? null, pEquilibrio)
  if (hab !== null) r.habilidad = hab

  return r
}

export const DIAS_ENTRE_EVALUACIONES = 28
