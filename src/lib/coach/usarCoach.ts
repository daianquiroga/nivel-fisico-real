import { cargasSemanales, estadoCarga } from '../calc/carga'
import { useCallback, useEffect, useState } from 'react'
import { db } from '../db/db'
import { leerControles, leerTipo, sesionesHechas, type Medidas } from '../diario'
import { ejercicio } from '../ejercicios'
import type { Resultados } from '../evaluacion'
import { faltasSeguidas, sesionesQueCuentan } from '../habitos'
import { LIMITACIONES, cargarInicio, diaDeHoy } from '../perfil'
import { armarEntrada, guardarPlan, leerPlan } from '../plan/usarPlan'
import { generarPlan } from '../plan/generador'
import { aprobados, basicosPara, type PruebaTecnica } from '../tecnica'
import { equipoDisponible } from '../ejercicios'
import { fechaLocal } from '../plan/sesion'
import { todasLasSesiones } from '../registroEjercicios'
import type { NivelLectura } from '../aprender'
import { ETAPAS, evaluarEtapa, type EstadoEtapa, type EtapaGuardada, type EvaluacionAreas } from './etapas'
import { consejos, type Consejo, type EjercicioCoach } from './reglas'

const CLAVE_ETAPA = 'etapa'
const CLAVE_OCULTOS = 'coach-ocultos'

/** Objetivo de bajar grasa: "Verme mejor" con 40 puntos o más de 100 (decisión de diseño). */
export const UMBRAL_GRASA = 40

export async function leerEtapa(inicioPorDefecto: string): Promise<EtapaGuardada> {
  const g = (await db.ajustes.get(CLAVE_ETAPA))?.valor as EtapaGuardada | undefined
  if (g) return g
  const nueva = { numero: 1, inicio: inicioPorDefecto }
  await db.ajustes.put({ clave: CLAVE_ETAPA, valor: nueva })
  return nueva
}

/** Pasa a la etapa siguiente. Si el plan no lo cambió la persona a mano, se vuelve a armar con la exigencia nueva. */
export async function pasarDeEtapa(actual: number): Promise<{ replanificado: boolean }> {
  const numero = Math.min(ETAPAS.length, actual + 1)
  await db.ajustes.put({ clave: CLAVE_ETAPA, valor: { numero, inicio: new Date().toISOString() } })
  const plan = await leerPlan()
  if (!plan || plan.editado) return { replanificado: false }
  const entrada = await armarEntrada()
  if (!entrada) return { replanificado: false }
  await guardarPlan(generarPlan(entrada))
  return { replanificado: true }
}

export async function activarLimitacion(valor: string) {
  const p = await db.perfil.get('yo')
  if (!p) return
  const l = new Set(p.limitaciones ?? [])
  l.add(valor)
  await db.perfil.update('yo', { limitaciones: [...l] })
}

/** Consejos que la persona cerró hoy (se guardan solo en este navegador y se olvidan al día siguiente). */
function leerOcultos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_OCULTOS) ?? '{}') as { fecha?: string; ids?: string[] }
    return v.fecha === fechaLocal() ? v.ids ?? [] : []
  } catch {
    return []
  }
}

/** Junta los datos guardados y devuelve los consejos de hoy y el estado de la etapa. */
export async function calcularCoach(nivel: NivelLectura): Promise<{ consejos: Consejo[]; etapa: EstadoEtapa | null }> {
  const [{ perfil, lugares }, plan, controles, hechas, sesiones, medidas, evs, tecnica] = await Promise.all([
    cargarInicio(),
    leerPlan(),
    leerControles(),
    sesionesHechas(),
    todasLasSesiones(),
    leerTipo<Medidas>('medidas'),
    db.evaluaciones.orderBy('fecha').toArray(),
    leerTipo<PruebaTecnica>('tecnica'),
  ])
  if (!perfil?.inicioCompleto) return { consejos: [], etapa: null }
  const hoy = fechaLocal()
  const fechas = hechas.map((h) => h.fecha.slice(0, 10))
  const control = controles[controles.length - 1]

  const porEj = new Map<string, EjercicioCoach>()
  for (const s of sesiones) {
    const e = ejercicio(s.ejercicio)
    if (!e) continue
    if (!porEj.has(e.id)) porEj.set(e.id, { id: e.id, nombre: e.nombre, ctx: { carga: e.carga, rango: e.rango }, sesiones: [] })
    porEj.get(e.id)!.sesiones.push(s)
  }

  const evaluaciones: EvaluacionAreas[] = evs.map((e) => ({ fecha: e.fecha, areas: (e.resultados as Resultados | undefined)?.areas ?? {} }))
  let etapa: EstadoEtapa | null = null
  if (plan) {
    const guardada = await leerEtapa(plan.creado)
    const basicos = basicosPara(plan, equipoDisponible(lugares), perfil.limitaciones ?? []).map((e) => e.id)
    etapa = evaluarEtapa(guardada, fechas, sesionesQueCuentan(plan).length, evaluaciones, new Date(), aprobados(tecnica, basicos))
  }

  const idxHoy = plan ? plan.dias[diaDeHoy()].sesiones.findIndex((s) => s.tipo !== 'movilidad' && s.ejercicios.length > 0) : -1
  const lista = consejos(
    {
      hoy,
      control,
      limitaciones: perfil.limitaciones ?? [],
      nombreZona: LIMITACIONES.find((l) => l.valor === control?.zona)?.texto,
      faltasSeguidas: faltasSeguidas(plan, fechas),
      rutaHoy: idxHoy >= 0 && !fechas.includes(hoy) ? `/entrenar/${diaDeHoy()}/${idxHoy}` : undefined,
      ejercicios: [...porEj.values()],
      cinturas: medidas.filter((m) => m.valores?.cintura).map((m) => ({ fecha: m.fecha, cm: m.valores.cintura })),
      objetivoGrasa: (perfil.objetivos?.estetica ?? 0) >= UMBRAL_GRASA,
      evaluaciones,
      etapa: etapa ?? undefined,
      carga: estadoCarga(cargasSemanales(await sesionesHechas())).estado,
    },
    nivel,
  )
  const ocultos = new Set(leerOcultos())
  return { consejos: lista.filter((c) => !ocultos.has(c.id)), etapa }
}

export function usarCoach(nivel: NivelLectura) {
  const [estado, setEstado] = useState<{ consejos: Consejo[]; etapa: EstadoEtapa | null } | null>(null)
  const recargar = useCallback(async () => setEstado(await calcularCoach(nivel)), [nivel])
  useEffect(() => {
    void recargar()
  }, [recargar])
  const ocultar = (id: string) => {
    try {
      localStorage.setItem(CLAVE_OCULTOS, JSON.stringify({ fecha: fechaLocal(), ids: [...leerOcultos(), id] }))
    } catch {
      /* sin almacenamiento: se oculta hasta recargar */
    }
    setEstado((e) => (e ? { ...e, consejos: e.consejos.filter((c) => c.id !== id) } : e))
  }
  return { estado, recargar, ocultar }
}
