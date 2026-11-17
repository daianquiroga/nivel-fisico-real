import { useState } from 'react'
import { Stepper } from './controles'
import { Tarjeta, estilos } from './ui'
import type { Horario } from '../lib/plan/asistente'
import { NOMBRES_DIAS } from '../lib/perfil'
import x from '../screens/Ejercicios/ejercicios.module.css'

const RAPIDOS = [20, 30, 45, 60, 90]

/** Hora y tiempo de cada día elegido; un día puede tener hasta 3 horarios (por ejemplo, mañana y noche). */
export function HorariosDia({
  dias,
  horarios,
  onCambiar,
}: {
  dias: number[]
  /** Horarios de lunes (0) a domingo (6). */
  horarios: Horario[][]
  onCambiar: (h: Horario[][]) => void
}) {
  const primero = horarios[dias[0]]?.[0] ?? { hora: '19:00', minutos: 45 }
  const [todos, setTodos] = useState<Horario>(primero)
  const cambiarDia = (d: number, hs: Horario[]) => onCambiar(horarios.map((h, i) => (i === d ? hs : h)))
  const aplicarTodos = (h: Horario) => {
    setTodos(h)
    onCambiar(horarios.map((hs, d) => (dias.includes(d) ? [h, ...hs.slice(1)] : hs)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Tarjeta>
        <p className="etiqueta">Igual para todos los días</p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className={estilos.chico}>Hora</span>
          <input className={x.buscador} style={{ fontSize: 20, minHeight: 52 }} type="time" value={todos.hora} onChange={(ev) => ev.target.value && aplicarTodos({ ...todos, hora: ev.target.value })} />
        </label>
        <div className={x.etiquetas} role="group" aria-label="Tiempo para todos los días" style={{ gap: 6 }}>
          {RAPIDOS.map((m) => (
            <button key={m} type="button" aria-pressed={todos.minutos === m} className={`${x.filtro} ${todos.minutos === m ? x.filtroOn : ''}`} style={{ minHeight: 48 }} onClick={() => aplicarTodos({ ...todos, minutos: m })}>
              {m} min
            </button>
          ))}
        </div>
      </Tarjeta>
      <p className="etiqueta" style={{ margin: '4px 0 0' }}>
        O cambiá cada día
      </p>
      {dias.map((d) => {
        const hs = horarios[d]?.length ? horarios[d] : [todos]
        return (
          <Tarjeta key={d}>
            <p className="etiqueta" style={{ margin: 0 }}>
              {NOMBRES_DIAS[d]}
              {hs.length > 1 ? ` · ${hs.length} horarios` : ''}
            </p>
            {hs.map((h, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: i ? '1px solid var(--line)' : undefined, paddingTop: i ? 8 : 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={estilos.chico} style={{ width: 92 }}>
                    {i === 0 ? 'Hora' : `${i + 1}º horario`}
                  </span>
                  <input className={x.buscador} style={{ fontSize: 18, minHeight: 48, flex: 1 }} type="time" value={h.hora} onChange={(ev) => ev.target.value && cambiarDia(d, hs.map((y, j) => (j === i ? { ...y, hora: ev.target.value } : y)))} />
                </label>
                <Stepper etiqueta="Tiempo" valor={h.minutos} min={10} max={180} paso={5} unidad="min" onCambio={(m) => cambiarDia(d, hs.map((y, j) => (j === i ? { ...y, minutos: m } : y)))} />
                {i > 0 && (
                  <button type="button" className={x.filtro} onClick={() => cambiarDia(d, hs.filter((_, j) => j !== i))}>
                    Sacar este horario
                  </button>
                )}
              </div>
            ))}
            {hs.length < 3 && (
              <button
                type="button"
                className={x.filtro}
                style={{ borderColor: 'var(--accent)', minHeight: 48 }}
                onClick={() => {
                  const ultimo = hs[hs.length - 1]
                  const [a, b] = ultimo.hora.split(':').map(Number)
                  const t = (a * 60 + b + ultimo.minutos + 120) % 1440
                  cambiarDia(d, [...hs, { hora: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, minutos: 20 }])
                }}
              >
                + Otro horario el {NOMBRES_DIAS[d].toLowerCase()}
              </button>
            )}
          </Tarjeta>
        )
      })}
    </div>
  )
}
