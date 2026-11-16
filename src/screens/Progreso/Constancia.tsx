import { useEffect, useState } from 'react'
import { Tarjeta, estilos } from '../../components/ui'
import { metaFinal } from '../../lib/calc/pasos'
import { records, sugerir } from '../../lib/calc/progresion'
import { db } from '../../lib/db/db'
import { leerAgua, leerControles, leerPasos, leerTipo, sesionesHechas } from '../../lib/diario'
import { ejercicio } from '../../lib/ejercicios'
import { logros, racha, revisionMes, semanasSinDobleFalta, sesionesQueCuentan, type Logro, type RevisionMes } from '../../lib/habitos'
import { leerPlan } from '../../lib/plan/usarPlan'
import { todasLasSesiones } from '../../lib/registroEjercicios'
import p from '../Plan/plan.module.css'

function Medalla({ logrado }: { logrado: boolean }) {
  const c = logrado ? 'var(--done)' : 'var(--line)'
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true">
      <path d="M9,2 L15,16 M25,2 L19,16" stroke={logrado ? 'var(--accent)' : 'var(--line)'} strokeWidth={4} strokeLinecap="round" />
      <circle cx={17} cy={26} r={12} fill={logrado ? 'var(--done-tint)' : 'none'} stroke={c} strokeWidth={3} />
      {logrado && <path d="M12,26 l4,4 l7,-8" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

export function ConstanciaProgreso({ edad }: { edad: number }) {
  const [datos, setDatos] = useState<{ logros: Logro[]; revision: RevisionMes; racha: number; dias: number } | null>(null)

  useEffect(() => {
    void (async () => {
      const [plan, hechas, evaluaciones, controles, agua, pasos, medidas, fotos, ejercicios] = await Promise.all([
        leerPlan(),
        sesionesHechas(),
        db.evaluaciones.count(),
        leerControles(),
        leerAgua(),
        leerPasos(),
        leerTipo('medidas'),
        db.fotos.count(),
        todasLasSesiones(),
      ])
      const fechas = hechas.map((s) => s.fecha.slice(0, 10))
      const planeadas = sesionesQueCuentan(plan).length
      const r = racha(fechas, planeadas)
      const lista = logros({
        sesiones: fechas,
        evaluaciones,
        controles: controles.map((c) => c.fecha),
        diasAgua: agua.filter((a) => a.ml > 0).map((a) => a.fecha),
        diasPasosMeta: pasos.filter((d) => d.pasos >= metaFinal(edad)).length,
        medidas: medidas.length,
        fotos,
        rachaSemanas: r,
        semanasSinDobleFalta: semanasSinDobleFalta(plan, fechas),
      })
      // Revisión de los últimos 30 días.
      // Solo desde que existe el plan (máximo 30 días), para no contar como faltas los días previos.
      const dias = plan ? Math.min(30, Math.max(0, Math.floor((Date.now() - new Date(plan.creado).getTime()) / 86_400_000))) : 0
      const desde = new Date(Date.now() - Math.max(1, dias) * 86_400_000).toISOString()
      const delMes = hechas.filter((s) => s.fecha >= desde).length
      const ids = [...new Set(ejercicios.filter((s) => s.fecha >= desde).map((s) => s.ejercicio))]
      const mejoras: string[] = []
      const estancados: string[] = []
      for (const id of ids) {
        const e = ejercicio(id)
        if (!e) continue
        const propias = ejercicios.filter((s) => s.ejercicio === id)
        const antes = records(propias.filter((s) => s.fecha < desde))
        const ahora = records(propias)
        const mejor = (ahora.maximoEstimado ?? ahora.repsMax ?? 0) > (antes.maximoEstimado ?? antes.repsMax ?? 0)
        if (mejor && propias.some((s) => s.fecha < desde)) mejoras.push(e.nombre)
        if (sugerir(propias, { carga: e.carga, rango: e.rango }).tipo === 'estancado') estancados.push(e.nombre)
      }
      setDatos({ logros: lista, racha: r, dias, revision: revisionMes(delMes, Math.round((planeadas * Math.max(1, dias)) / 7), mejoras, estancados) })
    })()
  }, [edad])

  if (!datos) return null
  const { revision } = datos
  const conseguidos = datos.logros.filter((l) => l.logrado).length

  return (
    <>
      {datos.dias < 7 ? (
        <Tarjeta>
          <p className="etiqueta">Revisión del mes</p>
          <p className={estilos.texto2}>Tu plan tiene menos de una semana. La revisión aparece cuando haya datos para comparar.</p>
        </Tarjeta>
      ) : (
        <Tarjeta>
          <p className="etiqueta">Revisión de los últimos {datos.dias} días</p>
          <div className={p.cabeza}>
            <h2>{Math.round(revision.cumplimiento * 100)} %</h2>
            <span className={p.meta}>
              {revision.hechas} de {revision.planeadas} sesiones
            </span>
          </div>
          <div className={p.pista} aria-hidden="true">
            <b className={revision.cumplimiento >= 0.7 ? p.ok : p.falta} style={{ width: `${Math.max(2, revision.cumplimiento * 100)}%` }} />
          </div>
          {revision.mejoras.length > 0 && <p className={estilos.texto2}>Mejoraste en: {revision.mejoras.join(', ')}.</p>}
          {revision.estancados.length > 0 && <p className={estilos.texto2}>Sin mejorar hace 3 sesiones: {revision.estancados.join(', ')}.</p>}
          <p className={estilos.texto2}>
            <b>Para el mes que viene:</b> {revision.sugerencia}
          </p>
        </Tarjeta>
      )}
      <Tarjeta>
        <p className="etiqueta">
          Logros · {conseguidos} de {datos.logros.length}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {datos.logros.map((l) => (
            <div
              key={l.id}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: 8,
                borderRadius: 12,
                background: 'var(--surface-2)',
                opacity: l.logrado ? 1 : 0.75,
              }}
            >
              <Medalla logrado={l.logrado} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <b style={{ fontSize: 13.5 }}>{l.nombre}</b>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l.logrado ? l.texto : l.progreso}</span>
              </span>
            </div>
          ))}
        </div>
        <p className={estilos.chico}>Los logros premian la constancia, no el rendimiento.</p>
      </Tarjeta>
    </>
  )
}
