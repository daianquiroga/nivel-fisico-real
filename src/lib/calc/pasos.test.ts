import { describe, expect, it } from 'vitest'
import { cadencia, esModerada, metaFinal, metaPasos } from './pasos'

describe('pasos', () => {
  it('meta final según edad', () => {
    expect(metaFinal(35)).toBe(8000)
    expect(metaFinal(65)).toBe(6000)
  })
  it('sin datos: la meta final', () => {
    expect(metaPasos(35, [0, 0, 4000])).toEqual({ meta: 8000, final: 8000, progresiva: false })
  })
  it('progresiva: promedio 4200 → 4500 + 1000 = 5500', () => {
    // (4000 + 4500 + 4100) / 3 = 4200 → redondeo a 4500 → + 1000
    expect(metaPasos(35, [4000, 4500, 4100]).meta).toBe(5500)
  })
  it('no pasa la meta final', () => {
    expect(metaPasos(35, [7800, 7900, 8100]).meta).toBe(8000)
  })
  it('cadencia: 26 pasos en 15 s = 104 por minuto, moderada', () => {
    expect(cadencia(26)).toBe(104)
    expect(esModerada(104)).toBe(true)
    expect(esModerada(90)).toBe(false)
  })
})
