/* Agenda hora por hora (ESPECIFICACION.md 7.1).
   Plantillas por tipo de día + cambios puntuales para una fecha, más lo que pone la app: sueño, sesiones del plan,
   pausas activas en bloques largos sentado y el retest.
   Pausa activa cada 90 minutos en bloques fijos de 2 horas o más: decisión de diseño, en línea con la recomendación
   de la OMS 2020 de cortar el tiempo sentado. */
import { useCallback, useEffect, useState } from 'react'
import { db } from './db/db'
import type { Semana, TipoDia } from './perfil'
import type { PlanSemana } from './plan/generador'

export type TipoBloque = 'fijo' | 'comida' | 'actividad' | 'clase' | 'otro'

export interface Bloque {
  id: string
  tipo: TipoBloque
  nombre: string
  desde: string
  hasta: string
}

export interface Agenda {
  plantillas: Partial<Record<TipoDia, Bloque[]>>
  cambios: Record<string, { agregar: Bloque[]; quitar: string[] }>
}

export type TipoItem = TipoBloque | 'sueno' | 'entrenamiento' | 'micro' | 'retest' | 'libre'

export interface ItemAgenda {
  id: string
  tipo: TipoItem
  nombre: string
  desde: string
  hasta: string
  origen: 'plantilla' | 'puntual' | 'plan' | 'auto'
  /** Índice de la sesión del plan (para "Entrenar ahora"). */
  sesion?: number
  bloqueId?: string
}

export const NOMBRES_BLOQUE: Record<TipoBloque, string> = {
  fijo: 'Trabajo o estudio',
  comida: 'Comida',
  actividad: 'Actividad (caminata, bici)',
  clase: 'Clase',
  otro: 'Otro',
}

export const aMin = (h: string) => {
  const [a, b] = h.split(':').map(Number)
  return a * 60 + b
}
export const aHora = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const agendaVacia = (): Agenda => ({ plantillas: {}, cambios: {} })

/** Bloques fijos de un día concreto: los de la plantilla menos los quitados, más los puntuales. */
export function bloquesDe(agenda: Agenda, tipo: TipoDia, fecha: string): (Bloque & { origen: 'plantilla' | 'puntual' })[] {
  const cambio = agenda.cambios[fecha] ?? { agregar: [], quitar: [] }
  const base = (agenda.plantillas[tipo] ?? []).filter((b) => !cambio.quitar.includes(b.id)).map((b) => ({ ...b, origen: 'plantilla' as const }))
  return [...base, ...cambio.agregar.map((b) => ({ ...b, origen: 'puntual' as const }))]
}

export interface OpcionesDia {
  fecha: string
  /** 0 = lunes. */
  dia: number
  semana: Semana
  agenda: Agenda
  plan?: PlanSemana | null
  retest?: boolean
}

export function itemsDelDia(o: OpcionesDia): ItemAgenda[] {
  const tipo = o.semana.dias[o.dia]
  const t = o.semana.tipos[tipo]
  const items: ItemAgenda[] = []
  if (t) {
    items.push({ id: 'sueno-1', tipo: 'sueno', nombre: 'Dormir', desde: '00:00', hasta: t.despertar, origen: 'auto' })
    const dormir = aMin(t.dormir) < 4 * 60 ? '23:59' : t.dormir
    items.push({ id: 'sueno-2', tipo: 'sueno', nombre: 'Dormir', desde: dormir, hasta: '23:59', origen: 'auto' })
    for (const h of t.huecos) items.push({ id: `libre-${h.desde}`, tipo: 'libre', nombre: 'Libre para entrenar', desde: h.desde, hasta: h.hasta, origen: 'auto' })
  }
  const fijos = bloquesDe(o.agenda, tipo, o.fecha)
  for (const b of fijos) items.push({ id: `b-${b.id}`, tipo: b.tipo, nombre: b.nombre, desde: b.desde, hasta: b.hasta, origen: b.origen, bloqueId: b.id })

  // Pausas activas: cada 90 minutos dentro de bloques fijos de 2 horas o más (máximo 3 por día).
  let micro = 0
  for (const b of fijos.filter((x) => x.tipo === 'fijo')) {
    const ini = aMin(b.desde)
    const fin = aMin(b.hasta)
    for (let m = ini + 90; m + 5 <= fin - 15 && micro < 3; m += 90) {
      micro++
      items.push({ id: `micro-${micro}`, tipo: 'micro', nombre: 'Pausa activa (5 min)', desde: aHora(m), hasta: aHora(m + 5), origen: 'auto' })
    }
  }

  o.plan?.dias[o.dia]?.sesiones.forEach((s, i) => {
    if (!s.desde || !s.hasta || !s.ejercicios.length) return
    items.push({ id: `ses-${s.id}`, tipo: 'entrenamiento', nombre: s.titulo, desde: s.desde, hasta: s.hasta, origen: 'plan', sesion: i })
  })

  if (o.retest) {
    const hueco = t?.huecos[0]
    items.push({
      id: 'retest',
      tipo: 'retest',
      nombre: 'Volver a evaluarte (4 semanas)',
      desde: hueco?.desde ?? '18:00',
      hasta: hueco ? aHora(Math.min(aMin(hueco.desde) + 40, aMin(hueco.hasta))) : '18:40',
      origen: 'auto',
    })
  }
  return items.sort((a, b) => aMin(a.desde) - aMin(b.desde))
}

/** Pares de ítems que se pisan (sin contar sueño ni huecos libres). */
export function superposiciones(items: ItemAgenda[]): [ItemAgenda, ItemAgenda][] {
  const reales = items.filter((x) => x.tipo !== 'sueno' && x.tipo !== 'libre' && x.tipo !== 'micro')
  const r: [ItemAgenda, ItemAgenda][] = []
  for (let i = 0; i < reales.length; i++)
    for (let j = i + 1; j < reales.length; j++) {
      const a = reales[i]
      const b = reales[j]
      if (aMin(a.desde) < aMin(b.hasta) && aMin(b.desde) < aMin(a.hasta)) r.push([a, b])
    }
  return r
}

/* ---------- Cambios ---------- */

const nuevoId = () => Math.random().toString(36).slice(2, 9)

export function agregarBloque(a: Agenda, b: Omit<Bloque, 'id'>, donde: { tipo: TipoDia } | { fecha: string }): Agenda {
  const r = structuredClone(a)
  const bloque = { ...b, id: nuevoId() }
  if ('tipo' in donde) r.plantillas[donde.tipo] = [...(r.plantillas[donde.tipo] ?? []), bloque]
  else {
    const c = r.cambios[donde.fecha] ?? { agregar: [], quitar: [] }
    r.cambios[donde.fecha] = { ...c, agregar: [...c.agregar, bloque] }
  }
  return r
}

/** Editar un bloque: en la plantilla (todos los días de ese tipo) o solo esa fecha. */
export function editarBloque(a: Agenda, id: string, c: Partial<Omit<Bloque, 'id'>>, tipo: TipoDia, fecha: string, soloEsteDia: boolean): Agenda {
  const r = structuredClone(a)
  const enPlantilla = (r.plantillas[tipo] ?? []).find((b) => b.id === id)
  const cambio = r.cambios[fecha] ?? { agregar: [], quitar: [] }
  const puntual = cambio.agregar.find((b) => b.id === id)
  if (puntual) Object.assign(puntual, c)
  else if (enPlantilla && soloEsteDia) {
    cambio.quitar = [...cambio.quitar, id]
    cambio.agregar = [...cambio.agregar, { ...enPlantilla, ...c, id: nuevoId() }]
  } else if (enPlantilla) Object.assign(enPlantilla, c)
  r.cambios[fecha] = cambio
  return r
}

export function borrarBloque(a: Agenda, id: string, tipo: TipoDia, fecha: string, soloEsteDia: boolean): Agenda {
  const r = structuredClone(a)
  const cambio = r.cambios[fecha] ?? { agregar: [], quitar: [] }
  if (cambio.agregar.some((b) => b.id === id)) cambio.agregar = cambio.agregar.filter((b) => b.id !== id)
  else if (soloEsteDia) cambio.quitar = [...cambio.quitar, id]
  else r.plantillas[tipo] = (r.plantillas[tipo] ?? []).filter((b) => b.id !== id)
  r.cambios[fecha] = cambio
  return r
}

/* ---------- Guardado ---------- */

const CLAVE = 'agenda'

export function usarAgenda() {
  const [agenda, setAgenda] = useState<Agenda | null>(null)
  useEffect(() => {
    void db.ajustes.get(CLAVE).then((x) => setAgenda((x?.valor as Agenda | undefined) ?? agendaVacia()))
  }, [])
  const guardar = useCallback(async (a: Agenda) => {
    setAgenda(a)
    await db.ajustes.put({ clave: CLAVE, valor: a })
  }, [])
  return { agenda, guardar }
}
