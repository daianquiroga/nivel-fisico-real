import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoGuardia, DibujoPies, DibujoTecnica } from '../../content/dibujos-combate'
import { NIVELES_PIES, NIVELES_SOMBRA, disciplina, tecnica } from '../../lib/combate'
import { guardarActividad, guardarTipo } from '../../lib/diario'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import { Rondas as Temporizador } from '../Entrenar/Rondas'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import { Volver, usarCombate } from './comun'

/** MET del Compendium 2024: 15425 (práctica lenta, 5,3) para pies y sombra hasta el nivel 3; 15430 (ritmo moderado, 10,3) desde el 4. */
const metDe = (tipo: string, nivel: number) => (tipo === 'sombra' && nivel >= 4 ? 10.3 : 5.3)

export function RondasCombate() {
  const { tipo = 'sombra' } = useParams()
  const { estado, recargar, disciplina: disc, nivelSombra, nivelPies } = usarCombate(useSearchParams()[0].get('d'))
  const [fin, setFin] = useState<number | null>(null)
  usarPantallaEncendida(true)
  if (!estado) return null
  const esPies = tipo === 'pies'
  const niveles = esPies ? NIVELES_PIES : NIVELES_SOMBRA
  const actual = esPies ? nivelPies : nivelSombra
  const n = niveles[Math.min(actual, niveles.length - 1)]
  const d = disciplina(disc)!
  const tecnicas = esPies ? [] : d.basicas.slice(0, n.nivel <= 2 ? (['hibrido', 'completo'].includes(d.id) ? 6 : 4) : d.basicas.length)

  async function terminar(minutos: number) {
    const hoy = fechaLocal()
    await guardarActividad({
      fecha: hoy,
      nombre: esPies ? `Juego de pies · nivel ${n.nivel}` : `Sombra de ${d.nombre.toLowerCase()} · nivel ${n.nivel}`,
      met: metDe(tipo, n.nivel),
      minutos,
      actividad: 'combate',
      variante: metDe(tipo, n.nivel) > 6 ? 'moderada' : 'suave',
      origen: 'entrenar',
    })
    setFin(minutos)
  }

  async function aprobarPies() {
    await guardarTipo('pies', fechaLocal(), { fecha: new Date().toISOString(), nivel: n.nivel })
    await recargar()
    setFin(null)
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">{esPies ? 'Juego de pies' : `Sombra · ${d.nombre}`}</p>
        <h1 className={e.titulo}>
          Nivel {n.nivel}: {n.nombre}
        </h1>
        <p className={e.para}>{esPies ? (n as (typeof NIVELES_PIES)[number]).que : n.objetivo}</p>
      </header>
      <Tarjeta>{esPies ? <DibujoPies nivel={n.nivel} /> : ['lucha', 'bjj'].includes(d.id) ? <DibujoTecnica id="escape-cadera" /> : d.id === 'judo' ? <DibujoTecnica id="uchikomi" /> : d.id === 'aikido' ? <DibujoTecnica id="tenkan" /> : <DibujoGuardia />}</Tarjeta>
      <ol className={s.seccion}>
        {n.pasos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>

      {(esPies ? d.pies : d.sombra)?.[String(n.nivel)] && (
        <>
          <p className="etiqueta">En {d.nombre.split(':')[0].toLowerCase()}</p>
          <ul className={s.seccion}>
            {(esPies ? d.pies : d.sombra)![String(n.nivel)].map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </>
      )}

      {tecnicas.length > 0 && (
        <>
          <p className="etiqueta">Técnicas de este nivel</p>
          <div className={s.filtros}>
            {tecnicas.map((id) => (
              <Link key={id} to={`/combate/tecnica/${id}`} className={s.item} style={{ flexShrink: 0, width: 132, minHeight: 0, padding: 6 }}>
                <DibujoTecnica id={id} />
                <span className={s.itemDetalle}>{tecnica(id)?.nombre}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {fin === null ? (
        <Temporizador minutos={0} intervalos onFin={(m) => void terminar(m)} inicial={n.rounds} />
      ) : (
        <>
          <Aviso tipo="ok">¡Bien! {fin} minutos anotados en tu actividad de hoy.</Aviso>
          {esPies && actual < NIVELES_PIES.length && (
            <Tarjeta>
              <p className={estilos.texto2}>
                Para pasar al nivel siguiente: <b>{(n as (typeof NIVELES_PIES)[number]).pasar}</b> ¿Lo lograste?
              </p>
              <Boton variante="principal" onClick={() => void aprobarPies()}>
                Sí, lo logré
              </Boton>
              <Boton onClick={() => setFin(null)}>Todavía no, otra vez</Boton>
            </Tarjeta>
          )}
          {!esPies && actual < NIVELES_SOMBRA.length && (
            <Link to={`/combate/evaluar?d=${disc}`} className={estilos.boton}>
              Evaluar el nivel {n.nivel} con un video
            </Link>
          )}
          <Link to="/combate" className={estilos.boton}>
            Volver a Combate
          </Link>
        </>
      )}
    </div>
  )
}
