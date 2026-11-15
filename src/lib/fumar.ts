/* Seguimiento de dejar de fumar: días sin fumar y plata ahorrada. */

export function diasSinFumar(fechaDejo: string, hoy = new Date()): number {
  const [a, m, d] = fechaDejo.split('-').map(Number)
  const inicio = new Date(a, m - 1, d)
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.max(0, Math.round((base.getTime() - inicio.getTime()) / 86_400_000))
}

export function plataAhorrada(dias: number, precioAtado: number, atadosPorDia: number): number {
  return Math.round(dias * precioAtado * atadosPorDia)
}

export function formatoPesos(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}
