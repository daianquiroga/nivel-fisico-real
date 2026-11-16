import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Aviso } from '../../components/ui'
import { DibujoArticulo } from '../../content/dibujos-aprender'
import { CATEGORIAS, NIVELES_LECTURA, articulo, textoNivel } from '../../lib/aprender'
import { usarNivelLectura } from '../../lib/usarNivelLectura'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import { Niveles } from './Niveles'
import a from './aprender.module.css'

export function Articulo() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const art = articulo(id)
  const { nivel, sugerido, elegir } = usarNivelLectura()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const volver = (
    <div className={e.arriba}>
      <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
    </div>
  )

  if (!art) {
    return (
      <div className={e.pantalla}>
        {volver}
        <h1 className={e.titulo}>No encontramos ese artículo</h1>
        <Link to="/aprender">Ir a Aprender</Link>
      </div>
    )
  }

  const texto = textoNivel(art, nivel)
  const soloUno = Object.values(art.niveles).filter((p) => p?.length).length === 1
  const nombreNivel = NIVELES_LECTURA.find((n) => n.valor === texto.nivel)?.texto.toLowerCase()

  return (
    <div className={e.pantalla}>
      {volver}
      <header>
        <p className="etiqueta">{CATEGORIAS.find((c) => c.valor === art.categoria)?.texto}</p>
        <h1 className={e.titulo}>{art.titulo}</h1>
        <p className={e.para}>{art.resumen}</p>
      </header>
      <div className={a.dibujo}>
        <DibujoArticulo clave={art.dibujo} />
      </div>
      {!soloUno && <Niveles nivel={nivel} sugerido={sugerido} elegir={elegir} />}
      {texto.nivel !== nivel && !soloUno && <p className={s.itemDetalle}>Este tema no tiene versión {NIVELES_LECTURA.find((n) => n.valor === nivel)?.texto.toLowerCase()}: te mostramos la {nombreNivel}.</p>}
      <ul className={a.parrafos}>
        {texto.parrafos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {art.categoria === 'salud' && <Aviso tipo="ok">Esto es información general, no un diagnóstico. Ante dolor o dudas sobre tu salud, consultá a un profesional.</Aviso>}
      {art.dibujo.startsWith('ej:') && (
        <Link to={`/ejercicio/${art.dibujo.slice(3)}`} className={s.item}>
          <span className={s.itemNombre}>Ver la ficha del ejercicio</span>
          <span className={s.itemDetalle}>Paso a paso, errores comunes y tus registros</span>
        </Link>
      )}
      <section>
        <p className="etiqueta">De dónde sale</p>
        <ul className={a.fuentes}>
          {art.fuentes.map((f) => (
            <li key={f.texto}>
              {f.enlace ? (
                <a href={f.enlace} target="_blank" rel="noreferrer">
                  {f.texto}
                </a>
              ) : (
                f.texto
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
