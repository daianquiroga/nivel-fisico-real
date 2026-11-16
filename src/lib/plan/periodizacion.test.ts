import { describe, expect, it } from 'vitest'
import { aplicarDescarga, cadaCuantasSemanas, faseDeSemana, fatigaAcumulada, semanaDelPlan, semanasParaDescarga } from './periodizacion'
import type { SesionPlan } from './generador'

describe('periodización', () => {
  it('cada cuántas semanas hay descarga según el nivel', () => {
    expect(cadaCuantasSemanas(1)).toBe(7)
    expect(cadaCuantasSemanas(3)).toBe(5)
    expect(cadaCuantasSemanas(5)).toBe(4)
  })

  it('semana del plan', () => {
    expect(semanaDelPlan('2026-01-01T10:00:00', new Date('2026-01-03T10:00:00'))).toBe(1)
    expect(semanaDelPlan('2026-01-01T10:00:00', new Date('2026-01-15T10:00:00'))).toBe(3)
  })

  it('fases de un principiante: adaptación, base, descarga en la semana 7, desarrollo', () => {
    const f = [1, 2, 3, 6, 7, 8, 14].map((s) => faseDeSemana(s, 2))
    expect(f).toEqual(['adaptacion', 'adaptacion', 'base', 'base', 'descarga', 'desarrollo', 'descarga'])
    expect(semanasParaDescarga(3, 2)).toBe(4)
    expect(semanasParaDescarga(7, 2)).toBe(0)
  })

  it('fatiga acumulada', () => {
    const c = (energia: number, sueno = 7) => ({ fecha: '', energia, sueno, dolor: 'ninguno' as const })
    expect(fatigaAcumulada([c(4), c(2), c(3), c(1), c(4)])).toBe(false)
    expect(fatigaAcumulada([c(4), c(2), c(3), c(1), c(4, 5)])).toBe(true)
  })

  it('descarga: la mitad de las series', () => {
    const s: SesionPlan = {
      id: 'x',
      tipo: 'fuerza',
      titulo: 'T',
      minutos: 40,
      intensidad: 'fuerte',
      metodo: 'clasico',
      ejercicios: [
        { id: 'flexion', patrones: ['empuje'], rol: 'principal', series: 3, rango: [8, 12], descansoSeg: 90 },
        { id: 'gato-camello', patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: [6, 10], descansoSeg: 0 },
      ],
    }
    expect(aplicarDescarga(s).ejercicios.map((x) => x.series)).toEqual([2, 1])
  })
})
