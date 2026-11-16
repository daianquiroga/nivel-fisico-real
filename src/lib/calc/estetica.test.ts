import { describe, expect, it } from 'vitest'
import { bajaMuyRapido, cambio, ritmoSemanalPeso } from './estetica'

describe('estética', () => {
  it('ritmo semanal de peso: 80 → 78 kg en 2 semanas = −1,25 % por semana', () => {
    const r = ritmoSemanalPeso([
      { fecha: '2026-01-01', peso: 80 },
      { fecha: '2026-01-15', peso: 78 },
    ])
    expect(r).toBeCloseTo(-1.25, 5)
    expect(bajaMuyRapido(r)).toBe(true)
  })
  it('sin 7 días de diferencia no hay ritmo', () => {
    expect(ritmoSemanalPeso([{ fecha: '2026-01-01', peso: 80 }, { fecha: '2026-01-03', peso: 79 }])).toBeNull()
  })
  it('ritmo sano no avisa', () => {
    expect(bajaMuyRapido(ritmoSemanalPeso([{ fecha: '2026-01-01', peso: 80 }, { fecha: '2026-01-29', peso: 78.4 }]))).toBe(false)
  })
  it('cambio entre primera y última', () => {
    expect(cambio([90, 88, 86.5])).toBe(-3.5)
    expect(cambio([90])).toBeNull()
  })
})
