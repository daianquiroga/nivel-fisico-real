import { describe, expect, it } from 'vitest'
import { ejercicio } from './ejercicios'
import { aprobados, apruebaTecnica, basicosPara, criteriosTecnica } from './tecnica'
import { evaluarEtapa } from './coach/etapas'
import type { PlanSemana } from './plan/generador'

describe('técnica de los básicos', () => {
  it('elige uno por movimiento, primero los del plan', () => {
    const plan = { creado: '', dias: [{ sesiones: [{ ejercicios: [{ id: 'sentadilla-goblet' }, { id: 'remo-mancuerna' }] }] }, ...Array(6).fill({ sesiones: [] })] } as unknown as PlanSemana
    const b = basicosPara(plan, new Set(['mancuernas']), [])
    expect(b).toHaveLength(6)
    expect(b.map((x) => x.id)).toEqual(expect.arrayContaining(['sentadilla-goblet', 'remo-mancuerna']))
    // Sin plan y sin equipo: igual hay 6 (algunos de peso corporal).
    expect(basicosPara(null, new Set(), []).length).toBeGreaterThanOrEqual(5)
  })

  it('los criterios salen de los errores de la ficha y se aprueba con todos', () => {
    const c = criteriosTecnica(ejercicio('sentadilla')!)
    expect(c).toHaveLength(4)
    expect(apruebaTecnica([true, true, true, true])).toBe(true)
    expect(apruebaTecnica([true, false, true, true])).toBe(false)
    expect(aprobados([{ fecha: '', ejercicio: 'a', criterios: [], aprobado: true }, { fecha: '', ejercicio: 'b', criterios: [], aprobado: false }], ['a', 'b', 'c'])).toBe(1)
  })

  it('la etapa pide la técnica cuando se informa', () => {
    const e = evaluarEtapa({ numero: 1, inicio: '2026-01-01T00:00:00' }, [], 3, [], new Date('2026-11-01T00:00:00'), 4)
    expect(e.requisitos.at(-1)).toEqual({ texto: 'Técnica aprobada en los 6 ejercicios básicos', ok: false, detalle: '4 de 6' })
  })
})
