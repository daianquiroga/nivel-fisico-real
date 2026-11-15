import type { ReactNode } from 'react'
/* Piezas para dibujar figuras de palitos en SVG: una persona por articulaciones, piso, pared y flechas.
   "I" = lado lejano (más tenue), "D" = lado cercano. */

type P = [number, number]

export interface Pose {
  cabeza: P
  cuello: P
  cadera: P
  rodI: P
  pieI: P
  rodD: P
  pieD: P
  codoI: P
  manoI: P
  codoD: P
  manoD: P
  puntaI?: P
  puntaD?: P
  ojosCerrados?: boolean
}

const linea = (a: P, b: P, c?: P) => `M${a[0]},${a[1]} L${b[0]},${b[1]}${c ? ` L${c[0]},${c[1]}` : ''}`

export function Figura({ pose, color = 'var(--text-2)' }: { pose: Pose; color?: string }) {
  const p = pose
  const trazo = { fill: 'none', stroke: color, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <g>
      <g opacity={0.45}>
        <path d={linea(p.cadera, p.rodI, p.pieI)} {...trazo} />
        {p.puntaI && <path d={linea(p.pieI, p.puntaI)} {...trazo} strokeWidth={6} />}
        <path d={linea(p.cuello, p.codoI, p.manoI)} {...trazo} />
      </g>
      <path d={linea(p.cuello, p.cadera)} {...trazo} strokeWidth={9} />
      <circle cx={p.cabeza[0]} cy={p.cabeza[1]} r={10} fill={color} />
      {p.ojosCerrados && (
        <path d={`M${p.cabeza[0] - 6},${p.cabeza[1]} q3,3 5,0 M${p.cabeza[0] + 1},${p.cabeza[1]} q3,3 5,0`} stroke="var(--bg)" strokeWidth={1.8} fill="none" />
      )}
      <path d={linea(p.cadera, p.rodD, p.pieD)} {...trazo} />
      {p.puntaD && <path d={linea(p.pieD, p.puntaD)} {...trazo} strokeWidth={6} />}
      <path d={linea(p.cuello, p.codoD, p.manoD)} {...trazo} />
    </g>
  )
}

export function Piso({ desde = 0, hasta = 320, y = 168 }: { desde?: number; hasta?: number; y?: number }) {
  return <line x1={desde} x2={hasta} y1={y} y2={y} stroke="var(--line)" strokeWidth={2} />
}

export function Pared({ x, arriba = 14, abajo = 168 }: { x: number; arriba?: number; abajo?: number }) {
  return <rect x={x} y={arriba} width={8} height={abajo - arriba} fill="var(--surface-2)" stroke="var(--line)" />
}

/** Flecha dorada. doble = puntas en los dos extremos. */
export function Flecha({ de, a, doble }: { de: P; a: P; doble?: boolean }) {
  const ang = Math.atan2(a[1] - de[1], a[0] - de[0])
  const punta = (q: P, t: number) => {
    const l = 8
    const p1: P = [q[0] - l * Math.cos(t - 0.5), q[1] - l * Math.sin(t - 0.5)]
    const p2: P = [q[0] - l * Math.cos(t + 0.5), q[1] - l * Math.sin(t + 0.5)]
    return `M${p1[0]},${p1[1]} L${q[0]},${q[1]} L${p2[0]},${p2[1]}`
  }
  return (
    <g stroke="var(--done)" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={linea(de, a)} />
      <path d={punta(a, ang)} />
      {doble && <path d={punta(de, ang + Math.PI)} />}
    </g>
  )
}

export function Texto({ x, y, children, ancla = 'middle', color = 'var(--muted)' }: { x: number; y: number; children: string; ancla?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <text x={x} y={y} textAnchor={ancla} fill={color} fontSize={12} fontFamily="var(--font-body)" fontWeight={600}>
      {children}
    </text>
  )
}

export function Lienzo({ etiqueta, children, alto = 188 }: { etiqueta: string; children: ReactNode; alto?: number }) {
  return (
    <svg viewBox={`0 0 320 ${alto}`} width="100%" role="img" aria-label={etiqueta} style={{ display: 'block' }}>
      {children}
    </svg>
  )
}

/** Silla de costado, con el respaldo a la izquierda. */
export function Silla({ x, asiento = 118 }: { x: number; asiento?: number }) {
  return (
    <g stroke="var(--muted)" strokeWidth={4} strokeLinecap="round" fill="none">
      <path d={`M${x},${asiento - 52} L${x},168 M${x},${asiento} L${x + 44},${asiento} L${x + 44},168`} />
    </g>
  )
}
