import { describe, expect, it } from 'vitest'
import { agendaVacia, agregarBloque, borrarBloque, editarBloque, itemsDelDia, superposiciones } from './agenda'
import { semanaPorDefecto } from './perfil'

const semana = () => {
  const s = semanaPorDefecto()
  s.tipos.laboral = { despertar: '07:00', dormir: '23:00', huecos: [{ desde: '19:00', hasta: '20:00' }] }
  return s
}

describe('agenda', () => {
  it('plantilla + pausas activas en un bloque largo de trabajo', () => {
    const a = agregarBloque(agendaVacia(), { tipo: 'fijo', nombre: 'Trabajo', desde: '09:00', hasta: '13:00' }, { tipo: 'laboral' })
    const items = itemsDelDia({ fecha: '2026-01-05', dia: 0, semana: semana(), agenda: a })
    const micro = items.filter((x) => x.tipo === 'micro').map((x) => x.desde)
    // 09:00 + 90 = 10:30; 12:00 también entra (termina 12:05, antes de 12:45)
    expect(micro).toEqual(['10:30', '12:00'])
    expect(items.some((x) => x.tipo === 'sueno' && x.hasta === '07:00')).toBe(true)
    expect(items.some((x) => x.tipo === 'libre' && x.desde === '19:00')).toBe(true)
  })

  it('cambio puntual sin romper la plantilla', () => {
    let a = agregarBloque(agendaVacia(), { tipo: 'fijo', nombre: 'Trabajo', desde: '09:00', hasta: '17:00' }, { tipo: 'laboral' })
    const id = a.plantillas.laboral![0].id
    a = editarBloque(a, id, { hasta: '13:00' }, 'laboral', '2026-01-06', true)
    const martes = itemsDelDia({ fecha: '2026-01-06', dia: 1, semana: semana(), agenda: a }).find((x) => x.tipo === 'fijo')!
    const miercoles = itemsDelDia({ fecha: '2026-01-07', dia: 2, semana: semana(), agenda: a }).find((x) => x.tipo === 'fijo')!
    expect(martes.hasta).toBe('13:00')
    expect(miercoles.hasta).toBe('17:00')
    a = borrarBloque(a, id, 'laboral', '2026-01-08', true)
    expect(itemsDelDia({ fecha: '2026-01-08', dia: 3, semana: semana(), agenda: a }).some((x) => x.tipo === 'fijo')).toBe(false)
  })

  it('retest y superposiciones', () => {
    const a = agregarBloque(agendaVacia(), { tipo: 'comida', nombre: 'Cena', desde: '19:30', hasta: '20:15' }, { fecha: '2026-01-05' })
    const items = itemsDelDia({ fecha: '2026-01-05', dia: 0, semana: semana(), agenda: a, retest: true })
    const retest = items.find((x) => x.tipo === 'retest')!
    expect(retest.desde).toBe('19:00')
    expect(superposiciones(items)).toHaveLength(1)
  })
})
