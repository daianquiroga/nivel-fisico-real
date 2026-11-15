import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import s from './ui.module.css'

export function Tarjeta({ children, destacada }: { children: ReactNode; destacada?: boolean }) {
  return <section className={`${s.tarjeta} ${destacada ? s.destacada : ''}`}>{children}</section>
}

type PropsBoton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'principal' | 'secundario'
  ancho?: boolean
}

export function Boton({ variante = 'secundario', ancho, className = '', ...resto }: PropsBoton) {
  const clases = [s.boton, variante === 'principal' ? s.principal : '', ancho ? s.ancho : '', className]
  return <button type="button" className={clases.join(' ')} {...resto} />
}

export function Aviso({ tipo, children }: { tipo: 'ok' | 'error'; children: ReactNode }) {
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`${s.aviso} ${tipo === 'ok' ? s.ok : s.error}`}>
      {children}
    </p>
  )
}

/** Diálogo propio (nunca alert/confirm). Se cierra con Escape o tocando afuera. */
export function Dialogo({
  titulo,
  children,
  onCerrar,
}: {
  titulo: string
  children: ReactNode
  onCerrar: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])
  return (
    <div className={s.fondoDialogo} onClick={onCerrar}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={s.dialogo}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

export const estilos = s
