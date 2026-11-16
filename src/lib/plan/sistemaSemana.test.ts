import { describe, expect, it } from 'vitest'
import { semanaPorDefecto } from '../perfil'
import { escalonesIniciales, type EntradaPlan, type PlanSemana } from './generador'
import { entradaDesdeRespuestas } from './asistente'
import { semanaSistema, sumarAlPlan, temasParaDias } from './sistemaSemana'

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

describe('semana del sistema completo', () => {
  it('con 3 días prioriza boxeo, muay thai e integración, en el orden de la semana', () => {
    const t = temasParaDias([0, 2, 4])
    expect([...t.values()].map((x) => x.clave)).toEqual(['boxeo', 'muaythai', 'integracion'])
    expect([...temasParaDias([0, 1, 2, 3, 4, 5]).keys()]).toEqual([0, 1, 2, 3, 4])
  })
  it('respeta tus horarios y tu equipo: 60 % combate y el resto complemento', () => {
    const e = entradaDesdeRespuestas(base, { dias: [0, 1, 2, 3, 4], hora: '19:00', lugar: 'Casa', minutos: 60, prioridades: ['defensa'], zonas: [] })
    const p = semanaSistema(e)
    const lunes = p.dias[0].sesiones[0]
    expect(lunes.desde).toBe('19:00')
    expect(lunes.minutos).toBe(60)
    expect(lunes.ejercicios.slice(0, 2).map((x) => x.id)).toEqual(['juego-pies', 'sombra'])
    expect(lunes.ejercicios[0].rango[0] + lunes.ejercicios[1].rango[0]).toBe(36)
    expect(lunes.ejercicios.map((x) => x.id)).toContain('sentadilla-goblet')
    expect(p.dias[5].sesiones).toHaveLength(0)
  })
  it('al sumarlo a un plan, va después de lo que ya hay ese día', () => {
    const actual: PlanSemana = { creado: 'x', dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) }
    actual.dias[0].sesiones.push({ id: 'a', tipo: 'fuerza', titulo: 'Fuerza', desde: '18:00', hasta: '18:45', minutos: 45, intensidad: 'fuerte', metodo: 'clasico', ejercicios: [] })
    const e = entradaDesdeRespuestas(base, { dias: [0], hora: '18:00', lugar: 'Casa', minutos: 30, prioridades: [], zonas: [] })
    const p = sumarAlPlan(actual, semanaSistema(e))
    expect(p.dias[0].sesiones.map((s) => s.desde)).toEqual(['18:00', '19:00'])
  })
})
