/* Actualización sola de la app de Android: la parte web (pantallas, cálculos, contenido) se baja de la página de
   GitHub del repositorio y se aplica la próxima vez que se abre la app. Los datos no se tocan.
   Solo se consulta un archivo con el número de versión: no se manda ningún dato de la persona.
   Si una versión nueva necesita cambios nativos (un permiso o plugin nuevo), hay que instalar el APK una vez:
   eso lo marca "apkMinima" en version.json (sale de android/apk-minima.txt). */
import { Capacitor } from '@capacitor/core'
import { db } from './db/db'

/** Compara versiones "1.2.3": negativo si a < b, 0 si son iguales, positivo si a > b. */
export function compararVersiones(a: string, b: string): number {
  const pa = a.split('.').map((x) => Number(x) || 0)
  const pb = b.split('.').map((x) => Number(x) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d
  }
  return 0
}

export interface InfoVersion {
  version: string
  url: string
  apkMinima: string
  /** Dirección del APK para cuando hace falta instalarlo de nuevo. */
  apk?: string
}

export type Decision = 'nada' | 'bajar' | 'apk-nueva'

/** Qué hacer con lo que dice version.json, según la versión que corre y la del APK instalado. */
export function decidir(info: InfoVersion, actual: string, apk: string): Decision {
  if (compararVersiones(info.version, actual) <= 0) return 'nada'
  if (compararVersiones(apk, info.apkMinima) < 0) return 'apk-nueva'
  return 'bajar'
}

export interface EstadoActualizacion {
  /** Versión ya bajada que se aplica la próxima vez que se abre la app. */
  pendiente?: string
  /** Hay una versión que necesita instalar el APK nuevo. */
  apkNueva?: string
  apkUrl?: string
  /** Última versión que se vio funcionando (para avisar "se actualizó"). */
  vista?: string
}

export async function leerEstadoActualizacion(): Promise<EstadoActualizacion> {
  return ((await db.ajustes.get('actualizacion'))?.valor as EstadoActualizacion | undefined) ?? {}
}

async function guardar(e: EstadoActualizacion) {
  await db.ajustes.put({ clave: 'actualizacion', valor: e })
}

/** Se llama al abrir la app. Devuelve la versión anterior si recién se actualizó (para mostrar un aviso). */
export async function iniciarActualizaciones(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
  // Avisa que esta versión abrió bien (si no, el plugin vuelve sola a la anterior).
  await CapacitorUpdater.notifyAppReady()
  const estado = await leerEstadoActualizacion()
  const recien = estado.vista && compararVersiones(__VERSION_APP__, estado.vista) > 0 ? estado.vista : null
  await guardar({ ...estado, vista: __VERSION_APP__, pendiente: estado.pendiente && compararVersiones(estado.pendiente, __VERSION_APP__) > 0 ? estado.pendiente : undefined })
  void buscarActualizacion()
  return recien
}

async function buscarActualizacion() {
  if (!__URL_ACTUALIZACION__ || !navigator.onLine) return
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
    const r = await fetch(`${__URL_ACTUALIZACION__}version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return
    const info = (await r.json()) as InfoVersion
    const apk = (await CapacitorUpdater.getBuiltinVersion()).version
    const d = decidir(info, __VERSION_APP__, apk)
    const estado = await leerEstadoActualizacion()
    if (d === 'apk-nueva') {
      await guardar({ ...estado, apkNueva: info.version, apkUrl: info.apk })
      return
    }
    if (d === 'nada' || estado.pendiente === info.version) {
      if (estado.apkNueva) await guardar({ ...estado, apkNueva: undefined })
      return
    }
    const bajada = await CapacitorUpdater.download({ url: info.url, version: info.version })
    await CapacitorUpdater.next({ id: bajada.id })
    await guardar({ ...estado, pendiente: info.version, apkNueva: undefined })
  } catch {
    /* sin internet o falló la descarga: se intenta la próxima vez */
  }
}
