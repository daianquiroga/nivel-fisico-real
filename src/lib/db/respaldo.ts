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
}

export async function exportarDatos(db: BaseDatos): Promise<Respaldo> {
  const tablas = {} as Record<NombreTabla, unknown[]>
  for (const t of TABLAS) tablas[t] = await db.table(t).toArray()
  return { app: APP_ID, version: VERSION_RESPALDO, exportado: new Date().toISOString(), tablas }
}

export function respaldoAJson(r: Respaldo): string {
  return JSON.stringify(r, null, 2)
}

/** Texto compacto para copiar y pegar (por ejemplo, en una nota del celular). */
export function respaldoATexto(r: Respaldo): string {
  const bytes = new TextEncoder().encode(JSON.stringify(r))
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

/** Reemplaza todos los datos actuales por los del respaldo, en una sola operación. */
export async function importarDatos(db: BaseDatos, r: Respaldo): Promise<void> {
  await db.transaction('rw', TABLAS.map((t) => db.table(t)), async () => {
    for (const t of TABLAS) {
      const tabla = db.table(t)
      await tabla.clear()
      const filas = r.tablas[t] ?? []
      if (filas.length) await tabla.bulkAdd(filas)
    }
  })
}
