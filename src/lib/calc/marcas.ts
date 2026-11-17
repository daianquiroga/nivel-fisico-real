/* Comparar una marca nueva con la anterior cuando no hay normas para tu grupo: solo cuenta como cambio real si supera
   el cambio mínimo detectable de la prueba (si lo hay publicado); si no, se usa 1 cm o lo que diga cada prueba
   (decisión de diseño de la app, se dice en pantalla).
   Prueba del hexágono: cambio mínimo detectable de 1,015 s (Beekhuizen y otros 2009, J Strength Cond Res 23(7):2167-2171). */

export type Cambio = 'mejor' | 'igual' | 'peor'

export function compararMarca(anterior: number, actual: number, minimo: number, menorEsMejor: boolean): Cambio {
  const diferencia = menorEsMejor ? anterior - actual : actual - anterior
  if (diferencia > minimo) return 'mejor'
  if (diferencia < -minimo) return 'peor'
  return 'igual'
}

export function mejorMarca(valores: number[], menorEsMejor: boolean): number | undefined {
  if (!valores.length) return undefined
  return menorEsMejor ? Math.min(...valores) : Math.max(...valores)
}
