import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { NOMBRES_DIAS } from '../../lib/perfil'
import { analizarRutina, type Analisis } from '../../lib/plan/analisis'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import type { PlanSemana } from '../../lib/plan/generador'
import { NOMBRE_ORIGEN, borrarRutina, combinarPlanes, guardarRutina, leerRutinas, type RutinaGuardada } from '../../lib/plan/rutinas'
import { semanaSistema } from '../../lib/plan/sistemaSemana'
import { armarEntrada, guardarPlan, leerPlan } from '../../lib/plan/usarPlan'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from '../Combate/comun'
import { VistaAnalisis, usarContextoAnalisis } from './Analisis'

interface Fuente {
  clave: string
  nombre: string
  detalle: string
  plan: PlanSemana
  rutina?: RutinaGuardada
}

const minutosSemana = (p: PlanSemana) => p.dias.reduce((a, d) => a + d.sesiones.filter((s) => !s.titulo.includes('opcional')).reduce((b, s) => b + s.minutos, 0), 0)
const diasCon = (p: PlanSemana) => p.dias.filter((d) => d.sesiones.some((s) => !s.titulo.includes('opcional'))).length

/** Juntar 2 o 3 rutinas (fuerza, marcial, sistema completo, a mano…) en una semana y ver qué da. */
export function CombinarRutinas() {
  const navegar = useNavigate()
  const ctx = usarContextoAnalisis()
  const [fuentes, setFuentes] = useState<Fuente[] | null>(null)
  const [elegidas, setElegidas] = useState<string[]>([])
  const [confirmar, setConfirmar] = useState(false)
  const [guardada, setGuardada] = useState(false)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    void Promise.all([leerRutinas(), leerPlan(), armarEntrada()]).then(([rutinas, actual, entrada]) => {
      const f: Fuente[] = []
      if (actual) f.push({ clave: 'actual', nombre: 'Tu plan actual', detalle: 'El que usás hoy en Plan.', plan: actual })
      for (const r of [...rutinas].reverse()) f.push({ clave: r.id, nombre: r.nombre, detalle: `${NOMBRE_ORIGEN[r.origen]} · guardada el ${new Date(r.creado).toLocaleDateString('es-AR')}`, plan: r.plan, rutina: r })
      if (entrada) f.push({ clave: 'sistema', nombre: 'Sistema completo de combate', detalle: 'Boxeo, muay thai y kick, suelo, krav magá e integración, en tus días y horarios.', plan: semanaSistema(entrada) })
      setFuentes(f)
    })
  }, [recarga])

  const elegidosPlanes = useMemo(() => elegidas.map((k) => fuentes?.find((f) => f.clave === k)).filter((f): f is Fuente => Boolean(f)), [elegidas, fuentes])
  const combinacion = useMemo(() => (elegidosPlanes.length >= 2 ? combinarPlanes(elegidosPlanes.map((f) => f.plan)) : null), [elegidosPlanes])

  if (!fuentes || !ctx) return null
  const analisis: Analisis | null = combinacion ? analizarRutina(combinacion.plan, ctx) : null
  const solos = elegidosPlanes.map((f) => analizarRutina(f.plan, ctx))
  const largos = combinacion ? combinacion.minutosPorDia.map((m, d) => [d, m] as const).filter(([, m]) => m > 120) : []
  const sinDescanso = combinacion ? combinacion.plan.dias.every((d) => d.sesiones.length > 0) : false

  async function usar() {
    if (!combinacion) return
    await guardarPlan(combinacion.plan)
    await asegurarCiclo(combinacion.plan.creado)
    navegar('/plan')
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Plan</p>
        <h1 className={e.titulo}>Combinar rutinas</h1>
        <p className={e.para}>Elegí 2 o 3 y te muestro cómo queda tu semana completa y qué te aporta.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fuentes.map((f) => {
          const pos = elegidas.indexOf(f.clave)
          const on = pos >= 0
          return (
            <div key={f.clave} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
              <button
                type="button"
                aria-pressed={on}
                className={x.item}
                disabled={!on && elegidas.length >= 3}
                style={{ flex: 1, textAlign: 'left', cursor: 'pointer', borderColor: on ? 'var(--accent)' : undefined, background: on ? 'var(--accent-tint)' : undefined, opacity: !on && elegidas.length >= 3 ? 0.5 : 1 }}
                onClick={() => {
                  setGuardada(false)
                  setElegidas(on ? elegidas.filter((k) => k !== f.clave) : [...elegidas, f.clave])
                }}
              >
                <span className={x.itemNombre}>
                  {on ? `✓ ${pos + 1}. ` : '+ '}
                  {f.nombre}
                </span>
                <span className={x.itemDetalle}>
                  {f.detalle} {diasCon(f.plan)} días · {minutosSemana(f.plan)} min por semana.
                </span>
              </button>
              {f.rutina && (
                <button
                  type="button"
                  className={x.filtro}
                  aria-label={`Borrar ${f.nombre}`}
                  onClick={async () => {
                    await borrarRutina(f.rutina!.id)
                    setElegidas(elegidas.filter((k) => k !== f.clave))
                    setRecarga(recarga + 1)
                  }}
                >
                  Borrar
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Tarjeta>
        <p className="etiqueta">Armar otra para sumar</p>
        <div className={x.etiquetas} style={{ gap: 6 }}>
          <Link to="/plan/marcial" className={x.filtro}>
            Marcial
          </Link>
          <Link to="/plan/asistente" className={x.filtro}>
            Fuerza paso a paso
          </Link>
          <Link to="/plan/plantillas" className={x.filtro}>
            De gimnasio
          </Link>
          <Link to="/plan/armar" className={x.filtro}>
            A mano
          </Link>
        </div>
        <p className={estilos.chico}>Al final de cada una tocá "Guardar para combinar con otra" y vuelve a esta lista.</p>
      </Tarjeta>

      {elegidas.length < 2 && <p className={estilos.chico}>Elegí al menos 2 para ver el resultado.</p>}

      {combinacion && analisis && (
        <>
          <p className="etiqueta" style={{ margin: '8px 0 0' }}>
            Resultado
          </p>
          <VistaAnalisis a={analisis} compacto />
          <Tarjeta>
            <p className="etiqueta">Cada una sola y juntas</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left' }} />
                  <th>Físico</th>
                  <th>Estético</th>
                  <th>Marcial</th>
                  <th>Tus objetivos</th>
                </tr>
              </thead>
              <tbody>
                {[...elegidosPlanes.map((f, i) => [f.nombre, solos[i]] as const), ['Juntas', analisis] as const].map(([n, a]) => (
                  <tr key={n} style={{ fontWeight: n === 'Juntas' ? 700 : 400, color: n === 'Juntas' ? 'var(--done)' : undefined }}>
                    <td style={{ padding: '6px 4px' }}>{n}</td>
                    <td style={{ textAlign: 'center' }}>{a.puntajes.fisico}</td>
                    <td style={{ textAlign: 'center' }}>{a.puntajes.estetico}</td>
                    <td style={{ textAlign: 'center' }}>{a.puntajes.marcial}</td>
                    <td style={{ textAlign: 'center' }}>{a.puntajes.objetivos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={estilos.chico}>De 0 a 100. Con 65 o más en lo que te importa, la rutina es buena para vos (cortes de la app: decisión de diseño).</p>
          </Tarjeta>

          {(combinacion.movidos.length > 0 || largos.length > 0 || sinDescanso) && (
            <Tarjeta>
              <p className="etiqueta">Para tener en cuenta</p>
              <ul className={x.seccion} style={{ margin: 0 }}>
                {combinacion.movidos.map((m) => (
                  <li key={`${m.dia}-${m.titulo}`}>
                    {NOMBRES_DIAS[m.dia]}: "{m.titulo}" se pisaba; pasa de las {m.antes} a las {m.ahora}.
                  </li>
                ))}
                {largos.map(([d, m]) => (
                  <li key={d}>
                    {NOMBRES_DIAS[d]} queda largo ({m} minutos). Si terminás muy cansado, pasá algo a otro día desde Plan.
                  </li>
                ))}
                {sinDescanso && <li>No te queda ningún día libre. El descanso también entrena: dejá al menos uno.</li>}
              </ul>
              <p className={estilos.chico}>Cuando dos coinciden, va primero la técnica de combate y después la fuerza: la técnica se aprende mejor sin cansancio.</p>
            </Tarjeta>
          )}

          {combinacion.plan.dias.map((d, dia) => (
            <section key={dia} aria-label={NOMBRES_DIAS[dia]} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p className="etiqueta" style={{ margin: '6px 0 0' }}>
                {NOMBRES_DIAS[dia]}
                {d.sesiones.length === 0 ? ' · libre' : ` · ${combinacion.minutosPorDia[dia]} min`}
              </p>
              {d.sesiones.map((s) => (
                <div key={s.id} className={x.item} style={{ minHeight: 0 }}>
                  <span className={x.itemNombre} style={{ fontSize: 15 }}>
                    {s.desde ? `${s.desde} · ` : ''}
                    {s.titulo}
                  </span>
                  <span className={x.itemDetalle}>
                    {s.minutos} min{s.combate ? ' · guiada round por round' : ''}
                  </span>
                </div>
              ))}
            </section>
          ))}

          <button type="button" className={h.botonPrincipal} onClick={() => setConfirmar(true)}>
            Usar esta semana como mi plan
          </button>
          {guardada ? (
            <Aviso tipo="ok">Combinación guardada: aparece arriba en la lista.</Aviso>
          ) : (
            <Boton
              ancho
              onClick={async () => {
                await guardarRutina(elegidosPlanes.map((f) => f.nombre).join(' + '), 'combinada', combinacion.plan)
                setGuardada(true)
                setRecarga(recarga + 1)
              }}
            >
              Guardar la combinación para después
            </Boton>
          )}
        </>
      )}

      {confirmar && (
        <Dialogo titulo="¿Usar esta semana?" onCerrar={() => setConfirmar(false)}>
          <p className={estilos.texto2}>Tu plan actual se reemplaza por esta combinación. Tus registros de pesos y sesiones no se borran, y las rutinas guardadas siguen en esta lista.</p>
          <Boton variante="principal" onClick={() => void usar()}>
            Sí, usarla
          </Boton>
          <Boton onClick={() => setConfirmar(false)}>Cancelar</Boton>
        </Dialogo>
      )}
    </div>
  )
}
