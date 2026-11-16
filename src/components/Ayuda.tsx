import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ayuda from '../content/ayuda.json'
import { db } from '../lib/db/db'
import { Icono } from './Icono'
import { Boton, Dialogo, estilos } from './ui'
import s from './ayuda.module.css'

type Pantalla = { pestana: number; titulo: string; queEs: string; pasos: string[] }
const PANTALLAS = ayuda.pantallas as Record<string, Pantalla>
const ICONOS = ['hoy', 'plan', 'progreso', 'aprender', 'perfil']
const NOMBRES = ['Hoy', 'Plan', 'Progreso', 'Aprender', 'Perfil']
const CLAVE = 'recorrido-visto'

/** Dibujo de un celular con la barra de abajo y la pestaña marcada (o el botón ? si pestana = -1). */
export function DibujoPestana({ pestana }: { pestana: number }) {
  return (
    <svg viewBox="0 0 200 150" className={s.dibujo} role="img" aria-label={pestana >= 0 ? `Pestaña ${NOMBRES[pestana]} en la barra de abajo` : 'Botón de ayuda arriba a la derecha'}>
      <rect x="40" y="4" width="120" height="142" rx="14" fill="var(--bg)" stroke="var(--line)" strokeWidth="2" />
      <rect x="54" y="22" width="60" height="8" rx="4" fill="var(--line)" />
      <rect x="54" y="40" width="92" height="34" rx="6" fill="var(--surface)" stroke={pestana === 0 ? 'var(--accent)' : 'var(--line)'} strokeWidth="1.5" />
      <rect x="62" y="60" width="76" height="9" rx="4" fill={pestana === 0 ? 'var(--accent)' : 'var(--line)'} />
      <rect x="54" y="80" width="92" height="22" rx="6" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
      <circle cx="140" cy="26" r={pestana === -1 ? 9 : 6} fill={pestana === -1 ? 'var(--accent)' : 'var(--surface)'} stroke="var(--line)" strokeWidth="1.5" />
      <text x="140" y="30" textAnchor="middle" fontSize={pestana === -1 ? 12 : 8} fontWeight="700" fill="var(--text)">
        ?
      </text>
      <line x1="40" y1="116" x2="160" y2="116" stroke="var(--line)" strokeWidth="1.5" />
      {NOMBRES.map((n, i) => {
        const cx = 52 + i * 24
        const on = i === pestana
        return (
          <g key={n}>
            {on && <rect x={cx - 11} y="119" width="22" height="22" rx="6" fill="var(--accent-tint)" stroke="var(--accent)" strokeWidth="1.5" />}
            <circle cx={cx} cy="127" r="4" fill="none" stroke={on ? 'var(--accent)' : 'var(--muted)'} strokeWidth="1.5" />
            <rect x={cx - 6} y="134" width="12" height="3" rx="1.5" fill={on ? 'var(--accent)' : 'var(--muted)'} />
          </g>
        )
      })}
      {pestana >= 0 && <path d={`M${52 + pestana * 24} 112 l-5 -8 h10 z`} fill="var(--accent)" />}
    </svg>
  )
}

/** Botón ? fijo arriba a la derecha + recorrido de la primera vez. */
export function Ayuda() {
  const { pathname } = useLocation()
  const [abierta, setAbierta] = useState(false)
  const [paso, setPaso] = useState<number | null>(null)
  const info = PANTALLAS[pathname]

  useEffect(() => {
    void Promise.all([db.perfil.get('yo'), db.ajustes.get(CLAVE)]).then(([p, visto]) => {
      if (p?.inicioCompleto && !visto) setPaso(0)
    })
  }, [pathname])

  async function terminar() {
    setPaso(null)
    await db.ajustes.put({ clave: CLAVE, valor: true })
  }

  const pasos = ayuda.recorrido
  const r = paso !== null ? pasos[paso] : null

  return (
    <>
      {info && (
        <button type="button" className={s.boton} onClick={() => setAbierta(true)} aria-label={`Ayuda: qué hay en ${info.titulo}`}>
          ?
        </button>
      )}
      {abierta && info && (
        <Dialogo titulo={info.titulo} onCerrar={() => setAbierta(false)}>
          <DibujoPestana pestana={info.pestana} />
          <p className={estilos.texto2}>
            <b>{info.queEs}</b>
          </p>
          <ol className={s.lista}>
            {info.pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <Boton variante="principal" onClick={() => setAbierta(false)}>
            Entendido
          </Boton>
          <Boton
            onClick={() => {
              setAbierta(false)
              setPaso(0)
            }}
          >
            Ver el recorrido de la app
          </Boton>
        </Dialogo>
      )}
      {r && paso !== null && (
        <Dialogo titulo={r.titulo} onCerrar={() => void terminar()}>
          <DibujoPestana pestana={r.pestana} />
          {r.pestana >= 0 && (
            <p className={s.pestana}>
              <Icono nombre={ICONOS[r.pestana]} tam={20} /> {NOMBRES[r.pestana]}
            </p>
          )}
          <p className={estilos.texto2}>{r.texto}</p>
          <p className={estilos.chico}>
            {paso + 1} de {pasos.length}
          </p>
          <Boton variante="principal" onClick={() => (paso + 1 < pasos.length ? setPaso(paso + 1) : void terminar())}>
            {paso + 1 < pasos.length ? 'Siguiente' : '¡Listo, a entrenar!'}
          </Boton>
          {paso + 1 < pasos.length && <Boton onClick={() => void terminar()}>Saltar</Boton>}
        </Dialogo>
      )}
    </>
  )
}
