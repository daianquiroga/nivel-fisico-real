/* Validador del plan (ESPECIFICACION.md 7.3) y medidor de equilibrio semanal (7.4).
   Metas de cardio y fuerza: OMS 2020. Sueño de 7 horas o más: recomendación de consenso para adultos
   (Watson y colegas 2015, AASM y SRS). Lo demás son reglas de diseño de la app. */
import oms from '../../content/normas/actividad-oms.json'
import { NOMBRES_DIAS, horasDeSueno, huecosDelDia, type Semana } from '../perfil'
import type { PlanSemana } from './generador'

/** Una forma de corregir un aviso con un toque (se aplica con aplicarArreglo, en arreglos.ts). Las opciones son decisión de diseño. */
export type Arreglo =
  | { tipo: 'mover' | 'copiar'; texto: string; dia: number; idx: number; destino: number }
  | { tipo: 'suavizar'; texto: string; dia: number; idx: number }
  | { tipo: 'adelantar'; texto: string; dia: number; idx: number; desde: string }
  | { tipo: 'agregar'; texto: string; extra: 'cardio' | 'movilidad'; dias: { dia: number; desde: string }[] }
  | { tipo: 'ir'; texto: string; ruta: string }

export interface Aviso {
  tipo: 'cuidado' | 'info'
  texto: string
  /** Opciones para corregirlo. */
  arreglos?: Arreglo[]
}

const dia = (d: number) => NOMBRES_DIAS[d].toLowerCase()
const y = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0])

/** Horario para sumar algo un día: el hueco libre del día o, si no hay, 15 minutos después de lo último que tenga. */
export function horaPara(plan: PlanSemana, semana: Semana, d: number): string {
  const ultima = plan.dias[d].sesiones.filter((s) => s.hasta).at(-1)?.hasta
  if (ultima) return aHora(aMin(ultima) + 15)
  return huecosDelDia(semana, d)[0]?.desde ?? '08:00'
}

/** Días donde una sesión fuerte no queda pegada a otra fuerte (sin contar la que se mueve). */
function diaLibreParaFuerte(plan: PlanSemana, sacar: { dia: number; idx: number } | null, evitar: number[]): number | undefined {
  const fuerteSin = (d: number) => plan.dias[d].sesiones.some((s, i) => s.intensidad === 'fuerte' && !(sacar && d === sacar.dia && i === sacar.idx))
  const candidatos = [0, 1, 2, 3, 4, 5, 6].filter((d) => !evitar.includes(d) && !fuerteSin(d) && !fuerteSin((d + 6) % 7) && !fuerteSin((d + 1) % 7))
  const desde = sacar?.dia ?? 0
  return candidatos.sort((a, b) => Math.min((a - desde + 7) % 7, (desde - a + 7) % 7) - Math.min((b - desde + 7) % 7, (desde - b + 7) % 7))[0]
}

function aMin(h: string) {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
function aHora(m: number) {
  const x = ((m % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

const fuerte = (plan: PlanSemana, d: number) => plan.dias[d].sesiones.some((s) => s.intensidad === 'fuerte')

export function validarPlan(plan: PlanSemana, semana: Semana): Aviso[] {
  const avisos: Aviso[] = []
  for (let d = 0; d < 7; d++) {
    const sig = (d + 1) % 7
    const titulos = [d, sig].map((x) => plan.dias[x].sesiones.find((ss) => ss.intensidad === 'fuerte')?.titulo ?? '')
    const partido = titulos.some((t) => t.includes('superior')) && titulos.some((t) => t.includes('inferior'))
    if (fuerte(plan, d) && fuerte(plan, sig) && !partido) {
      const idx = plan.dias[sig].sesiones.findIndex((s) => s.intensidad === 'fuerte')
      const ses = plan.dias[sig].sesiones[idx]
      const destino = diaLibreParaFuerte(plan, { dia: sig, idx }, [d, sig])
      const arreglos: Arreglo[] = []
      if (destino !== undefined) arreglos.push({ tipo: 'mover', texto: `Pasar "${ses.titulo}" al ${dia(destino)}`, dia: sig, idx, destino })
      arreglos.push({ tipo: 'suavizar', texto: `Hacer más liviana la del ${dia(sig)}`, dia: sig, idx })
      avisos.push({ tipo: 'cuidado', texto: `${NOMBRES_DIAS[d]} y ${dia(sig)} son dos días fuertes seguidos. Si podés, dejá uno suave en el medio.`, arreglos })
    }
    const tipo = semana.tipos[semana.dias[d]]
    plan.dias[d].sesiones.forEach((s, idx) => {
      if (s.intensidad !== 'fuerte' || !s.hasta || !s.desde || !tipo) return
      const margen = (((aMin(tipo.dormir) - aMin(s.hasta)) % 1440) + 1440) % 1440
      if (margen < 120) {
        const antes = Math.ceil((120 - margen) / 15) * 15
        const desde = aHora(aMin(s.desde) - antes)
        avisos.push({
          tipo: 'cuidado',
          texto: `${NOMBRES_DIAS[d]}: la sesión termina a menos de 2 horas de dormir. Puede costarte conciliar el sueño.`,
          arreglos: [{ tipo: 'adelantar', texto: `Empezarla a las ${desde}`, dia: d, idx, desde }],
        })
      }
    })
    if (plan.dias[d].sesiones.some((s) => s.intensidad === 'fuerte' && !s.desde)) {
      avisos.push({ tipo: 'info', texto: `${NOMBRES_DIAS[d]}: no cargaste un horario libre; entrená cuando puedas.` })
    }
  }
  const tiposUsados = new Set(semana.dias)
  for (const t of tiposUsados) {
    const h = horasDeSueno(semana.tipos[t].dormir, semana.tipos[t].despertar)
    if (h < 7)
      avisos.push({
        tipo: 'cuidado',
        texto: `Tenés programadas ${String(Math.round(h * 10) / 10).replace('.', ',')} horas de sueño en algunos días: lo recomendado es 7 o más. Dormir es parte del entrenamiento.`,
        arreglos: [{ tipo: 'ir', texto: 'Cambiar mis horarios', ruta: '/perfil' }],
      })
  }
  const eq = equilibrio(plan)
  for (const a of eq) if (a.valor < a.min) avisos.push({ tipo: a.area === 'cardio' || a.area === 'fuerza' ? 'cuidado' : 'info', texto: a.consejo, arreglos: arreglosEquilibrio(plan, semana, a) })
  return avisos
}

/** Opciones para llegar al mínimo de cada área. */
function arreglosEquilibrio(plan: PlanSemana, semana: Semana, a: Area): Arreglo[] {
  const conFuerte = (d: number) => plan.dias[d].sesiones.some((s) => s.intensidad === 'fuerte')
  const todos = [0, 1, 2, 3, 4, 5, 6]
  if (a.area === 'fuerza') {
    let origen: { dia: number; idx: number } | null = null
    plan.dias.forEach((d, i) => d.sesiones.forEach((s, j) => (origen ??= s.tipo === 'fuerza' ? { dia: i, idx: j } : null)))
    if (!origen) return [{ tipo: 'ir', texto: 'Armar una rutina de fuerza', ruta: '/plan/asistente' }]
    const o = origen as { dia: number; idx: number }
    const destino = diaLibreParaFuerte(plan, null, []) ?? todos.find((d) => !conFuerte(d))
    if (destino === undefined) return []
    return [{ tipo: 'copiar', texto: `Repetir "${plan.dias[o.dia].sesiones[o.idx].titulo}" el ${dia(destino)}`, dia: o.dia, idx: o.idx, destino }]
  }
  if (a.area === 'cardio') {
    const cuantos = Math.min(3, Math.ceil((a.min - a.valor) / 30))
    const sinCardio = todos.filter((d) => !plan.dias[d].sesiones.some((s) => s.tipo === 'cardio'))
    const dias = [...sinCardio.filter((d) => !conFuerte(d)), ...sinCardio.filter(conFuerte)].slice(0, cuantos).sort((x, z) => x - z)
    if (!dias.length) return []
    return [{ tipo: 'agregar', texto: `Sumar 30 minutos de caminata rápida el ${y(dias.map(dia))}`, extra: 'cardio', dias: dias.map((d) => ({ dia: d, desde: horaPara(plan, semana, d) })) }]
  }
  if (a.area === 'movilidad') {
    const sinMov = todos.filter((d) => !plan.dias[d].sesiones.some((s) => s.tipo === 'movilidad' || s.ejercicios.some((e) => e.rol === 'movilidad')))
    const dias = sinMov.slice(0, a.min - a.valor)
    if (!dias.length) return []
    return [{ tipo: 'agregar', texto: `Sumar 10 minutos de movilidad el ${y(dias.map(dia))}`, extra: 'movilidad', dias: dias.map((d) => ({ dia: d, desde: horaPara(plan, semana, d) })) }]
  }
  // Recuperación: hacer liviano el día fuerte más corto.
  let mejor: { dia: number; idx: number; min: number } | null = null
  plan.dias.forEach((d, i) =>
    d.sesiones.forEach((s, j) => {
      if (s.intensidad === 'fuerte' && (!mejor || s.minutos < mejor.min)) mejor = { dia: i, idx: j, min: s.minutos }
    }),
  )
  if (!mejor) return []
  const m = mejor as { dia: number; idx: number }
  return [{ tipo: 'suavizar', texto: `Hacer liviano el ${dia(m.dia)}`, dia: m.dia, idx: m.idx }]
}

export interface Area {
  area: 'fuerza' | 'cardio' | 'movilidad' | 'recuperacion'
  nombre: string
  valor: number
  min: number
  max: number
  unidad: string
  consejo: string
}

export function equilibrio(plan: PlanSemana): Area[] {
  const sesiones = plan.dias.flatMap((d) => d.sesiones)
  const diasFuerza = plan.dias.filter((d) => d.sesiones.some((s) => s.tipo === 'fuerza')).length
  const minCardio = sesiones.filter((s) => s.tipo === 'cardio').reduce((a, s) => a + s.minutos, 0)
  const diasMovilidad = plan.dias.filter((d) => d.sesiones.some((s) => s.tipo === 'movilidad' || s.ejercicios.some((e) => e.rol === 'movilidad'))).length
  const diasSuaves = plan.dias.filter((d) => !d.sesiones.some((s) => s.intensidad === 'fuerte')).length
  return [
    {
      area: 'fuerza',
      nombre: 'Fuerza',
      valor: diasFuerza,
      min: oms.fuerzaDias.min,
      max: oms.fuerzaDias.max,
      unidad: 'días',
      consejo: `Fuerza: la OMS recomienda al menos ${oms.fuerzaDias.min} días por semana. Sumá un día de entrenamiento en Perfil → Editar mis datos.`,
    },
    {
      area: 'cardio',
      nombre: 'Cardio',
      valor: minCardio,
      min: oms.cardioMinutos.min,
      max: oms.cardioMinutos.max,
      unidad: 'min',
      consejo: `Cardio: ${minCardio} minutos programados; la OMS recomienda ${oms.cardioMinutos.min} a ${oms.cardioMinutos.max}. Las caminatas del día a día también cuentan (se podrán anotar en la próxima etapa).`,
    },
    { area: 'movilidad', nombre: 'Movilidad', valor: diasMovilidad, min: 5, max: 7, unidad: 'días', consejo: 'Movilidad: conviene casi todos los días, aunque sean 10 minutos.' },
    { area: 'recuperacion', nombre: 'Recuperación', valor: diasSuaves, min: 1, max: 4, unidad: 'días suaves', consejo: 'Recuperación: dejá al menos un día sin entrenamiento fuerte.' },
  ]
}
