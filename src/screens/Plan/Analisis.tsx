import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tarjeta, estilos } from '../../components/ui'
import { BarrasAporte, MapaMusculos } from '../../content/dibujos-rutina'
import volumen from '../../content/normas/volumen.json'
import { ejercicio, equipoDisponible } from '../../lib/ejercicios'
import { GRUPOS, analizarRutina, type Analisis, type ContextoAnalisis } from '../../lib/plan/analisis'
import type { PlanSemana } from '../../lib/plan/generador'
import { leerPlan } from '../../lib/plan/usarPlan'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from '../Combate/comun'

const nivel = (n: number) => (n <= 0 ? 'nada' : n < volumen.bajo ? 'poco' : n < volumen.bueno ? 'moderado' : 'bien')
const coma = (n: number) => String(n).replace('.', ',')

/** Contexto del análisis desde el perfil: objetivos, zonas, limitaciones y equipo de todos los lugares. */
export function usarContextoAnalisis(): ContextoAnalisis | null {
  const { cargado, perfil, lugares } = usarInicio()
  if (!cargado) return null
  return {
    objetivos: perfil?.objetivos ?? { estetica: 34, condicion: 33, combate: 33 },
    zonas: perfil?.zonas ?? [],
    limitaciones: perfil?.limitaciones ?? [],
    equipo: equipoDisponible(lugares),
  }
}

/** Todo el análisis de una rutina. `onAgregar`: si viene, las sugerencias se pueden sumar con un toque. `compacto`: solo aporte y lo que falta. */
export function VistaAnalisis({ a, onAgregar, compacto }: { a: Analisis; onAgregar?: (id: string) => void; compacto?: boolean }) {
  const { puntajes: p } = a
  return (
    <>
      <Tarjeta destacada>
        <p className="etiqueta">Qué aporta tu rutina</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 className={h.tituloTarjeta} style={{ fontSize: 48 }}>
            {p.objetivos}
          </h2>
          <span className={estilos.chico}>de 100 para tus objetivos</span>
        </div>
        <BarrasAporte fisico={p.fisico} estetico={p.estetico} marcial={p.marcial} />
        <p className={estilos.texto2} style={{ fontWeight: 600, color: a.veredicto.buena ? 'var(--done)' : 'var(--text)' }}>
          {a.veredicto.buena ? '✓ ' : ''}
          {a.veredicto.texto}
        </p>
        <details className={x.detalle}>
          <summary>¿Cuándo una rutina es buena?</summary>
          <ul className={x.seccion}>
            <li>
              <b>El número grande</b> mezcla las tres áreas según tus objetivos. Con <b>65 o más</b> es una buena rutina para vos; con 85 o más, muy completa.
            </li>
            <li>
              <b>Cada barra</b> va de 0 a 100. Las rayitas marcan 40 (base) y 65 (buena). Menos de 40: le falta bastante.
            </li>
            <li>
              No hace falta tener 100 en todo. Las áreas que <b>no</b> elegiste como objetivo pueden dar bajo y está bien. Las que sí elegiste conviene que pasen la rayita de 40.
            </li>
          </ul>
          <p className={estilos.chico}>Los cortes 40, 65 y 85 son una decisión de la app para orientarte, no un estándar publicado.</p>
        </details>
        <details className={x.detalle}>
          <summary>¿Cómo se calcula?</summary>
          <ul className={x.seccion}>
            <li>
              <b>Físico:</b> cardio contra los 150 minutos de la OMS (35 %), fuerza 2 días o más con los 5 movimientos base (35 %), movilidad (15 %) y al menos un día suave (15 %).
            </li>
            <li>
              <b>Estético:</b> series por semana de cada músculo contra 10 o más (70 %, las zonas que elegiste pesan el doble), cardio (15 %) y días de fuerza (15 %).
            </li>
            <li>
              <b>Marcial:</b> minutos de técnica de combate contra 2 horas (40 %), trabajo por intervalos como soga o sombra (20 %), fuerza de piernas, cadera, empuje y tracción (20 %), tronco (10
              %) y movilidad (10 %).
            </li>
          </ul>
          <p className={estilos.chico}>
            Los pesos son una decisión de la app para comparar rutinas. Las metas salen de la OMS 2020 (cardio y fuerza) y de Schoenfeld y otros 2017 (series por músculo).
          </p>
        </details>
      </Tarjeta>

      <Tarjeta>
        <p className="etiqueta">Qué te falta sumar</p>
        {a.faltas.length === 0 ? (
          <p className={estilos.texto2}>Nada importante: la rutina cubre todo lo básico. Ahora lo que suma es la constancia y subir de a poco.</p>
        ) : (
          <ol className={x.seccion}>
            {a.faltas.slice(0, compacto ? 4 : 8).map((f) => (
              <li key={f.texto}>
                {f.texto}
                {f.sugerencias.length > 0 && (
                  <div className={x.etiquetas} style={{ marginTop: 6 }}>
                    {f.sugerencias.map((id) =>
                      onAgregar ? (
                        <button key={id} type="button" className={x.filtro} onClick={() => onAgregar(id)} aria-label={`Sumar ${ejercicio(id)?.nombre}`}>
                          + {ejercicio(id)?.nombre}
                        </button>
                      ) : (
                        <Link key={id} to={`/ejercicio/${id}`} className={x.tag}>
                          {ejercicio(id)?.nombre}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>

      {!compacto && (
        <>
          <Tarjeta>
            <p className="etiqueta">Qué trabaja (series por semana)</p>
            <MapaMusculos series={a.series} />
            <ul className={x.seccion}>
              {GRUPOS.map((g) => (
                <li key={g.id}>
                  {g.texto}: <b>{coma(a.series[g.id])}</b> · {nivel(a.series[g.id])}
                </li>
              ))}
            </ul>
            <p className={estilos.chico}>
              Cada serie cuenta 1 para el músculo principal y 0,5 para los que ayudan. Para que un músculo crezca: {volumen.bajo} a {volumen.bueno - 1} series es moderado y {volumen.bueno} o
              más es mejor (Schoenfeld y otros 2017).
            </p>
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">Cómo trabaja</p>
            <ul className={x.seccion}>
              <li>
                Fuerza: {a.diasFuerza} {a.diasFuerza === 1 ? 'día' : 'días'} por semana.
              </li>
              <li>
                Cardio: {a.minutosCardio} minutos ({Math.round(a.cardioEquivalente)} moderados equivalentes; la OMS pide 150 a 300).
              </li>
              <li>Técnica de combate: {a.minutosTecnica} minutos.</li>
              <li>
                Movilidad: {a.diasMovilidad} {a.diasMovilidad === 1 ? 'día' : 'días'}. Días suaves o de descanso: {a.diasDescanso}.
              </li>
            </ul>
            {a.sesiones.map((s) => (
              <p key={`${s.dia}-${s.titulo}`} className={estilos.texto2}>
                <b>{s.dia}</b> · {s.titulo} · {s.minutos} min{s.series ? ` · ${coma(s.series)} series` : ''}
                {s.trabaja.length ? ` · ${s.trabaja.join(', ')}` : ''}
              </p>
            ))}
          </Tarjeta>
        </>
      )}
    </>
  )
}

/** Pantalla con el análisis del plan guardado. */
export function AnalisisPlan() {
  const ctx = usarContextoAnalisis()
  const [plan, setPlan] = useState<PlanSemana | null | undefined>(undefined)
  useEffect(() => {
    void leerPlan().then(setPlan)
  }, [])
  if (!ctx || plan === undefined) return null
  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Análisis de tu rutina</h1>
        <p className={e.para}>Qué aporta a lo físico, lo estético y lo marcial, qué músculos trabaja, cómo, y qué le falta sumar.</p>
      </header>
      {plan ? (
        <VistaAnalisis a={analizarRutina(plan, ctx)} />
      ) : (
        <p className={estilos.texto2}>Todavía no tenés plan. Armalo en Plan o cargá tu propia rutina.</p>
      )}
      <Link to="/plan/armar" className={h.botonPrincipal}>
        Armar o cargar mi rutina
      </Link>
    </div>
  )
}
