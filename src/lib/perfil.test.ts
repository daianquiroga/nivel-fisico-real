import { describe, expect, it } from 'vitest'
import { ajustarObjetivos, horasDeSueno } from './perfil'

describe('objetivos (100 puntos)', () => {
  const base = { estetica: 50, condicion: 30, combate: 20 }
  const total = (o: typeof base) => o.estetica + o.condicion + o.combate

  it('sumar descuenta del objetivo con más puntos', () => {
    const o = ajustarObjetivos(base, 'combate', 10)
    expect(o).toEqual({ estetica: 40, condicion: 30, combate: 30 })
    expect(total(o)).toBe(100)
  })
  it('restar le da los puntos al siguiente', () => {
    expect(ajustarObjetivos(base, 'estetica', -10)).toEqual({ estetica: 40, condicion: 40, combate: 20 })
    expect(ajustarObjetivos(base, 'combate', -10)).toEqual({ estetica: 60, condicion: 30, combate: 10 })
  })
  it('no baja de 0 ni pasa de 100', () => {
    const cero = { estetica: 100, condicion: 0, combate: 0 }
    expect(ajustarObjetivos(cero, 'condicion', -10)).toEqual(cero)
    expect(ajustarObjetivos(cero, 'estetica', 10)).toEqual(cero)
  })
})

describe('horas de sueño', () => {
  it('cruza la medianoche', () => {
    expect(horasDeSueno('00:00', '06:30')).toBe(6.5)
    expect(horasDeSueno('23:30', '07:00')).toBe(7.5)
  })
})
