import { describe, expect, it } from 'vitest'
import { categoriaSomatotipo, contextura, endomorfia, indiceAlturaPeso, linealidad, mesomorfia, nivelLinealidad, tendencia, tendenciaActual } from './tipoCuerpo'

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
    expect(tendencia(6, false)).toBe('ectomorfo')
    expect(tendencia(1, false)).toBe('mesomorfo')
    expect(tendencia(1, true)).toBe('endomorfo')
    expect(tendencia(3.5, false)).toBe('mixto')
    expect(tendenciaActual('robusta')).toBe('mesomorfo')
    expect(tendenciaActual('ectomorfo')).toBe('ectomorfo')
  })

  it('endomorfia: suma de 30 mm con 170,18 cm', () => {
    // X = 30; −0,7182 + 0,1451·30 − 0,00068·900 + 0,0000014·27000 = 3,06
    expect(endomorfia(30, 170.18)).toBeCloseTo(3.06, 2)
  })

  it('mesomorfia: ejemplo de la Universidad Masaryk (5,57)', () => {
    // 0,858·7,20 + 0,601·9,95 + 0,188·33,3 + 0,161·37,1 − 0,131·178 + 4,5 = 5,57 (perímetros ya corregidos)
    const m = mesomorfia({ alturaCm: 178, humeroCm: 7.2, femurCm: 9.95, brazoCm: 34.3, pantorrillaCm: 38.1, pliegueTricepsMm: 10, plieguePantorrillaMm: 10 })
    expect(m).toBeCloseTo(5.57, 2)
  })

  it('categorías de Carter', () => {
    expect(categoriaSomatotipo(2, 5, 2).nombre).toBe('Mesomorfo balanceado')
    expect(categoriaSomatotipo(3.5, 5, 2).nombre).toBe('Mesomorfo endomórfico')
    expect(categoriaSomatotipo(4, 4.3, 1.5).nombre).toBe('Mesomorfo-endomorfo')
    expect(categoriaSomatotipo(3, 3.5, 3).nombre).toBe('Central')
    expect(categoriaSomatotipo(1.5, 3, 5).tipo).toBe('ectomorfo')
  })
})
