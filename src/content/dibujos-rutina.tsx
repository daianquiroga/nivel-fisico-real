/* Dibujos del análisis de la rutina: mapa de músculos (frente y espalda) y barras de aporte. */
import { Lienzo, Texto } from '../components/Figura'
import volumen from './normas/volumen.json'

const color = (series: number | undefined) => {
  if (series === undefined) return 'var(--surface-2)'
  if (series <= 0) return 'var(--surface-2)'
  if (series < volumen.bajo) return 'rgba(217, 74, 100, 0.55)'
  if (series < volumen.bueno) return 'rgba(226, 184, 97, 0.65)'
  return 'var(--done)'
}

/** Silueta con cada grupo pintado según las series semanales: gris nada, rojo poco, dorado moderado, verde 10 o más. */
export function MapaMusculos({ series }: { series: Record<string, number> }) {
  const s = (id: string) => ({ fill: color(series[id]), stroke: 'var(--bg)', strokeWidth: 1.5 })
  const neutro = { fill: 'var(--surface-2)', stroke: 'var(--bg)', strokeWidth: 1.5 }
  const cuerpo = (cx: number, frente: boolean) => (
    <g>
      <circle cx={cx} cy={22} r={12} {...neutro} />
      <rect x={cx - 5} y={33} width={10} height={8} {...neutro} />
      {/* hombros */}
      <circle cx={cx - 27} cy={52} r={10} {...s('hombros')} />
      <circle cx={cx + 27} cy={52} r={10} {...s('hombros')} />
      {frente ? (
        <>
          <rect x={cx - 22} y={44} width={21} height={26} rx={6} {...s('pecho')} />
          <rect x={cx + 1} y={44} width={21} height={26} rx={6} {...s('pecho')} />
          <rect x={cx - 14} y={72} width={28} height={42} rx={6} {...s('tronco')} />
          <ellipse cx={cx - 33} cy={80} rx={7} ry={15} {...s('biceps')} />
          <ellipse cx={cx + 33} cy={80} rx={7} ry={15} {...s('biceps')} />
        </>
      ) : (
        <>
          <path d={`M${cx - 22},44 L${cx + 22},44 L${cx + 16},100 L${cx - 16},100 Z`} {...s('espalda')} />
          <rect x={cx - 16} y={100} width={32} height={14} rx={4} {...s('tronco')} />
          <ellipse cx={cx - 33} cy={80} rx={7} ry={15} {...s('triceps')} />
          <ellipse cx={cx + 33} cy={80} rx={7} ry={15} {...s('triceps')} />
        </>
      )}
      <ellipse cx={cx - 37} cy={110} rx={5} ry={12} {...neutro} />
      <ellipse cx={cx + 37} cy={110} rx={5} ry={12} {...neutro} />
      {frente ? (
        <rect x={cx - 22} y={114} width={44} height={14} rx={5} {...neutro} />
      ) : (
        <>
          <circle cx={cx - 11} cy={124} r={12} {...s('gluteos')} />
          <circle cx={cx + 11} cy={124} r={12} {...s('gluteos')} />
        </>
      )}
      <ellipse cx={cx - 12} cy={156} rx={10} ry={22} {...s(frente ? 'cuadriceps' : 'isquios')} />
      <ellipse cx={cx + 12} cy={156} rx={10} ry={22} {...s(frente ? 'cuadriceps' : 'isquios')} />
      <ellipse cx={cx - 12} cy={194} rx={7} ry={15} {...(frente ? neutro : s('pantorrillas'))} />
      <ellipse cx={cx + 12} cy={194} rx={7} ry={15} {...(frente ? neutro : s('pantorrillas'))} />
    </g>
  )
  const leyenda: [string, string][] = [
    ['var(--surface-2)', 'nada'],
    ['rgba(217, 74, 100, 0.55)', `menos de ${volumen.bajo}`],
    ['rgba(226, 184, 97, 0.65)', `${volumen.bajo} a ${volumen.bueno - 1}`],
    ['var(--done)', `${volumen.bueno} o más`],
  ]
  return (
    <Lienzo etiqueta="Mapa de los músculos que trabaja tu rutina, de frente y de espalda" alto={250}>
      {cuerpo(80, true)}
      {cuerpo(240, false)}
      <Texto x={80} y={226}>
        frente
      </Texto>
      <Texto x={240} y={226}>
        espalda
      </Texto>
      {leyenda.map(([c, t], i) => (
        <g key={t}>
          <rect x={8 + i * 78} y={236} width={10} height={10} rx={2} fill={c} />
          <text x={22 + i * 78} y={245} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">
            {t}
          </text>
        </g>
      ))}
    </Lienzo>
  )
}

/** Tres barras: aporte físico, estético y marcial (0 a 100). */
export function BarrasAporte({ fisico, estetico, marcial }: { fisico: number; estetico: number; marcial: number }) {
  const filas: [string, number, string][] = [
    ['Físico', fisico, 'var(--done)'],
    ['Estético', estetico, 'var(--accent)'],
    ['Marcial', marcial, 'var(--soft)'],
  ]
  return (
    <Lienzo etiqueta={`Aporte: físico ${fisico}, estético ${estetico} y marcial ${marcial}, de 100`} alto={104}>
      {filas.map(([t, v, c], i) => (
        <g key={t}>
          <Texto x={8} y={24 + i * 32} ancla="start" color="var(--text-2)">
            {t}
          </Texto>
          <rect x={78} y={12 + i * 32} width={200} height={16} rx={8} fill="var(--surface-2)" />
          <rect x={78} y={12 + i * 32} width={Math.max(4, (v / 100) * 200)} height={16} rx={8} fill={c} />
          <Texto x={312} y={25 + i * 32} ancla="end" color="var(--text)">
            {String(v)}
          </Texto>
        </g>
      ))}
    </Lienzo>
  )
}
