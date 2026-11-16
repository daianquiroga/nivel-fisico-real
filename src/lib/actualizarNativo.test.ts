import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { compararVersiones, decidir } from './actualizarNativo'

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
})
