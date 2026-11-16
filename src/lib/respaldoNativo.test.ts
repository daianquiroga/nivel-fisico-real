import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { diasDesde, nombreRespaldo, sobrantes } from './respaldoNativo'

describe('respaldo automático', () => {
  it('se queda con las últimas 4 copias y no toca otros archivos', () => {
    const n = ['nivel-fisico-real-respaldo-2026-10-01.json', 'nivel-fisico-real-respaldo-2026-10-08.json', 'nivel-fisico-real-respaldo-2026-10-15.json', 'nivel-fisico-real-respaldo-2026-10-22.json', 'nivel-fisico-real-respaldo-2026-10-29.json', 'otra-cosa.txt']
    expect(sobrantes(n)).toEqual(['nivel-fisico-real-respaldo-2026-10-01.json'])
    expect(sobrantes(n.slice(0, 3))).toEqual([])
  })
  it('cuenta días y arma el nombre con la fecha', () => {
    expect(diasDesde('2026-11-01T12:00:00Z', new Date('2026-11-16T12:00:00Z'))).toBe(15)
    expect(diasDesde(undefined)).toBe(Infinity)
    expect(nombreRespaldo(new Date('2026-11-16T12:00:00Z'))).toBe('nivel-fisico-real-respaldo-2026-11-16.json')
  })
})
