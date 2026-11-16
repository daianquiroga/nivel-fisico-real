/* Pruebas específicas de combate. Fuentes y tablas: src/content/normas/fskt.json y sjft.json. */
import fskt from '../../content/normas/fskt.json'

/** Clasificación del FSKT de 10 segundos (patadas válidas al blanco). */
export function clasificarFskt(patadas: number): string {
  const i = fskt.fskt10.cortes.filter((c) => patadas >= c).length
  return fskt.fskt10.nombres[i]
}

/** Índice de caída de patadas (KDI, %): (1 − suma ÷ (mejor × cantidad)) × 100. Da Silva Santos y otros 2015. */
export function indiceCaida(series: number[]): number {
  const mejor = Math.max(...series)
  if (!mejor) return 0
  const suma = series.reduce((a, b) => a + b, 0)
  return Math.round((1 - suma / (mejor * series.length)) * 1000) / 10
}

/** Índice del SJFT: (pulso final + pulso a 1 minuto) ÷ total de proyecciones. Más bajo es mejor. */
export function indiceSjft(proyecciones: [number, number, number], pulsoFinal: number, pulso1min: number): number {
  const total = proyecciones[0] + proyecciones[1] + proyecciones[2]
  if (!total) return 0
  return Math.round(((pulsoFinal + pulso1min) / total) * 100) / 100
}
