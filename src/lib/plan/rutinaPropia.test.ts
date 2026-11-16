import { describe, expect, it } from 'vitest'
import { armarPlanPropio, leerTexto, reconocer, seleccionDesdePlan } from './rutinaPropia'

describe('rutina propia', () => {
  it('reconoce nombres de gimnasio', () => {
    expect(reconocer('Press banca')?.id).toBe('press-banca-barra')
    expect(reconocer('press de banca con mancuernas')?.id).toBe('press-banca-mancuernas')
    expect(reconocer('Sillón de cuádriceps')?.id).toBe('extension-cuadriceps')
    expect(reconocer('Peso muerto rumano')?.id).toBe('peso-muerto-rumano-mancuernas')
    expect(reconocer('Clase de Muay Thai')?.id).toBe('clase-golpes')
    expect(reconocer('Sentadilla goblet con mancuerna')?.id).toBe('sentadilla-goblet')
    expect(reconocer('zzz')).toBeUndefined()
  })

  it('lee un texto con días, horas, series y minutos', () => {
    const r = leerTexto(`Lunes 19:30
- Press banca 4x10
- Sentadilla 3 x 8-12
Miércoles 7h
Caminata 30 min
Viernes: dominadas 3x6, peso muerto 3x5
Sábado
Algo raro inventado 3x10`)
    expect(r.dias.map((d) => d.dia)).toEqual([0, 2, 4])
    expect(r.dias[0].desde).toBe('19:30')
    expect(r.dias[0].items).toEqual([
      { id: 'press-banca-barra', series: 4, rango: [10, 10] },
      { id: 'sentadilla', series: 3, rango: [8, 12] },
    ])
    expect(r.dias[1].desde).toBe('07:00')
    expect(r.dias[1].items).toEqual([{ id: 'caminata-rapida', rango: [30, 30] }])
    expect(r.dias[2].items.map((x) => x.id)).toEqual(['dominada', 'peso-muerto-barra'])
    expect(r.noReconocidas).toEqual([{ dia: 5, texto: 'Algo raro inventado 3x10' }])
  })

  it('"Día 1, Día 2" va a lunes y martes', () => {
    expect(leerTexto('Día 1\nflexiones 3x10\nDía 2\nplancha 3x30').dias.map((d) => d.dia)).toEqual([0, 1])
  })

  it('arma el plan: fuerza primero, cardio después, con horario de fin', () => {
    const p = armarPlanPropio([{ dia: 0, desde: '19:00', items: [{ id: 'caminata-rapida', rango: [20, 20] }, { id: 'press-banca-barra', series: 4, rango: [8, 10] }] }, { dia: 3, items: [{ id: 'sombra', rango: [18, 18] }] }])
    const lunes = p.dias[0].sesiones[0]
    expect(lunes.tipo).toBe('fuerza')
    expect(lunes.ejercicios.map((x) => x.id)).toEqual(['press-banca-barra', 'caminata-rapida'])
    expect(lunes.ejercicios[0].series).toBe(4)
    expect(lunes.hasta).toBeDefined()
    expect(p.dias[3].sesiones[0].titulo).toBe('Mi rutina · combate')
    expect(p.editado).toBe(true)
    // Ida y vuelta.
    expect(seleccionDesdePlan(p).map((d) => d.dia)).toEqual([0, 3])
  })
})
