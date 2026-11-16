import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Proximamente } from '../../components/Proximamente'
import { DibujoArticulo } from '../../content/dibujos-aprender'
import { TiposDeCuerpo } from '../../content/ilustraciones'
import { DibujoGuardia } from '../../content/dibujos-combate'
import { ARTICULOS, CATEGORIAS, buscarArticulos, buscarEn } from '../../lib/aprender'
import { EJERCICIOS } from '../../lib/ejercicios'
import { usarNivelLectura } from '../../lib/usarNivelLectura'
import s from '../Ejercicios/ejercicios.module.css'
import { Biblioteca } from '../Ejercicios/Biblioteca'
import { Niveles } from './Niveles'
import a from './aprender.module.css'

const TIPO_CUERPO = {
  id: 'tipo-cuerpo',
  titulo: 'Tipos de cuerpo: ectomorfo, mesomorfo y endomorfo',
  etiquetas: 'somatotipo contextura biotipo ectomorfo mesomorfo endomorfo flaco robusto',
  cuerpo: 'Cuál es el tuyo, cómo medirlo y cómo entrenar con él',
}

const INDICE_EJ = EJERCICIOS.map((e) => ({ id: e.id, titulo: e.nombre, etiquetas: [...e.principal, ...e.secundarios].join(' '), cuerpo: '' }))
const nombreEj = new Map(EJERCICIOS.map((e) => [e.id, e.nombre]))
const conContenido = new Set([...ARTICULOS.map((x) => x.categoria), 'cuerpo', 'ejercicios'])

function TarjetaTipoCuerpo() {
  return (
    <Link to="/tipo-cuerpo" className={s.item}>
      <TiposDeCuerpo />
      <span className={s.itemNombre}>{TIPO_CUERPO.titulo}</span>
      <span className={s.itemDetalle}>{TIPO_CUERPO.cuerpo}</span>
    </Link>
  )
}

function TarjetaCombate() {
  return (
    <Link to="/combate" className={s.item}>
      <DibujoGuardia />
      <span className={s.itemNombre}>Entrenar combate</span>
      <span className={s.itemDetalle}>Sombra por niveles, juego de pies y técnicas por disciplina</span>
    </Link>
  )
}

export function Aprender() {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const { nivel, sugerido, elegir } = usarNivelLectura()
  const buscando = busqueda.trim().length >= 2

  const resultados = useMemo(() => {
    if (!buscando) return null
    return {
      articulos: buscarArticulos(busqueda),
      tipo: buscarEn([TIPO_CUERPO], busqueda).length > 0,
      ejercicios: buscarEn(INDICE_EJ, busqueda).slice(0, 8),
    }
  }, [busqueda, buscando])

  const lista = ARTICULOS.filter((x) => !categoria || x.categoria === categoria)
  const nombreCat = (v: string) => CATEGORIAS.find((c) => c.valor === v)?.texto ?? v

  const fila = (x: (typeof ARTICULOS)[number]) => (
    <Link key={x.id} to={`/aprender/${x.id}`} className={a.fila}>
      <span className={a.mini} aria-hidden="true">
        <DibujoArticulo clave={x.dibujo} />
      </span>
      <span className={a.textos}>
        <span className={s.itemNombre}>{x.titulo}</span>
        <span className={s.itemDetalle}>{x.resumen}</span>
      </span>
    </Link>
  )

  return (
    <>
      <h1 className="titulo-pantalla">Aprender</h1>
      <input
        className={s.buscador}
        type="search"
        placeholder="Buscá: panza, agujetas, correr, dormir…"
        aria-label="Buscar en Aprender"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {!buscando && (
        <Link to="/preguntar" className={s.item}>
          <span className={s.itemNombre}>¿Tenés una duda? Preguntale a Claude</span>
          <span className={s.itemDetalle}>Armamos un texto con tus datos (sin fotos) para pegar en la app de Claude</span>
        </Link>
      )}

      {resultados ? (
        <>
          <p className="etiqueta">
            {resultados.articulos.length + resultados.ejercicios.length + (resultados.tipo ? 1 : 0) === 0 ? 'No encontramos nada con eso. Probá con otra palabra.' : 'Resultados'}
          </p>
          <div className={s.lista}>
            {resultados.tipo && <TarjetaTipoCuerpo />}
            {resultados.articulos.map(fila)}
          </div>
          {resultados.ejercicios.length > 0 && (
            <>
              <p className="etiqueta">Ejercicios</p>
              <div className={s.lista}>
                {resultados.ejercicios.map((r) => (
                  <Link key={r.id} to={`/ejercicio/${r.id}`} className={s.item}>
                    <span className={s.itemNombre}>{nombreEj.get(r.id)}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <p className="etiqueta">Leé en nivel</p>
          <Niveles nivel={nivel} sugerido={sugerido} elegir={elegir} />
          <p className="etiqueta">Temas</p>
          <div className={s.filtros} role="group" aria-label="Filtrar por tema">
            <button type="button" className={`${s.filtro} ${categoria === null ? s.filtroOn : ''}`} aria-pressed={categoria === null} onClick={() => setCategoria(null)}>
              Todo
            </button>
            {CATEGORIAS.filter((c) => conContenido.has(c.valor)).map((c) => (
              <button
                key={c.valor}
                type="button"
                className={`${s.filtro} ${categoria === c.valor ? s.filtroOn : ''}`}
                aria-pressed={categoria === c.valor}
                onClick={() => setCategoria(categoria === c.valor ? null : c.valor)}
              >
                {c.texto}
              </button>
            ))}
          </div>

          {(!categoria || categoria === 'cuerpo') && <TarjetaTipoCuerpo />}
          {categoria === 'combate' && <TarjetaCombate />}
          {categoria !== 'ejercicios' &&
            (categoria ? (
              <div className={s.lista}>{lista.map(fila)}</div>
            ) : (
              CATEGORIAS.filter((c) => lista.some((x) => x.categoria === c.valor)).map((c) => (
                <section key={c.valor} className={a.grupo}>
                  <p className="etiqueta">{nombreCat(c.valor)}</p>
                  <div className={s.lista}>{lista.filter((x) => x.categoria === c.valor).map(fila)}</div>
                </section>
              ))
            ))}

          {(!categoria || categoria === 'ejercicios') && (
            <>
              <p className="etiqueta">Ejercicios</p>
              <Biblioteca />
            </>
          )}
          {!categoria && <Proximamente entrega="entrega 7" items={['App de Android con lectura automática de pasos desde Health Connect.']} />}
        </>
      )}
    </>
  )
}
