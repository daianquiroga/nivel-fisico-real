import { useCallback, useEffect, useState } from 'react'
import { categoriaSomatotipo, tendenciaActual, type Tendencia } from './calc/tipoCuerpo'
import { db } from './db/db'
import type { Resultados } from './evaluacion'

export interface SomatotipoGuardado {
  fecha: string
  medidas: Record<string, number>
  endo: number
  meso: number
  ecto: number
}

export interface TipoCuerpoActual {
  tipo?: Tendencia
  /** completo = medido con plicómetro; casero = estimado en la evaluación. */
  fuente?: 'completo' | 'casero'
  completo?: SomatotipoGuardado & { categoria: string }
  casero?: NonNullable<Resultados['tipoCuerpo']>
  alturaCm?: number
  pesoKg?: number
}

const CLAVE = 'somatotipos'

export async function guardarSomatotipo(s: SomatotipoGuardado) {
  const previo = ((await db.ajustes.get(CLAVE))?.valor as SomatotipoGuardado[] | undefined) ?? []
  await db.ajustes.put({ clave: CLAVE, valor: [...previo, s] })
}

/** El tipo de cuerpo más reciente: el somatotipo completo si hay, si no la estimación de la última evaluación. */
export function usarTipoCuerpo() {
  const [estado, setEstado] = useState<TipoCuerpoActual | null>(null)

  const cargar = useCallback(async () => {
    const [aj, evs] = await Promise.all([db.ajustes.get(CLAVE), db.evaluaciones.orderBy('fecha').toArray()])
    const lista = (aj?.valor as SomatotipoGuardado[] | undefined) ?? []
    const ultimoCompleto = lista[lista.length - 1]
    const conTipo = [...evs].reverse().find((e) => (e.resultados as Resultados | undefined)?.tipoCuerpo)
    const casero = (conTipo?.resultados as Resultados | undefined)?.tipoCuerpo
    const ultimaEv = evs[evs.length - 1]
    const d = (ultimaEv?.datos ?? {}) as { alturaCm?: number; pesoKg?: number }
    const r: TipoCuerpoActual = { alturaCm: d.alturaCm, pesoKg: d.pesoKg }
    if (casero) r.casero = { ...casero, tendencia: tendenciaActual(casero.tendencia) }
    if (ultimoCompleto) {
      const cat = categoriaSomatotipo(ultimoCompleto.endo, ultimoCompleto.meso, ultimoCompleto.ecto)
      r.completo = { ...ultimoCompleto, categoria: cat.nombre }
      r.tipo = cat.tipo
      r.fuente = 'completo'
    } else if (r.casero?.tendencia) {
      r.tipo = r.casero.tendencia
      r.fuente = 'casero'
    }
    setEstado(r)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { estado, recargar: cargar }
}
