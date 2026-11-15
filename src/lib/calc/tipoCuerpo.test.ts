import { describe, expect, it } from 'vitest'
import { contextura, indiceAlturaPeso, linealidad, nivelLinealidad, tendencia } from './tipoCuerpo'

describe('tipo de cuerpo', () => {
  it('linealidad: ejemplo del manual (178 cm, 69,2 kg)', () => {
    // 178 / raíz cúbica de 69,2 = 178 / 4,105 = 43,36; 0,732 × 43,36 − 28,58 = 3,16
    expect(indiceAlturaPeso(178, 69.2)).toBeCloseTo(43.36, 1)
    expect(linealidad(178, 69.2)).toBeCloseTo(3.16, 1)
    expect(nivelLinealidad(3.16)).toBe('Moderada')
  })

  it('linealidad: tramo medio y mínimo', () => {
    // 170 / raíz cúbica de 80 = 170 / 4,309 = 39,45; 0,463 × 39,45 − 17,63 = 0,64
    expect(linealidad(170, 80)).toBeCloseTo(0.64, 1)
    // 165 / raíz cúbica de 100 = 35,5 → mínimo 0,1
    expect(linealidad(165, 100)).toBe(0.1)
  })

  it('contextura por muñeca', () => {
    expect(contextura('h', 178, 16)).toBe('chica')
    expect(contextura('h', 178, 17.5)).toBe('mediana')
    expect(contextura('h', 178, 19.5)).toBe('grande')
    expect(contextura('m', 160, 15.5)).toBe('mediana')
    expect(contextura('m', 170, 15.5)).toBe('chica')
  })

  it('tendencia', () => {
    expect(tendencia(6, false)).toBe('lineal')
    expect(tendencia(1, false)).toBe('robusta')
    expect(tendencia(1, true)).toBe('redondeada')
    expect(tendencia(3.5, false)).toBe('intermedia')
  })
})
