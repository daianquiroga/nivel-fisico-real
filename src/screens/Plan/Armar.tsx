import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Segmentado } from '../../components/controles'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { EJERCICIOS, NOMBRES_EQUIPO, PATRONES, ejercicio, equipoDeLugar, evitarPorLimitacion, sePuedeHacer } from '../../lib/ejercicios'
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
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [lectura, setLectura] = useState<LecturaTexto | null>(null)
  const [elegidos, setElegidos] = useState<Record<number, string>>({})
  const [confirmar, setConfirmar] = useState(false)
  const [tenePlan, setTenePlan] = useState(false)

  useEffect(() => {
    void leerPlan().then((p) => {
      setTenePlan(Boolean(p))
      setSel(p ? seleccionDesdePlan(p) : [])
    })
  }, [])

  const plan = useMemo(() => armarPlanPropio(sel ?? []), [sel])
  const analisis = useMemo(() => (ctx ? analizarRutina(plan, ctx) : null), [plan, ctx])
  if (!sel || !ctx || !analisis) return null

  const delDia = sel.find((d) => d.dia === dia) ?? { dia, items: [] }
  const lugar = lugares.find((l) => l.nombre === delDia.lugar)
  const equipo = lugar ? equipoDeLugar(lugar) : null
  const limitaciones = perfil?.limitaciones ?? []

  const cambiarDia = (c: Partial<DiaRutina>) =>
    setSel((s) => {
      const lista = (s ?? []).filter((d) => d.dia !== dia)
      return [...lista, { ...delDia, ...c }].sort((a, b) => a.dia - b.dia)
    })
  const tiene = (id: string) => delDia.items.some((i) => i.id === id)
  const alternar = (id: string) => cambiarDia({ items: tiene(id) ? delDia.items.filter((i) => i.id !== id) : [...delDia.items, { id }] })
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

  const lista = EJERCICIOS.filter((ej) => {
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
      let d = dias.find((x) => x.dia === n.dia)
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
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Mi rutina</h1>
        <p className={e.para}>Armala tildando ejercicios día por día, o pegá la que ya tenés. Abajo ves en vivo qué aporta y qué le falta.</p>
      </header>
      <Segmentado
        etiqueta="Cómo cargarla"
        valor={modo}
        opciones={[
          { valor: 'tildar', texto: 'Tildar' },
          { valor: 'texto', texto: 'Pegar texto' },
        ]}
        onCambio={(v) => setModo(v as 'tildar' | 'texto')}
      />

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
              const n = sel.find((d) => d.dia === i)?.items.length ?? 0
              return (
                <button key={t} type="button" role="tab" aria-selected={dia === i} className={`${x.filtro} ${dia === i ? x.filtroOn : ''}`} onClick={() => setDia(i)}>
                  {t}
                  {n ? ` · ${n}` : ''}
                </button>
              )
            })}
          </div>

          <Tarjeta>
            <p className="etiqueta">{NOMBRES_DIAS[dia]}</p>
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
              <p className={estilos.chico}>Día libre. Tildá ejercicios abajo para sumarlos.</p>
            ) : (
              delDia.items.map((i) => {
                const ej = ejercicio(i.id)!
                const minutos = ej.tipo === 'minutos'
                return (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={estilos.texto2} style={{ flex: 1 }}>
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
                  </div>
                )
              })
            )}
          </Tarjeta>

          <p className="etiqueta">Sumar ejercicios al {NOMBRES_DIAS[dia].toLowerCase()}</p>
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
          const destino = sel.find((d) => d.items.length && d.dia === dia) ?? sel.find((d) => d.items.length) ?? { dia, items: [] }
          setDia(destino.dia)
          setSel((s) => {
            const otros = (s ?? []).filter((d) => d.dia !== destino.dia)
            const d = (s ?? []).find((d0) => d0.dia === destino.dia) ?? destino
            return d.items.some((i) => i.id === id) ? (s ?? []) : [...otros, { ...d, items: [...d.items, { id }] }].sort((a, b) => a.dia - b.dia)
          })
        }}
      />
      <p className={estilos.chico}>Tocá una sugerencia para sumarla al día que estás editando.</p>

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
