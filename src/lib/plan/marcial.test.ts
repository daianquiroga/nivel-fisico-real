import { describe, expect, it } from 'vitest'
import { ejercicio } from '../ejercicios'
import { tecnica } from '../combate'
import { ARTES_RUTINA, bloquesSesion, combinacionesDe, movilidadPara, resumenBloques, semanaMarcial, vecesPorArte } from './marcial'

const vacio = () => Array.from({ length: 7 }, () => [] as { hora: string; minutos: number }[])

describe('rutina marcial', () => {
  it('las artes van de a una; la única combinada es el híbrido', () => {
    const ids = ARTES_RUTINA.map((d) => d.id)
    expect(ids).toContain('hibrido')
    expect(ids).not.toContain('completo')
    expect(ids).toEqual(expect.arrayContaining(['boxeo', 'kick', 'muaythai', 'karate', 'bjj', 'judo']))
  })

  it('la sesión guiada dura lo que elegiste (calculado a mano)', () => {
    // 30 min, nivel 1 sombra (2 min + 1 de pausa) y pies (1 min + 30 s), sin movilidad:
    // calor 5 + calma 3 = 8 min; 1 round de pies = 1,5 min; quedan 20,5 min = 1230 s → (1230 + 60) / 180 = 7 rounds.
    const b = bloquesSesion('boxeo', 30, false)
    expect(b.filter((x) => x.tipo === 'sombra')).toHaveLength(7)
    expect(b.reduce((a, x) => a + x.segundos, 0)).toBe(30 * 60)
    expect(b[0].tipo).toBe('calor')
    expect(b[b.length - 1].tipo).toBe('calma')
  })

  it('empezando no repite la forma seguida y el resumen junta los rounds', () => {
    const b = bloquesSesion('boxeo', 30, false, 0, 0)
    const focos = b.filter((x) => x.tipo === 'sombra').map((x) => x.titulo.split(': ')[1])
    expect(focos).toEqual(['Forma', 'Con desplazamiento', 'Forma', 'Combinaciones', 'Con desplazamiento', 'Forma', 'Sombra libre'])
    const r = resumenBloques(b)
    expect(r[0]).toBe('Entrada en calor')
    expect(r[1]).toBe('Juego de pies: 1 round de paso adelante y atrás')
    expect(r[r.length - 1]).toBe('Vuelta a la calma')
    const avanzado = resumenBloques(bloquesSesion('boxeo', 60, false, 2, 2))
    expect(r[2]).toBe('Sombra: 7 rounds (3 de forma, 2 con desplazamiento, 1 de combinaciones, 1 libre)')
    expect(avanzado.some((x) => /^Sombra: \d+ rounds \(1 de forma, 1 en combinación, \d+ de combinaciones/.test(x))).toBe(true)
  })

  it('con movilidad suma un bloque y los rounds se acomodan', () => {
    const b = bloquesSesion('muaythai', 45, true)
    const mov = b.find((x) => x.tipo === 'movilidad')
    expect(mov?.segundos).toBe(8 * 60)
    expect(b.reduce((a, x) => a + x.segundos, 0)).toBe(45 * 60)
    expect(mov?.ejercicios).toEqual(movilidadPara('muaythai'))
  })

  it('cada round tiene qué hacer, y las técnicas y ejercicios existen', () => {
    for (const a of ARTES_RUTINA) {
      expect(combinacionesDe(a.id).length).toBeGreaterThan(0)
      for (const x of bloquesSesion(a.id, 60, true, 4, 5)) {
        expect(x.que.length).toBeGreaterThan(0)
        for (const t of x.tecnicas ?? []) expect(tecnica(t), `${a.id}: ${t}`).toBeTruthy()
        for (const e of x.ejercicios ?? []) expect(ejercicio(e), e).toBeTruthy()
      }
    }
  })

  it('las artes rotan día por día y la movilidad va aparte si hay segundo horario', () => {
    const h = vacio()
    h[0] = [{ hora: '19:00', minutos: 45 }]
    h[2] = [{ hora: '19:00', minutos: 30 }, { hora: '08:00', minutos: 15 }]
    h[4] = [{ hora: '19:00', minutos: 60 }]
    const plan = semanaMarcial({ artes: ['boxeo', 'kick'], horarios: h, movilidad: true })
    expect(plan.dias[0].sesiones[0].combate).toEqual({ arte: 'boxeo', movilidad: true })
    expect(plan.dias[2].sesiones.map((s) => s.titulo)).toEqual(['Movilidad para combate', 'Combate: Kickboxing'])
    expect(plan.dias[2].sesiones[1].combate?.movilidad).toBe(false)
    expect(plan.dias[4].sesiones[0].combate?.arte).toBe('boxeo')
    expect(vecesPorArte(plan)).toEqual({ boxeo: 2, kick: 1 })
    expect(plan.dias[4].sesiones[0].minutos).toBe(60)
    expect(plan.dias[4].sesiones[0].hasta).toBe('20:00')
  })
})
