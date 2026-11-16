import { Link } from 'react-router-dom'
import { Tarjeta, estilos } from '../../components/ui'
import { itemsDelDia, usarAgenda } from '../../lib/agenda'
import { diaDeHoy, type Semana } from '../../lib/perfil'
import type { PlanSemana } from '../../lib/plan/generador'
import { fechaLocal } from '../../lib/plan/sesion'
import { proximos } from '../Plan/Agenda'

/** Lo que viene en el día según la agenda. */
export function TuDia({ semana, plan }: { semana: Semana; plan: PlanSemana | null }) {
  const { agenda } = usarAgenda()
  if (!agenda) return null
  const items = itemsDelDia({ fecha: fechaLocal(), dia: diaDeHoy(), semana, agenda, plan })
  const lista = proximos(items)
  const sinBloques = !Object.values(agenda.plantillas).some((x) => x && x.length)
  return (
    <Tarjeta>
      <p className="etiqueta">Tu día</p>
      {lista.length === 0 ? (
        <p className={estilos.texto2}>No queda nada agendado para hoy.</p>
      ) : (
        lista.map((x) => (
          <p key={x.id} className={estilos.texto2} style={{ margin: 0 }}>
            <b>{x.desde}</b> · {x.nombre}
          </p>
        ))
      )}
      {sinBloques && <p className={estilos.chico}>Cargá tu trabajo y tus comidas en la agenda: así la app suma pausas activas y ubica mejor cada sesión.</p>}
      <Link to={`/plan?vista=agenda&dia=${diaDeHoy()}`} className={estilos.boton}>
        Ver la agenda
      </Link>
    </Tarjeta>
  )
}
