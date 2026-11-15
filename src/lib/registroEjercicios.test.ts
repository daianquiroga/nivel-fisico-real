import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { guardarSesion, todasLasSesiones } from './registroEjercicios'

describe('registro de ejercicios', () => {
  it('guarda y lee sesiones en orden', async () => {
    await guardarSesion('flexion', [{ reps: 10, rir: 2 }])
    await new Promise((r) => setTimeout(r, 5))
    await guardarSesion('sentadilla-goblet', [{ carga: 10, reps: 12, rir: 2 }])
    const todas = await todasLasSesiones()
    expect(todas.map((s) => s.ejercicio)).toEqual(['flexion', 'sentadilla-goblet'])
    expect(todas[1].series[0].carga).toBe(10)
  })
})
