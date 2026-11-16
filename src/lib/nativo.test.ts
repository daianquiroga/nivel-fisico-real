import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { PlanSemana, SesionPlan } from './plan/generador'
import { avisosDelPlan, combinarPasos, porDia, urlApk } from './nativo'

describe('app de Android', () => {
  it('arma la dirección del archivo desde la web', () => {
    expect(urlApk('alguien.github.io', '/mi-app/')).toBe('https://github.com/alguien/mi-app/releases/download/android/mi-app.apk')
    expect(urlApk('localhost', '/')).toBeNull()
  })

  it('combina pasos: se queda con el más alto y no repite', () => {
    const guardados = [
      { fecha: '2026-11-14', pasos: 9000, origen: 'manual' as const },
      { fecha: '2026-11-15', pasos: 3000, origen: 'manual' as const },
      { fecha: '2026-11-16', pasos: 4000, km: 3, origen: 'health-connect' as const },
    ]
    const leidos = [
      { fecha: '2026-11-14', pasos: 8000 }, // a mano había más: queda el manual
      { fecha: '2026-11-15', pasos: 6500, km: 4.8 }, // Health Connect tiene más: se actualiza
      { fecha: '2026-11-16', pasos: 4000, km: 3 }, // igual: no se toca
      { fecha: '2026-11-13', pasos: 0 }, // sin pasos: no se guarda
      { fecha: '2026-11-12', pasos: 7000 },
    ]
    expect(combinarPasos(guardados, leidos)).toEqual([
      { fecha: '2026-11-15', pasos: 6500, km: 4.8, origen: 'health-connect' },
      { fecha: '2026-11-12', pasos: 7000, km: undefined, origen: 'health-connect' },
    ])
  })

  it('agrupa por día local', () => {
    const d1 = new Date(2026, 10, 15, 0, 0).toISOString()
    const d2 = new Date(2026, 10, 16, 0, 0).toISOString()
    expect([...porDia([{ startDate: d1, value: 100 }, { startDate: d2, value: 50 }, { startDate: d2, value: 25 }])]).toEqual([
      ['2026-11-15', 100],
      ['2026-11-16', 75],
    ])
  })

  it('un aviso semanal 15 minutos antes de cada sesión con hora', () => {
    const ses = (o: Partial<SesionPlan>): SesionPlan =>
      ({ id: 'x', tipo: 'fuerza', titulo: 'Fuerza A', minutos: 45, intensidad: 'fuerte', metodo: 'clasico', ejercicios: [{ id: 'flexion' }], ...o }) as SesionPlan
    const plan = {
      creado: '2026-11-01T00:00:00',
      dias: [
        { sesiones: [ses({ desde: '19:30', intencion: 'Cuando llego, entreno' })] }, // lunes
        { sesiones: [] },
        { sesiones: [ses({ desde: '00:10' })] }, // miércoles 00:10 → martes 23:55
        { sesiones: [ses({})] }, // sin hora: sin aviso
        { sesiones: [] },
        { sesiones: [] },
        { sesiones: [ses({ desde: '09:00' })] }, // domingo
      ],
    } as unknown as PlanSemana
    const a = avisosDelPlan(plan)
    expect(a.map((x) => [x.weekday, x.hour, x.minute])).toEqual([
      [2, 19, 15],
      [3, 23, 55],
      [1, 8, 45],
    ])
    expect(a[0].texto).toBe('Cuando llego, entreno')
    expect(new Set(a.map((x) => x.id)).size).toBe(3)
  })
})

describe('aviso de evaluación', () => {
  it('28 días después de la última, a las 10; si ya pasó, mañana', async () => {
    const { fechaAvisoEvaluacion } = await import('./nativo')
    const hoy = new Date(2026, 10, 16, 12, 0)
    const a = fechaAvisoEvaluacion(new Date(2026, 10, 1, 9, 0).toISOString(), hoy)
    expect([a.getMonth(), a.getDate(), a.getHours()]).toEqual([10, 29, 10])
    const b = fechaAvisoEvaluacion(new Date(2026, 9, 1).toISOString(), hoy)
    expect([b.getMonth(), b.getDate(), b.getHours()]).toEqual([10, 17, 10])
  })
})
