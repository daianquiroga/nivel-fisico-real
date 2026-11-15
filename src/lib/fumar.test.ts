import { describe, expect, it } from 'vitest'
import { diasSinFumar, plataAhorrada } from './fumar'

describe('dejar de fumar', () => {
  it('cuenta los días', () => {
    expect(diasSinFumar('2026-09-15', new Date(2026, 10, 15, 18, 0))).toBe(61)
    expect(diasSinFumar('2026-11-15', new Date(2026, 10, 15))).toBe(0)
    expect(diasSinFumar('2026-12-01', new Date(2026, 10, 15))).toBe(0)
  })
  it('calcula la plata ahorrada', () => {
    expect(plataAhorrada(61, 4000, 1)).toBe(244000)
    expect(plataAhorrada(10, 4000, 0.5)).toBe(20000)
  })
})
