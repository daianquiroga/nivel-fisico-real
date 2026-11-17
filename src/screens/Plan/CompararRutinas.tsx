import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { NOMBRES_DIAS } from '../../lib/perfil'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import { fuentesRutinas, semanaLadoALado, type FuenteRutina } from '../../lib/plan/fuentes'
import { leerRutinas } from '../../lib/plan/rutinas'
import { armarEntrada, guardarPlan, leerPlan } from '../../lib/plan/usarPlan'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import { Volver } from '../Combate/comun'
import { usarContextoAnalisis } from './Analisis'
import { Comparar } from './Plantillas'

const minutosSemana = (f: FuenteRutina) => f.plan.dias.reduce((a, d) => a + d.sesiones.filter((s) => !s.titulo.includes('opcional')).reduce((b, s) => b + s.minutos, 0), 0)

/** Elegir dos rutinas cualquiera (tu plan, guardadas, plantillas, sistema completo) y verlas una al lado de la otra. */
export function CompararRutinas() {
  const navegar = useNavigate()
  const ctx = usarContextoAnalisis()
  const [fuentes, setFuentes] = useState<FuenteRutina[] | null>(null)
  const [claves, setClaves] = useState<[string, string]>(['', ''])
  const [usar, setUsar] = useState<FuenteRutina | null>(null)

  useEffect(() => {
    void Promise.all([leerRutinas(), leerPlan(), armarEntrada()]).then(([rutinas, actual, entrada]) => {
      const f = fuentesRutinas({ actual, rutinas, entrada, plantillas: true })
      setFuentes(f)
      setClaves([f[0]?.clave ?? '', f[1]?.clave ?? ''])
    })
  }, [])

  const [a, b] = useMemo(() => claves.map((k) => fuentes?.find((f) => f.clave === k)) as [FuenteRutina | undefined, FuenteRutina | undefined], [claves, fuentes])
  const semana = useMemo(() => (a && b ? semanaLadoALado(a.plan, b.plan) : []), [a, b])

  if (!fuentes || !ctx) return null

  async function confirmarUso() {
    if (!usar) return
    const plan = structuredClone(usar.plan)
    await guardarPlan(plan)
    await asegurarCiclo(plan.creado)
    navegar('/plan')
  }

  const selector = (i: 0 | 1) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="etiqueta">Rutina {i === 0 ? 'A' : 'B'}</span>
      <select
        className={x.buscador}
        value={claves[i]}
        onChange={(ev) => setClaves(i === 0 ? [ev.target.value, claves[1]] : [claves[0], ev.target.value])}
      >
        {fuentes.map((f) => (
          <option key={f.clave} value={f.clave}>
            {f.nombre}
          </option>
        ))}
      </select>
      {(i === 0 ? a : b) && (
        <span className={estilos.chico}>
          {(i === 0 ? a : b)!.detalle.replace(/\.?$/, '.')} {minutosSemana((i === 0 ? a : b)!)} min por semana.
        </span>
      )}
    </label>
  )

  const columna = { minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 4 }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Plan</p>
        <h1 className={e.titulo}>Comparar dos rutinas</h1>
        <p className={e.para}>Elegí la A y la B y miralas una al lado de la otra: qué te aporta cada una y cómo cae tu semana.</p>
      </header>

      {fuentes.length < 2 ? (
        <Tarjeta>
          <p className={estilos.texto2}>Para comparar necesitás al menos dos rutinas. Cargá tus días o guardá una rutina con "Guardar para combinar con otra".</p>
          <Link to="/plan/asistente" className={x.filtro}>
            Cargar mis días
          </Link>
        </Tarjeta>
      ) : (
        <>
          {selector(0)}
          {selector(1)}

          {a && b && a.clave === b.clave && <p className={estilos.texto2}>Elegiste la misma rutina en A y en B: cambiá una para ver la diferencia.</p>}

          {a && b && a.clave !== b.clave && (
            <>
              <Comparar nombres={[`A · ${a.corto}`, `B · ${b.corto}`]} planes={[a.plan, b.plan]} ctx={ctx} />

              <p className="etiqueta" style={{ margin: '8px 0 0' }}>
                Tu semana con cada una
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1, padding: '4px 0' }}>
                {[a, b].map((f, i) => (
                  <p key={f.clave} className={estilos.chico} style={{ margin: 0, fontWeight: 700, overflowWrap: 'anywhere' }}>
                    {i === 0 ? 'A' : 'B'} · {f.corto}
                  </p>
                ))}
              </div>
              {semana.map((d) => (
                <section key={d.dia} aria-label={NOMBRES_DIAS[d.dia]} style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                  <p className="etiqueta" style={{ margin: '0 0 4px' }}>
                    {NOMBRES_DIAS[d.dia]}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
                    {[d.a, d.b].map((ses, i) => (
                      <div key={i} style={columna} aria-label={`Rutina ${i === 0 ? 'A' : 'B'}`}>
                        {ses.length === 0 ? (
                          <span className={estilos.chico}>Libre</span>
                        ) : (
                          ses.map((s, j) => (
                            <div key={j} className={x.item} style={{ minHeight: 0, padding: '6px 8px' }}>
                              <span className={x.itemNombre} style={{ fontSize: 14, overflowWrap: 'anywhere' }}>
                                {s.titulo}
                              </span>
                              <span className={x.itemDetalle}>
                                {s.desde ? `${s.desde} · ` : ''}
                                {s.minutos} min
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
                {[a, b].map((f, i) => (
                  <Boton key={f.clave} variante={f.clave === 'actual' ? undefined : 'principal'} disabled={f.clave === 'actual'} onClick={() => setUsar(f)}>
                    {f.clave === 'actual' ? `${i === 0 ? 'A' : 'B'} ya es tu plan` : `Usar ${i === 0 ? 'A' : 'B'}`}
                  </Boton>
                ))}
              </div>
              <p className={estilos.chico}>"Usar" deja esa rutina como tu plan. Después la podés cambiar ejercicio por ejercicio en Plan.</p>
            </>
          )}
        </>
      )}

      {usar && (
        <Dialogo titulo={`¿Usar "${usar.nombre}"?`} onCerrar={() => setUsar(null)}>
          <p className={estilos.texto2}>Tu plan actual se reemplaza por esta rutina. Tus registros de pesos y sesiones no se borran, y las rutinas guardadas siguen disponibles.</p>
          <Boton variante="principal" onClick={() => void confirmarUso()}>
            Sí, usarla
          </Boton>
          <Boton onClick={() => setUsar(null)}>Cancelar</Boton>
        </Dialogo>
      )}
    </div>
  )
}
