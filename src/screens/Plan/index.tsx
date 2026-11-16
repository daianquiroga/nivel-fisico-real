import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { ejercicio } from '../../lib/ejercicios'
import { NOMBRES_DIAS, diaDeHoy } from '../../lib/perfil'
import { alternativas, type EjercicioPlan, type PlanSemana, type SesionPlan } from '../../lib/plan/generador'
import { agregarSesion, cambiarDatosSesion } from '../../lib/plan/editar'
import { intencionPorDefecto } from '../../lib/habitos'
import { generarIcs } from '../../lib/ics'
import { usarPlan } from '../../lib/plan/usarPlan'
import { Segmentado } from '../../components/controles'
import { usarCiclo } from '../../lib/plan/ciclo'
import { NOMBRES_FASE, TEXTO_FASE, fatigaAcumulada } from '../../lib/plan/periodizacion'
import { leerControles } from '../../lib/diario'
import { Agenda } from './Agenda'
import { EditorSesion } from './EditorSesion'
import { usarMetaPasos } from '../Hoy/Pasos'
import { equilibrio, validarPlan } from '../../lib/plan/validador'
import { usarInicio } from '../../lib/usarInicio'
import h from '../Hoy/hoy.module.css'
import s from './plan.module.css'

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function textoEjercicio(x: EjercicioPlan): string {
  const e = ejercicio(x.id)
  if (!e) return ''
  if (e.tipo === 'minutos') return `${x.rango[0]} minutos`
  const u = e.tipo === 'segundos' ? ' s' : ''
  const rango = x.rango[0] === x.rango[1] ? `${x.rango[0]}${u}` : `${x.rango[0]}–${x.rango[1]}${u}`
  const pausa = x.descansoSeg >= 60 ? `${String(x.descansoSeg / 60).replace('.', ',')} min` : `${x.descansoSeg} s`
  return x.series > 1 ? `${x.series} × ${rango} · pausa ${pausa}` : rango
}

function Sesion({
  sesion,
  onCambiar,
  onEditar,
  entrenar,
  nombreDia,
  onIntencion,
}: {
  sesion: SesionPlan
  onCambiar: (i: number) => void
  onEditar: () => void
  entrenar: string
  nombreDia: string
  onIntencion: () => void
}) {
  const unico = sesion.tipo === 'cardio' ? sesion.ejercicios[0] : undefined
  return (
    <Tarjeta destacada={sesion.intensidad === 'fuerte'}>
      <div className={s.cabeza}>
        <h2>{sesion.titulo}</h2>
        <button type="button" className={s.accion} onClick={onEditar}>
          Editar
        </button>
      </div>
      <p className={s.meta}>
        {[sesion.lugar, sesion.desde && sesion.hasta ? `${sesion.desde} a ${sesion.hasta}` : null, `unos ${sesion.minutos} min`].filter(Boolean).join(' · ')}
      </p>
      {unico && (
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: '8px 6px 4px',
          }}
        >
          <DibujoEjercicio id={unico.id} />
        </div>
      )}
      <div>
        {sesion.ejercicios.map((x, i) => {
          const e = ejercicio(x.id)
          if (!e) return null
          return (
            <div key={`${x.id}-${i}`} className={s.ejercicio}>
              {x.grupo ? <span className={s.letra}>{x.grupo === 'C' ? '↻' : x.grupo}</span> : <span className={s.letra}>{i + 1}</span>}
              <Link to={`/ejercicio/${x.id}`} className={s.info}>
                <b>{e.nombre}</b>
                <span>{textoEjercicio(x)}</span>
              </Link>
              {x.rol !== 'movilidad' && x.rol !== 'cardio' && (
                <button type="button" className={s.accion} onClick={() => onCambiar(i)} aria-label={`Cambiar ${e.nombre}`}>
                  Cambiar
                </button>
              )}
              <Link to={`/registrar/${x.id}`} className={s.accion} aria-label={`Anotar ${e.nombre}`}>
                Anotar
              </Link>
            </div>
          )
        })}
      </div>
      {sesion.ejercicios.length === 0 && <p className={estilos.texto2}>Sin ejercicios todavía: tocá Editar y agregá los que quieras.</p>}
      {sesion.tipo !== 'movilidad' && sesion.ejercicios.length > 0 && (
        <button
          type="button"
          onClick={onIntencion}
          style={{ textAlign: 'left', border: '1px dashed var(--line)', borderRadius: 12, background: 'none', color: 'var(--text-2)', padding: '10px 12px', fontSize: 14, cursor: 'pointer' }}
        >
          <span className="etiqueta" style={{ display: 'block', marginBottom: 4 }}>
            Tu plan "cuando… entonces…" · tocá para cambiarlo
          </span>
          {sesion.intencion ?? intencionPorDefecto(nombreDia, sesion)}
        </button>
      )}
      {sesion.ejercicios.length > 0 && (
        <Link to={entrenar} className={`${estilos.boton} ${estilos.principal}`}>
          Entrenar ahora
        </Link>
      )}
      {sesion.nota && <p className={estilos.chico}>{sesion.nota}</p>}
    </Tarjeta>
  )
}

export function Plan() {
  const [params, setParams] = useSearchParams()
  const { cargado, perfil } = usarInicio()
  const { plan, entrada, generar, cambiar } = usarPlan()
  const [rearmar, setRearmar] = useState(false)
  const [cambiando, setCambiando] = useState<{
    sesion: number
    ej: number
  } | null>(null)
  const [editando, setEditando] = useState<number | null>(null)
  const [nueva, setNueva] = useState(false)
  const [intencion, setIntencion] = useState<{ idx: number; texto: string } | null>(null)
  const [calendario, setCalendario] = useState(false)
  const pasos = usarMetaPasos(perfil?.edad ?? 30)
  const vista = params.get('vista') === 'agenda' ? 'agenda' : 'entrenamiento'
  const { estado: ciclo, adelantarDescarga, recargar: recargarCiclo } = usarCiclo(entrada?.nivelFuerza ?? 2)
  useEffect(() => {
    void recargarCiclo()
  }, [plan?.creado, recargarCiclo])
  const [fatiga, setFatiga] = useState(false)
  useEffect(() => {
    void leerControles().then((c) => setFatiga(fatigaAcumulada(c)))
  }, [])
  const hoy = diaDeHoy()
  const dia = params.get('dia') !== null ? Number(params.get('dia')) : hoy

  if (!cargado || plan === undefined) return null

  if (!perfil?.inicioCompleto || !entrada) {
    return (
      <>
        <h1 className="titulo-pantalla">Plan</h1>
        <Tarjeta destacada>
          <h2 className={h.tituloTarjeta}>Primero, tus datos</h2>
          <p className={estilos.texto2}>Para armar tu semana necesitamos tus días, lugares, equipo y horarios.</p>
          <Link to="/inicio" className={h.botonPrincipal}>
            Configurar
          </Link>
        </Tarjeta>
      </>
    )
  }

  if (!plan) {
    return (
      <>
        <h1 className="titulo-pantalla">Plan</h1>
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Tu semana
          </p>
          <h2 className={h.tituloTarjeta}>Te armo el plan</h2>
          <p className={estilos.texto2}>
            Con los días y lugares que elegiste, tu equipo, tus horarios libres, tus objetivos, tu muñeca y demás limitaciones, tu nivel y tu tipo de cuerpo.
            Después podés cambiar cualquier ejercicio.
          </p>
          <Boton variante="principal" ancho onClick={() => void generar()}>
            Armame el plan
          </Boton>
        </Tarjeta>
        <Link to="/plan/asistente" className={estilos.boton}>
          Prefiero armarla paso a paso
        </Link>
        <Link to="/plan/armar" className={estilos.boton}>
          Ya tengo una rutina: cargarla
        </Link>
      </>
    )
  }

  const avisos = validarPlan(plan, entrada.semana)
  const eq = equilibrio(plan)
  const delDia = plan.dias[dia]

  async function reemplazar(nuevoId: string) {
    if (!cambiando || !plan) return
    const copia: PlanSemana = structuredClone(plan)
    const x = copia.dias[dia].sesiones[cambiando.sesion].ejercicios[cambiando.ej]
    const e = ejercicio(nuevoId)
    if (e) {
      x.id = nuevoId
      x.rango = e.rango
    }
    await cambiar(copia)
    setCambiando(null)
  }

  const sesionCambio = cambiando ? delDia.sesiones[cambiando.sesion] : undefined
  const ejCambio = sesionCambio && cambiando ? sesionCambio.ejercicios[cambiando.ej] : undefined
  const opciones =
    sesionCambio && ejCambio
      ? alternativas(
          entrada,
          sesionCambio.lugar,
          ejCambio,
          sesionCambio.ejercicios.map((x) => x.id),
        ).slice(0, 8)
      : []

  const irDia = (i: number) => {
    setEditando(null)
    const n = new URLSearchParams(params)
    n.set('dia', String(i))
    setParams(n, { replace: true })
  }

  return (
    <>
      <h1 className="titulo-pantalla">Plan</h1>
      <Segmentado<'entrenamiento' | 'agenda'>
        etiqueta="Vista del plan"
        opciones={[
          { valor: 'entrenamiento', texto: 'Entrenamiento' },
          { valor: 'agenda', texto: 'Agenda del día' },
        ]}
        valor={vista}
        onCambio={(v) => {
          const n = new URLSearchParams(params)
          n.set('vista', v)
          setParams(n, { replace: true })
        }}
      />
      {ciclo && (
        <Tarjeta destacada={ciclo.fase === 'descarga'}>
          <p
            className="etiqueta"
            style={{
              color: ciclo.fase === 'descarga' ? 'var(--done)' : undefined,
            }}
          >
            Semana {ciclo.semana} · fase {NOMBRES_FASE[ciclo.fase].toLowerCase()}
          </p>
          <p className={estilos.texto2}>{TEXTO_FASE[ciclo.fase]}</p>
          {ciclo.fase !== 'descarga' && (
            <p className={estilos.chico}>
              Próxima semana de descarga: {ciclo.faltan === 1 ? 'la que viene' : `en ${ciclo.faltan} semanas`}. En "Entrenar ahora" se aplica sola.
            </p>
          )}
          {ciclo.fase !== 'descarga' && fatiga && (
            <>
              <Aviso tipo="error">Tu control diario muestra cansancio varios días esta semana. Conviene adelantar la descarga.</Aviso>
              <Boton onClick={() => void adelantarDescarga()}>Hacer la semana de descarga ahora</Boton>
            </>
          )}
        </Tarjeta>
      )}
      <div className={s.semana} role="tablist" aria-label="Días de la semana">
        {plan.dias.map((d, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === dia}
            aria-label={NOMBRES_DIAS[i]}
            className={`${s.dia} ${i === dia ? s.diaOn : ''}`}
            onClick={() => irDia(i)}
          >
            <span className={i === hoy ? s.hoy : undefined}>{LETRAS[i]}</span>
            <span className={s.puntos} aria-hidden="true">
              {d.sesiones
                .filter((x) => !x.titulo.includes('opcional'))
                .map((x) => (
                  <i key={x.id} className={s[x.tipo]} />
                ))}
            </span>
          </button>
        ))}
      </div>
      <p className={estilos.chico}>
        <span style={{ color: 'var(--accent)' }}>●</span> fuerza · <span style={{ color: 'var(--done)' }}>●</span> cardio ·{' '}
        <span style={{ color: 'var(--soft)' }}>●</span> movilidad
      </p>

      {vista === 'agenda' ? (
        <Agenda semana={entrada.semana} plan={plan} dia={dia} onDia={irDia} />
      ) : (
        <>
          <h2 className="etiqueta" style={{ margin: 0 }}>
            {NOMBRES_DIAS[dia]}
            {dia === hoy ? ' · hoy' : ''}
            {!delDia.sesiones.some((x) => x.intensidad === 'fuerte') && !delDia.sesiones.some((x) => x.tipo === 'cardio') ? ' · descanso' : ''}
          </h2>
          {pasos && (
            <p className={estilos.texto2} style={{ margin: 0 }}>
              Todos los días: <b>{pasos.meta.toLocaleString('es-AR')} pasos</b>
              {pasos.progresiva ? ` (sube de a 1000 por semana hasta ${pasos.final.toLocaleString('es-AR')})` : ''}.
            </p>
          )}
          {delDia.sesiones.map((ses, i) =>
            editando === i ? (
              <EditorSesion key={ses.id} plan={plan} dia={dia} idx={i} entrada={entrada} onCambio={(p) => void cambiar(p)} onListo={() => setEditando(null)} />
            ) : (
              <Sesion
                key={ses.id}
                sesion={ses}
                entrenar={`/entrenar/${dia}/${i}`}
                onCambiar={(ej) => setCambiando({ sesion: i, ej })}
                onEditar={() => setEditando(i)}
                nombreDia={NOMBRES_DIAS[dia]}
                onIntencion={() => {
                  setIntencion({ idx: i, texto: ses.intencion ?? intencionPorDefecto(NOMBRES_DIAS[dia], ses) })
                }}
              />
            ),
          )}
          <Boton ancho onClick={() => setNueva(true)}>
            + Agregar una sesión el {NOMBRES_DIAS[dia].toLowerCase()}
          </Boton>

          {avisos.length > 0 && (
            <Tarjeta>
              <p className="etiqueta">Avisos de la semana</p>
              {avisos.map((a) => (
                <Aviso key={a.texto} tipo={a.tipo === 'cuidado' ? 'error' : 'ok'}>
                  {a.texto}
                </Aviso>
              ))}
            </Tarjeta>
          )}

          <Tarjeta>
            <p className="etiqueta">Equilibrio de la semana</p>
            {eq.map((a) => {
              const tope = a.max * 1.2
              const ancho = Math.min(100, (a.valor / tope) * 100)
              return (
                <div key={a.area} className={s.barra}>
                  <span>{a.nombre}</span>
                  <span className={s.pista} aria-hidden="true">
                    <b className={a.valor >= a.min ? s.ok : s.falta} style={{ width: `${Math.max(3, ancho)}%` }} />
                    <i style={{ left: `${(a.min / tope) * 100}%` }} />
                  </span>
                  <span className={s.meta}>
                    {a.valor} {a.unidad}
                  </span>
                </div>
              )
            })}
            <p className={estilos.chico}>La rayita marca el mínimo recomendado. Fuerza y cardio: OMS 2020. Movilidad y recuperación: criterio de la app.</p>
          </Tarjeta>

          <Link to="/plan/analisis" className={h.botonPrincipal}>
            Analizar mi rutina
          </Link>
          <Link to="/plan/asistente" className={estilos.boton}>
            Armar una rutina nueva paso a paso
          </Link>
          <Link to="/plan/armar" className={estilos.boton}>
            Cargar o editar mi rutina a mano
          </Link>
          <Boton ancho onClick={() => setCalendario(true)}>
            Agregar mis sesiones a Google Calendar
          </Boton>
          <Boton ancho onClick={() => setRearmar(true)}>
            Volver a armar el plan
          </Boton>
          <p className={estilos.chico}>Si cambiás días, lugares u horarios en Perfil, volvé a armarlo para que se actualice.</p>
        </>
      )}

      {rearmar && (
        <Dialogo titulo="¿Volver a armar el plan?" onCerrar={() => setRearmar(false)}>
          <p className={estilos.texto2}>
            Se arma de nuevo con tus datos actuales.
            {plan.editado ? ' Ojo: personalizaste el plan a mano y esos cambios se pierden.' : ''}
          </p>
          <div className={estilos.fila}>
            <Boton onClick={() => setRearmar(false)}>Cancelar</Boton>
            <Boton
              variante="principal"
              onClick={() => {
                void generar().then(() => setRearmar(false))
              }}
            >
              Armar
            </Boton>
          </div>
        </Dialogo>
      )}

      {nueva && (
        <Dialogo titulo={`Nueva sesión el ${NOMBRES_DIAS[dia].toLowerCase()}`} onCerrar={() => setNueva(false)}>
          <p className={estilos.texto2}>Elegí el tipo. Después le agregás los ejercicios que quieras.</p>
          {(
            [
              ['fuerza', 'Fuerza', 'Tu propia rutina: vos elegís los ejercicios.'],
              ['cardio', 'Cardio', 'Caminata, trote, soga o marcha. Elegís los minutos.'],
              ['movilidad', 'Movilidad', '10 minutos para soltar el cuerpo.'],
            ] as const
          ).map(([tipo, nombre, texto]) => (
            <button
              key={tipo}
              type="button"
              className={s.alternativa}
              onClick={() => {
                const lugar = plan.dias[dia].sesiones[0]?.lugar ?? entrada.lugares[0]?.nombre
                void cambiar(agregarSesion(plan, dia, tipo, lugar)).then(() => setEditando(plan.dias[dia].sesiones.length))
                setNueva(false)
              }}
            >
              <b>{nombre}</b>
              <span>{texto}</span>
            </button>
          ))}
          <Boton onClick={() => setNueva(false)}>Cancelar</Boton>
        </Dialogo>
      )}

      {intencion && (
        <Dialogo titulo="Cuando… entonces…" onCerrar={() => setIntencion(null)}>
          <p className={estilos.texto2}>
            Decidir de antemano cuándo, dónde y qué vas a hacer ayuda mucho a cumplir. Escribilo con tus palabras: un momento, un lugar y una acción concreta.
          </p>
          <textarea
            className={s.alternativa}
            style={{ minHeight: 110, font: 'inherit', fontSize: 15 }}
            value={intencion.texto}
            maxLength={200}
            aria-label="Tu frase"
            onChange={(ev) => setIntencion({ ...intencion, texto: ev.target.value })}
          />
          <div className={estilos.fila}>
            <Boton onClick={() => setIntencion(null)}>Cancelar</Boton>
            <Boton
              variante="principal"
              onClick={() => {
                void cambiar(cambiarDatosSesion(plan, dia, intencion.idx, { intencion: intencion.texto.trim() })).then(() => setIntencion(null))
              }}
            >
              Guardar
            </Boton>
          </div>
        </Dialogo>
      )}

      {calendario && (
        <Dialogo titulo="Agregar a Google Calendar" onCerrar={() => setCalendario(false)}>
          <p className={estilos.texto2}>
            Bajamos un archivo de calendario con tus sesiones de las próximas 8 semanas, con aviso 15 minutos antes y tu frase "cuando… entonces…". Abrilo desde la
            notificación de descarga o desde la carpeta Descargas y elegí Google Calendar para importarlo.
          </p>
          <p className={estilos.chico}>Solo entran las sesiones con horario. Si cambiás el plan, volvé a bajarlo (y borrá los eventos viejos en el calendario).</p>
          <Boton
            variante="principal"
            ancho
            onClick={() => {
              const blob = new Blob([generarIcs(plan, { semanas: 8 })], { type: 'text/calendar' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'nivel-fisico-real-sesiones.ics'
              document.body.appendChild(a)
              a.click()
              a.remove()
              setTimeout(() => URL.revokeObjectURL(url), 2000)
              setCalendario(false)
            }}
          >
            Bajar el archivo
          </Boton>
        </Dialogo>
      )}

      {cambiando && ejCambio && (
        <Dialogo titulo={`Cambiar ${ejercicio(ejCambio.id)?.nombre.toLowerCase() ?? ''}`} onCerrar={() => setCambiando(null)}>
          {opciones.length === 0 && <p className={estilos.texto2}>No hay otro ejercicio equivalente con el equipo de ese lugar.</p>}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '55vh',
              overflowY: 'auto',
            }}
          >
            {opciones.map((o) => (
              <button key={o.id} type="button" className={s.alternativa} onClick={() => void reemplazar(o.id)}>
                <b>{o.nombre}</b>
                <span>{o.principal.join(', ')}</span>
              </button>
            ))}
          </div>
          <Boton onClick={() => setCambiando(null)}>Cancelar</Boton>
        </Dialogo>
      )}
    </>
  )
}
