import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Segmentado } from '../../components/controles'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { EJERCICIOS, NOMBRES_EQUIPO, PATRONES, ejercicio, equipoDeLugar, evitarPorLimitacion, implemento, sePuedeHacer, variantesDe } from '../../lib/ejercicios'
import { Implementos } from '../../components/Implementos'
import { NOMBRES_DIAS } from '../../lib/perfil'
import { analizarRutina } from '../../lib/plan/analisis'
import { asegurarCiclo } from '../../lib/plan/ciclo'
import { armarPlanPropio, leerTexto, seleccionDesdePlan, type DiaRutina, type LecturaTexto } from '../../lib/plan/rutinaPropia'
import { guardarPlan, leerPlan } from '../../lib/plan/usarPlan'
import { usarInicio } from '../../lib/usarInicio'
import { normalizar } from '../../lib/aprender'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import { Volver } from '../Combate/comun'
import { VistaAnalisis, usarContextoAnalisis } from './Analisis'

const CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const FILTROS = [...PATRONES.map((p) => ({ valor: p.valor, texto: p.texto, incluye: p.incluye as string[] })), { valor: 'combate', texto: 'Combate', incluye: [] as string[] }]

const EJEMPLO = `Lunes 19:30
Press banca 4x10
Sentadilla 3x8-12
Remo con barra 3x10
Miércoles 7:00
Caminata 30 min
Viernes: dominadas 3x6, peso muerto 3x5`

export function ArmarRutina() {
  const navegar = useNavigate()
  const ctx = usarContextoAnalisis()
  const { lugares, perfil } = usarInicio()
  const [modo, setModo] = useState<'tildar' | 'texto'>('tildar')
  const [sel, setSel] = useState<DiaRutina[] | null>(null)
  const [dia, setDia] = useState(0)
  const [turno, setTurno] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [lectura, setLectura] = useState<LecturaTexto | null>(null)
  const [elegidos, setElegidos] = useState<Record<number, string>>({})
  const [confirmar, setConfirmar] = useState(false)
  const [tenePlan, setTenePlan] = useState(false)
  const [vaciar, setVaciar] = useState(false)

  useEffect(() => {
    void leerPlan().then((p) => {
      setTenePlan(Boolean(p))
      setSel(p ? seleccionDesdePlan(p) : [])
    })
  }, [])

  const plan = useMemo(() => armarPlanPropio(sel ?? []), [sel])
  const analisis = useMemo(() => (ctx ? analizarRutina(plan, ctx) : null), [plan, ctx])
  if (!sel || !ctx || !analisis) return null

  const mismo = (d: DiaRutina) => d.dia === dia && (d.turno ?? 0) === turno
  const turnosDia = Math.max(1, ...sel.filter((d) => d.dia === dia).map((d) => (d.turno ?? 0) + 1))
  const delDia = sel.find(mismo) ?? { dia, turno, items: [] }
  const lugar = lugares.find((l) => l.nombre === delDia.lugar)
  const equipo = lugar ? equipoDeLugar(lugar) : null
  const limitaciones = perfil?.limitaciones ?? []

  const cambiarDia = (c: Partial<DiaRutina>) =>
    setSel((s) => {
      const lista = (s ?? []).filter((d) => !mismo(d))
      return [...lista, { ...delDia, ...c }].sort((a, b) => a.dia - b.dia || (a.turno ?? 0) - (b.turno ?? 0))
    })
  // Las variantes de un mismo ejercicio (barra, mancuernas, banda) cuentan como uno: se elige con qué abajo.
  const familia = (id: string) => new Set(variantesDe(id).map((v) => v.id))
  const tiene = (id: string) => delDia.items.some((i) => familia(id).has(i.id))
  const alternar = (id: string) => cambiarDia({ items: tiene(id) ? delDia.items.filter((i) => !familia(id).has(i.id)) : [...delDia.items, { id }] })
  const cambiarImplemento = (viejo: string, nuevo: string) => cambiarDia({ items: delDia.items.map((i) => (i.id === viejo ? { ...i, id: nuevo, rango: undefined } : i)) })
  const series = (id: string, delta: number) =>
    cambiarDia({
      items: delDia.items.map((i) => {
        if (i.id !== id) return i
        const ej = ejercicio(id)!
        if (ej.tipo === 'minutos') {
          const m = Math.max(5, (i.rango?.[0] ?? ej.rango[0]) + delta * 5)
          return { ...i, rango: [m, m] as [number, number] }
        }
        return { ...i, series: Math.max(1, Math.min(8, (i.series ?? 3) + delta)) }
      }),
    })

  const representante = (ej: (typeof EJERCICIOS)[number]) => {
    const vs = variantesDe(ej.id)
    return (equipo ? vs.find((v) => sePuedeHacer(v, equipo)) : undefined) ?? vs[0]
  }
  const lista = EJERCICIOS.filter((ej) => {
    if (ej.familia && representante(ej).id !== ej.id) return false
    if (filtro === 'combate') {
      if (!ej.combate) return false
    } else if (filtro && !FILTROS.find((f) => f.valor === filtro)?.incluye.includes(ej.patron)) return false
    if (busqueda && !normalizar([ej.nombre, ...ej.principal].join(' ')).includes(normalizar(busqueda))) return false
    return true
  })

  async function guardar() {
    const nuevo = armarPlanPropio(sel ?? [])
    await guardarPlan(nuevo)
    await asegurarCiclo(nuevo.creado)
    navegar('/plan')
  }

  function usarLectura() {
    if (!lectura) return
    const dias = lectura.dias.map((d) => ({ ...d, items: [...d.items] }))
    lectura.noReconocidas.forEach((n, i) => {
      const id = elegidos[i]
      if (!id) return
      let d = dias.find((x) => x.dia === n.dia && !x.turno)
      if (!d) {
        d = { dia: n.dia, items: [] }
        dias.push(d)
      }
      d.items.push({ id })
    })
    setSel(dias.sort((a, b) => a.dia - b.dia))
    setLectura(null)
    setModo('tildar')
    setDia(dias[0]?.dia ?? 0)
    setTurno(0)
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Mi rutina</h1>
        <p className={e.para}>Armala tildando ejercicios día por día, o pegá la que ya tenés. Abajo ves en vivo qué aporta y qué le falta.</p>
      </header>
      <button type="button" className={x.item} style={{ textAlign: 'left', cursor: 'pointer', borderColor: 'var(--accent)' }} onClick={() => navegar('/plan/asistente')}>
        <span className={x.itemNombre}>¿Preferís que te la arme yo? Paso a paso</span>
        <span className={x.itemDetalle}>4 preguntas simples (días, horario, objetivo) y te propongo una rutina para ajustar. Recomendado si recién empezás.</span>
      </button>
      <Segmentado
        etiqueta="Cómo cargarla"
        valor={modo}
        opciones={[
          { valor: 'tildar', texto: 'Tildar' },
          { valor: 'texto', texto: 'Pegar texto' },
        ]}
        onCambio={(v) => setModo(v as 'tildar' | 'texto')}
      />

      {sel.some((d) => d.items.length > 0) && (
        <Boton ancho onClick={() => setVaciar(true)}>
          Empezar de cero
        </Boton>
      )}
      {vaciar && (
        <Dialogo titulo="¿Empezar de cero?" onCerrar={() => setVaciar(false)}>
          <p className={estilos.texto2}>Se vacían todos los días de esta pantalla para que armes la rutina desde cero. Tu plan guardado no cambia hasta que toques "Guardar como mi plan".</p>
          <Boton
            variante="principal"
            onClick={() => {
              setSel([])
              setDia(0)
              setTurno(0)
              setLectura(null)
              setVaciar(false)
            }}
          >
            Sí, vaciar
          </Boton>
          <Boton onClick={() => setVaciar(false)}>Cancelar</Boton>
        </Dialogo>
      )}

      {modo === 'texto' ? (
        <>
          <label htmlFor="rutina-texto" className="etiqueta">
            Pegá tu rutina
          </label>
          <textarea id="rutina-texto" className={estilos.areaTexto} style={{ minHeight: 200 }} value={texto} placeholder={EJEMPLO} onChange={(ev) => setTexto(ev.target.value)} />
          <p className={estilos.chico}>Un día por renglón ("Lunes 19:30" o "Día 1") y debajo los ejercicios ("Press banca 4x10", "Caminata 30 min"). También vale todo en una línea separado por comas.</p>
          <Boton variante="principal" ancho disabled={!texto.trim()} onClick={() => setLectura(leerTexto(texto))}>
            Leer mi rutina
          </Boton>
          {lectura && (
            <Tarjeta>
              <p className="etiqueta">Lo que entendí</p>
              {lectura.dias.length === 0 && <p className={estilos.texto2}>No reconocí ningún ejercicio. Probá escribirlos como en el ejemplo.</p>}
              {lectura.dias.map((d) => (
                <p key={d.dia} className={estilos.texto2}>
                  <b>{NOMBRES_DIAS[d.dia]}</b>
                  {d.desde ? ` ${d.desde}` : ''}: {d.items.map((i) => `${ejercicio(i.id)?.nombre}${i.series ? ` ${i.series}×${i.rango?.[0]}${i.rango && i.rango[1] !== i.rango[0] ? `-${i.rango[1]}` : ''}` : i.rango ? ` ${i.rango[0]} min` : ''}`).join(' · ')}
                </p>
              ))}
              {lectura.noReconocidas.length > 0 && (
                <>
                  <p className="etiqueta">No los reconocí: elegí el más parecido (mismo músculo) o dejalo afuera</p>
                  {lectura.noReconocidas.map((n, i) => (
                    <label key={`${n.texto}-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={estilos.texto2}>
                        {NOMBRES_DIAS[n.dia]}: "{n.texto}"
                      </span>
                      <select className={x.buscador} value={elegidos[i] ?? ''} onChange={(ev) => setElegidos({ ...elegidos, [i]: ev.target.value })}>
                        <option value="">Dejarlo afuera</option>
                        {EJERCICIOS.map((ej) => (
                          <option key={ej.id} value={ej.id}>
                            {ej.nombre} ({ej.principal.join(', ')})
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </>
              )}
              {lectura.dias.length + Object.values(elegidos).filter(Boolean).length > 0 && (
                <Boton variante="principal" onClick={usarLectura}>
                  Usar esta rutina y revisarla
                </Boton>
              )}
            </Tarjeta>
          )}
        </>
      ) : (
        <>
          <div className={x.filtros} role="tablist" aria-label="Día">
            {CORTO.map((t, i) => {
              const n = sel.filter((d) => d.dia === i).reduce((a, d) => a + d.items.length, 0)
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={dia === i}
                  className={`${x.filtro} ${dia === i ? x.filtroOn : ''}`}
                  onClick={() => {
                    setDia(i)
                    setTurno(0)
                  }}
                >
                  {t}
                  {n ? ` · ${n}` : ''}
                </button>
              )
            })}
          </div>

          <div className={x.filtros} role="tablist" aria-label="Entrenamiento del día">
            {Array.from({ length: turnosDia }, (_, k) => (
              <button key={k} type="button" role="tab" aria-selected={turno === k} className={`${x.filtro} ${turno === k ? x.filtroOn : ''}`} onClick={() => setTurno(k)}>
                {k + 1}º entrenamiento
              </button>
            ))}
            {turnosDia < 3 && (
              <button
                type="button"
                className={x.filtro}
                onClick={() => {
                  const k = turnosDia
                  setSel((s) => [...(s ?? []), { dia, turno: k, items: [] }])
                  setTurno(k)
                }}
              >
                + Sumar otro
              </button>
            )}
          </div>

          <Tarjeta>
            <p className="etiqueta">
              {NOMBRES_DIAS[dia]}
              {turnosDia > 1 ? ` · ${turno + 1}º entrenamiento` : ''}
            </p>
            <div className={estilos.fila}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <span className={estilos.chico}>Hora de inicio</span>
                <input className={x.buscador} type="time" value={delDia.desde ?? ''} onChange={(ev) => cambiarDia({ desde: ev.target.value || undefined })} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <span className={estilos.chico}>Dónde</span>
                <select className={x.buscador} value={delDia.lugar ?? ''} onChange={(ev) => cambiarDia({ lugar: ev.target.value || undefined })}>
                  <option value="">Sin elegir</option>
                  {lugares.map((l) => (
                    <option key={l.nombre} value={l.nombre}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {delDia.items.length === 0 ? (
              <p className={estilos.chico}>{turno > 0 ? 'Tildá ejercicios abajo para este entrenamiento (por ejemplo, cardio a la mañana y fuerza a la tarde).' : 'Día libre. Tildá ejercicios abajo para sumarlos.'}</p>
            ) : (
              delDia.items.map((i) => {
                const ej = ejercicio(i.id)!
                const minutos = ej.tipo === 'minutos'
                return (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={estilos.texto2} style={{ flex: 1, minWidth: 140 }}>
                      {ej.nombre}
                    </span>
                    <button type="button" className={x.filtro} aria-label={`Menos ${minutos ? 'minutos' : 'series'} de ${ej.nombre}`} onClick={() => series(i.id, -1)}>
                      −
                    </button>
                    <span className={estilos.chico} style={{ minWidth: 56, textAlign: 'center' }}>
                      {minutos ? `${i.rango?.[0] ?? ej.rango[0]} min` : `${i.series ?? 3} series`}
                    </span>
                    <button type="button" className={x.filtro} aria-label={`Más ${minutos ? 'minutos' : 'series'} de ${ej.nombre}`} onClick={() => series(i.id, 1)}>
                      +
                    </button>
                    {variantesDe(i.id).length > 1 && (
                      <span style={{ flexBasis: '100%' }}>
                        <Implementos id={i.id} equipo={equipo} onElegir={(nuevo) => cambiarImplemento(i.id, nuevo)} />
                      </span>
                    )}
                  </div>
                )
              })
            )}
            {(turnosDia > 1 || delDia.items.length > 0) && (
              <button
                type="button"
                className={x.filtro}
                style={{ alignSelf: 'flex-start' }}
                onClick={() => {
                  // Saca este entrenamiento y corre los siguientes un lugar.
                  setSel((s) =>
                    (s ?? [])
                      .filter((d) => !mismo(d))
                      .map((d) => (d.dia === dia && (d.turno ?? 0) > turno ? { ...d, turno: (d.turno ?? 0) - 1 } : d)),
                  )
                  setTurno(Math.max(0, turno - 1))
                }}
              >
                Sacar este entrenamiento
              </button>
            )}
          </Tarjeta>

          <p className="etiqueta">
            Sumar ejercicios al {NOMBRES_DIAS[dia].toLowerCase()}
            {turnosDia > 1 ? ` (${turno + 1}º entrenamiento)` : ''}
          </p>
          <input className={x.buscador} type="search" placeholder="Buscar: banca, sentadilla, soga…" aria-label="Buscar ejercicio" value={busqueda} onChange={(ev) => setBusqueda(ev.target.value)} />
          <div className={x.filtros} role="group" aria-label="Filtrar por tipo">
            <button type="button" className={`${x.filtro} ${filtro === null ? x.filtroOn : ''}`} aria-pressed={filtro === null} onClick={() => setFiltro(null)}>
              Todos
            </button>
            {FILTROS.map((f) => (
              <button key={f.valor} type="button" className={`${x.filtro} ${filtro === f.valor ? x.filtroOn : ''}`} aria-pressed={filtro === f.valor} onClick={() => setFiltro(filtro === f.valor ? null : f.valor)}>
                {f.texto}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '4px 12px' }}>
            {lista.map((ej) => {
              const falta = equipo && !sePuedeHacer(ej, equipo) ? ej.equipo.filter((q) => !equipo.has(q)).map((q) => NOMBRES_EQUIPO[q] ?? q) : []
              const evitar = evitarPorLimitacion(ej, limitaciones)
              return (
                <label key={ej.id} className={x.interruptor}>
                  <input type="checkbox" checked={tiene(ej.id)} onChange={() => alternar(ej.id)} />
                  <span>
                    {ej.nombre}
                    {variantesDe(ej.id).length > 1 && (
                      <span className={estilos.chico}>
                        {' '}
                        · también con {variantesDe(ej.id).filter((v) => v.id !== ej.id).map((v) => implemento(v).toLowerCase()).join(' o ')}
                      </span>
                    )}
                    <span className={estilos.chico}>
                      {' '}
                      · {ej.principal.join(', ')}
                      {falta.length ? ` · necesita ${falta.join(', ')}` : ''}
                      {evitar ? ' · conviene evitarlo por tu limitación' : ''}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </>
      )}

      <p className="etiqueta">En vivo</p>
      <VistaAnalisis
        a={analisis}
        compacto
        onAgregar={(id) => {
          if (!tiene(id)) cambiarDia({ items: [...delDia.items, { id }] })
        }}
      />
      <p className={estilos.chico}>Tocá una sugerencia para sumarla al entrenamiento que estás editando.</p>

      <Boton variante="principal" ancho disabled={!sel.some((d) => d.items.length)} onClick={() => (tenePlan ? setConfirmar(true) : void guardar())}>
        Guardar como mi plan
      </Boton>
      {confirmar && (
        <Dialogo titulo="¿Reemplazar tu plan?" onCerrar={() => setConfirmar(false)}>
          <p className={estilos.texto2}>Tu plan de la semana pasa a ser esta rutina. Los registros de tus ejercicios no se borran.</p>
          <Aviso tipo="ok">Después la podés seguir editando en Plan, como cualquier sesión.</Aviso>
          <Boton variante="principal" onClick={() => void guardar()}>
            Sí, guardar
          </Boton>
          <Boton onClick={() => setConfirmar(false)}>Cancelar</Boton>
        </Dialogo>
      )}
    </div>
  )
}
