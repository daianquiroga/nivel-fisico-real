import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chips, Hora, Segmentado, Stepper, estilosControles } from '../../components/controles'
import { Icono } from '../../components/Icono'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import type { Lugar, Perfil, Sexo } from '../../lib/db/db'
import {
  EQUIPO,
  EQUIPO_AIRE_LIBRE,
  METODOS_SERIES,
  NOMBRES_DIAS,
  PREFERENCIAS_GYM,
  TIPOS_LUGAR,
  normalizarSemana,
  tipoDeLugar,
  ESPACIOS,
  LIMITACIONES,
  NOMBRES_TIPO_DIA,
  OBJETIVOS,
  PREGUNTAS_SALUD,
  ZONAS,
  ajustarObjetivos,
  cargarInicio,
  guardarInicio,
  horasDeSueno,
  semanaPorDefecto,
  type Objetivos,
  type Semana,
  type TipoDia,
} from '../../lib/perfil'
import s from './inicio.module.css'

const TITULOS = [
  { t: 'Sobre vos', b: 'Para compararte con gente de tu edad y sexo en los estudios de referencia.' },
  { t: '¿Para qué entrenás?', b: 'Repartí 100 puntos entre tus objetivos. El plan se arma según esta mezcla y la podés cambiar cuando quieras.' },
  { t: 'Dónde entrenás', b: 'Cada lugar con el equipo que tiene. El plan elige ejercicios que se puedan hacer ahí.' },
  { t: 'Tu semana', b: 'A qué hora te levantás y te acostás, dónde estás y cuándo tenés un hueco para entrenar.' },
  { t: 'Tu salud', b: 'Para cuidarte en las pruebas y elegir ejercicios que no te lastimen.' },
]

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const SIGUIENTE_TIPO: Record<TipoDia, TipoDia> = { laboral: 'sabado', sabado: 'domingo', domingo: 'laboral' }
const LETRA_TIPO: Record<TipoDia, string> = { laboral: 'semana', sabado: 'sáb', domingo: 'dom' }

export function Inicio() {
  const navegar = useNavigate()
  const [paso, setPaso] = useState(0)
  const [cargado, setCargado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sexo, setSexo] = useState<Sexo | undefined>()
  const [edad, setEdad] = useState(30)
  const [altura, setAltura] = useState(170)
  const [conPeso, setConPeso] = useState(false)
  const [peso, setPeso] = useState(75)
  const [objetivos, setObjetivos] = useState<Objetivos>({ estetica: 40, condicion: 40, combate: 20 })
  const [zonas, setZonas] = useState<string[]>([])
  const [lugares, setLugares] = useState<Lugar[]>([{ nombre: 'Casa', equipo: [], espacio: '1x1' }])
  const [lugarActivo, setLugarActivo] = useState(0)
  const [semana, setSemana] = useState<Semana>(semanaPorDefecto())
  const [tipoActivo, setTipoActivo] = useState<TipoDia>('laboral')
  const [respuestas, setRespuestas] = useState<(boolean | undefined)[]>(PREGUNTAS_SALUD.map(() => undefined))
  const [limitaciones, setLimitaciones] = useState<string[]>([])
  const [dejoFumar, setDejoFumar] = useState(false)
  const [fechaDejo, setFechaDejo] = useState('')
  const [precioAtado, setPrecioAtado] = useState('')
  const [atados, setAtados] = useState(1)
  const [creado, setCreado] = useState(new Date().toISOString())

  useEffect(() => {
    void cargarInicio().then(({ perfil, lugares: ls, semana: sem }) => {
      if (perfil) {
        setSexo(perfil.sexo)
        if (perfil.edad) setEdad(perfil.edad)
        if (perfil.alturaCm) setAltura(perfil.alturaCm)
        if (perfil.pesoKg) {
          setConPeso(true)
          setPeso(perfil.pesoKg)
        }
        if (perfil.objetivos) setObjetivos(perfil.objetivos)
        setZonas(perfil.zonas ?? [])
        setLimitaciones(perfil.limitaciones ?? [])
        if (perfil.salud) setRespuestas(perfil.salud.respuestas)
        if (perfil.fumar?.activo) {
          setDejoFumar(true)
          setFechaDejo(perfil.fumar.fechaDejo ?? '')
          setPrecioAtado(perfil.fumar.precioAtado ? String(perfil.fumar.precioAtado) : '')
          if (perfil.fumar.atadosPorDia) setAtados(perfil.fumar.atadosPorDia)
        }
        setCreado(perfil.creado)
      }
      if (ls.length) setLugares(ls)
      if (sem) setSemana(sem)
      setCargado(true)
    })
  }, [])

  const lugar = lugares[lugarActivo] ?? lugares[0]
  const cambiarLugar = (cambios: Partial<Lugar>) => {
    const anterior = lugares[lugarActivo]?.nombre
    setLugares((ls) => ls.map((l, i) => (i === lugarActivo ? { ...l, ...cambios } : l)))
    if (cambios.nombre !== undefined && anterior !== undefined && cambios.nombre !== anterior) {
      const nuevo = cambios.nombre
      setSemana((sem) => ({ ...sem, lugaresPorDia: sem.lugaresPorDia.map((d) => d.map((n) => (n === anterior ? nuevo : n))) }))
    }
  }
  const tipoLugar = tipoDeLugar(lugar ?? { nombre: '', equipo: [], espacio: '1x1' })
  const gym = lugar?.gimnasio ?? { prefiere: [], metodo: 'app' as const }

  function alternarLugarDelDia(dia: number, nombre: string) {
    setSemana((sem) => ({
      ...sem,
      lugaresPorDia: sem.lugaresPorDia.map((d, i) => {
        if (i !== dia) return d
        if (d.includes(nombre)) return d.filter((n) => n !== nombre)
        return [...d, nombre].slice(-2)
      }),
    }))
  }

  const tipo = semana.tipos[tipoActivo]
  const cambiarTipo = (cambios: Partial<Semana['tipos'][TipoDia]>) =>
    setSemana((sem) => ({ ...sem, tipos: { ...sem.tipos, [tipoActivo]: { ...sem.tipos[tipoActivo], ...cambios } } }))

  function validar(): string | null {
    if (paso === 0 && !sexo) return 'Elegí una opción en sexo para poder usar las tablas de referencia.'
    if (paso === 2 && lugares.some((l) => !l.nombre.trim())) return 'Poné un nombre a cada lugar.'
    if (paso === 4 && respuestas.some((r) => r === undefined)) return 'Respondé las 5 preguntas de salud.'
    return null
  }

  async function siguiente() {
    const e = validar()
    setError(e)
    if (e) return
    if (paso < 4) {
      setPaso(paso + 1)
      window.scrollTo(0, 0)
      return
    }
    const ahora = new Date().toISOString()
    const resp = respuestas.map(Boolean)
    const perfil: Perfil = {
      id: 'yo',
      sexo,
      edad,
      alturaCm: altura,
      pesoKg: conPeso ? peso : undefined,
      objetivos,
      zonas,
      limitaciones,
      fumar: dejoFumar
        ? { activo: true, fechaDejo: fechaDejo || undefined, precioAtado: Number(precioAtado) || undefined, atadosPorDia: atados }
        : { activo: false },
      salud: { respuestas: resp, apto: resp.every((r) => !r), fecha: ahora },
      inicioCompleto: true,
      creado,
      actualizado: ahora,
    }
    const semanaFinal = normalizarSemana(semana, lugares.map((l) => l.nombre))
    await guardarInicio(perfil, lugares, semanaFinal)
    navegar('/', { replace: true })
  }

  function atras() {
    setError(null)
    if (paso === 0) navegar(-1)
    else setPaso(paso - 1)
  }

  if (!cargado) return null
  const sueno = horasDeSueno(tipo.dormir, tipo.despertar)
  const totalObjetivos = objetivos.estetica + objetivos.condicion + objetivos.combate

  return (
    <div className={s.pantalla}>
      <div className={s.arriba}>
        <button type="button" className={s.volver} onClick={atras} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className={s.pasos} aria-hidden="true">
          {TITULOS.map((_, i) => (
            <span key={i} className={i < paso ? s.hecho : i === paso ? s.actual : ''} />
          ))}
        </div>
        <span className={s.contador}>{paso + 1} de 5</span>
      </div>

      <header>
        <h1 className={s.titulo}>{TITULOS[paso].t}</h1>
        <p className={s.bajada}>{TITULOS[paso].b}</p>
      </header>

      <div className={s.cuerpo}>
        {paso === 0 && (
          <>
            <Tarjeta>
              <p className="etiqueta">Sexo</p>
              <Segmentado
                etiqueta="Sexo"
                valor={sexo}
                onCambio={setSexo}
                opciones={[
                  { valor: 'h', texto: 'Hombre' },
                  { valor: 'm', texto: 'Mujer' },
                ]}
              />
              <p className={estilos.chico}>Las tablas de los estudios están separadas por sexo biológico.</p>
            </Tarjeta>
            <Tarjeta>
              <Stepper etiqueta="Edad" valor={edad} onCambio={setEdad} min={14} max={95} unidad="años" />
              <Stepper etiqueta="Altura" valor={altura} onCambio={setAltura} min={120} max={220} unidad="cm" />
            </Tarjeta>
            <Tarjeta>
              <label className={estilosControles.campo}>
                <span>Cargar mi peso</span>
                <input type="checkbox" checked={conPeso} onChange={(e) => setConPeso(e.target.checked)} style={{ width: 24, height: 24, accentColor: 'var(--accent)' }} />
              </label>
              {conPeso && <Stepper etiqueta="Peso" valor={peso} onCambio={setPeso} min={35} max={200} paso={0.5} unidad="kg" />}
              <p className={estilos.chico}>Es opcional: la evaluación funciona sin balanza, con tu cintura y tu altura.</p>
            </Tarjeta>
          </>
        )}

        {paso === 1 && (
          <>
            <div className={s.barra} aria-hidden="true">
              {OBJETIVOS.map((o) => (
                <span key={o.clave} style={{ width: `${objetivos[o.clave]}%`, background: o.color }} />
              ))}
            </div>
            {OBJETIVOS.map((o) => (
              <Tarjeta key={o.clave}>
                <div className={s.objetivo}>
                  <div>
                    <b style={{ color: o.color }}>{o.nombre}</b>
                    <p className={estilos.chico}>{o.detalle}</p>
                  </div>
                  <div className={estilosControles.stepper} role="group" aria-label={o.nombre}>
                    <button type="button" aria-label={`Restar 10 a ${o.nombre}`} onClick={() => setObjetivos(ajustarObjetivos(objetivos, o.clave, -10))}>
                      −
                    </button>
                    <span className={estilosControles.valor} aria-live="polite">
                      {objetivos[o.clave]}
                    </span>
                    <button type="button" aria-label={`Sumar 10 a ${o.nombre}`} onClick={() => setObjetivos(ajustarObjetivos(objetivos, o.clave, 10))}>
                      +
                    </button>
                  </div>
                </div>
              </Tarjeta>
            ))}
            <p className={estilos.chico} style={{ textAlign: 'right' }}>
              Total: {totalObjetivos} de 100
            </p>
            <Tarjeta>
              <p className="etiqueta">¿Qué te gustaría cambiar primero?</p>
              <Chips etiqueta="Zonas" opciones={ZONAS} elegidas={zonas} onCambio={setZonas} />
              <p className={estilos.chico}>
                La grasa no se baja por zonas: se pierde en todo el cuerpo. El músculo sí se trabaja por zona.
              </p>
            </Tarjeta>
          </>
        )}

        {paso === 2 && (
          <>
            {lugares.length > 1 && (
              <Segmentado
                etiqueta="Lugar"
                valor={String(lugarActivo)}
                onCambio={(v) => setLugarActivo(Number(v))}
                opciones={lugares.map((l, i) => ({ valor: String(i), texto: l.nombre || `Lugar ${i + 1}` }))}
              />
            )}
            <Tarjeta>
              <label className={estilos.chico} htmlFor="nombre-lugar">
                Nombre del lugar
              </label>
              <input
                id="nombre-lugar"
                className={estilosControles.texto}
                value={lugar.nombre}
                maxLength={24}
                onChange={(e) => cambiarLugar({ nombre: e.target.value })}
              />
              <p className="etiqueta" style={{ marginTop: 6 }}>
                Qué tipo de lugar es
              </p>
              <Segmentado
                etiqueta="Tipo de lugar"
                valor={tipoLugar}
                onCambio={(v) => cambiarLugar(v === 'gimnasio' ? { tipo: v, gimnasio: gym } : { tipo: v })}
                opciones={TIPOS_LUGAR}
              />
              {tipoLugar === 'casa' && (
                <>
                  <p className="etiqueta" style={{ marginTop: 6 }}>
                    Espacio libre
                  </p>
                  <Segmentado etiqueta="Espacio" valor={lugar.espacio} onCambio={(v) => cambiarLugar({ espacio: v })} opciones={ESPACIOS} />
                </>
              )}
            </Tarjeta>
            {tipoLugar === 'gimnasio' && (
              <>
                <Tarjeta>
                  <p className="etiqueta">¿Qué preferís usar?</p>
                  <Chips
                    etiqueta="Qué preferís usar"
                    opciones={PREFERENCIAS_GYM}
                    elegidas={gym.prefiere}
                    onCambio={(v) => cambiarLugar({ gimnasio: { ...gym, prefiere: v } })}
                  />
                  {gym.prefiere.length === 0 ? (
                    <p className={estilos.chico}>
                      Podés elegir varias. Si no elegís ninguna, la app mezcla: pesos libres para los ejercicios principales y máquinas o
                      poleas para el resto, que es lo que mejor funciona para la mayoría.
                    </p>
                  ) : (
                    PREFERENCIAS_GYM.filter((o) => gym.prefiere.includes(o.valor)).map((o) => (
                      <p key={o.valor} className={estilos.chico}>
                        <b style={{ color: 'var(--text-2)' }}>{o.texto}:</b> {o.consejo}
                      </p>
                    ))
                  )}
                </Tarjeta>
                <Tarjeta>
                  <p className="etiqueta">¿Cómo armamos las series?</p>
                  <div className={s.metodos} role="radiogroup" aria-label="Cómo armar las series">
                    {METODOS_SERIES.map((m) => (
                      <button
                        key={m.valor}
                        type="button"
                        role="radio"
                        aria-checked={gym.metodo === m.valor}
                        className={`${s.metodo} ${gym.metodo === m.valor ? s.metodoOn : ''}`}
                        onClick={() => cambiarLugar({ gimnasio: { ...gym, metodo: m.valor } })}
                      >
                        <b>{m.texto}</b>
                        <span>{m.consejo}</span>
                      </button>
                    ))}
                  </div>
                </Tarjeta>
              </>
            )}
            {tipoLugar === 'aire-libre' && (
              <Tarjeta>
                <p className="etiqueta">Qué hay o qué llevás</p>
                <Chips etiqueta="Equipo al aire libre" opciones={EQUIPO_AIRE_LIBRE} elegidas={lugar.equipo} onCambio={(v) => cambiarLugar({ equipo: v })} />
              </Tarjeta>
            )}
            {tipoLugar === 'casa' && (
            <Tarjeta>
              <p className="etiqueta">Equipo que tenés ahí</p>
              <Chips etiqueta="Equipo" opciones={EQUIPO} elegidas={lugar.equipo} onCambio={(v) => cambiarLugar({ equipo: v })} />
              {lugar.equipo.includes('mancuernas') && (
                <Stepper
                  etiqueta="Peso total de mancuernas y discos"
                  valor={lugar.pesoTotalKg ?? 20}
                  onCambio={(v) => cambiarLugar({ pesoTotalKg: v })}
                  min={1}
                  max={200}
                  paso={2.5}
                  unidad="kg"
                />
              )}
              <p className={estilos.chico}>Si no tenés nada, dejalo así: hay muchísimos ejercicios con tu propio peso.</p>
            </Tarjeta>
            )}
            <div className={estilos.fila}>
              {lugares.length < 4 && (
                <Boton
                  onClick={() => {
                    setLugares([...lugares, { nombre: '', tipo: 'casa', equipo: [], espacio: '1x1' }])
                    setLugarActivo(lugares.length)
                  }}
                >
                  + Agregar otro lugar
                </Boton>
              )}
              {lugares.length > 1 && (
                <Boton
                  onClick={() => {
                    const quitado = lugares[lugarActivo].nombre
                    setLugares(lugares.filter((_, i) => i !== lugarActivo))
                    setSemana((sem) => ({ ...sem, lugaresPorDia: sem.lugaresPorDia.map((d) => d.filter((n) => n !== quitado)) }))
                    setLugarActivo(0)
                  }}
                >
                  Quitar este lugar
                </Boton>
              )}
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <Tarjeta>
              <p className="etiqueta">Dónde entrenás cada día</p>
              {semana.lugaresPorDia.map((d, i) => (
                <div key={i} className={s.filaDia}>
                  <span>
                    {NOMBRES_DIAS[i]}
                    {d.length === 0 && <small className={s.descanso}>Descanso</small>}
                  </span>
                  <div className={s.chipsDia} role="group" aria-label={`Dónde entrenás el ${NOMBRES_DIAS[i]}`}>
                    {lugares.map((l) => {
                      const on = d.includes(l.nombre)
                      return (
                        <button
                          key={l.nombre}
                          type="button"
                          aria-pressed={on}
                          className={`${s.chipDia} ${on ? s.chipDiaOn : ''}`}
                          onClick={() => alternarLugarDelDia(i, l.nombre)}
                        >
                          {l.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <p className={estilos.chico}>
                Tocá para marcar o desmarcar. Si marcás dos lugares el mismo día, la app pone la sesión principal donde tenés más equipo
                y una sesión corta en el otro. Sin nada marcado, es día de descanso.
              </p>
            </Tarjeta>

            <Tarjeta>
              <p className="etiqueta">Qué tipo de día es cada uno</p>
              <div className={s.dias}>
                {semana.dias.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    className={s.dia}
                    aria-label={`${LETRAS[i]}: ${NOMBRES_TIPO_DIA[t]}. Tocá para cambiar.`}
                    onClick={() => setSemana({ ...semana, dias: semana.dias.map((d, j) => (j === i ? SIGUIENTE_TIPO[d] : d)) })}
                  >
                    {LETRAS[i]}
                    <small>{LETRA_TIPO[t]}</small>
                  </button>
                ))}
              </div>
              <p className={estilos.chico}>Tocá un día para cambiarlo. Por ejemplo, si trabajás los sábados, ponelo como día de semana.</p>
            </Tarjeta>

            <Segmentado
              etiqueta="Tipo de día"
              valor={tipoActivo}
              onCambio={setTipoActivo}
              opciones={(['laboral', 'sabado', 'domingo'] as TipoDia[]).map((t) => ({ valor: t, texto: NOMBRES_TIPO_DIA[t] }))}
            />

            <Tarjeta>
              <Hora etiqueta="Me levanto" valor={tipo.despertar} onCambio={(v) => cambiarTipo({ despertar: v })} />
              <Hora etiqueta="Me acuesto" valor={tipo.dormir} onCambio={(v) => cambiarTipo({ dormir: v })} />
              {sueno < 7 ? (
                <Aviso tipo="error">
                  Te quedan {String(Math.round(sueno * 10) / 10).replace('.', ',')} horas para dormir. Para entrenar y recuperarte conviene apuntar a 7,5 u 8.
                </Aviso>
              ) : (
                <p className={estilos.chico}>{String(Math.round(sueno * 10) / 10).replace('.', ',')} horas para dormir.</p>
              )}
            </Tarjeta>

            <Tarjeta>
              <p className="etiqueta">Huecos libres para entrenar</p>
              {tipo.huecos.length === 0 && <p className={estilos.chico}>Sin huecos: será un día de descanso.</p>}
              {tipo.huecos.map((h, i) => (
                <div key={i} className={s.hueco}>
                  <input
                    type="time"
                    aria-label="Desde"
                    className={estilosControles.hora}
                    value={h.desde}
                    onChange={(e) => cambiarTipo({ huecos: tipo.huecos.map((x, j) => (j === i ? { ...x, desde: e.target.value } : x)) })}
                  />
                  <span className={estilos.chico}>a</span>
                  <input
                    type="time"
                    aria-label="Hasta"
                    className={estilosControles.hora}
                    value={h.hasta}
                    onChange={(e) => cambiarTipo({ huecos: tipo.huecos.map((x, j) => (j === i ? { ...x, hasta: e.target.value } : x)) })}
                  />
                  <button
                    type="button"
                    className={s.quitar}
                    aria-label="Quitar hueco"
                    onClick={() => cambiarTipo({ huecos: tipo.huecos.filter((_, j) => j !== i) })}
                  >
                    <Icono nombre="cerrar" tam={18} />
                  </button>
                </div>
              ))}
              {tipo.huecos.length < 4 && (
                <Boton onClick={() => cambiarTipo({ huecos: [...tipo.huecos, { desde: '07:00', hasta: '07:15' }] })}>+ Agregar hueco</Boton>
              )}
              <p className={estilos.chico}>Los huecos cortos (10 a 15 minutos) también sirven: ahí van las microsesiones.</p>
            </Tarjeta>
          </>
        )}

        {paso === 4 && (
          <>
            <Tarjeta>
              {PREGUNTAS_SALUD.map((p, i) => (
                <div key={i} className={s.pregunta}>
                  <p>{p}</p>
                  <Segmentado
                    etiqueta={p}
                    valor={respuestas[i] === undefined ? undefined : respuestas[i] ? 'si' : 'no'}
                    onCambio={(v) => setRespuestas(respuestas.map((r, j) => (j === i ? v === 'si' : r)))}
                    opciones={[
                      { valor: 'no', texto: 'No' },
                      { valor: 'si', texto: 'Sí' },
                    ]}
                  />
                </div>
              ))}
              {respuestas.some((r) => r) && (
                <Aviso tipo="error">
                  Antes de las pruebas de esfuerzo, consultá a un médico. Mientras tanto vas a poder hacer las mediciones en reposo.
                </Aviso>
              )}
            </Tarjeta>
            <Tarjeta>
              <p className="etiqueta">¿Te duele o te molesta algo?</p>
              <Chips etiqueta="Limitaciones" opciones={LIMITACIONES} elegidas={limitaciones} onCambio={setLimitaciones} />
              <p className={estilos.chico}>La app va a cambiar los ejercicios que cargan esa zona. Si el dolor es fuerte o sigue, consultá a un profesional.</p>
            </Tarjeta>
            <Tarjeta>
              <label className={estilosControles.campo}>
                <span>Dejé de fumar</span>
                <input type="checkbox" checked={dejoFumar} onChange={(e) => setDejoFumar(e.target.checked)} style={{ width: 24, height: 24, accentColor: 'var(--accent)' }} />
              </label>
              {dejoFumar && (
                <>
                  <label className={estilosControles.campo}>
                    <span>Desde cuándo</span>
                    <input type="date" className={estilosControles.hora} value={fechaDejo} onChange={(e) => setFechaDejo(e.target.value)} />
                  </label>
                  <label className={estilosControles.campo}>
                    <span>Precio del atado (opcional)</span>
                    <input
                      inputMode="numeric"
                      className={estilosControles.hora}
                      style={{ width: 120 }}
                      value={precioAtado}
                      onChange={(e) => setPrecioAtado(e.target.value.replace(/\D/g, ''))}
                      placeholder="$"
                    />
                  </label>
                  <Stepper etiqueta="Fumabas por día" valor={atados} onCambio={setAtados} min={0.25} max={5} paso={0.25} unidad="atados" />
                  <p className={estilos.chico}>Vas a ver los días sin fumar, la plata ahorrada y cómo se recupera tu cuerpo. Si fumaste muchos años, conviene un chequeo médico antes de entrenar fuerte.</p>
                </>
              )}
            </Tarjeta>
          </>
        )}
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}
      <Boton variante="principal" ancho onClick={() => void siguiente()}>
        {paso < 4 ? 'Siguiente' : 'Guardar'}
      </Boton>
    </div>
  )
}
