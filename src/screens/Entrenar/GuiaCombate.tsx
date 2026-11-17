import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Tarjeta, estilos } from '../../components/ui'
import { DibujoGuardia, DibujoPies, DibujoTecnica } from '../../content/dibujos-combate'
import { tecnica } from '../../lib/combate'
import { nombreCorto, rondaPies, rondasSombra, type Ronda } from '../../lib/plan/marcial'
import { hablar } from '../../lib/voz'
import x from '../Ejercicios/ejercicios.module.css'

export interface EstadoRonda {
  ronda: number
  fase: 'trabajo' | 'descanso'
  segundos: number
  rondas: number
}

/** Qué hacer en cada round de sombra o de juego de pies cuando aparecen dentro de un entrenamiento cualquiera. */
export function guiaRondas(tipo: 'sombra' | 'pies', arte: string, rondas: number, nivelSombra: number, nivelPies: number): Ronda[] {
  if (tipo === 'pies') {
    const r = rondaPies(arte, nivelPies)
    return Array.from({ length: rondas }, () => r)
  }
  return rondasSombra(arte, rondas, nivelSombra)
}

/** Lo que dice la voz al empezar cada fase. */
export function textoVoz(tipo: 'sombra' | 'pies', rs: Ronda[], e: EstadoRonda): string {
  const r = rs[e.ronda - 1]
  if (e.fase === 'descanso') {
    const sig = rs[e.ronda]
    return sig ? `Descanso. Sigue: round ${e.ronda + 1}, ${sig.titulo}.` : 'Descanso.'
  }
  const nombre = tipo === 'pies' ? 'Juego de pies' : `Round ${e.ronda}`
  return `${nombre}. ${r?.titulo ?? ''}. ${r?.que[0] ?? ''}`
}

const BASICO_SOMBRA = [
  'Sombra es pelear contra un rival imaginario: golpeás al aire, sin fuerza al principio y con la técnica perfecta.',
  'Guardia: pies al ancho de los hombros, uno adelante; manos a la altura de la cara, codos cerrados y mentón abajo.',
  'Después de cada golpe, la mano vuelve a la cara. Respirá soltando el aire en cada golpe.',
]
const BASICO_PIES = [
  'Juego de pies es moverte sin perder la guardia ni la base: pasos cortos, sobre la parte de adelante de los pies.',
  'Nunca cruces ni juntes los pies.',
]

function Tecnicas({ ids }: { ids: string[] }) {
  return (
    <div className={x.filtros}>
      {ids.map((id) => (
        <Link key={id} to={`/combate/tecnica/${id}`} className={x.item} style={{ flexShrink: 0, width: 120, minHeight: 0, padding: 6 }}>
          <DibujoTecnica id={id} />
          <span className={x.itemDetalle}>{tecnica(id)?.nombre}</span>
        </Link>
      ))}
    </div>
  )
}

export function GuiaCombate({
  tipo,
  arte,
  nivelSombra,
  nivelPies,
  estado,
  rondas,
}: {
  tipo: 'sombra' | 'pies'
  arte: string
  nivelSombra: number
  nivelPies: number
  estado: EstadoRonda | null
  rondas: number
}) {
  const total = estado?.rondas ?? rondas
  const rs = useMemo(() => guiaRondas(tipo, arte, total, nivelSombra, nivelPies), [tipo, arte, total, nivelSombra, nivelPies])

  // A mitad de cada round, la voz recuerda la segunda indicación.
  useEffect(() => {
    if (!estado || estado.fase !== 'trabajo') return
    const segunda = rs[estado.ronda - 1]?.que[1]
    if (!segunda || estado.segundos < 40) return
    const id = setTimeout(() => hablar(segunda), (estado.segundos / 2) * 1000)
    return () => clearTimeout(id)
  }, [estado, rs])

  const nombreArte = nombreCorto(arte).toLowerCase()
  if (!estado) {
    const r1 = rs[0]
    return (
      <Tarjeta destacada>
        <p className="etiqueta">{tipo === 'pies' ? 'Cómo se hace' : `Cómo se hace · ${nombreArte}`}</p>
        {tipo === 'pies' ? <DibujoPies nivel={r1?.nivelPies ?? 1} /> : <DibujoGuardia />}
        <ul className={x.seccion} style={{ margin: 0 }}>
          {(tipo === 'pies' ? BASICO_PIES : BASICO_SOMBRA).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {tipo === 'sombra' && (
          <>
            <p className="etiqueta" style={{ margin: '4px 0 0' }}>
              Tus rounds
            </p>
            <ol className={x.seccion} style={{ margin: 0 }}>
              {rs.map((r, k) => (
                <li key={k}>{r.titulo}</li>
              ))}
            </ol>
          </>
        )}
        <p className={estilos.chico}>Tocá Empezar: en cada round te digo qué hacer{tipo === 'sombra' ? ' y te muestro las técnicas' : ''}. Con la voz activada, también te lo digo en voz alta.</p>
      </Tarjeta>
    )
  }

  const enDescanso = estado.fase === 'descanso'
  const r = rs[enDescanso ? estado.ronda : estado.ronda - 1]
  if (!r) return null
  return (
    <Tarjeta destacada>
      <p className="etiqueta">{enDescanso ? `Sigue: round ${estado.ronda + 1}` : `Round ${estado.ronda} de ${estado.rondas}`}</p>
      <h2 style={{ margin: 0, fontSize: 22 }}>{r.titulo}</h2>
      <ul className={x.seccion} style={{ margin: 0 }}>
        {(enDescanso ? r.que.slice(0, 1) : r.que).map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
      {r.tecnicas?.length ? <Tecnicas ids={r.tecnicas} /> : r.nivelPies ? <DibujoPies nivel={r.nivelPies} /> : null}
    </Tarjeta>
  )
}
