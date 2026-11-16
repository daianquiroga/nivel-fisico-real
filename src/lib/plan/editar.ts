/* Cambios a mano sobre el plan. Todas las funciones devuelven un plan nuevo (no tocan el original). */
import { ejercicio, type Ejercicio } from '../ejercicios'
import { agrupar, estimarMinutos, type EjercicioPlan, type Metodo, type PlanSemana, type SesionPlan, type TipoSesion } from './generador'

const copiar = (p: PlanSemana): PlanSemana => ({ ...structuredClone(p), editado: true })

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function rolDe(e: Ejercicio): EjercicioPlan['rol'] {
  if (e.patron === 'cardio') return 'cardio'
  if (e.patron === 'movilidad') return 'movilidad'
  if (e.patron === 'core' || e.patron === 'transporte') return 'core'
  if (e.patron === 'accesorio') return 'accesorio'
  return 'principal'
}

/** Valores por defecto para un ejercicio agregado a mano. */
export function nuevoEjercicioPlan(e: Ejercicio): EjercicioPlan {
  const rol = rolDe(e)
  const unico = rol === 'cardio' || rol === 'movilidad'
  return {
    id: e.id,
    patrones: [e.patron],
    rol,
    series: unico ? 1 : rol === 'principal' ? 3 : 2,
    rango: e.tipo === 'minutos' ? [e.rango[0], e.rango[0]] : e.rango,
    descansoSeg: unico ? 0 : rol === 'principal' ? (e.carga === 'externa' ? 120 : 90) : rol === 'accesorio' ? 60 : 45,
  }
}

/** Vuelve a calcular letras de grupo y minutos de la sesión. */
function rehacer(s: SesionPlan) {
  if (s.tipo === 'fuerza') agrupar(s.ejercicios, s.metodo, false)
  const minutos = s.tipo === 'cardio' ? s.ejercicios.reduce((a, x) => a + x.rango[0], 0) || s.minutos : Math.max(10, estimarMinutos(s.ejercicios))
  s.minutos = minutos
  if (s.desde) s.hasta = aHora(aMin(s.desde) + minutos)
}

function conSesion(plan: PlanSemana, dia: number, idx: number, f: (s: SesionPlan) => void): PlanSemana {
  const p = copiar(plan)
  const s = p.dias[dia].sesiones[idx]
  if (s) {
    f(s)
    rehacer(s)
  }
  return p
}

export const agregarEjercicio = (plan: PlanSemana, dia: number, idx: number, id: string) =>
  conSesion(plan, dia, idx, (s) => {
    const e = ejercicio(id)
    if (e) s.ejercicios.push(nuevoEjercicioPlan(e))
  })

export const quitarEjercicio = (plan: PlanSemana, dia: number, idx: number, i: number) =>
  conSesion(plan, dia, idx, (s) => {
    s.ejercicios.splice(i, 1)
  })

export const moverEjercicio = (plan: PlanSemana, dia: number, idx: number, i: number, delta: -1 | 1) =>
  conSesion(plan, dia, idx, (s) => {
    const j = i + delta
    if (j < 0 || j >= s.ejercicios.length) return
    ;[s.ejercicios[i], s.ejercicios[j]] = [s.ejercicios[j], s.ejercicios[i]]
  })

export const ajustarEjercicio = (plan: PlanSemana, dia: number, idx: number, i: number, c: Partial<Pick<EjercicioPlan, 'series' | 'rango' | 'descansoSeg'>>) =>
  conSesion(plan, dia, idx, (s) => {
    const x = s.ejercicios[i]
    if (!x) return
    Object.assign(x, c)
    if (x.rango[0] > x.rango[1]) x.rango = [x.rango[1], x.rango[1]]
  })

export const cambiarMetodo = (plan: PlanSemana, dia: number, idx: number, metodo: Metodo) =>
  conSesion(plan, dia, idx, (s) => {
    s.metodo = metodo
    s.nota =
      metodo === 'circuito'
        ? 'Circuito: un ejercicio atrás del otro, descansando lo justo; al terminar la vuelta, 1 a 2 minutos y otra vuelta.'
        : metodo === 'superseries'
          ? 'Los ejercicios con la misma letra van juntos: hacé una serie de cada uno y después descansá.'
          : 'Series clásicas: todas las series de un ejercicio, con su pausa, y después el siguiente.'
  })

export const cambiarDatosSesion = (plan: PlanSemana, dia: number, idx: number, c: { titulo?: string; lugar?: string; desde?: string | null; intencion?: string }) =>
  conSesion(plan, dia, idx, (s) => {
    if (c.intencion !== undefined) s.intencion = c.intencion || undefined
    if (c.titulo !== undefined) s.titulo = c.titulo
    if (c.lugar !== undefined) s.lugar = c.lugar
    if (c.desde === null) {
      s.desde = undefined
      s.hasta = undefined
    } else if (c.desde !== undefined) s.desde = c.desde
  })

/** Mueve (o copia) una sesión a otro día. */
export function moverSesion(plan: PlanSemana, dia: number, idx: number, destino: number, copia = false): PlanSemana {
  const p = copiar(plan)
  const s = p.dias[dia].sesiones[idx]
  if (!s || destino === dia) return p
  const nueva = { ...structuredClone(s), id: nuevoId(p) }
  if (!copia) p.dias[dia].sesiones.splice(idx, 1)
  p.dias[destino].sesiones.push(copia ? nueva : s)
  return p
}

export function borrarSesion(plan: PlanSemana, dia: number, idx: number): PlanSemana {
  const p = copiar(plan)
  p.dias[dia].sesiones.splice(idx, 1)
  return p
}

function nuevoId(p: PlanSemana): string {
  const usados = new Set(p.dias.flatMap((d) => d.sesiones.map((s) => s.id)))
  let n = usados.size + 1
  while (usados.has(`m${n}`)) n++
  return `m${n}`
}

/** Sesión nueva hecha a mano. */
export function agregarSesion(plan: PlanSemana, dia: number, tipo: TipoSesion, lugar?: string): PlanSemana {
  const p = copiar(plan)
  const titulos: Record<TipoSesion, string> = { fuerza: 'Mi rutina de fuerza', cardio: 'Cardio', movilidad: 'Movilidad' }
  const ejercicios: EjercicioPlan[] = []
  if (tipo === 'cardio') {
    const e = ejercicio('caminata-rapida')
    if (e) ejercicios.push({ ...nuevoEjercicioPlan(e), rango: [30, 30] })
  }
  if (tipo === 'movilidad') for (const id of ['gato-camello', 'movilidad-tobillo', 'estiramiento-flexor-cadera']) ejercicios.push(nuevoEjercicioPlan(ejercicio(id)!))
  const s: SesionPlan = {
    id: nuevoId(p),
    tipo,
    titulo: titulos[tipo],
    lugar,
    minutos: 10,
    intensidad: tipo === 'fuerza' ? 'fuerte' : 'suave',
    metodo: 'clasico',
    ejercicios,
  }
  rehacer(s)
  p.dias[dia].sesiones.push(s)
  return p
}
