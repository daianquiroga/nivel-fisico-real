/* Conversión de un resultado a percentil (1 a 99) según tablas de referencia.
   Métodos descriptos en EVALUACION.md, sección 8. */

export function limitar(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x))
}

/** Función de distribución normal estándar (aproximación de Abramowitz y Stegun 7.1.26). */
export function normalAcumulada(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) *
      Math.exp(-(z * z) / 2)
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

export function percentilNormal(x: number, media: number, desvio: number, menorEsMejor = false): number {
  const z = (x - media) / desvio
  return limitar(100 * normalAcumulada(menorEsMejor ? -z : z), 1, 99)
}

/** Percentil a partir de puntos conocidos (percentil → valor), con valores crecientes.
    Entre puntos, interpolación lineal; fuera del rango, normal con desvío = (P75 − P25) / 1,35. */
export function percentilDesdePuntos(x: number, puntos: { p: number; v: number }[]): number {
  const ord = [...puntos].sort((a, b) => a.p - b.p)
  const primero = ord[0]
  const ultimo = ord[ord.length - 1]
  if (x >= primero.v && x <= ultimo.v) {
    for (let i = 1; i < ord.length; i++) {
      const a = ord[i - 1]
      const b = ord[i]
      if (x <= b.v) {
        if (b.v === a.v) return limitar(b.p, 1, 99)
        return limitar(a.p + ((x - a.v) / (b.v - a.v)) * (b.p - a.p), 1, 99)
      }
    }
  }
  const p25 = ord.find((q) => q.p === 25)?.v
  const p50 = ord.find((q) => q.p === 50)?.v
  const p75 = ord.find((q) => q.p === 75)?.v
  if (p25 === undefined || p50 === undefined || p75 === undefined) {
    return x < primero.v ? limitar(primero.p, 1, 99) : limitar(ultimo.p, 1, 99)
  }
  const desvio = (p75 - p25) / 1.35
  return percentilNormal(x, p50, desvio)
}

/** Percentil a partir de categorías (5 categorías, cortes = mínimo de las categorías 2 a 5).
    Cada categoría ocupa un quinto: 0–20, 20–40, 40–60, 60–80, 80–100; se interpola dentro. */
export function percentilDesdeCategorias(x: number, cortes: [number, number, number, number]): number {
  const [c1, c2, c3, c4] = cortes
  if (x < c1) return limitar((x / c1) * 20, 1, 99)
  const tramos: [number, number, number][] = [
    [c1, c2, 20],
    [c2, c3, 40],
    [c3, c4, 60],
  ]
  for (const [desde, hasta, base] of tramos) {
    if (x < hasta) return limitar(base + ((x - desde) / (hasta - desde)) * 20, 1, 99)
  }
  const anchoAnterior = c4 - c3
  return limitar(80 + ((x - c4) / anchoAnterior) * 20, 1, 99)
}

/** Interpolación lineal en una serie (x creciente), con extrapolación por los extremos. */
export function interpolar(xs: number[], ys: number[], x: number): number {
  if (x <= xs[0]) {
    const m = (ys[1] - ys[0]) / (xs[1] - xs[0])
    return ys[0] + m * (x - xs[0])
  }
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + ((x - xs[i - 1]) / (xs[i] - xs[i - 1])) * (ys[i] - ys[i - 1])
  }
  const n = xs.length
  const m = (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2])
  return ys[n - 1] + m * (x - xs[n - 1])
}
