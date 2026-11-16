import { TABLAS, type BaseDatos, type NombreTabla } from './db'

/* Respaldo de datos: exportar todo a un archivo JSON o a un texto para copiar,
   e importarlo de vuelta. Las fotos (cuando existan) no van en el texto. */

export const APP_ID = 'nivel-fisico-real'
export const VERSION_RESPALDO = 1
const PREFIJO_TEXTO = 'NFR1:'

export interface Respaldo {
  app: typeof APP_ID
  version: number
  exportado: string
  tablas: Record<NombreTabla, unknown[]>
  /** Opcional: fotos como texto (data URL), solo en el respaldo de archivo si la persona lo elige. */
  fotos?: { fecha: string; vista: string; dataUrl: string }[]
}

export async function blobADataUrl(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer())
  let bin = ''
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
  return `data:${b.type || 'image/jpeg'};base64,${btoa(bin)}`
}

export function dataUrlABlob(u: string): Blob {
  const [cabeza, datos] = u.split(',')
  const tipo = /data:([^;]+)/.exec(cabeza)?.[1] ?? 'image/jpeg'
  const bin = atob(datos)
  return new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))], { type: tipo })
}

export async function exportarDatos(db: BaseDatos, opciones: { conFotos?: boolean } = {}): Promise<Respaldo> {
  const tablas = {} as Record<NombreTabla, unknown[]>
  for (const t of TABLAS) tablas[t] = await db.table(t).toArray()
  const r: Respaldo = { app: APP_ID, version: VERSION_RESPALDO, exportado: new Date().toISOString(), tablas }
  if (opciones.conFotos) {
    const fotos = await db.fotos.toArray()
    r.fotos = await Promise.all(fotos.map(async (f) => ({ fecha: f.fecha, vista: f.vista, dataUrl: await blobADataUrl(f.imagen) })))
  }
  return r
}

export function respaldoAJson(r: Respaldo): string {
  return JSON.stringify(r, null, 2)
}

/** Texto compacto para copiar y pegar (por ejemplo, en una nota del celular). */
export function respaldoATexto(r: Respaldo): string {
  const { fotos: _sinFotos, ...sinFotos } = r
  void _sinFotos
  const bytes = new TextEncoder().encode(JSON.stringify(sinFotos))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return PREFIJO_TEXTO + btoa(bin)
}

export class ErrorRespaldo extends Error {}

/** Acepta el contenido de un archivo JSON o el texto copiado. */
export function leerRespaldo(entrada: string): Respaldo {
  const limpio = entrada.trim()
  let obj: unknown
  try {
    if (limpio.startsWith(PREFIJO_TEXTO)) {
      const bin = atob(limpio.slice(PREFIJO_TEXTO.length).replace(/\s+/g, ''))
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
      obj = JSON.parse(new TextDecoder().decode(bytes))
    } else {
      obj = JSON.parse(limpio)
    }
  } catch {
    throw new ErrorRespaldo('No pudimos leer el respaldo. Revisá que esté completo.')
  }
  const r = obj as Partial<Respaldo>
  if (!r || r.app !== APP_ID || typeof r.tablas !== 'object' || r.tablas === null) {
    throw new ErrorRespaldo('Esto no parece un respaldo de Nivel Físico Real.')
  }
  if (typeof r.version !== 'number' || r.version > VERSION_RESPALDO) {
    throw new ErrorRespaldo('El respaldo es de una versión más nueva de la app. Actualizá la app primero.')
  }
  for (const t of TABLAS) {
    const filas = (r.tablas as Record<string, unknown>)[t]
    if (filas !== undefined && !Array.isArray(filas)) {
      throw new ErrorRespaldo('El respaldo está dañado.')
    }
  }
  return r as Respaldo
}

export function resumirRespaldo(r: Respaldo): { tabla: NombreTabla; filas: number }[] {
  return TABLAS.map((tabla) => ({ tabla, filas: (r.tablas[tabla] ?? []).length }))
}

/** Reemplaza todos los datos actuales por los del respaldo, en una sola operación.
    Las fotos del celular solo se reemplazan si el respaldo trae fotos. */
export async function importarDatos(db: BaseDatos, r: Respaldo): Promise<void> {
  const tablas = [...TABLAS.map((t) => db.table(t)), db.fotos]
  await db.transaction('rw', tablas, async () => {
    for (const t of TABLAS) {
      const tabla = db.table(t)
      await tabla.clear()
      const filas = r.tablas[t] ?? []
      if (filas.length) await tabla.bulkAdd(filas)
    }
    if (r.fotos) {
      await db.fotos.clear()
      for (const f of r.fotos) await db.fotos.add({ fecha: f.fecha, vista: f.vista as 'frente', imagen: dataUrlABlob(f.dataUrl) })
    }
  })
}
