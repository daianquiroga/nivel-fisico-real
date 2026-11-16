import { useEffect, useRef, useState } from 'react'
import { Stepper } from '../../components/controles'
import { avisoFin, pitido, vibrar } from '../../lib/dispositivo'
import { hablar } from '../../lib/voz'
import t from '../../components/tiempo.module.css'

const formato = (seg: number) => `${Math.floor(seg / 60)}:${String(Math.max(0, seg) % 60).padStart(2, '0')}`

/** Temporizador de rondas: trabajo y descanso configurables. Para cardio continuo, 1 ronda sin descanso. */
export function Rondas({
  minutos,
  intervalos,
  onFin,
  inicial,
  onRonda,
}: {
  minutos: number
  intervalos: boolean
  onFin: (minutosHechos: number) => void
  /** Trabajo y descanso en segundos y cantidad de rondas, para empezar con otros valores. */
  inicial?: { trabajo: number; descanso: number; rondas: number }
  /** Se llama en cada cambio de fase (para cantar combinaciones, por ejemplo). */
  onRonda?: (r: { ronda: number; fase: 'trabajo' | 'descanso' } | null) => void
}) {
  const [trabajo, setTrabajo] = useState(inicial?.trabajo ?? (intervalos ? 30 : minutos * 60))
  const [descanso, setDescanso] = useState(inicial?.descanso ?? (intervalos ? 30 : 0))
  const [rondas, setRondas] = useState(inicial?.rondas ?? (intervalos ? Math.max(1, Math.round((minutos * 60) / 60)) : 1))
  const [estado, setEstado] = useState<{ ronda: number; fase: 'trabajo' | 'descanso'; fin: number } | null>(null)
  const [resta, setResta] = useState(trabajo)
  const [pausa, setPausa] = useState<number | null>(null)
  const inicio = useRef(0)
  const avisado = useRef(new Set<string>())
  const avisarRonda = useRef(onRonda)
  avisarRonda.current = onRonda
  useEffect(() => {
    avisarRonda.current?.(estado ? { ronda: estado.ronda, fase: estado.fase } : null)
  }, [estado?.ronda, estado?.fase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!estado || pausa !== null) return
    const id = setInterval(() => {
      const r = Math.ceil((estado.fin - performance.now()) / 1000)
      setResta(r)
      const clave = `${estado.ronda}-${estado.fase}-${r}`
      if (r <= 3 && r > 0 && !avisado.current.has(clave)) {
        avisado.current.add(clave)
        pitido(660, 120)
      }
      if (r === 10 && estado.fase === 'trabajo' && trabajo > 20 && !avisado.current.has(clave)) {
        avisado.current.add(clave)
        hablar('Diez segundos')
      }
      if (r > 0) return
      if (estado.fase === 'trabajo' && descanso > 0 && estado.ronda < rondas) {
        pitido(990, 250)
        vibrar(200)
        hablar(`Descanso, ${descanso} segundos`)
        setEstado({ ronda: estado.ronda, fase: 'descanso', fin: performance.now() + descanso * 1000 })
      } else if (estado.ronda < rondas) {
        pitido(990, 250)
        vibrar(200)
        hablar(estado.ronda + 1 === rondas ? 'Última ronda' : `Ronda ${estado.ronda + 1}`)
        setEstado({ ronda: estado.ronda + 1, fase: 'trabajo', fin: performance.now() + trabajo * 1000 })
      } else {
        clearInterval(id)
        avisoFin()
        hablar('¡Terminaste!')
        setEstado(null)
        onFin(Math.max(1, Math.round((performance.now() - inicio.current) / 60000)))
      }
    }, 200)
    return () => clearInterval(id)
  }, [estado, pausa, trabajo, descanso, rondas, onFin])

  if (!estado) {
    return (
      <div className={t.caja} style={{ alignItems: 'stretch' }}>
        {intervalos ? (
          <>
            <Stepper etiqueta="Trabajo" valor={trabajo} min={10} max={300} paso={5} unidad="s" onCambio={setTrabajo} />
            <Stepper etiqueta="Descanso" valor={descanso} min={0} max={300} paso={5} unidad="s" onCambio={setDescanso} />
            <Stepper etiqueta="Rondas" valor={rondas} min={1} max={60} onCambio={setRondas} />
          </>
        ) : (
          <Stepper etiqueta="Minutos" valor={Math.round(trabajo / 60)} min={1} max={120} onCambio={(v) => setTrabajo(v * 60)} />
        )}
        <button
          type="button"
          className={t.botonGrande}
          onClick={() => {
            inicio.current = performance.now()
            avisado.current.clear()
            pitido(990, 250)
            hablar(intervalos ? `${rondas} rondas. ¡Vamos!` : '¡Vamos!')
            setResta(trabajo)
            setEstado({ ronda: 1, fase: 'trabajo', fin: performance.now() + trabajo * 1000 })
          }}
        >
          Empezar
        </button>
      </div>
    )
  }

  return (
    <div className={t.caja}>
      <p className={t.estado}>
        {estado.fase === 'trabajo' ? (intervalos ? 'Trabajo' : 'En marcha') : 'Descanso'}
        {rondas > 1 ? ` · ronda ${estado.ronda} de ${rondas}` : ''}
      </p>
      <div className={`${t.reloj} ${estado.fase === 'trabajo' ? t.corriendo : ''}`}>{formato(pausa ?? resta)}</div>
      <div className={t.fila}>
        <button
          type="button"
          className={`${t.botonGrande} ${t.parar}`}
          onClick={() => {
            if (pausa === null) setPausa(resta)
            else {
              setEstado({ ...estado, fin: performance.now() + pausa * 1000 })
              setPausa(null)
            }
          }}
        >
          {pausa === null ? 'Pausa' : 'Seguir'}
        </button>
        <button
          type="button"
          className={`${t.botonGrande} ${t.parar}`}
          onClick={() => {
            setEstado(null)
            onFin(Math.max(1, Math.round((performance.now() - inicio.current) / 60000)))
          }}
        >
          Terminar
        </button>
      </div>
    </div>
  )
}
