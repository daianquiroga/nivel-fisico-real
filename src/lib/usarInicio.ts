import { useEffect, useState } from 'react'
import type { Lugar, Perfil } from './db/db'
import { cargarInicio, type Semana } from './perfil'

/** Lee el perfil, los lugares y la semana guardados. */
export function usarInicio() {
  const [datos, setDatos] = useState<{ cargado: boolean; perfil?: Perfil; lugares: Lugar[]; semana?: Semana }>({
    cargado: false,
    lugares: [],
  })
  useEffect(() => {
    void cargarInicio().then((d) => setDatos({ cargado: true, ...d }))
  }, [])
  return datos
}
