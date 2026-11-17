import { useState } from 'react'
import { Hora, Segmentado, Stepper } from '../../components/controles'
import { Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { ComoEncadenar, ConsejoOrden } from './Orden'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { EJERCICIOS, PATRONES, equipoDeLugar, evitarPorLimitacion, ejercicio, sePuedeHacer } from '../../lib/ejercicios'
import { NOMBRES_DIAS } from '../../lib/perfil'
import {
  agregarEjercicio,
  ajustarEjercicio,
  borrarSesion,
  cambiarDatosSesion,
  cambiarMetodo,
  moverEjercicio,
  ordenarSesion,
  moverSesion,
  quitarEjercicio,
} from '../../lib/plan/editar'
import type { EntradaPlan, Metodo, PlanSemana } from '../../lib/plan/generador'
import e from '../Ejercicios/ejercicios.module.css'
import s from './plan.module.css'

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const METODOS: { valor: Metodo; texto: string; consejo: string }[] = [
  { valor: 'clasico', texto: 'Clásico', consejo: 'Todas las series de un ejercicio con su pausa, y después el siguiente. Lo mejor para aprender técnica y para cargas pesadas.' },
  { valor: 'superseries', texto: 'Superseries', consejo: 'Dos ejercicios seguidos y después la pausa. Ahorra tiempo; ideal juntando músculos distintos (empuje + tracción).' },
  { valor: 'circuito', texto: 'Circuito', consejo: 'Todos los ejercicios seguidos y después una pausa larga. El más rápido; también suma algo de cardio.' },
]

function Selector({
  lugar,
  entrada,
  onElegir,
  onCerrar,
}: {
  lugar?: string
  entrada: EntradaPlan
  onElegir: (id: string) => void
  onCerrar: () => void
}) {
  const [q, setQ] = useState('')
  const [patron, setPatron] = useState<string | null>(null)
  const [todos, setTodos] = useState(false)
  const l = entrada.lugares.find((x) => x.nombre === lugar)
  const equipo = l ? equipoDeLugar(l) : null
  const lista = EJERCICIOS.filter((x) => {
    if (patron && !PATRONES.find((p) => p.valor === patron)?.incluye.includes(x.patron)) return false
    if (!todos && equipo && !sePuedeHacer(x, equipo)) return false
    if (evitarPorLimitacion(x, entrada.limitaciones)) return false
    return !q || sinTildes([x.nombre, ...x.principal].join(' ')).includes(sinTildes(q))
  })
  return (
    <Dialogo titulo="Agregar ejercicio" onCerrar={onCerrar}>
      <input className={e.buscador} type="search" placeholder="Buscar…" aria-label="Buscar ejercicio" value={q} onChange={(ev) => setQ(ev.target.value)} />
      <div className={e.filtros} role="group" aria-label="Tipo">
        <button type="button" className={`${e.filtro} ${patron === null ? e.filtroOn : ''}`} onClick={() => setPatron(null)}>
          Todos
        </button>
        {PATRONES.map((p) => (
          <button key={p.valor} type="button" className={`${e.filtro} ${patron === p.valor ? e.filtroOn : ''}`} onClick={() => setPatron(patron === p.valor ? null : p.valor)}>
            {p.texto}
          </button>
        ))}
      </div>
      {equipo && (
        <label className={e.interruptor}>
          <input type="checkbox" checked={todos} onChange={(ev) => setTodos(ev.target.checked)} />
          Mostrar también los que necesitan otro equipo
        </label>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '45vh', overflowY: 'auto' }}>
        {lista.map((x) => (
          <button key={x.id} type="button" className={s.alternativa} onClick={() => onElegir(x.id)}>
            <b>{x.nombre}</b>
            <span>{x.principal.join(', ')}</span>
          </button>
        ))}
        {lista.length === 0 && <p className={estilos.chico}>No hay ejercicios con esos filtros.</p>}
      </div>
      <p className={estilos.chico}>Los que conviene evitar por tus limitaciones no aparecen.</p>
      <Boton onClick={onCerrar}>Cerrar</Boton>
    </Dialogo>
  )
}

export function EditorSesion({
  plan,
  dia,
  idx,
  entrada,
  onCambio,
  onListo,
}: {
  plan: PlanSemana
  dia: number
  idx: number
  entrada: EntradaPlan
  onCambio: (p: PlanSemana) => void
  onListo: () => void
}) {
  const sesion = plan.dias[dia].sesiones[idx]
  const [abierto, setAbierto] = useState<number | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [borrar, setBorrar] = useState(false)
  const [modo, setModo] = useState<'mover' | 'copiar' | null>(null)
  if (!sesion) return null
  const lugares = [...entrada.lugares.map((l) => l.nombre), 'Afuera']

  return (
    <Tarjeta destacada>
      <p className="etiqueta" style={{ color: 'var(--accent)' }}>
        Editando
      </p>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className={estilos.chico}>Nombre</span>
        <input
          className={e.buscador}
          value={sesion.titulo}
          onChange={(ev) => onCambio(cambiarDatosSesion(plan, dia, idx, { titulo: ev.target.value }))}
          maxLength={40}
        />
      </label>

      <p className={estilos.chico}>Dónde</p>
      <div className={e.filtros} role="radiogroup" aria-label="Lugar">
        {lugares.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={sesion.lugar === l}
            className={`${e.filtro} ${sesion.lugar === l ? e.filtroOn : ''}`}
            onClick={() => onCambio(cambiarDatosSesion(plan, dia, idx, { lugar: l }))}
          >
            {l}
          </button>
        ))}
      </div>

      <Hora etiqueta="Empieza a las" valor={sesion.desde ?? ''} onCambio={(v) => onCambio(cambiarDatosSesion(plan, dia, idx, { desde: v || null }))} />
      <p className={estilos.chico}>
        {sesion.desde ? `Termina a las ${sesion.hasta} (unos ${sesion.minutos} minutos).` : `Sin horario fijo · unos ${sesion.minutos} minutos.`}
      </p>

      {sesion.tipo === 'fuerza' && (
        <>
          <p className={estilos.chico}>Cómo hacer las series</p>
          <Segmentado<Metodo>
            etiqueta="Método"
            opciones={METODOS.map((m) => ({ valor: m.valor, texto: m.texto }))}
            valor={sesion.metodo}
            onCambio={(m) => onCambio(cambiarMetodo(plan, dia, idx, m))}
          />
          <p className={estilos.chico}>{METODOS.find((m) => m.valor === sesion.metodo)?.consejo}</p>
        </>
      )}

      <p className="etiqueta" style={{ marginTop: 8 }}>
        Ejercicios
      </p>
      {sesion.ejercicios.map((x, i) => {
        const ej = ejercicio(x.id)
        if (!ej) return null
        const minutos = ej.tipo === 'minutos'
        const u = ej.tipo === 'segundos' ? 's' : 'reps'
        return (
          <div key={`${x.id}-${i}`} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
            <div className={s.ejercicio} style={{ borderBottom: 0 }}>
              <span className={s.letra}>{x.grupo ? (x.grupo === 'C' ? '↻' : x.grupo) : i + 1}</span>
              <span className={s.info}>
                <b>{ej.nombre}</b>
                <span>
                  {minutos ? `${x.rango[0]} min` : `${x.series} × ${x.rango[0]}–${x.rango[1]} ${u}`}
                  {x.descansoSeg ? ` · pausa ${x.descansoSeg} s` : ''}
                </span>
              </span>
              <button type="button" className={s.accion} aria-label={`Subir ${ej.nombre}`} disabled={i === 0} onClick={() => onCambio(moverEjercicio(plan, dia, idx, i, -1))}>
                ↑
              </button>
              <button
                type="button"
                className={s.accion}
                aria-label={`Bajar ${ej.nombre}`}
                disabled={i === sesion.ejercicios.length - 1}
                onClick={() => onCambio(moverEjercicio(plan, dia, idx, i, 1))}
              >
                ↓
              </button>
            </div>
            <div className={estilos.fila}>
              <button type="button" className={s.accion} aria-expanded={abierto === i} onClick={() => setAbierto(abierto === i ? null : i)}>
                {abierto === i ? 'Cerrar ajustes' : 'Ajustar series y pausa'}
              </button>
              <button type="button" className={s.accion} onClick={() => onCambio(quitarEjercicio(plan, dia, idx, i))}>
                Quitar
              </button>
            </div>
            {abierto === i && (
              <div style={{ marginTop: 8 }}>
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '6px 4px 2px', marginBottom: 6 }}>
                  <DibujoEjercicio id={x.id} />
                </div>
                {minutos ? (
                  <Stepper etiqueta="Minutos" valor={x.rango[0]} min={5} max={120} paso={5} unidad="min" onCambio={(v) => onCambio(ajustarEjercicio(plan, dia, idx, i, { rango: [v, v] }))} />
                ) : (
                  <>
                    <Stepper etiqueta="Series" valor={x.series} min={1} max={8} onCambio={(v) => onCambio(ajustarEjercicio(plan, dia, idx, i, { series: v }))} />
                    <Stepper
                      etiqueta="Desde"
                      valor={x.rango[0]}
                      min={1}
                      max={ej.tipo === 'segundos' ? 300 : 50}
                      paso={ej.tipo === 'segundos' ? 5 : 1}
                      unidad={u}
                      onCambio={(v) => onCambio(ajustarEjercicio(plan, dia, idx, i, { rango: [v, Math.max(v, x.rango[1])] }))}
                    />
                    <Stepper
                      etiqueta="Hasta"
                      valor={x.rango[1]}
                      min={1}
                      max={ej.tipo === 'segundos' ? 300 : 50}
                      paso={ej.tipo === 'segundos' ? 5 : 1}
                      unidad={u}
                      onCambio={(v) => onCambio(ajustarEjercicio(plan, dia, idx, i, { rango: [Math.min(v, x.rango[0]), v] }))}
                    />
                    <Stepper etiqueta="Pausa" valor={x.descansoSeg} min={0} max={300} paso={15} unidad="s" onCambio={(v) => onCambio(ajustarEjercicio(plan, dia, idx, i, { descansoSeg: v }))} />
                    <p className={estilos.chico}>
                      Guía: para fuerza máxima, pocas repeticiones (3 a 6) y pausas largas (2 a 3 minutos). Para músculo sirve un rango amplio, de 6 a 30, si terminás cerca del fallo (Schoenfeld 2017).
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      <Boton ancho onClick={() => setAgregando(true)}>
        + Agregar ejercicio
      </Boton>
      {!sesion.combate && <ConsejoOrden ejercicios={sesion.ejercicios} onOrdenar={() => onCambio(ordenarSesion(plan, dia, idx))} />}
      <ComoEncadenar ejercicios={sesion.ejercicios} />

      <p className={estilos.chico} style={{ marginTop: 8 }}>
        Mover o copiar esta sesión a otro día
      </p>
      <div className={estilos.fila}>
        <Boton onClick={() => setModo(modo === 'mover' ? null : 'mover')}>Mover</Boton>
        <Boton onClick={() => setModo(modo === 'copiar' ? null : 'copiar')}>Copiar</Boton>
      </div>
      {modo && (
        <div className={s.semana} role="group" aria-label={modo === 'mover' ? 'Mover a' : 'Copiar a'}>
          {LETRAS.map((l, d) => (
            <button
              key={l}
              type="button"
              className={s.dia}
              style={{ minHeight: 48 }}
              disabled={d === dia}
              aria-label={`${modo === 'mover' ? 'Mover' : 'Copiar'} al ${NOMBRES_DIAS[d].toLowerCase()}`}
              onClick={() => {
                onCambio(moverSesion(plan, dia, idx, d, modo === 'copiar'))
                setModo(null)
                if (modo === 'mover') onListo()
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <Boton variante="principal" ancho onClick={onListo}>
        Listo
      </Boton>
      <button type="button" className={s.accion} style={{ alignSelf: 'center' }} onClick={() => setBorrar(true)}>
        Borrar esta sesión
      </button>

      {agregando && (
        <Selector
          lugar={sesion.lugar}
          entrada={entrada}
          onCerrar={() => setAgregando(false)}
          onElegir={(id) => {
            onCambio(agregarEjercicio(plan, dia, idx, id))
            setAgregando(false)
          }}
        />
      )}
      {borrar && (
        <Dialogo titulo="¿Borrar esta sesión?" onCerrar={() => setBorrar(false)}>
          <p className={estilos.texto2}>Se saca del plan de ese día.</p>
          <div className={estilos.fila}>
            <Boton onClick={() => setBorrar(false)}>Cancelar</Boton>
            <Boton
              variante="principal"
              onClick={() => {
                onCambio(borrarSesion(plan, dia, idx))
                setBorrar(false)
                onListo()
              }}
            >
              Borrar
            </Boton>
          </div>
        </Dialogo>
      )}
    </Tarjeta>
  )
}
