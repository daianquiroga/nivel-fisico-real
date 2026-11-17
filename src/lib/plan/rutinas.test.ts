import { describe, expect, it } from 'vitest'
import type { PlanSemana, SesionPlan } from './generador'
import { combinarPlanes } from './rutinas'

const sesion = (titulo: string, desde: string, minutos: number, tipo: SesionPlan['tipo'] = 'fuerza', combate?: SesionPlan['combate']): SesionPlan => ({
  id: titulo,
  tipo,
  titulo,
  desde,
  minutos,
  intensidad: 'fuerte',
  metodo: 'clasico',
  ejercicios: [{ id: 'sentadilla', patrones: ['sentadilla'], rol: 'principal', series: 3, rango: [8, 12], descansoSeg: 90 }],
  combate,
})
const plan = (dias: Record<number, SesionPlan[]>): PlanSemana => ({ creado: '2026-01-01', dias: Array.from({ length: 7 }, (_, d) => ({ sesiones: dias[d] ?? [] })) })

describe('combinar rutinas', () => {
  it('junta los días de las dos rutinas', () => {
    const c = combinarPlanes([plan({ 0: [sesion('Fuerza A', '19:00', 45)] }), plan({ 2: [sesion('Combate', '19:00', 30, 'cardio', { arte: 'boxeo' })] })])
    expect(c.plan.dias[0].sesiones.map((s) => s.titulo)).toEqual(['Fuerza A'])
    expect(c.plan.dias[2].sesiones.map((s) => s.titulo)).toEqual(['Combate'])
    expect(c.movidos).toHaveLength(0)
  })

  it('a la misma hora va primero la técnica y lo otro empieza 15 minutos después (calculado a mano)', () => {
    // Combate 19:00 + 30 min = 19:30; + 15 de pausa = 19:45.
    const c = combinarPlanes([plan({ 1: [sesion('Fuerza B', '19:00', 45)] }), plan({ 1: [sesion('Combate', '19:00', 30, 'cardio', { arte: 'kick' })] })])
    expect(c.plan.dias[1].sesiones.map((s) => [s.titulo, s.desde, s.hasta])).toEqual([
      ['Combate', '19:00', '19:30'],
      ['Fuerza B', '19:45', '20:30'],
    ])
    expect(c.movidos).toEqual([{ dia: 1, titulo: 'Fuerza B', antes: '19:00', ahora: '19:45' }])
    expect(c.minutosPorDia[1]).toBe(75)
  })

  it('no mueve lo que no se pisa y saca las movilidades opcionales', () => {
    const opcional = { ...sesion('Movilidad (opcional, 10 minutos)', '20:00', 10, 'movilidad') }
    const c = combinarPlanes([plan({ 3: [sesion('Fuerza A', '07:00', 45)], 4: [opcional] }), plan({ 3: [sesion('Combate', '19:00', 30, 'cardio', { arte: 'boxeo' })] })])
    expect(c.plan.dias[3].sesiones.map((s) => s.desde)).toEqual(['07:00', '19:00'])
    expect(c.plan.dias[4].sesiones).toHaveLength(0)
    expect(new Set(c.plan.dias[3].sesiones.map((s) => s.id)).size).toBe(2)
  })
})
