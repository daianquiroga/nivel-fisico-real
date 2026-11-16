import { useEffect, useState } from 'react'
import { Segmentado } from '../../components/controles'
import { Tarjeta, estilos } from '../../components/ui'
import type { Sexo } from '../../lib/calc/cardio'
import { MESES, fuerzaProyectada, musculoProyectado, ritmoGrasa, semanasDeMeses, vo2Proyectado } from '../../lib/calc/proyeccion'
import { nivelPorPercentil } from '../../lib/calc/puntajes'
import { sesionesHechas } from '../../lib/diario'
import type { Resultados } from '../../lib/evaluacion'
import { leerPlan } from '../../lib/plan/usarPlan'

const coma = (x: number, d = 1) => x.toFixed(d).replace('.', ',')

/** Constancia real de las últimas 4 semanas: sesiones hechas sobre sesiones planeadas (si hay datos). */
async function constanciaReal(): Promise<number | null> {
  const plan = await leerPlan()
  if (!plan) return null
  const desde = Date.now() - 28 * 86_400_000
  if (new Date(plan.creado).getTime() > Date.now() - 7 * 86_400_000) return null
  const porSemana = plan.dias.flatMap((d) => d.sesiones).filter((s) => s.tipo !== 'movilidad' && s.ejercicios.length).length
  if (!porSemana) return null
  const semanas = Math.min(4, Math.max(1, (Date.now() - new Date(plan.creado).getTime()) / (7 * 86_400_000)))
  const hechas = (await sesionesHechas()).filter((s) => new Date(s.fecha).getTime() >= desde).length
  return Math.max(0.1, Math.min(1, hechas / (porSemana * semanas)))
}

function Lineas({ series, unidad, etiqueta }: { series: { nombre: string; color: string; valores: number[]; punteada?: boolean }[]; unidad: string; etiqueta: string }) {
  const meses = [0, ...MESES]
  const todos = series.flatMap((s) => s.valores)
  const min = Math.min(...todos)
  const max = Math.max(...todos)
  const an = 340
  const al = 150
  const m = { i: 48, d: 12, a: 10, b: 22 }
  const x = (mes: number) => m.i + (mes / 12) * (an - m.i - m.d)
  const y = (v: number) => m.a + ((max - v) / Math.max(0.001, max - min)) * (al - m.a - m.b)
  const estilo = { fontSize: 11, fill: 'var(--muted)' }
  return (
    <svg viewBox={`0 0 ${an} ${al}`} width="100%" role="img" aria-label={etiqueta}>
      {[min, max].map((v) => (
        <g key={v}>
          <line x1={m.i} x2={an - m.d} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={m.i - 6} y={y(v) + 4} textAnchor="end" style={estilo}>
            {coma(v, unidad === '%' ? 0 : 1)}
            {unidad === '%' ? '%' : ''}
          </text>
        </g>
      ))}
      {meses.map((mes) => (
        <text key={mes} x={x(mes)} y={al - 5} textAnchor="middle" style={estilo}>
          {mes === 0 ? 'hoy' : `${mes}m`}
        </text>
      ))}
      {series.map((s) => (
        <path
          key={s.nombre}
          d={s.valores.map((v, i) => `${i ? 'L' : 'M'}${x(meses[i]).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2.5}
          strokeDasharray={s.punteada ? '5 4' : undefined}
        />
      ))}
    </svg>
  )
}

export function Proyeccion({ r, edad, sexo, pesoKg }: { r: Resultados; edad: number; sexo: Sexo; pesoKg?: number }) {
  const [real, setReal] = useState<number | null | undefined>(undefined)
  const [area, setArea] = useState<'cardio' | 'fuerza'>(r.vo2 !== undefined ? 'cardio' : 'fuerza')
  useEffect(() => {
    void constanciaReal().then(setReal)
  }, [])
  if (real === undefined) return null
  const estimada = real ?? 0.75
  const escenarios = [
    { nombre: 'Siempre (100 %)', c: 1, color: 'var(--done)' },
    { nombre: `${real === null ? 'Estimada' : 'Tu constancia real'} (${Math.round(estimada * 100)} %)`, c: estimada, color: 'var(--accent)' },
    { nombre: 'La mitad (50 %)', c: 0.5, color: 'var(--muted)', punteada: true },
  ]
  const nivelCardio = r.areas.cardio !== undefined ? nivelPorPercentil(r.areas.cardio).nivel : 2
  const nivelFuerza = r.areas.fuerza !== undefined ? nivelPorPercentil(r.areas.fuerza).nivel : 2
  const meses = [0, ...MESES]
  const valores = (c: number) =>
    meses.map((mes) =>
      area === 'cardio' && r.vo2 !== undefined
        ? vo2Proyectado(r.vo2, nivelCardio, edad, semanasDeMeses(mes), c)
        : fuerzaProyectada(nivelFuerza, edad, semanasDeMeses(mes), c),
    )
  const series = escenarios.map((e) => ({ nombre: e.nombre, color: e.color, punteada: e.punteada, valores: valores(e.c) }))
  const unidad = area === 'cardio' ? 'ml/kg/min' : '%'

  return (
    <Tarjeta>
      <p className="etiqueta">Proyección · a dónde podés llegar</p>
      {r.vo2 !== undefined && (
        <Segmentado<'cardio' | 'fuerza'>
          etiqueta="Área"
          opciones={[
            { valor: 'cardio', texto: 'Cardio (VO2máx)' },
            { valor: 'fuerza', texto: 'Fuerza' },
          ]}
          valor={area}
          onCambio={setArea}
        />
      )}
      <Lineas series={series} unidad={unidad} etiqueta={`Proyección de ${area === 'cardio' ? 'cardio' : 'fuerza'} a 12 meses`} />
      <div className={estilos.chico} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {series.map((s) => (
          <span key={s.nombre}>
            <span style={{ color: s.color }}>{s.punteada ? '┄' : '━'}</span> {s.nombre}: a 3 meses {coma(s.valores[2], area === 'cardio' ? 1 : 0)}
            {area === 'cardio' ? '' : '%'}, a 12 meses {coma(s.valores[5], area === 'cardio' ? 1 : 0)}
            {area === 'cardio' ? ` ${unidad}` : '% más fuerte'}
          </span>
        ))}
      </div>
      {pesoKg && (
        <p className={estilos.texto2}>
          {(() => {
            const [a3, b3] = musculoProyectado(pesoKg, sexo, nivelFuerza, edad, 3, estimada)
            const [a12, b12] = musculoProyectado(pesoKg, sexo, nivelFuerza, edad, 12, estimada)
            const [g1, g2] = ritmoGrasa(pesoKg)
            return `Músculo: entre ${coma(a3)} y ${coma(b3)} kg en 3 meses y ${coma(a12)} a ${coma(b12)} kg en un año, si comés suficiente proteína. Grasa: el ritmo recomendado para bajar es de ${coma(g1)} a ${coma(g2)} kg por semana (depende sobre todo de la comida).`
          })()}
        </p>
      )}
      <p className={estilos.chico}>
        Estimación orientativa: usa ritmos promedio de estudios (por ejemplo, el VO2máx sube 10 a 20 % en 8 a 12 semanas en personas no entrenadas) y una
        curva que se frena al acercarse a tu techo. El ritmo baja con la edad y el nivel. Tu resultado real puede ser distinto; se recalcula con cada
        evaluación.
      </p>
    </Tarjeta>
  )
}
