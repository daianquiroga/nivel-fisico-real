import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lienzo, Texto } from '../../components/Figura'
import { Tarjeta, estilos } from '../../components/ui'
import { ETAPAS, type EstadoEtapa } from '../../lib/coach/etapas'
import { calcularCoach, pasarDeEtapa } from '../../lib/coach/usarCoach'
import { usarNivelLectura } from '../../lib/usarNivelLectura'

/** Escalera de las 5 etapas con la actual marcada. */
export function EscaleraEtapas({ actual }: { actual: number }) {
  return (
    <Lienzo etiqueta={`Etapa ${actual} de 5: ${ETAPAS[actual - 1]}`} alto={120}>
      {ETAPAS.map((n, i) => {
        const x = 8 + i * 62
        const alto = 22 + i * 16
        const estado = i + 1 < actual ? 'var(--done)' : i + 1 === actual ? 'var(--accent)' : 'var(--surface-2)'
        return (
          <g key={n}>
            <rect x={x} y={100 - alto} width={56} height={alto} rx={4} fill={estado} />
            <Texto x={x + 28} y={116} color={i + 1 === actual ? 'var(--text)' : undefined}>{String(i + 1)}</Texto>
          </g>
        )
      })}
    </Lienzo>
  )
}

export function Etapa() {
  const { nivel } = usarNivelLectura()
  const [etapa, setEtapa] = useState<EstadoEtapa | null | undefined>(undefined)
  const [aviso, setAviso] = useState<string | null>(null)
  const cargar = () => void calcularCoach(nivel).then((r) => setEtapa(r.etapa))
  useEffect(cargar, [nivel]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!etapa) return null
  return (
    <Tarjeta>
      <p className="etiqueta">Tu etapa</p>
      <h2 style={{ margin: 0 }}>
        {etapa.numero}. {etapa.nombre}
      </h2>
      <EscaleraEtapas actual={etapa.numero} />
      <p className={estilos.chico}>Cada etapa dura de 8 a 12 semanas. Para pasar a la siguiente:</p>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {etapa.requisitos.map((r) => (
          <li key={r.texto} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span aria-hidden="true" style={{ color: r.ok ? 'var(--done)' : 'var(--muted)', fontWeight: 700 }}>
              {r.ok ? '✓' : '○'}
            </span>
            <span className={estilos.texto2}>
              {r.texto} <span className={estilos.chico}>· {r.detalle}</span>
              <span className="sr-only">{r.ok ? ' (cumplido)' : ' (falta)'}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link to="/tecnica" className={estilos.boton}>
        Checklist de técnica de los básicos
      </Link>
      {aviso && <p className={estilos.chico}>{aviso}</p>}
      {etapa.lista && (
        <button
          type="button"
          className={estilos.boton}
          onClick={() =>
            void pasarDeEtapa(etapa.numero).then((r) => {
              setAviso(r.replanificado ? 'Listo: tu plan se volvió a armar con una serie más en los ejercicios principales.' : 'Listo. Como cambiaste el plan a mano, sumale vos una serie a los principales (o volvé a armarlo en Plan).')
              cargar()
            })
          }
        >
          Pasar a la etapa {etapa.numero + 1}
        </button>
      )}
      <p className={estilos.chico}>Los requisitos salen de la especificación de la app. Cada etapa nueva suma exigencia: una serie más en los principales desde la 2 y en los accesorios desde la 3.</p>
    </Tarjeta>
  )
}
