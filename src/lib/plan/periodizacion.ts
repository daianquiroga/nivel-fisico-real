/* Periodización (ESPECIFICACION.md 7.5): fases y semana de descarga.
   Descarga cada 6 a 8 semanas en principiantes, 4 a 6 en intermedios y 3 a 4 en avanzados (se toma el punto
   medio redondeado: 7, 5 y 4), o antes si el control diario muestra fatiga acumulada.
   Los nombres y largos de las fases son decisiones de diseño de la app. */
import type { ControlDia } from './sesion'
import type { SesionPlan } from './generador'

export type Fase = 'adaptacion' | 'base' | 'desarrollo' | 'descarga'

export const NOMBRES_FASE: Record<Fase, string> = {
  adaptacion: 'Arranque',
  base: 'Base',
  desarrollo: 'Desarrollo',
  descarga: 'Liviana',
}

export const TEXTO_FASE: Record<Fase, string> = {
  adaptacion: 'Aprender bien los movimientos. Terminá cada serie sintiendo que podías hacer 3 o 4 más.',
  base: 'Sumar de a poco: repeticiones primero, después peso.',
  desarrollo: 'Más exigencia: series casi hasta no poder y versiones más difíciles.',
  descarga: 'Semana liviana para recuperarte y volver más fuerte: la mitad de las series y algo menos de peso.',
}

export function cadaCuantasSemanas(nivelFuerza: number): number {
  if (nivelFuerza <= 2) return 7
  if (nivelFuerza === 3) return 5
  return 4
}

/** Semana del plan (desde 1) contando desde la fecha de inicio. */
export function semanaDelPlan(inicio: string, hoy = new Date()): number {
  const dias = Math.floor((hoy.getTime() - new Date(inicio).getTime()) / 86_400_000)
  return Math.max(1, Math.floor(dias / 7) + 1)
}

/** Fase de una semana: la última de cada ciclo es de descarga. */
export function faseDeSemana(semana: number, nivelFuerza: number): Fase {
  const ciclo = cadaCuantasSemanas(nivelFuerza)
  const enCiclo = ((semana - 1) % ciclo) + 1
  if (enCiclo === ciclo) return 'descarga'
  if (semana <= 2) return 'adaptacion'
  if (semana <= ciclo) return 'base'
  return 'desarrollo'
}

/** Semanas que faltan hasta la próxima descarga (0 = esta semana). */
export function semanasParaDescarga(semana: number, nivelFuerza: number): number {
  const ciclo = cadaCuantasSemanas(nivelFuerza)
  return (ciclo - (((semana - 1) % ciclo) + 1) + ciclo) % ciclo
}

/** Fatiga acumulada: 3 o más días con poca energía o poco sueño en los últimos 7 controles. */
export function fatigaAcumulada(controles: ControlDia[]): boolean {
  const ult = controles.slice(-7)
  return ult.filter((c) => c.sueno < 6 || c.energia <= 2 || c.version === 'reducida' || c.version === 'minima').length >= 3
}

/** Versión de descarga de una sesión: la mitad de las series (redondeando hacia arriba). */
export function aplicarDescarga(s: SesionPlan): SesionPlan {
  const r = structuredClone(s)
  r.ejercicios.forEach((x) => {
    if (x.rol !== 'movilidad' && x.rol !== 'cardio') x.series = Math.max(1, Math.ceil(x.series / 2))
  })
  r.titulo += ' · descarga'
  r.nota = `${r.nota ? `${r.nota} ` : ''}Semana de descarga: la mitad de las series y un 10 % menos de peso.`
  return r
}
