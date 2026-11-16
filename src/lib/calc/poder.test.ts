import { describe, expect, it } from 'vitest'
import { ajusteNiveles, factorExperiencia, factorFisico, factorPeso, mejorExperiencia, poderDePelea, zDePercentil } from './poder'
import { RIVALES, perfilPropio, queMeFalta, simular, simularPelea, conSemilla } from './simulador'

describe('poder de pelea', () => {
  it('z de un percentil', () => {
    expect(zDePercentil(50)).toBeCloseTo(0, 6)
    expect(zDePercentil(84.134)).toBeCloseTo(1, 3)
    expect(zDePercentil(2.275)).toBeCloseTo(-2, 3)
    expect(zDePercentil(100)).toBeCloseTo(2.326, 2) // se limita a 99
  })

  it('persona promedio = 10', () => {
    expect(poderDePelea({ percentiles: [50, 50, 50], experiencia: 'ninguna', sparring: false, nivelSombra: 0, nivelPies: 0, pesoKg: 75 }).poder).toBe(10)
  })

  it('calculado a mano', () => {
    // Percentiles 84,13 (z = 1): físico = e^0,35 = 1,419. 1 a 3 años con sparring: 2,1. Sombra 5 y pies 6: 1,2. 75 kg: 1.
    // 10 × 1,419 × 2,1 × 1,2 = 35,8 → 36
    expect(poderDePelea({ percentiles: [84.134], experiencia: 'anios', sparring: true, nivelSombra: 5, nivelPies: 6, pesoKg: 75 }).poder).toBe(36)
    // Sin sparring: 1 + 1,1 × 0,6 = 1,66
    expect(factorExperiencia('anios', false)).toBeCloseTo(1.66, 5)
    expect(ajusteNiveles(0, 0, true)).toBe(0.8)
    expect(ajusteNiveles(0, 0, false)).toBe(1)
    // 90 kg: (90/75)^0,33 = 1,062
    expect(factorPeso(90)).toBeCloseTo(1.062, 3)
    expect(factorFisico([])).toBe(1)
    expect(mejorExperiencia('meses', 'anios')).toBe('anios')
  })

  it('un campeón ronda los 100', () => {
    const p = poderDePelea({ percentiles: [99, 99, 98, 99], experiencia: 'pro', sparring: true, nivelSombra: 5, nivelPies: 6, pesoKg: 75 }).poder
    expect(p).toBeGreaterThan(90)
    expect(p).toBeLessThan(120)
  })
})

describe('simulador', () => {
  const R = (id: string) => RIVALES.find((r) => r.id === id)!

  it('dos iguales ganan parecido', () => {
    const r = simular([R('promedio'), R('promedio')], ['equilibrada', 'equilibrada'], 'mma', 1000, 2)
    expect(r.gana / 1000).toBeGreaterThan(0.38)
    expect(r.gana / 1000).toBeLessThan(0.52)
    expect(r.gana + r.pierde + r.empate).toBe(1000)
  })

  it('el más preparado gana casi siempre y cada reglamento tiene sus formas de ganar', () => {
    expect(simular([R('campeon'), R('promedio')], ['equilibrada', 'equilibrada'], 'mma', 300).gana).toBeGreaterThan(290)
    const box = simular([R('boxeo-1'), R('bjj-azul')], ['equilibrada', 'equilibrada'], 'boxeo', 300)
    expect(box.porMetodo.gana.sumision + box.porMetodo.pierde.sumision).toBe(0)
    expect(box.gana).toBeGreaterThan(250) // en boxeo gana el boxeador
    const mma = simular([R('boxeo-1'), R('bjj-azul')], ['equilibrada', 'equilibrada'], 'mma', 300)
    expect(mma.pierde).toBeGreaterThan(mma.gana) // en MMA, el de BJJ
    const grap = simular([R('promedio'), R('promedio')], ['equilibrada', 'equilibrada'], 'grappling', 300)
    expect(grap.porMetodo.gana.ko + grap.porMetodo.pierde.ko).toBe(0)
  })

  it('misma semilla, mismo resultado', () => {
    const a = simularPelea([R('promedio'), R('boxeo-1')], ['presion', 'contragolpe'], 'kick', conSemilla(5))
    const b = simularPelea([R('promedio'), R('boxeo-1')], ['presion', 'contragolpe'], 'kick', conSemilla(5))
    expect(a).toEqual(b)
  })

  it('qué me falta: ordenado y solo lo que cuenta en el reglamento', () => {
    const f = queMeFalta([R('promedio'), R('boxeo-1')], ['equilibrada', 'equilibrada'], 'boxeo')
    expect(f.mejoras.every((m) => !m.area.startsWith('agarre'))).toBe(true)
    expect(f.mejoras.map((m) => m.sube)).toEqual([...f.mejoras.map((m) => m.sube)].sort((x, y) => y - x))
  })

  it('perfil propio desde la evaluación', () => {
    const p = perfilPropio({ percentiles: { fuerza: 60, cardio: 40, movilidad: 50, equilibrio: 70 }, experienciaGolpes: 'anio', experienciaAgarre: 'ninguna', sparring: false, nivelSombra: 2, nivelPies: 1, pesoKg: 80 })
    // golpes: técnica 35 × 0,85 = 29,75 → 29,75 × 0,75 + 60 × 0,2 + 2 × 1,5 = 37,3 → 37
    expect(p.golpesAtaque).toBe(37)
    expect(p.cardio).toBe(40)
    expect(p.pesoKg).toBe(80)
  })
})
