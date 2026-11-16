import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hora, Segmentado } from '../../components/controles'
import { Aviso, Boton, Dialogo, estilos } from '../../components/ui'
import {
  NOMBRES_BLOQUE,
  aHora,
  aMin,
  agregarBloque,
  borrarBloque,
  editarBloque,
  itemsDelDia,
  superposiciones,
  usarAgenda,
  type ItemAgenda,
  type TipoBloque,
  type TipoItem,
} from '../../lib/agenda'
import { NOMBRES_DIAS, type Semana } from '../../lib/perfil'
import type { PlanSemana } from '../../lib/plan/generador'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarEvaluaciones } from '../../lib/usarEvaluaciones'
import { DIAS_ENTRE_EVALUACIONES } from '../../lib/evaluacion'
import e from '../Ejercicios/ejercicios.module.css'
import a from './agenda.module.css'

const INICIO = 5 * 60
const FIN = 24 * 60
const PX = 0.9
const NOMBRE_TIPO_DIA = { laboral: 'días laborales', sabado: 'sábados', domingo: 'domingos' } as const
const CORTO: Record<TipoBloque, string> = { fijo: 'Trabajo', comida: 'Comida', actividad: 'Caminata', clase: 'Clase', otro: 'Otro' }
const COLORES: Partial<Record<TipoItem, string>> = {
  entrenamiento: 'var(--action)',
  micro: 'var(--soft)',
  comida: 'var(--done)',
  fijo: 'var(--muted)',
  actividad: 'var(--done)',
  clase: 'var(--accent)',
  retest: 'var(--done)',
}

/** Fecha del día de la semana (0 = lunes) en la semana actual. */
export function fechaDeDia(dia: number, hoy = new Date()): string {
  const d = new Date(hoy)
  const actual = (d.getDay() + 6) % 7
  d.setDate(d.getDate() + (dia - actual))
  return fechaLocal(d)
}

/** Carriles para que los bloques que se pisan queden lado a lado. */
function carriles(items: ItemAgenda[]) {
  const reales = items.filter((x) => x.tipo !== 'sueno' && x.tipo !== 'libre')
  const fin: number[] = []
  const lane = new Map<string, number>()
  for (const it of reales) {
    const ini = aMin(it.desde)
    let l = fin.findIndex((f) => f <= ini)
    if (l < 0) l = fin.length
    fin[l] = aMin(it.hasta)
    lane.set(it.id, l)
  }
  return { lane, total: Math.max(1, fin.length) }
}

interface Editando {
  item?: ItemAgenda
  tipo: TipoBloque
  nombre: string
  desde: string
  hasta: string
  soloEsteDia: boolean
}

export function Agenda({ semana, plan, dia, onDia }: { semana: Semana; plan: PlanSemana | null; dia: number; onDia: (d: number) => void }) {
  const { agenda, guardar } = usarAgenda()
  const evaluaciones = usarEvaluaciones()
  const [vista, setVista] = useState<'dia' | 'semana'>('dia')
  const [editando, setEditando] = useState<Editando | null>(null)
  const [elegido, setElegido] = useState<ItemAgenda | null>(null)
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  if (!agenda || evaluaciones === null) return null

  const ultima = evaluaciones[evaluaciones.length - 1]
  const fechaRetest = ultima
    ? (() => {
        const d = new Date(ultima.fecha)
        d.setDate(d.getDate() + DIAS_ENTRE_EVALUACIONES)
        return fechaLocal(d)
      })()
    : null
  const itemsDe = (d: number) => {
    const fecha = fechaDeDia(d)
    return itemsDelDia({ fecha, dia: d, semana, agenda, plan, retest: fechaRetest !== null && (fecha === fechaRetest || (d === (ahora.getDay() + 6) % 7 && fechaRetest < fecha)) })
  }
  const fecha = fechaDeDia(dia)
  const tipoDia = semana.dias[dia]
  const items = itemsDe(dia)
  const choques = superposiciones(items)
  const esHoy = fecha === fechaLocal(ahora)
  const y = (h: string) => (Math.max(INICIO, Math.min(FIN, aMin(h))) - INICIO) * PX
  const { lane, total } = carriles(items)

  function nuevoEn(min: number) {
    const desde = Math.round(min / 30) * 30
    setEditando({ tipo: 'fijo', nombre: CORTO.fijo, desde: aHora(desde), hasta: aHora(Math.min(desde + 60, 23 * 60 + 59)), soloEsteDia: false })
  }

  async function guardarEdicion() {
    if (!editando || !agenda) return
    const datos = { tipo: editando.tipo, nombre: editando.nombre || CORTO[editando.tipo], desde: editando.desde, hasta: aMin(editando.hasta) > aMin(editando.desde) ? editando.hasta : aHora(aMin(editando.desde) + 30) }
    const nueva = editando.item?.bloqueId
      ? editarBloque(agenda, editando.item.bloqueId, datos, tipoDia, fecha, editando.soloEsteDia)
      : agregarBloque(agenda, datos, editando.soloEsteDia ? { fecha } : { tipo: tipoDia })
    await guardar(nueva)
    setEditando(null)
  }

  function tocar(it: ItemAgenda) {
    if (it.bloqueId) {
      setEditando({ item: it, tipo: it.tipo as TipoBloque, nombre: it.nombre, desde: it.desde, hasta: it.hasta, soloEsteDia: it.origen === 'puntual' })
    } else setElegido(it)
  }

  return (
    <>
      <Segmentado<'dia' | 'semana'>
        etiqueta="Vista"
        opciones={[
          { valor: 'dia', texto: 'Día' },
          { valor: 'semana', texto: 'Semana' },
        ]}
        valor={vista}
        onCambio={setVista}
      />

      {vista === 'semana' ? (
        <>
          <div className={a.semana}>
            {Array.from({ length: 7 }, (_, d) => (
              <button
                key={d}
                type="button"
                className={a.columna}
                aria-label={`Ver ${NOMBRES_DIAS[d].toLowerCase()}`}
                onClick={() => {
                  onDia(d)
                  setVista('dia')
                }}
              >
                {itemsDe(d)
                  .filter((it) => COLORES[it.tipo])
                  .map((it) => (
                    <i
                      key={it.id}
                      style={{
                        top: `${(y(it.desde) / ((FIN - INICIO) * PX)) * 100}%`,
                        height: `${Math.max(1.5, ((y(it.hasta) - y(it.desde)) / ((FIN - INICIO) * PX)) * 100)}%`,
                        background: COLORES[it.tipo],
                      }}
                    />
                  ))}
              </button>
            ))}
          </div>
          <div className={a.semana} aria-hidden="true">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((l) => (
              <span key={l} style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                {l}
              </span>
            ))}
          </div>
          <p className={estilos.chico}>De 5 a 24 h. Tocá un día para verlo en detalle.</p>
        </>
      ) : (
        <>
          <p className="etiqueta" style={{ margin: 0 }}>
            {NOMBRES_DIAS[dia]} {fecha.slice(8)}/{fecha.slice(5, 7)}
            {esHoy ? ' · hoy' : ''}
          </p>
          {choques.length > 0 && (
            <Aviso tipo="error">
              Se pisan: {choques.map(([x, z]) => `${x.nombre} y ${z.nombre}`).join('; ')}. Tocá uno para cambiar el horario.
            </Aviso>
          )}
          <div className={a.linea} style={{ height: (FIN - INICIO) * PX }}>
            <button type="button" className={a.fondo} aria-label="Agregar un bloque en este horario" onClick={(ev) => nuevoEn(INICIO + (ev.nativeEvent.offsetY / PX))} />
            {Array.from({ length: 20 }, (_, i) => 5 + i).map((h) => (
              <div key={h}>
                <span className={a.hora} style={{ top: (h * 60 - INICIO) * PX }}>
                  {h < 24 ? `${String(h).padStart(2, '0')}:00` : ''}
                </span>
                <span className={a.raya} style={{ top: (h * 60 - INICIO) * PX }} />
              </div>
            ))}
            {esHoy && <span className={a.ahora} style={{ top: y(aHora(ahora.getHours() * 60 + ahora.getMinutes())) }} />}
            {items
              .filter((it) => aMin(it.hasta) > INICIO || it.hasta === '23:59')
              .map((it) => {
                const fondo = it.tipo === 'sueno' || it.tipo === 'libre'
                const l = lane.get(it.id) ?? 0
                const ancho = fondo ? 100 : 100 / total
                const alto = Math.max(20, y(it.hasta) - y(it.desde))
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={`${a.item} ${a[it.tipo]}`}
                    style={{ top: y(it.desde), height: alto, left: `calc(${fondo ? 0 : l * ancho}% + 4px)`, width: `calc(${ancho}% - 8px)` }}
                    onClick={() => tocar(it)}
                  >
                    {it.nombre}
                    {alto > 34 && (
                      <small>
                        {it.desde} a {it.hasta === '23:59' ? '24:00' : it.hasta}
                      </small>
                    )}
                  </button>
                )
              })}
          </div>
          <div className={a.leyenda}>
            <span style={{ ['--c' as string]: 'var(--action)' }}>Entrenamiento</span>
            <span style={{ ['--c' as string]: 'var(--soft)' }}>Pausa activa</span>
            <span style={{ ['--c' as string]: 'var(--done)' }}>Comida o actividad</span>
            <span style={{ ['--c' as string]: 'var(--muted)' }}>Trabajo o fijo</span>
          </div>
          <Boton ancho onClick={() => nuevoEn(12 * 60)}>
            + Agregar bloque (trabajo, comida, clase…)
          </Boton>
          <p className={estilos.chico}>
            También podés tocar un horario vacío. Los bloques de los {NOMBRE_TIPO_DIA[tipoDia]} se repiten; para cambiar solo este día, marcá "Solo este día". En
            bloques largos de trabajo la app suma pausas activas de 5 minutos cada hora y media.
          </p>
        </>
      )}

      {editando && (
        <Dialogo titulo={editando.item ? 'Editar bloque' : 'Nuevo bloque'} onCerrar={() => setEditando(null)}>
          <div className={e.filtros} role="radiogroup" aria-label="Tipo de bloque" style={{ flexWrap: 'wrap' }}>
            {(Object.keys(NOMBRES_BLOQUE) as TipoBloque[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={editando.tipo === t}
                className={`${e.filtro} ${editando.tipo === t ? e.filtroOn : ''}`}
                onClick={() => setEditando({ ...editando, tipo: t, nombre: Object.values(CORTO).includes(editando.nombre) ? CORTO[t] : editando.nombre })}
              >
                {NOMBRES_BLOQUE[t]}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className={estilos.chico}>Nombre</span>
            <input className={e.buscador} value={editando.nombre} maxLength={30} onChange={(ev) => setEditando({ ...editando, nombre: ev.target.value })} />
          </label>
          <Hora etiqueta="Desde" valor={editando.desde} onCambio={(v) => setEditando({ ...editando, desde: v })} />
          <Hora etiqueta="Hasta" valor={editando.hasta} onCambio={(v) => setEditando({ ...editando, hasta: v })} />
          <Segmentado<'todos' | 'uno'>
            etiqueta="Cuándo"
            opciones={[
              { valor: 'todos', texto: `Todos los ${NOMBRE_TIPO_DIA[tipoDia]}` },
              { valor: 'uno', texto: 'Solo este día' },
            ]}
            valor={editando.soloEsteDia ? 'uno' : 'todos'}
            onCambio={(v) => setEditando({ ...editando, soloEsteDia: v === 'uno' })}
          />
          <Boton variante="principal" ancho onClick={() => void guardarEdicion()}>
            Guardar
          </Boton>
          {editando.item?.bloqueId && (
            <Boton
              ancho
              onClick={() => {
                void guardar(borrarBloque(agenda, editando.item!.bloqueId!, tipoDia, fecha, editando.soloEsteDia)).then(() => setEditando(null))
              }}
            >
              {editando.soloEsteDia ? 'Quitar solo este día' : `Borrar de todos los ${NOMBRE_TIPO_DIA[tipoDia]}`}
            </Boton>
          )}
        </Dialogo>
      )}

      {elegido && (
        <Dialogo titulo={elegido.nombre} onCerrar={() => setElegido(null)}>
          <p className={estilos.texto2}>
            {elegido.desde} a {elegido.hasta === '23:59' ? '24:00' : elegido.hasta}
          </p>
          {elegido.tipo === 'entrenamiento' && elegido.sesion !== undefined && (
            <>
              <Link to={`/entrenar/${dia}/${elegido.sesion}`} className={`${estilos.boton} ${estilos.principal}`}>
                Entrenar ahora
              </Link>
              <p className={estilos.chico}>Para cambiar el horario, en la vista Entrenamiento tocá Editar en la sesión.</p>
            </>
          )}
          {elegido.tipo === 'micro' && (
            <>
              <p className={estilos.texto2}>2 minutos de marcha, 10 sentadillas y movilidad de tobillo. De pie, sin transpirar. Cortar el tiempo sentado es parte de las recomendaciones de la OMS.</p>
              <Link to="/entrenar/micro/0" className={`${estilos.boton} ${estilos.principal}`}>
                Hacer la pausa activa
              </Link>
            </>
          )}
          {elegido.tipo === 'retest' && (
            <Link to="/evaluacion" className={`${estilos.boton} ${estilos.principal}`}>
              Ir a la evaluación
            </Link>
          )}
          {(elegido.tipo === 'sueno' || elegido.tipo === 'libre') && (
            <p className={estilos.texto2}>Esto sale de tus horarios: cambialos en Perfil → Editar mis datos.</p>
          )}
          <Boton onClick={() => setElegido(null)}>Cerrar</Boton>
        </Dialogo>
      )}
    </>
  )
}

/** Lo que viene hoy (para la pantalla Hoy). */
export function proximos(items: ItemAgenda[], ahora = new Date(), n = 3): ItemAgenda[] {
  const m = ahora.getHours() * 60 + ahora.getMinutes()
  return items.filter((x) => x.tipo !== 'sueno' && x.tipo !== 'libre' && aMin(x.hasta) > m).slice(0, n)
}
