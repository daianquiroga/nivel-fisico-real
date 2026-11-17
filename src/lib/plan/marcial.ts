/* Rutina marcial: con las artes que elegís, tus días y el tiempo de cada día, arma sesiones guiadas round por round.
   Fuente de los rounds y niveles: content/combate/programas.json (niveles de sombra y de pies de la app).
   Estructura de la sesión (entrada en calor, pies, rounds de sombra, movilidad opcional y vuelta a la calma),
   minutos de cada bloque y rotación de las artes en la semana: decisión de diseño de la app. */
import { DISCIPLINAS, NIVELES_PIES, NIVELES_SOMBRA, arte, disciplina, type Disciplina } from '../combate'
import type { Horario } from './asistente'
import type { EjercicioPlan, PlanSemana, SesionPlan } from './generador'

/** Artes que se pueden elegir de a una. La única combinada es el híbrido (boxeo + kickboxing + muay thai). */
export const ARTES_RUTINA: Disciplina[] = DISCIPLINAS.filter((d) => d.id !== 'completo')

/** Artes de agarre y suelo: la "sombra" es movimiento de suelo y de cadera. */
export const DE_AGARRE = ['lucha', 'judo', 'bjj', 'aikido']

/** De qué análisis de artes salen las combinaciones de cada disciplina (el híbrido junta las tres). */
const FUENTES_COMBOS: Record<string, string[]> = { hibrido: ['boxeo', 'kick', 'muaythai'], mma: ['boxeo', 'kick', 'bjj'], lucha: ['judo', 'bjj'] }

export const nombreCorto = (id: string) => (id === 'hibrido' ? 'Mi híbrido' : (disciplina(id)?.nombre ?? id).split(/[:(]/)[0].trim())

export type TipoBloque = 'calor' | 'pies' | 'sombra' | 'descanso' | 'movilidad' | 'calma'

export interface Bloque {
  tipo: TipoBloque
  titulo: string
  segundos: number
  que: string[]
  /** Técnicas para mostrar con su dibujo. */
  tecnicas?: string[]
  /** Ejercicios de movilidad para mostrar con su dibujo. */
  ejercicios?: string[]
  /** Nivel de pies (1 a 6) para el dibujo de huellas. */
  nivelPies?: number
  /** En los descansos: de qué parte son (pies o sombra). */
  de?: 'pies' | 'sombra'
}

/** Movilidad que más ayuda a cada tipo de arte (decisión de diseño): patadas → cadera y piernas; agarre → cadera y espalda; puños → torso y tobillos. */
export function movilidadPara(arteId: string): string[] {
  if (DE_AGARRE.includes(arteId)) return ['cadera-90-90', 'aductores-mariposa', 'gato-camello']
  if (['boxeo', 'kravmaga'].includes(arteId)) return ['rotacion-toracica', 'movilidad-tobillo', 'estiramiento-flexor-cadera']
  return ['balanceo-piernas', 'cadera-90-90', 'rotacion-toracica']
}

/** Combinaciones del arte, con el porqué (del análisis biomecánico) o, si no hay, las del nivel 3 de sombra. */
export function combinacionesDe(arteId: string): string[] {
  const ids = FUENTES_COMBOS[arteId] ?? [arteId]
  const deArtes = ids.flatMap((id) => (arte(id)?.encadenamientos ?? []).map((c) => `${c.combo}. ${c.porque}`))
  return deArtes.length ? deArtes : (disciplina(arteId)?.sombra?.['3'] ?? [])
}

/** Minutos de cada parte fija de la sesión según el tiempo total (decisión de diseño). */
export function partes(minutos: number, movilidad: boolean) {
  return {
    calor: minutos >= 30 ? 5 : 3,
    calma: minutos >= 30 ? 3 : 2,
    movilidad: movilidad ? (minutos >= 45 ? 8 : minutos >= 30 ? 6 : 4) : 0,
    rondasPies: minutos >= 40 ? 2 : 1,
  }
}

/** Sesión guiada de un arte, bloque por bloque. nivelSombra y nivelPies: niveles aprobados (0 = empezando). */
export function bloquesSesion(arteId: string, minutos: number, movilidad: boolean, nivelSombra = 0, nivelPies = 0): Bloque[] {
  const d = disciplina(arteId) ?? DISCIPLINAS[0]
  const ns = NIVELES_SOMBRA[Math.min(nivelSombra, NIVELES_SOMBRA.length - 1)]
  const np = NIVELES_PIES[Math.min(nivelPies, NIVELES_PIES.length - 1)]
  const agarre = DE_AGARRE.includes(d.id)
  const p = partes(minutos, movilidad)
  const out: Bloque[] = []
  const descanso = (seg: number, sigue: string, de: 'pies' | 'sombra'): Bloque => ({ tipo: 'descanso', de, titulo: 'Descanso', segundos: seg, que: ['Caminá y respirá por la nariz.', `Sigue: ${sigue}.`] })

  out.push({
    tipo: 'calor',
    titulo: 'Entrada en calor',
    segundos: p.calor * 60,
    que: agarre
      ? ['Trotá en el lugar o saltá la soga 2 minutos.', 'Rotá cuello, hombros, cadera, rodillas y tobillos.', '10 sentadillas y 5 camarones suaves por lado.']
      : ['Saltá la soga o trotá en el lugar 2 minutos.', 'Rotá cuello, hombros, cadera, rodillas y tobillos.', `En guardia: 10 golpes suaves de ${nombreCorto(d.id).toLowerCase()}, sin fuerza.`],
  })

  // Juego de pies: rounds del nivel de pies (content/combate/programas.json).
  const piesQue = [...np.pasos, ...(d.pies?.[String(np.nivel)] ?? [])]
  for (let i = 0; i < p.rondasPies; i++) {
    out.push({ tipo: 'pies', titulo: `Juego de pies ${i + 1} de ${p.rondasPies}: ${np.nombre.toLowerCase()}`, segundos: np.rounds.trabajo, que: piesQue, nivelPies: np.nivel })
    out.push(descanso(np.rounds.descanso, i + 1 < p.rondasPies ? 'otro round de pies' : 'la sombra', 'pies'))
  }

  // Rounds de sombra: lo que queda, en rounds del nivel de sombra.
  const usado = (p.calor + p.calma + p.movilidad) * 60 + p.rondasPies * (np.rounds.trabajo + np.rounds.descanso)
  const { trabajo, descanso: pausa } = ns.rounds
  const rondas = Math.max(1, Math.floor((minutos * 60 - usado + pausa) / (trabajo + pausa)))
  const combos = combinacionesDe(d.id)
  const tips = (n: number) => d.sombra?.[String(n)] ?? NIVELES_SOMBRA[n - 1]?.pasos ?? []
  // Rounds del medio: se turnan según el nivel. Empezando, más forma y desplazamiento; con nivel, más combinaciones.
  const conDesplazamiento = { titulo: NIVELES_SOMBRA[1].nombre, que: [NIVELES_SOMBRA[1].objetivo, ...tips(2)], tecnicas: d.basicas.slice(0, 4) }
  const forma = { titulo: 'Forma', que: ['Cada técnica lenta y perfecta, y volvé a la guardia.', ...tips(1)], tecnicas: d.basicas.slice(0, 4) }
  const turnos = nivelSombra <= 0 ? ['desplazamiento', 'forma', 'combos'] : nivelSombra === 1 ? ['combos', 'desplazamiento'] : ['combos']
  let c = 0
  let m = 0
  for (let k = 0; k < rondas; k++) {
    let b: Omit<Bloque, 'tipo' | 'segundos'>
    const ultimo = k === rondas - 1 && rondas >= 4
    if (k === 0) b = forma
    else if (k === 1 && nivelSombra >= 2) b = { titulo: ns.nombre, que: [ns.objetivo, ...tips(ns.nivel)], tecnicas: d.basicas.slice(0, 6) }
    else if (ultimo) b = nivelSombra >= 3 ? { titulo: 'Reacción', que: tips(5) } : { titulo: 'Sombra libre', que: ['Mezclá todo lo de hoy, a tu ritmo.', 'Después de cada ataque, salí de la línea: ángulo o paso atrás.', 'Guardia arriba también cuando estás cansado.'] }
    else if (k === rondas - 2 && rondas >= 5 && nivelSombra >= 2) b = { titulo: 'A velocidad', que: tips(4) }
    else {
      const turno = combos.length ? turnos[m++ % turnos.length] : 'desplazamiento'
      if (turno === 'forma') b = forma
      else if (turno === 'desplazamiento') b = conDesplazamiento
      else {
        const dos = [combos[c % combos.length], combos[(c + 1) % combos.length]].filter((v, i, a) => a.indexOf(v) === i)
        c += 2
        b = { titulo: 'Combinaciones', que: [...dos, 'Repetí cada una 10 veces; terminá siempre con una defensa o una salida.'] }
      }
    }
    out.push({ tipo: 'sombra', segundos: trabajo, ...b, titulo: `Round ${k + 1} de ${rondas}: ${b.titulo}` })
    if (k + 1 < rondas) out.push(descanso(pausa, `round ${k + 2}`, 'sombra'))
  }

  if (p.movilidad) {
    out.push({ tipo: 'movilidad', titulo: 'Movilidad', segundos: p.movilidad * 60, que: ['Despacio, sin dolor, respirando largo.', 'Unos 2 minutos por ejercicio.'], ejercicios: movilidadPara(d.id) })
  }
  const total = out.reduce((a, b) => a + b.segundos, 0) + p.calma * 60
  out.push({
    tipo: 'calma',
    titulo: 'Vuelta a la calma',
    segundos: p.calma * 60 + Math.max(0, minutos * 60 - total),
    que: ['Caminá y bajá el ritmo.', 'Respirá: 4 segundos adentro y 6 afuera.', 'Pensá qué te costó hoy: va primero la próxima vez.'],
  })
  return out
}

const enMinutos = (id: string, m: number): EjercicioPlan => ({ id, patrones: ['cardio'], rol: 'cardio', series: 1, rango: [m, m], descansoSeg: 0 })
const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Sesión del plan para un arte (los ejercicios sirven para el análisis; al entrenar se abre la versión guiada). */
export function sesionMarcial(id: string, arteId: string, h: Horario, movilidad: boolean, niveles: { sombra: number; pies: number } = { sombra: 0, pies: 0 }, lugar?: string): SesionPlan {
  const bloques = bloquesSesion(arteId, h.minutos, movilidad, niveles.sombra, niveles.pies)
  const seg = (parte: 'pies' | 'sombra') => bloques.filter((b) => b.tipo === parte || b.de === parte).reduce((a, b) => a + b.segundos, 0)
  const pies = Math.round(seg('pies') / 60)
  const sombra = Math.round(seg('sombra') / 60)
  const minutos = Math.round(bloques.reduce((a, b) => a + b.segundos, 0) / 60)
  const ejercicios: EjercicioPlan[] = [enMinutos('juego-pies', Math.max(1, pies)), enMinutos('sombra', Math.max(2, sombra))]
  if (movilidad) for (const m of movilidadPara(arteId)) ejercicios.push({ id: m, patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: [6, 10], descansoSeg: 0 })
  return {
    id,
    tipo: 'cardio',
    titulo: `Combate: ${nombreCorto(arteId)}`,
    lugar,
    desde: h.hora,
    hasta: aHora(aMin(h.hora) + minutos),
    minutos,
    intensidad: 'fuerte',
    metodo: 'clasico',
    ejercicios,
    nota: 'Sesión guiada round por round: tocá Entrenar y seguí lo que dice la pantalla (y la voz, si la activás).',
    combate: { arte: arteId, movilidad },
  }
}

export interface OpcionesMarcial {
  artes: string[]
  /** Horarios de lunes (0) a domingo (6). */
  horarios: Horario[][]
  movilidad: boolean
  lugar?: string
  /** Niveles aprobados por arte (sombra) y de pies. */
  niveles?: Record<string, number>
  nivelPies?: number
}

/** Semana marcial: las artes rotan día por día. Con movilidad y un segundo horario en el día, la movilidad va sola en ese horario. */
export function semanaMarcial(o: OpcionesMarcial, creado = new Date().toISOString()): PlanSemana {
  const plan: PlanSemana = { creado, editado: true, dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) }
  if (!o.artes.length) return plan
  let turno = 0
  o.horarios.forEach((hs, d) => {
    hs.forEach((h, j) => {
      const movilidadAparte = o.movilidad && hs.length > 1
      if (j > 0 && movilidadAparte && j === hs.length - 1) {
        const minutos = Math.min(20, h.minutos)
        const ids = movilidadPara(o.artes[(turno - 1 + o.artes.length) % o.artes.length])
        plan.dias[d].sesiones.push({
          id: `marcial-${d}-${j}`,
          tipo: 'movilidad',
          titulo: 'Movilidad para combate',
          lugar: o.lugar,
          desde: h.hora,
          hasta: aHora(aMin(h.hora) + minutos),
          minutos,
          intensidad: 'suave',
          metodo: 'clasico',
          ejercicios: ids.map((id) => ({ id, patrones: ['movilidad'], rol: 'movilidad', series: 1, rango: [6, 10], descansoSeg: 0 })),
          nota: 'Despacio y sin dolor. Suma rango para patadas, guardia y suelo.',
        })
        return
      }
      const a = o.artes[turno % o.artes.length]
      turno++
      plan.dias[d].sesiones.push(sesionMarcial(`marcial-${d}-${j}`, a, h, o.movilidad && !movilidadAparte, { sombra: o.niveles?.[a] ?? 0, pies: o.nivelPies ?? 0 }, o.lugar))
    })
    plan.dias[d].sesiones.sort((x, y) => (x.desde ?? '').localeCompare(y.desde ?? ''))
  })
  return plan
}

/** Cuántas veces por semana toca cada arte. */
export function vecesPorArte(plan: PlanSemana): Record<string, number> {
  const r: Record<string, number> = {}
  for (const d of plan.dias) for (const s of d.sesiones) if (s.combate) r[s.combate.arte] = (r[s.combate.arte] ?? 0) + 1
  return r
}

/** Resumen corto de la sesión para listas: un renglón por parte; los rounds de sombra se cuentan por foco. */
export function resumenBloques(bloques: Bloque[]): string[] {
  const out: string[] = []
  const focos = new Map<string, number>()
  let sombra = -1
  let pies = { n: 0, foco: '', pos: -1 }
  const frase = (f: string) => (f === 'sombra libre' ? 'libre' : /^(con|a|en) /.test(f) ? f : `de ${f}`)
  for (const b of bloques) {
    if (b.tipo === 'descanso') continue
    const foco = (b.titulo.split(': ')[1] ?? '').toLowerCase()
    if (b.tipo === 'sombra') {
      if (sombra < 0) sombra = out.push('') - 1
      focos.set(foco, (focos.get(foco) ?? 0) + 1)
    } else if (b.tipo === 'pies') {
      if (pies.pos < 0) pies = { n: 0, foco, pos: out.push('') - 1 }
      pies.n++
    } else out.push(b.titulo)
  }
  if (pies.pos >= 0) out[pies.pos] = `Juego de pies: ${pies.n} ${pies.n === 1 ? 'round' : 'rounds'} de ${pies.foco}`
  if (sombra >= 0) {
    const total = [...focos.values()].reduce((a, b) => a + b, 0)
    out[sombra] = `Sombra: ${total} ${total === 1 ? 'round' : 'rounds'} (${[...focos].map(([f, n]) => `${n} ${frase(f)}`).join(', ')})`
  }
  return out
}

/** Diferencia entre la rutina marcial (sombra guiada) y el sistema completo, para mostrar en la app. */
export const SOMBRA_VS_SISTEMA = [
  {
    titulo: 'Rutina marcial (sombra guiada)',
    texto:
      'Un arte por sesión (o tu híbrido de boxeo, kick y muay thai), del tiempo que vos elijas: entrada en calor, juego de pies, rounds de sombra según tu nivel y movilidad si querés. Sirve para aprender y pulir un estilo.',
  },
  {
    titulo: 'Sistema completo',
    texto:
      'Un método que junta 5 estilos (boxeo, muay thai, kickboxing, suelo y krav magá) con una guardia y reglas comunes. En la semana va un tema por día (boxeo, muay thai y kick, suelo, krav magá e integración), cada uno con un complemento de fuerza, tronco, movilidad o cardio. Tiene su propia sesión guiada de 60 minutos.',
  },
  {
    titulo: '¿Cuál elijo?',
    texto:
      'Si querés mejorar en uno o dos estilos, la rutina marcial. Si querés defenderte en cualquier distancia (parado y en el suelo), el sistema completo. Cualquiera de los dos se combina con tu fuerza; los dos juntos se pisan, mejor uno.',
  },
]

/** Suma una sesión de sombra guiada a un día del plan. */
export function sumarSombraGuiada(plan: PlanSemana, dia: number, arteId: string, minutos: number, desde: string, movilidad = false, lugar?: string): PlanSemana {
  const p: PlanSemana = { ...structuredClone(plan), editado: true }
  const usados = new Set(p.dias.flatMap((d) => d.sesiones.map((s) => s.id)))
  let n = 1
  while (usados.has(`sombra-${dia}-${n}`)) n++
  p.dias[dia].sesiones.push(sesionMarcial(`sombra-${dia}-${n}`, arteId, { hora: desde, minutos }, movilidad, undefined, lugar))
  p.dias[dia].sesiones.sort((a, b) => (a.desde ?? '99').localeCompare(b.desde ?? '99'))
  return p
}
