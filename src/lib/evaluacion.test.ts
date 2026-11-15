import { describe, expect, it } from 'vitest'
import { calcularResultados } from './evaluacion'

describe('evaluación completa', () => {
  it('caso 1 de EVALUACION.md con todas las pruebas', () => {
    const r = calcularResultados('h', 35, {
      pulsos: [69, 71, 70],
      alturaCm: 175,
      cinturaCm: 90,
      actividad: { frecuencia: 2.5, intensidad: 2, duracion: 0.75 },
      rodilla: { izq: 11, der: 11 },
      equilibrio: { ojos: 'cerrados', segundos: 15 },
      sentarse: 47,
      flexiones: { reps: 17, variante: 'completa' },
      plancha: 90,
      calidad: [2, 2, 2, 2, 2],
    })
    expect(r.pulso).toBe(70)
    expect(r.vo2).toBeCloseTo(46.7, 1)
    expect(r.edadFisica).toBeCloseTo(45.6, 1)
    expect(r.composicion?.zona).toBe('Aumentada')
    expect(r.composicion?.grasa).toBeCloseTo(25.11, 2)
    // A los 35 años la plancha no puntúa (solo hay normas de 18 a 25)
    expect(r.percentiles.plancha).toBeUndefined()
    expect(r.percentiles.sentarse?.percentil).toBeCloseTo(50)
    expect(r.percentiles.flexiones?.percentil).toBeCloseTo(40)
    expect(r.areas.fuerza).toBeCloseTo(45)
    expect(r.parcial).toBe(false)
    expect(r.condicion).toBeGreaterThan(30)
    expect(r.condicion).toBeLessThan(60)
    expect(r.calidad).toBeCloseTo((10 / 15) * 100)
    expect(r.habilidad).toBeDefined()
  })

  it('evaluación rápida sin movilidad marca el resultado como parcial', () => {
    const r = calcularResultados('h', 35, {
      pulsos: [70],
      alturaCm: 175,
      cinturaCm: 90,
      actividad: { frecuencia: 2.5, intensidad: 2, duracion: 0.75 },
      sentarse: 47,
      flexiones: { reps: 22, variante: 'completa' },
      equilibrio: { ojos: 'cerrados', segundos: 15 },
    })
    expect(r.parcial).toBe(true)
    expect(r.areasFaltantes).toEqual(['movilidad'])
    expect(r.condicion).toBeDefined()
  })

  it('flexiones con rodillas en hombres no se comparan con la tabla', () => {
    const r = calcularResultados('h', 30, { flexiones: { reps: 20, variante: 'rodillas' } })
    expect(r.percentiles.flexiones).toBeUndefined()
    const p = calcularResultados('h', 30, { flexiones: { reps: 20, variante: 'punos' } })
    expect(p.percentiles.flexiones).toBeDefined()
  })

  it('sin datos no hay puntaje', () => {
    const r = calcularResultados('m', 40, {})
    expect(r.condicion).toBeUndefined()
  })
})

describe('tipo de cuerpo en la evaluación', () => {
  it('con peso y muñeca', () => {
    const r = calcularResultados('h', 30, { alturaCm: 178, cinturaCm: 80, pesoKg: 69.2, munecaCm: 17.5 })
    expect(r.tipoCuerpo?.linealidad).toBeCloseTo(3.16, 1)
    expect(r.tipoCuerpo?.contextura).toBe('mediana')
    expect(r.tipoCuerpo?.tendencia).toBe('intermedia')
  })
  it('sin peso ni muñeca no hay tipo de cuerpo', () => {
    expect(calcularResultados('h', 30, { alturaCm: 178, cinturaCm: 80 }).tipoCuerpo).toBeUndefined()
  })
})
