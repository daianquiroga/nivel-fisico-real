import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { BarrasAporte } from '../../content/dibujos-rutina'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { ejercicio } from '../../lib/ejercicios'
import { NOMBRES_DIAS } from '../../lib/perfil'
import { GRUPOS, analizarRutina, type Analisis, type ContextoAnalisis } from '../../lib/plan/analisis'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import type { EntradaPlan, PlanSemana } from '../../lib/plan/generador'
import { FUENTE_PLANTILLAS, PLANTILLAS, diasDeEntrenamiento, semanaPlantilla } from '../../lib/plan/plantillas'
import { armarEntrada, guardarPlan, leerPlan } from '../../lib/plan/usarPlan'
import { guardarRutina } from '../../lib/plan/rutinas'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from '../Combate/comun'
import { usarContextoAnalisis } from './Analisis'

const series = (p: PlanSemana) => p.dias.reduce((a, d) => a + d.sesiones.reduce((b, x) => b + x.ejercicios.reduce((c, y) => c + y.series, 0), 0), 0)
const minutos = (p: PlanSemana) => p.dias.reduce((a, d) => a + d.sesiones.reduce((b, x) => b + x.minutos, 0), 0)

/** Dos rutinas lado a lado: aporte, días, minutos y series por músculo. */
export function Comparar({ nombres, planes, ctx }: { nombres: [string, string]; planes: [PlanSemana, PlanSemana]; ctx: ContextoAnalisis }) {
  const [a, b] = planes.map((p) => analizarRutina(p, ctx)) as [Analisis, Analisis]
  const fila = (texto: string, x: number | string, y: number | string, mejor?: 'mas' | 'menos') => {
    const nx = Number(x)
    const ny = Number(y)
    const gana = mejor && nx !== ny ? ((mejor === 'mas' ? nx > ny : nx < ny) ? 0 : 1) : -1
    return (
      <tr key={texto}>
        <td style={{ padding: '6px 4px' }}>{texto}</td>
        <td style={{ textAlign: 'center', fontWeight: gana === 0 ? 700 : 400, color: gana === 0 ? 'var(--done)' : undefined }}>{x}</td>
        <td style={{ textAlign: 'center', fontWeight: gana === 1 ? 700 : 400, color: gana === 1 ? 'var(--done)' : undefined }}>{y}</td>
      </tr>
    )
  }
  return (
    <Tarjeta>
      <p className="etiqueta">Comparación</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[a, b].map((x, i) => (
          <div key={i}>
            <p className={estilos.chico} style={{ fontWeight: 700 }}>
              {nombres[i]}
            </p>
            <BarrasAporte fisico={x.puntajes.fisico} estetico={x.puntajes.estetico} marcial={x.puntajes.marcial} />
          </div>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)' }}>
            <th />
            <th style={{ textAlign: 'center' }}>{nombres[0]}</th>
            <th style={{ textAlign: 'center' }}>{nombres[1]}</th>
          </tr>
        </thead>
        <tbody>
          {fila('Para tus objetivos', a.puntajes.objetivos, b.puntajes.objetivos, 'mas')}
          {fila('Días de fuerza', a.diasFuerza, b.diasFuerza)}
          {fila('Minutos por semana', minutos(planes[0]), minutos(planes[1]))}
          {fila('Series por semana', series(planes[0]), series(planes[1]))}
          {fila('Cardio (min)', Math.round(a.cardioEquivalente), Math.round(b.cardioEquivalente))}
          {GRUPOS.map((g) => fila(`Series de ${g.texto.toLowerCase()}`, Math.round(a.series[g.id] ?? 0), Math.round(b.series[g.id] ?? 0)))}
        </tbody>
      </table>
      <p className={estilos.chico}>En verde, la que da más para tus objetivos. Para crecer, cada músculo suele necesitar 10 o más series por semana (Schoenfeld 2017).</p>
      <p className={estilos.texto2}>
        <b>{nombres[0]}:</b> {a.veredicto.texto}
        <br />
        <b>{nombres[1]}:</b> {b.veredicto.texto}
      </p>
    </Tarjeta>
  )
}

/** Plantillas de gimnasio listas, comparadas con tu plan actual (o entre ellas) antes de usarlas. */
export function Plantillas() {
  const navegar = useNavigate()
  const ctx = usarContextoAnalisis()
  const [entrada, setEntrada] = useState<EntradaPlan | null | undefined>(undefined)
  const [actual, setActual] = useState<PlanSemana | null>(null)
  const [elegida, setElegida] = useState<string | null>(null)
  const [contra, setContra] = useState<string>('actual')
  const [confirmar, setConfirmar] = useState(false)

  useEffect(() => {
    void Promise.all([armarEntrada(), leerPlan()]).then(([en, p]) => {
      setEntrada(en)
      setActual(p ?? null)
    })
  }, [])

  const planes = useMemo(() => (entrada ? Object.fromEntries(PLANTILLAS.map((p) => [p.id, semanaPlantilla(p, entrada)])) : {}), [entrada])
  if (entrada === undefined || !ctx) return null
  if (!entrada) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>Primero, tus días</h1>
        <p className={e.para}>Para armar una plantilla necesito saber qué días y dónde entrenás.</p>
        <Boton variante="principal" ancho onClick={() => navegar('/plan/asistente')}>
          Cargar mis días
        </Boton>
      </div>
    )
  }
  const dias = diasDeEntrenamiento(entrada).length
  const p = PLANTILLAS.find((x) => x.id === elegida)
  const plan = p ? planes[p.id] : null
  const otro = contra === 'actual' ? actual : planes[contra]
  const nombreOtro = contra === 'actual' ? 'Tu plan' : (PLANTILLAS.find((x) => x.id === contra)?.nombre.split(' · ')[0] ?? '')

  async function usar() {
    if (!plan) return
    await guardarPlan(plan)
    await asegurarCiclo(plan.creado)
    navegar('/plan')
  }

  if (p && plan) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <header>
          <p className="etiqueta">Plantilla</p>
          <h1 className={e.titulo}>{p.nombre}</h1>
          <p className={e.para}>{p.para}</p>
        </header>
        {dias < p.diasMin && <p className={estilos.texto2}>Tenés {dias} días de entrenamiento y esta plantilla pide al menos {p.diasMin}. Sumá días en Perfil → Horarios o elegí otra.</p>}
        {plan.dias.map((d, i) =>
          d.sesiones.map((x) => (
            <Tarjeta key={x.id}>
              <p className="etiqueta">
                {NOMBRES_DIAS[i]} {x.desde ? `· ${x.desde}` : ''} · {x.minutos} min
              </p>
              <h2 style={{ margin: 0, fontSize: 18 }}>{x.titulo}</h2>
              {x.ejercicios.map((ep) => (
                <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                  <span style={{ width: 80, flexShrink: 0 }} aria-hidden="true">
                    <DibujoEjercicio id={ep.id} />
                  </span>
                  <span className={estilos.texto2}>
                    {ejercicio(ep.id)?.nombre}
                    <br />
                    <span className={estilos.chico}>
                      {ep.series} series de {ep.rango[0]} a {ep.rango[1]}
                    </span>
                  </span>
                </div>
              ))}
            </Tarjeta>
          )),
        )}
        <p className="etiqueta">Comparar con</p>
        <div className={s.filtros} role="radiogroup" aria-label="Comparar con">
          {[{ id: 'actual', nombre: 'Mi plan actual' }, ...PLANTILLAS.filter((x) => x.id !== p.id)].map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={contra === x.id} className={`${s.filtro} ${contra === x.id ? s.filtroOn : ''}`} onClick={() => setContra(x.id)}>
              {x.nombre.split(' · ')[0]}
            </button>
          ))}
        </div>
        {otro ? (
          <Comparar nombres={[p.nombre.split(' · ')[0], nombreOtro]} planes={[plan, otro]} ctx={ctx} />
        ) : (
          <p className={estilos.chico}>Todavía no tenés un plan para comparar.</p>
        )}
        <button type="button" className={h.botonPrincipal} onClick={() => (actual ? setConfirmar(true) : void usar())}>
          Usar esta plantilla
        </button>
        <Boton
          ancho
          onClick={async () => {
            await guardarRutina(p.nombre.split(' · ')[0], 'plantilla', plan)
            navegar('/plan/combinar')
          }}
        >
          Guardar para combinar con otra
        </Boton>
        <p className={estilos.chico}>Después la podés cambiar ejercicio por ejercicio en Plan (con barra, mancuernas o banda).</p>
        {confirmar && (
          <Dialogo titulo="¿Reemplazar tu plan?" onCerrar={() => setConfirmar(false)}>
            <p className={estilos.texto2}>Tu plan actual se reemplaza por esta plantilla. Tus registros de pesos y sesiones no se borran.</p>
            <Boton variante="principal" onClick={() => void usar()}>
              Sí, usar la plantilla
            </Boton>
            <Boton onClick={() => setConfirmar(false)}>Cancelar</Boton>
          </Dialogo>
        )}
      </div>
    )
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Rutinas de gimnasio listas</h1>
        <p className={e.para}>Elegí una, mirala con tus ejercicios y compárala con tu plan antes de usarla. Tenés {dias} días de entrenamiento.</p>
      </header>
      <div className={s.lista}>
        {PLANTILLAS.map((x) => (
          <button key={x.id} type="button" className={s.item} style={{ textAlign: 'left', cursor: 'pointer', opacity: dias < x.diasMin ? 0.6 : 1 }} onClick={() => setElegida(x.id)}>
            <span className={s.itemNombre}>{x.nombre}</span>
            <span className={s.itemDetalle}>{x.para}</span>
            <span className={s.itemDetalle}>
              {dias < x.diasMin ? `Pide al menos ${x.diasMin} días.` : `Para tus objetivos: ${analizarRutina(planes[x.id], ctx).puntajes.objetivos} de 100.`}
            </span>
          </button>
        ))}
      </div>
      <details className={s.detalle}>
        <summary>¿De dónde salen?</summary>
        <p>{FUENTE_PLANTILLAS.texto}</p>
        {FUENTE_PLANTILLAS.enlaces.map((x) => (
          <p key={x.enlace}>
            <a href={x.enlace} target="_blank" rel="noreferrer">
              {x.texto}
            </a>
          </p>
        ))}
      </details>
    </div>
  )
}
