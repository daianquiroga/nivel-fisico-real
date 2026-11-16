import { describe, expect, it } from 'vitest'
import { clasificarFskt, indiceCaida, indiceSjft } from './pruebasCombate'

describe('pruebas de combate', () => {
  it('clasifica el FSKT de 10 s con los cortes publicados', () => {
    expect(clasificarFskt(16)).toBe('Muy bajo')
    expect(clasificarFskt(17)).toBe('Bajo')
    expect(clasificarFskt(20)).toBe('Promedio')
    expect(clasificarFskt(23)).toBe('Bueno')
    expect(clasificarFskt(25)).toBe('Excelente')
  })
  it('calcula el índice de caída a mano: series 20, 19, 18, 17, 16 → (1 − 90 ÷ 100) × 100 = 10 %', () => {
    expect(indiceCaida([20, 19, 18, 17, 16])).toBe(10)
  })
  it('calcula el índice SJFT a mano: (180 + 150) ÷ 27 = 12,22', () => {
    expect(indiceSjft([6, 11, 10], 180, 150)).toBe(12.22)
  })
})
