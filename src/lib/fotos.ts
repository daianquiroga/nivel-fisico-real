import { db, type VistaFoto } from './db/db'

/* Fotos de progreso: quedan solo en este celular (IndexedDB). */

/** Achica la foto a 1280 px de lado como máximo, en JPEG, para no llenar el celular. */
export async function achicar(archivo: File, lado = 1280): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(archivo)
    const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(bmp.width * escala)
    lienzo.height = Math.round(bmp.height * escala)
    lienzo.getContext('2d')?.drawImage(bmp, 0, 0, lienzo.width, lienzo.height)
    return await new Promise((res) => lienzo.toBlob((b) => res(b ?? archivo), 'image/jpeg', 0.85))
  } catch {
    return archivo
  }
}

export async function guardarFoto(fecha: string, vista: VistaFoto, archivo: File) {
  await db.fotos.add({ fecha, vista, imagen: await achicar(archivo) })
}

/* PIN opcional. No es cifrado: es un candado para que nadie vea las fotos con el celular desbloqueado. */
const CLAVE_PIN = 'pinFotos'
const SESION = 'nfr-fotos-abiertas'

async function hash(pin: string, sal: string): Promise<string> {
  const datos = new TextEncoder().encode(`${sal}:${pin}`)
  const h = await crypto.subtle.digest('SHA-256', datos)
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function tienePin(): Promise<boolean> {
  return Boolean(await db.ajustes.get(CLAVE_PIN))
}

export async function ponerPin(pin: string) {
  const sal = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('')
  await db.ajustes.put({ clave: CLAVE_PIN, valor: { sal, hash: await hash(pin, sal) } })
  abrirSesion()
}

export async function sacarPin() {
  await db.ajustes.delete(CLAVE_PIN)
}

export async function probarPin(pin: string): Promise<boolean> {
  const g = (await db.ajustes.get(CLAVE_PIN))?.valor as { sal: string; hash: string } | undefined
  if (!g) return true
  const ok = (await hash(pin, g.sal)) === g.hash
  if (ok) abrirSesion()
  return ok
}

export function sesionAbierta(): boolean {
  try {
    return sessionStorage.getItem(SESION) === '1'
  } catch {
    return false
  }
}

function abrirSesion() {
  try {
    sessionStorage.setItem(SESION, '1')
  } catch {
    /* sin almacenamiento de sesión */
  }
}
