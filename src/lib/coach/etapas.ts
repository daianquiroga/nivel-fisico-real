/* Etapas del plan (ESPECIFICACION.md, sección 5). Cada etapa dura de 8 a 12 semanas y tiene requisitos para pasar.
   Requisitos que usa la app (los mismos para todas las etapas, tomados del ejemplo de la etapa 1):
   - al menos 8 semanas en la etapa;
   - 80 % de las sesiones planeadas hechas en las últimas 8 semanas;
   - un retest dentro de la etapa que mejore cardio y fuerza respecto de la evaluación anterior.
   El checklist de técnica de los 6 ejercicios básicos todavía no existe en la app: decisión de diseño, se suma más adelante. */
import type { Area } from '../calc/puntajes'

export const ETAPAS = ['Construir la base', 'Desarrollar', 'Rendimiento', 'Dominio', 'Élite personal']
export const SEMANAS_MIN = 8
export const CUMPLIMIENTO_MIN = 0.8

export interface EtapaGuardada {
  numero: number
  inicio: string
}

export interface EvaluacionAreas {
  fecha: string
  areas: Partial<Record<Area, number>>
}

export interface Requisito {
  texto: string
  ok: boolean
  detalle?: string
}

export interface EstadoEtapa {
  numero: number
  nombre: string
  semanas: number
  requisitos: Requisito[]
  /** Se cumplen todos y hay una etapa siguiente. */
  lista: boolean
}

const DIA = 86_400_000

export function evaluarEtapa(e: EtapaGuardada, fechasHechas: string[], planeadasPorSemana: number, evaluaciones: EvaluacionAreas[], hoy = new Date()): EstadoEtapa {
  const inicio = new Date(e.inicio)
  const semanas = Math.max(0, Math.floor((hoy.getTime() - inicio.getTime()) / (7 * DIA)))
  const desde = new Date(Math.max(inicio.getTime(), hoy.getTime() - SEMANAS_MIN * 7 * DIA))
  const desdeTxt = desde.toISOString().slice(0, 10)
  const hechas = fechasHechas.filter((f) => f.slice(0, 10) >= desdeTxt).length
  const esperadas = planeadasPorSemana * SEMANAS_MIN
  const cumplimiento = esperadas > 0 ? hechas / esperadas : 0

  const orden = [...evaluaciones].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const dentro = orden.filter((x) => x.fecha >= e.inicio)
  const ultima = dentro[dentro.length - 1]
  const previa = ultima ? orden[orden.indexOf(ultima) - 1] : undefined
  const mejora = (a: Area) => ultima?.areas[a] !== undefined && previa?.areas[a] !== undefined && (ultima.areas[a] as number) > (previa.areas[a] as number)
  const mejoro = Boolean(ultima && previa && mejora('cardio') && mejora('fuerza'))

  const requisitos: Requisito[] = [
    { texto: `${SEMANAS_MIN} semanas en esta etapa`, ok: semanas >= SEMANAS_MIN, detalle: `${Math.min(semanas, SEMANAS_MIN)} de ${SEMANAS_MIN}` },
    { texto: '80 % de las sesiones en las últimas 8 semanas', ok: cumplimiento >= CUMPLIMIENTO_MIN, detalle: `${Math.round(Math.min(1, cumplimiento) * 100)} %` },
    { texto: 'Un retest que mejore cardio y fuerza', ok: mejoro, detalle: ultima && previa ? (mejoro ? 'mejoraron' : 'todavía no mejoraron los dos') : 'falta el retest' },
  ]
  const numero = Math.min(ETAPAS.length, Math.max(1, e.numero))
  return { numero, nombre: ETAPAS[numero - 1], semanas, requisitos, lista: numero < ETAPAS.length && requisitos.every((r) => r.ok) }
}
