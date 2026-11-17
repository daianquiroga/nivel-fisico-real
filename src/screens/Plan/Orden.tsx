import { useState } from 'react'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { ejercicio } from '../../lib/ejercicios'
import { COMO_ENCADENAR, fasesDe, revisarOrden } from '../../lib/plan/orden'
import s from './plan.module.css'

/** Si el orden de los ejercicios se puede mejorar: qué pasa y dos opciones para resolverlo. */
export function ConsejoOrden({ ejercicios, onOrdenar, onDejar }: { ejercicios: { id: string }[]; onOrdenar: () => void; onDejar?: () => void }) {
  const problemas = revisarOrden(ejercicios)
  if (!problemas.length) return null
  return (
    <div style={{ border: '1px solid var(--warn, var(--accent))', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p className="etiqueta" style={{ margin: 0 }}>
        Orden de los ejercicios
      </p>
      {problemas.slice(0, 2).map((p) => (
        <p key={p.id} className={estilos.texto2} style={{ margin: 0 }}>
          {p.texto}
        </p>
      ))}
      <div className={estilos.fila}>
        <Boton variante="principal" onClick={onOrdenar}>
          Ordenar así
        </Boton>
        {onDejar && <Boton onClick={onDejar}>Dejarlo como está</Boton>}
      </div>
    </div>
  )
}

/** Cómo encadenar la sesión: las partes que tiene, en orden, con el porqué. */
export function ComoEncadenar({ ejercicios }: { ejercicios: { id: string }[] }) {
  const [abierto, setAbierto] = useState(false)
  const fases = fasesDe(ejercicios)
  if (fases.length < 2) return null
  return (
    <Tarjeta>
      <button type="button" className={s.accion} aria-expanded={abierto} onClick={() => setAbierto(!abierto)} style={{ alignSelf: 'flex-start' }}>
        {abierto ? 'Cerrar' : 'Cómo encadenarlos y qué va después de qué'}
      </button>
      {abierto && (
        <>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fases.map((f) => (
              <li key={f.fase}>
                <b>{f.nombre}</b>: {f.ejercicios.map((id) => ejercicio(id)?.nombre).join(', ')}.<br />
                <span className={estilos.chico}>{f.porque}</span>
              </li>
            ))}
          </ol>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {COMO_ENCADENAR.map((c) => (
              <li key={c} className={estilos.chico}>
                {c}
              </li>
            ))}
          </ul>
        </>
      )}
    </Tarjeta>
  )
}
