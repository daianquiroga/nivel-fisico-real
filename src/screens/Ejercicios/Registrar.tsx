import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Stepper } from '../../components/controles'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { EnReserva } from '../../content/ilustraciones'
import { ajusteSeriePrueba, records, sugerir, type Serie, type Sugerencia } from '../../lib/calc/progresion'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import { ejercicio } from '../../lib/ejercicios'
import { guardarSesion, usarSesiones } from '../../lib/registroEjercicios'
import e from '../Evaluacion/evaluacion.module.css'
import s from './ejercicios.module.css'

export const BANDAS = ['Muy liviana', 'Liviana', 'Media', 'Dura', 'Muy dura']
const coma = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',')

export function resumenSeries(series: Serie[], tipo: 'reps' | 'segundos' | 'minutos' | boolean): string {
  const u = tipo === 'minutos' ? ' min' : tipo === 'segundos' || tipo === true ? 's' : ''
  return series
    .map((x) => `${x.carga ? `${coma(x.carga)} kg × ` : x.banda ? `${BANDAS[x.banda - 1].toLowerCase()} × ` : ''}${x.reps}${u}`)
    .join(' · ')
}

export function Registrar() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const ej = ejercicio(id)
  const { sesiones } = usarSesiones(id)
  const [series, setSeries] = useState<Serie[] | null>(null)
  const [guardado, setGuardado] = useState<{ siguiente: Sugerencia; record: boolean; prueba?: string } | null>(null)
  usarPantallaEncendida(true)

  const ctx = ej ? { carga: ej.carga, rango: ej.rango } : null
  const sug = ctx && sesiones ? sugerir(sesiones, ctx) : null
  const ultima = sesiones?.[sesiones.length - 1]

  useEffect(() => {
    if (!ej || !sesiones || series) return
    const [min] = ej.rango
    if (!ultima) {
      const base: Serie =
        ej.carga === 'externa' ? { carga: 5, reps: 10, rir: 3 } : ej.carga === 'banda' ? { banda: 2, reps: min, rir: 2 } : { reps: min, rir: 2 }
      setSeries(ej.carga === 'externa' ? [base] : [base, { ...base }, { ...base }])
      return
    }
    const carga = sug?.carga ?? ultima.series[0].carga
    const base = sug?.tipo === 'empezar' ? [ultima.series[0], ultima.series[0], ultima.series[0]] : ultima.series
    setSeries(base.map((x) => ({ ...x, carga: x.carga !== undefined ? carga : undefined, reps: sug?.reps ?? x.reps, rir: 2 })))
  }, [ej, sesiones, series, sug, ultima])

  if (!ej || !sesiones || !series) return null
  const segundos = ej.tipo === 'segundos'
  const minutos = ej.tipo === 'minutos'

  const cambiar = (i: number, c: Partial<Serie>) => setSeries(series.map((x, j) => (j === i ? { ...x, ...c } : x)))

  async function guardar() {
    if (!ej || !series) return
    const antes = records(sesiones ?? [])
    await guardarSesion(ej.id, series)
    const despues = records([...(sesiones ?? []), { fecha: '', series }])
    const record =
      Boolean(sesiones?.length) &&
      ((despues.maximoEstimado ?? 0) > (antes.maximoEstimado ?? 0) || (!despues.maximoEstimado && (despues.repsMax ?? 0) > (antes.repsMax ?? 0)))
    const prueba = !sesiones?.length && ej.carga === 'externa' && series[0].carga ? ajusteSeriePrueba(series[0].carga, series[0].rir) : undefined
    setGuardado({
      siguiente: sugerir([...(sesiones ?? []), { fecha: '', series }], { carga: ej.carga, rango: ej.rango }),
      record,
      prueba: prueba ? `${prueba.texto} Próxima vez: ${coma(prueba.carga)} kg.` : undefined,
    })
    window.scrollTo(0, 0)
  }

  const volver = (
    <div className={e.arriba}>
      <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <span className={e.contador}>Anotar</span>
    </div>
  )

  if (guardado) {
    return (
      <div className={e.pantalla}>
        {volver}
        <h1 className={e.titulo}>¡Anotado!</h1>
        {guardado.record && (
          <Tarjeta destacada>
            <p className="etiqueta" style={{ color: 'var(--done)' }}>
              Récord nuevo
            </p>
            <p className={estilos.texto2}>Superaste tu mejor marca en {ej.nombre.toLowerCase()}.</p>
          </Tarjeta>
        )}
        <Tarjeta>
          <p className="etiqueta">Para la próxima</p>
          <p className={estilos.texto2}>{guardado.prueba ?? guardado.siguiente.texto}</p>
        </Tarjeta>
        <Boton variante="principal" ancho onClick={() => navegar(`/ejercicio/${ej.id}`, { replace: true })}>
          Listo
        </Boton>
      </div>
    )
  }

  return (
    <div className={e.pantalla}>
      {volver}
      <header>
        <h1 className={e.titulo}>{ej.nombre}</h1>
        <p className={e.para}>
          Objetivo: {ej.rango[0]} a {ej.rango[1]} {segundos ? 'segundos' : minutos ? 'minutos' : 'repeticiones'}{minutos ? '' : ' por serie'}.
        </p>
      </header>
      <Tarjeta>
        <div className={e.dibujo}>
          <DibujoEjercicio id={ej.id} />
        </div>
        <Link to={`/ejercicio/${ej.id}`} className={estilos.chico}>
          Ver cómo se hace
        </Link>
      </Tarjeta>

      {sug && (
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Hoy
          </p>
          <p className={estilos.texto2}>{sug.texto}</p>
          {ultima && <p className={estilos.chico}>La vez pasada: {resumenSeries(ultima.series, ej.tipo)}</p>}
        </Tarjeta>
      )}

      <details className={s.detalle}>
        <summary>¿Qué es "en reserva"?</summary>
        <div className={e.dibujo}>
          <EnReserva />
        </div>
        <p className={estilos.texto2}>
          Son las repeticiones que todavía podrías haber hecho con buena técnica cuando cortaste. Dejar 2 en reserva es entrenar fuerte sin
          llegar al fallo. Las primeras 2 semanas con un ejercicio, dejá 3 o 4 para aprender la técnica.
        </p>
      </details>

      {series.map((x, i) => (
        <Tarjeta key={i}>
          <p className="etiqueta">
            Serie {i + 1}
            {!ultima && ej.carga === 'externa' && i === 0 ? ' · de prueba (10 repeticiones)' : ''}
          </p>
          {ej.carga === 'externa' && (
            <Stepper etiqueta="Peso" valor={x.carga ?? 0} min={0} max={300} paso={0.5} unidad="kg" onCambio={(v) => cambiar(i, { carga: v })} />
          )}
          {ej.carga === 'banda' && (
            <div className={s.filtros} role="radiogroup" aria-label="Banda">
              {BANDAS.map((b, n) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={x.banda === n + 1}
                  className={`${s.filtro} ${x.banda === n + 1 ? s.filtroOn : ''}`}
                  onClick={() => cambiar(i, { banda: n + 1 })}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          <Stepper
            etiqueta={segundos ? 'Segundos' : minutos ? 'Minutos' : 'Repeticiones'}
            valor={x.reps}
            min={0}
            max={segundos ? 600 : minutos ? 180 : 100}
            paso={segundos ? 5 : 1}
            unidad={segundos ? 's' : minutos ? 'min' : 'reps'}
            onCambio={(v) => cambiar(i, { reps: v })}
          />
          <p className={estilos.chico}>¿Cuántas más podías hacer bien?</p>
          <div className={s.rir} role="radiogroup" aria-label={`En reserva, serie ${i + 1}`}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={x.rir === n} className={`${s.filtro} ${x.rir === n ? s.filtroOn : ''}`} onClick={() => cambiar(i, { rir: n })}>
                {n === 5 ? '5+' : n}
              </button>
            ))}
          </div>
        </Tarjeta>
      ))}

      <div className={estilos.fila}>
        <Boton onClick={() => setSeries([...series, { ...series[series.length - 1] }])}>+ Otra serie</Boton>
        {series.length > 1 && <Boton onClick={() => setSeries(series.slice(0, -1))}>Quitar la última</Boton>}
      </div>
      <Boton variante="principal" ancho onClick={() => void guardar()}>
        Guardar
      </Boton>
    </div>
  )
}
