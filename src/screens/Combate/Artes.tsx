import { Link, useNavigate, useParams } from 'react-router-dom'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoReparto, DibujoTecnica } from '../../content/dibujos-combate'
import { ANALISIS_ARTES, ARTES, DISTANCIAS, arte, compatibilidad, disciplina, guardarAjustesCombate, tecnica } from '../../lib/combate'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver, usarCombate } from './comun'

const ALTURAS = ['suelo', 'baja', 'media', 'alta']
const nombreDist = (d: string) => DISTANCIAS.find((x) => x.valor === d)?.texto.toLowerCase() ?? d

/** Las 10 artes: cómo reparte el peso cada una y con qué se combina. */
export function ListaArtes() {
  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Las 10 artes</h1>
        <p className={e.para}>Cómo reparte el peso cada una, cómo se entrena sola y con qué se combina mejor.</p>
      </header>
      <Tarjeta destacada>
        <p className="etiqueta">La clave</p>
        <p className={estilos.texto2}>{ANALISIS_ARTES.regla}</p>
        <DibujoReparto del={30} altura="alta" etiqueta="Peso atrás (30/70): patadas y distancia larga" />
        <p className={estilos.chico}>Ejemplo: muay thai, 30 % adelante y 70 % atrás. La pierna de adelante queda liviana para patear o chequear.</p>
      </Tarjeta>
      <div className={s.lista}>
        {ARTES.map((a) => (
          <Link key={a.id} to={`/combate/arte/${a.id}`} className={s.item}>
            <span className={s.itemNombre}>{a.nombre}</span>
            <span className={s.itemDetalle}>
              Guardia {a.perfil.del}/{100 - a.perfil.del} · centro {ALTURAS[a.perfil.altura]} · fuerte en {a.perfil.distancias.map(nombreDist).join(', ')}
            </span>
            {a.perfil.debil && <span className={s.itemDetalle}>Le falta: {a.perfil.debil.toLowerCase()} · mejor con {a.combinacion.con.map((c) => disciplina(c)?.nombre.split(':')[0]).join(' o ')}</span>}
          </Link>
        ))}
      </div>
      <Link to="/combate/sistema" className={h.botonPrincipal}>
        Sistema completo (5 estilos)
      </Link>
      <details className={s.detalle}>
        <summary>Qué mira cada análisis</summary>
        <ol className={s.seccion}>
          {ANALISIS_ARTES.ejes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
        <p className={estilos.chico}>{ANALISIS_ARTES.fuente}</p>
      </details>
    </div>
  )
}

/** Ficha de un arte: reparto de peso con dibujo, sombra, pies, encadenamientos y combinación. */
export function FichaArte() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const { estado, recargar, disciplina: base } = usarCombate()
  const a = arte(id)
  if (!a) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>No encontramos ese arte</h1>
        <Link to="/combate/artes">Ver las 10 artes</Link>
      </div>
    )
  }
  const d = disciplina(a.id)
  const compat = a.id !== base ? compatibilidad(base, a.id) : null

  async function usarComo(tipo: 'base' | 'segunda') {
    const desde = estado?.ajustes?.desde ?? new Date().toISOString()
    if (tipo === 'base') await guardarAjustesCombate({ disciplina: a!.id, segunda: estado?.ajustes?.segunda === a!.id ? undefined : estado?.ajustes?.segunda, desde: new Date().toISOString() })
    else await guardarAjustesCombate({ disciplina: base, segunda: a!.id, desde })
    await recargar()
    navegar('/combate')
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Análisis biomecánico</p>
        <h1 className={e.titulo}>{a.nombre}</h1>
        <p className={e.para}>{a.idea}</p>
      </header>

      <p className="etiqueta">Reparto de peso</p>
      {a.posturas.map((p) => (
        <Tarjeta key={p.nombre}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{p.nombre}</h2>
          {p.del !== undefined ? (
            <DibujoReparto del={p.del} altura={p.altura} etiqueta={`${p.nombre}: ${p.del} % adelante y ${100 - p.del} % atrás`} />
          ) : (
            <p className={estilos.chico}>Sin reparto entre pies: el peso va en los puntos de contacto.</p>
          )}
          <p className={estilos.texto2}>{p.uso}</p>
        </Tarjeta>
      ))}
      <Tarjeta>
        {a.notas.map((n) => (
          <p key={n.titulo} className={estilos.texto2}>
            <b>{n.titulo}:</b> {n.texto}
          </p>
        ))}
      </Tarjeta>

      {d && d.basicas.length > 0 && (
        <>
          <p className="etiqueta">Técnicas para entrenar sola</p>
          <div className={s.filtros}>
            {d.basicas.map((t) => (
              <Link key={t} to={`/combate/tecnica/${t}`} className={s.item} style={{ flexShrink: 0, width: 132, minHeight: 0, padding: 6 }}>
                <DibujoTecnica id={t} />
                <span className={s.itemDetalle}>{tecnica(t)?.nombre}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <Tarjeta>
        <p className="etiqueta">Juego de sombras</p>
        <ul className={s.seccion}>
          {a.sombra.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Tarjeta>
      <Tarjeta>
        <p className="etiqueta">Juego de pies</p>
        <ul className={s.seccion}>
          {a.pies.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Tarjeta>
      <Tarjeta>
        <p className="etiqueta">Encadenamientos (y por qué funcionan)</p>
        {a.encadenamientos.map((c) => (
          <p key={c.combo} className={estilos.texto2}>
            <b>{c.combo}</b>
            <br />
            <span className={estilos.chico}>{c.porque}</span>
          </p>
        ))}
      </Tarjeta>
      <Tarjeta destacada>
        <p className="etiqueta">Con qué se combina</p>
        <h2 className={h.tituloTarjeta}>
          {a.nombre.split(' (')[0]} + {a.combinacion.con.map((c) => disciplina(c)?.nombre.split(':')[0]).join(' o ')}
        </h2>
        <p className={estilos.texto2}>{a.combinacion.texto}</p>
        <p className={estilos.chico}>Alternativa: {a.combinacion.alternativa}</p>
      </Tarjeta>
      {a.evidencia && (
        <Tarjeta>
          <p className="etiqueta">Lo que dice la evidencia</p>
          <p className={estilos.texto2}>{a.evidencia}</p>
        </Tarjeta>
      )}

      {a.id === base ? (
        <p className={estilos.chico}>Es tu disciplina base.</p>
      ) : (
        <>
          {compat && (
            <p className={estilos.texto2}>
              Con tu base ({disciplina(base)?.nombre.split(':')[0]}): <b>{compat.porcentaje} % compatibles</b>. {compat.porque}
            </p>
          )}
          <Boton variante="principal" ancho onClick={() => void usarComo('base')}>
            Usarla como mi base
          </Boton>
          {compat && compat.porcentaje < 100 && (
            <Boton ancho onClick={() => void usarComo('segunda')}>
              + Combinarla con mi base
            </Boton>
          )}
        </>
      )}
    </div>
  )
}
