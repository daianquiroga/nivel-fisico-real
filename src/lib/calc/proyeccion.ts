/* Proyección (ESPECIFICACION.md 7.6). Curva que se acerca a un techo:
     valor(t) = inicio + (techo − inicio) × (1 − e^(−k · t · constancia))
   con ritmos de referencia de la especificación:
   - VO2max: +10 a 20 % en 8 a 12 semanas en personas no entrenadas (se usa +15 % a las 10 semanas);
   - fuerza: principiantes +15 a 30 % en 12 semanas (se usa +22,5 %); entrenados, 2 a 6 % por año;
   - músculo: principiantes 1 a 1,5 % del peso por mes (hombres) y 0,5 a 0,75 % (mujeres), la mitad en intermedios;
   - grasa: 0,5 a 1 % del peso por semana como ritmo recomendado.
   Los techos, la forma de la curva y el ajuste por edad son decisiones de diseño: es una estimación orientativa. */
import type { Sexo } from './cardio'

export const MESES = [1, 3, 6, 9, 12]
const SEMANAS_POR_MES = 4.345

/** El ritmo baja con la edad (decisión de diseño). */
export function factorEdad(edad: number): number {
  if (edad >= 65) return 0.65
  if (edad >= 50) return 0.8
  return 1
}

function curva(inicio: number, techo: number, k: number, semanas: number, constancia: number) {
  return inicio + (techo - inicio) * (1 - Math.exp(-k * semanas * constancia))
}

/** Techo relativo según el nivel (1 a 5): cuanto más entrenado, menos margen. */
const TECHO_VO2: Record<number, number> = { 1: 0.3, 2: 0.3, 3: 0.15, 4: 0.07, 5: 0.05 }
// Con techo de +30 %, ganar +15 % a las 10 semanas pide 1 − e^(−10k) = 0,5 → k = ln 2 / 10.
const K_VO2 = Math.LN2 / 10

export function vo2Proyectado(vo2: number, nivel: number, edad: number, semanas: number, constancia: number): number {
  const techo = vo2 * (1 + (TECHO_VO2[nivel] ?? 0.15) * factorEdad(edad))
  return curva(vo2, techo, K_VO2, semanas, constancia)
}

const TECHO_FUERZA: Record<number, number> = { 1: 0.6, 2: 0.6, 3: 0.25, 4: 0.08, 5: 0.06 }
// Con techo de +60 %, ganar +22,5 % a las 12 semanas pide 1 − e^(−12k) = 0,375 → k = −ln(0,625) / 12.
const K_FUERZA = -Math.log(0.625) / 12

/** Mejora de fuerza en % respecto de hoy. */
export function fuerzaProyectada(nivel: number, edad: number, semanas: number, constancia: number): number {
  return curva(0, (TECHO_FUERZA[nivel] ?? 0.25) * factorEdad(edad) * 100, K_FUERZA, semanas, constancia)
}

/** Músculo ganado (kg, rango bajo y alto). El ritmo mensual baja con el tiempo (constante de 12 meses). */
export function musculoProyectado(pesoKg: number, sexo: Sexo, nivel: number, edad: number, meses: number, constancia: number): [number, number] {
  const [bajo, alto] = sexo === 'h' ? [0.01, 0.015] : [0.005, 0.0075]
  const mitad = nivel >= 3 ? 0.5 : 1
  const tau = 12
  const t = meses * constancia
  const acumulado = (r: number) => r * mitad * factorEdad(edad) * pesoKg * tau * (1 - Math.exp(-t / tau))
  return [acumulado(bajo), acumulado(alto)]
}

/** Ritmo recomendado para bajar grasa: kg por semana (rango). */
export function ritmoGrasa(pesoKg: number): [number, number] {
  return [pesoKg * 0.005, pesoKg * 0.01]
}

export const semanasDeMeses = (m: number) => m * SEMANAS_POR_MES
