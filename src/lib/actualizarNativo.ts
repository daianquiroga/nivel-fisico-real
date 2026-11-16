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
  /** Versión anterior, si recién se actualizó (Hoy lo muestra una vez). */
  actualizadaDesde?: string
  /** Última vez que se buscó una versión nueva y qué pasó (para la pantalla de la app). */
  revisado?: string
  resultado?: string
  detalle?: string
}

export async function leerEstadoActualizacion(): Promise<EstadoActualizacion> {
  return ((await db.ajustes.get('actualizacion'))?.valor as EstadoActualizacion | undefined) ?? {}
}

async function guardar(e: EstadoActualizacion) {
  await db.ajustes.put({ clave: 'actualizacion', valor: e })
}

/** Bundle bajado que conviene aplicar: el de versión más alta, mayor que la que corre y que no falló antes. */
export function elegirBundle(bundles: { id: string; version: string; status: string }[], actual: string) {
  return bundles
    .filter((b) => (b.status === 'pending' || b.status === 'success') && compararVersiones(b.version, actual) > 0)
    .sort((a, b) => compararVersiones(b.version, a.version))[0]
}

/** Se llama al abrir la app. Devuelve la versión anterior si recién se actualizó (para mostrar un aviso). */
export async function iniciarActualizaciones(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
  // Avisa que esta versión abrió bien (si no, el plugin vuelve sola a la anterior).
  await CapacitorUpdater.notifyAppReady()
  // Si ya hay una versión nueva bajada, se aplica ahora (recarga la pantalla una vez, en el arranque).
  try {
    const listo = elegirBundle((await CapacitorUpdater.list()).bundles, __VERSION_APP__)
    if (listo) {
      await CapacitorUpdater.set({ id: listo.id })
      return null
    }
  } catch {
    /* si falla, sigue con la versión actual */
  }
  const estado = await leerEstadoActualizacion()
  const recien = estado.vista && compararVersiones(__VERSION_APP__, estado.vista) > 0 ? estado.vista : null
  await guardar({ ...estado, vista: __VERSION_APP__, actualizadaDesde: recien ?? estado.actualizadaDesde, pendiente: estado.pendiente && compararVersiones(estado.pendiente, __VERSION_APP__) > 0 ? estado.pendiente : undefined })
  void buscarActualizacion()
  return recien
}

/** Borra el aviso de "se actualizó" (después de mostrarlo). */
export async function olvidarActualizada() {
  await guardar({ ...(await leerEstadoActualizacion()), actualizadaDesde: undefined })
}

export type ResultadoBusqueda = 'al-dia' | 'aplicando' | 'apk-nueva' | 'sin-internet' | 'error'

/** Busca una versión nueva. Con aplicarYa, la instala en el momento (recarga la pantalla). */
export async function buscarActualizacion(aplicarYa = false): Promise<ResultadoBusqueda> {
  if (!__URL_ACTUALIZACION__) return 'error'
  if (!navigator.onLine) return 'sin-internet'
  const anotar = async (r: ResultadoBusqueda, detalle?: string) => {
    await guardar({ ...(await leerEstadoActualizacion()), revisado: new Date().toISOString(), resultado: r, detalle })
    return r
  }
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
    const r = await fetch(`${__URL_ACTUALIZACION__}version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return anotar('error', `version.json respondió ${r.status}`)
    const info = (await r.json()) as InfoVersion
    const apk = (await CapacitorUpdater.getBuiltinVersion()).version
    const d = decidir(info, __VERSION_APP__, apk)
    const estado = await leerEstadoActualizacion()
    if (d === 'apk-nueva') {
      await guardar({ ...estado, apkNueva: info.version, apkUrl: info.apk })
      return anotar('apk-nueva')
    }
    if (d === 'nada') {
      if (estado.apkNueva) await guardar({ ...estado, apkNueva: undefined })
      return anotar('al-dia')
    }
    const ya = (await CapacitorUpdater.list()).bundles.find((b) => b.version === info.version && b.status !== 'error' && b.status !== 'deleted')
    const bajada = ya ?? (await CapacitorUpdater.download({ url: info.url, version: info.version }))
    await guardar({ ...estado, pendiente: info.version, apkNueva: undefined })
    await anotar('aplicando')
    if (aplicarYa) {
      await CapacitorUpdater.set({ id: bajada.id })
    } else {
      await CapacitorUpdater.next({ id: bajada.id })
      // Se aplica al salir de la app (o la próxima vez que se abre, ver iniciarActualizaciones).
      const alSalir = () => {
        if (document.visibilityState === 'hidden') {
          document.removeEventListener('visibilitychange', alSalir)
          void CapacitorUpdater.reload()
        }
      }
      document.addEventListener('visibilitychange', alSalir)
    }
    return 'aplicando'
  } catch (e) {
    return anotar('error', e instanceof Error ? e.message : String(e))
  }
}
