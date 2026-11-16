import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { compararVersiones, decidir, elegirBundle } from './actualizarNativo'

describe('actualización de la app de Android', () => {
  it('compara versiones', () => {
    expect(compararVersiones('0.30.0', '0.29.9')).toBeGreaterThan(0)
    expect(compararVersiones('0.30.0', '0.30.0')).toBe(0)
    expect(compararVersiones('0.9.0', '0.10.0')).toBeLessThan(0)
    expect(compararVersiones('1.0', '1.0.1')).toBeLessThan(0)
  })
  it('decide qué hacer', () => {
    const info = { version: '0.31.0', url: 'x', apkMinima: '0.30.0' }
    expect(decidir(info, '0.31.0', '0.30.0')).toBe('nada')
    expect(decidir(info, '0.30.2', '0.30.0')).toBe('bajar')
    expect(decidir(info, '0.30.2', '0.29.0')).toBe('apk-nueva')
  })
  it('elige el bundle bajado más nuevo que no falló', () => {
    const b = [
      { id: 'a', version: '0.31.0', status: 'success' },
      { id: 'b', version: '0.32.0', status: 'pending' },
      { id: 'c', version: '0.33.0', status: 'error' },
      { id: 'd', version: '0.29.0', status: 'success' },
    ]
    expect(elegirBundle(b, '0.30.0')?.id).toBe('b')
    expect(elegirBundle(b, '0.32.0')).toBeUndefined()
  })
})
