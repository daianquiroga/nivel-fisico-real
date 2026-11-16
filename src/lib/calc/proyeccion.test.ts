import { describe, expect, it } from 'vitest'
import { factorEdad, fuerzaProyectada, musculoProyectado, ritmoGrasa, vo2Proyectado } from './proyeccion'

describe('proyección', () => {
  it('VO2: +15 % a las 10 semanas con constancia total (no entrenado)', () => {
    // 40 × 1,15 = 46
    expect(vo2Proyectado(40, 2, 35, 10, 1)).toBeCloseTo(46, 5)
  })
  it('con la mitad de constancia, a las 10 semanas = 5 semanas completas', () => {
    expect(vo2Proyectado(40, 2, 35, 10, 0.5)).toBeCloseTo(vo2Proyectado(40, 2, 35, 5, 1), 6)
  })
  it('fuerza: +22,5 % a las 12 semanas (principiante)', () => {
    expect(fuerzaProyectada(1, 30, 12, 1)).toBeCloseTo(22.5, 5)
  })
  it('más nivel y más edad, menos margen', () => {
    expect(fuerzaProyectada(4, 30, 52, 1)).toBeLessThan(fuerzaProyectada(2, 30, 52, 1))
    expect(factorEdad(55)).toBe(0.8)
  })
  it('músculo y grasa', () => {
    // 1 mes, 80 kg, hombre principiante: 0,01 × 80 × 12 × (1 − e^(−1/12)) = 0,768
    expect(musculoProyectado(80, 'h', 2, 30, 1, 1)[0]).toBeCloseTo(0.768, 2)
    expect(ritmoGrasa(80)).toEqual([0.4, 0.8])
  })
})
