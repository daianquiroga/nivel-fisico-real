import { describe, expect, it } from 'vitest'
import { faltasSeguidas } from '../habitos'
import type { PlanSemana } from '../plan/generador'
import { evaluarEtapa } from './etapas'
import { consejos, mejorasRetest, subaCintura, type DatosCoach } from './reglas'

const base: DatosCoach = {
  hoy: '2026-11-18',
  limitaciones: [],
  faltasSeguidas: 0,
  ejercicios: [],
  cinturas: [],
  objetivoGrasa: false,
  evaluaciones: [],
}
const ids = (d: Partial<DatosCoach>, nivel: 'principiante' | 'intermedio' | 'avanzado' = 'intermedio') => consejos({ ...base, ...d }, nivel).map((c) => c.id)
const serie = (reps: number, rir = 2) => ({ reps, rir })

describe('coach: reglas', () => {
  it('sin datos no dice nada', () => {
    expect(ids({})).toEqual([])
  })

  it('molestia hoy → modo limitación con botón; si ya está activo, sin botón', () => {
    const control = { fecha: '2026-11-18', sueno: 8, energia: 4, dolor: 'molestia' as const, zona: 'rodilla' }
    const [c] = consejos({ ...base, control, nombreZona: 'Rodilla' }, 'intermedio')
    expect(c.id).toBe('limitacion-rodilla')
    expect(c.accion).toEqual({ tipo: 'limitacion', texto: 'Activar cuidado de rodilla', valor: 'rodilla' })
    expect(consejos({ ...base, control, limitaciones: ['rodilla'] }, 'intermedio')[0].accion).toBeUndefined()
    // El control de otro día no cuenta.
    expect(ids({ control: { ...control, fecha: '2026-11-17' } })).toEqual([])
  })

  it('sueño menor a 6 h → reducida, y el tono cambia con el nivel', () => {
    const control = { fecha: '2026-11-18', sueno: 5.5, energia: 3, dolor: 'ninguno' as const }
    const p = consejos({ ...base, control, rutaHoy: '/entrenar/2/0' }, 'principiante')[0]
    const a = consejos({ ...base, control }, 'avanzado')[0]
    expect(p.id).toBe('sueno')
    expect(p.texto).toContain('5,5 horas')
    expect(p.pasos?.length).toBe(3)
    expect(p.accion).toEqual({ tipo: 'ir', texto: 'Entrenar reducida', a: '/entrenar/2/0' })
    expect(a.pasos).toBeUndefined()
    expect(a.texto).toContain('RIR')
    expect(ids({ control: { ...control, sueno: 6 } })).toEqual([])
  })

  it('dos faltas seguidas → vuelta con la mínima', () => {
    expect(ids({ faltasSeguidas: 1 })).toEqual([])
    expect(ids({ faltasSeguidas: 2 })).toEqual(['vuelta'])
  })

  it('estancado y escalón cumplido, solo si se anotó hace poco', () => {
    const ctx = { carga: 'corporal' as const, rango: [8, 12] as [number, number] }
    // Mejor: 30 reps totales; después 3 sesiones con 27 → estancado.
    const estancado = [30, 27, 27, 27].map((t, i) => ({ fecha: `2026-11-0${i + 1}`, series: [serie(t / 3), serie(t / 3), serie(t / 3)] }))
    expect(ids({ ejercicios: [{ id: 'flexion', nombre: 'Flexión', ctx, sesiones: estancado }] })).toEqual(['estancado-flexion'])
    const viejo = estancado.map((s) => ({ ...s, fecha: s.fecha.replace('2026-11', '2026-09') }))
    expect(ids({ ejercicios: [{ id: 'flexion', nombre: 'Flexión', ctx, sesiones: viejo }] })).toEqual([])
    // Dos sesiones seguidas con 12, 12, 12 y 2 en reserva → escalón siguiente.
    const tope = [
      { fecha: '2026-11-10', series: [serie(12), serie(12), serie(12)] },
      { fecha: '2026-11-14', series: [serie(12), serie(12), serie(12)] },
    ]
    expect(ids({ ejercicios: [{ id: 'flexion', nombre: 'Flexión', ctx, sesiones: tope }] })).toEqual(['escalon-flexion'])
  })

  it('cintura +2 cm en unas 4 semanas, solo con objetivo de bajar grasa', () => {
    const cinturas = [
      { fecha: '2026-10-01', cm: 80 },
      { fecha: '2026-10-20', cm: 81 },
      { fecha: '2026-11-17', cm: 83 },
    ]
    // La más cercana a 28 días antes del 17/11 es el 20/10 (28 días): 83 − 81 = 2.
    expect(subaCintura(cinturas)).toBe(2)
    expect(ids({ cinturas, objetivoGrasa: true })).toEqual(['cintura'])
    expect(ids({ cinturas, objetivoGrasa: false })).toEqual([])
    expect(subaCintura([{ fecha: '2026-11-10', cm: 80 }, { fecha: '2026-11-17', cm: 85 }])).toBeNull()
  })

  it('retest con mejora de 5 puntos o más en las últimas 2 semanas', () => {
    const evaluaciones = [
      { fecha: '2026-10-10', areas: { cardio: 40, fuerza: 50, movilidad: 30 } },
      { fecha: '2026-11-10', areas: { cardio: 46, fuerza: 52, movilidad: 35 } },
    ]
    expect(mejorasRetest(evaluaciones, '2026-11-18')).toEqual(['cardio', 'movilidad'])
    expect(mejorasRetest(evaluaciones, '2026-11-30')).toEqual([])
    expect(consejos({ ...base, evaluaciones }, 'intermedio')[0].texto).toContain('cardio, movilidad')
  })

  it('ordena por prioridad: dolor antes que sueño y faltas', () => {
    const control = { fecha: '2026-11-18', sueno: 5, energia: 2, dolor: 'dolor' as const, zona: 'hombro' }
    expect(ids({ control, faltasSeguidas: 3 })).toEqual(['limitacion-hombro', 'sueno', 'vuelta'])
  })
})

describe('etapas', () => {
  const evs = [
    { fecha: '2026-08-01', areas: { cardio: 30, fuerza: 30 } },
    { fecha: '2026-10-20', areas: { cardio: 36, fuerza: 34 } },
  ]
  it('pide 8 semanas, 80 % y mejora de cardio y fuerza', () => {
    const hoy = new Date('2026-11-18T12:00:00')
    // 3 por semana durante 8 semanas = 24 esperadas; 20 hechas = 83 %.
    const hechas = Array.from({ length: 20 }, (_, i) => new Date(hoy.getTime() - (i + 1) * 2.5 * 86_400_000).toISOString())
    const e = evaluarEtapa({ numero: 1, inicio: '2026-08-05T00:00:00' }, hechas, 3, evs, hoy)
    expect(e.semanas).toBe(15)
    expect(e.requisitos.map((r) => r.ok)).toEqual([true, true, true])
    expect(e.lista).toBe(true)
    expect(e.nombre).toBe('Construir la base')
    // Con 16 hechas (67 %) no alcanza.
    expect(evaluarEtapa({ numero: 1, inicio: '2026-08-05T00:00:00' }, hechas.slice(0, 16), 3, evs, hoy).lista).toBe(false)
    // Sin retest dentro de la etapa no alcanza.
    expect(evaluarEtapa({ numero: 1, inicio: '2026-10-25T00:00:00' }, hechas, 3, evs, hoy).requisitos[2].ok).toBe(false)
    // La última etapa no tiene siguiente.
    expect(evaluarEtapa({ numero: 5, inicio: '2026-08-05T00:00:00' }, hechas, 3, evs, hoy).lista).toBe(false)
  })
})

describe('faltas seguidas', () => {
  const plan = (dias: number[]): PlanSemana =>
    ({ creado: '2026-10-01T00:00:00', dias: Array.from({ length: 7 }, (_, i) => ({ sesiones: dias.includes(i) ? [{ id: `s${i}`, tipo: 'fuerza', titulo: 'F', ejercicios: [{ id: 'x' }] }] : [] })) }) as unknown as PlanSemana
  it('cuenta sesiones planeadas sin hacer hasta la última hecha', () => {
    const hoy = new Date('2026-11-18T10:00:00') // miércoles; plan lunes, miércoles y viernes
    expect(faltasSeguidas(plan([0, 2, 4]), ['2026-11-13'], hoy)).toBe(1) // faltó el lunes 16
    expect(faltasSeguidas(plan([0, 2, 4]), ['2026-11-11'], hoy)).toBe(2) // faltó viernes 13 y lunes 16
    expect(faltasSeguidas(plan([0, 2, 4]), ['2026-11-17'], hoy)).toBe(0)
    expect(faltasSeguidas(null, [], hoy)).toBe(0)
  })
})
