import { useCallback, useEffect, useState } from 'react'
import type { Serie, Sesion } from './calc/progresion'
import { db } from './db/db'

/* Cada vez que se anota un ejercicio se guarda un registro de tipo "ejercicio". */

export interface SesionGuardada extends Sesion {
  id?: number
  ejercicio: string
}

export async function guardarSesion(ejercicio: string, series: Serie[]): Promise<void> {
  await db.registros.add({ fecha: new Date().toISOString(), tipo: 'ejercicio', datos: { ejercicio, series } })
}

export async function borrarSesion(id: number): Promise<void> {
  await db.registros.delete(id)
}

/** Todas las sesiones anotadas, de la más vieja a la más nueva. */
export async function todasLasSesiones(): Promise<SesionGuardada[]> {
  const lista = await db.registros.where('[tipo+fecha]').between(['ejercicio', ''], ['ejercicio', '￿']).toArray()
  return lista.map((r) => ({ id: r.id, fecha: r.fecha, ejercicio: String(r.datos.ejercicio), series: (r.datos.series as Serie[]) ?? [] }))
}

export function usarSesiones(ejercicio?: string) {
  const [sesiones, setSesiones] = useState<SesionGuardada[] | null>(null)
  const cargar = useCallback(async () => {
    const todas = await todasLasSesiones()
    setSesiones(ejercicio ? todas.filter((s) => s.ejercicio === ejercicio) : todas)
  }, [ejercicio])
  useEffect(() => {
    void cargar()
  }, [cargar])
  return { sesiones, recargar: cargar }
}
