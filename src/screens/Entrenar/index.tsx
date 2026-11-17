import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Segmentado, Stepper } from '../../components/controles'
import { Cronometro } from '../../components/tiempo'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { sugerir, type Serie } from '../../lib/calc/progresion'
import { db } from '../../lib/db/db'
import { guardarActividad, guardarSesionHecha, usarControlHoy } from '../../lib/diario'
import { metSesionFuerza } from '../../lib/calc/calorias'
import mets from '../../content/normas/mets.json'
import { pitido, usarPantallaEncendida, vibrar } from '../../lib/dispositivo'
import { avisosLimitacion, ejercicio } from '../../lib/ejercicios'
import { LIMITACIONES, diaDeHoy } from '../../lib/perfil'
import { alternativas, type SesionPlan } from '../../lib/plan/generador'
import { NOMBRES_VERSION, aplicarVersion, armarCola, fechaLocal, type Version } from '../../lib/plan/sesion'
import { pausaActiva, usarCiclo } from '../../lib/plan/ciclo'
import { aplicarDescarga } from '../../lib/plan/periodizacion'
import { usarPlan } from '../../lib/plan/usarPlan'
import { guardarSesion, usarSesiones } from '../../lib/registroEjercicios'
import { callar, hablar, hayVoz, setVozActiva, vozActiva } from '../../lib/voz'
import { BANDAS } from '../Ejercicios/Registrar'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import p from '../Plan/plan.module.css'
import t from '../../components/tiempo.module.css'
import { Rondas } from './Rondas'

type Fase = 'inicio' | 'serie' | 'descanso' | 'fin'

interface EnCurso {
  clave: string
  sesion: SesionPlan
  version: Version
  pos: number
  fase: Fase
  resultados: Record<number, Serie[]>
  inicio: number
}

const CLAVE = 'entrenando'
const ESFUERZO = ['Muy fácil', 'Muy fácil', 'Fácil', 'Fácil', 'Moderado', 'Moderado', 'Duro', 'Duro', 'Muy duro', 'Máximo']
const nombreLim = (v: string) => LIMITACIONES.find((l) => l.valor === v)?.texto.toLowerCase() ?? v

function Descanso({ segundos, siguiente, onListo }: { segundos: number; siguiente: string; onListo: () => void }) {
  const [fin, setFin] = useState(() => performance.now() + segundos * 1000)
  const [resta, setResta] = useState(segundos)
  const avisos = useRef(new Set<number>())
  useEffect(() => {
    hablar(`Descanso, ${segundos} segundos`)
  }, [segundos])
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.ceil((fin - performance.now()) / 1000)
      setResta(Math.max(0, r))
      if (r === 10 && segundos > 20 && !avisos.current.has(10)) {
        avisos.current.add(10)
        hablar('Diez segundos')
      }
      if (r <= 3 && r > 0 && !avisos.current.has(r)) {
        avisos.current.add(r)
        pitido(660, 120)
      }
      if (r <= 0) {
        clearInterval(id)
        pitido(990, 300)
        vibrar([150, 80, 150])
        onListo()
      }
    }, 200)
    return () => clearInterval(id)
  }, [fin, segundos, onListo])
  return (
    <>
      <div className={t.caja}>
        <p className={t.estado}>Descanso</p>
        <div className={`${t.reloj} ${t.corriendo}`}>
          {Math.floor(resta / 60)}:{String(resta % 60).padStart(2, '0')}
        </div>
        <div className={t.fila}>
          <button type="button" className={`${t.botonGrande} ${t.parar}`} onClick={() => setFin((f) => f + 15000)}>
            +15 s
          </button>
          <button type="button" className={t.botonGrande} onClick={onListo}>
            Saltar
          </button>
        </div>
      </div>
      <p className={estilos.texto2} style={{ textAlign: 'center' }}>
        Sigue: <b>{siguiente}</b>
      </p>
    </>
  )
}

export function Entrenar() {
  const { dia: diaTxt = '0', idx: idxTxt = '0' } = useParams()
  const micro = diaTxt === 'micro'
  const dia = micro ? -1 : Number(diaTxt)
  const idx = Number(idxTxt)
  const navegar = useNavigate()
  const { plan, entrada } = usarPlan()
  const { estado: control } = usarControlHoy()
  const { sesiones: historial } = usarSesiones()
  const [run, setRun] = useState<EnCurso | null>(null)
  const [cargado, setCargado] = useState(false)
  const [version, setVersion] = useState<Version | null>(null)
  const [serie, setSerie] = useState<Serie>({ reps: 0, rir: 2 })
  const [cambiando, setCambiando] = useState(false)
  const [salir, setSalir] = useState(false)
  const [voz, setVoz] = useState(vozActiva())
  const [esfuerzo, setEsfuerzo] = useState<number | null>(null)
  const [diario, setDiario] = useState({ bien: '', mejorar: '', sentir: '' })
  usarPantallaEncendida(run !== null && run.fase !== 'fin')

  const clave = `${fechaLocal()}-${diaTxt}-${idx}`
  const { estado: ciclo } = usarCiclo(entrada?.nivelFuerza ?? 2)
  const pausa = useMemo(() => pausaActiva(), [])
  const original = micro ? pausa : plan?.dias[dia]?.sesiones[idx]
  const descarga = !micro && ciclo?.fase === 'descarga'
  const esHoy = dia === diaDeHoy()
  const zona = esHoy && control?.hoy && control.hoy.dolor !== 'ninguno' ? control.hoy.zona : undefined
  const versionInicial: Version = (esHoy && control?.hoy?.version) || 'completa'

  // Retomar una sesión empezada hoy.
  useEffect(() => {
    void db.ajustes.get(CLAVE).then((a) => {
      const v = a?.valor as EnCurso | undefined
      if (v && v.clave === clave) setRun(v)
      setCargado(true)
    })
  }, [clave])

  useEffect(() => {
    if (run) void db.ajustes.put({ clave: CLAVE, valor: run })
  }, [run])

  const sesion = useMemo(() => {
    if (run) return run.sesion
    if (!original) return null
    const v = aplicarVersion(original, version ?? versionInicial, entrada, zona)
    return descarga && original.tipo === 'fuerza' ? aplicarDescarga(v) : v
  }, [run, original, version, versionInicial, entrada, zona, descarga])

  const cola = useMemo(() => (sesion ? armarCola(sesion) : []), [sesion])
  const paso = run ? cola[run.pos] : undefined
  const ejPlan = paso && sesion ? sesion.ejercicios[paso.ej] : undefined
  const ej = ejPlan ? ejercicio(ejPlan.id) : undefined

  // Valores precargados para la serie: lo anotado antes en esta sesión, si no la sugerencia según el historial.
  const precargar = useCallback(
    (r: EnCurso, pos: number) => {
      const ps = cola[pos]
      if (!ps) return
      const ep = r.sesion.ejercicios[ps.ej]
      const e2 = ejercicio(ep.id)
      if (!e2) return
      const hechas = r.resultados[ps.ej] ?? []
      const previa = hechas[hechas.length - 1]
      if (previa) {
        setSerie({ ...previa, rir: 2 })
        return
      }
      const propias = (historial ?? []).filter((h) => h.ejercicio === ep.id)
      const sug = sugerir(propias, { carga: e2.carga, rango: ep.rango })
      const ultima = propias[propias.length - 1]?.series[0]
      setSerie({
        carga: e2.carga === 'externa' ? sug.carga ?? ultima?.carga ?? 5 : undefined,
        banda: e2.carga === 'banda' ? ultima?.banda ?? 2 : undefined,
        reps: e2.tipo === 'minutos' ? ep.rango[0] : sug.reps ?? ep.rango[0],
        rir: 2,
      })
    },
    [cola, historial],
  )

  const anunciar = useCallback(
    (r: EnCurso, pos: number) => {
      const ps = cola[pos]
      if (!ps) return
      const e2 = ejercicio(r.sesion.ejercicios[ps.ej].id)
      if (!e2) return
      hablar(ps.total > 1 ? `${e2.nombre}. Serie ${ps.serie} de ${ps.total}.` : `${e2.nombre}.`)
    },
    [cola],
  )

  // Al retomar una sesión guardada, precargar la serie actual una vez.
  const retomada = useRef(false)
  useEffect(() => {
    if (cargado && run && run.fase === 'serie' && !retomada.current && historial) {
      retomada.current = true
      precargar(run, run.pos)
    }
  }, [cargado, run, historial, precargar])

  if (!cargado || plan === undefined) return null
  // Las sesiones de un arte marcial se hacen guiadas, round por round.
  if (original?.combate && !run) {
    const c = original.combate
    return <Navigate replace to={`/combate/guiada?d=${c.arte}&min=${original.minutos}&mov=${c.movilidad ? 1 : 0}&dia=${dia}&idx=${idx}`} />
  }

  const volver = (
    <button type="button" className={e.volver} onClick={() => (run && run.fase !== 'fin' ? setSalir(true) : navegar(-1))} aria-label="Salir">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )

  if (!sesion) {
    return (
      <div className={e.pantalla}>
        <div className={e.arriba}>{volver}</div>
        <h1 className={e.titulo}>No encontramos esa sesión</h1>
        <Link to="/plan">Ir al plan</Link>
      </div>
    )
  }

  function empezar() {
    if (!sesion) return
    const r: EnCurso = { clave, sesion, version: version ?? versionInicial, pos: 0, fase: 'serie', resultados: {}, inicio: Date.now() }
    pitido(990, 200)
    setRun(r)
    precargar(r, 0)
    anunciar(r, 0)
  }

  function avanzar(r: EnCurso) {
    const siguiente = r.pos + 1
    if (siguiente >= cola.length) {
      hablar('¡Terminaste! Muy bien.')
      setRun({ ...r, fase: 'fin' })
      return
    }
    const nuevo = { ...r, pos: siguiente, fase: 'serie' as Fase }
    setRun(nuevo)
    precargar(nuevo, siguiente)
    anunciar(nuevo, siguiente)
  }

  function serieHecha(valor?: Serie) {
    if (!run || !paso) return
    const s = valor ?? serie
    const resultados = { ...run.resultados, [paso.ej]: [...(run.resultados[paso.ej] ?? []), s] }
    const r = { ...run, resultados }
    if (paso.descanso > 0) setRun({ ...r, fase: 'descanso' })
    else avanzar(r)
  }

  function saltarEjercicio() {
    if (!run || !paso) return
    let pos = run.pos
    while (pos + 1 < cola.length && cola[pos + 1].ej === paso.ej) pos++
    avanzar({ ...run, pos })
  }

  async function guardar() {
    if (!run) return
    for (const [i, series] of Object.entries(run.resultados)) {
      const ep = run.sesion.ejercicios[Number(i)]
      if (ep && series.length) await guardarSesion(ep.id, series)
    }
    // Para las calorías y los minutos de cardio: cada cardio como actividad, y la parte de fuerza como otra.
    const totalMin = Math.max(1, Math.round((Date.now() - run.inicio) / 60000))
    let cardioMin = 0
    for (const [i, series] of Object.entries(run.resultados)) {
      const ep = run.sesion.ejercicios[Number(i)]
      const mapa = (mets.porEjercicio as Record<string, { actividad: string; variante: string }>)[ep?.id ?? '']
      if (!ep || !mapa || !series.length) continue
      const act = (mets.actividades as Record<string, { nombre: string; variantes: Record<string, { met: number }> }>)[mapa.actividad]
      const min = series.reduce((a, x) => a + x.reps, 0)
      cardioMin += min
      await guardarActividad({ fecha: fechaLocal(), nombre: ejercicio(ep.id)?.nombre ?? act.nombre, met: act.variantes[mapa.variante].met, minutos: min, actividad: mapa.actividad, variante: mapa.variante, origen: 'entrenar' })
    }
    if (run.sesion.tipo === 'fuerza' && totalMin - cardioMin > 0) {
      const conPeso = run.sesion.ejercicios.some((x) => ejercicio(x.id)?.carga === 'externa')
      await guardarActividad({ fecha: fechaLocal(), nombre: run.sesion.titulo, met: metSesionFuerza(run.sesion.metodo, conPeso), minutos: totalMin - cardioMin, origen: 'entrenar' })
    }
    await guardarSesionHecha({
      sesionId: run.sesion.id,
      titulo: run.sesion.titulo,
      version: run.version,
      minutos: Math.max(1, Math.round((Date.now() - run.inicio) / 60000)),
      esfuerzo: esfuerzo ?? undefined,
      diario: diario.bien || diario.mejorar || diario.sentir ? diario : undefined,
      ejercicios: Object.keys(run.resultados).map((i) => run.sesion.ejercicios[Number(i)]?.id).filter(Boolean),
    })
    await db.ajustes.delete(CLAVE)
    callar()
    navegar('/', { replace: true })
  }

  const barra = run && (
    <div className={e.barra} aria-hidden="true">
      {cola.map((_, i) => (
        <span key={i} className={i < run.pos ? e.hecho : i === run.pos ? e.actual : ''} />
      ))}
    </div>
  )

  const dialogos = (
    <>
      {salir && (
        <Dialogo titulo="¿Salir de la sesión?" onCerrar={() => setSalir(false)}>
          <p className={estilos.texto2}>Queda guardada: si volvés hoy a "Entrenar ahora", seguís donde dejaste.</p>
          <div className={estilos.fila}>
            <Boton onClick={() => setSalir(false)}>Seguir entrenando</Boton>
            <Boton
              variante="principal"
              onClick={() => {
                callar()
                navegar(-1)
              }}
            >
              Salir
            </Boton>
          </div>
        </Dialogo>
      )}
      {cambiando && run && paso && ejPlan && entrada && (
        <Dialogo titulo="Cambiar ejercicio" onCerrar={() => setCambiando(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
            {alternativas({ ...entrada, limitaciones: [...entrada.limitaciones, ...(zona ? [zona] : [])] }, run.sesion.lugar, ejPlan, run.sesion.ejercicios.map((y) => y.id))
              .slice(0, 8)
              .map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={p.alternativa}
                  onClick={() => {
                    const s2: SesionPlan = structuredClone(run.sesion)
                    s2.ejercicios[paso.ej] = { ...s2.ejercicios[paso.ej], id: o.id, rango: o.rango }
                    const r = { ...run, sesion: s2, resultados: { ...run.resultados, [paso.ej]: [] } }
                    setRun(r)
                    precargar(r, run.pos)
                    setCambiando(false)
                  }}
                >
                  <b>{o.nombre}</b>
                  <span>{o.principal.join(', ')}</span>
                </button>
              ))}
          </div>
          <Boton onClick={() => setCambiando(false)}>Cancelar</Boton>
        </Dialogo>
      )}
    </>
  )

  /* ---------- Inicio ---------- */
  if (!run) {
    return (
      <div className={e.pantalla}>
        <div className={e.arriba}>{volver}</div>
        <header>
          <h1 className={e.titulo}>{sesion.titulo}</h1>
          <p className={e.para}>
            {[sesion.lugar, `unos ${sesion.minutos} minutos`, `${cola.length} ${cola.length === 1 ? 'paso' : 'pasos'}`].filter(Boolean).join(' · ')}
          </p>
        </header>
        {!micro && (
          <Segmentado<Version>
            etiqueta="Versión"
            opciones={(['completa', 'reducida', 'minima'] as Version[]).map((v) => ({ valor: v, texto: NOMBRES_VERSION[v] }))}
            valor={version ?? versionInicial}
            onCambio={setVersion}
          />
        )}
        {descarga && sesion.tipo === 'fuerza' && <Aviso tipo="ok">Semana liviana: la mitad de las series y un 10 % menos de peso.</Aviso>}
        {zona && <Aviso tipo="error">Marcaste molestia o dolor en {nombreLim(zona)}: ya cambiamos los ejercicios que la cargan.</Aviso>}
        <Tarjeta>
          {sesion.ejercicios.map((y, i) => (
            <div key={`${y.id}-${i}`} className={p.ejercicio}>
              <span className={p.letra}>{y.grupo ? (y.grupo === 'C' ? '↻' : y.grupo) : i + 1}</span>
              <span className={p.info}>
                <b>{ejercicio(y.id)?.nombre}</b>
                <span>
                  {ejercicio(y.id)?.tipo === 'minutos'
                    ? `${y.rango[0]} min`
                    : `${y.series > 1 ? `${y.series} × ` : ''}${y.rango[0] === y.rango[1] ? y.rango[0] : `${y.rango[0]}–${y.rango[1]}`}`}
                </span>
              </span>
            </div>
          ))}
          {sesion.nota && <p className={estilos.chico}>{sesion.nota}</p>}
        </Tarjeta>
        {hayVoz() && (
          <label className={x.interruptor}>
            <input
              type="checkbox"
              checked={voz}
              onChange={(ev) => {
                setVoz(ev.target.checked)
                setVozActiva(ev.target.checked)
              }}
            />
            Que me guíe con voz
          </label>
        )}
        {sesion.tipo === 'fuerza' && (
          <p className={estilos.chico}>Antes de empezar: 5 minutos de entrada en calor (marcha en el lugar, círculos de brazos y cadera, unas sentadillas suaves).</p>
        )}
        <Boton variante="principal" ancho onClick={empezar}>
          Empezar
        </Boton>
      </div>
    )
  }

  /* ---------- Fin ---------- */
  if (run.fase === 'fin') {
    const series = Object.values(run.resultados).reduce((a, s) => a + s.length, 0)
    const hechos = Object.values(run.resultados).filter((s) => s.length).length
    const minutos = Math.max(1, Math.round((Date.now() - run.inicio) / 60000))
    return (
      <div className={e.pantalla}>
        <h1 className={e.titulo}>¡Sesión hecha!</h1>
        <Tarjeta destacada>
          <p className={estilos.texto2}>
            {hechos} {hechos === 1 ? 'ejercicio' : 'ejercicios'} · {series} {series === 1 ? 'serie' : 'series'} · {minutos} {minutos === 1 ? "minuto" : "minutos"}
          </p>
        </Tarjeta>
        <Tarjeta>
          <p className="etiqueta">¿Qué tan dura fue? (1 a 10)</p>
          <div className={x.rir} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }} role="radiogroup" aria-label="Esfuerzo">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={esfuerzo === n} className={`${x.filtro} ${esfuerzo === n ? x.filtroOn : ''}`} onClick={() => setEsfuerzo(n)}>
                {n}
              </button>
            ))}
          </div>
          <p className={estilos.chico}>{esfuerzo ? ESFUERZO[esfuerzo - 1] : 'Pensá en toda la sesión, no en la última serie.'}</p>
        </Tarjeta>
        <Tarjeta>
          <p className="etiqueta">Diario (opcional)</p>
          {(
            [
              ['bien', 'Qué salió bien'],
              ['mejorar', 'Qué mejorar'],
              ['sentir', 'Cómo me sentí'],
            ] as const
          ).map(([k, texto]) => (
            <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className={estilos.chico}>{texto}</span>
              <input className={x.buscador} value={diario[k]} maxLength={120} onChange={(ev) => setDiario({ ...diario, [k]: ev.target.value })} />
            </label>
          ))}
        </Tarjeta>
        <Boton variante="principal" ancho onClick={() => void guardar()}>
          Guardar
        </Boton>
      </div>
    )
  }

  if (!paso || !ejPlan || !ej) return null
  const siguientePaso = cola[run.pos + 1]
  const nombreSiguiente = siguientePaso
    ? `${ejercicio(run.sesion.ejercicios[siguientePaso.ej].id)?.nombre ?? ''}${siguientePaso.total > 1 ? ` · serie ${siguientePaso.serie}` : ''}`
    : 'terminar'

  /* ---------- Descanso ---------- */
  if (run.fase === 'descanso') {
    return (
      <div className={e.pantalla}>
        <div className={e.arriba}>
          {volver}
          {barra}
        </div>
        <Descanso key={run.pos} segundos={paso.descanso} siguiente={nombreSiguiente} onListo={() => avanzar(run)} />
        {dialogos}
      </div>
    )
  }

  /* ---------- Serie ---------- */
  const avisos = avisosLimitacion(ej, [...(entrada?.limitaciones ?? []), ...(zona ? [zona] : [])])
  const unico = ejPlan.rol === 'cardio' || ejPlan.rol === 'movilidad'
  const objetivo =
    ej.tipo === 'minutos' ? `${ejPlan.rango[0]} minutos` : `${ejPlan.rango[0]}–${ejPlan.rango[1]} ${ej.tipo === 'segundos' ? 'segundos' : 'repeticiones'}`

  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        {volver}
        {barra}
        <span className={e.contador}>
          {run.pos + 1}/{cola.length}
        </span>
      </div>
      <header>
        <p className="etiqueta" style={{ color: 'var(--accent)', margin: 0 }}>
          {paso.total > 1 ? `Serie ${paso.serie} de ${paso.total}` : unico ? (ejPlan.rol === 'cardio' ? 'Cardio' : 'Movilidad') : 'Serie única'}
          {ejPlan.grupo && ejPlan.grupo !== 'C' ? ` · de a dos (grupo ${ejPlan.grupo})` : ejPlan.grupo === 'C' ? ' · en ronda' : ''}
        </p>
        <h1 className={e.titulo}>{ej.nombre}</h1>
        <p className={e.para}>Objetivo: {objetivo}</p>
      </header>
      <div className={e.dibujo}>
        <DibujoEjercicio id={ej.id} />
      </div>
      <details className={x.detalle}>
        <summary>Cómo se hace</summary>
        <ol className={x.seccion}>
          {ej.pasos.map((y) => (
            <li key={y}>{y}</li>
          ))}
        </ol>
      </details>
      {avisos.map((a) => (
        <p key={a.limitacion} className={estilos.chico}>
          <b>Por tu {nombreLim(a.limitacion)}:</b> {a.texto}
        </p>
      ))}

      {ej.tipo === 'minutos' ? (
        <Rondas
          key={`${run.pos}-${ej.id}`}
          minutos={ejPlan.rango[0]}
          intervalos={ej.id === 'soga' || ej.id === 'sombra' || ej.id === 'juego-pies'}
          inicial={
            ej.id === 'sombra'
              ? { trabajo: 120, descanso: 60, rondas: Math.max(1, Math.round(ejPlan.rango[0] / 3)) }
              : ej.id === 'juego-pies'
                ? { trabajo: 60, descanso: 30, rondas: Math.max(1, Math.round(ejPlan.rango[0] / 1.5)) }
                : ej.combate
                  ? { trabajo: ejPlan.rango[0] * 60, descanso: 0, rondas: 1 }
                  : undefined
          }
          onFin={(m) => serieHecha({ reps: m, rir: 2 })}
        />
      ) : (
        <Tarjeta>
          {ej.tipo === 'segundos' && <Cronometro key={run.pos} onResultado={(sg) => setSerie((v) => ({ ...v, reps: Math.round(sg) }))} />}
          {ej.carga === 'externa' && (
            <Stepper etiqueta="Peso" valor={serie.carga ?? 0} min={0} max={300} paso={0.5} unidad="kg" onCambio={(v) => setSerie({ ...serie, carga: v })} />
          )}
          {ej.carga === 'banda' && (
            <div className={x.filtros} role="radiogroup" aria-label="Banda">
              {BANDAS.map((b, n) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={serie.banda === n + 1}
                  className={`${x.filtro} ${serie.banda === n + 1 ? x.filtroOn : ''}`}
                  onClick={() => setSerie({ ...serie, banda: n + 1 })}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          <Stepper
            etiqueta={ej.tipo === 'segundos' ? 'Segundos' : 'Repeticiones'}
            valor={serie.reps}
            min={0}
            max={ej.tipo === 'segundos' ? 600 : 100}
            paso={ej.tipo === 'segundos' ? 5 : 1}
            onCambio={(v) => setSerie({ ...serie, reps: v })}
          />
          {!unico && (
            <>
              <p className={estilos.chico}>¿Cuántas más podías hacer bien?</p>
              <div className={x.rir} role="radiogroup" aria-label="En reserva">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={serie.rir === n} className={`${x.filtro} ${serie.rir === n ? x.filtroOn : ''}`} onClick={() => setSerie({ ...serie, rir: n })}>
                    {n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </>
          )}
        </Tarjeta>
      )}

      {ej.tipo !== 'minutos' && (
        <Boton variante="principal" ancho onClick={() => serieHecha()}>
          {paso.total > 1 ? 'Serie hecha' : 'Hecho'}
        </Boton>
      )}
      <div className={estilos.fila}>
        {!unico && <Boton onClick={() => setCambiando(true)}>Cambiar ejercicio</Boton>}
        <Boton onClick={saltarEjercicio}>Saltar ejercicio</Boton>
      </div>
      <p className={estilos.chico}>Si algo duele (no solo cansa), pará y saltá el ejercicio.</p>
      {dialogos}
    </div>
  )
}
