import { describe, expect, it } from 'vitest'
import { semanaPorDefecto } from '../perfil'
import { fuentesRutinas, semanaLadoALado } from './fuentes'
import { escalonesIniciales, type EntradaPlan, type PlanSemana, type SesionPlan } from './generador'
import { PLANTILLAS } from './plantillas'
import type { RutinaGuardada } from './rutinas'

const entrada: EntradaPlan = {
  objetivos: { estetica: 60, condicion: 30, combate: 10 },
  zonas: [],
  limitaciones: [],
  lugares: [{ nombre: 'Lugar', tipo: 'gimnasio', equipo: [], espacio: '1x1' }],
  semana: semanaPorDefecto('Lugar'),
  nivelFuerza: 2,
  nivelCardio: 2,
  escalones: escalonesIniciales(2),
}

const sesion = (titulo: string, desde: string | undefined, minutos: number): SesionPlan => ({ id: titulo, titulo, desde, minutos, tipo: 'fuerza', ejercicios: [] }) as unknown as SesionPlan
const plan = (dias: Record<number, SesionPlan[]>): PlanSemana => ({ creado: '2026-01-01T00:00:00.000Z', dias: Array.from({ length: 7 }, (_, d) => ({ sesiones: dias[d] ?? [] })) }) as PlanSemana

describe('rutinas para comparar', () => {
  const actual = plan({ 0: [sesion('Fuerza A', '19:00', 60)] })
  const guardada: RutinaGuardada = { id: 'r1', nombre: 'Mi rutina del gimnasio de siempre', origen: 'propia', creado: '2026-01-02T00:00:00.000Z', plan: plan({ 1: [sesion('Piernas', '08:00', 50)] }) }

  it('junta tu plan, las guardadas, las plantillas y el sistema completo', () => {
    const f = fuentesRutinas({ actual, rutinas: [guardada], entrada, plantillas: true })
    expect(f.map((x) => x.clave)).toEqual(['actual', 'r1', ...PLANTILLAS.map((p) => `plantilla:${p.id}`), 'sistema'])
    expect(f[1].corto.length).toBeLessThanOrEqual(18)
    expect(f.every((x) => x.plan.dias.length === 7)).toBe(true)
  })

  it('sin plantillas (Combinar) y sin días cargados', () => {
    expect(fuentesRutinas({ actual, rutinas: [guardada], entrada }).map((x) => x.clave)).toEqual(['actual', 'r1', 'sistema'])
    expect(fuentesRutinas({ actual: null, rutinas: [], entrada: null, plantillas: true })).toEqual([])
  })

  it('semana lado a lado: día por día, ordenada por hora y sin las movilidades opcionales', () => {
    const a = plan({ 0: [sesion('Cardio', '20:00', 30), sesion('Fuerza', '07:00', 60)], 3: [sesion('Movilidad opcional', '10:00', 10)] })
    const b = plan({ 3: [sesion('Combate', undefined, 45)] })
    const s = semanaLadoALado(a, b)
    expect(s).toHaveLength(7)
    expect(s[0].a.map((x) => x.titulo)).toEqual(['Fuerza', 'Cardio'])
    expect(s[0].b).toEqual([])
    expect(s[3].a).toEqual([])
    expect(s[3].b).toEqual([{ desde: undefined, titulo: 'Combate', minutos: 45 }])
  })
})
