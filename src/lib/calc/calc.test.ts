import { describe, expect, it } from 'vitest'
import { edadFisica, indiceActividad, percentilCardio, vo2maxEstimado, vo2maxPromedio } from './cardio'
import { cinturaAltura, grasaRfm, puntajeComposicion, zonaCinturaAltura } from './composicion'
import { normalAcumulada, percentilDesdeCategorias, percentilDesdePuntos } from './percentiles'
import {
  ojosParaEquilibrio,
  percentilEquilibrio,
  percentilFlexiones,
  percentilPlancha,
  percentilRodillaPared,
  percentilSentarse,
} from './pruebas'
import { calidadMovimiento, condicionFisica, habilidadMovimiento, nivelPorPercentil } from './puntajes'

describe('percentiles', () => {
  it('normal acumulada', () => {
    expect(normalAcumulada(0)).toBeCloseTo(0.5, 6)
    expect(normalAcumulada(1.96)).toBeCloseTo(0.975, 3)
    expect(normalAcumulada(-1)).toBeCloseTo(0.1587, 3)
  })
  it('interpola entre puntos y usa la normal afuera', () => {
    const puntos = [
      { p: 25, v: 40 },
      { p: 50, v: 47 },
      { p: 75, v: 56 },
    ]
    expect(percentilDesdePuntos(47, puntos)).toBeCloseTo(50)
    expect(percentilDesdePuntos(51.5, puntos)).toBeCloseTo(62.5)
    expect(percentilDesdePuntos(80, puntos)).toBeGreaterThan(90)
    expect(percentilDesdePuntos(0, puntos)).toBe(1)
  })
  it('categorías', () => {
    expect(percentilDesdeCategorias(22, [17, 22, 29, 36])).toBeCloseTo(40)
    expect(percentilDesdeCategorias(36, [17, 22, 29, 36])).toBeCloseTo(80)
    expect(percentilDesdeCategorias(8, [17, 22, 29, 36])).toBeCloseTo((8 / 17) * 20)
  })
})

describe('cardio (EVALUACION.md, casos 1 y 2)', () => {
  it('caso 1: hombre de 35 años', () => {
    const indice = indiceActividad(2.5, 2, 0.75)
    expect(indice).toBeCloseTo(3.75)
    const vo2 = vo2maxEstimado({ sexo: 'h', edad: 35, cinturaCm: 90, pulso: 70, indice })
    expect(vo2).toBeCloseTo(46.7, 1)
    expect(vo2maxPromedio('h', 35)).toBeCloseTo(49)
    expect(percentilCardio('h', 35, vo2)).toBeCloseTo(37.1, 0)
    expect(edadFisica('h', vo2)).toBeCloseTo(45.6, 1)
  })
  it('caso 2: mujer de 28 años', () => {
    const indice = indiceActividad(5, 2, 0.75)
    const vo2 = vo2maxEstimado({ sexo: 'm', edad: 28, cinturaCm: 75, pulso: 72, indice })
    expect(vo2).toBeCloseTo(41.68, 1)
    expect(edadFisica('m', vo2)).toBeCloseTo(29.4, 1)
  })
  it('la edad física queda entre 20 y 85', () => {
    expect(edadFisica('h', 80)).toBe(20)
    expect(edadFisica('h', 5)).toBe(85)
  })
})

describe('composición', () => {
  it('caso 1: cintura/altura y RFM', () => {
    expect(cinturaAltura(90, 175)).toBeCloseTo(0.514, 3)
    expect(zonaCinturaAltura(0.514)).toBe('Aumentada')
    expect(grasaRfm('h', 175, 90)).toBeCloseTo(25.11, 2)
  })
  it('caso 2: RFM mujer', () => {
    expect(grasaRfm('m', 165, 75)).toBeCloseTo(32.0, 1)
  })
  it('puntaje por zonas', () => {
    expect(puntajeComposicion('h', 0.45, 15)).toBe(85)
    expect(puntajeComposicion('h', 0.38, 10)).toBe(75)
    expect(puntajeComposicion('h', 0.55, 20)).toBeCloseTo(55)
    expect(puntajeComposicion('h', 0.514, 25.11)).toBeCloseTo(65.8 - 10, 1)
  })
})

describe('pruebas de fuerza, movilidad y equilibrio', () => {
  it('caso 3: sentarse y pararse, hombre de 31 años', () => {
    expect(percentilSentarse('h', 31, 47).percentil).toBeCloseTo(50)
    expect(percentilSentarse('h', 31, 56).percentil).toBeCloseTo(75)
  })
  it('usa el grupo más cercano fuera de la tabla y lo avisa', () => {
    const r = percentilSentarse('m', 18, 47)
    expect(r.percentil).toBeCloseTo(50)
    expect(r.nota).toMatch(/20 a 24/)
  })
  it('caso 4: flexiones, hombre de 25 años', () => {
    expect(percentilFlexiones('h', 25, 22)!.percentil).toBeCloseTo(40)
    expect(percentilFlexiones('h', 25, 36)!.percentil).toBeGreaterThanOrEqual(80)
  })
  it('flexiones de mujer fuera de la tabla avisan', () => {
    expect(percentilFlexiones('m', 40, 15)!.nota).toMatch(/falta la tabla/)
  })
  it('plancha solo puntúa de 18 a 25 años', () => {
    expect(percentilPlancha('h', 22, 110)!.percentil).toBeCloseTo(50)
    expect(percentilPlancha('h', 35, 110)).toBeNull()
  })
  it('rodilla a la pared', () => {
    expect(percentilRodillaPared(11).percentil).toBeCloseTo(50)
  })
  it('equilibrio con ojos cerrados', () => {
    expect(ojosParaEquilibrio(35)).toBe('cerrados')
    expect(ojosParaEquilibrio(65)).toBe('abiertos')
    const medio = percentilEquilibrio(30, 15.2, 'cerrados').percentil
    expect(medio).toBeGreaterThan(55)
    expect(medio).toBeLessThan(75)
    expect(percentilEquilibrio(30, 45, 'cerrados').percentil).toBeGreaterThan(90)
    expect(percentilEquilibrio(30, 2, 'cerrados').percentil).toBeLessThan(15)
  })
})

describe('puntajes finales', () => {
  it('condición física ponderada', () => {
    const c = condicionFisica({ cardio: [50], fuerza: [50, 70], composicion: [60], movilidad: [40], equilibrio: [80] })!
    // 0,35×50 + 0,30×60 + 0,20×60 + 0,075×40 + 0,075×80
    expect(c.puntaje).toBeCloseTo(17.5 + 18 + 12 + 3 + 6)
    expect(c.parcial).toBe(false)
  })
  it('reparte el peso de las áreas faltantes', () => {
    const c = condicionFisica({ cardio: [40], fuerza: [60] })!
    expect(c.puntaje).toBeCloseTo((40 * 0.35 + 60 * 0.3) / 0.65)
    expect(c.parcial).toBe(true)
    expect(c.areasFaltantes).toContain('movilidad')
    expect(condicionFisica({})).toBeNull()
  })
  it('habilidad y calidad de movimiento', () => {
    expect(calidadMovimiento([3, 3, 3, 3, 3])).toBe(100)
    expect(habilidadMovimiento(60, 50)).toBeCloseTo(56)
    expect(habilidadMovimiento(null, 50)).toBe(50)
  })
  it('niveles por percentil', () => {
    expect(nivelPorPercentil(5).nivel).toBe(1)
    expect(nivelPorPercentil(50)).toMatchObject({ nivel: 3, nombre: 'En marcha' })
    expect(nivelPorPercentil(50).avance).toBeCloseTo(0.5)
    expect(nivelPorPercentil(99).nivel).toBe(5)
  })
})
