/* Validador del plan (ESPECIFICACION.md 7.3) y medidor de equilibrio semanal (7.4).
   Metas de cardio y fuerza: OMS 2020. Sueño de 7 horas o más: recomendación de consenso para adultos
   (Watson y colegas 2015, AASM y SRS). Lo demás son reglas de diseño de la app. */
import oms from '../../content/normas/actividad-oms.json'
import { NOMBRES_DIAS, horasDeSueno, type Semana } from '../perfil'
import type { PlanSemana } from './generador'

export interface Aviso {
  tipo: 'cuidado' | 'info'
  texto: string
}

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}

const fuerte = (plan: PlanSemana, d: number) => plan.dias[d].sesiones.some((s) => s.intensidad === 'fuerte')

export function validarPlan(plan: PlanSemana, semana: Semana): Aviso[] {
  const avisos: Aviso[] = []
  for (let d = 0; d < 7; d++) {
    const sig = (d + 1) % 7
    const titulos = [d, sig].map((x) => plan.dias[x].sesiones.find((ss) => ss.intensidad === 'fuerte')?.titulo ?? '')
    const partido = titulos.some((t) => t.includes('superior')) && titulos.some((t) => t.includes('inferior'))
    if (fuerte(plan, d) && fuerte(plan, sig) && !partido) {
      avisos.push({ tipo: 'cuidado', texto: `${NOMBRES_DIAS[d]} y ${NOMBRES_DIAS[sig].toLowerCase()} son dos días fuertes seguidos. Si podés, dejá uno suave en el medio.` })
    }
    const tipo = semana.tipos[semana.dias[d]]
    for (const s of plan.dias[d].sesiones) {
      if (s.intensidad !== 'fuerte' || !s.hasta || !tipo) continue
      const margen = (((aMin(tipo.dormir) - aMin(s.hasta)) % 1440) + 1440) % 1440
      if (margen < 120) avisos.push({ tipo: 'cuidado', texto: `${NOMBRES_DIAS[d]}: la sesión termina a menos de 2 horas de dormir. Puede costarte conciliar el sueño.` })
    }
    if (plan.dias[d].sesiones.some((s) => s.intensidad === 'fuerte' && !s.desde)) {
      avisos.push({ tipo: 'info', texto: `${NOMBRES_DIAS[d]}: no cargaste un horario libre; entrená cuando puedas.` })
    }
  }
  const tiposUsados = new Set(semana.dias)
  for (const t of tiposUsados) {
    const h = horasDeSueno(semana.tipos[t].dormir, semana.tipos[t].despertar)
    if (h < 7) avisos.push({ tipo: 'cuidado', texto: `Tenés programadas ${String(Math.round(h * 10) / 10).replace('.', ',')} horas de sueño en algunos días: lo recomendado es 7 o más. Dormir es parte del entrenamiento.` })
  }
  const eq = equilibrio(plan)
  for (const a of eq) if (a.valor < a.min) avisos.push({ tipo: a.area === 'cardio' || a.area === 'fuerza' ? 'cuidado' : 'info', texto: a.consejo })
  return avisos
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
