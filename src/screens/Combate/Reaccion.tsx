import { useEffect, useRef, useState } from 'react'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoTecnica } from '../../content/dibujos-combate'
import { tecnicasDe } from '../../lib/combate'
import { NOMBRE_CORTO, estimulosPara, resumenReaccion } from '../../lib/combos'
import { guardarActividad } from '../../lib/diario'
import { usarPantallaEncendida, vibrar } from '../../lib/dispositivo'
import { fechaLocal } from '../../lib/plan/sesion'
import { hablar } from '../../lib/voz'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import { Volver, usarCombate } from './comun'

const ESPERA_MAX = 2500

interface Visible {
  idx: number
  desde: number
}

/** Entrenador de contragolpes: aparece un ataque, respondés con la defensa y el contragolpe y tocás la pantalla. */
export function ReaccionCombate() {
  const { estado, disciplina: base } = usarCombate()
  const segunda = estado?.ajustes?.segunda
  const ids = new Set([...tecnicasDe(base, null), ...(segunda ? tecnicasDe(segunda, null) : [])].map((t) => t.id))
  const estimulos = estimulosPara(ids)
  const [segundos, setSegundos] = useState(60)
  const [conVoz, setConVoz] = useState(false)
  const [corriendo, setCorriendo] = useState(false)
  const [visible, setVisible] = useState<Visible | null>(null)
  const [tiempos, setTiempos] = useState<number[]>([])
  const [perdidos, setPerdidos] = useState(0)
  const [terminado, setTerminado] = useState(false)
  const fin = useRef(0)
  usarPantallaEncendida(true)

  // Próximo estímulo después de una pausa al azar de 1,5 a 3,5 s.
  useEffect(() => {
    if (!corriendo || visible) return
    if (performance.now() >= fin.current) {
      setCorriendo(false)
      setTerminado(true)
      return
    }
    const id = setTimeout(
      () => {
        const idx = Math.floor(Math.random() * estimulos.length)
        if (conVoz) hablar(estimulos[idx].estimulo.ataque)
        vibrar(60)
        setVisible({ idx, desde: performance.now() })
      },
      1500 + Math.random() * 2000,
    )
    return () => clearTimeout(id)
  }, [corriendo, visible, estimulos, conVoz])

  // Si no se toca a tiempo, cuenta como perdido.
  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => {
      setPerdidos((p) => p + 1)
      setVisible(null)
    }, ESPERA_MAX)
    return () => clearTimeout(id)
  }, [visible])

  useEffect(() => {
    if (!terminado) return
    void guardarActividad({ fecha: fechaLocal(), nombre: 'Contragolpes', met: 5.3, minutos: Math.max(1, Math.round(segundos / 60)), actividad: 'combate', variante: 'suave', origen: 'entrenar' })
  }, [terminado, segundos])

  if (!estado) return null
  const resumen = resumenReaccion(tiempos)

  function tocar() {
    if (!visible) return
    setTiempos((t) => [...t, Math.round(performance.now() - visible.desde)])
    setVisible(null)
  }

  if (corriendo) {
    const v = visible ? estimulos[visible.idx] : null
    return (
      <div className={e.pantalla}>
        <button
          type="button"
          onClick={tocar}
          aria-label={v ? `${v.estimulo.ataque}: respondé y tocá` : 'Esperá el próximo ataque'}
          style={{
            minHeight: '70vh',
            borderRadius: 'var(--radius)',
            border: `3px solid ${v ? v.estimulo.color : 'var(--line)'}`,
            background: v ? 'var(--surface)' : 'var(--bg)',
            color: 'var(--text)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 16,
          }}
        >
          {v ? (
            <>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: v.estimulo.color, textTransform: 'uppercase', lineHeight: 1 }}>{v.estimulo.ataque}</span>
              <span style={{ width: 180 }}>
                <DibujoTecnica id={v.respuesta[0]} />
              </span>
              <span className={estilos.texto2}>{v.respuesta.map((r) => NOMBRE_CORTO[r] ?? r).join(' + ')}</span>
            </>
          ) : (
            <span className={estilos.texto2}>En guardia… esperá el ataque</span>
          )}
        </button>
        <p className={estilos.chico}>
          Respondé con el cuerpo. Si tenés el celular cerca, tocá la pantalla al terminar para medir tu tiempo. Ataques: {tiempos.length + perdidos + (visible ? 1 : 0)}
        </p>
        <Boton
          onClick={() => {
            fin.current = 0
            setVisible(null)
            setCorriendo(false)
            setTerminado(true)
          }}
        >
          Terminar
        </Boton>
      </div>
    )
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Contragolpes</h1>
        <p className={e.para}>Aparece un ataque en la pantalla: defendé y contestá. Cada ataque dura 2,5 segundos. Si tenés el celular cerca, tocá la pantalla al responder y la app mide cuánto tardás.</p>
      </header>
      {terminado && resumen && (
        <Aviso tipo="ok">
          Tiempo promedio: {resumen.promedio} ms · mejor: {resumen.mejor} ms · {tiempos.length} {tiempos.length === 1 ? 'medida' : 'medidas'}{perdidos ? ` y ${perdidos} sin tocar` : ''}.
        </Aviso>
      )}
      {terminado && !resumen && perdidos > 0 && <Aviso tipo="ok">¡Bien! Respondiste {perdidos} ataques.</Aviso>}
      <Tarjeta>
        <p className="etiqueta">Lo que va a aparecer</p>
        <ul className={s.seccion}>
          {estimulos.map((x) => (
            <li key={x.estimulo.id}>
              <b style={{ color: x.estimulo.color }}>{x.estimulo.ataque}</b> → {x.respuesta.map((r) => NOMBRE_CORTO[r] ?? r).join(' + ')}
            </li>
          ))}
        </ul>
        <p className={estilos.chico}>Las respuestas salen de las técnicas de tu disciplina{segunda ? ' y de la segunda' : ''}.</p>
      </Tarjeta>
      <p className="etiqueta">Duración</p>
      <div className={s.filtros} role="radiogroup" aria-label="Duración">
        {[60, 90, 120].map((x) => (
          <button key={x} type="button" role="radio" aria-checked={segundos === x} className={`${s.filtro} ${segundos === x ? s.filtroOn : ''}`} onClick={() => setSegundos(x)}>
            {x === 60 ? '1 minuto' : x === 90 ? '1 minuto y medio' : '2 minutos'}
          </button>
        ))}
      </div>
      <label className={s.interruptor}>
        <input type="checkbox" checked={conVoz} onChange={(ev) => setConVoz(ev.target.checked)} />
        Decir también el ataque en voz alta (para no mirar la pantalla)
      </label>
      <Boton
        variante="principal"
        ancho
        disabled={!estimulos.length}
        onClick={() => {
          setTiempos([])
          setPerdidos(0)
          setTerminado(false)
          fin.current = performance.now() + segundos * 1000
          setCorriendo(true)
        }}
      >
        Empezar
      </Boton>
      <p className={estilos.chico}>Para entrenar, apoyá el celular a la altura de los ojos a 1 o 2 metros (activá la voz). Para medir tu reacción, dejalo en una mesa cerca y tocá apenas respondés.</p>
    </div>
  )
}
