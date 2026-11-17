import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { BarrasAporte } from '../../content/dibujos-rutina'
import { Implementos } from '../../components/Implementos'
import { HorariosDia } from '../../components/HorariosDia'
import { EJERCICIOS, PATRONES, ejercicio, equipoDisponible, implemento, sePuedeHacer, variantesDe } from '../../lib/ejercicios'
import { normalizar } from '../../lib/aprender'
import { db } from '../../lib/db/db'
import { NOMBRES_DIAS, ZONAS } from '../../lib/perfil'
import { analizarRutina } from '../../lib/plan/analisis'
import { EXTRAS, completarHorarios, horariosDe, PRIORIDADES, entradaDesdeRespuestas, sinOpcionales, sinVacias, sumarEntrenamiento, respuestasIniciales, type Prioridad, type Respuestas } from '../../lib/plan/asistente'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import { guardarRutina } from '../../lib/plan/rutinas'
import { agregarEjercicio, borrarSesion, quitarEjercicio } from '../../lib/plan/editar'
import { alternativas, generarPlan, type EntradaPlan, type PlanSemana } from '../../lib/plan/generador'
import { armarEntrada, guardarPlan } from '../../lib/plan/usarPlan'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from '../Combate/comun'

const CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const sumarMinutos = (h: string, m: number) => {
  const [a, b] = h.split(':').map(Number)
  const t = Math.min(23 * 60 + 30, a * 60 + b + m)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
const PASOS = ['Días', 'Horario', 'Lugar', 'Objetivo', 'Tu rutina']

function Chips<T extends string | number>({ opciones, elegidos, cambiar, etiqueta }: { opciones: { valor: T; texto: string }[]; elegidos: T[]; cambiar: (v: T) => void; etiqueta: string }) {
  return (
    <div className={x.etiquetas} role="group" aria-label={etiqueta} style={{ gap: 8 }}>
      {opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          aria-pressed={elegidos.includes(o.valor)}
          className={`${x.filtro} ${elegidos.includes(o.valor) ? x.filtroOn : ''}`}
          style={{ minHeight: 52, minWidth: 64, fontSize: 16 }}
          onClick={() => cambiar(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

/** Armar la rutina paso a paso: pocas preguntas y una propuesta para ajustar. */
export function AsistenteRutina() {
  const navegar = useNavigate()
  const [base, setBase] = useState<EntradaPlan | null | undefined>(undefined)
  const [r, setR] = useState<Respuestas | null>(null)
  const [paso, setPaso] = useState(0)
  const [plan, setPlan] = useState<PlanSemana | null>(null)
  const [extra, setExtra] = useState<{ dia: number; hora: string } | null>(null)
  const [sumar, setSumar] = useState<{ dia: number; idx: number } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<string | null>(null)

  useEffect(() => {
    void armarEntrada().then((b) => {
      setBase(b)
      if (b) setR(respuestasIniciales(b))
    })
  }, [])

  const entrada = useMemo(() => (base && r ? entradaDesdeRespuestas(base, r) : null), [base, r])
  const ctx = useMemo(
    () => (entrada ? { objetivos: entrada.objetivos, zonas: entrada.zonas, limitaciones: entrada.limitaciones, equipo: equipoDisponible(entrada.lugares) } : null),
    [entrada],
  )

  if (base === undefined) return null
  if (!base || !r || !entrada || !ctx) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>Primero, tus datos</h1>
        <p className={e.para}>Para armarte la rutina necesito tus datos básicos y dónde entrenás. Son 3 minutos.</p>
        <Boton variante="principal" ancho onClick={() => navegar('/inicio')}>
          Cargar mis datos
        </Boton>
      </div>
    )
  }

  const saltarLugar = base.lugares.length <= 1
  const pasos = saltarLugar ? PASOS.filter((p) => p !== 'Lugar') : PASOS
  const nombre = pasos[paso]
  const cambiar = (c: Partial<Respuestas>) => setR({ ...r, ...c })
  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((y) => y !== v) : [...lista, v])

  const siguiente = () => {
    if (pasos[paso + 1] === 'Tu rutina') setPlan(completarHorarios(sinOpcionales(generarPlan(entrada)), r))
    setPaso(paso + 1)
    window.scrollTo(0, 0)
  }
  const puedeSeguir = nombre === 'Días' ? r.dias.length > 0 : nombre === 'Objetivo' ? r.prioridades.length > 0 : true

  async function guardar() {
    if (!plan || !entrada) return
    const p = { ...sinVacias(plan), editado: true }
    await guardarPlan(p)
    await asegurarCiclo(p.creado)
    // Lo que elegiste en "¿Qué querés lograr?" pasa a ser tu objetivo, así el análisis y el coach miden lo mismo.
    await db.perfil.update('yo', { objetivos: entrada.objetivos, zonas: entrada.zonas, actualizado: new Date().toISOString() })
    navegar('/plan')
  }

  const analisis = plan ? analizarRutina(plan, ctx) : null

  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        <button type="button" className={e.volver} onClick={() => (paso ? setPaso(paso - 1) : navegar(-1))} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className={e.barra} aria-hidden="true">
          {pasos.map((p, i) => (
            <span key={p} className={i < paso ? e.hecho : i === paso ? e.actual : ''} />
          ))}
        </div>
        <span className={e.contador}>
          {paso + 1} de {pasos.length}
        </span>
      </div>

      {nombre === 'Días' && (
        <>
          <h1 className={e.titulo}>¿Qué días podés entrenar?</h1>
          <p className={e.para}>Tocá los días. Con 3 alcanza para empezar.</p>
          <Chips etiqueta="Días" opciones={CORTO.map((t, i) => ({ valor: i, texto: t }))} elegidos={r.dias} cambiar={(d) => cambiar({ dias: alternar(r.dias, d).sort((a, b) => a - b) })} />
        </>
      )}

      {nombre === 'Horario' && (
        <>
          <h1 className={e.titulo}>¿A qué hora y cuánto tiempo?</h1>
          <p className={e.para}>Poné lo mismo para todos o cambiá cada día. Si un día podés dos veces (mañana y noche), tocá "+ Otro horario".</p>
          <HorariosDia dias={r.dias} horarios={horariosDe(r)} onCambiar={(horarios) => cambiar({ horarios })} />
        </>
      )}

      {nombre === 'Lugar' && (
        <>
          <h1 className={e.titulo}>¿Dónde vas a entrenar?</h1>
          <p className={e.para}>La rutina usa el equipo de ese lugar.</p>
          <Chips etiqueta="Lugar" opciones={base.lugares.map((l) => ({ valor: l.nombre, texto: l.nombre }))} elegidos={[r.lugar]} cambiar={(l) => cambiar({ lugar: l })} />
        </>
      )}

      {nombre === 'Objetivo' && (
        <>
          <h1 className={e.titulo}>¿Qué querés lograr?</h1>
          <p className={e.para}>Elegí una o dos cosas. Si elegís todo, avanza todo más despacio.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRIORIDADES.map((p) => {
              const on = r.prioridades.includes(p.valor)
              return (
                <button
                  key={p.valor}
                  type="button"
                  aria-pressed={on}
                  className={x.item}
                  style={{ textAlign: 'left', cursor: 'pointer', borderColor: on ? 'var(--accent)' : undefined, background: on ? 'var(--accent-tint)' : undefined }}
                  onClick={() => cambiar({ prioridades: alternar<Prioridad>(r.prioridades, p.valor) })}
                >
                  <span className={x.itemNombre}>
                    {on ? '✓ ' : ''}
                    {p.texto}
                  </span>
                  <span className={x.itemDetalle}>{p.detalle}</span>
                </button>
              )
            })}
          </div>
          {(r.prioridades.includes('musculo') || r.prioridades.includes('grasa')) && (
            <>
              <p className="etiqueta">¿Alguna zona en especial? (opcional)</p>
              <Chips
                etiqueta="Zonas"
                opciones={ZONAS.filter((z) => z.valor !== 'definicion').map((z) => ({ valor: z.valor, texto: z.texto }))}
                elegidos={r.zonas}
                cambiar={(z) => cambiar({ zonas: alternar(r.zonas, z) })}
              />
            </>
          )}
        </>
      )}

      {nombre === 'Tu rutina' && plan && analisis && (
        <>
          <h1 className={e.titulo}>Tu rutina</h1>
          <p className={e.para}>Así queda tu semana. Podés cambiar o sacar ejercicios, y sumar más de un entrenamiento por día, antes de guardar.</p>
          <Tarjeta destacada>
            <p className="etiqueta">Qué aporta · {analisis.puntajes.objetivos} de 100 para tus objetivos</p>
            <BarrasAporte fisico={analisis.puntajes.fisico} estetico={analisis.puntajes.estetico} marcial={analisis.puntajes.marcial} />
            <p className={estilos.texto2} style={{ fontWeight: 600, color: analisis.veredicto.buena ? 'var(--done)' : 'var(--text)' }}>
              {analisis.veredicto.buena ? '✓ ' : ''}
              {analisis.veredicto.texto}
            </p>
            <p className={estilos.chico}>Con 65 o más es buena para vos. Las rayitas marcan 40 (base) y 65 (buena). Las áreas que no elegiste pueden dar bajo.</p>
          </Tarjeta>
          {plan.dias.map((d, dia) => (
            <section key={dia} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label={NOMBRES_DIAS[dia]}>
              <p className="etiqueta" style={{ margin: '6px 0 0' }}>
                {NOMBRES_DIAS[dia]}
                {d.sesiones.length === 0 ? ' · libre' : d.sesiones.length > 1 ? ` · ${d.sesiones.length} entrenamientos` : ''}
              </p>
              {d.sesiones.map((s, idx) => (
                <Tarjeta key={s.id}>
                  <p className={estilos.chico} style={{ margin: 0 }}>
                    {s.desde ?? ''} · {s.minutos} min
                  </p>
                  <h2 style={{ margin: 0, fontSize: 19 }}>{s.titulo}</h2>
                  {s.ejercicios.map((ep, i) => {
                    const ej = ejercicio(ep.id)
                    if (!ej) return null
                    const alt = alternativas(entrada, s.lugar, ep, s.ejercicios.map((y) => y.id))
                    return (
                      <div key={`${ep.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                        <span style={{ width: 96, flexShrink: 0, background: 'var(--bg)', borderRadius: 8 }} aria-hidden="true">
                          <DibujoEjercicio id={ep.id} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className={x.itemNombre} style={{ display: 'block', fontSize: 15 }}>
                            {ej.nombre}
                          </span>
                          <span className={x.itemDetalle}>
                            {ej.tipo === 'minutos' ? `${ep.rango[0]} min` : `${ep.series} ${ep.series === 1 ? 'serie' : 'series'} de ${ep.rango[0]} a ${ep.rango[1]}`}
                          </span>
                          <span style={{ display: 'block', marginTop: 6 }}>
                            <Implementos
                              id={ep.id}
                              equipo={ctx.equipo}
                              onElegir={(id) => {
                                const p = structuredClone(plan)
                                const n = ejercicio(id)
                                if (n) p.dias[dia].sesiones[idx].ejercicios[i] = { ...ep, id, rango: n.rango }
                                setPlan(p)
                              }}
                            />
                          </span>
                          <span style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            {alt.length > 0 && (
                              <button
                                type="button"
                                className={x.filtro}
                                onClick={() => {
                                  const p = structuredClone(plan)
                                  const n = alt[0]
                                  p.dias[dia].sesiones[idx].ejercicios[i] = { ...ep, id: n.id, rango: n.tipo === 'minutos' ? ep.rango : n.rango }
                                  setPlan(p)
                                }}
                              >
                                Cambiar
                              </button>
                            )}
                            <button type="button" className={x.filtro} onClick={() => setPlan(sinVacias(quitarEjercicio(plan, dia, idx, i)))}>
                              Sacar
                            </button>
                          </span>
                        </span>
                      </div>
                    )
                  })}
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" className={x.filtro} style={{ borderColor: 'var(--accent)' }} onClick={() => setSumar({ dia, idx })}>
                      + Sumar ejercicio
                    </button>
                    <button type="button" className={x.filtro} onClick={() => setPlan(borrarSesion(plan, dia, idx))}>
                      Sacar este entrenamiento
                    </button>
                  </span>
                </Tarjeta>
              ))}
              <button
                type="button"
                className={estilos.boton}
                onClick={() => {
                  const ultimo = d.sesiones[d.sesiones.length - 1]
                  setExtra({ dia, hora: ultimo?.hasta ? sumarMinutos(ultimo.hasta, 60) : r.hora })
                }}
              >
                + {d.sesiones.length ? 'Sumar otro entrenamiento' : 'Sumar un entrenamiento'} el {NOMBRES_DIAS[dia].toLowerCase()}
              </button>
            </section>
          ))}
          {sumar && (
            <Dialogo titulo={`Sumar al ${NOMBRES_DIAS[sumar.dia].toLowerCase()}`} onCerrar={() => setSumar(null)}>
              <input className={x.buscador} type="search" placeholder="Buscar: militar, martillo, remo…" aria-label="Buscar ejercicio" value={busqueda} onChange={(ev) => setBusqueda(ev.target.value)} />
              <div className={x.filtros} role="group" aria-label="Filtrar por tipo">
                {PATRONES.map((f) => (
                  <button key={f.valor} type="button" aria-pressed={filtro === f.valor} className={`${x.filtro} ${filtro === f.valor ? x.filtroOn : ''}`} onClick={() => setFiltro(filtro === f.valor ? null : f.valor)}>
                    {f.texto}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '45vh', overflowY: 'auto' }}>
                {EJERCICIOS.filter((ej) => {
                  const vs = variantesDe(ej.id)
                  const rep = vs.find((v) => sePuedeHacer(v, ctx.equipo)) ?? vs[0]
                  if (rep.id !== ej.id) return false
                  if (filtro && !PATRONES.find((f) => f.valor === filtro)?.incluye.includes(ej.patron)) return false
                  const q = normalizar(busqueda)
                  return !q || normalizar([ej.nombre, ...ej.principal, ...vs.map((v) => v.nombre)].join(' ')).includes(q)
                }).map((ej) => {
                  const ya = plan.dias[sumar.dia].sesiones[sumar.idx]?.ejercicios.some((y) => variantesDe(ej.id).some((v) => v.id === y.id))
                  return (
                    <button
                      key={ej.id}
                      type="button"
                      className={x.item}
                      style={{ textAlign: 'left', cursor: 'pointer', opacity: ya ? 0.5 : 1 }}
                      disabled={ya}
                      onClick={() => {
                        setPlan(agregarEjercicio(plan, sumar.dia, sumar.idx, ej.id))
                        setSumar(null)
                        setBusqueda('')
                      }}
                    >
                      <span className={x.itemNombre}>
                        {ya ? '✓ ' : '+ '}
                        {ej.nombre}
                      </span>
                      <span className={x.itemDetalle}>
                        {ej.principal.join(', ')}
                        {variantesDe(ej.id).length > 1 ? ` · después elegís con ${variantesDe(ej.id).map((v) => implemento(v).toLowerCase()).join(', ')}` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
              <Boton onClick={() => setSumar(null)}>Listo</Boton>
            </Dialogo>
          )}
          {extra && (
            <Dialogo titulo={`Otro entrenamiento el ${NOMBRES_DIAS[extra.dia].toLowerCase()}`} onCerrar={() => setExtra(null)}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="etiqueta">¿A qué hora?</span>
                <input className={x.buscador} style={{ fontSize: 20, minHeight: 52 }} type="time" value={extra.hora} onChange={(ev) => ev.target.value && setExtra({ ...extra, hora: ev.target.value })} />
              </label>
              <p className="etiqueta">¿Qué querés hacer?</p>
              {EXTRAS.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  className={x.item}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => {
                    setPlan(sumarEntrenamiento(plan, extra.dia, o.valor, extra.hora, r.lugar))
                    setExtra(null)
                  }}
                >
                  <span className={x.itemNombre}>{o.texto}</span>
                  <span className={x.itemDetalle}>{o.detalle}</span>
                </button>
              ))}
              <p className={estilos.chico}>¿Querés otra sesión de fuerza o elegir vos los ejercicios? Guardá y después tocá "Cargar o editar mi rutina a mano" en Plan.</p>
              <Boton onClick={() => setExtra(null)}>Cancelar</Boton>
            </Dialogo>
          )}
          {analisis.faltas.length > 0 && (
            <Tarjeta>
              <p className="etiqueta">Para que quede más completa</p>
              {analisis.faltas.slice(0, 3).map((f) => (
                <div key={f.texto} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p className={estilos.texto2}>{f.texto.split(':')[0]}</p>
                  <div className={x.etiquetas}>
                    {f.sugerencias.slice(0, 2).map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={x.filtro}
                        onClick={() => {
                          const dia = plan.dias.findIndex((d) => d.sesiones.some((s) => s.tipo === 'fuerza'))
                          const destino = dia >= 0 ? dia : plan.dias.findIndex((d) => d.sesiones.some((s) => !s.titulo.includes('opcional')))
                          if (destino >= 0) setPlan(agregarEjercicio(plan, destino, plan.dias[destino].sesiones.findIndex((s) => !s.titulo.includes('opcional')), id))
                        }}
                      >
                        + {ejercicio(id)?.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Tarjeta>
          )}
          <button type="button" className={h.botonPrincipal} disabled={!plan.dias.some((d) => d.sesiones.length)} onClick={() => void guardar()}>
            Guardar mi rutina
          </button>
          <Boton
            ancho
            disabled={!plan.dias.some((d) => d.sesiones.length)}
            onClick={async () => {
              await guardarRutina(`Fuerza: ${r.prioridades.map((v) => PRIORIDADES.find((y) => y.valor === v)?.texto.toLowerCase()).join(' y ')}`, 'fuerza', { ...sinVacias(plan), editado: true })
              navegar('/plan/combinar')
            }}
          >
            Guardar para combinar con otra (marcial, sistema…)
          </Boton>
          <p className={estilos.chico}>Se guarda como tu plan de la semana y lo que elegiste en "¿Qué querés lograr?" queda como tu objetivo. Después lo podés cambiar desde Plan o Perfil.</p>
        </>
      )}

      {nombre !== 'Tu rutina' && (
        <Boton variante="principal" ancho disabled={!puedeSeguir} onClick={siguiente}>
          {pasos[paso + 1] === 'Tu rutina' ? 'Armar mi rutina' : 'Siguiente'}
        </Boton>
      )}
    </div>
  )
}
