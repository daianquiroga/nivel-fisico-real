import { describe, expect, it } from 'vitest'
import type { Lugar } from '../db/db'
import { ejercicio } from '../ejercicios'
import { semanaPorDefecto } from '../perfil'
import type { EjercicioPlan, EntradaPlan, SesionPlan } from './generador'
import { aplicarVersion, armarCola, cambiarPorZona, recomendar } from './sesion'

const ej = (id: string, series: number, grupo?: string, descansoSeg = 60): EjercicioPlan => ({
  id,
  patrones: [ejercicio(id)!.patron],
  rol: 'principal',
  series,
  rango: [8, 12],
  descansoSeg,
  grupo,
})
const sesion = (ejercicios: EjercicioPlan[], metodo: SesionPlan['metodo'] = 'clasico'): SesionPlan => ({
  id: 's1',
  tipo: 'fuerza',
  titulo: 'Prueba',
  lugar: 'Casa X',
  minutos: 40,
  intensidad: 'fuerte',
  metodo,
  ejercicios,
})

describe('cola de series', () => {
  it('clásico: todas las series de cada ejercicio, sin pausa al final', () => {
    const c = armarCola(sesion([ej('flexion', 2, undefined, 90), ej('sentadilla', 2)]))
    expect(c.map((p) => `${p.ej}-${p.serie}-${p.descanso}`)).toEqual(['0-1-90', '0-2-90', '1-1-60', '1-2-0'])
  })

  it('superseries: alterna y descansa al final de cada vuelta', () => {
    const c = armarCola(sesion([ej('flexion', 2, 'A', 60), ej('remo-banda', 2, 'A', 90)], 'superseries'))
    expect(c.map((p) => `${p.ej}-${p.serie}-${p.descanso}`)).toEqual(['0-1-0', '1-1-90', '0-2-0', '1-2-0'])
  })

  it('circuito: 15 s entre ejercicios y 90 s entre vueltas', () => {
    const c = armarCola(sesion([ej('flexion', 2, 'C'), ej('sentadilla', 2, 'C'), ej('plancha', 2, 'C')], 'circuito'))
    expect(c.map((p) => p.descanso)).toEqual([15, 15, 90, 15, 15, 0])
  })
})

describe('versiones de la sesión', () => {
  const base = sesion([ej('flexion', 3), ej('sentadilla', 3), ej('remo-banda', 3), ej('plancha', 2), { ...ej('gato-camello', 1), rol: 'movilidad' }])

  it('reducida: una serie menos', () => {
    const r = aplicarVersion(base, 'reducida')
    expect(r.ejercicios.map((x) => x.series)).toEqual([2, 2, 2, 1, 1])
  })

  it('mínima: 3 ejercicios en circuito de 2 vueltas', () => {
    const r = aplicarVersion(base, 'minima')
    expect(r.ejercicios).toHaveLength(3)
    expect(r.ejercicios.every((x) => x.series === 2 && x.grupo === 'C')).toBe(true)
  })

  it('solo movilidad', () => {
    const r = aplicarVersion(base, 'movilidad')
    expect(r.ejercicios.every((x) => ejercicio(x.id)!.patron === 'movilidad')).toBe(true)
  })

  it('molestia en una zona: cambia lo que hay que evitar', () => {
    const casa: Lugar = { nombre: 'Casa X', tipo: 'casa', equipo: ['mancuernas'], espacio: '2x2' }
    const entrada: EntradaPlan = {
      objetivos: { estetica: 30, condicion: 40, combate: 30 },
      zonas: [],
      limitaciones: [],
      lugares: [casa],
      semana: semanaPorDefecto(),
      nivelFuerza: 3,
      nivelCardio: 3,
      escalones: {},
    }
    const s = sesion([ej('press-hombros-mancuernas', 3), ej('sentadilla-goblet', 3)])
    const r = cambiarPorZona(s, entrada, 'hombro')
    expect(r.ejercicios[0].id).not.toBe('press-hombros-mancuernas')
    expect(ejercicio(r.ejercicios[0].id)!.limitaciones.hombro?.nivel).not.toBe('evitar')
    expect(r.ejercicios[1].id).toBe('sentadilla-goblet')
  })
})

describe('control diario', () => {
  const ok = { fecha: '2026-01-02', sueno: 7.5, energia: 4, dolor: 'ninguno' as const }
  it('todo bien: completa', () => expect(recomendar(ok).version).toBe('completa'))
  it('poco sueño: reducida', () => expect(recomendar({ ...ok, sueno: 5 }).version).toBe('reducida'))
  it('dos días cansado: mínima', () => expect(recomendar({ ...ok, energia: 2 }, { ...ok, fecha: '2026-01-01', energia: 1 }).version).toBe('minima'))
  it('dolor: solo movilidad y consultar', () => {
    const r = recomendar({ ...ok, dolor: 'dolor', zona: 'rodilla' })
    expect(r.version).toBe('movilidad')
    expect(r.consultar).toBe(true)
  })
})
