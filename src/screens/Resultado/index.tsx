import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { VistaResultados, fechaCorta, resultadosDe } from '../../components/Resultados'
import { Boton, Dialogo, estilos } from '../../components/ui'
import { db, type Evaluacion } from '../../lib/db/db'
import { DIAS_ENTRE_EVALUACIONES } from '../../lib/evaluacion'
import s from '../Evaluacion/evaluacion.module.css'

export function Resultado() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [ev, setEv] = useState<Evaluacion | null | undefined>(undefined)
  const [borrar, setBorrar] = useState(false)

  useEffect(() => {
    void db.evaluaciones.get(Number(id)).then((e) => setEv(e ?? null))
  }, [id])

  if (ev === undefined) return null
  if (ev === null || !ev.resultados) {
    return (
      <div className={s.pantalla}>
        <h1 className={s.titulo}>No la encontramos</h1>
        <Link to="/progreso">Volver a Progreso</Link>
      </div>
    )
  }

  const edad = Number((ev.datos as { edad?: number }).edad ?? 30)

  return (
    <div className={s.pantalla}>
      <div className={s.arriba}>
        <button type="button" className={s.volver} onClick={() => navegar('/progreso')} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span className={s.contador}>
          {fechaCorta(ev.fecha)} · {ev.modo === 'rapida' ? 'rápida' : 'completa'}
        </span>
      </div>
      <h1 className={s.titulo}>Tus resultados</h1>
      <VistaResultados r={resultadosDe(ev)} edad={edad} />
      <p className={estilos.chico}>Repetí la evaluación en {DIAS_ENTRE_EVALUACIONES / 7} semanas para ver cuánto mejoraste.</p>
      <Boton variante="principal" ancho onClick={() => navegar('/')}>
        Listo
      </Boton>
      <button type="button" className={s.saltear} onClick={() => setBorrar(true)}>
        Borrar esta evaluación
      </button>
      {borrar && (
        <Dialogo titulo="¿Borrar esta evaluación?" onCerrar={() => setBorrar(false)}>
          <p className={estilos.texto2}>Se borra del historial. No se puede deshacer (salvo que tengas un respaldo).</p>
          <div className={estilos.fila}>
            <Boton onClick={() => setBorrar(false)}>Cancelar</Boton>
            <Boton
              variante="principal"
              onClick={() => {
                void db.evaluaciones.delete(ev.id!).then(() => navegar('/progreso', { replace: true }))
              }}
            >
              Borrar
            </Boton>
          </div>
        </Dialogo>
      )}
    </div>
  )
}
