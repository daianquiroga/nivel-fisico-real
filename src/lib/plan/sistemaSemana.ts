/* Plan semanal del sistema completo (content/combate/sistema.json → semana) llevado a los horarios de la persona.
   Reparto (decisión de diseño a partir del documento): cada día de entrenamiento lleva un tema de combate
   (≈ 60 % del tiempo: juego de pies + sombra del tema) y su complemento físico (≈ 40 %).
   Si hay menos de 5 días, se priorizan: integración, boxeo, muay thai y kick, suelo, krav magá.
   Si hay más de 5, los que sobran quedan libres (descanso activo). */
import { ejercicio, equipoDeLugar, evitarPorLimitacion, sePuedeHacer } from '../ejercicios'
import { nuevoEjercicioPlan } from './editar'
import type { EjercicioPlan, EntradaPlan, PlanSemana, SesionPlan } from './generador'

export interface TemaSemana {
  clave: string
  titulo: string
  nota: string
  /** Ejercicios del complemento, en orden de preferencia (se usan los que se pueden hacer con el equipo). */
  complemento: string[]
  /** Cuántos del complemento entran. */
  cuantos: number
  tipo: SesionPlan['tipo']
}

/** En el orden del documento (lunes a viernes). */
export const TEMAS: TemaSemana[] = [
  { clave: 'boxeo', titulo: 'Combate: boxeo + piernas', nota: 'Manos, esquivas y defensa + contra. Después, fuerza de piernas.', complemento: ['sentadilla-goblet', 'sentadilla', 'zancada-atras', 'sentadilla-bulgara', 'puente-gluteo'], cuantos: 2, tipo: 'fuerza' },
  { clave: 'muaythai', titulo: 'Combate: muay thai y kick + tronco', nota: 'Patadas, chequeos y clinch. Después, tronco.', complemento: ['plancha', 'plancha-lateral', 'pallof-banda', 'dead-bug'], cuantos: 2, tipo: 'fuerza' },
  { clave: 'suelo', titulo: 'Combate: suelo (BJJ) + movilidad', nota: 'Sombra de suelo: camarón, puente, levantada técnica, granby y sit-out (ver Sistema completo → Transiciones). Necesitás unos 2 × 1 m o un colchón finito. Después, movilidad.', complemento: ['rotacion-toracica', 'estiramiento-flexor-cadera', 'movilidad-tobillo', 'gato-camello'], cuantos: 3, tipo: 'movilidad' },
  { clave: 'kravmaga', titulo: 'Combate: krav magá + explosividad', nota: 'Escenarios, reacción (Contragolpes) y espacios chicos. Después, intervalos explosivos.', complemento: ['soga', 'marcha-rodillas-altas'], cuantos: 1, tipo: 'cardio' },
  { clave: 'integracion', titulo: 'Combate: integración + cardio', nota: 'Cadenas completas y sombra libre con cansancio. Si tenés 60 minutos, hacé la sesión guiada del sistema completo.', complemento: ['soga', 'trote-suave', 'caminata-rapida'], cuantos: 1, tipo: 'cardio' },
]

const PRIORIDAD = ['integracion', 'boxeo', 'muaythai', 'suelo', 'kravmaga']

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const minutosDe = (id: string, m: number): EjercicioPlan => ({ id, patrones: ['cardio'], rol: 'cardio', series: 1, rango: [m, m], descansoSeg: 0 })

/** Qué tema le toca a cada día con entrenamiento (en orden de la semana), según cuántos días hay. */
export function temasParaDias(dias: number[]): Map<number, TemaSemana> {
  const usar = new Set(PRIORIDAD.slice(0, Math.min(5, dias.length)))
  const elegidos = TEMAS.filter((t) => usar.has(t.clave))
  const out = new Map<number, TemaSemana>()
  dias.slice(0, elegidos.length).forEach((d, i) => out.set(d, elegidos[i]))
  return out
}

/** Arma la semana del sistema completo con los días, horarios y lugares de la persona. */
export function semanaSistema(entrada: EntradaPlan, creado = new Date().toISOString()): PlanSemana {
  const { semana, lugares } = entrada
  const dias = [0, 1, 2, 3, 4, 5, 6].filter((d) => (semana.lugaresPorDia[d] ?? []).length > 0)
  const temas = temasParaDias(dias)
  const plan: PlanSemana = { creado, editado: true, dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) }
  for (const [d, tema] of temas) {
    const lugar = lugares.find((l) => l.nombre === semana.lugaresPorDia[d][0]) ?? lugares[0]
    const equipo = lugar ? equipoDeLugar(lugar) : new Set<string>()
    const hueco = [...(semana.tipos[semana.dias[d]]?.huecos ?? [])].sort((a, b) => aMin(b.hasta) - aMin(b.desde) - (aMin(a.hasta) - aMin(a.desde)))[0]
    const disponible = hueco ? (((aMin(hueco.hasta) - aMin(hueco.desde)) % 1440) + 1440) % 1440 : 45
    const total = Math.max(30, Math.min(60, disponible))
    const combate = Math.round((total * 0.6) / 3) * 3
    const pies = 6
    const ejercicios: EjercicioPlan[] = [minutosDe('juego-pies', pies), minutosDe('sombra', Math.max(6, combate - pies))]
    const resto = total - combate
    const posibles = tema.complemento.filter((id) => {
      const e = ejercicio(id)
      return e && sePuedeHacer(e, equipo) && !evitarPorLimitacion(e, entrada.limitaciones)
    })
    for (const id of posibles.slice(0, tema.cuantos)) {
      const e = ejercicio(id)!
      ejercicios.push(e.tipo === 'minutos' ? minutosDe(id, Math.max(5, Math.round(resto / tema.cuantos))) : nuevoEjercicioPlan(e))
    }
    const desde = hueco?.desde
    plan.dias[d].sesiones.push({
      id: `sistema-${d}`,
      tipo: tema.tipo,
      titulo: tema.titulo,
      lugar: lugar?.nombre,
      desde,
      hasta: desde ? aHora(aMin(desde) + total) : undefined,
      minutos: total,
      intensidad: tema.tipo === 'movilidad' ? 'suave' : 'fuerte',
      metodo: 'clasico',
      ejercicios,
      nota: tema.nota,
    })
  }
  return plan
}

/** Suma las sesiones del sistema a un plan existente (en los mismos días, después de lo que ya hay). */
export function sumarAlPlan(actual: PlanSemana, sistema: PlanSemana): PlanSemana {
  const p: PlanSemana = structuredClone(actual)
  p.editado = true
  sistema.dias.forEach((d, i) => {
    for (const s of d.sesiones) {
      const ultima = p.dias[i].sesiones.filter((x) => x.hasta).sort((a, b) => (a.hasta! < b.hasta! ? 1 : -1))[0]
      const desde = ultima?.hasta ? aHora(aMin(ultima.hasta) + 15) : s.desde
      p.dias[i].sesiones.push({ ...s, id: `${s.id}-${p.dias[i].sesiones.length}`, desde, hasta: desde ? aHora(aMin(desde) + s.minutos) : undefined })
    }
  })
  return p
}
