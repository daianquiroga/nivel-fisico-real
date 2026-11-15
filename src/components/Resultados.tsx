import { NOMBRES_AREA, PESOS, nivelPorPercentil, type Area } from '../lib/calc/puntajes'
import type { Evaluacion } from '../lib/db/db'
import type { Prueba, Resultados } from '../lib/evaluacion'
import { Link } from 'react-router-dom'
import { TiposDeCuerpo } from '../content/ilustraciones'
import tiposCuerpo from '../content/tipos-cuerpo.json'
import { tendenciaActual } from '../lib/calc/tipoCuerpo'
import { Tarjeta, estilos } from './ui'
import s from './resultados.module.css'

const coma = (x: number, dec = 0) => x.toFixed(dec).replace('.', ',')

export function resultadosDe(e: Evaluacion): Resultados {
  return e.resultados as unknown as Resultados
}

export function fechaCorta(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function Anillo({ valor }: { valor: number }) {
  const r = 52
  const largo = 2 * Math.PI * r
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`Condición física ${Math.round(valor)} de 100`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="var(--done)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(largo * valor) / 100} ${largo}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="80" textAnchor="middle" className={s.numeroGrande}>
        {Math.round(valor)}
      </text>
    </svg>
  )
}

export function Pista({ percentil }: { percentil: number }) {
  const { nivel, avance } = nivelPorPercentil(percentil)
  return (
    <div className={s.pista} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n}>
          <b style={{ width: n < nivel ? '100%' : n === nivel ? `${Math.max(8, avance * 100)}%` : 0 }} />
        </i>
      ))}
    </div>
  )
}

const PRUEBAS_DE_AREA: Record<Area, Prueba[]> = {
  cardio: ['cardio'],
  fuerza: ['sentarse', 'flexiones', 'plancha'],
  composicion: [],
  movilidad: ['rodilla'],
  equilibrio: ['equilibrio'],
}

export function VistaResultados({ r, edad }: { r: Resultados; edad: number }) {
  const notas = (area: Area) =>
    PRUEBAS_DE_AREA[area].map((p) => r.percentiles[p]?.nota).filter((n): n is string => Boolean(n))

  return (
    <>
      {r.condicion !== undefined ? (
        <Tarjeta destacada>
          <div className={s.anillo}>
            <Anillo valor={r.condicion} />
            <div>
              <p className="etiqueta">Condición física</p>
              <p className={s.nivel}>
                Nivel {nivelPorPercentil(r.condicion).nivel} · {nivelPorPercentil(r.condicion).nombre}
              </p>
              <p className={s.nota}>
                Estás mejor que {Math.round(r.condicion)} de cada 100 personas de tu edad y sexo.
                {r.parcial ? ' Es un resultado parcial: faltan áreas.' : ''}
              </p>
            </div>
          </div>
        </Tarjeta>
      ) : (
        <Tarjeta>
          <p className="etiqueta">Condición física</p>
          <p className={s.nota}>No alcanzan los datos para calcularla. Completá al menos una prueba más.</p>
        </Tarjeta>
      )}

      <div className={s.grilla}>
        {r.edadFisica !== undefined && (
          <div className={s.dato}>
            <span>Edad física</span>
            <b>{Math.round(r.edadFisica)}</b>
            <span>
              {Math.round(r.edadFisica) < edad
                ? `${edad - Math.round(r.edadFisica)} años menos que tu edad`
                : Math.round(r.edadFisica) > edad
                  ? `${Math.round(r.edadFisica) - edad} años más que tu edad`
                  : 'igual a tu edad'}
            </span>
          </div>
        )}
        {r.vo2 !== undefined && (
          <div className={s.dato}>
            <span>Cardio (VO2máx)</span>
            <b>{coma(r.vo2)}</b>
            <span>
              ml/kg/min, estimado ± 5–6. Promedio de tu edad: {coma(r.vo2Promedio ?? 0)}
            </span>
          </div>
        )}
        {r.composicion && (
          <div className={s.dato}>
            <span>Cintura / altura</span>
            <b>{coma(r.composicion.relacion, 2)}</b>
            <span>Zona {r.composicion.zona.toLowerCase()}</span>
          </div>
        )}
        {r.composicion && (
          <div className={s.dato}>
            <span>Grasa estimada</span>
            <b>{coma(r.composicion.grasa)} %</b>
            <span>{r.composicion.obesidad ? 'Por encima del umbral de obesidad' : 'Por debajo del umbral de obesidad'}</span>
          </div>
        )}
        {r.pulso !== undefined && (
          <div className={s.dato}>
            <span>Pulso en reposo</span>
            <b>{r.pulso}</b>
            <span>latidos por minuto</span>
          </div>
        )}
        {r.habilidad !== undefined && r.calidad !== undefined && (
          <div className={s.dato}>
            <span>Habilidad de movimiento</span>
            <b>{Math.round(r.habilidad)}</b>
            <span>de 100 (calidad + equilibrio)</span>
          </div>
        )}
      </div>

      {r.tipoCuerpo && <TipoCuerpo t={r.tipoCuerpo} />}

      <Tarjeta>
        <p className="etiqueta">Tu nivel por área</p>
        {(Object.keys(PESOS) as Area[]).map((a) => {
          const p = r.areas[a]
          return (
            <div key={a} className={s.area}>
              <div className={s.areaFila}>
                <b>{NOMBRES_AREA[a]}</b>
                <span>{p === undefined ? 'Sin medir' : `Nivel ${nivelPorPercentil(p).nivel} · ${nivelPorPercentil(p).nombre} · ${Math.round(p)}/100`}</span>
              </div>
              {p !== undefined && <Pista percentil={p} />}
              {notas(a).map((n) => (
                <p key={n} className={s.nota}>
                  {n}
                </p>
              ))}
              {a === 'movilidad' && r.diferenciaRodillas !== undefined && r.diferenciaRodillas > 2 && (
                <p className={s.nota}>Hay más de 2 cm de diferencia entre piernas: conviene trabajar el tobillo más rígido.</p>
              )}
            </div>
          )
        })}
      </Tarjeta>

      <p className={s.nota}>
        Todos los números son estimaciones a partir de estudios publicados. Sirven para compararte
        con vos mismo en el tiempo; no son un diagnóstico médico.
      </p>
    </>
  )
}

/** Gráfico de línea simple con la condición física de cada evaluación. */
export function GraficoCondicion({ puntos }: { puntos: { fecha: string; valor: number }[] }) {
  if (puntos.length < 2) return null
  const an = 340
  const al = 140
  const m = { i: 28, d: 10, a: 10, b: 22 }
  const x = (i: number) => m.i + (i * (an - m.i - m.d)) / (puntos.length - 1)
  const y = (v: number) => m.a + ((100 - v) * (al - m.a - m.b)) / 100
  const camino = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ')
  return (
    <svg className={s.grafico} viewBox={`0 0 ${an} ${al}`} width="100%" role="img" aria-label="Evolución de tu condición física">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={m.i} x2={an - m.d} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={v === 50 ? '3 4' : undefined} />
          <text x={m.i - 6} y={y(v) + 4} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <path d={camino} fill="none" stroke="var(--done)" strokeWidth="2.5" strokeLinejoin="round" />
      {puntos.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.valor)} r="4" fill="var(--done)" />
      ))}
      <text x={x(0)} y={al - 4} textAnchor="start">
        {fechaCorta(puntos[0].fecha)}
      </text>
      <text x={x(puntos.length - 1)} y={al - 4} textAnchor="end">
        {fechaCorta(puntos[puntos.length - 1].fecha)}
      </text>
    </svg>
  )
}

const CONTEXTURAS = { chica: 'Chica', mediana: 'Mediana', grande: 'Grande' } as const

function TipoCuerpo({ t }: { t: NonNullable<Resultados['tipoCuerpo']> }) {
  const tipo = tendenciaActual(t.tendencia)
  const info = tipo ? (tiposCuerpo.tipos as Record<string, { nombre: string; descripcion: string }>)[tipo] : undefined
  return (
    <Tarjeta>
      <p className="etiqueta">Tu tipo de cuerpo (estimación casera)</p>
      {tipo && <TiposDeCuerpo activa={tipo} />}
      {info && (
        <p style={{ margin: 0 }}>
          <b>{info.nombre}.</b> {info.descripcion}
        </p>
      )}
      <div className={s.grilla}>
        {t.linealidad !== undefined && (
          <div className={s.dato}>
            <span>Linealidad (ectomorfia)</span>
            <b>{coma(t.linealidad, 1)}</b>
            <span>{t.nivelLinealidad} (escala de 0,5 a 9)</span>
          </div>
        )}
        {t.contextura && (
          <div className={s.dato}>
            <span>Contextura ósea</span>
            <b>{CONTEXTURAS[t.contextura]}</b>
            <span>según tu muñeca y altura</span>
          </div>
        )}
      </div>
      {!tipo && <p className={s.nota}>Sumá tu peso en la próxima evaluación para ver tu tipo.</p>}
      <Link to="/tipo-cuerpo" className={estilos.boton}>
        Qué significa y cómo entrenar con tu tipo
      </Link>
    </Tarjeta>
  )
}
