import { describe, expect, it } from 'vitest'
import { ejercicio } from '../ejercicios'
import { semanaPorDefecto } from '../perfil'
import { entradaDesdeRespuestas } from './asistente'
import { escalonesIniciales, type EntradaPlan } from './generador'
import { PLANTILLAS, semanaPlantilla } from './plantillas'

const base = (equipo: string[], tipo: 'casa' | 'gimnasio' = 'casa'): EntradaPlan => ({
  objetivos: { estetica: 60, condicion: 30, combate: 10 },
  zonas: [],
  limitaciones: [],
  lugares: [{ nombre: 'Lugar', tipo, equipo, espacio: '1x1' }],
  semana: semanaPorDefecto('Lugar'),
  nivelFuerza: 2,
  nivelCardio: 2,
  escalones: escalonesIniciales(2),
})

describe('plantillas de gimnasio', () => {
  it('todas las opciones existen en la biblioteca', () => {
    for (const p of PLANTILLAS) for (const d of Object.values(p.dias)) for (const s of d.ejercicios) for (const o of s.opciones) expect(ejercicio(o), `${p.id}: ${o}`).toBeTruthy()
  })
  it('elige según el equipo: barra en el gimnasio, mancuernas en casa', () => {
    const p = PLANTILLAS.find((x) => x.id === 'cuerpo-completo-3')!
    const r = { dias: [0, 2, 4], hora: '19:00', lugar: 'Lugar', minutos: 60, prioridades: [], zonas: [] }
    const gym = semanaPlantilla(p, entradaDesdeRespuestas(base([], 'gimnasio'), r))
    expect(gym.dias[0].sesiones[0].ejercicios[0].id).toBe('sentadilla-barra')
    const casa = semanaPlantilla(p, entradaDesdeRespuestas(base(['mancuernas']), r))
    expect(casa.dias[0].sesiones[0].ejercicios[0].id).toBe('sentadilla-goblet')
    expect(casa.dias[2].sesiones[0].titulo).toBe('Cuerpo completo B')
    expect(casa.dias[0].sesiones[0].desde).toBe('19:00')
  })
})
