import { useCallback, useEffect, useState } from 'react'
import { nivelPorPercentil } from '../calc/puntajes'
import { db } from '../db/db'
import type { Resultados } from '../evaluacion'
import { cargarInicio } from '../perfil'
import { todasLasSesiones } from '../registroEjercicios'
import { leerTipoCuerpo } from '../usarTipoCuerpo'
import { asegurarCiclo } from './ciclo'
import { escalonesIniciales, generarPlan, type EntradaPlan, type PlanSemana } from './generador'

const CLAVE = 'plan'

/** Junta todo lo que el generador necesita desde los datos guardados en el celular. */
export async function armarEntrada(): Promise<EntradaPlan | null> {
  const { perfil, lugares, semana } = await cargarInicio()
  if (!perfil?.inicioCompleto || !semana) return null
  const evs = await db.evaluaciones.orderBy('fecha').toArray()
  const ultima = evs[evs.length - 1]?.resultados as Resultados | undefined
  const nivel = (p?: number) => (p === undefined ? 2 : nivelPorPercentil(p).nivel)
  const nivelFuerza = nivel(ultima?.areas?.fuerza)
  const sesiones = await todasLasSesiones()
  const tipo = await leerTipoCuerpo()
  return {
    objetivos: perfil.objetivos ?? { estetica: 34, condicion: 33, combate: 33 },
    zonas: perfil.zonas ?? [],
    limitaciones: perfil.limitaciones ?? [],
    lugares,
    semana,
    nivelFuerza,
    nivelCardio: nivel(ultima?.areas?.cardio),
    tipoCuerpo: tipo.tipo,
    escalones: escalonesIniciales(nivelFuerza, sesiones.map((s) => s.ejercicio)),
    etapa: ((await db.ajustes.get('etapa'))?.valor as { numero?: number } | undefined)?.numero ?? 1,
  }
}

export async function guardarPlan(plan: PlanSemana) {
  await db.ajustes.put({ clave: CLAVE, valor: plan })
  // En la app de Android, si los avisos están prendidos, se reprograman con el plan nuevo.
  const { esNativo, leerAvisosActivos, programarAvisos } = await import('../nativo')
  if (esNativo() && (await leerAvisosActivos())) await programarAvisos(plan, true)
}

export async function leerPlan(): Promise<PlanSemana | null> {
  return ((await db.ajustes.get(CLAVE))?.valor as PlanSemana | undefined) ?? null
}

export function usarPlan() {
  const [plan, setPlan] = useState<PlanSemana | null | undefined>(undefined)
  const [entrada, setEntrada] = useState<EntradaPlan | null>(null)

  const cargar = useCallback(async () => {
    const [p, e] = await Promise.all([leerPlan(), armarEntrada()])
    if (p) await asegurarCiclo(p.creado)
    setEntrada(e)
    setPlan(p)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const generar = useCallback(async () => {
    const e = await armarEntrada()
    if (!e) return
    const nuevo = generarPlan(e)
    await guardarPlan(nuevo)
    await asegurarCiclo(nuevo.creado)
    setEntrada(e)
    setPlan(nuevo)
  }, [])

  const cambiar = useCallback(async (nuevo: PlanSemana) => {
    await guardarPlan(nuevo)
    setPlan(nuevo)
  }, [])

  return { plan, entrada, generar, cambiar }
}
