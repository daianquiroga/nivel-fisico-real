import { describe, expect, it } from 'vitest'
import { semanaPorDefecto } from '../perfil'
import { escalonesIniciales, generarPlan, type EntradaPlan } from './generador'
import { entradaDesdeRespuestas, objetivosDe, respuestasIniciales } from './asistente'

const base: EntradaPlan = {
  objetivos: { estetica: 34, condicion: 33, combate: 33 },
  zonas: [],
  limitaciones: [],
  lugares: [{ nombre: 'Casa', tipo: 'casa', equipo: ['mancuernas'], espacio: '1x1' }],
  semana: semanaPorDefecto('Casa'),
  nivelFuerza: 2,
  nivelCardio: 2,
  escalones: escalonesIniciales(2),
}

describe('asistente de rutina', () => {
  it('reparte los objetivos según lo que se prioriza y suman 100', () => {
    expect(objetivosDe(['musculo'])).toEqual({ estetica: 100, condicion: 0, combate: 0 })
    const o = objetivosDe(['cardio', 'defensa'])
    expect(o.estetica + o.condicion + o.combate).toBe(100)
    expect(o.combate).toBeGreaterThan(40)
    expect(objetivosDe([])).toEqual({ estetica: 34, condicion: 33, combate: 33 })
  })

  it('arma la semana con los días, la hora y el tiempo elegidos', () => {
    const e = entradaDesdeRespuestas(base, { dias: [1, 3], hora: '07:00', lugar: 'Casa', minutos: 30, prioridades: ['musculo'], zonas: ['brazos'] })
    expect(e.semana.lugaresPorDia.map((l) => l.length)).toEqual([0, 1, 0, 1, 0, 0, 0])
    expect(e.semana.tipos.laboral.huecos).toEqual([{ desde: '07:00', hasta: '07:30' }])
    const plan = generarPlan(e)
    const conSesion = plan.dias.map((d) => d.sesiones.filter((s) => !s.titulo.includes('opcional')).length)
    expect(conSesion).toEqual([0, 1, 0, 1, 0, 0, 0])
    expect(plan.dias[1].sesiones[0].desde).toBe('07:00')
    expect(plan.dias[1].sesiones[0].minutos).toBeLessThanOrEqual(30)
  })

  it('bajar grasa suma definición y moverse mejor suma postura', () => {
    const e = entradaDesdeRespuestas(base, { dias: [0], hora: '19:00', lugar: 'Casa', minutos: 45, prioridades: ['grasa', 'movilidad'], zonas: [] })
    expect(e.zonas).toEqual(['definicion', 'postura'])
  })

  it('arranca con lo que ya cargó la persona', () => {
    const r = respuestasIniciales(base)
    expect(r.dias).toEqual([0, 1, 2, 3, 4, 5])
    expect(r.hora).toBe('20:00')
    expect(r.minutos).toBe(60)
    expect(r.lugar).toBe('Casa')
  })
})
