import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Tarjeta, estilos } from '../../components/ui'
import { sesionesHechas } from '../../lib/diario'
import { faltoAyer, hechasPorSemana, lunesDe, racha, sesionesQueCuentan } from '../../lib/habitos'
import { diaDeHoy } from '../../lib/perfil'
import type { PlanSemana } from '../../lib/plan/generador'
import { fechaLocal } from '../../lib/plan/sesion'
import p from '../Plan/plan.module.css'

export function Constancia({ plan }: { plan: PlanSemana }) {
  const [fechas, setFechas] = useState<string[] | null>(null)
  useEffect(() => {
    void sesionesHechas().then((l) => setFechas(l.map((s) => s.fecha.slice(0, 10))))
  }, [])
  if (!fechas) return null
  const planeadas = sesionesQueCuentan(plan).length
  const estaSemana = hechasPorSemana(fechas).get(lunesDe(fechaLocal())) ?? 0
  const r = racha(fechas, planeadas)
  const falto = faltoAyer(plan, fechas)
  const hoyIdx = plan.dias[diaDeHoy()].sesiones.findIndex((s) => s.tipo !== 'movilidad' && s.ejercicios.length > 0)
  return (
    <Tarjeta>
      <p className="etiqueta">Constancia</p>
      <div className={p.cabeza}>
        <h2>
          {r} {r === 1 ? 'semana' : 'semanas'}
        </h2>
        <span className={p.meta}>de racha</span>
      </div>
      <p className={estilos.chico}>
        Esta semana: {estaSemana} de {planeadas} sesiones. La semana cuenta si hacés al menos el 70 % (las versiones mínimas valen).
      </p>
      <div className={p.pista} aria-hidden="true">
        <b className={estaSemana >= Math.ceil(planeadas * 0.7) ? p.ok : p.falta} style={{ width: `${Math.min(100, Math.max(2, (estaSemana / Math.max(1, planeadas)) * 100))}%` }} />
      </div>
      {falto && (
        <Aviso tipo="error">
          Ayer no entrenaste. La regla de oro: nunca faltar dos veces seguidas. Si hoy no te da el tiempo, hacé la versión mínima de 10 minutos.
          {hoyIdx >= 0 && (
            <>
              {' '}
              <Link to={`/entrenar/${diaDeHoy()}/${hoyIdx}`}>Entrenar hoy</Link>
            </>
          )}
        </Aviso>
      )}
      <p className={estilos.chico}>Formar un hábito lleva en promedio unos 66 días: pensá en 3 meses, no en 21 días.</p>
    </Tarjeta>
  )
}
