/** Gráfico de línea simple para ver la evolución de un número en el tiempo. */
export function GraficoLinea({ puntos, etiqueta, unidad = '' }: { puntos: { fecha: string; valor: number }[]; etiqueta: string; unidad?: string }) {
  if (puntos.length < 2) return null
  const an = 340
  const al = 130
  const m = { i: 54, d: 10, a: 12, b: 22 }
  const vals = puntos.map((p) => p.valor)
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  if (max - min < 1) {
    max += 1
    min -= 1
  }
  const x = (i: number) => m.i + (i * (an - m.i - m.d)) / (puntos.length - 1)
  const y = (v: number) => m.a + ((max - v) * (al - m.a - m.b)) / (max - min)
  const camino = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ')
  const f = (iso: string) => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(iso))
  const n = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')
  const estiloTexto = { fontSize: 11, fill: 'var(--muted)' }
  return (
    <svg viewBox={`0 0 ${an} ${al}`} width="100%" role="img" aria-label={etiqueta}>
      {[min, max].map((v) => (
        <g key={v}>
          <line x1={m.i} x2={an - m.d} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={m.i - 6} y={y(v) + 4} textAnchor="end" style={estiloTexto}>
            {n(v)}
            {unidad}
          </text>
        </g>
      ))}
      <path d={camino} fill="none" stroke="var(--done)" strokeWidth="2.5" strokeLinejoin="round" />
      {puntos.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.valor)} r="3.5" fill="var(--done)" />
      ))}
      <text x={x(0)} y={al - 4} style={estiloTexto}>
        {f(puntos[0].fecha)}
      </text>
      <text x={x(puntos.length - 1)} y={al - 4} textAnchor="end" style={estiloTexto}>
        {f(puntos[puntos.length - 1].fecha)}
      </text>
    </svg>
  )
}
