/* Calorías gastadas (estimación) y minutos de cardio.
   - kcal = MET × peso (kg) × horas (ESPECIFICACION.md 10). MET del Compendium 2024 (src/content/normas/mets.json).
   - Moderada: 3,0 a 5,9 MET; vigorosa: 6 o más (ACSM).
   - OMS 2020: 150 a 300 min moderados o 75 a 150 vigorosos o una combinación: un minuto vigoroso equivale a dos moderados. */
import mets from '../../content/normas/mets.json'

export function kcal(met: number, pesoKg: number, minutos: number): number {
  return (met * pesoKg * minutos) / 60
}

export type Intensidad = 'liviana' | 'moderada' | 'vigorosa'

export function intensidad(met: number): Intensidad {
  if (met >= 6) return 'vigorosa'
  if (met >= 3) return 'moderada'
  return 'liviana'
}

/** Minutos que cuentan para la meta de la OMS (en minutos moderados equivalentes). */
export function minutosEquivalentes(met: number, minutos: number): number {
  const i = intensidad(met)
  return i === 'vigorosa' ? minutos * 2 : i === 'moderada' ? minutos : 0
}

type Actividades = typeof mets.actividades
export type IdActividad = keyof Actividades

export function metDe(actividad: string, variante: string): number | undefined {
  const a = (mets.actividades as Record<string, { variantes: Record<string, { met: number }> }>)[actividad]
  return a?.variantes[variante]?.met
}

/** MET de una sesión de fuerza según el método. */
export function metSesionFuerza(metodo: 'clasico' | 'superseries' | 'circuito', conPeso: boolean): number {
  if (metodo !== 'clasico') return mets.sesiones.fuerzaCircuito.met
  return conPeso ? mets.sesiones.fuerza.met : mets.sesiones.pesoCorporal.met
}
