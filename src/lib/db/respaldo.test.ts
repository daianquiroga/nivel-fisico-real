import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { crearBaseDatos } from './db'
import {
  ErrorRespaldo,
  exportarDatos,
  importarDatos,
  leerRespaldo,
  respaldoAJson,
  respaldoATexto,
  resumirRespaldo,
} from './respaldo'

const ahora = '2026-11-15T12:00:00.000Z'

async function baseConDatos(nombre: string) {
  const db = crearBaseDatos(nombre)
  await db.perfil.put({ id: 'yo', sexo: 'h', edad: 30, alturaCm: 175, creado: ahora, actualizado: ahora })
  await db.lugares.add({ nombre: 'Depto', equipo: ['bandas'], espacio: '1x1' })
  await db.evaluaciones.add({ fecha: ahora, modo: 'rapida', datos: { pulso: 70 } })
  await db.ajustes.put({ clave: 'ultimoRespaldo', valor: ahora })
  return db
}

describe('respaldo', () => {
  it('exporta e importa por archivo sin perder datos', async () => {
    const origen = await baseConDatos('t-origen-json')
    const r = await exportarDatos(origen)
    const destino = crearBaseDatos('t-destino-json')
    await destino.lugares.add({ nombre: 'Viejo', equipo: [], espacio: 'amplio' })

    await importarDatos(destino, leerRespaldo(respaldoAJson(r)))

    expect(await destino.perfil.get('yo')).toMatchObject({ sexo: 'h', edad: 30 })
    expect((await destino.lugares.toArray()).map((l) => l.nombre)).toEqual(['Depto'])
    expect(await destino.evaluaciones.count()).toBe(1)
  })

  it('exporta e importa por texto, con acentos', async () => {
    const origen = await baseConDatos('t-origen-texto')
    await origen.lugares.add({ nombre: 'Mi casa · señal', equipo: ['barra'], espacio: '2x2' })
    const texto = respaldoATexto(await exportarDatos(origen))
    expect(texto.startsWith('NFR1:')).toBe(true)

    const destino = crearBaseDatos('t-destino-texto')
    await importarDatos(destino, leerRespaldo(texto))
    const nombres = (await destino.lugares.toArray()).map((l) => l.nombre)
    expect(nombres).toContain('Mi casa · señal')
  })

  it('resume la cantidad de filas por tabla', async () => {
    const r = await exportarDatos(await baseConDatos('t-resumen'))
    const resumen = Object.fromEntries(resumirRespaldo(r).map((x) => [x.tabla, x.filas]))
    expect(resumen).toMatchObject({ perfil: 1, lugares: 1, evaluaciones: 1, registros: 0, ajustes: 1 })
  })

  it('rechaza textos que no son respaldos', () => {
    expect(() => leerRespaldo('hola')).toThrow(ErrorRespaldo)
    expect(() => leerRespaldo('{"app":"otra","version":1,"tablas":{}}')).toThrow(ErrorRespaldo)
    expect(() => leerRespaldo('{"app":"nivel-fisico-real","version":99,"tablas":{}}')).toThrow(/versión más nueva/)
  })
})

describe('respaldo con fotos', () => {
  it('el texto nunca lleva fotos; el archivo solo si se pide; importar sin fotos conserva las del celular', async () => {
    const { crearBaseDatos } = await import('./db')
    const { exportarDatos, respaldoATexto, leerRespaldo, importarDatos } = await import('./respaldo')
    const a = crearBaseDatos('prueba-fotos-a')
    await a.fotos.add({ fecha: '2026-01-01', vista: 'frente', imagen: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }) })
    const sin = await exportarDatos(a)
    expect(sin.fotos).toBeUndefined()
    const con = await exportarDatos(a, { conFotos: true })
    expect(con.fotos).toHaveLength(1)
    expect(leerRespaldo(respaldoATexto(con)).fotos).toBeUndefined()

    const b = crearBaseDatos('prueba-fotos-b')
    await b.fotos.add({ fecha: '2026-02-02', vista: 'perfil', imagen: new Blob([new Uint8Array([9])]) })
    await importarDatos(b, sin)
    expect(await b.fotos.count()).toBe(1)
    await importarDatos(b, con)
    const fotos = await b.fotos.toArray()
    expect(fotos).toHaveLength(1)
    expect(fotos[0].vista).toBe('frente')
    expect(new Uint8Array(await fotos[0].imagen.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })
})
