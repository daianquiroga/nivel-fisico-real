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
