/* Simulador de peleas: modelo propio de la app, hecho para orientar y entretener, no para predecir una pelea real.
   Cada peleador tiene áreas separadas de ataque y defensa (golpes y agarre), cardio, fuerza y peso.
   Cada round tiene intercambios; quién ataca depende de la estrategia; acertar depende de la diferencia entre
   el ataque de uno y la defensa del otro (curva logística); el cansancio baja todo según el cardio.
   Se gana por nocaut, sumisión o decisión (puntos con algo de azar de los jueces). Todos los números son decisión de diseño. */
import { EXPERIENCIAS, experiencia } from './poder'

export type Azar = () => number

export interface Peleador {
  nombre: string
  golpesAtaque: number
  golpesDefensa: number
  agarreAtaque: number
  agarreDefensa: number
  cardio: number
  fuerza: number
  pesoKg: number
}

export type Estrategia = 'equilibrada' | 'presion' | 'contragolpe' | 'derribar' | 'distancia'
export type Reglamento = 'boxeo' | 'kick' | 'mma' | 'grappling'

export const ESTRATEGIAS: { valor: Estrategia; texto: string; detalle: string }[] = [
  { valor: 'equilibrada', texto: 'Equilibrada', detalle: 'Atacás y defendés por igual.' },
  { valor: 'presion', texto: 'Presión', detalle: 'Atacás mucho más, pero te cansás antes y defendés peor.' },
  { valor: 'contragolpe', texto: 'Contragolpe', detalle: 'Esperás, defendés mejor y contestás cuando falla.' },
  { valor: 'derribar', texto: 'Llevar al suelo', detalle: 'Buscás derribar (si el reglamento lo permite).' },
  { valor: 'distancia', texto: 'Mantener distancia', detalle: 'Te alejás: defendés mejor los derribos y golpeás de lejos.' },
]

export const REGLAMENTOS: { valor: Reglamento; texto: string; golpes: boolean; agarre: 'no' | 'clinch' | 'todo'; rounds: number; ko: boolean; sumision: boolean }[] = [
  { valor: 'boxeo', texto: 'Boxeo', golpes: true, agarre: 'no', rounds: 3, ko: true, sumision: false },
  { valor: 'kick', texto: 'Kick y muay thai', golpes: true, agarre: 'clinch', rounds: 3, ko: true, sumision: false },
  { valor: 'mma', texto: 'MMA', golpes: true, agarre: 'todo', rounds: 3, ko: true, sumision: true },
  { valor: 'grappling', texto: 'Grappling (BJJ, lucha)', golpes: false, agarre: 'todo', rounds: 2, ko: false, sumision: true },
]

const AGRESION: Record<Estrategia, number> = { equilibrada: 1, presion: 1.5, contragolpe: 0.6, derribar: 1.1, distancia: 0.8 }
const DEFENSA_EXTRA: Record<Estrategia, number> = { equilibrada: 0, presion: -7, contragolpe: 8, derribar: 0, distancia: 4 }
const GASTO: Record<Estrategia, number> = { equilibrada: 1, presion: 1.35, contragolpe: 0.85, derribar: 1.15, distancia: 0.9 }
const INTERCAMBIOS = 24

const sigmoide = (x: number) => 1 / (1 + Math.exp(-x))

export type Metodo = 'ko' | 'sumision' | 'decision' | 'empate'

export interface ResultadoPelea {
  ganador: 0 | 1 | null
  metodo: Metodo
  round: number
}

export function simularPelea(p: [Peleador, Peleador], est: [Estrategia, Estrategia], reglamento: Reglamento, azar: Azar): ResultadoPelea {
  const reg = REGLAMENTOS.find((r) => r.valor === reglamento)!
  const dano = [0, 0]
  const puntos = [0, 0]
  const fatiga = [0, 0]
  let suelo = false
  let arriba = 0
  const ef = (v: number, i: number) => Math.max(1, v - fatiga[i] * 40) // el cansancio resta puntos a todo
  const pesoRel = (a: number) => Math.pow(p[a].pesoKg / p[1 - a].pesoKg, 0.33)

  for (let round = 1; round <= reg.rounds; round++) {
    for (let k = 0; k < INTERCAMBIOS; k++) {
      for (const i of [0, 1]) fatiga[i] = Math.min(0.9, fatiga[i] + 0.0065 * GASTO[est[i]] * (1.5 - p[i].cardio / 100))
      if (suelo) {
        const a = azar() < 0.65 ? arriba : 1 - arriba
        const d = 1 - a
        const exito = sigmoide((ef(p[a].agarreAtaque, a) - ef(p[d].agarreDefensa, d)) / 11 + (pesoRel(a) - 1) * 2)
        if (azar() < exito * 0.5) {
          puntos[a] += 1
          if (reg.sumision && azar() < 0.07 * exito) return { ganador: a as 0 | 1, metodo: 'sumision', round }
          if (reg.golpes && a === arriba) dano[d] += 0.6 + (p[a].fuerza / 100) * pesoRel(a)
        } else if (azar() < 0.12 * sigmoide((p[d].agarreDefensa - p[a].agarreAtaque) / 15 + 0.5)) {
          suelo = false
        }
        continue
      }
      const ag = [AGRESION[est[0]] * (1 - fatiga[0] * 0.5), AGRESION[est[1]] * (1 - fatiga[1] * 0.5)]
      const a = azar() < ag[0] / (ag[0] + ag[1]) ? 0 : 1
      const d = 1 - a
      const defGolpes = ef(p[d].golpesDefensa, d) + DEFENSA_EXTRA[est[d]]
      const defAgarre = ef(p[d].agarreDefensa, d) + (est[d] === 'distancia' ? 10 : 0)

      let intentarAgarre = 0
      if (reg.agarre !== 'no') {
        intentarAgarre = 0.12 + (est[a] === 'derribar' ? 0.4 : 0) + (p[a].agarreAtaque > p[a].golpesAtaque + 15 ? 0.15 : 0)
        if (!reg.golpes) intentarAgarre = 1
      }
      if (azar() < intentarAgarre) {
        const exito = sigmoide((ef(p[a].agarreAtaque, a) - defAgarre) / 12 + (pesoRel(a) - 1) * 2) * 0.55
        if (azar() < exito) {
          puntos[a] += 2
          if (reg.agarre === 'todo') {
            suelo = true
            arriba = a
          } else if (reg.golpes) dano[d] += 0.8 + (p[a].fuerza / 100) * pesoRel(a) // rodilla en el clinch
        }
        continue
      }
      if (!reg.golpes) continue
      const pega = sigmoide((ef(p[a].golpesAtaque, a) - defGolpes) / 14) * 0.55
      if (azar() < pega) {
        const golpe = (1 + (ef(p[a].fuerza, a) / 100) * 1.5) * pesoRel(a) * (0.5 + azar())
        dano[d] += golpe
        puntos[a] += 1
        const ko = 0.0035 * golpe * (1 + dano[d] / 22) * (1.3 - p[d].fuerza / 250)
        if (reg.ko && azar() < ko) return { ganador: a as 0 | 1, metodo: 'ko', round }
      } else if (est[d] === 'contragolpe' && azar() < 0.3) {
        const contra = sigmoide((ef(p[d].golpesAtaque, d) - ef(p[a].golpesDefensa, a)) / 14) * 0.55
        if (azar() < contra) {
          const golpe = (1 + (ef(p[d].fuerza, d) / 100) * 1.5) * pesoRel(d) * (0.5 + azar())
          dano[a] += golpe
          puntos[d] += 1
          if (reg.ko && azar() < 0.0035 * golpe * (1 + dano[a] / 22) * (1.3 - p[a].fuerza / 250)) return { ganador: d as 0 | 1, metodo: 'ko', round }
        }
      }
    }
    for (const i of [0, 1]) fatiga[i] *= 0.7
    suelo = false
  }
  const diferencia = puntos[0] - puntos[1] + (azar() - 0.5) * 4
  if (Math.abs(diferencia) < 1) return { ganador: null, metodo: 'empate', round: reg.rounds }
  return { ganador: diferencia > 0 ? 0 : 1, metodo: 'decision', round: reg.rounds }
}

export interface Resumen {
  peleas: number
  gana: number
  pierde: number
  empate: number
  porMetodo: { gana: Record<'ko' | 'sumision' | 'decision', number>; pierde: Record<'ko' | 'sumision' | 'decision', number> }
}

/** Azar con semilla (mulberry32): la misma semilla da siempre los mismos resultados. */
export function conSemilla(s: number): Azar {
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function simular(p: [Peleador, Peleador], est: [Estrategia, Estrategia], reglamento: Reglamento, peleas = 500, semilla = 1): Resumen {
  const azar = conSemilla(semilla)
  const r: Resumen = { peleas, gana: 0, pierde: 0, empate: 0, porMetodo: { gana: { ko: 0, sumision: 0, decision: 0 }, pierde: { ko: 0, sumision: 0, decision: 0 } } }
  for (let i = 0; i < peleas; i++) {
    const x = simularPelea(p, est, reglamento, azar)
    if (x.ganador === null) r.empate++
    else if (x.ganador === 0) {
      r.gana++
      r.porMetodo.gana[x.metodo as 'ko'] += 1
    } else {
      r.pierde++
      r.porMetodo.pierde[x.metodo as 'ko'] += 1
    }
  }
  return r
}

export type Area = 'golpesAtaque' | 'golpesDefensa' | 'agarreAtaque' | 'agarreDefensa' | 'cardio' | 'fuerza'

export const AREAS_PELEA: { valor: Area; texto: string; consejo: string }[] = [
  { valor: 'golpesAtaque', texto: 'Ataque con golpes', consejo: 'Más rounds de sombra con el entrenador por voz y técnica con un profesor (bolsa y manoplas).' },
  { valor: 'golpesDefensa', texto: 'Defensa de golpes', consejo: 'Contragolpes, esquives y juego de pies: subí de nivel en pies.' },
  { valor: 'agarreAtaque', texto: 'Derribos y suelo', consejo: 'Sumá lucha, judo o BJJ como segunda disciplina, con profesor.' },
  { valor: 'agarreDefensa', texto: 'Defensa de derribos y suelo', consejo: 'Sprawl, escape de cadera y levantarte con guardia: rounds de suelo.' },
  { valor: 'cardio', texto: 'Cardio', consejo: 'Seguí con los días de cardio, la soga y los rounds: el cansancio decide muchas peleas.' },
  { valor: 'fuerza', texto: 'Fuerza', consejo: 'Seguí tu plan de fuerza: piernas, cadera y tronco dan potencia a los golpes y al agarre.' },
]

export interface Mejora {
  area: Area
  sube: number
  ganarias: number
}

/** "Qué me falta para ganarle": cuánto cambia el % de victorias si subís 15 puntos cada área (misma semilla). */
export function queMeFalta(p: [Peleador, Peleador], est: [Estrategia, Estrategia], reglamento: Reglamento, peleas = 300, semilla = 7): { base: number; mejoras: Mejora[] } {
  const reg = REGLAMENTOS.find((r) => r.valor === reglamento)!
  const base = simular(p, est, reglamento, peleas, semilla).gana / peleas
  const relevantes = AREAS_PELEA.filter((a) => (reg.golpes || !a.valor.startsWith('golpes')) && (reg.agarre !== 'no' || !a.valor.startsWith('agarre')))
  const mejoras = relevantes.map(({ valor }) => {
    const yo = { ...p[0], [valor]: Math.min(100, p[0][valor] + 15) }
    const g = simular([yo, p[1]], est, reglamento, peleas, semilla).gana / peleas
    return { area: valor, sube: g - base, ganarias: g }
  })
  return { base, mejoras: mejoras.filter((m) => m.sube > 0.005).sort((a, b) => b.sube - a.sube) }
}

/* ---------- Perfiles ---------- */

export interface DatosPerfil {
  percentiles: Partial<Record<'cardio' | 'fuerza' | 'movilidad' | 'equilibrio', number>>
  experienciaGolpes: string
  experienciaAgarre: string
  sparring: boolean
  nivelSombra: number
  nivelPies: number
  pesoKg: number
}

/** Áreas de 0 a 100 de la persona, desde su evaluación y su experiencia (decisión de diseño). */
export function perfilPropio(d: DatosPerfil): Peleador {
  const tg = experiencia(d.experienciaGolpes).tecnica * (d.sparring ? 1 : 0.85)
  const ta = experiencia(d.experienciaAgarre).tecnica * (d.sparring ? 1 : 0.85)
  const f = d.percentiles.fuerza ?? 50
  const c = d.percentiles.cardio ?? 50
  const mov = ((d.percentiles.movilidad ?? 50) + (d.percentiles.equilibrio ?? 50)) / 2
  const lim = (x: number) => Math.round(Math.max(1, Math.min(100, x)))
  return {
    nombre: 'Vos',
    golpesAtaque: lim(tg * 0.75 + f * 0.2 + d.nivelSombra * 1.5),
    golpesDefensa: lim(tg * 0.7 + mov * 0.2 + d.nivelPies * 1.5),
    agarreAtaque: lim(ta * 0.75 + f * 0.25),
    agarreDefensa: lim(ta * 0.65 + f * 0.2 + mov * 0.15),
    cardio: lim(c),
    fuerza: lim(f),
    pesoKg: d.pesoKg,
  }
}

export const RIVALES: (Peleador & { id: string; detalle: string; experiencia: string })[] = [
  { id: 'promedio', nombre: 'Persona promedio', detalle: 'Sin entrenamiento de combate, condición física media.', experiencia: 'ninguna', golpesAtaque: 18, golpesDefensa: 15, agarreAtaque: 15, agarreDefensa: 15, cardio: 50, fuerza: 50, pesoKg: 75 },
  { id: 'boxeo-1', nombre: 'Boxea hace 1 año', detalle: 'Entrena boxeo tres veces por semana, hace algo de sparring.', experiencia: 'anio', golpesAtaque: 48, golpesDefensa: 42, agarreAtaque: 14, agarreDefensa: 18, cardio: 65, fuerza: 55, pesoKg: 75 },
  { id: 'thai-2', nombre: 'Muay thai hace 2 años', detalle: 'Golpes, patadas y clinch; hace sparring.', experiencia: 'anios', golpesAtaque: 56, golpesDefensa: 50, agarreAtaque: 28, agarreDefensa: 32, cardio: 70, fuerza: 60, pesoKg: 75 },
  { id: 'bjj-azul', nombre: 'Cinturón azul de BJJ', detalle: 'Unos 2 a 3 años de suelo; casi nada de golpes.', experiencia: 'anios', golpesAtaque: 20, golpesDefensa: 24, agarreAtaque: 62, agarreDefensa: 64, cardio: 62, fuerza: 60, pesoKg: 75 },
  { id: 'mma-amateur', nombre: 'Peleador amateur de MMA', detalle: 'Compite como amateur: golpes, derribos y suelo.', experiencia: 'amateur', golpesAtaque: 66, golpesDefensa: 60, agarreAtaque: 62, agarreDefensa: 62, cardio: 76, fuerza: 70, pesoKg: 75 },
  { id: 'campeon', nombre: 'Campeón del mundo', detalle: 'Lo más alto de la escala.', experiencia: 'pro', golpesAtaque: 97, golpesDefensa: 95, agarreAtaque: 92, agarreDefensa: 93, cardio: 95, fuerza: 90, pesoKg: 75 },
]

export const NOMBRES_EXPERIENCIA = EXPERIENCIAS
