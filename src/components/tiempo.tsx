import { useEffect, useRef, useState } from 'react'
import { avisoFin, pitido, vibrar } from '../lib/dispositivo'
import s from './tiempo.module.css'

function formato(ms: number, decimas = false) {
  const total = Math.max(0, ms)
  const seg = Math.floor(total / 1000)
  const m = Math.floor(seg / 60)
  const ss = String(seg % 60).padStart(2, '0')
  const d = Math.floor((total % 1000) / 100)
  return decimas ? `${m}:${ss},${d}` : `${m}:${ss}`
}

/** Cronómetro que cuenta hacia arriba. Un solo botón grande para empezar y cortar. */
export function Cronometro({
  maximoSeg,
  onResultado,
  textoEmpezar = 'Empezar',
}: {
  maximoSeg?: number
  onResultado: (segundos: number) => void
  textoEmpezar?: string
}) {
  const [inicio, setInicio] = useState<number | null>(null)
  const [transcurrido, setTranscurrido] = useState(0)
  const [cuenta, setCuenta] = useState<number | null>(null)
  const ref = useRef<number>(0)

  useEffect(() => {
    if (inicio === null) return
    const tic = () => {
      const t = performance.now() - inicio
      if (maximoSeg && t >= maximoSeg * 1000) {
        setTranscurrido(maximoSeg * 1000)
        setInicio(null)
        avisoFin()
        onResultado(maximoSeg)
        return
      }
      setTranscurrido(t)
      ref.current = requestAnimationFrame(tic)
    }
    ref.current = requestAnimationFrame(tic)
    return () => cancelAnimationFrame(ref.current)
  }, [inicio, maximoSeg, onResultado])

  useEffect(() => {
    if (cuenta === null) return
    if (cuenta === 0) {
      pitido(990, 250)
      vibrar(150)
      setCuenta(null)
      setTranscurrido(0)
      setInicio(performance.now())
      return
    }
    pitido(660, 120)
    const t = setTimeout(() => setCuenta(cuenta - 1), 1000)
    return () => clearTimeout(t)
  }, [cuenta])

  const corriendo = inicio !== null
  function tocar() {
    if (cuenta !== null) return
    if (corriendo) {
      const seg = Math.round((performance.now() - inicio) / 100) / 10
      setInicio(null)
      setTranscurrido(seg * 1000)
      avisoFin()
      onResultado(seg)
    } else {
      setCuenta(3)
    }
  }

  return (
    <div className={s.caja}>
      <div className={`${s.reloj} ${corriendo ? s.corriendo : ''}`} aria-live="off">
        {cuenta !== null ? cuenta : formato(transcurrido, true)}
      </div>
      <p className={s.estado} aria-live="polite">
        {cuenta !== null ? 'Preparate…' : corriendo ? 'Tocá el botón cuando termines' : transcurrido > 0 ? 'Listo. Podés repetirlo si querés.' : ''}
      </p>
      <button type="button" className={`${s.botonGrande} ${corriendo ? s.parar : ''}`} onClick={tocar}>
        {corriendo ? 'Parar' : transcurrido > 0 ? 'Otra vez' : textoEmpezar}
      </button>
    </div>
  )
}

/** Cuenta regresiva con avisos sonoros (30 s, 15 s y fin) y botón grande para sumar repeticiones. */
export function CuentaRegresiva({
  segundos,
  conToques,
  textoToque = 'Tocá en cada repetición',
  onFin,
}: {
  segundos: number
  conToques?: boolean
  textoToque?: string
  onFin: (toques: number) => void
}) {
  const [fin, setFin] = useState<number | null>(null)
  const [resta, setResta] = useState(segundos * 1000)
  const [toques, setToques] = useState(0)
  const [terminado, setTerminado] = useState(false)
  const avisos = useRef(new Set<number>())
  const toquesRef = useRef(0)

  useEffect(() => {
    if (fin === null) return
    const id = setInterval(() => {
      const r = fin - performance.now()
      const seg = Math.ceil(r / 1000)
      for (const marca of [30, 15]) {
        if (segundos > marca && seg === marca && !avisos.current.has(marca)) {
          avisos.current.add(marca)
          pitido(760, 150)
          vibrar(100)
        }
      }
      if (r <= 0) {
        clearInterval(id)
        setResta(0)
        setFin(null)
        setTerminado(true)
        avisoFin()
        onFin(toquesRef.current)
        return
      }
      setResta(r)
    }, 100)
    return () => clearInterval(id)
  }, [fin, segundos, onFin])

  function empezar() {
    avisos.current.clear()
    toquesRef.current = 0
    setToques(0)
    setTerminado(false)
    setResta(segundos * 1000)
    pitido(990, 250)
    vibrar(150)
    setFin(performance.now() + segundos * 1000)
  }

  function sumar() {
    toquesRef.current += 1
    setToques(toquesRef.current)
    vibrar(30)
  }

  const corriendo = fin !== null
  return (
    <div className={s.caja}>
      <div className={`${s.reloj} ${corriendo ? s.corriendo : terminado ? s.terminado : ''}`}>{formato(resta)}</div>
      {corriendo && conToques ? (
        <button type="button" className={s.toque} onClick={sumar} aria-label={`Sumar una. Van ${toques}`}>
          {toques}
          <small>{textoToque}</small>
        </button>
      ) : (
        <>
          <p className={s.estado}>{terminado ? '¡Tiempo!' : corriendo ? 'Seguí…' : 'Vas a escuchar un pitido a los 30 y a los 15 segundos del final.'}</p>
          {!corriendo && (
            <button type="button" className={s.botonGrande} onClick={empezar}>
              {terminado ? 'Otra vez' : 'Empezar'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
