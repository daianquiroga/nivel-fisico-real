import { describe, expect, it } from 'vitest'
import { semanaPorDefecto } from '../perfil'
import { escalonesIniciales, generarPlan } from './generador'
import { faseDe, fasesDe, ordenRecomendado, revisarOrden, revisarOrden as revisar } from './orden'
import { PLANTILLAS, semanaPlantilla } from './plantillas'

const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

describe('orden de los ejercicios', () => {
  it('cada ejercicio cae en su parte', () => {
    expect(faseDe('gato-camello')).toBe('calor')
    expect(faseDe('estiramiento-flexor-cadera')).toBe('vuelta')
    expect(faseDe('salto-vertical')).toBe('potencia')
    expect(faseDe('burpee-explosivo')).toBe('potencia')
    expect(faseDe('burpee')).toBe('cardio')
    expect(faseDe('sombra')).toBe('tecnica')
  })

  it('ordena por partes y respeta el orden propio dentro de cada una', () => {
    const xs = [{ id: 'burpee' }, { id: 'estiramiento-flexor-cadera' }, { id: 'sentadilla' }, { id: 'flexion' }, { id: 'salto-vertical' }, { id: 'gato-camello' }]
    expect(ids(ordenRecomendado(xs))).toEqual(['gato-camello', 'salto-vertical', 'sentadilla', 'flexion', 'burpee', 'estiramiento-flexor-cadera'])
  })

  it('avisa lo que está fuera de lugar, sin marcar la movilidad del final', () => {
    const p = revisarOrden([{ id: 'sentadilla' }, { id: 'salto-vertical' }, { id: 'gato-camello' }])
    expect(p).toHaveLength(1)
    expect(p[0].id).toBe('salto-vertical')
    expect(p[0].texto).toMatch(/conviene antes que/)
    expect(revisarOrden([{ id: 'salto-vertical' }, { id: 'sentadilla' }, { id: 'burpee' }, { id: 'gato-camello' }])).toEqual([])
    expect(fasesDe([{ id: 'sentadilla' }, { id: 'salto-vertical' }]).map((f) => f.fase)).toEqual(['potencia', 'principal'])
  })
})

describe('lo que arma la app ya viene en buen orden', () => {
  it('el generador no deja sesiones con el orden para corregir', () => {
    const s = semanaPorDefecto()
    for (const k of ['laboral', 'sabado', 'domingo'] as const) s.tipos[k].huecos = [{ desde: '19:00', hasta: '20:00' }]
    s.lugaresPorDia = [['Casa'], [], ['Casa'], [], ['Casa'], [], []]
    const lugares = [{ nombre: 'Casa', tipo: 'casa' as const, equipo: ['mancuernas', 'barra-dominadas'], espacio: '2x2' as const }]
    for (const p of PLANTILLAS) {
      const plan = semanaPlantilla(p, { objetivos: { estetica: 50, condicion: 30, combate: 20 }, zonas: [], limitaciones: [], lugares, semana: s, nivelFuerza: 2, nivelCardio: 2, escalones: escalonesIniciales(2) })
      for (const d of plan.dias) for (const x of d.sesiones) expect(revisar(x.ejercicios), p.id + ' ' + x.ejercicios.map((e) => e.id).join(',')).toEqual([])
    }
    for (const objetivos of [{ estetica: 80, condicion: 10, combate: 10 }, { estetica: 10, condicion: 80, combate: 10 }, { estetica: 10, condicion: 10, combate: 80 }]) {
      const plan = generarPlan({ objetivos, zonas: [], limitaciones: [], lugares: [{ nombre: 'Casa', tipo: 'casa', equipo: ['mancuernas', 'barra-dominadas'], espacio: '2x2' }], semana: s, nivelFuerza: 2, nivelCardio: 2, escalones: escalonesIniciales(2) })
      for (const d of plan.dias) for (const x of d.sesiones) expect(revisar(x.ejercicios), x.titulo + ' ' + x.ejercicios.map((e) => e.id).join(',')).toEqual([])
    }
  })
})
