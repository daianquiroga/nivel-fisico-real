import { describe, expect, it } from 'vitest'
import { faltoAyer, intencionPorDefecto, logros, lunesDe, racha, revisionMes, semanaCumplida } from './habitos'
import { generarIcs } from './ics'
import type { PlanSemana, SesionPlan } from './plan/generador'

const ses = (o: Partial<SesionPlan> = {}): SesionPlan => ({
  id: 's1',
  tipo: 'fuerza',
  titulo: 'Fuerza · tren superior',
  lugar: 'Casa X',
  desde: '19:30',
  hasta: '20:15',
  minutos: 45,
  intensidad: 'fuerte',
  metodo: 'clasico',
  ejercicios: [{ id: 'flexion', patrones: ['empuje'], rol: 'principal', series: 3, rango: [8, 12], descansoSeg: 90 }],
  ...o,
})
const plan = (dias: number[]): PlanSemana => ({
  creado: '2025-01-01T00:00:00',
  dias: Array.from({ length: 7 }, (_, i) => ({ sesiones: dias.includes(i) ? [ses({ id: `s${i}` })] : [] })),
})

describe('constancia', () => {
  it('lunes de la semana', () => {
    expect(lunesDe('2026-11-19')).toBe('2026-11-16') // jueves → lunes
    expect(lunesDe('2026-11-22')).toBe('2026-11-16') // domingo → lunes
  })

  it('semana cumplida con el 70 %', () => {
    expect(semanaCumplida(3, 4)).toBe(true) // 70 % de 4 = 2,8 → 3
    expect(semanaCumplida(2, 4)).toBe(false)
  })

  it('racha en semanas: la semana actual sin cumplir no corta', () => {
    const hoy = new Date('2026-11-18T10:00:00') // miércoles
    // Semanas del 2/11 y del 9/11 con 3 de 3; la actual (16/11) con 1: no suma pero no corta.
    const hechas = ['2026-11-09', '2026-11-11', '2026-11-13', '2026-11-03', '2026-11-05', '2026-11-07', '2026-11-16']
    expect(racha(hechas, 3, hoy)).toBe(2)
    expect(racha([...hechas, '2026-11-17', '2026-11-18'], 3, hoy)).toBe(3)
  })

  it('faltó ayer', () => {
    const hoy = new Date('2026-11-18T10:00:00') // ayer: martes (día 1)
    expect(faltoAyer(plan([1]), [], hoy)).toBe(true)
    expect(faltoAyer(plan([1]), ['2026-11-17T20:00:00'], hoy)).toBe(false)
    expect(faltoAyer(plan([2]), [], hoy)).toBe(false)
  })

  it('intención por defecto', () => {
    expect(intencionPorDefecto('Lunes', ses())).toBe('El lunes a las 19:30, cuando llego a Casa X, me cambio y hago fuerza (tren superior).')
  })

  it('logros', () => {
    const l = logros({ sesiones: ['a'], evaluaciones: 1, controles: [], diasAgua: [], diasPasosMeta: 0, medidas: 0, fotos: 0, rachaSemanas: 0, semanasSinDobleFalta: 0 })
    expect(l.find((x) => x.id === 'primera')!.logrado).toBe(true)
    expect(l.find((x) => x.id === 'diez')!.progreso).toBe('1 de 10')
  })

  it('revisión del mes', () => {
    expect(revisionMes(4, 12, [], []).sugerencia).toContain('achicá')
    expect(revisionMes(11, 12, [], ['Remo']).sugerencia).toContain('Remo')
    expect(revisionMes(12, 12, ['Sentadilla'], []).cumplimiento).toBe(1)
  })
})

describe('calendario .ics', () => {
  it('un evento semanal por sesión con horario, con aviso 15 minutos antes', () => {
    const ics = generarIcs(plan([0, 3]), { desde: new Date('2026-11-18T10:00:00'), semanas: 4, intenciones: { s0: 'El lunes, cuando llego, entreno.' } })
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics).toContain('DTSTART:20261123T193000') // próximo lunes
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH;COUNT=4')
    expect(ics).toContain('TRIGGER:-PT15M')
    expect(ics).toContain('El lunes\\, cuando llego\\, entreno.')
  })
})

describe('sin faltar dos veces seguidas', () => {
  it('cuenta desde la última doble falta', async () => {
    const { semanasSinDobleFalta } = await import('./habitos')
    const p = { ...plan([0, 2, 4]), creado: '2026-10-05T10:00:00' } // lunes 5/10
    const hoy = new Date('2026-11-16T10:00:00')
    // Todo hecho salvo miércoles 14/10 y viernes 16/10 (doble falta).
    const fechas: string[] = []
    for (let d = new Date('2026-10-05T12:00:00'); d < hoy; d.setDate(d.getDate() + 1)) {
      const f = d.toISOString().slice(0, 10)
      if ([1, 3, 5].includes(d.getDay()) && f !== '2026-10-14' && f !== '2026-10-16') fechas.push(f)
    }
    expect(semanasSinDobleFalta(p, fechas, hoy)).toBe(4) // del 16/10 al 16/11
    expect(semanasSinDobleFalta(p, [...fechas, '2026-10-14'], hoy)).toBe(6)
  })
})
