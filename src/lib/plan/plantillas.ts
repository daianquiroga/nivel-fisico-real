/* Plantillas de gimnasio listas (content/plantillas.json) llevadas a los días, horarios y equipo de la persona.
   En cada lugar de la plantilla se usa la primera opción que se puede hacer con el equipo de ese día y que no
   choca con una limitación. Rangos de repeticiones: los propios de cada ejercicio de la biblioteca. */
import plantillasJson from '../../content/plantillas.json'
import { huecosDelDia } from '../perfil'
import { ejercicio, equipoDeLugar, evitarPorLimitacion, sePuedeHacer } from '../ejercicios'
import { nuevoEjercicioPlan } from './editar'
import type { EntradaPlan, PlanSemana } from './generador'

export interface Plantilla {
  id: string
  nombre: string
  para: string
  diasMin: number
  diasIdeal: number
  orden: string[]
  dias: Record<string, { titulo: string; ejercicios: { opciones: string[]; series: number }[] }>
}

export const PLANTILLAS = plantillasJson.plantillas as unknown as Plantilla[]
export const FUENTE_PLANTILLAS = { texto: plantillasJson.fuente, enlaces: plantillasJson.enlaces }

const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Días de entrenamiento de la persona (los que tienen un lugar). */
export const diasDeEntrenamiento = (entrada: EntradaPlan) => [0, 1, 2, 3, 4, 5, 6].filter((d) => (entrada.semana.lugaresPorDia[d] ?? []).length > 0)

/** Arma la semana con la plantilla. Si hay más días que los que usa la plantilla, los que sobran quedan libres. */
export function semanaPlantilla(p: Plantilla, entrada: EntradaPlan, creado = new Date().toISOString()): PlanSemana {
  const plan: PlanSemana = { creado, editado: true, dias: Array.from({ length: 7 }, () => ({ sesiones: [] })) }
  const dias = diasDeEntrenamiento(entrada).slice(0, p.orden.length)
  dias.forEach((d, i) => {
    const clave = p.orden[i % p.orden.length]
    const dia = p.dias[clave]
    const lugar = entrada.lugares.find((l) => l.nombre === entrada.semana.lugaresPorDia[d][0]) ?? entrada.lugares[0]
    const equipo = lugar ? equipoDeLugar(lugar) : new Set<string>()
    const ejercicios = dia.ejercicios.flatMap((slot) => {
      const id = slot.opciones.find((o) => {
        const e = ejercicio(o)
        return e && sePuedeHacer(e, equipo) && !evitarPorLimitacion(e, entrada.limitaciones)
      })
      return id ? [{ ...nuevoEjercicioPlan(ejercicio(id)!), series: slot.series }] : []
    })
    const hueco = [...(huecosDelDia(entrada.semana, d))].sort((a, b) => aMin(b.hasta) - aMin(b.desde) - (aMin(a.hasta) - aMin(a.desde)))[0]
    // Unos 2,5 minutos por serie con descanso, más 8 de entrada en calor (decisión de diseño).
    const minutos = Math.round(8 + ejercicios.reduce((a, x) => a + x.series * 2.5, 0))
    plan.dias[d].sesiones.push({
      id: `plantilla-${d}`,
      tipo: 'fuerza',
      titulo: dia.titulo,
      lugar: lugar?.nombre,
      desde: hueco?.desde,
      hasta: hueco?.desde ? aHora(aMin(hueco.desde) + minutos) : undefined,
      minutos,
      intensidad: 'fuerte',
      metodo: 'clasico',
      ejercicios,
    })
  })
  return plan
}
