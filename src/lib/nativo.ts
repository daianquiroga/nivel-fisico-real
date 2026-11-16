/* Todo lo que solo existe en la app de Android (Capacitor): Health Connect y avisos locales.
   En el navegador estas funciones no hacen nada y la app sigue igual que siempre. */
import { Capacitor } from '@capacitor/core'
import { db } from './db/db'
import { guardarPasos, leerPasos, type DiaPasos } from './diario'
import { sesionesQueCuentan } from './habitos'
import type { PlanSemana } from './plan/generador'
import { fechaLocal } from './plan/sesion'
import { NOMBRES_DIAS } from './perfil'

export const esNativo = () => Capacitor.isNativePlatform()

/** ¿Es un celular Android usando la app desde el navegador? (para ofrecer la app de Android). */
export const esAndroidWeb = () => !esNativo() && /Android/i.test(navigator.userAgent)

/** Dirección del archivo de la app en la página de versiones del repositorio (sale de la dirección de la web). */
export function urlApk(host = location.hostname, ruta = location.pathname): string | null {
  const usuario = host.endsWith('.github.io') ? host.split('.')[0] : null
  const repo = ruta.split('/').filter(Boolean)[0]
  return usuario && repo ? `https://github.com/${usuario}/${repo}/releases/download/android/${repo}.apk` : null
}

/* ---------- Pasos desde Health Connect ---------- */

export interface DiaHC {
  fecha: string
  pasos: number
  km?: number
}

/** Une lo leído de Health Connect con lo cargado a mano: por día se queda el número más alto (para no sumar dos veces). */
export function combinarPasos(guardados: DiaPasos[], leidos: DiaHC[]): DiaPasos[] {
  const previos = new Map(guardados.map((d) => [d.fecha, d]))
  const out: DiaPasos[] = []
  for (const l of leidos) {
    if (l.pasos <= 0) continue
    const p = previos.get(l.fecha)
    if (p && p.pasos >= l.pasos && p.origen !== 'health-connect') continue
    if (p && p.origen === 'health-connect' && p.pasos === l.pasos && p.km === l.km) continue
    out.push({ fecha: l.fecha, pasos: l.pasos, km: l.km, origen: 'health-connect' })
  }
  return out
}

/** Agrupa los totales por día que devuelve Health Connect (con fecha ISO) en días locales. */
export function porDia(muestras: { startDate: string; value: number }[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of muestras) {
    const f = fechaLocal(new Date(s.startDate))
    m.set(f, (m.get(f) ?? 0) + s.value)
  }
  return m
}

export interface EstadoHC {
  activo: boolean
  ultima?: string
}

export async function leerEstadoHC(): Promise<EstadoHC> {
  return ((await db.ajustes.get('health-connect'))?.valor as EstadoHC | undefined) ?? { activo: false }
}

async function guardarEstadoHC(e: EstadoHC) {
  await db.ajustes.put({ clave: 'health-connect', valor: e })
}

export type ResultadoHC = { ok: true; dias: number } | { ok: false; motivo: 'web' | 'no-instalado' | 'sin-permiso' | 'error'; detalle?: string }

/** Pide permiso (solo lectura de pasos y distancia) y trae los últimos 14 días. */
export async function conectarHealthConnect(): Promise<ResultadoHC> {
  if (!esNativo()) return { ok: false, motivo: 'web' }
  const { Health } = await import('@capgo/capacitor-health')
  const disp = await Health.isAvailable()
  if (!disp.available) return { ok: false, motivo: 'no-instalado', detalle: disp.reason }
  const permiso = await Health.requestAuthorization({ read: ['steps', 'distance'] })
  if (!permiso.readAuthorized.includes('steps')) return { ok: false, motivo: 'sin-permiso' }
  await guardarEstadoHC({ activo: true })
  return sincronizarPasos()
}

/** Lee los pasos y la distancia por día de los últimos 14 días y los guarda en el celular. */
export async function sincronizarPasos(dias = 14): Promise<ResultadoHC> {
  if (!esNativo()) return { ok: false, motivo: 'web' }
  try {
    const { Health } = await import('@capgo/capacitor-health')
    const desde = new Date()
    desde.setHours(0, 0, 0, 0)
    desde.setDate(desde.getDate() - (dias - 1))
    const rango = { startDate: desde.toISOString(), endDate: new Date().toISOString(), bucket: 'day' as const, aggregation: 'sum' as const }
    const pasos = porDia((await Health.queryAggregated({ dataType: 'steps', ...rango })).samples)
    let metros = new Map<string, number>()
    try {
      metros = porDia((await Health.queryAggregated({ dataType: 'distance', ...rango })).samples)
    } catch {
      /* sin permiso de distancia: seguimos solo con pasos */
    }
    const leidos: DiaHC[] = [...pasos].map(([fecha, n]) => ({ fecha, pasos: Math.round(n), km: metros.has(fecha) ? Math.round((metros.get(fecha)! / 1000) * 10) / 10 : undefined }))
    const nuevos = combinarPasos(await leerPasos(), leidos)
    for (const d of nuevos) await guardarPasos(d)
    await guardarEstadoHC({ activo: true, ultima: new Date().toISOString() })
    return { ok: true, dias: nuevos.length }
  } catch (e) {
    return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) }
  }
}

export async function abrirAjustesHC() {
  if (!esNativo()) return
  const { Health } = await import('@capgo/capacitor-health')
  await Health.openHealthConnectSettings()
}

/* ---------- Avisos locales de las sesiones ---------- */

export interface Aviso {
  id: number
  /** 1 = domingo … 7 = sábado (como lo usa Android). */
  weekday: number
  hour: number
  minute: number
  titulo: string
  texto: string
}

/** Un aviso por semana para cada sesión con hora: 15 minutos antes, con la frase "cuando… entonces…". */
export function avisosDelPlan(plan: PlanSemana | null, antes = 15): Aviso[] {
  const out: Aviso[] = []
  for (const { dia, sesion } of sesionesQueCuentan(plan)) {
    if (!sesion.desde) continue
    const [h, m] = sesion.desde.split(':').map(Number)
    let total = h * 60 + m - antes
    let d = dia
    if (total < 0) {
      total += 24 * 60
      d = (d + 6) % 7
    }
    out.push({
      id: 1000 + out.length,
      weekday: ((d + 1) % 7) + 1, // lunes (0 en la app) → 2 en Android
      hour: Math.floor(total / 60),
      minute: total % 60,
      titulo: `${sesion.titulo} en ${antes} minutos`,
      texto: sesion.intencion ?? `${NOMBRES_DIAS[dia]} ${sesion.desde}${sesion.lugar ? ` · ${sesion.lugar}` : ''}. La versión mínima también vale.`,
    })
  }
  return out
}

export interface PreferenciaAvisos {
  /** 15 minutos antes de cada sesión con horario. */
  sesiones: boolean
  /** Hora del recordatorio diario del control (sueño, energía, molestias), o nada. */
  control?: string
  /** Aviso el día que toca la evaluación (4 semanas después de la última). */
  evaluacion: boolean
}

export async function leerAvisos(): Promise<PreferenciaAvisos> {
  const v = (await db.ajustes.get('avisos'))?.valor as PreferenciaAvisos | boolean | undefined
  if (typeof v === 'boolean') return { sesiones: v, evaluacion: false }
  return v ?? { sesiones: false, evaluacion: false }
}

export async function leerAvisosActivos(): Promise<boolean> {
  const a = await leerAvisos()
  return a.sesiones || Boolean(a.control) || a.evaluacion
}

/** Fecha y hora del aviso de evaluación: 28 días después de la última, a las 10. Si ya pasó, mañana a las 10. */
export function fechaAvisoEvaluacion(ultima: string | undefined, hoy = new Date()): Date {
  const d = ultima ? new Date(ultima) : new Date(hoy)
  if (ultima) d.setDate(d.getDate() + 28)
  d.setHours(10, 0, 0, 0)
  if (d.getTime() <= hoy.getTime()) {
    const m = new Date(hoy)
    m.setDate(m.getDate() + 1)
    m.setHours(10, 0, 0, 0)
    return m
  }
  return d
}

/** Programa todos los avisos según las preferencias (borra los anteriores). Devuelve cuántos quedaron. */
export async function programarAvisos(plan: PlanSemana | null, pref: boolean | PreferenciaAvisos): Promise<number | 'sin-permiso' | 'web'> {
  if (!esNativo()) return 'web'
  const p: PreferenciaAvisos = typeof pref === 'boolean' ? { ...(await leerAvisos()), sesiones: pref } : pref
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const pendientes = await LocalNotifications.getPending()
  if (pendientes.notifications.length) await LocalNotifications.cancel({ notifications: pendientes.notifications.map((n) => ({ id: n.id })) })
  await db.ajustes.put({ clave: 'avisos', valor: p })
  if (!p.sesiones && !p.control && !p.evaluacion) return 0
  const permiso = await LocalNotifications.requestPermissions()
  if (permiso.display !== 'granted') {
    await db.ajustes.put({ clave: 'avisos', valor: { sesiones: false, evaluacion: false } })
    return 'sin-permiso'
  }
  type Notif = Parameters<typeof LocalNotifications.schedule>[0]['notifications'][number]
  const lista: Notif[] = []
  if (p.sesiones)
    for (const a of avisosDelPlan(plan))
      lista.push({ id: a.id, title: a.titulo, body: a.texto, schedule: { on: { weekday: a.weekday, hour: a.hour, minute: a.minute }, repeats: true, allowWhileIdle: true } })
  if (p.control) {
    const [h, m] = p.control.split(':').map(Number)
    lista.push({ id: 2000, title: '¿Cómo dormiste y cómo te sentís?', body: 'Completá el control diario en 10 segundos: la app ajusta la sesión de hoy.', schedule: { on: { hour: h, minute: m }, repeats: true, allowWhileIdle: true } })
  }
  if (p.evaluacion) {
    const ultima = (await db.evaluaciones.orderBy('fecha').last())?.fecha
    lista.push({ id: 3000, title: 'Te toca la evaluación', body: 'Pasaron 4 semanas: repetí las pruebas para ver cuánto mejoraste.', schedule: { at: fechaAvisoEvaluacion(ultima), allowWhileIdle: true } })
  }
  if (lista.length) await LocalNotifications.schedule({ notifications: lista })
  return lista.length
}

/** Fecha de hoy para mostrar "actualizado hoy a las…". */
export const hoyLocal = () => fechaLocal()
