import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DibujoTecnica } from '../../content/dibujos-combate'
import { DISCIPLINAS, DISTANCIAS, NOMBRES_TIPO, disciplina, tecnica, tecnicasDe, type Distancia } from '../../lib/combate'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import a from '../Aprender/aprender.module.css'
import { Volver, usarCombate } from './comun'

const PESO: Record<string, string> = { adelante: 'adelante', centro: 'en el centro', atras: 'atrás' }
const LADO: Record<string, string> = { adelante: 'mano o pierna de adelante', atras: 'mano o pierna de atrás', ambos: 'los dos lados' }

export function Tecnicas() {
  const { disciplina: base } = usarCombate()
  const [disc, setDisc] = useState<string | null | undefined>(undefined)
  const [dist, setDist] = useState<Distancia | null>(null)
  const elegida = disc === undefined ? base : disc
  const lista = tecnicasDe(elegida, dist)
  return (
    <div className={e.pantalla}>
      <Volver />
      <h1 className={e.titulo}>Técnicas</h1>
      <p className="etiqueta">Disciplina</p>
      <div className={s.filtros} role="group" aria-label="Filtrar por disciplina">
        <button type="button" className={`${s.filtro} ${elegida === null ? s.filtroOn : ''}`} aria-pressed={elegida === null} onClick={() => setDisc(null)}>
          Todas
        </button>
        {DISCIPLINAS.map((d) => (
          <button key={d.id} type="button" className={`${s.filtro} ${elegida === d.id ? s.filtroOn : ''}`} aria-pressed={elegida === d.id} onClick={() => setDisc(d.id)}>
            {d.nombre}
          </button>
        ))}
      </div>
      <p className="etiqueta">Distancia</p>
      <div className={s.filtros} role="group" aria-label="Filtrar por distancia">
        <button type="button" className={`${s.filtro} ${dist === null ? s.filtroOn : ''}`} aria-pressed={dist === null} onClick={() => setDist(null)}>
          Todas
        </button>
        {DISTANCIAS.map((d) => (
          <button key={d.valor} type="button" className={`${s.filtro} ${dist === d.valor ? s.filtroOn : ''}`} aria-pressed={dist === d.valor} onClick={() => setDist(dist === d.valor ? null : d.valor)}>
            {d.texto}
          </button>
        ))}
      </div>
      <div className={s.lista}>
        {lista.length === 0 && <p className={s.itemDetalle}>No hay técnicas con ese filtro.</p>}
        {lista.map((t) => (
          <Link key={t.id} to={`/combate/tecnica/${t.id}`} className={a.fila}>
            <span className={a.mini} aria-hidden="true">
              <DibujoTecnica id={t.id} />
            </span>
            <span className={a.textos}>
              <span className={s.itemNombre}>{t.nombre}</span>
              <span className={s.itemDetalle}>
                {NOMBRES_TIPO[t.tipo]} · distancia {DISTANCIAS.find((d) => d.valor === t.distancia)?.texto.toLowerCase()}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function FichaTecnica() {
  const { id = '' } = useParams()
  const t = tecnica(id)
  if (!t) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>No encontramos esa técnica</h1>
        <Link to="/combate/tecnicas">Ver todas</Link>
      </div>
    )
  }
  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>{t.nombre}</h1>
        <p className={e.para}>{t.disciplinas.map((d) => disciplina(d)?.nombre).join(' · ')}</p>
      </header>
      <div className={a.dibujo}>
        <DibujoTecnica id={t.id} />
      </div>
      <p className={s.itemDetalle}>En tenue, la guardia de base; en color, cómo termina la técnica. Si sos zurdo, hacelo espejado.</p>
      <div className={s.etiquetas}>
        <span className={s.tag}>{NOMBRES_TIPO[t.tipo]}</span>
        <span className={s.tag}>Distancia {DISTANCIAS.find((d) => d.valor === t.distancia)?.texto.toLowerCase()}</span>
        <span className={s.tag}>Con {LADO[t.lado]}</span>
        <span className={s.tag}>El peso termina {PESO[t.peso]}</span>
      </div>
      <p className="etiqueta">Cómo se hace</p>
      <ol className={s.seccion}>
        {t.pasos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <p className="etiqueta">Errores comunes</p>
      <ul className={s.seccion}>
        {t.errores.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <a className={s.item} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${t.nombre} técnica tutorial`)}`} target="_blank" rel="noreferrer">
        <span className={s.itemNombre}>Buscar un video</span>
        <span className={s.itemDetalle}>Abre YouTube (necesita internet)</span>
      </a>
    </div>
  )
}
