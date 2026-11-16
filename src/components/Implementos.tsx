import { implemento, sePuedeHacer, variantesDe } from '../lib/ejercicios'
import x from '../screens/Ejercicios/ejercicios.module.css'

/** Botones para elegir con qué hacer un ejercicio (barra, mancuernas, banda…). No muestra nada si hay una sola forma. */
export function Implementos({ id, onElegir, equipo }: { id: string; onElegir: (id: string) => void; equipo?: Set<string> | null }) {
  const vs = variantesDe(id)
  if (vs.length < 2) return null
  return (
    <span className={x.etiquetas} role="group" aria-label="Con qué hacerlo" style={{ gap: 6 }}>
      {vs.map((v) => {
        const falta = equipo && equipo.size > 0 && !sePuedeHacer(v, equipo)
        const on = v.id === id
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={on}
            className={`${x.filtro} ${on ? x.filtroOn : ''}`}
            style={{ minHeight: 40, opacity: falta && !on ? 0.55 : 1 }}
            onClick={() => !on && onElegir(v.id)}
            title={falta ? 'No figura en el equipo de tus lugares' : undefined}
          >
            {implemento(v)}
            {falta && !on ? ' · no lo tenés' : ''}
          </button>
        )
      })}
    </span>
  )
}
