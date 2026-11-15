import { describe, expect, it } from 'vitest'
import { ajusteSeriePrueba, enElTope, epley, records, redondear, rendimiento, sugerir, type Sesion } from './progresion'

const s = (fecha: string, ...series: [number | undefined, number, number][]): Sesion => ({
  fecha,
  series: series.map(([carga, reps, rir]) => ({ carga, reps, rir })),
})

describe('progresión de cargas', () => {
  it('Epley: 10 kg × 10 = 13,33', () => {
    // 10 × (1 + 10/30) = 13,33
    expect(epley(10, 10)).toBeCloseTo(13.33, 2)
  })

  it('serie de prueba', () => {
    expect(ajusteSeriePrueba(8, 5).carga).toBe(9) // 8,8 → 9
    expect(ajusteSeriePrueba(8, 3).carga).toBe(8)
    expect(ajusteSeriePrueba(8, 1).carga).toBe(7) // 7,2 → 7
    expect(redondear(7.3)).toBe(7.5)
  })

  it('primera vez sugiere serie de prueba', () => {
    expect(sugerir([], { carga: 'externa', rango: [8, 12] }).tipo).toBe('prueba')
  })

  it('después de la serie de prueba ajusta y arranca', () => {
    const r = sugerir([s('1', [10, 10, 5])], { carga: 'externa', rango: [8, 12] })
    expect(r.tipo).toBe('empezar')
    expect(r.carga).toBe(11)
  })

  it('doble progresión con carga: en el tope con reserva sube', () => {
    const ses = [s('1', [10, 12, 2], [10, 12, 2], [10, 12, 3])]
    const r = sugerir(ses, { carga: 'externa', rango: [8, 12] })
    expect(r.tipo).toBe('subir')
    // 10 × 1,035 = 10,35 → 10,5 (al menos +0,5)
    expect(r.carga).toBe(10.5)
    expect(r.reps).toBe(8)
  })

  it('sin llegar al tope: mismo peso y una más', () => {
    const r = sugerir([s('1', [10, 10, 2], [10, 9, 1])], { carga: 'externa', rango: [8, 12] })
    expect(r.tipo).toBe('sumar-reps')
    expect(r.reps).toBe(10)
    expect(r.carga).toBe(10)
  })

  it('peso corporal: dos sesiones en el tope → escalón siguiente', () => {
    const ctx = { carga: 'corporal' as const, rango: [8, 15] as [number, number] }
    const una = [s('1', [undefined, 15, 2], [undefined, 15, 2], [undefined, 15, 2])]
    expect(sugerir(una, ctx).tipo).toBe('mantener')
    expect(sugerir([...una, una[0]], ctx).tipo).toBe('siguiente-variante')
  })

  it('estancamiento: 3 sesiones sin superar la mejor', () => {
    const ses = [s('1', [10, 10, 2]), s('2', [10, 9, 1]), s('3', [10, 10, 1]), s('4', [10, 9, 0])]
    const r = sugerir(ses, { carga: 'externa', rango: [8, 12] })
    expect(r.tipo).toBe('estancado')
    expect(r.carga).toBe(9)
  })

  it('rendimiento, tope y récords', () => {
    expect(rendimiento(s('1', [undefined, 10, 2], [undefined, 8, 1]), 'corporal')).toBe(18)
    expect(enElTope(s('1', [5, 12, 1]), [8, 12])).toBe(false)
    const rec = records([s('1', [10, 10, 2]), s('2', [12, 6, 1])])
    expect(rec.cargaMax).toBe(12)
    expect(rec.maximoEstimado).toBeCloseTo(14.4, 1) // 12 × 1,2
    expect(rec.repsMax).toBe(10)
  })
})
