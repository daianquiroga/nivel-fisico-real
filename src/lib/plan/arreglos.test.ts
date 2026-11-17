import { describe, expect, it } from 'vitest'
import { semanaPorDefecto } from '../perfil'
import { aplicarArreglo } from './arreglos'
import type { PlanSemana, SesionPlan } from './generador'
import { equilibrio, validarPlan } from './validador'

const fuerza = (titulo: string, desde = '19:00'): SesionPlan => ({
  id: titulo,
  tipo: 'fuerza',
  titulo,
  desde,
  hasta: '20:00',
  minutos: 60,
  intensidad: 'fuerte',
  metodo: 'clasico',
  ejercicios: [{ id: 'sentadilla', patrones: ['sentadilla'], rol: 'principal', series: 3, rango: [8, 12], descansoSeg: 90 }],
})
const plan = (dias: Record<number, SesionPlan[]>): PlanSemana => ({ creado: '2026-01-01', dias: Array.from({ length: 7 }, (_, d) => ({ sesiones: dias[d] ?? [] })) })

describe('opciones para corregir los avisos', () => {
  const semana = semanaPorDefecto()

  it('dos días fuertes seguidos: pasar uno a un día libre o hacerlo liviano', () => {
    const p = plan({ 0: [fuerza('Fuerza A')], 1: [fuerza('Fuerza B')] })
    const aviso = validarPlan(p, semana).find((a) => a.texto.includes('dos días fuertes seguidos'))!
    expect(aviso.arreglos?.map((a) => a.tipo)).toEqual(['mover', 'suavizar'])
    const movido = aplicarArreglo(p, aviso.arreglos![0])
    expect(validarPlan(movido, semana).some((a) => a.texto.includes('dos días fuertes seguidos'))).toBe(false)
    const liviano = aplicarArreglo(p, aviso.arreglos![1])
    expect(liviano.dias[1].sesiones[0].intensidad).toBe('suave')
    expect(liviano.dias[1].sesiones[0].ejercicios[0].series).toBe(2)
  })

  it('poco cardio: suma caminatas hasta acercarse al mínimo de la OMS', () => {
    const p = plan({ 0: [fuerza('Fuerza A')], 3: [fuerza('Fuerza B')] })
    const aviso = validarPlan(p, semana).find((a) => a.texto.startsWith('Cardio'))!
    const a = aviso.arreglos![0]
    expect(a.tipo).toBe('agregar')
    // 150 minutos que faltan / 30 = 5, con tope de 3 días; primero los días sin fuerza.
    const nuevo = aplicarArreglo(p, a, 'Casa')
    expect(equilibrio(nuevo).find((x) => x.area === 'cardio')?.valor).toBe(90)
    expect(nuevo.dias[0].sesiones).toHaveLength(1)
  })

  it('fuerza un solo día: repetirla en un día que no quede pegado', () => {
    const p = plan({ 2: [fuerza('Fuerza A')] })
    const a = validarPlan(p, semana).find((x) => x.texto.startsWith('Fuerza'))!.arreglos![0]
    expect(a.tipo).toBe('copiar')
    const nuevo = aplicarArreglo(p, a)
    expect(equilibrio(nuevo).find((x) => x.area === 'fuerza')?.valor).toBe(2)
    expect(validarPlan(nuevo, semana).some((x) => x.texto.includes('seguidos'))).toBe(false)
  })

  it('sesión que termina cerca de dormir: empezarla antes', () => {
    const s = semanaPorDefecto()
    s.dias[0] = 'laboral'
    s.tipos.laboral.dormir = '23:30'
    const p = plan({ 0: [{ ...fuerza('Fuerza A', '22:00'), hasta: '23:00' }] })
    const aviso = validarPlan(p, s).find((a) => a.texto.includes('2 horas de dormir'))!
    const a = aviso.arreglos![0]
    // Termina 23:00 y duerme 23:30: faltan 90 minutos de margen → empezar 1:30 antes.
    expect(a.texto).toBe('Empezarla a las 20:30')
    const nuevo = aplicarArreglo(p, a)
    expect(validarPlan(nuevo, s).some((x) => x.texto.includes('2 horas de dormir'))).toBe(false)
  })
})
