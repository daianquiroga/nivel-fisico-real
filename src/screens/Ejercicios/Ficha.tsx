import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Aviso, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import {
  CRITERIO_ESCALERA,
  NOMBRES_EQUIPO,
  avisosLimitacion,
  ejercicio,
  equipoDisponible,
  escaleraDe,
  textoRango,
  urlVideo,
} from '../../lib/ejercicios'
import { ESPACIOS, LIMITACIONES } from '../../lib/perfil'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import s from './ejercicios.module.css'

const nombreLimitacion = (v: string) => LIMITACIONES.find((l) => l.valor === v)?.texto ?? v

export function Ficha() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const { perfil, lugares } = usarInicio()
  const ej = ejercicio(id)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const volver = (
    <div className={e.arriba}>
      <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
    </div>
  )

  if (!ej) {
    return (
      <div className={e.pantalla}>
        {volver}
        <h1 className={e.titulo}>No encontramos ese ejercicio</h1>
        <Link to="/aprender">Ir a la biblioteca</Link>
      </div>
    )
  }

  const avisos = avisosLimitacion(ej, perfil?.limitaciones ?? [])
  const equipo = equipoDisponible(lugares)
  const falta = lugares.length ? ej.equipo.filter((x) => !equipo.has(x)) : []
  const esc = escaleraDe(ej.id)
  const facil = ej.facil ? ejercicio(ej.facil) : undefined
  const dificil = ej.dificil ? ejercicio(ej.dificil) : undefined

  return (
    <div className={e.pantalla}>
      {volver}
      <header>
        <h1 className={e.titulo}>{ej.nombre}</h1>
        <p className={e.para}>
          Trabaja: <b>{ej.principal.join(', ')}</b>
          {ej.secundarios.length > 0 && <> · también {ej.secundarios.join(', ')}</>}
        </p>
      </header>
      <div className={s.etiquetas}>
        <span className={s.tag}>{ej.equipo.length ? ej.equipo.map((x) => NOMBRES_EQUIPO[x] ?? x).join(' + ') : 'Sin equipo'}</span>
        <span className={s.tag}>Espacio: {ESPACIOS.find((x) => x.valor === ej.espacio)?.texto ?? ej.espacio}</span>
        <span className={s.tag}>{textoRango(ej)}</span>
      </div>

      {avisos.map((a) =>
        a.nivel === 'evitar' ? (
          <Aviso key={a.limitacion} tipo="error">
            <b>Por tu {nombreLimitacion(a.limitacion).toLowerCase()}, mejor evitarlo.</b> {a.texto}
          </Aviso>
        ) : (
          <Tarjeta key={a.limitacion}>
            <p className="etiqueta" style={{ color: 'var(--soft)' }}>
              Adaptado a tu {nombreLimitacion(a.limitacion).toLowerCase()}
            </p>
            <p className={estilos.texto2}>{a.texto}</p>
          </Tarjeta>
        ),
      )}
      {falta.length > 0 && <p className={estilos.chico}>En tus lugares no está: {falta.map((x) => NOMBRES_EQUIPO[x] ?? x).join(', ')}.</p>}

      <Tarjeta>
        <div className={e.dibujo}>
          <DibujoEjercicio id={ej.id} />
        </div>
        <p className="etiqueta">Posición inicial</p>
        <p className={estilos.texto2}>{ej.inicial}</p>
        <p className="etiqueta">Cómo se hace</p>
        <ol className={s.seccion}>
          {ej.pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <p className="etiqueta">Respiración</p>
        <p className={estilos.texto2}>{ej.respiracion}</p>
        <a className={estilos.boton} href={urlVideo(ej)} target="_blank" rel="noopener noreferrer">
          Ver videos en YouTube (con internet)
        </a>
      </Tarjeta>

      <Tarjeta>
        <p className="etiqueta">Errores comunes</p>
        <ul className={s.seccion}>
          {ej.errores.map((x) => (
            <li key={x.error} className={s.error}>
              <b>{x.error}.</b> {x.detectar}
            </li>
          ))}
        </ul>
        <p className={estilos.chico}>Si algo duele (no solo cansa), pará. Si el dolor sigue, consultá a un profesional.</p>
      </Tarjeta>

      {ej.pesoInicial && (
        <Tarjeta>
          <p className="etiqueta">Con qué peso empezar</p>
          <p className={estilos.texto2}>{ej.pesoInicial}</p>
          <p className={estilos.chico}>
            Regla de la serie de prueba: hacé 10 y fijate cuántas más podrías haber hecho. Más de 4: subí un 10%. Entre 2 y 4: quedate ahí. Menos de 2:
            bajá un 10%. Las primeras 2 semanas dejá 3 o 4 en reserva para aprender bien la técnica.
          </p>
        </Tarjeta>
      )}

      <Tarjeta>
        <p className="etiqueta">Cuándo pasar al siguiente</p>
        <p className={estilos.texto2}>{ej.subir}</p>
        {esc && (
          <>
            <p className="etiqueta" style={{ marginTop: 6 }}>
              Escalera: {esc.escalera.nombre}
            </p>
            <div className={s.escalera}>
              {esc.escalera.pasos.map((pid, i) => {
                const x = ejercicio(pid)
                return (
                  <Link key={pid} to={`/ejercicio/${pid}`} replace className={`${s.escalon} ${i === esc.indice ? s.escalonActual : ''}`} aria-current={i === esc.indice ? 'step' : undefined}>
                    <i>{i + 1}</i>
                    {x?.nombre}
                  </Link>
                )
              })}
            </div>
            <p className={estilos.chico}>{CRITERIO_ESCALERA}</p>
          </>
        )}
      </Tarjeta>

      {(facil || dificil) && (
        <div className={s.vecinos}>
          {facil ? (
            <Link to={`/ejercicio/${facil.id}`} replace className={s.vecino}>
              <small>Más fácil</small>
              {facil.nombre}
            </Link>
          ) : (
            <span />
          )}
          {dificil && (
            <Link to={`/ejercicio/${dificil.id}`} replace className={s.vecino}>
              <small>Más difícil</small>
              {dificil.nombre}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
