import { describe, expect, it } from 'vitest'
import { ejercicio } from '../ejercicios'
import { nuevoEjercicioPlan } from './editar'
import { analizarRutina, type ContextoAnalisis } from './analisis'
import type { PlanSemana, SesionPlan } from './generador'

const ep = (id: string, series?: number, minutos?: number) => {
  const x = nuevoEjercicioPlan(ejercicio(id)!)
  if (series) x.series = series
  if (minutos) x.rango = [minutos, minutos]
  return x
}
const ses = (ids: ReturnType<typeof ep>[], o: Partial<SesionPlan> = {}): SesionPlan =>
  ({ id: 's', tipo: 'fuerza', titulo: 'Fuerza', minutos: 45, intensidad: 'fuerte', metodo: 'clasico', ejercicios: ids, ...o }) as SesionPlan
const plan = (dias: SesionPlan[][]): PlanSemana => ({ creado: '2026-11-01T00:00:00', dias: Array.from({ length: 7 }, (_, i) => ({ sesiones: dias[i] ?? [] })) })
const ctx: ContextoAnalisis = { objetivos: { estetica: 40, condicion: 40, combate: 20 }, zonas: [], limitaciones: [], equipo: new Set() }

describe('análisis de la rutina', () => {
  it('cuenta series por músculo: principal 1, secundario 0,5', () => {
    // Press de banco con barra: pecho principal; hombros, tríceps y abdomen secundarios. 3 series, 2 días.
    const a = analizarRutina(plan([[ses([ep('press-banca-barra', 3)])], [], [ses([ep('press-banca-barra', 3)])]]), ctx)
    expect(a.series.pecho).toBe(6)
    expect(a.series.triceps).toBe(3)
    expect(a.series.hombros).toBe(3)
    expect(a.diasFuerza).toBe(2)
    expect(a.patrones.empuje).toBe(6)
  })

  it('cardio: los minutos vigorosos cuentan doble', () => {
    // 30 min de caminata rápida (4,8 MET, moderada) + 20 de soga (8,3 MET, vigorosa → 40).
    const a = analizarRutina(plan([[ses([ep('caminata-rapida', 1, 30)], { tipo: 'cardio', intensidad: 'suave' })], [ses([ep('soga', 1, 20)], { tipo: 'cardio' })]]), ctx)
    expect(a.minutosCardio).toBe(50)
    expect(a.cardioEquivalente).toBe(70)
    const cardio = a.faltas.find((f) => f.area === 'cardio')!
    expect(cardio.texto).toContain('80 minutos')
  })

  it('detecta lo que falta: patrones, tirar menos que empujar y técnica de combate', () => {
    const a = analizarRutina(plan([[ses([ep('press-banca-barra', 4), ep('press-hombros-mancuernas', 3)])]]), { ...ctx, objetivos: { estetica: 30, condicion: 30, combate: 40 } })
    const areas = a.faltas.map((f) => f.area)
    expect(areas).toContain('patron')
    expect(areas).toContain('equilibrio')
    expect(areas).toContain('combate')
    expect(a.faltas.find((f) => f.area === 'equilibrio')!.sugerencias.length).toBeGreaterThan(0)
    // No sugiere ejercicios que ya están.
    expect(a.faltas.flatMap((f) => f.sugerencias)).not.toContain('press-banca-barra')
  })

  it('una rutina completa puntúa más que una incompleta, y el combate sube lo marcial', () => {
    const completa = plan([
      [ses([ep('sentadilla-barra', 4), ep('press-banca-barra', 4), ep('remo-barra', 4), ep('plancha', 3), ep('gato-camello')])],
      [ses([ep('caminata-rapida', 1, 40)], { tipo: 'cardio', intensidad: 'suave' })],
      [ses([ep('peso-muerto-barra', 4), ep('press-militar-barra', 3), ep('dominada', 4), ep('crunch', 3), ep('movilidad-tobillo')])],
      [ses([ep('trote-suave', 1, 30)], { tipo: 'cardio', intensidad: 'suave' })],
      [ses([ep('sentadilla-bulgara', 3), ep('fondos', 3), ep('jalon-polea', 3), ep('curl-femoral', 3), ep('rotacion-toracica')])],
      [],
      [],
    ])
    const a = analizarRutina(completa, ctx)
    const b = analizarRutina(plan([[ses([ep('curl-biceps', 3)])]]), ctx)
    expect(a.puntajes.fisico).toBeGreaterThan(b.puntajes.fisico + 40)
    expect(a.puntajes.estetico).toBeGreaterThan(b.puntajes.estetico)
    const conSombra = structuredClone(completa)
    conSombra.dias[5].sesiones = [ses([ep('sombra', 1, 30), ep('juego-pies', 1, 15)], { tipo: 'cardio', intensidad: 'suave' })]
    expect(analizarRutina(conSombra, ctx).puntajes.marcial).toBeGreaterThan(a.puntajes.marcial + 10)
    expect(a.faltas.some((f) => f.area === 'patron')).toBe(false)
  })

  it('las zonas elegidas piden más series', () => {
    const p = plan([[ses([ep('curl-biceps', 3)])], [], [ses([ep('curl-biceps', 3)])]]) // bíceps: 6 series
    expect(analizarRutina(p, ctx).faltas.some((f) => f.texto.startsWith('Bíceps'))).toBe(false) // 6 ≥ 5
    expect(analizarRutina(p, { ...ctx, zonas: ['brazos'] }).faltas.some((f) => f.texto.startsWith('Bíceps'))).toBe(true) // zona: pide 10
  })
})
