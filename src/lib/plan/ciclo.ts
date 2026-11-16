import { useCallback, useEffect, useState } from 'react'
import { db } from '../db/db'
import type { SesionPlan } from './generador'
import { faseDeSemana, semanaDelPlan, semanasParaDescarga, type Fase } from './periodizacion'

/* Ciclo de entrenamiento: desde cuándo se cuenta y si hay una descarga adelantada. */

export interface Ciclo {
  inicio: string
  /** Descarga adelantada por fatiga: dura hasta esta fecha. */
  descargaHasta?: string
}

const CLAVE = 'ciclo'

export async function asegurarCiclo(inicio = new Date().toISOString()) {
  const a = await db.ajustes.get(CLAVE)
  if (!a) await db.ajustes.put({ clave: CLAVE, valor: { inicio } satisfies Ciclo })
}

export interface EstadoCiclo {
  semana: number
  fase: Fase
  faltan: number
  adelantada: boolean
}

export function estadoCiclo(c: Ciclo, nivelFuerza: number, hoy = new Date()): EstadoCiclo {
  if (c.descargaHasta && hoy < new Date(c.descargaHasta)) return { semana: semanaDelPlan(c.inicio, hoy), fase: 'descarga', faltan: 0, adelantada: true }
  const inicio = c.descargaHasta && hoy >= new Date(c.descargaHasta) ? c.descargaHasta : c.inicio
  const semana = semanaDelPlan(inicio, hoy)
  return { semana, fase: faseDeSemana(semana, nivelFuerza), faltan: semanasParaDescarga(semana, nivelFuerza), adelantada: false }
}

export function usarCiclo(nivelFuerza: number) {
  const [ciclo, setCiclo] = useState<Ciclo | null | undefined>(undefined)
  const cargar = useCallback(async () => {
    setCiclo(((await db.ajustes.get(CLAVE))?.valor as Ciclo | undefined) ?? null)
  }, [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  const adelantarDescarga = useCallback(async () => {
    const actual = ((await db.ajustes.get(CLAVE))?.valor as Ciclo | undefined) ?? { inicio: new Date().toISOString() }
    const hasta = new Date()
    hasta.setDate(hasta.getDate() + 7)
    await db.ajustes.put({ clave: CLAVE, valor: { ...actual, descargaHasta: hasta.toISOString() } })
    await cargar()
  }, [cargar])
  return { ciclo, estado: ciclo ? estadoCiclo(ciclo, nivelFuerza) : null, adelantarDescarga, recargar: cargar }
}

/** Pausa activa de 5 minutos, de pie, para cortar el tiempo sentado. */
export function pausaActiva(): SesionPlan {
  return {
    id: 'pausa-activa',
    tipo: 'movilidad',
    titulo: 'Pausa activa (5 min)',
    minutos: 5,
    intensidad: 'suave',
    metodo: 'clasico',
    ejercicios: [
      { id: 'marcha-rodillas-altas', patrones: ['cardio'], rol: 'cardio', series: 1, rango: [2, 2], descansoSeg: 0 },
      { id: 'sentadilla', patrones: ['sentadilla'], rol: 'movilidad', series: 1, rango: [10, 10], descansoSeg: 0 },
      { id: 'movilidad-tobillo', patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: [8, 10], descansoSeg: 0 },
    ],
    nota: 'De pie y sin transpirar: ideal entre horas de computadora.',
  }
}
