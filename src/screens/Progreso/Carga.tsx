import { useEffect, useState } from 'react'
import { Lienzo, Texto } from '../../components/Figura'
import { Tarjeta, estilos } from '../../components/ui'
import { BAJADA, SUBIDA, cargasSemanales, estadoCarga } from '../../lib/calc/carga'
import { sesionesHechas } from '../../lib/diario'
import x from '../Ejercicios/ejercicios.module.css'

const TEXTO = {
  'sin-datos': 'Cuando anotes qué tan dura fue cada sesión durante 3 semanas, acá vas a ver si tu carga sube de golpe.',
  normal: 'Tu carga de esta semana está en línea con las anteriores. Así se progresa sin pasarse.',
  subida: 'Esta semana cargaste mucho más que las anteriores. Si te sentís cansado o con molestias, la semana que viene bajá un poco: subí de a poco.',
  bajada: 'Esta semana entrenaste bastante menos que las anteriores. Si fue a propósito (descanso o semana liviana), está perfecto.',
}

/** Carga semanal = esfuerzo × minutos de cada sesión (método session-RPE). Últimas 4 semanas en barras. */
export function Carga() {
  const [semanas, setSemanas] = useState<number[] | null>(null)
  const [sinEsfuerzo, setSinEsfuerzo] = useState(0)
  useEffect(() => {
    void sesionesHechas().then((s) => {
      setSemanas(cargasSemanales(s))
      const hace28 = Date.now() - 28 * 86_400_000
      setSinEsfuerzo(s.filter((x) => !x.esfuerzo && new Date(x.fecha).getTime() > hace28).length)
    })
  }, [])
  if (!semanas) return null
  const { estado, promedio } = estadoCarga(semanas)
  const max = Math.max(1, ...semanas, promedio * SUBIDA)
  const alto = (v: number) => (v / max) * 110
  const etiquetas = ['hace 3', 'hace 2', 'hace 1', 'últimos 7 días']
  return (
    <Tarjeta>
      <p className="etiqueta">Carga de entrenamiento</p>
      <Lienzo etiqueta={`Carga de las últimas 4 semanas: ${semanas.join(', ')}`} alto={170}>
        {promedio > 0 && (
          <>
            <rect x={10} y={140 - alto(promedio * SUBIDA)} width={300} height={alto(promedio * SUBIDA) - alto(promedio * BAJADA)} fill="var(--done)" opacity={0.12} />
            <Texto x={312} y={136 - alto(promedio * SUBIDA)} ancla="end">zona normal</Texto>
          </>
        )}
        {semanas.map((v, i) => (
          <g key={i}>
            <rect x={22 + i * 74} y={140 - alto(v)} width={50} height={Math.max(2, alto(v))} rx={6} fill={i === 3 ? (estado === 'subida' ? 'var(--accent)' : 'var(--done)') : 'var(--muted)'} />
            <Texto x={47 + i * 74} y={134 - alto(v)}>{String(v)}</Texto>
            <Texto x={47 + i * 74} y={160}>{etiquetas[i]}</Texto>
          </g>
        ))}
      </Lienzo>
      <p className={estilos.texto2} style={{ color: estado === 'subida' ? 'var(--accent)' : undefined }}>
        {TEXTO[estado]}
      </p>
      {sinEsfuerzo > 0 && <p className={estilos.chico}>{sinEsfuerzo} sesiones de las últimas 4 semanas no tienen el esfuerzo anotado y no cuentan.</p>}
      <details className={x.detalle}>
        <summary>¿Cómo se calcula?</summary>
        <p>
          Cada sesión suma esfuerzo (1 a 10) × minutos: por ejemplo, 7 × 45 = 315. Es un método validado para medir cuánto te exigís (Foster y otros 2001; revisión de Haddad y otros 2017).
        </p>
        <p>
          La franja verde va de la mitad a 1,5 veces tu promedio de las 3 semanas anteriores: ese corte es decisión de la app. Sirve para ver cambios bruscos, no predice lesiones (Impellizzeri y otros 2020).
        </p>
      </details>
    </Tarjeta>
  )
}
