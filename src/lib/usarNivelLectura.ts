import { useEffect, useState } from 'react'
import { nivelLecturaPorNivel, type NivelLectura } from './aprender'
import { nivelPorPercentil } from './calc/puntajes'
import { db } from './db/db'
import type { Resultados } from './evaluacion'

const CLAVE = 'nivel-lectura'

const leerGuardado = (): NivelLectura | null => {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'principiante' || v === 'intermedio' || v === 'avanzado' ? v : null
  } catch {
    return null
  }
}

/** Nivel con el que se leen los artículos: el que eligió la persona o, si no eligió, el de su última evaluación. */
export function usarNivelLectura() {
  const [elegido, setElegido] = useState<NivelLectura | null>(leerGuardado)
  const [sugerido, setSugerido] = useState<NivelLectura>('principiante')
  useEffect(() => {
    void db.evaluaciones
      .orderBy('fecha')
      .last()
      .then((ev) => {
        const r = ev?.resultados as Resultados | undefined
        const ps = [r?.areas?.fuerza, r?.areas?.cardio].filter((p): p is number => typeof p === 'number')
        if (ps.length) setSugerido(nivelLecturaPorNivel(nivelPorPercentil(ps.reduce((a, b) => a + b, 0) / ps.length).nivel))
      })
  }, [])
  const elegir = (n: NivelLectura) => {
    setElegido(n)
    try {
      localStorage.setItem(CLAVE, n)
    } catch {
      /* sin almacenamiento: queda solo en esta pantalla */
    }
  }
  return { nivel: elegido ?? sugerido, sugerido, elegir }
}
