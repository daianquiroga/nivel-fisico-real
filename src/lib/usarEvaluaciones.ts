import { useEffect, useState } from 'react'
import { db, type Evaluacion } from './db/db'
import { DIAS_ENTRE_EVALUACIONES } from './evaluacion'

/** Evaluaciones guardadas, de la más vieja a la más nueva. */
export function usarEvaluaciones() {
  const [lista, setLista] = useState<Evaluacion[] | null>(null)
  useEffect(() => {
    void db.evaluaciones.orderBy('fecha').toArray().then(setLista)
  }, [])
  return lista
}

/** Días que faltan para la próxima evaluación (0 si ya toca). */
export function diasParaProxima(ultimaIso: string, hoy = new Date()): number {
  const pasados = Math.floor((hoy.getTime() - new Date(ultimaIso).getTime()) / 86_400_000)
  return Math.max(0, DIAS_ENTRE_EVALUACIONES - pasados)
}
