import { useState } from 'react'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import normas from '../../content/normas/pasos.json'
import { metaPasos } from '../../lib/calc/pasos'
import { guardarPasos, ultimosDias, usarPasos, type DiaPasos } from '../../lib/diario'
import { fechaLocal } from '../../lib/plan/sesion'
import e from '../Ejercicios/ejercicios.module.css'
import p from '../Plan/plan.module.css'

const miles = (n: number) => n.toLocaleString('es-AR')

/** Meta de pasos de hoy según edad y los últimos 7 días (sin contar hoy). */
export function usarMetaPasos(edad: number) {
  const { lista, recargar } = usarPasos()
  if (!lista) return null
  const dias = ultimosDias(lista, 8)
  const hoy = dias[dias.length - 1]
  const meta = metaPasos(
    edad,
    dias.slice(0, -1).map((d) => d.pasos),
  )
  return { ...meta, hoy: hoy.pasos, dias, recargar }
}

export function BarrasPasos({ dias, meta }: { dias: DiaPasos[]; meta: number }) {
  const max = Math.max(meta * 1.2, ...dias.map((d) => d.pasos))
  const an = 340
  const al = 110
  const ancho = an / dias.length
  const y = (v: number) => al - 18 - (v / max) * (al - 28)
  return (
    <svg viewBox={`0 0 ${an} ${al}`} width="100%" role="img" aria-label="Pasos de los últimos días">
      <line x1={0} x2={an} y1={y(meta)} y2={y(meta)} stroke="var(--done)" strokeDasharray="4 4" />
      {dias.map((d, i) => (
        <g key={d.fecha}>
          <rect
            x={i * ancho + ancho * 0.2}
            y={y(d.pasos)}
            width={ancho * 0.6}
            height={Math.max(0, al - 18 - y(d.pasos))}
            rx={3}
            fill={d.pasos >= meta ? 'var(--done)' : 'var(--accent)'}
            opacity={d.pasos ? 1 : 0.2}
          />
          <text x={i * ancho + ancho / 2} y={al - 4} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--muted)' }}>
            {['D', 'L', 'M', 'X', 'J', 'V', 'S'][new Date(`${d.fecha}T12:00:00`).getDay()]}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function Pasos({ edad }: { edad: number }) {
  const info = usarMetaPasos(edad)
  const [valor, setValor] = useState<string>('')
  if (!info) return null
  const { meta, final, progresiva, hoy, dias, recargar } = info
  const porcentaje = Math.min(100, (hoy / meta) * 100)

  async function guardar(n: number) {
    await guardarPasos({ fecha: fechaLocal(), pasos: Math.max(0, Math.round(n)) })
    setValor('')
    await recargar()
  }

  return (
    <Tarjeta>
      <p className="etiqueta">Pasos de hoy</p>
      <div className={p.cabeza}>
        <h2>{miles(hoy)}</h2>
        <span className={p.meta}>meta {miles(meta)}</span>
      </div>
      <div className={p.pista} aria-hidden="true" style={{ height: 12 }}>
        <b className={hoy >= meta ? p.ok : p.falta} style={{ width: `${Math.max(2, porcentaje)}%` }} />
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className={estilos.chico}>Cargá lo que marca tu celular o reloj (por ejemplo Google Fit o Samsung Health):</span>
        <div className={estilos.fila}>
          <input
            className={e.buscador}
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            placeholder={hoy ? String(hoy) : 'Pasos'}
            value={valor}
            onChange={(ev) => setValor(ev.target.value)}
            aria-label="Pasos de hoy"
          />
          <Boton variante="principal" onClick={() => valor && void guardar(Number(valor))}>
            Guardar
          </Boton>
        </div>
      </label>
      <div className={estilos.fila}>
        <Boton onClick={() => void guardar(hoy + 500)}>+500</Boton>
        <Boton onClick={() => void guardar(hoy + 1000)}>+1000</Boton>
      </div>
      {dias.some((d) => d.pasos > 0) && <BarrasPasos dias={dias} meta={meta} />}
      <details className={e.detalle}>
        <summary>¿Por qué esta meta?</summary>
        <p className={estilos.texto2}>
          En un análisis de 15 estudios con casi 50.000 personas, el riesgo de muerte prematura baja a medida que suben los pasos, hasta estabilizarse
          en {miles(normas.mesetaMenos60.desde)} a {miles(normas.mesetaMenos60.hasta)} por día antes de los 60 años y en {miles(normas.meseta60omas.desde)} a{' '}
          {miles(normas.meseta60omas.hasta)} desde los 60 (Paluch 2022). Los famosos 10.000 no salen de un estudio.
        </p>
        <p className={estilos.texto2}>
          {progresiva
            ? `Tu meta de esta semana es tu promedio más 1000 pasos; sube sola hasta ${miles(final)}. (Subir de a 1000 es criterio de la app.)`
            : `Tu meta es ${miles(final)}. Si cargás tus pasos unos días, la app arma una meta escalonada desde tu punto de partida.`}
        </p>
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '6px 4px 2px' }}>
          <DibujoEjercicio id="caminata-rapida" />
        </div>
        <p className={estilos.texto2}>
          Para que una caminata cuente como cardio moderado: unos {normas.cadenciaModerada} pasos por minuto o más. Contá tus pasos 15 segundos y multiplicá
          por 4 (Tudor-Locke, CADENCE-Adults). Las caminatas rápidas que hagas desde "Entrenar ahora" suman a tus minutos de cardio.
        </p>
      </details>
      <p className={estilos.chico}>Más adelante la app va a leer los pasos sola desde el celular (Health Connect).</p>
    </Tarjeta>
  )
}
