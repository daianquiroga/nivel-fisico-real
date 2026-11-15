import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOVIMIENTOS, PASOS, type IdPaso } from '../../content/evaluacion-pasos'
import normasVo2 from '../../content/normas/vo2max-hunt.json'
import { Stepper } from '../../components/controles'
import { Cronometro, CuentaRegresiva } from '../../components/tiempo'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { ojosParaEquilibrio } from '../../lib/calc/pruebas'
import { db } from '../../lib/db/db'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import { calcularResultados, type DatosEvaluacion, type VarianteFlexion } from '../../lib/evaluacion'
import { usarInicio } from '../../lib/usarInicio'
import s from './evaluacion.module.css'

type Modo = 'completa' | 'rapida'

const PASOS_COMPLETA: IdPaso[] = ['pulso', 'medidas', 'actividad', 'rodilla', 'equilibrio', 'sentarse', 'flexiones', 'plancha', 'calidad']
const PASOS_RAPIDA: IdPaso[] = ['pulso', 'medidas', 'actividad', 'equilibrio', 'sentarse', 'flexiones']
const DE_ESFUERZO: IdPaso[] = ['sentarse', 'flexiones', 'plancha']

interface Borrador {
  modo: Modo
  indice: number
  datos: DatosEvaluacion
}

const CLAVE_BORRADOR = 'evaluacionEnCurso'

function Opciones<T extends number>({
  opciones,
  valor,
  onCambio,
  etiqueta,
}: {
  opciones: { texto: string; puntos: T }[]
  valor: T | undefined
  onCambio: (v: T) => void
  etiqueta: string
}) {
  return (
    <div className={s.opciones} role="radiogroup" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button
          key={o.texto}
          type="button"
          role="radio"
          aria-checked={valor === o.puntos}
          className={`${s.opcion} ${valor === o.puntos ? s.opcionOn : ''}`}
          onClick={() => onCambio(o.puntos)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

export function Evaluacion() {
  const navegar = useNavigate()
  const { cargado, perfil } = usarInicio()
  const [modo, setModo] = useState<Modo | null>(null)
  const [indice, setIndice] = useState(0)
  const [datos, setDatos] = useState<DatosEvaluacion>({})
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [contarToques, setContarToques] = useState(false)
  const [intentos, setIntentos] = useState<number[]>([])
  const [respActividad, setRespActividad] = useState<{ frecuencia?: number; intensidad?: number; duracion?: number }>({})
  usarPantallaEncendida(modo !== null)

  const apto = perfil?.salud?.apto !== false
  const pasos = (modo === 'rapida' ? PASOS_RAPIDA : PASOS_COMPLETA).filter((p) => apto || !DE_ESFUERZO.includes(p))
  const id = pasos[indice]
  const sexo = perfil?.sexo ?? 'h'
  const edad = perfil?.edad ?? 30
  const muneca = perfil?.limitaciones?.includes('muneca')

  useEffect(() => {
    void db.ajustes.get(CLAVE_BORRADOR).then((a) => setBorrador((a?.valor as Borrador | undefined) ?? null))
  }, [])

  useEffect(() => {
    if (modo) void db.ajustes.put({ clave: CLAVE_BORRADOR, valor: { modo, indice, datos } satisfies Borrador })
  }, [modo, indice, datos])

  const cambiar = useCallback((c: Partial<DatosEvaluacion>) => setDatos((d) => ({ ...d, ...c })), [])

  function empezar(m: Modo, desde?: Borrador) {
    setModo(m)
    setIndice(desde?.indice ?? 0)
    setDatos(desde?.datos ?? { alturaCm: perfil?.alturaCm })
    setIntentos([])
    window.scrollTo(0, 0)
  }

  function faltante(): string | null {
    if (id === 'pulso' && !(datos.pulsos ?? []).some((p) => p > 0)) return 'Cargá al menos una medición de pulso, o salteá la prueba.'
    if (id === 'actividad' && !datos.actividad) return 'Respondé las tres preguntas.'
    return null
  }

  async function siguiente() {
    const f = faltante()
    setAviso(f)
    if (f) return
    // Lo que se ve en pantalla es lo que se guarda, aunque no se haya tocado.
    if (id === 'medidas') cambiar({ alturaCm: datos.alturaCm ?? 170, cinturaCm: datos.cinturaCm ?? 85 })
    if (id === 'rodilla') cambiar({ rodilla: datos.rodilla ?? { izq: 10, der: 10 } })
    if (indice < pasos.length - 1) {
      setIndice(indice + 1)
      setIntentos([])
      setContarToques(false)
      window.scrollTo(0, 0)
      return
    }
    await terminar()
  }

  function saltear() {
    const sin: Partial<Record<IdPaso, keyof DatosEvaluacion>> = {
      pulso: 'pulsos',
      rodilla: 'rodilla',
      equilibrio: 'equilibrio',
      sentarse: 'sentarse',
      flexiones: 'flexiones',
      plancha: 'plancha',
      calidad: 'calidad',
    }
    const clave = sin[id]
    if (clave) setDatos((d) => ({ ...d, [clave]: undefined }))
    setAviso(null)
    if (indice < pasos.length - 1) {
      setIndice(indice + 1)
      setIntentos([])
      window.scrollTo(0, 0)
    } else void terminar()
  }

  async function terminar() {
    const resultados = calcularResultados(sexo, edad, datos)
    const nuevoId = await db.evaluaciones.add({
      fecha: new Date().toISOString(),
      modo: modo ?? 'completa',
      datos: { ...datos, sexo, edad } as unknown as Record<string, unknown>,
      resultados: resultados as unknown as Record<string, unknown>,
    })
    await db.ajustes.delete(CLAVE_BORRADOR)
    navegar(`/resultado/${nuevoId}`, { replace: true })
  }

  function atras() {
    setAviso(null)
    if (modo === null) navegar(-1)
    else if (indice === 0) setModo(null)
    else setIndice(indice - 1)
  }

  if (!cargado) return null
  if (!perfil?.inicioCompleto) {
    return (
      <div className={s.pantalla}>
        <h1 className={s.titulo}>Primero, tus datos</h1>
        <p className={s.para}>Para compararte con gente de tu edad necesitamos tu perfil. Son 3 a 5 minutos.</p>
        <Boton variante="principal" onClick={() => navegar('/inicio')}>
          Configurar
        </Boton>
      </div>
    )
  }

  const flecha = (
    <button type="button" className={s.volver} onClick={atras} aria-label="Volver">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )

  if (modo === null) {
    return (
      <div className={s.pantalla}>
        <div className={s.arriba}>{flecha}</div>
        <header>
          <h1 className={s.titulo}>Tu evaluación</h1>
          <p className={s.para}>Cada prueba trae cómo hacerla y un cronómetro. Si alguna duele (no solo cansa), salteala.</p>
        </header>
        {borrador && (
          <Tarjeta destacada>
            <p className="etiqueta" style={{ color: 'var(--accent)' }}>
              Quedó una a medias
            </p>
            <p className={estilos.texto2}>Ibas por la prueba {borrador.indice + 1}. Podés seguir donde dejaste.</p>
            <Boton variante="principal" onClick={() => empezar(borrador.modo, borrador)}>
              Seguir
            </Boton>
          </Tarjeta>
        )}
        <div className={s.modos}>
          <button type="button" className={s.modo} onClick={() => empezar('completa')}>
            <b>Completa · unos 40 minutos</b>
            <span>Las 9 pruebas: cardio, composición, movilidad, equilibrio, fuerza y calidad de movimiento.</span>
          </button>
          <button type="button" className={s.modo} onClick={() => empezar('rapida')}>
            <b>Rápida · unos 15 minutos</b>
            <span>Pulso, medidas, actividad, equilibrio, sentarse y pararse, y flexiones.</span>
          </button>
        </div>
        {!apto && (
          <Aviso tipo="error">
            Por tus respuestas de salud no incluimos las pruebas de esfuerzo (sentarse y pararse, flexiones y plancha). Consultá a un médico antes de hacerlas.
          </Aviso>
        )}
        <Tarjeta>
          <p className="etiqueta">Para que los números sirvan</p>
          <ul className={s.pasos}>
            <li>Sin haber entrenado hoy ni ayer.</li>
            <li>Comida liviana 2 horas antes y sin café, mate ni energizantes en la hora previa.</li>
            <li>Ropa cómoda, descalzo, con una silla firme y una pared cerca.</li>
            <li>Descansá 3 a 5 minutos entre las pruebas de esfuerzo.</li>
          </ul>
        </Tarjeta>
      </div>
    )
  }

  const texto = PASOS[id]
  const ojos = datos.equilibrio?.ojos ?? ojosParaEquilibrio(edad)
  const pulsos = datos.pulsos ?? []
  const act = { ...datos.actividad, ...respActividad }
  const responder = (c: Partial<typeof respActividad>) => {
    const r = { ...act, ...c }
    setRespActividad(r)
    if (r.frecuencia !== undefined && r.intensidad !== undefined && r.duracion !== undefined) {
      cambiar({ actividad: { frecuencia: r.frecuencia, intensidad: r.intensidad, duracion: r.duracion } })
    }
  }
  const calidad = datos.calidad ?? MOVIMIENTOS.map(() => null)

  return (
    <div className={s.pantalla}>
      <div className={s.arriba}>
        {flecha}
        <div className={s.barra} aria-hidden="true">
          {pasos.map((_, i) => (
            <span key={i} className={i < indice ? s.hecho : i === indice ? s.actual : ''} />
          ))}
        </div>
        <span className={s.contador}>
          {indice + 1} de {pasos.length}
        </span>
      </div>

      <header>
        <h1 className={s.titulo}>{texto.titulo}</h1>
        <p className={s.para}>{texto.para}</p>
      </header>

      <Tarjeta>
        <ol className={s.pasos}>
          {texto.como.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        {texto.errores && (
          <details className={s.errores}>
            <summary>Errores comunes</summary>
            <ul>
              {texto.errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </details>
        )}
        {texto.piso && <p className={estilos.chico}>Necesitás el largo de tu cuerpo en el piso (por ejemplo, al lado de la cama).</p>}
      </Tarjeta>

      {id === 'pulso' && (
        <>
          <label className={estilos.chico} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={contarToques} onChange={(e) => setContarToques(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} />
            Contar tocando la pantalla en cada latido
          </label>
          <CuentaRegresiva
            key={String(contarToques)}
            segundos={60}
            conToques={contarToques}
            textoToque="Tocá en cada latido"
            onFin={(t) => {
              if (contarToques && t > 0) cambiar({ pulsos: [...pulsos.filter((p) => p > 0), t].slice(-3) })
            }}
          />
          <Tarjeta>
            <p className="etiqueta">Tus mediciones (hasta 3 mañanas)</p>
            {pulsos.map((p, i) => (
              <Stepper
                key={i}
                etiqueta={`Medición ${i + 1}`}
                valor={p}
                min={30}
                max={140}
                unidad="latidos/min"
                onCambio={(v) => cambiar({ pulsos: pulsos.map((x, j) => (j === i ? v : x)) })}
              />
            ))}
            <div className={estilos.fila}>
              {pulsos.length < 3 && <Boton onClick={() => cambiar({ pulsos: [...pulsos, 70] })}>+ Cargar una medición</Boton>}
              {pulsos.length > 0 && <Boton onClick={() => cambiar({ pulsos: pulsos.slice(0, -1) })}>Quitar la última</Boton>}
            </div>
            <p className={estilos.chico}>Se usa el promedio. Si querés sumar otras mañanas, salí con la flecha: la evaluación queda guardada y la seguís después.</p>
          </Tarjeta>
        </>
      )}

      {id === 'medidas' && (
        <Tarjeta>
          <Stepper etiqueta="Altura" valor={datos.alturaCm ?? 170} min={120} max={220} paso={0.5} unidad="cm" onCambio={(v) => cambiar({ alturaCm: v })} />
          <Stepper etiqueta="Cintura" valor={datos.cinturaCm ?? 85} min={50} max={180} paso={0.5} unidad="cm" onCambio={(v) => cambiar({ cinturaCm: v })} />
          {datos.cinturaCm && datos.alturaCm && (
            <p className={estilos.chico}>
              Cintura / altura: {String((datos.cinturaCm / datos.alturaCm).toFixed(2)).replace('.', ',')}. Por debajo de 0,50 está en la zona saludable.
            </p>
          )}
        </Tarjeta>
      )}

      {id === 'actividad' && (
        <>
          <Tarjeta>
            <p className="etiqueta">¿Cuántas veces por semana?</p>
            <Opciones etiqueta="Frecuencia" opciones={normasVo2.indiceActividad.frecuencia} valor={act.frecuencia} onCambio={(v) => responder({ frecuencia: v })} />
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">¿Qué tan intenso?</p>
            <Opciones etiqueta="Intensidad" opciones={normasVo2.indiceActividad.intensidad} valor={act.intensidad} onCambio={(v) => responder({ intensidad: v })} />
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">¿Cuánto dura cada vez?</p>
            <Opciones etiqueta="Duración" opciones={normasVo2.indiceActividad.duracion} valor={act.duracion} onCambio={(v) => responder({ duracion: v })} />
          </Tarjeta>
        </>
      )}

      {id === 'rodilla' && (
        <Tarjeta>
          <Stepper etiqueta="Pierna izquierda" valor={datos.rodilla?.izq ?? 10} min={0} max={25} paso={0.5} unidad="cm" onCambio={(v) => cambiar({ rodilla: { izq: v, der: datos.rodilla?.der ?? 10 } })} />
          <Stepper etiqueta="Pierna derecha" valor={datos.rodilla?.der ?? 10} min={0} max={25} paso={0.5} unidad="cm" onCambio={(v) => cambiar({ rodilla: { izq: datos.rodilla?.izq ?? 10, der: v } })} />
        </Tarjeta>
      )}

      {id === 'equilibrio' && (
        <>
          <Tarjeta>
            <p className="etiqueta">Con ojos {ojos}</p>
            <p className={estilos.chico}>
              {ojosParaEquilibrio(edad) === 'cerrados'
                ? 'Para menores de 60 años la prueba que distingue niveles es con ojos cerrados. Probá primero con ojos abiertos para practicar.'
                : 'Para tu edad se usa con ojos abiertos.'}
            </p>
          </Tarjeta>
          <Cronometro
            maximoSeg={45}
            onResultado={(seg) => {
              const nuevos = [...intentos, seg].slice(-3)
              setIntentos(nuevos)
              cambiar({ equilibrio: { ojos, segundos: Math.max(...nuevos, datos.equilibrio?.segundos ?? 0) } })
            }}
          />
          {(intentos.length > 0 || datos.equilibrio) && (
            <div className={s.intentos}>
              {intentos.map((x, i) => (
                <span key={i} className={s.intento}>
                  Intento {i + 1}: {String(x).replace('.', ',')} s
                </span>
              ))}
              {datos.equilibrio && <span className={`${s.intento} ${s.mejor}`}>Mejor: {String(datos.equilibrio.segundos).replace('.', ',')} s</span>}
            </div>
          )}
        </>
      )}

      {id === 'sentarse' && (
        <>
          <CuentaRegresiva segundos={60} onFin={() => undefined} />
          <Tarjeta>
            <Stepper etiqueta="¿Cuántas hiciste?" valor={datos.sentarse ?? 0} min={0} max={100} unidad="repeticiones" onCambio={(v) => cambiar({ sentarse: v })} />
          </Tarjeta>
        </>
      )}

      {id === 'flexiones' && (
        <Tarjeta>
          {muneca && (
            <Aviso tipo="error">
              Marcaste la muñeca: hacelas apoyando los puños o agarrando dos mancuernas (muñeca recta). Si igual duele, salteá esta prueba.
            </Aviso>
          )}
          <p className="etiqueta">Cómo las hiciste</p>
          <Opciones<number>
            etiqueta="Variante"
            opciones={[
              { texto: 'Completas, manos en el piso', puntos: 0 },
              { texto: 'Completas, sobre puños o mancuernas', puntos: 1 },
              { texto: 'Con las rodillas apoyadas', puntos: 2 },
            ]}
            valor={datos.flexiones ? (['completa', 'punos', 'rodillas'] as VarianteFlexion[]).indexOf(datos.flexiones.variante) : undefined}
            onCambio={(v) => cambiar({ flexiones: { reps: datos.flexiones?.reps ?? 0, variante: (['completa', 'punos', 'rodillas'] as VarianteFlexion[])[v] } })}
          />
          <Stepper
            etiqueta="¿Cuántas hiciste?"
            valor={datos.flexiones?.reps ?? 0}
            min={0}
            max={150}
            unidad="repeticiones"
            onCambio={(v) => cambiar({ flexiones: { reps: v, variante: datos.flexiones?.variante ?? (sexo === 'h' ? 'completa' : 'rodillas') } })}
          />
          {datos.flexiones && sexo === 'h' && datos.flexiones.variante === 'rodillas' && (
            <p className={estilos.chico}>Las tablas de hombres son con flexión completa: se guarda para seguir tu progreso, pero no entra en el puntaje.</p>
          )}
        </Tarjeta>
      )}

      {id === 'plancha' && (
        <>
          <Cronometro onResultado={(seg) => cambiar({ plancha: seg })} />
          {datos.plancha !== undefined && (
            <p className={estilos.chico}>
              Aguantaste {String(datos.plancha).replace('.', ',')} s.
              {edad > 25 ? ' Para tu edad no hay tablas confiables: se guarda para ver tu progreso, pero no entra en el puntaje.' : ''}
            </p>
          )}
        </>
      )}

      {id === 'calidad' &&
        MOVIMIENTOS.map((m, i) => (
          <Tarjeta key={m.nombre}>
            <p style={{ margin: 0, fontWeight: 700 }}>{m.nombre}</p>
            <Opciones<number>
              etiqueta={m.nombre}
              opciones={m.niveles.map((t, n) => ({ texto: t, puntos: n })).reverse()}
              valor={calidad[i] ?? undefined}
              onCambio={(v) => cambiar({ calidad: calidad.map((x, j) => (j === i ? v : x)) })}
            />
          </Tarjeta>
        ))}

      {id === 'calidad' && calidad.some((x) => x === 0) && (
        <Aviso tipo="error">Si algún movimiento duele, no lo entrenes hasta consultarlo con un profesional.</Aviso>
      )}

      {aviso && <Aviso tipo="error">{aviso}</Aviso>}
      <Boton variante="principal" ancho onClick={() => void siguiente()}>
        {indice < pasos.length - 1 ? 'Siguiente' : 'Ver mis resultados'}
      </Boton>
      {id !== 'medidas' && id !== 'actividad' && (
        <button type="button" className={s.saltear} onClick={saltear}>
          Saltear esta prueba
        </button>
      )}
    </div>
  )
}
