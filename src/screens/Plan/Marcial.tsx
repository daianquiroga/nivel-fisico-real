import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { HorariosDia } from '../../components/HorariosDia'
import { BarrasAporte } from '../../content/dibujos-rutina'
import { DibujoGuardia } from '../../content/dibujos-combate'
import { compatibilidad, leerAjustesCombate, nivelPies, nivelSombra, type PruebaPies, type PruebaSombra } from '../../lib/combate'
import { leerTipo } from '../../lib/diario'
import { equipoDisponible } from '../../lib/ejercicios'
import { NOMBRES_DIAS } from '../../lib/perfil'
import { analizarRutina } from '../../lib/plan/analisis'
import { horariosDe, respuestasIniciales, type Horario } from '../../lib/plan/asistente'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import type { EntradaPlan } from '../../lib/plan/generador'
import { ARTES_RUTINA, SOMBRA_VS_SISTEMA, bloquesSesion, nombreCorto, resumenBloques, semanaMarcial, vecesPorArte } from '../../lib/plan/marcial'
import { guardarRutina } from '../../lib/plan/rutinas'
import { armarEntrada, guardarPlan } from '../../lib/plan/usarPlan'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from '../Combate/comun'

const CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const PASOS = ['Días', 'Horario', 'Artes', 'Tu rutina']

/** Armar una rutina marcial: días, tiempo de cada día, artes (de a una o el híbrido) y movilidad opcional. */
export function RutinaMarcial() {
  const navegar = useNavigate()
  const [base, setBase] = useState<EntradaPlan | null | undefined>(undefined)
  const [paso, setPaso] = useState(0)
  const [dias, setDias] = useState<number[]>([])
  const [horarios, setHorarios] = useState<Horario[][]>(Array.from({ length: 7 }, () => []))
  const [defecto, setDefecto] = useState<Horario>({ hora: '19:00', minutos: 45 })
  const [artes, setArtes] = useState<string[]>([])
  const [movilidad, setMovilidad] = useState(true)
  const [niveles, setNiveles] = useState<{ sombra: PruebaSombra[]; pies: PruebaPies[] }>({ sombra: [], pies: [] })
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    void Promise.all([armarEntrada(), leerAjustesCombate(), leerTipo<PruebaSombra>('sombra'), leerTipo<PruebaPies>('pies')]).then(([b, aj, sombra, pies]) => {
      setBase(b)
      setNiveles({ sombra, pies })
      if (b) {
        const r = respuestasIniciales(b)
        setDias(r.dias)
        setHorarios(r.horarios ?? horarios)
        setDefecto({ hora: r.hora, minutos: r.minutos })
      }
      if (aj?.disciplina && aj.disciplina !== 'completo') setArtes([aj.disciplina])
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hs = useMemo(() => horariosDe({ dias, hora: defecto.hora, minutos: defecto.minutos, horarios }), [dias, defecto, horarios])
  const plan = useMemo(
    () =>
      semanaMarcial({
        artes,
        horarios: hs,
        movilidad,
        lugar: base?.lugares[0]?.nombre,
        niveles: Object.fromEntries(artes.map((a) => [a, nivelSombra(niveles.sombra, a)])),
        nivelPies: nivelPies(niveles.pies),
      }),
    [artes, hs, movilidad, base, niveles],
  )

  if (base === undefined) return null
  if (!base) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>Primero, tus datos</h1>
        <p className={e.para}>Para armarte la rutina necesito tus datos básicos. Son 3 minutos.</p>
        <Boton variante="principal" ancho onClick={() => navegar('/inicio')}>
          Cargar mis datos
        </Boton>
      </div>
    )
  }

  const nombre = PASOS[paso]
  const ctx = { objetivos: base.objetivos, zonas: base.zonas, limitaciones: base.limitaciones, equipo: equipoDisponible(base.lugares) }
  const analisis = analizarRutina(plan, ctx)
  const veces = vecesPorArte(plan)
  const sinLugar = artes.filter((a) => !veces[a])
  const titulo = `Marcial: ${artes.map(nombreCorto).join(' + ')}`
  const puedeSeguir = nombre === 'Días' ? dias.length > 0 : nombre === 'Artes' ? artes.length > 0 : true

  async function usarComoPlan() {
    await guardarPlan(plan)
    await asegurarCiclo(plan.creado)
    navegar('/plan')
  }
  async function guardarParaCombinar() {
    await guardarRutina(titulo, 'marcial', plan)
    setGuardado(true)
  }

  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        <button type="button" className={e.volver} onClick={() => (paso ? setPaso(paso - 1) : navegar(-1))} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className={e.barra} aria-hidden="true">
          {PASOS.map((p, i) => (
            <span key={p} className={i < paso ? e.hecho : i === paso ? e.actual : ''} />
          ))}
        </div>
        <span className={e.contador}>
          {paso + 1} de {PASOS.length}
        </span>
      </div>

      {nombre === 'Días' && (
        <>
          <p className="etiqueta">Rutina marcial</p>
          <h1 className={e.titulo}>¿Qué días podés entrenar combate?</h1>
          <p className={e.para}>Tocá los días. Con 2 o 3 ya avanzás.</p>
          <div className={x.etiquetas} role="group" aria-label="Días" style={{ gap: 8 }}>
            {CORTO.map((t, d) => (
              <button
                key={t}
                type="button"
                aria-pressed={dias.includes(d)}
                className={`${x.filtro} ${dias.includes(d) ? x.filtroOn : ''}`}
                style={{ minHeight: 52, minWidth: 64, fontSize: 16 }}
                onClick={() => setDias(dias.includes(d) ? dias.filter((y) => y !== d) : [...dias, d].sort((a, b) => a - b))}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      {nombre === 'Horario' && (
        <>
          <h1 className={e.titulo}>¿A qué hora y cuánto tiempo cada día?</h1>
          <p className={e.para}>Con 20 minutos ya hay rounds de sombra. Si un día podés dos veces, tocá "+ Otro horario".</p>
          <HorariosDia dias={dias} horarios={hs} onCambiar={setHorarios} />
        </>
      )}

      {nombre === 'Artes' && (
        <>
          <h1 className={e.titulo}>¿Qué artes querés entrenar?</h1>
          <p className={e.para}>Elegí una o más: se turnan día por día. La primera que tocás es tu base.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ARTES_RUTINA.map((d) => {
              const pos = artes.indexOf(d.id)
              const on = pos >= 0
              const comp = !on && artes.length ? compatibilidad(artes[0], d.id) : null
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={on}
                  className={x.item}
                  style={{ textAlign: 'left', cursor: 'pointer', borderColor: on ? 'var(--accent)' : undefined, background: on ? 'var(--accent-tint)' : undefined }}
                  onClick={() => setArtes(on ? artes.filter((a) => a !== d.id) : [...artes, d.id])}
                >
                  <span className={x.itemNombre}>
                    {on ? (pos === 0 ? '✓ Base: ' : `✓ ${pos + 1}ª: `) : '+ '}
                    {d.id === 'hibrido' ? 'Mi híbrido: boxeo + kickboxing + muay thai' : d.nombre}
                    {comp ? ` · ${comp.porcentaje} % con ${nombreCorto(artes[0]).toLowerCase()}` : ''}
                  </span>
                  <span className={x.itemDetalle}>{d.detalle}</span>
                </button>
              )
            })}
          </div>
          <Tarjeta>
            <p className="etiqueta">Movilidad</p>
            <p className={estilos.texto2}>Suma rango para patadas, guardia y suelo, y ayuda a recuperarte. Va al final de cada sesión, o sola si un día tenés un segundo horario.</p>
            <button
              type="button"
              aria-pressed={movilidad}
              className={`${x.filtro} ${movilidad ? x.filtroOn : ''}`}
              style={{ minHeight: 52, fontSize: 16 }}
              onClick={() => setMovilidad(!movilidad)}
            >
              {movilidad ? '✓ Con movilidad' : '+ Sumar movilidad'}
            </button>
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">¿Y el sistema completo?</p>
            {SOMBRA_VS_SISTEMA.slice(1).map((d) => (
              <p key={d.titulo} className={estilos.texto2} style={{ margin: 0 }}>
                <b>{d.titulo}:</b> {d.texto}
              </p>
            ))}
            <Link to="/plan/combinar" className={x.filtro} style={{ alignSelf: 'flex-start', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
              Sumarlo a mi rutina en Combinar
            </Link>
          </Tarjeta>
          <p className={estilos.chico}>El % sale de cuántas distancias nuevas te suma, si el análisis de artes la recomienda y si las guardias se parecen (decisión de diseño; ver Combate → Artes).</p>
        </>
      )}

      {nombre === 'Tu rutina' && (
        <>
          <h1 className={e.titulo}>{titulo}</h1>
          <p className={e.para}>Cada sesión es guiada: al tocar Entrenar, la pantalla te dice qué hacer en cada round.</p>
          <Tarjeta destacada>
            <p className="etiqueta">Qué aporta</p>
            <BarrasAporte fisico={analisis.puntajes.fisico} estetico={analisis.puntajes.estetico} marcial={analisis.puntajes.marcial} />
            <p className={estilos.texto2}>
              {artes.map((a) => `${nombreCorto(a)}: ${veces[a] ?? 0} ${veces[a] === 1 ? 'vez' : 'veces'} por semana`).join(' · ')}
            </p>
            <p className={estilos.chico}>Lo físico y lo estético dan bajo porque es solo combate. Para eso, combinala con una rutina de fuerza.</p>
          </Tarjeta>
          {sinLugar.length > 0 && <Aviso tipo="error">{sinLugar.map(nombreCorto).join(' y ')} no entra en la semana: sumá un día o un segundo horario.</Aviso>}
          {plan.dias.map((d, dia) =>
            d.sesiones.length === 0 ? null : (
              <section key={dia} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label={NOMBRES_DIAS[dia]}>
                <p className="etiqueta" style={{ margin: '6px 0 0' }}>
                  {NOMBRES_DIAS[dia]}
                </p>
                {d.sesiones.map((s) => (
                  <Tarjeta key={s.id}>
                    <p className={estilos.chico} style={{ margin: 0 }}>
                      {s.desde} · {s.minutos} min
                    </p>
                    <h2 style={{ margin: 0, fontSize: 19 }}>{s.titulo}</h2>
                    {s.combate ? (
                      <>
                        <ul className={x.seccion} style={{ margin: 0 }}>
                          {resumenBloques(bloquesSesion(s.combate.arte, s.minutos, Boolean(s.combate.movilidad), nivelSombra(niveles.sombra, s.combate.arte), nivelPies(niveles.pies))).map((b, k) => (
                            <li key={k}>{b}</li>
                          ))}
                        </ul>
                        <Link to={`/combate/guiada?d=${s.combate.arte}&min=${s.minutos}&mov=${s.combate.movilidad ? 1 : 0}`} className={x.filtro} style={{ alignSelf: 'flex-start', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
                          Ver la sesión guiada
                        </Link>
                      </>
                    ) : (
                      <p className={estilos.texto2}>{s.nota}</p>
                    )}
                  </Tarjeta>
                ))}
              </section>
            ),
          )}
          {guardado ? (
            <>
              <Aviso tipo="ok">Guardada. Ahora podés juntarla con tu rutina de fuerza o con otra.</Aviso>
              <Link to="/plan/combinar" className={h.botonPrincipal}>
                Combinar rutinas
              </Link>
            </>
          ) : (
            <>
              <button type="button" className={h.botonPrincipal} onClick={() => void guardarParaCombinar()}>
                Guardar para combinar con otra
              </button>
              <Boton ancho onClick={() => void usarComoPlan()}>
                Usarla sola como mi plan
              </Boton>
              <p className={estilos.chico}>"Usarla sola" reemplaza tu plan actual. Para sumarla a tu rutina de fuerza, guardala y combinalas.</p>
            </>
          )}
        </>
      )}

      {nombre !== 'Tu rutina' && (
        <>
          {nombre === 'Días' && <DibujoGuardia />}
          <Boton variante="principal" ancho disabled={!puedeSeguir} onClick={() => (setPaso(paso + 1), window.scrollTo(0, 0))}>
            {PASOS[paso + 1] === 'Tu rutina' ? 'Armar mi rutina marcial' : 'Siguiente'}
          </Boton>
        </>
      )}
    </div>
  )
}
