/* Seguimiento estético. Aviso si el peso baja más de 1 % por semana (ESPECIFICACION.md 11): el ritmo recomendado
   es de 0,5 a 1 % del peso por semana. */

export interface PesoFechado {
  fecha: string
  peso: number
}

/** Cambio de peso en % por semana entre el primer y el último registro con al menos 7 días de diferencia. */
export function ritmoSemanalPeso(lista: PesoFechado[]): number | null {
  const ord = [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (ord.length < 2) return null
  const ult = ord[ord.length - 1]
  const previo = [...ord].reverse().find((x) => (new Date(ult.fecha).getTime() - new Date(x.fecha).getTime()) / 86_400_000 >= 7)
  if (!previo) return null
  const semanas = (new Date(ult.fecha).getTime() - new Date(previo.fecha).getTime()) / (7 * 86_400_000)
  return ((ult.peso - previo.peso) / previo.peso / semanas) * 100
}

export function bajaMuyRapido(ritmo: number | null): boolean {
  return ritmo !== null && ritmo < -1
}

/** Diferencia entre la primera y la última medida (cm). */
export function cambio(valores: number[]): number | null {
  return valores.length >= 2 ? valores[valores.length - 1] - valores[0] : null
}
