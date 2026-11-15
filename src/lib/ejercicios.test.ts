import { describe, expect, it } from 'vitest'
import { tieneDibujo } from '../content/dibujos-ejercicios'
import type { Lugar } from './db/db'
import { EJERCICIOS, avisosLimitacion, ejercicio, equipoDisponible, escaleraDe, evitarPorLimitacion, revisarContenido, sePuedeHacer } from './ejercicios'

describe('biblioteca de ejercicios', () => {
  it('el contenido es coherente', () => {
    expect(revisarContenido()).toEqual([])
    expect(EJERCICIOS.length).toBeGreaterThanOrEqual(40)
  })

  it('todos los ejercicios tienen dibujo (regla 8 de CLAUDE.md)', () => {
    expect(EJERCICIOS.filter((e) => !tieneDibujo(e.id)).map((e) => e.id)).toEqual([])
  })

  it('equipo disponible y qué se puede hacer', () => {
    const lugares: Lugar[] = [
      { nombre: 'Casa', tipo: 'casa', equipo: ['mancuernas', 'barra-dominadas'], espacio: '1x1' },
      { nombre: 'Gym', tipo: 'gimnasio', equipo: [], espacio: 'amplio' },
    ]
    const soloCasa = equipoDisponible([lugares[0]])
    expect(sePuedeHacer(ejercicio('press-piso-mancuernas')!, soloCasa)).toBe(true)
    expect(sePuedeHacer(ejercicio('press-banda')!, soloCasa)).toBe(false)
    expect(sePuedeHacer(ejercicio('flexion')!, new Set())).toBe(true)
    expect(sePuedeHacer(ejercicio('prensa')!, equipoDisponible(lugares))).toBe(true)
  })

  it('limitaciones', () => {
    const flexion = ejercicio('flexion')!
    expect(avisosLimitacion(flexion, ['muneca'])[0].nivel).toBe('adaptar')
    expect(evitarPorLimitacion(ejercicio('press-banca-barra')!, ['muneca'])).toBe(true)
    expect(evitarPorLimitacion(flexion, ['rodilla'])).toBe(false)
  })

  it('escaleras', () => {
    expect(escaleraDe('flexion')).toMatchObject({ indice: 4 })
    expect(escaleraDe('curl-biceps')).toBeNull()
  })
})
