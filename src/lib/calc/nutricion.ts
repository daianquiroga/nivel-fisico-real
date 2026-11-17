/* Proteína del día y porciones con la mano.
   - Rango para quien entrena: 1,4 a 2,0 g por kilo por día (Jäger y otros 2017, ISSN Position Stand: protein and exercise).
   - Objetivo de 1,6 g por kilo: arriba de eso no se ganó más músculo con entrenamiento de fuerza (Morton y otros 2018,
     British Journal of Sports Medicine, metaanálisis de 49 estudios).
   - Por comida: unos 0,4 g por kilo en al menos 4 comidas (Schoenfeld y Aragon 2018, JISSN 15:10).
   - Una palma de carne, pollo, pescado o huevos tiene unos 20 a 30 g de proteína: aproximación práctica de las porciones
     con la mano, no un estándar publicado; la app usa 25 g. */

export const G_POR_PALMA = 25

export interface ProteinaDia {
  /** Gramos por día para apuntar (1,6 g/kg). */
  objetivo: number
  /** Rango de la ISSN. */
  minimo: number
  maximo: number
  /** Gramos por comida (0,4 g/kg) y comidas para llegar. */
  porComida: number
  comidas: number
  /** Palmas por día (redondeado para arriba). */
  palmas: number
}

export function proteinaDelDia(pesoKg: number): ProteinaDia {
  const objetivo = Math.round(pesoKg * 1.6)
  const porComida = Math.round(pesoKg * 0.4)
  return {
    objetivo,
    minimo: Math.round(pesoKg * 1.4),
    maximo: Math.round(pesoKg * 2.0),
    porComida,
    comidas: Math.max(3, Math.ceil(objetivo / Math.max(1, porComida))),
    palmas: Math.ceil(objetivo / G_POR_PALMA),
  }
}

/** Proteína aproximada de un plato a partir de sus alimentos (gramos de proteína por porción). */
export function proteinaPlato(alimentos: { gramos: number }[]): number {
  return Math.round(alimentos.reduce((a, x) => a + x.gramos, 0))
}
