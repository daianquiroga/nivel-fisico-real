import { describe, expect, it } from 'vitest'
import { cargaSesion, cargasSemanales, estadoCarga } from './carga'

describe('carga de entrenamiento (esfuerzo × minutos)', () => {
  it('calcula la carga de una sesión a mano: esfuerzo 7 × 45 min = 315', () => {
    expect(cargaSesion(7, 45)).toBe(315)
  })
  it('suma por bloques de 7 días y saltea sesiones sin esfuerzo', () => {
    const hoy = new Date('2026-11-16T12:00:00')
    const s = [
      { fecha: '2026-11-15T19:00:00', minutos: 60, esfuerzo: 6 }, // esta semana: 360
      { fecha: '2026-11-12T19:00:00', minutos: 30, esfuerzo: 4 }, // esta semana: 120
      { fecha: '2026-11-08T19:00:00', minutos: 50, esfuerzo: 5 }, // hace 1: 250
      { fecha: '2026-10-30T19:00:00', minutos: 40 }, // sin esfuerzo
    ]
    expect(cargasSemanales(s, hoy)).toEqual([0, 0, 250, 480])
  })
  it('avisa una subida de más de 1,5 veces el promedio de las 3 anteriores', () => {
    expect(estadoCarga([300, 300, 300, 500]).estado).toBe('subida')
    expect(estadoCarga([300, 300, 300, 400]).estado).toBe('normal')
    expect(estadoCarga([300, 300, 300, 100]).estado).toBe('bajada')
    expect(estadoCarga([0, 0, 300, 900]).estado).toBe('sin-datos')
  })
})
