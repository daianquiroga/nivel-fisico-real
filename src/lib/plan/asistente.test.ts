import { describe, expect, it } from 'vitest'
import { semanaPorDefecto } from '../perfil'
import { escalonesIniciales, generarPlan, type EntradaPlan, type PlanSemana } from './generador'
import { completarHorarios, entradaDesdeRespuestas, horariosDe, objetivosDe, respuestasIniciales, sinOpcionales, sinVacias, sumarEntrenamiento } from './asistente'

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

describe('horarios por día', () => {
  it('cada día con su hora y su tiempo, y un segundo horario', () => {
    const horarios = [[], [{ hora: '07:00', minutos: 30 }], [], [{ hora: '19:00', minutos: 60 }, { hora: '07:00', minutos: 20 }], [], [], []]
    const r = { dias: [1, 3], hora: '20:00', lugar: 'Casa', minutos: 45, horarios, prioridades: ['cardio' as const], zonas: [] }
    expect(horariosDe(r)[1]).toEqual([{ hora: '07:00', minutos: 30 }])
    expect(horariosDe({ ...r, horarios: undefined })[3]).toEqual([{ hora: '20:00', minutos: 45 }])
    const e = entradaDesdeRespuestas(base, r)
    expect(e.semana.huecosPorDia?.[3]).toEqual([{ desde: '19:00', hasta: '20:00' }, { desde: '07:00', hasta: '07:20' }])
    const plan = completarHorarios(sinOpcionales(generarPlan(e)), r)
    expect(plan.dias[1].sesiones[0].desde).toBe('07:00')
    expect(plan.dias[1].sesiones[0].minutos).toBeLessThanOrEqual(30)
    // El jueves: el entrenamiento principal en el horario más largo y uno corto de cardio a la mañana.
    expect(plan.dias[3].sesiones.map((s) => s.desde)).toEqual(['07:00', '19:00'])
    expect(plan.dias[3].sesiones[0].titulo).toBe('Cardio')
    expect(plan.dias[3].sesiones[0].minutos).toBe(20)
  })
})

describe('entrenamientos extra y limpieza', () => {
  const vacio = (): PlanSemana => ({ creado: '2026-01-01', dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) })
  it('suma un segundo entrenamiento al mismo día, ordenado por hora', () => {
    let p = sumarEntrenamiento(vacio(), 0, 'cardio', '19:00')
    p = sumarEntrenamiento(p, 0, 'combate', '07:30')
    expect(p.dias[0].sesiones.map((s) => s.titulo)).toEqual(['Combate: pies y sombra', 'Cardio'])
    expect(p.dias[0].sesiones[0].hasta).toBe('07:45')
    expect(new Set(p.dias[0].sesiones.map((s) => s.id)).size).toBe(2)
  })
  it('saca movilidades opcionales y entrenamientos vacíos', () => {
    const p = vacio()
    p.dias[1].sesiones.push({ ...sumarEntrenamiento(vacio(), 1, 'movilidad', '08:00').dias[1].sesiones[0], titulo: 'Movilidad (opcional, 10 minutos)' })
    p.dias[2].sesiones.push({ ...sumarEntrenamiento(vacio(), 2, 'cardio', '08:00').dias[2].sesiones[0], ejercicios: [] })
    expect(sinOpcionales(p).dias[1].sesiones).toHaveLength(0)
    expect(sinVacias(p).dias[2].sesiones).toHaveLength(0)
  })
})
