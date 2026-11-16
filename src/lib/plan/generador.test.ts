import { describe, expect, it } from 'vitest'
import type { Lugar } from '../db/db'
import { ejercicio, equipoDeLugar, evitarPorLimitacion, sePuedeHacer } from '../ejercicios'
import { semanaPorDefecto, type Semana } from '../perfil'
import { elegirDias, escalonesIniciales, estimarMinutos, generarPlan, type EntradaPlan } from './generador'
import { equilibrio, validarPlan } from './validador'

// Datos de ejemplo inventados (no son de ninguna persona).
const casa: Lugar = { nombre: 'Casa A', tipo: 'casa', equipo: ['mancuernas', 'barra-dominadas', 'bandas', 'anclaje'], espacio: '2x2' }
const gym: Lugar = { nombre: 'Gym B', tipo: 'gimnasio', gimnasio: { prefiere: ['maquinas', 'mancuernas'], metodo: 'app' }, equipo: [], espacio: 'amplio' }

function semana(lugaresPorDia: string[][], hueco = { desde: '19:00', hasta: '20:00' }): Semana {
  const s = semanaPorDefecto()
  s.tipos.laboral.huecos = [hueco]
  s.tipos.sabado.huecos = [hueco]
  s.tipos.domingo.huecos = [hueco]
  s.lugaresPorDia = lugaresPorDia
  return s
}

const base = (o: Partial<EntradaPlan> = {}): EntradaPlan => ({
  objetivos: { estetica: 40, condicion: 40, combate: 20 },
  zonas: [],
  limitaciones: [],
  lugares: [casa, gym],
  semana: semana([['Casa A'], ['Gym B'], [], ['Casa A'], [], ['Gym B'], []]),
  nivelFuerza: 2,
  nivelCardio: 2,
  escalones: escalonesIniciales(2),
  ...o,
})

describe('generador del plan', () => {
  it('elige días sin dos seguidos cuando se puede', () => {
    const r = elegirDias([0, 1, 3, 5], 3)
    const seguidos = r.filter((d, i) => (r[(i + 1) % r.length] - d + 7) % 7 === 1).length
    expect(seguidos).toBe(0)
    expect(r).toHaveLength(3)
  })

  it('escalones: por nivel y por lo último anotado', () => {
    expect(escalonesIniciales(3).empuje).toBe(3) // flexión con rodillas
    expect(escalonesIniciales(3, ['flexion']).empuje).toBe(4)
  })

  it('4 días con "Verme mejor" alto: tren superior e inferior, ejercicios posibles en cada lugar', () => {
    const plan = generarPlan(base())
    const fuerza = plan.dias.flatMap((d) => d.sesiones).filter((s) => s.tipo === 'fuerza')
    expect(fuerza.map((s) => s.titulo)).toEqual(['Fuerza · tren superior', 'Fuerza · tren inferior', 'Fuerza · tren superior', 'Fuerza · tren inferior'])
    for (const s of fuerza) {
      const lugar = [casa, gym].find((l) => l.nombre === s.lugar)!
      for (const x of s.ejercicios) expect(sePuedeHacer(ejercicio(x.id)!, equipoDeLugar(lugar))).toBe(true)
    }
  })

  it('respeta la muñeca: nada marcado como "evitar"', () => {
    const plan = generarPlan(base({ limitaciones: ['muneca'] }))
    const ids = plan.dias.flatMap((d) => d.sesiones.flatMap((s) => s.ejercicios.map((x) => x.id)))
    expect(ids.length).toBeGreaterThan(10)
    for (const id of ids) expect(evitarPorLimitacion(ejercicio(id)!, ['muneca'])).toBe(false)
  })

  it('se ajusta a un hueco corto', () => {
    const plan = generarPlan(base({ semana: semana([['Casa A'], [], ['Casa A'], [], ['Casa A'], [], []], { desde: '07:00', hasta: '07:30' }) }))
    for (const s of plan.dias.flatMap((d) => d.sesiones).filter((x) => x.tipo === 'fuerza')) {
      expect(s.ejercicios.filter((x) => x.rol !== 'movilidad').length).toBeGreaterThanOrEqual(3)
      expect(estimarMinutos(s.ejercicios)).toBeLessThanOrEqual(34)
    }
  })

  it('endomorfo: cardio de bajo impacto', () => {
    const plan = generarPlan(base({ tipoCuerpo: 'endomorfo', objetivos: { estetica: 20, condicion: 60, combate: 20 }, semana: semana([['Casa A'], ['Casa A'], ['Casa A'], ['Casa A'], ['Casa A'], [], []]) }))
    const cardio = plan.dias.flatMap((d) => d.sesiones).filter((s) => s.tipo === 'cardio')
    expect(cardio.length).toBe(2)
    for (const c of cardio) expect(c.ejercicios[0].id).toBe('caminata-rapida')
  })

  it('validador y equilibrio: con 2 días falta cardio', () => {
    const entrada = base({ semana: semana([['Casa A'], [], [], ['Casa A'], [], [], []]) })
    const plan = generarPlan(entrada)
    const eq = equilibrio(plan)
    expect(eq.find((a) => a.area === 'fuerza')!.valor).toBe(2)
    expect(eq.find((a) => a.area === 'cardio')!.valor).toBe(0)
    expect(validarPlan(plan, entrada.semana).some((a) => a.texto.startsWith('Cardio'))).toBe(true)
  })

  it('avisa dos días fuertes seguidos y sesión cerca de dormir', () => {
    const entrada = base({ semana: semana([['Casa A'], ['Casa A'], [], [], [], [], []], { desde: '22:00', hasta: '23:00' }) })
    const avisos = validarPlan(generarPlan(entrada), entrada.semana).map((a) => a.texto)
    expect(avisos.some((t) => t.includes('dos días fuertes seguidos'))).toBe(true)
    expect(avisos.some((t) => t.includes('menos de 2 horas de dormir'))).toBe(true)
  })
})

describe('combate y etapas en el plan', () => {
  const ids = (p: ReturnType<typeof generarPlan>) => p.dias.flatMap((d) => d.sesiones.flatMap((s) => s.ejercicios.map((x) => x.id)))

  it('sin combate no suma sombra; con 30 o más, sombra y pies en los días de cardio', () => {
    expect(ids(generarPlan(base({ objetivos: { estetica: 60, condicion: 40, combate: 0 } })))).not.toContain('sombra')
    const p = generarPlan(base({ objetivos: { estetica: 30, condicion: 30, combate: 40 }, semana: semana([['Casa A'], ['Casa A'], ['Casa A'], ['Casa A'], ['Casa A'], [], []]) }))
    const cardio = p.dias.flatMap((d) => d.sesiones).filter((s) => s.tipo === 'cardio')
    expect(cardio.length).toBeGreaterThan(0)
    for (const s of cardio) {
      expect(s.titulo).toBe('Cardio y combate')
      expect(s.ejercicios.map((x) => x.id)).toContain('sombra')
    }
    // Los minutos de cardio no cambian: suman lo mismo que antes.
    const sin = generarPlan(base({ objetivos: { estetica: 30, condicion: 40, combate: 0 }, semana: semana([['Casa A'], ['Casa A'], ['Casa A'], ['Casa A'], ['Casa A'], [], []]) }))
    const total = (q: typeof p) => q.dias.flatMap((d) => d.sesiones).filter((s) => s.tipo === 'cardio').reduce((a, s) => a + s.ejercicios.reduce((b, x) => b + x.rango[0], 0), 0)
    expect(total(p)).toBe(total(sin))
  })

  it('la etapa 2 suma una serie a los principales', () => {
    const series = (etapa: number) =>
      generarPlan(base({ etapa }))
        .dias.flatMap((d) => d.sesiones)
        .flatMap((s) => s.ejercicios)
        .filter((x) => x.rol === 'principal')
        .map((x) => x.series)
    expect(Math.max(...series(2))).toBeGreaterThan(Math.max(...series(1)))
  })
})
