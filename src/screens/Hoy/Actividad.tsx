import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stepper } from '../../components/controles'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import mets from '../../content/normas/mets.json'
import { intensidad, kcal, minutosEquivalentes } from '../../lib/calc/calorias'
import { borrarRegistro, guardarActividad, guardarAgua, leerAgua, usarActividades, type Actividad as Act } from '../../lib/diario'
import { fechaLocal } from '../../lib/plan/sesion'
import e from '../Ejercicios/ejercicios.module.css'
import p from '../Plan/plan.module.css'

type Variantes = Record<string, { texto: string; met: number; codigo: string }>
const ACTIVIDADES = mets.actividades as Record<string, { nombre: string; variantes: Variantes }>
const CON_DISTANCIA = ['caminata', 'trote', 'bici']
const coma = (x: number, d = 0) => x.toFixed(d).replace('.', ',')

/** Lunes de esta semana, como fecha local. */
function lunes(hoy = new Date()) {
  const d = new Date(hoy)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return fechaLocal(d)
}

export function Actividad({ pesoKg }: { pesoKg?: number }) {
  const { lista, recargar } = usarActividades()
  const [form, setForm] = useState<{ actividad: string; variante: string; minutos: number; km: number } | null>(null)
  if (!lista) return null
  const hoy = fechaLocal()
  const deHoy = lista.filter((a) => a.fecha === hoy)
  const semana = lista.filter((a) => a.fecha >= lunes())
  const minHoy = deHoy.reduce((s, a) => s + a.minutos, 0)
  const kcalHoy = pesoKg ? deHoy.reduce((s, a) => s + kcal(a.met, pesoKg, a.minutos), 0) : 0
  const cardioSemana = Math.round(semana.reduce((s, a) => s + minutosEquivalentes(a.met, a.minutos), 0))

  async function guardar() {
    if (!form) return
    const act = ACTIVIDADES[form.actividad]
    const v = act.variantes[form.variante]
    await guardarActividad({
      fecha: hoy,
      nombre: `${act.nombre}${Object.keys(act.variantes).length > 1 ? ` · ${v.texto.toLowerCase()}` : ''}`,
      met: v.met,
      minutos: form.minutos,
      distanciaKm: CON_DISTANCIA.includes(form.actividad) && form.km > 0 ? form.km : undefined,
      actividad: form.actividad,
      variante: form.variante,
      origen: 'manual',
    })
    setForm(null)
    await recargar()
  }

  return (
    <Tarjeta>
      <p className="etiqueta">Actividad de hoy</p>
      <div className={p.cabeza}>
        <h2>{minHoy} min</h2>
        <span className={p.meta}>{pesoKg ? `≈ ${coma(kcalHoy)} kcal (estimación)` : 'Cargá tu peso para estimar calorías'}</span>
      </div>
      {deHoy.map((a: Act) => (
        <div key={a.id} className={p.ejercicio}>
          <span className={p.info}>
            <b>{a.nombre}</b>
            <span>
              {a.minutos} min{a.distanciaKm ? ` · ${coma(a.distanciaKm, 1)} km` : ''}
              {pesoKg ? ` · ${coma(kcal(a.met, pesoKg, a.minutos))} kcal` : ''} · {intensidad(a.met)}
              {a.origen === 'entrenar' ? ' · desde Entrenar' : ''}
            </span>
          </span>
          <button
            type="button"
            className={p.accion}
            aria-label={`Borrar ${a.nombre}`}
            onClick={() => {
              if (a.id) void borrarRegistro(a.id).then(recargar)
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <p className={estilos.chico}>Cardio de esta semana: {cardioSemana} de 150 minutos (los vigorosos cuentan doble, como indica la OMS).</p>
      <div className={p.pista} aria-hidden="true">
        <b className={cardioSemana >= 150 ? p.ok : p.falta} style={{ width: `${Math.min(100, Math.max(2, (cardioSemana / 150) * 100))}%` }} />
      </div>

      {form ? (
        <>
          <div className={e.filtros} role="radiogroup" aria-label="Actividad" style={{ flexWrap: 'wrap' }}>
            {Object.entries(ACTIVIDADES).map(([id, a]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={form.actividad === id}
                className={`${e.filtro} ${form.actividad === id ? e.filtroOn : ''}`}
                onClick={() => setForm({ ...form, actividad: id, variante: Object.keys(a.variantes).includes('moderada') ? 'moderada' : Object.keys(a.variantes)[0] })}
              >
                {a.nombre}
              </button>
            ))}
          </div>
          {Object.keys(ACTIVIDADES[form.actividad].variantes).length > 1 && (
            <div className={e.filtros} role="radiogroup" aria-label="Intensidad" style={{ flexWrap: 'wrap' }}>
              {Object.entries(ACTIVIDADES[form.actividad].variantes).map(([id, v]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={form.variante === id}
                  className={`${e.filtro} ${form.variante === id ? e.filtroOn : ''}`}
                  onClick={() => setForm({ ...form, variante: id })}
                >
                  {v.texto}
                </button>
              ))}
            </div>
          )}
          <Stepper etiqueta="Minutos" valor={form.minutos} min={5} max={300} paso={5} unidad="min" onCambio={(v) => setForm({ ...form, minutos: v })} />
          {CON_DISTANCIA.includes(form.actividad) && (
            <Stepper etiqueta="Distancia (opcional)" valor={form.km} min={0} max={200} paso={0.5} unidad="km" onCambio={(v) => setForm({ ...form, km: v })} />
          )}
          <details>
            <summary className={estilos.chico}>Saber más</summary>
          <p className={estilos.chico}>
            {ACTIVIDADES[form.actividad].variantes[form.variante].met.toString().replace('.', ',')} MET (Compendium of Physical Activities 2024). Las calorías son una
            estimación: MET × peso × horas.
          </p>
          </details>
          <div className={estilos.fila}>
            <Boton onClick={() => setForm(null)}>Cancelar</Boton>
            <Boton variante="principal" onClick={() => void guardar()}>
              Guardar
            </Boton>
          </div>
        </>
      ) : (
        <Boton ancho onClick={() => setForm({ actividad: 'caminata', variante: 'rapida', minutos: 30, km: 0 })}>
          + Anotar caminata, bici, soga…
        </Boton>
      )}
      <Link to="/ejercicio/caminata-rapida" className={estilos.chico}>
        Cómo caminar mejor
      </Link>
    </Tarjeta>
  )
}

/* ---------- Agua ---------- */

function Vaso({ lleno = 1 }: { lleno?: number }) {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true">
      <path d="M3,3 L19,3 L17,25 L5,25 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${4 + (1 - lleno) * 1.5},${3 + 22 * (1 - lleno) + 4} L${18 - (1 - lleno) * 1.5},${3 + 22 * (1 - lleno) + 4} L17,25 L5,25 Z`} fill="var(--soft)" opacity={0.8} />
    </svg>
  )
}

function Botella() {
  return (
    <svg width="18" height="30" viewBox="0 0 18 30" aria-hidden="true">
      <path d="M7,2 L11,2 L11,6 Q16,8 16,13 L16,27 Q16,28 15,28 L3,28 Q2,28 2,27 L2,13 Q2,8 7,6 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3,14 L15,14 L15,27 L3,27 Z" fill="var(--soft)" opacity={0.8} />
    </svg>
  )
}

/** Escala de color de la orina: orientativa. */
function EscalaOrina() {
  const colores = ['#f6f1c9', '#f3e79b', '#eedd73', '#e4c94f', '#d3ad2f', '#b98b1e', '#956a14']
  return (
    <svg viewBox="0 0 320 70" width="100%" role="img" aria-label="Escala de color: de amarillo muy claro (bien) a ámbar oscuro (tomá agua)">
      {colores.map((c, i) => (
        <rect key={c} x={8 + i * 44} y={8} width={40} height={30} rx={6} fill={c} />
      ))}
      <text x={8} y={56} style={{ fontSize: 12, fill: 'var(--done)' }}>
        Claro: bien
      </text>
      <text x={312} y={56} textAnchor="end" style={{ fontSize: 12, fill: 'var(--accent)' }}>
        Oscuro: tomá agua
      </text>
    </svg>
  )
}

export function Agua({ sexo }: { sexo: 'h' | 'm' }) {
  const [ml, setMl] = useState<number | null>(null)
  const hoy = fechaLocal()
  useEffect(() => {
    void leerAgua().then((l) => setMl(l.find((d) => d.fecha === hoy)?.ml ?? 0))
  }, [hoy])
  if (ml === null) return null
  const referencia = sexo === 'm' ? 2000 : 2500
  const cambiar = async (d: number) => {
    const n = Math.max(0, ml + d)
    setMl(n)
    await guardarAgua({ fecha: hoy, ml: n })
  }
  return (
    <Tarjeta>
      <p className="etiqueta">Agua</p>
      <div className={p.cabeza}>
        <h2>{coma(ml / 1000, 2)} L</h2>
        <span className={p.meta}>referencia {coma(referencia / 1000, 1)} L de agua total</span>
      </div>
      <div className={p.pista} aria-hidden="true">
        <b className={p.ok} style={{ width: `${Math.min(100, Math.max(2, (ml / referencia) * 100))}%`, background: 'var(--soft)' }} />
      </div>
      <div className={estilos.fila}>
        <Boton onClick={() => void cambiar(250)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Vaso /> Vaso
          </span>
        </Boton>
        <Boton onClick={() => void cambiar(500)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Botella /> Botella
          </span>
        </Boton>
        <Boton onClick={() => void cambiar(-250)} aria-label="Restar un vaso">
          −
        </Boton>
      </div>
      <details className={e.detalle}>
        <summary>¿Cómo sé si tomo suficiente?</summary>
        <p className={estilos.texto2}>
          Como referencia, la EFSA (Autoridad Europea de Seguridad Alimentaria) propone {sexo === 'm' ? '2,0' : '2,5'} litros de agua total por día, contando la que
          viene en la comida. La mejor guía es la sed y el color de la orina; tomá más en días de calor y cuando entrenás.
        </p>
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '6px 4px 2px' }}>
          <EscalaOrina />
        </div>
        <p className={estilos.chico}>Escala orientativa. Algunas vitaminas y comidas cambian el color.</p>
      </details>
    </Tarjeta>
  )
}
