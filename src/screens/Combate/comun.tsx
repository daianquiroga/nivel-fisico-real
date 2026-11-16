import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { leerTipo } from '../../lib/diario'
import { leerAjustesCombate, nivelPies, nivelSombra, type AjustesCombate, type PruebaPies, type PruebaSombra } from '../../lib/combate'
import e from '../Evaluacion/evaluacion.module.css'

export function Volver() {
  const navegar = useNavigate()
  return (
    <div className={e.arriba}>
      <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
    </div>
  )
}

export interface EstadoCombate {
  ajustes: AjustesCombate | null
  sombra: PruebaSombra[]
  pies: PruebaPies[]
}

/** Disciplina elegida y niveles aprobados, guardados en el celular. */
export function usarCombate() {
  const [estado, setEstado] = useState<EstadoCombate | null>(null)
  const recargar = useCallback(async () => {
    const [ajustes, sombra, pies] = await Promise.all([leerAjustesCombate(), leerTipo<PruebaSombra>('sombra'), leerTipo<PruebaPies>('pies')])
    setEstado({ ajustes, sombra, pies })
  }, [])
  useEffect(() => {
    void recargar()
  }, [recargar])
  const disc = estado?.ajustes?.disciplina ?? 'boxeo'
  return {
    estado,
    recargar,
    disciplina: disc,
    nivelSombra: estado ? nivelSombra(estado.sombra, disc) : 0,
    nivelPies: estado ? nivelPies(estado.pies) : 0,
  }
}
