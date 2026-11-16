/* Meta de pasos diarios.
   - Meseta del beneficio: 8000 a 10 000 pasos por día antes de los 60 años, 6000 a 8000 desde los 60 (Paluch 2022).
   - Caminar a 100 pasos por minuto o más es intensidad moderada (Tudor-Locke, CADENCE-Adults).
   - Subir de a 1000 por semana desde el promedio propio: decisión de diseño (src/content/normas/pasos.json). */
import normas from '../../content/normas/pasos.json'

export function metaFinal(edad: number): number {
  return edad >= 60 ? normas.meseta60omas.desde : normas.mesetaMenos60.desde
}

/** Meta de esta semana: con al menos 3 días anotados, el promedio redondeado hacia arriba a 500 más 1000, sin pasar la meta final. */
export function metaPasos(edad: number, ultimos7: number[]): { meta: number; final: number; progresiva: boolean } {
  const final = metaFinal(edad)
  const datos = ultimos7.filter((x) => x > 0)
  if (datos.length < 3) return { meta: final, final, progresiva: false }
  const promedio = datos.reduce((a, b) => a + b, 0) / datos.length
  const meta = Math.min(final, Math.ceil(promedio / 500) * 500 + 1000)
  return { meta: Math.max(meta, Math.min(final, 3000)), final, progresiva: meta < final }
}

/** Pasos por minuto a partir de los pasos contados en 15 segundos. */
export const cadencia = (pasosEn15s: number) => pasosEn15s * 4
export const esModerada = (pasosPorMinuto: number) => pasosPorMinuto >= normas.cadenciaModerada
