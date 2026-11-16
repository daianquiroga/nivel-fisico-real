import { useCallback, useEffect, useState } from 'react'
import { db } from './db/db'
import { fechaLocal, type ControlDia, type Version } from './plan/sesion'

/* Control diario y sesiones terminadas, guardados en "registros". */

export async function leerControles(): Promise<ControlDia[]> {
  const r = await db.registros.where('[tipo+fecha]').between(['control', ''], ['control', '￿']).toArray()
  return r.map((x) => x.datos as unknown as ControlDia).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Guarda el control de un día (si ya había uno ese día, lo reemplaza). */
export async function guardarControl(c: ControlDia) {
  const previos = await db.registros.where('[tipo+fecha]').between(['control', ''], ['control', '￿']).toArray()
  await db.transaction('rw', db.registros, async () => {
    for (const p of previos) if ((p.datos as unknown as ControlDia).fecha === c.fecha && p.id) await db.registros.delete(p.id)
    await db.registros.add({ fecha: `${c.fecha}T12:00:00`, tipo: 'control', datos: c as unknown as Record<string, unknown> })
  })
}

export function usarControlHoy() {
  const [estado, setEstado] = useState<{ hoy?: ControlDia; ayer?: ControlDia } | null>(null)
  const cargar = useCallback(async () => {
    const lista = await leerControles()
    const hoy = fechaLocal()
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const ayer = fechaLocal(d)
    setEstado({ hoy: lista.find((c) => c.fecha === hoy), ayer: lista.find((c) => c.fecha === ayer) })
  }, [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  return { estado, recargar: cargar }
}

export interface SesionHecha {
  sesionId: string
  titulo: string
  version: Version
  minutos: number
  esfuerzo?: number
  diario?: { bien?: string; mejorar?: string; sentir?: string }
  ejercicios: string[]
}

export async function guardarSesionHecha(s: SesionHecha) {
  await db.registros.add({ fecha: new Date().toISOString(), tipo: 'entrenamiento', datos: s as unknown as Record<string, unknown> })
}

export async function sesionesHechas(): Promise<(SesionHecha & { fecha: string })[]> {
  const r = await db.registros.where('[tipo+fecha]').between(['entrenamiento', ''], ['entrenamiento', '￿']).toArray()
  return r.map((x) => ({ ...(x.datos as unknown as SesionHecha), fecha: x.fecha }))
}

/* ---------- Pasos ---------- */

export interface DiaPasos {
  fecha: string
  pasos: number
}

export async function leerPasos(): Promise<DiaPasos[]> {
  const r = await db.registros.where('[tipo+fecha]').between(['pasos', ''], ['pasos', '￿']).toArray()
  return r.map((x) => x.datos as unknown as DiaPasos).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export async function guardarPasos(d: DiaPasos) {
  const previos = await db.registros.where('[tipo+fecha]').between(['pasos', ''], ['pasos', '￿']).toArray()
  await db.transaction('rw', db.registros, async () => {
    for (const p of previos) if ((p.datos as unknown as DiaPasos).fecha === d.fecha && p.id) await db.registros.delete(p.id)
    await db.registros.add({ fecha: `${d.fecha}T12:00:00`, tipo: 'pasos', datos: d as unknown as Record<string, unknown> })
  })
}

/** Pasos de los últimos n días (0 si no hay dato), del más viejo a hoy. */
export function ultimosDias(lista: DiaPasos[], n: number, hoy = new Date()): DiaPasos[] {
  const mapa = new Map(lista.map((d) => [d.fecha, d.pasos]))
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - (n - 1 - i))
    const f = fechaLocal(d)
    return { fecha: f, pasos: mapa.get(f) ?? 0 }
  })
}

export function usarPasos() {
  const [lista, setLista] = useState<DiaPasos[] | null>(null)
  const cargar = useCallback(async () => setLista(await leerPasos()), [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  return { lista, recargar: cargar }
}

/* ---------- Actividad y agua ---------- */

export interface Actividad {
  id?: number
  fecha: string
  nombre: string
  met: number
  minutos: number
  distanciaKm?: number
  actividad?: string
  variante?: string
  origen: 'manual' | 'entrenar'
}

export async function guardarActividad(a: Omit<Actividad, 'id'>) {
  await db.registros.add({ fecha: `${a.fecha}T${new Date().toTimeString().slice(0, 8)}`, tipo: 'actividad', datos: a as unknown as Record<string, unknown> })
}

export async function borrarRegistro(id: number) {
  await db.registros.delete(id)
}

export async function leerActividades(): Promise<Actividad[]> {
  const r = await db.registros.where('[tipo+fecha]').between(['actividad', ''], ['actividad', '￿']).toArray()
  return r.map((x) => ({ ...(x.datos as unknown as Actividad), id: x.id }))
}

export function usarActividades() {
  const [lista, setLista] = useState<Actividad[] | null>(null)
  const cargar = useCallback(async () => setLista(await leerActividades()), [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  return { lista, recargar: cargar }
}

export interface DiaAgua {
  fecha: string
  ml: number
}

export async function leerAgua(): Promise<DiaAgua[]> {
  const r = await db.registros.where('[tipo+fecha]').between(['agua', ''], ['agua', '￿']).toArray()
  return r.map((x) => x.datos as unknown as DiaAgua)
}

export async function guardarAgua(d: DiaAgua) {
  const previos = await db.registros.where('[tipo+fecha]').between(['agua', ''], ['agua', '￿']).toArray()
  await db.transaction('rw', db.registros, async () => {
    for (const p of previos) if ((p.datos as unknown as DiaAgua).fecha === d.fecha && p.id) await db.registros.delete(p.id)
    await db.registros.add({ fecha: `${d.fecha}T12:00:00`, tipo: 'agua', datos: d as unknown as Record<string, unknown> })
  })
}
