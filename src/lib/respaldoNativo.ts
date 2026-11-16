/* Respaldo fácil y automático, sin servidores:
   - Copia automática semanal en el celular (carpeta Documentos/NivelFisicoReal, que queda aunque se borre la app).
     Se guardan las últimas 4. Sirve si se borran los datos de la app; no si se pierde el celular.
   - "Mandar a otro lado" abre el menú de compartir de Android: vos elegís Drive, mail, WhatsApp, etc.
     La app no sube nada sola: el archivo va a donde vos lo mandás.
   En el navegador (sin la app de Android) se baja el archivo como siempre, o se comparte si Chrome lo permite. */
import { Capacitor } from '@capacitor/core'
import { db } from './db/db'
import { exportarDatos, respaldoAJson } from './db/respaldo'

const CARPETA = 'NivelFisicoReal'
const GUARDAR = 4
/** Cada cuántos días se hace la copia automática y desde cuántos días sin copia afuera del celular se avisa en Hoy. */
export const DIAS_COPIA_AUTO = 7
export const DIAS_AVISO = 14

export const nombreRespaldo = (fecha = new Date()) => `nivel-fisico-real-respaldo-${fecha.toISOString().slice(0, 10)}.json`

/** Días entre una fecha ISO y hoy (Infinity si nunca). */
export function diasDesde(iso: string | undefined | null, hoy = new Date()): number {
  if (!iso) return Infinity
  return Math.floor((hoy.getTime() - new Date(iso).getTime()) / 86_400_000)
}

/** Qué archivos viejos borrar para quedarse con los últimos `guardar` (por nombre, que lleva la fecha). */
export function sobrantes(nombres: string[], guardar = GUARDAR): string[] {
  const propios = nombres.filter((n) => n.startsWith('nivel-fisico-real-respaldo-') && n.endsWith('.json')).sort()
  return propios.slice(0, Math.max(0, propios.length - guardar))
}

async function leerAjuste(clave: string): Promise<string | undefined> {
  const v = (await db.ajustes.get(clave))?.valor
  return typeof v === 'string' ? v : undefined
}

export const ultimoRespaldoAfuera = () => leerAjuste('ultimoRespaldo')
export const ultimaCopiaAuto = () => leerAjuste('ultimaCopiaAuto')

async function json(conFotos = false) {
  return respaldoAJson(await exportarDatos(db, { conFotos }))
}

/** Guarda una copia en Documentos/NivelFisicoReal. Devuelve true si salió bien. */
export async function guardarEnCelular(conFotos = false): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const { Directory, Encoding, Filesystem } = await import('@capacitor/filesystem')
  try {
    const datos = await json(conFotos)
    try {
      await Filesystem.writeFile({ path: `${CARPETA}/${nombreRespaldo()}`, data: datos, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true })
    } catch {
      // Android 10 o anterior: hace falta el permiso de almacenamiento.
      const p = await Filesystem.requestPermissions()
      if (p.publicStorage !== 'granted') return false
      await Filesystem.writeFile({ path: `${CARPETA}/${nombreRespaldo()}`, data: datos, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true })
    }
    try {
      const { files } = await Filesystem.readdir({ path: CARPETA, directory: Directory.Documents })
      for (const n of sobrantes(files.map((f) => f.name))) await Filesystem.deleteFile({ path: `${CARPETA}/${n}`, directory: Directory.Documents })
    } catch {
      /* si no se pueden borrar las viejas, no pasa nada */
    }
    await db.ajustes.put({ clave: 'ultimaCopiaAuto', valor: new Date().toISOString() })
    return true
  } catch {
    return false
  }
}

/** Abre el menú de compartir con el archivo de respaldo (Drive, mail, WhatsApp…). Devuelve true si se compartió. */
export async function mandarAfuera(conFotos = false): Promise<boolean> {
  const datos = await json(conFotos)
  const nombre = nombreRespaldo()
  try {
    if (Capacitor.isNativePlatform()) {
      const { Directory, Encoding, Filesystem } = await import('@capacitor/filesystem')
      const { Share } = await import('@capacitor/share')
      const { uri } = await Filesystem.writeFile({ path: nombre, data: datos, directory: Directory.Cache, encoding: Encoding.UTF8 })
      await Share.share({ title: 'Respaldo de Nivel Físico Real', text: 'Guardalo en Drive, en tu mail o donde quieras.', files: [uri], dialogTitle: 'Guardar el respaldo en…' })
    } else {
      const archivo = new File([datos], nombre, { type: 'application/json' })
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: 'Respaldo de Nivel Físico Real' })
      } else {
        const url = URL.createObjectURL(archivo)
        const a = document.createElement('a')
        a.href = url
        a.download = nombre
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }
    }
    await db.ajustes.put({ clave: 'ultimoRespaldo', valor: new Date().toISOString() })
    return true
  } catch {
    return false // se canceló el menú de compartir
  }
}

/** Al abrir la app de Android: si pasó una semana desde la última copia automática, hace una (sin fotos, liviana). */
export async function copiaAutomatica(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const perfil = await db.perfil.get('yo')
  if (!perfil?.inicioCompleto) return
  if (diasDesde(await ultimaCopiaAuto()) < DIAS_COPIA_AUTO) return
  await guardarEnCelular(false)
}
