import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { NOMBRES_DIAS } from '../../lib/perfil'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import type { EntradaPlan, PlanSemana } from '../../lib/plan/generador'
import { semanaSistema, sumarAlPlan } from '../../lib/plan/sistemaSemana'
import { armarEntrada, guardarPlan, leerPlan } from '../../lib/plan/usarPlan'
import { CuentaRegresiva } from '../../components/tiempo'
import { DibujoGuardia, DibujoPies, DibujoReparto, DibujoTecnica } from '../../content/dibujos-combate'
import { SISTEMA, tecnica } from '../../lib/combate'
import { guardarActividad, guardarSesionHecha } from '../../lib/diario'
import { Esfuerzo } from '../../components/Esfuerzo'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from './comun'

const TEMAS = [
  ['guardia', 'Guardia'],
  ['niveles', 'Niveles'],
  ['pies', 'Pies'],
  ['defensa', 'Defensa'],
  ['combos', 'Combos'],
  ['transiciones', 'Transiciones'],
  ['escenarios', 'Escenarios'],
  ['sesion', 'Sesión'],
  ['herramientas', 'Herramientas'],
  ['evidencia', 'Evidencia'],
] as const
type Tema = (typeof TEMAS)[number][0]

const DIST: Record<string, string> = { larga: 'Larga distancia (patadas)', media: 'Media distancia (manos y patadas)', corta: 'Corta distancia y clinch', defensa: 'Defensa + contra (la más importante)' }

function Mini({ id }: { id: string }) {
  return (
    <Link to={`/combate/tecnica/${id}`} className={s.item} style={{ flexShrink: 0, width: 132, minHeight: 0, padding: 6 }}>
      <DibujoTecnica id={id} />
      <span className={s.itemDetalle}>{tecnica(id)?.nombre}</span>
    </Link>
  )
}

/** Sistema completo: boxeo, kickboxing, muay thai, krav magá y BJJ con una sola guardia base. */
export function Sistema() {
  const [params, setParams] = useSearchParams()
  const tema = (params.get('tema') as Tema) || 'guardia'
  const [nivelCombo, setNivelCombo] = useState(0)
  const S = SISTEMA

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Sistema completo</h1>
        <p className={e.para}>Boxeo, kickboxing, muay thai, krav magá y BJJ con una sola guardia base.</p>
      </header>
      <div className={s.filtros} role="tablist" aria-label="Temas">
        {TEMAS.map(([v, t]) => (
          <button key={v} type="button" role="tab" aria-selected={tema === v} className={`${s.filtro} ${tema === v ? s.filtroOn : ''}`} onClick={() => setParams({ tema: v }, { replace: true })}>
            {t}
          </button>
        ))}
      </div>

      {tema === 'guardia' && (
        <>
          <Tarjeta destacada>
            <p className="etiqueta">Guardia base · 45 / 55</p>
            <DibujoGuardia />
            <p className={estilos.texto2}>{S.guardia.idea}</p>
            <ul className={s.seccion}>
              {S.guardia.puntos.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Tarjeta>
          <p className="etiqueta">Los 5 modos de peso</p>
          <p className={estilos.chico}>Pasar de uno a otro sin perder el equilibrio es el centro de toda la rutina.</p>
          {S.modos.map((m) => (
            <Tarjeta key={m.nombre}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {m.nombre} · {m.del}/{100 - m.del}
              </h2>
              <DibujoReparto del={m.del} altura={m.altura} etiqueta={`${m.nombre}: ${m.del} % adelante, ${100 - m.del} % atrás`} />
              <p className={estilos.texto2}>
                {m.para} <span className={estilos.chico}>({m.origen})</span>
              </p>
            </Tarjeta>
          ))}
          <Aviso tipo="ok">Regla de oro: {S.reglaDeOro}</Aviso>
        </>
      )}

      {tema === 'niveles' && (
        <>
          {S.niveles.map((n) => (
            <Tarjeta key={n.nivel}>
              <p className="etiqueta">
                Nivel {n.nivel} · {n.objetivo}
              </p>
              <h2 className={h.tituloTarjeta}>{n.nombre}</h2>
              <p className={estilos.texto2}>
                <b>Qué entrenar:</b> {n.que}
              </p>
              <p className={estilos.texto2}>
                <b>Para pasar:</b> {n.criterio}
              </p>
            </Tarjeta>
          ))}
          <p className={estilos.chico}>{S.nivelesNota}</p>
          <Link to="/combate/rondas/sombra?d=completo" className={h.botonPrincipal}>
            Hacer rounds del sistema completo
          </Link>
          <Link to="/combate/evaluar?d=completo" className={estilos.boton}>
            Evaluar mi nivel con un video
          </Link>
        </>
      )}

      {tema === 'pies' && (
        <>
          <p className={estilos.texto2}>Los pies se entrenan antes que los golpes: un golpe perfecto desde una mala base no sirve. Marcá en el piso una cruz o un cuadrado con cinta.</p>
          <p className="etiqueta">Niveles 1 y 2</p>
          {S.pies.basicos.map((d, i) => (
            <Tarjeta key={d.nombre}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {d.nombre} · {d.tiempo}
              </h2>
              {i === 3 ? <DibujoReparto del={55} altura="baja" etiqueta="Modo manos: 55 % adelante" /> : <DibujoPies nivel={[1, 2, 3, 1, 5][i]} />}
              <p className={estilos.texto2}>{d.como}</p>
            </Tarjeta>
          ))}
          <p className="etiqueta">Niveles 3 y 4</p>
          {S.pies.avanzados.map((d, i) => (
            <Tarjeta key={d.nombre}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{d.nombre}</h2>
              {i === 4 ? <DibujoTecnica id="cambio-nivel" /> : i === 5 ? <DibujoTecnica id="estallido" /> : i === 2 ? <DibujoTecnica id="switch-kick" /> : <DibujoPies nivel={[4, 6, 0, 4][i] || 4} />}
              <p className={estilos.texto2}>{d.como}</p>
            </Tarjeta>
          ))}
          <Tarjeta>
            <p className="etiqueta">Errores para vigilar</p>
            <ul className={s.seccion}>
              {S.pies.errores.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Tarjeta>
          <Link to="/combate/rondas/pies" className={estilos.boton}>
            Hacer rounds de pies
          </Link>
        </>
      )}

      {tema === 'defensa' && (
        <>
          <p className={estilos.texto2}>{S.defensas.idea}</p>
          <p className="etiqueta">De cabeza (boxeo)</p>
          {S.defensas.cabeza.map((d) => (
            <Tarjeta key={d.defensa}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {d.defensa} <span className={estilos.chico}>contra {d.contra.toLowerCase()}</span>
              </h2>
              <DibujoTecnica id={d.tecnica} />
              <p className={estilos.texto2}>
                <b>Peso:</b> {d.peso}. <b>Contra:</b> {d.respuesta}.
              </p>
            </Tarjeta>
          ))}
          <p className="etiqueta">De piernas (muay thai y kick)</p>
          {S.defensas.piernas.map((d) => (
            <Tarjeta key={d.defensa}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{d.defensa}</h2>
              <DibujoTecnica id={d.tecnica} />
              <p className={estilos.texto2}>{d.texto}</p>
            </Tarjeta>
          ))}
          <p className="etiqueta">Krav magá y clinch</p>
          {S.defensas.cuerpo.map((d) => (
            <Tarjeta key={d.defensa}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{d.defensa}</h2>
              <DibujoTecnica id={d.tecnica} />
              <p className={estilos.texto2}>{d.texto}</p>
            </Tarjeta>
          ))}
          <Aviso tipo="ok">{S.defensas.reactivo}</Aviso>
          <Link to="/combate/reaccion" className={h.botonPrincipal}>
            Hacer el drill de defensa
          </Link>
        </>
      )}

      {tema === 'combos' && (
        <>
          <p className={estilos.chico}>{S.notacion}</p>
          <div className={s.filtros} role="group" aria-label="Nivel">
            {[0, 1, 2, 3, 4].map((n) => (
              <button key={n} type="button" aria-pressed={nivelCombo === n} className={`${s.filtro} ${nivelCombo === n ? s.filtroOn : ''}`} onClick={() => setNivelCombo(n)}>
                {n === 0 ? 'Todos' : `Nivel ${n}`}
              </button>
            ))}
          </div>
          {Object.entries(DIST).map(([k, titulo]) => {
            const lista = S.combinaciones.filter((c) => c.distancia === k && (!nivelCombo || c.nivel === nivelCombo))
            if (!lista.length) return null
            const dibujo = { larga: 'patada-baja', media: 'directo', corta: 'rodilla', defensa: 'esquive' }[k]!
            return (
              <Tarjeta key={k}>
                <p className="etiqueta">{titulo}</p>
                <DibujoTecnica id={dibujo} />
                {lista.map((c) => (
                  <p key={c.combo} className={estilos.texto2}>
                    <b>{c.combo}</b> <span className={estilos.chico}>· nivel {c.nivel}</span>
                    <br />
                    <span className={estilos.chico}>{c.porque}</span>
                  </p>
                ))}
              </Tarjeta>
            )
          })}
          <Aviso tipo="ok">{S.comoCombos}</Aviso>
          <Link to="/combate/voz" className={estilos.boton}>
            Que me las cante el entrenador por voz
          </Link>
        </>
      )}

      {tema === 'transiciones' && (
        <>
          <p className={estilos.texto2}>La transición convierte cinco artes separadas en un solo sistema. Mirá cómo cambia el modo de peso en cada paso.</p>
          {S.transiciones.map((t) => (
            <Tarjeta key={t.nombre}>
              <h2 className={h.tituloTarjeta}>{t.nombre}</h2>
              <div className={s.filtros}>
                {t.tecnicas.map((id) => (
                  <Mini key={id} id={id} />
                ))}
              </div>
              <ol className={s.seccion}>
                {t.pasos.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </Tarjeta>
          ))}
          <Tarjeta destacada>
            <p className="etiqueta">Cadena completa (nivel 4)</p>
            <p className={estilos.texto2}>
              <b>{S.cadena.texto}</b>
            </p>
            <p className={estilos.chico}>{S.cadena.como}</p>
          </Tarjeta>
        </>
      )}

      {tema === 'escenarios' && (
        <>
          <p className="etiqueta">Contra tipos de rival</p>
          {S.rivales.map((r) => (
            <Tarjeta key={r.rival}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{r.rival}</h2>
              <p className={estilos.chico}>Problema: {r.problema}</p>
              <p className={estilos.texto2}>{r.plan}</p>
              <p className={estilos.chico}>Peso: {r.peso}</p>
            </Tarjeta>
          ))}
          <p className="etiqueta">En la calle (krav magá)</p>
          <Aviso tipo="error">{S.calle.idea}</Aviso>
          {S.calle.escenarios.map((c) =>
            'aviso' in c && c.aviso ? (
              <Aviso key={c.nombre} tipo="error">
                <b>{c.nombre}:</b> {c.texto}
              </Aviso>
            ) : (
              <Tarjeta key={c.nombre}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{c.nombre}</h2>
                <p className={estilos.texto2}>{c.texto}</p>
              </Tarjeta>
            ),
          )}
          <Tarjeta>
            <p className="etiqueta">Espacios chicos</p>
            <p className={estilos.texto2}>{S.calle.espacios}</p>
          </Tarjeta>
        </>
      )}

      {tema === 'sesion' && (
        <>
          <Tarjeta destacada>
            <p className="etiqueta">Sesión tipo · {S.sesion.reduce((a, b) => a + b.minutos, 0)} minutos</p>
            {S.sesion.map((b) => (
              <p key={b.bloque} className={estilos.texto2}>
                <b>
                  {b.bloque} · {b.minutos} min
                </b>
                <br />
                <span className={estilos.chico}>
                  {b.que} Foco: {b.foco.toLowerCase()}.
                </span>
              </p>
            ))}
            <Link to="/combate/sesion" className={h.botonPrincipal}>
              Empezar la sesión guiada
            </Link>
            <Link to="/combate/sesion?corta=1" className={estilos.boton}>
              Versión nivel 1 (30 a 40 min)
            </Link>
          </Tarjeta>
          <p className={estilos.chico}>{S.sesionNota}</p>
          <UsarSemana />
          <Tarjeta>
            <p className="etiqueta">Plan semanal (5 días)</p>
            {S.semana.map((d) => (
              <p key={d.dia} className={estilos.texto2}>
                <b>{d.dia}:</b> {d.tema}
                <br />
                <span className={estilos.chico}>+ {d.complemento}</span>
              </p>
            ))}
          </Tarjeta>
        </>
      )}

      {tema === 'herramientas' && (
        <>
          <Tarjeta>
            <p className="etiqueta">Herramientas</p>
            <ul className={s.seccion}>
              {S.herramientas.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">Checklist al ver tu video</p>
            {S.checklist.map((x) => (
              <label key={x} className={s.interruptor}>
                <input type="checkbox" />
                {x}
              </label>
            ))}
            <Link to="/combate/evaluar?d=completo" className={estilos.boton}>
              Grabarme y evaluar
            </Link>
          </Tarjeta>
          <Aviso tipo="error">{S.limites}</Aviso>
        </>
      )}

      {tema === 'evidencia' && (
        <>
          <p className={estilos.texto2}>Lo que dicen los estudios sobre cómo entrenar esto mejor, y cómo lo usa la app.</p>
          {S.evidencia.map((x) => (
            <Tarjeta key={x.titulo}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{x.titulo}</h2>
              <p className={estilos.texto2}>{x.texto}</p>
              <p className={estilos.chico}>Fuente: {x.fuente}</p>
            </Tarjeta>
          ))}
          <p className={estilos.chico}>{S.fuente}</p>
        </>
      )}
    </div>
  )
}

/** Lleva el plan de 5 días a los días y horarios de la persona: reemplaza su plan o se suma. */
function UsarSemana() {
  const navegar = useNavigate()
  const [entrada, setEntrada] = useState<EntradaPlan | null | undefined>(undefined)
  const [actual, setActual] = useState<PlanSemana | null>(null)
  const [preguntar, setPreguntar] = useState(false)
  useEffect(() => {
    void Promise.all([armarEntrada(), leerPlan()]).then(([e, p]) => {
      setEntrada(e)
      setActual(p ?? null)
    })
  }, [])
  if (entrada === undefined) return null
  if (!entrada) return <p className={estilos.chico}>Para llevarlo a tu semana, primero cargá tus días y horarios en Perfil.</p>
  const nuevo = semanaSistema(entrada)
  const dias = nuevo.dias.map((d, i) => ({ i, s: d.sesiones[0] })).filter((x) => x.s)

  async function guardar(como: 'reemplazar' | 'sumar') {
    const p = como === 'sumar' && actual ? sumarAlPlan(actual, nuevo) : nuevo
    await guardarPlan(p)
    await asegurarCiclo(p.creado)
    navegar('/plan')
  }

  return (
    <Tarjeta destacada>
      <p className="etiqueta">Llevarlo a tu semana</p>
      {dias.length === 0 ? (
        <p className={estilos.texto2}>No tenés días de entrenamiento cargados. Elegilos en Perfil → Horarios o en Plan → Armar paso a paso.</p>
      ) : (
        <>
          <p className={estilos.chico}>Con tus días y horarios queda así (60 % combate y el resto el complemento):</p>
          {dias.map(({ i, s }) => (
            <p key={i} className={estilos.texto2}>
              <b>{NOMBRES_DIAS[i]}</b> {s!.desde ? `· ${s!.desde}` : ''} · {s!.minutos} min
              <br />
              <span className={estilos.chico}>{s!.titulo.replace('Combate: ', '')}</span>
            </p>
          ))}
          {dias.length < 5 && <p className={estilos.chico}>Con menos de 5 días se priorizan integración, boxeo y muay thai/kick; después suelo y krav magá.</p>}
          <Boton variante="principal" ancho onClick={() => (actual ? setPreguntar(true) : void guardar('reemplazar'))}>
            Usar esta semana en mi plan
          </Boton>
        </>
      )}
      {preguntar && (
        <Dialogo titulo="¿Cómo lo sumo?" onCerrar={() => setPreguntar(false)}>
          <p className={estilos.texto2}>Ya tenés un plan. Podés reemplazarlo por esta semana o sumarla después de lo que ya tenés cada día.</p>
          <Boton variante="principal" onClick={() => void guardar('reemplazar')}>
            Reemplazar mi plan
          </Boton>
          <Boton onClick={() => void guardar('sumar')}>Sumarla a mi plan</Boton>
          <Boton onClick={() => setPreguntar(false)}>Cancelar</Boton>
        </Dialogo>
      )}
    </Tarjeta>
  )
}

/** Sesión guiada bloque por bloque, con cuenta regresiva. Al final la anota como actividad. */
export function SesionCompleta() {
  usarPantallaEncendida(true)
  const [params] = useSearchParams()
  const corta = params.get('corta') === '1'
  const bloques = corta ? SISTEMA.sesion.filter((b) => ['Calentamiento', 'Juego de pies', 'Sombra técnica', 'Suelo solo', 'Vuelta a la calma'].includes(b.bloque)) : SISTEMA.sesion
  const [i, setI] = useState(-1)
  const [fin, setFin] = useState(false)
  const [esfuerzoGuardado, setEsfuerzoGuardado] = useState(false)
  const total = bloques.reduce((a, b) => a + b.minutos, 0)
  const b = bloques[i]

  async function terminar() {
    // Compendium 2024: artes marciales a ritmo moderado (15430) 10,3 MET; se toma la mitad del tiempo a ese ritmo y la otra
    // mitad como práctica lenta (15425, 5,3 MET): decisión de diseño para una sesión que mezcla bloques suaves y fuertes.
    await guardarActividad({ fecha: fechaLocal(), nombre: 'Sesión del sistema completo', met: 7.8, minutos: total, actividad: 'combate', variante: 'moderada', origen: 'entrenar' })
    setFin(true)
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Sesión guiada · {total} min</p>
        <h1 className={e.titulo}>{i < 0 ? 'Sistema completo' : fin ? '¡Terminaste!' : b.bloque}</h1>
      </header>
      {i < 0 && (
        <>
          <ol className={s.seccion}>
            {bloques.map((x) => (
              <li key={x.bloque}>
                {x.bloque} · {x.minutos} min
              </li>
            ))}
          </ol>
          <DibujoGuardia />
          <Boton variante="principal" ancho onClick={() => setI(0)}>
            Empezar
          </Boton>
        </>
      )}
      {i >= 0 && !fin && b && (
        <>
          <p className={estilos.chico}>
            Bloque {i + 1} de {bloques.length} · foco: {b.foco.toLowerCase()}
          </p>
          <Tarjeta destacada>
            <p className={estilos.texto2}>{b.que}</p>
          </Tarjeta>
          <CuentaRegresiva
            key={i}
            segundos={b.minutos * 60}
            onFin={() => {
              if (i + 1 < bloques.length) setI(i + 1)
              else void terminar()
            }}
          />
          <Boton
            ancho
            onClick={() => {
              if (i + 1 < bloques.length) setI(i + 1)
              else void terminar()
            }}
          >
            {i + 1 < bloques.length ? `Saltar a: ${bloques[i + 1].bloque}` : 'Terminar'}
          </Boton>
        </>
      )}
      {fin && (
        <>
          <Aviso tipo="ok">¡Bien! {total} minutos anotados en tu actividad de hoy.</Aviso>
          {!esfuerzoGuardado && (
            <Tarjeta>
              <Esfuerzo
                valor={null}
                onCambio={async (n) => {
                  await guardarSesionHecha({ sesionId: 'combate-sistema', titulo: 'Sesión del sistema completo', version: corta ? 'reducida' : 'completa', minutos: total, esfuerzo: n, ejercicios: [] })
                  setEsfuerzoGuardado(true)
                }}
              />
            </Tarjeta>
          )}
          <Tarjeta>
            <p className="etiqueta">Antes de irte</p>
            <p className={estilos.texto2}>Anotá lo que falló y, si grabaste un round, miralo con el checklist.</p>
            <Link to="/combate/sistema?tema=herramientas" className={estilos.boton}>
              Ver el checklist
            </Link>
          </Tarjeta>
        </>
      )}
    </div>
  )
}
