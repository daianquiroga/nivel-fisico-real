import { describe, expect, it } from 'vitest'
import { proteinaDelDia, proteinaPlato } from './nutricion'
import { compararMarca, mejorMarca } from './marcas'

describe('proteína del día', () => {
  it('75 kg (calculado a mano)', () => {
    // 75 × 1,6 = 120 g; rango 105 a 150 g; 75 × 0,4 = 30 g por comida → 4 comidas; 120 ÷ 25 = 4,8 → 5 palmas.
    expect(proteinaDelDia(75)).toEqual({ objetivo: 120, minimo: 105, maximo: 150, porComida: 30, comidas: 4, palmas: 5 })
  })
  it('suma un plato', () => {
    expect(proteinaPlato([{ gramos: 31.2 }, { gramos: 4 }])).toBe(35)
  })
})

describe('marcas propias', () => {
  it('hexágono: menos tiempo es mejor y hace falta bajar más de 1,015 s', () => {
    expect(compararMarca(14, 12.8, 1.015, true)).toBe('mejor')
    expect(compararMarca(14, 13.2, 1.015, true)).toBe('igual')
    expect(compararMarca(12, 13.5, 1.015, true)).toBe('peor')
  })
  it('alcance: más es mejor', () => {
    expect(compararMarca(-5, -2, 1, false)).toBe('mejor')
    expect(mejorMarca([-5, -2, -3], false)).toBe(-2)
    expect(mejorMarca([14, 12.8], true)).toBe(12.8)
    expect(mejorMarca([], true)).toBeUndefined()
  })
})

import tabla from '../../content/normas/alimentos-proteina.json'
describe('tabla de alimentos', () => {
  it('cada plato usa alimentos que existen y tiene proteína', () => {
    const ids = new Set(tabla.alimentos.map((a) => a.id))
    for (const p of tabla.platos) {
      for (const a of p.alimentos) expect(ids.has(a), a).toBe(true)
      expect(proteinaPlato(p.alimentos.map((a) => ({ gramos: tabla.alimentos.find((x) => x.id === a)!.proteina })))).toBeGreaterThan(10)
    }
  })
})
