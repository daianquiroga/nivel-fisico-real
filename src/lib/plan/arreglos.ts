/* Aplica las opciones para corregir los avisos de la semana (ver validador.ts). Devuelven un plan nuevo. */
import { sumarEntrenamiento } from './asistente'
import { cambiarDatosSesion, moverSesion, suavizarSesion } from './editar'
import type { PlanSemana } from './generador'
import type { Arreglo } from './validador'

export function aplicarArreglo(plan: PlanSemana, a: Arreglo, lugar?: string): PlanSemana {
  switch (a.tipo) {
    case 'mover':
    case 'copiar':
      return moverSesion(plan, a.dia, a.idx, a.destino, a.tipo === 'copiar')
    case 'suavizar':
      return suavizarSesion(plan, a.dia, a.idx)
    case 'adelantar':
      return cambiarDatosSesion(plan, a.dia, a.idx, { desde: a.desde })
    case 'agregar': {
      let p = plan
      for (const d of a.dias) p = sumarEntrenamiento(p, d.dia, a.extra, d.desde, lugar, a.extra === 'cardio' ? 30 : undefined)
      return { ...p, editado: true }
    }
    case 'ir':
      return plan
  }
}
