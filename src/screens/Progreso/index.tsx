import { Link } from 'react-router-dom'
import { GraficoCondicion, VistaResultados, fechaCorta, resultadosDe } from '../../components/Resultados'
import { Tarjeta, estilos } from '../../components/ui'
import r from '../../components/resultados.module.css'
import { records } from '../../lib/calc/progresion'
import { ejercicio } from '../../lib/ejercicios'
import { usarSesiones } from '../../lib/registroEjercicios'
import { diasParaProxima, usarEvaluaciones } from '../../lib/usarEvaluaciones'
import { usarInicio } from '../../lib/usarInicio'
import h from '../Hoy/hoy.module.css'

function TusEjercicios() {
  const { sesiones } = usarSesiones()
  if (!sesiones?.length) return null
  const ids = [...new Set([...sesiones].reverse().map((x) => x.ejercicio))]
  const n = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')
  return (
    <Tarjeta>
      <p className="etiqueta">Tus ejercicios</p>
      <div className={r.historial}>
        {ids.map((id) => {
          const ej = ejercicio(id)
          const propias = sesiones.filter((x) => x.ejercicio === id)
          const rec = records(propias)
          return (
            <Link key={id} to={`/ejercicio/${id}`} className={r.itemHistorial}>
              <span>
                {ej?.nombre ?? id}
                <small>
                  {propias.length} {propias.length === 1 ? 'sesión' : 'sesiones'}
                </small>
              </span>
              <b style={{ fontSize: 20 }}>
                {rec.cargaMax !== undefined ? `${n(rec.cargaMax)} kg` : `${rec.repsMax ?? 0}${ej?.tipo === 'segundos' ? ' s' : ''}`}
              </b>
            </Link>
          )
        })}
      </div>
      <p className={estilos.chico}>A la derecha, tu mejor marca: el peso más alto o la mejor serie.</p>
    </Tarjeta>
  )
}

export function Progreso() {
  const lista = usarEvaluaciones()
  const { perfil } = usarInicio()
  if (lista === null) return null

  if (lista.length === 0) {
    return (
      <>
        <h1 className="titulo-pantalla">Nivel físico real</h1>
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Todavía sin datos
          </p>
          <h2 className={h.tituloTarjeta}>Hacé tu primera evaluación</h2>
          <p className={estilos.texto2}>
            Vas a ver tu condición física de 0 a 100, tu edad física y tu nivel en cada área. Después, cada 4 semanas, cuánto mejoraste.
          </p>
          <Link to="/evaluacion" className={h.botonPrincipal}>
            Empezar
          </Link>
        </Tarjeta>
        <TusEjercicios />
      </>
    )
  }

  const ultima = lista[lista.length - 1]
  const puntos = lista
    .map((e) => ({ fecha: e.fecha, valor: resultadosDe(e).condicion }))
    .filter((p): p is { fecha: string; valor: number } => p.valor !== undefined)
  const faltan = diasParaProxima(ultima.fecha)
  const edad = Number((ultima.datos as { edad?: number }).edad ?? perfil?.edad ?? 30)

  return (
    <>
      <h1 className="titulo-pantalla">Nivel físico real</h1>
      <p className={estilos.chico}>Última evaluación: {fechaCorta(ultima.fecha)}</p>
      <VistaResultados r={resultadosDe(ultima)} edad={edad} />

      {puntos.length >= 2 && (
        <Tarjeta>
          <p className="etiqueta">Cómo vas</p>
          <GraficoCondicion puntos={puntos} />
        </Tarjeta>
      )}

      <TusEjercicios />

      <Tarjeta>
        <p className="etiqueta">Historial de evaluaciones</p>
        <div className={r.historial}>
          {[...lista].reverse().map((e) => {
            const c = resultadosDe(e).condicion
            return (
              <Link key={e.id} to={`/resultado/${e.id}`} className={r.itemHistorial}>
                <span>
                  {fechaCorta(e.fecha)}
                  <small>{e.modo === 'rapida' ? 'Rápida' : 'Completa'}</small>
                </span>
                <b>{c === undefined ? '—' : Math.round(c)}</b>
              </Link>
            )
          })}
        </div>
      </Tarjeta>

      <Tarjeta>
        <p className="etiqueta">Próxima evaluación</p>
        <p className={estilos.texto2}>{faltan > 0 ? `En ${faltan} ${faltan === 1 ? 'día' : 'días'}. Antes de eso los cambios todavía no se notan en las pruebas.` : 'Ya podés repetirla.'}</p>
        <Link to="/evaluacion" className={h.botonPrincipal} style={faltan > 0 ? { background: 'var(--surface-2)', color: 'var(--text)' } : undefined}>
          {faltan > 0 ? 'Hacerla igual' : 'Evaluarme otra vez'}
        </Link>
      </Tarjeta>
    </>
  )
}
