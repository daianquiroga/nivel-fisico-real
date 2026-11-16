import { forwardRef, useImperativeHandle, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tarjeta, estilos } from '../../components/ui'
import type { Consejo } from '../../lib/coach/reglas'
import { activarLimitacion, pasarDeEtapa, usarCoach } from '../../lib/coach/usarCoach'
import { usarNivelLectura } from '../../lib/usarNivelLectura'
import c from './coach.module.css'

export interface CoachRef {
  recargar: () => void
}

const COLOR: Record<Consejo['clase'], string> = { aviso: c.aviso, sugerencia: c.sugerencia, celebrar: c.celebrar }

/** Tarjeta del coach: lo más importante de hoy según tus registros (hasta 3 consejos). */
export const Coach = forwardRef<CoachRef, { onCambioPerfil?: () => void }>(function Coach({ onCambioPerfil }, ref) {
  const { nivel } = usarNivelLectura()
  const { estado, recargar, ocultar } = usarCoach(nivel)
  const [hecho, setHecho] = useState<string | null>(null)
  useImperativeHandle(ref, () => ({ recargar: () => void recargar() }), [recargar])
  if (!estado || (!estado.consejos.length && !hecho)) return null
  const lista = estado.consejos.slice(0, 3)

  async function accionar(k: Consejo) {
    const a = k.accion
    if (!a) return
    if (a.tipo === 'limitacion') {
      await activarLimitacion(a.valor)
      setHecho('Listo: modo cuidado activado. Lo podés sacar desde Perfil.')
      onCambioPerfil?.()
    } else if (a.tipo === 'etapa' && estado?.etapa) {
      await pasarDeEtapa(estado.etapa.numero)
      setHecho(`¡Bienvenido a la etapa ${estado.etapa.numero + 1}!`)
    }
    await recargar()
  }

  return (
    <Tarjeta>
      <p className="etiqueta">Tu coach</p>
      {hecho && <p className={c.hecho}>{hecho}</p>}
      {lista.map((k) => (
        <section key={k.id} className={`${c.consejo} ${COLOR[k.clase]}`}>
          <div className={c.cabeza}>
            <h3 className={c.titulo}>{k.titulo}</h3>
            <button type="button" className={c.cerrar} onClick={() => ocultar(k.id)} aria-label={`Ocultar por hoy: ${k.titulo}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className={estilos.texto2}>{k.texto}</p>
          {k.pasos && (
            <ol className={c.pasos}>
              {k.pasos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          )}
          {k.accion?.tipo === 'ir' ? (
            <Link to={k.accion.a} className={estilos.boton}>
              {k.accion.texto}
            </Link>
          ) : (
            k.accion && (
              <button type="button" className={estilos.boton} onClick={() => void accionar(k)}>
                {k.accion.texto}
              </button>
            )
          )}
        </section>
      ))}
      {estado.consejos.length > 3 && <p className={estilos.chico}>Hay {estado.consejos.length - 3} consejo más: cerrá uno para verlo.</p>}
    </Tarjeta>
  )
})
