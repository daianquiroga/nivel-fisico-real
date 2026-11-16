import { describe, expect, it } from 'vitest'
import { intensidad, kcal, metDe, metSesionFuerza, minutosEquivalentes } from './calorias'

describe('calorías y minutos', () => {
  it('kcal = MET × kg × horas: caminata rápida 30 min, 80 kg', () => {
    // 4,8 × 80 × 0,5 = 192
    expect(kcal(metDe('caminata', 'rapida')!, 80, 30)).toBeCloseTo(192, 5)
  })
  it('intensidad y minutos equivalentes', () => {
    expect(intensidad(4.8)).toBe('moderada')
    expect(intensidad(11.8)).toBe('vigorosa')
    expect(minutosEquivalentes(11.8, 10)).toBe(20)
    expect(minutosEquivalentes(2.5, 30)).toBe(0)
  })
  it('sesión de fuerza', () => {
    expect(metSesionFuerza('clasico', true)).toBe(3.5)
    expect(metSesionFuerza('circuito', false)).toBe(5.8)
    expect(metSesionFuerza('clasico', false)).toBe(3)
  })
})
