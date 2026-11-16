import { describe, expect, it } from 'vitest'
import { agregarEjercicio, agregarSesion, ajustarEjercicio, borrarSesion, cambiarDatosSesion, cambiarMetodo, moverEjercicio, moverSesion, quitarEjercicio } from './editar'
import type { PlanSemana } from './generador'

const vacio = (): PlanSemana => ({ creado: '2026-01-01', dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) })

describe('editar el plan a mano', () => {
  it('arma una rutina propia desde cero', () => {
    let p = agregarSesion(vacio(), 0, 'fuerza', 'Casa X')
    p = agregarEjercicio(p, 0, 0, 'sentadilla-goblet')
    p = agregarEjercicio(p, 0, 0, 'flexion')
    p = agregarEjercicio(p, 0, 0, 'curl-biceps')
    const s = p.dias[0].sesiones[0]
    expect(p.editado).toBe(true)
    expect(s.ejercicios.map((x) => x.id)).toEqual(['sentadilla-goblet', 'flexion', 'curl-biceps'])
    expect(s.ejercicios[0].series).toBe(3)
    expect(s.ejercicios[2].rol).toBe('accesorio')
    expect(s.minutos).toBeGreaterThan(5)
  })

  it('mover, quitar, ajustar y método', () => {
    let p = agregarSesion(vacio(), 0, 'fuerza')
    p = agregarEjercicio(p, 0, 0, 'flexion')
    p = agregarEjercicio(p, 0, 0, 'remo-banda')
    p = moverEjercicio(p, 0, 0, 1, -1)
    expect(p.dias[0].sesiones[0].ejercicios[0].id).toBe('remo-banda')
    p = ajustarEjercicio(p, 0, 0, 0, { series: 4, rango: [10, 15] })
    expect(p.dias[0].sesiones[0].ejercicios[0]).toMatchObject({ series: 4, rango: [10, 15] })
    p = cambiarMetodo(p, 0, 0, 'superseries')
    expect(p.dias[0].sesiones[0].ejercicios.map((x) => x.grupo)).toEqual(['A', 'A'])
    p = quitarEjercicio(p, 0, 0, 1)
    expect(p.dias[0].sesiones[0].ejercicios).toHaveLength(1)
  })

  it('horario: el final se calcula solo', () => {
    let p = agregarSesion(vacio(), 2, 'movilidad')
    p = cambiarDatosSesion(p, 2, 0, { desde: '07:00' })
    const s = p.dias[2].sesiones[0]
    expect(s.desde).toBe('07:00')
    expect(s.hasta).toBe(`07:${String(s.minutos).padStart(2, '0')}`)
  })

  it('mover, duplicar y borrar sesiones', () => {
    let p = agregarSesion(vacio(), 0, 'cardio')
    p = moverSesion(p, 0, 0, 3)
    expect(p.dias[0].sesiones).toHaveLength(0)
    expect(p.dias[3].sesiones).toHaveLength(1)
    p = moverSesion(p, 3, 0, 5, true)
    expect(p.dias[3].sesiones).toHaveLength(1)
    expect(p.dias[5].sesiones[0].id).not.toBe(p.dias[3].sesiones[0].id)
    p = borrarSesion(p, 5, 0)
    expect(p.dias[5].sesiones).toHaveLength(0)
  })
})
