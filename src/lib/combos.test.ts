import { describe, expect, it } from 'vitest'
import { disciplina, tecnica, tecnicasDe, type Tecnica } from './combate'
import { empiezaBien, estimulosPara, generarCombo, listaCombos, resumenReaccion, segundosCombo, sigueBien, textoCombo } from './combos'

/** Azar con semilla (mulberry32) para que los tests den siempre lo mismo. */
function semilla(s: number) {
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const T = (id: string) => tecnica(id) as Tecnica

describe('combinaciones', () => {
  it('reglas de peso', () => {
    expect(sigueBien(T('directo'), T('gancho'), 2, 3)).toBe(true) // peso adelante → técnica de adelante
    expect(sigueBien(T('gancho'), T('directo'), 2, 3)).toBe(true) // peso atrás → técnica de atrás
    expect(sigueBien(T('gancho'), T('jab'), 2, 3)).toBe(false)
    expect(sigueBien(T('directo'), T('directo'), 1, 3)).toBe(false)
    expect(sigueBien(T('jab'), T('jab'), 1, 3)).toBe(true)
    expect(sigueBien(T('gancho'), T('patada-baja'), 3, 4)).toBe(true) // la patada cierra
    expect(sigueBien(T('gancho'), T('patada-baja'), 2, 4)).toBe(false) // no en el medio
    expect(sigueBien(T('patada-baja'), T('jab'), 1, 3)).toBe(false) // nada después de la patada
    expect(sigueBien(T('jab'), T('uppercut'), 1, 2)).toBe(false) // el uppercut pide acortar antes
    expect(empiezaBien(T('uppercut'), 2)).toBe(false) // no se abre desde corta
    expect(empiezaBien(T('chequeo'), 2)).toBe(true) // contragolpe
    expect(sigueBien(T('jab'), T('chequeo'), 1, 2)).toBe(false) // el chequeo no cierra
  })

  it('todo lo generado cumple las reglas y el largo por complejidad', () => {
    for (const disc of ['boxeo', 'kick', 'hibrido', 'mma', 'karate']) {
      const ts = tecnicasDe(disc, null)
      const azar = semilla(7)
      for (let i = 0; i < 300; i++) {
        const cx = 1 + (i % 3)
        const c = generarCombo(ts, cx, azar)
        expect(c.length).toBeGreaterThan(0)
        expect(c.length).toBeLessThanOrEqual(cx === 1 ? 2 : cx === 2 ? 3 : 5)
        expect(empiezaBien(c[0], c.length)).toBe(true)
        c.forEach((t, k) => {
          expect(t.disciplinas).toContain(disc)
          if (k > 0) expect(sigueBien(c[k - 1], t, k, c.length)).toBe(true)
        })
      }
    }
  })

  it('el boxeo nunca canta patadas y la lista fija no repite', () => {
    const azar = semilla(3)
    const lista = listaCombos(tecnicasDe('boxeo', null), 2, 6, azar)
    expect(lista.length).toBe(6)
    expect(lista.flat().some((t) => t.tipo === 'patada')).toBe(false)
    expect(new Set(lista.map(textoCombo)).size).toBe(6)
  })

  it('texto y tiempo de cada combinación', () => {
    const c = [T('jab'), T('directo'), T('gancho')]
    expect(textoCombo(c)).toBe('jab, directo, gancho')
    expect(segundosCombo(c, 3)).toBe(4.5)
  })
})

describe('contragolpes', () => {
  it('elige respuestas que la disciplina tiene', () => {
    const ids = (d: string) => new Set(tecnicasDe(d, null).map((t) => t.id))
    const boxeo = estimulosPara(ids('boxeo'))
    expect(boxeo.map((x) => x.estimulo.id)).toEqual(['jab', 'directo', 'gancho', 'teep'])
    expect(boxeo[0].respuesta).toEqual(['esquive', 'directo'])
    const hib = estimulosPara(ids('hibrido'))
    expect(hib.find((x) => x.estimulo.id === 'patada-baja')?.respuesta).toEqual(['chequeo', 'directo'])
    expect(hib.find((x) => x.estimulo.id === 'derribo')?.respuesta).toEqual(['rodilla'])
    expect(estimulosPara(ids('mma')).find((x) => x.estimulo.id === 'derribo')?.respuesta).toEqual(['sprawl'])
    expect(disciplina('lucha')).toBeTruthy()
  })

  it('resume los tiempos de reacción', () => {
    expect(resumenReaccion([400, 500, 600])).toEqual({ promedio: 500, mejor: 400 })
    expect(resumenReaccion([])).toBeNull()
  })
})
