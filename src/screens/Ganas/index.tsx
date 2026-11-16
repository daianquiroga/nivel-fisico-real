import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { guardarTipo, leerTipo } from '../../lib/diario'
import { pitido, usarPantallaEncendida, vibrar } from '../../lib/dispositivo'
import { fechaLocal } from '../../lib/plan/sesion'
import { callar, hablar } from '../../lib/voz'
import e from '../Evaluacion/evaluacion.module.css'

/* 5 minutos para pasar las ganas: 2 de respiración con exhalación larga (4 s adentro, 6 s afuera)
   y 3 de movimiento. Las exhalaciones largas ayudan a bajar los nervios (ESPECIFICACION.md 13.2). */

const INHALA = 4
const EXHALA = 6
const RESPIRACION = 120
const BLOQUES = [
  { id: 'marcha-rodillas-altas', texto: 'Marchá en el lugar, rodillas altas', seg: 60 },
  { id: 'sentadilla', texto: 'Sentadillas lentas, a tu ritmo', seg: 60 },
  { id: 'caminata-rapida', texto: 'Caminá por la casa o salí a la puerta; tomá un vaso de agua', seg: 60 },
]
const TOTAL = RESPIRACION + BLOQUES.reduce((a, b) => a + b.seg, 0)

/** Círculo que crece al inhalar y se achica al exhalar. */
function Respiracion({ fase, progreso }: { fase: 'inhala' | 'exhala'; progreso: number }) {
  const r = fase === 'inhala' ? 34 + 40 * progreso : 74 - 40 * progreso
  return (
    <svg viewBox="0 0 320 190" width="100%" role="img" aria-label={fase === 'inhala' ? 'Inhalá por la nariz' : 'Exhalá lento por la boca'}>
      <circle cx={160} cy={92} r={78} fill="none" stroke="var(--line)" strokeDasharray="4 6" />
      <circle cx={160} cy={92} r={r} fill={fase === 'inhala' ? 'var(--soft-tint)' : 'var(--accent-tint)'} stroke={fase === 'inhala' ? 'var(--soft)' : 'var(--accent)'} strokeWidth={3} />
      <text x={160} y={88} textAnchor="middle" fill="var(--text)" fontSize={20} fontWeight={700} fontFamily="var(--font-display)">
        {fase === 'inhala' ? 'INHALÁ' : 'EXHALÁ'}
      </text>
      <text x={160} y={110} textAnchor="middle" fill="var(--muted)" fontSize={12} fontFamily="var(--font-body)">
        {fase === 'inhala' ? `por la nariz · ${INHALA} s` : `lento por la boca · ${EXHALA} s`}
      </text>
      <text x={160} y={184} textAnchor="middle" fill="var(--muted)" fontSize={12} fontFamily="var(--font-body)">
        Hombros sueltos, la panza se infla al inhalar
      </text>
    </svg>
  )
}

export function Ganas() {
  const navegar = useNavigate()
  const [inicio, setInicio] = useState<number | null>(null)
  const [t, setT] = useState(0)
  const [fin, setFin] = useState(false)
  const [superadas, setSuperadas] = useState<number | null>(null)
  const avisos = useRef(new Set<string>())
  usarPantallaEncendida(inicio !== null && !fin)

  useEffect(() => {
    void leerTipo<{ superadas: boolean }>('ganas').then((l) => setSuperadas(l.filter((x) => x.superadas).length))
  }, [])

  useEffect(() => {
    if (inicio === null || fin) return
    const id = setInterval(() => {
      const s = (performance.now() - inicio) / 1000
      setT(s)
      const avisar = (clave: string, f: () => void) => {
        if (!avisos.current.has(clave)) {
          avisos.current.add(clave)
          f()
        }
      }
      if (s < RESPIRACION) {
        const ciclo = Math.floor(s / (INHALA + EXHALA))
        const enCiclo = s % (INHALA + EXHALA)
        if (ciclo < 3) avisar(`${ciclo}-${enCiclo < INHALA ? 'i' : 'e'}`, () => hablar(enCiclo < INHALA ? 'Inhalá' : 'Exhalá despacio'))
      } else {
        let acum = RESPIRACION
        BLOQUES.forEach((b, i) => {
          if (s >= acum) avisar(`b${i}`, () => {
            pitido(880, 200)
            vibrar(120)
            hablar(b.texto)
          })
          acum += b.seg
        })
      }
      if (s >= TOTAL) {
        clearInterval(id)
        pitido(990, 300)
        hablar('Listo. Cinco minutos.')
        setFin(true)
      }
    }, 100)
    return () => clearInterval(id)
  }, [inicio, fin])

  async function responder(ok: boolean) {
    await guardarTipo('ganas', fechaLocal(), { fecha: fechaLocal(), superadas: ok })
    callar()
    navegar('/', { replace: true })
  }

  const volver = (
    <button
      type="button"
      className={e.volver}
      onClick={() => {
        callar()
        navegar(-1)
      }}
      aria-label="Salir"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )

  if (fin) {
    return (
      <div className={e.pantalla}>
        <h1 className={e.titulo}>¿Cómo estás ahora?</h1>
        <p className={e.para}>Las ganas suben y bajan como una ola. Cada vez que la dejás pasar, la próxima cuesta un poco menos.</p>
        <Boton variante="principal" ancho onClick={() => void responder(true)}>
          Se me pasaron
        </Boton>
        <Boton
          ancho
          onClick={() => {
            avisos.current.clear()
            setT(0)
            setFin(false)
            setInicio(performance.now())
          }}
        >
          Otros 5 minutos
        </Boton>
        <Boton ancho onClick={() => void responder(false)}>
          Fumé igual (no pasa nada, seguimos)
        </Boton>
      </div>
    )
  }

  if (inicio === null) {
    return (
      <div className={e.pantalla}>
        <div className={e.arriba}>{volver}</div>
        <header>
          <h1 className={e.titulo}>Tengo ganas de fumar</h1>
          <p className={e.para}>5 minutos: 2 de respiración lenta y 3 de movimiento. Las ganas fuertes pasan; vamos a atravesarlas juntos.</p>
        </header>
        <Tarjeta>
          <div className={e.dibujo}>
            <Respiracion fase="exhala" progreso={0.3} />
          </div>
          <p className={estilos.texto2}>Inhalá por la nariz 4 segundos y soltá el aire lento por la boca 6 segundos: la exhalación larga ayuda a bajar los nervios.</p>
        </Tarjeta>
        {superadas !== null && superadas > 0 && (
          <p className={estilos.chico}>
            Ya dejaste pasar las ganas {superadas} {superadas === 1 ? 'vez' : 'veces'} con esto.
          </p>
        )}
        <Boton
          variante="principal"
          ancho
          onClick={() => {
            avisos.current.clear()
            setT(0)
            setFin(false)
            setInicio(performance.now())
          }}
        >
          Empezar
        </Boton>
      </div>
    )
  }

  const resta = Math.max(0, Math.ceil(TOTAL - t))
  let contenido
  if (t < RESPIRACION) {
    const enCiclo = t % (INHALA + EXHALA)
    const fase = enCiclo < INHALA ? 'inhala' : 'exhala'
    const progreso = fase === 'inhala' ? enCiclo / INHALA : (enCiclo - INHALA) / EXHALA
    contenido = <Respiracion fase={fase} progreso={progreso} />
  } else {
    let acum = RESPIRACION
    const bloque = BLOQUES.find((b) => {
      acum += b.seg
      return t < acum
    }) ?? BLOQUES[BLOQUES.length - 1]
    contenido = (
      <>
        <DibujoEjercicio id={bloque.id} />
        <p className={estilos.texto2} style={{ textAlign: 'center' }}>
          <b>{bloque.texto}</b>
        </p>
      </>
    )
  }

  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        {volver}
        <span className={e.contador}>
          {Math.floor(resta / 60)}:{String(resta % 60).padStart(2, '0')}
        </span>
      </div>
      <div className={e.dibujo}>{contenido}</div>
      <p className={estilos.chico} style={{ textAlign: 'center' }}>
        {t < RESPIRACION ? 'Respiración' : 'Movimiento'} · quedan {Math.floor(resta / 60)}:{String(resta % 60).padStart(2, '0')}
      </p>
    </div>
  )
}
