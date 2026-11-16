import { describe, expect, it } from 'vitest'
import { existeDibujo } from '../content/dibujos-aprender'
import { articulo, buscarArticulos, buscarEn, nivelLecturaPorNivel, raiz, revisarArticulos, terminos, textoNivel } from './aprender'

const ids = (q: string) => buscarArticulos(q).map((a) => a.id)

describe('aprender', () => {
  it('el contenido está completo y cada artículo tiene dibujo', () => {
    expect(revisarArticulos(existeDibujo)).toEqual([])
  })

  it('busca con sinónimos', () => {
    expect(ids('panza')[0]).toBe('grasa-por-zonas')
    expect(ids('barriga')).toContain('grasa-por-zonas')
    expect(ids('agujetas')[0]).toBe('dolor-muscular')
    expect(ids('cómo dejar el pucho')).toContain('fumar-recuperacion')
    expect(ids('trotar')[0]).toBe('guia-correr')
    expect(ids('Dolor muscular')[0]).toBe('dolor-muscular')
    expect(ids('xyzw')).toEqual([])
    expect(ids('de la')).toEqual([])
  })

  it('arma grupos de términos y raíces de plurales', () => {
    expect(raiz('flexiones')).toBe('flexion')
    expect(raiz('pesas')).toBe('pesa')
    expect(terminos('dolor muscular en piernas')).toEqual([expect.arrayContaining(['agujeta', 'dolor muscular']), ['pierna']])
  })

  it('todas las palabras tienen que aparecer y el título pesa más', () => {
    const items = [
      { id: 'a', titulo: 'Sentadilla', etiquetas: '', cuerpo: 'rodillas' },
      { id: 'd', titulo: 'Remo', etiquetas: '', cuerpo: 'espalda' },
      { id: 'b', titulo: 'Rodilla', etiquetas: 'sentadilla', cuerpo: '' },
      { id: 'c', titulo: 'Plancha', etiquetas: '', cuerpo: 'rodilla' },
    ]
    expect(buscarEn(items, 'rodillas sentadilla').map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('usa el nivel más cercano si falta el pedido', () => {
    const g = articulo('glosario')!
    expect(textoNivel(g, 'avanzado').nivel).toBe('principiante')
    expect(textoNivel(articulo('guia-correr')!, 'intermedio').nivel).toBe('intermedio')
    expect(nivelLecturaPorNivel(undefined)).toBe('principiante')
    expect(nivelLecturaPorNivel(3)).toBe('intermedio')
    expect(nivelLecturaPorNivel(5)).toBe('avanzado')
  })
})

describe('búsqueda flexible', () => {
  it('si ninguno tiene todas las palabras, muestra los que tienen más', () => {
    expect(ids('agujetas en las piernas')[0]).toBe('dolor-muscular')
  })
  it('no confunde palabras cortas dentro de otras', () => {
    expect(ids('doms')).toEqual(['dolor-muscular'])
  })
})
