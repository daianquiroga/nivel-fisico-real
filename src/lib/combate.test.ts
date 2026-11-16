import { describe, expect, it } from 'vitest'
import { tieneDibujoPies, tieneDibujoTecnica } from '../content/dibujos-combate'
import { DISCIPLINAS, aprueba, compatibilidad, criteriosDe, distanciasNuevas, mesesCon, nivelPies, nivelSombra, revisarCombate, tecnicasDe } from './combate'

describe('combate', () => {
  it('el contenido está completo y todo tiene dibujo', () => {
    expect(revisarCombate(tieneDibujoTecnica, tieneDibujoPies)).toEqual([])
  })

  it('filtra técnicas por disciplina y distancia', () => {
    expect(tecnicasDe('boxeo', null).every((t) => t.disciplinas.includes('boxeo'))).toBe(true)
    expect(tecnicasDe('boxeo', null).some((t) => t.tipo === 'patada')).toBe(false)
    expect(tecnicasDe(null, 'suelo').map((t) => t.id)).toEqual(['caida', 'puente', 'escape-cadera', 'levantarse'])
  })

  it('8 criterios y se aprueba solo con todos', () => {
    expect(criteriosDe('boxeo')).toHaveLength(8)
    expect(aprueba(Array(8).fill(true))).toBe(true)
    expect(aprueba([...Array(7).fill(true), false])).toBe(false)
  })

  it('el nivel sube de a uno y por disciplina', () => {
    const p = (fecha: string, disciplina: string, nivel: number, aprobado = true) => ({ fecha, disciplina, nivel, aprobado, criterios: [] })
    const lista = [p('2026-01-01', 'boxeo', 1), p('2026-01-10', 'boxeo', 3), p('2026-01-20', 'boxeo', 2), p('2026-01-05', 'kick', 1, false)]
    // El 3 se aprobó antes que el 2: no cuenta (se sube de a uno).
    expect(nivelSombra(lista, 'boxeo')).toBe(2)
    expect(nivelSombra(lista, 'kick')).toBe(0)
    expect(nivelPies([{ fecha: '2026-01-02', nivel: 2 }, { fecha: '2026-01-01', nivel: 1 }])).toBe(2)
  })

  it('meses con la disciplina base', () => {
    expect(mesesCon({ disciplina: 'boxeo', desde: '2026-01-01T00:00:00' }, new Date('2026-07-15T00:00:00'))).toBe(6)
  })
})

describe('híbrido boxeo + kick + muay thai', () => {
  it('tiene sus 8 criterios, sus técnicas y consejos por nivel', () => {
    expect(criteriosDe('hibrido')).toHaveLength(8)
    const ids = tecnicasDe('hibrido', null).map((t) => t.id)
    expect(ids).toEqual(expect.arrayContaining(['jab', 'gancho', 'teep', 'patada-baja', 'chequeo', 'rodilla', 'clinch']))
    expect(ids).not.toContain('derribo')
  })
})

describe('combinar disciplinas', () => {
  it('hay compatibilidad para cada par de disciplinas distintas', () => {
    for (const a of DISCIPLINAS) for (const b of DISCIPLINAS) if (a.id !== b.id) expect(compatibilidad(a.id, b.id), `${a.id}+${b.id}`).not.toBeNull()
  })
  it('es simétrica y la lucha le suma suelo al boxeo', () => {
    expect(compatibilidad('boxeo', 'kick')).toEqual(compatibilidad('kick', 'boxeo'))
    expect(distanciasNuevas('boxeo', 'lucha')).toContain('suelo')
    expect(distanciasNuevas('kick', 'muaythai')).toEqual([])
  })
  it('cada disciplina tiene sombra (5 niveles) y pies (6 niveles) propios', () => {
    for (const d of DISCIPLINAS) {
      expect(Object.keys(d.sombra ?? {}), d.id).toHaveLength(5)
      expect(Object.keys(d.pies ?? {}), d.id).toHaveLength(6)
    }
  })
})
