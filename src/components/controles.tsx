import type { ReactNode } from 'react'
import s from './controles.module.css'

/** Número con botones − y + (escribir lo menos posible). */
export function Stepper({
  etiqueta,
  valor,
  onCambio,
  min,
  max,
  paso = 1,
  unidad,
}: {
  etiqueta: string
  valor: number
  onCambio: (v: number) => void
  min: number
  max: number
  paso?: number
  unidad?: string
}) {
  const redondear = (v: number) => Math.round(v * 100) / 100
  return (
    <div className={s.campo}>
      <span>{etiqueta}</span>
      <div className={s.stepper} role="group" aria-label={etiqueta}>
        <button
          type="button"
          aria-label={`Restar ${paso}`}
          disabled={valor <= min}
          onClick={() => onCambio(Math.max(min, redondear(valor - paso)))}
        >
          −
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className={s.valor} aria-live="polite">
            {String(valor).replace('.', ',')}
          </span>
          {unidad && <span className={s.unidad}>{unidad}</span>}
        </div>
        <button
          type="button"
          aria-label={`Sumar ${paso}`}
          disabled={valor >= max}
          onClick={() => onCambio(Math.min(max, redondear(valor + paso)))}
        >
          +
        </button>
      </div>
    </div>
  )
}

/** Opciones tildables con forma de píldora. */
export function Chips<T extends string>({
  opciones,
  elegidas,
  onCambio,
  etiqueta,
}: {
  opciones: { valor: T; texto: string }[]
  elegidas: T[]
  onCambio: (v: T[]) => void
  etiqueta: string
}) {
  return (
    <div className={s.chips} role="group" aria-label={etiqueta}>
      {opciones.map((o) => {
        const on = elegidas.includes(o.valor)
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={on}
            className={`${s.chip} ${on ? s.chipOn : ''}`}
            onClick={() => onCambio(on ? elegidas.filter((x) => x !== o.valor) : [...elegidas, o.valor])}
          >
            {o.texto}
          </button>
        )
      })}
    </div>
  )
}

/** Elegir una opción entre pocas. */
export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
}: {
  opciones: { valor: T; texto: ReactNode }[]
  valor: T | undefined
  onCambio: (v: T) => void
  etiqueta: string
}) {
  return (
    <div className={s.segmentado} role="radiogroup" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          className={`${s.segmento} ${valor === o.valor ? s.segmentoOn : ''}`}
          onClick={() => onCambio(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

export function Hora({ etiqueta, valor, onCambio }: { etiqueta: string; valor: string; onCambio: (v: string) => void }) {
  return (
    <label className={s.campo}>
      <span>{etiqueta}</span>
      <input type="time" className={s.hora} value={valor} onChange={(e) => onCambio(e.target.value)} />
    </label>
  )
}

export const estilosControles = s
