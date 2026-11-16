import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { Esfuerzo } from '../../components/Esfuerzo'
import { DibujoBolsa, DibujoCompanero, DibujoTecnica } from '../../content/dibujos-combate'
import bolsa from '../../content/combate/bolsa.json'
import companero from '../../content/combate/companero.json'
import { guardarActividad, guardarSesionHecha } from '../../lib/diario'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import { fechaLocal } from '../../lib/plan/sesion'
import { Rondas as Temporizador } from '../Entrenar/Rondas'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver } from './comun'

/** Rounds de bolsa por nivel y ejercicios con compañero. */
export function BolsaCompanero() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'companero' ? 'companero' : 'bolsa'
  const [nivel, setNivel] = useState<number | null>(null)
  const [fin, setFin] = useState<number | null>(null)
  const [esfuerzoListo, setEsfuerzoListo] = useState(false)
  usarPantallaEncendida(nivel !== null && fin === null)
  useEffect(() => {
    setNivel(null)
    setFin(null)
  }, [tab])
  const n = nivel !== null ? bolsa.niveles[nivel] : null

  async function terminar(minutos: number) {
    // Compendium 2024, 15110: boxeo, bolsa (general) = 5,8 MET.
    await guardarActividad({ fecha: fechaLocal(), nombre: `Bolsa · nivel ${n!.nivel}`, met: 5.8, minutos, actividad: 'combate', variante: 'moderada', origen: 'entrenar' })
    setFin(minutos)
  }

  if (n) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <header>
          <p className="etiqueta">Bolsa · nivel {n.nivel}</p>
          <h1 className={e.titulo}>{n.nombre}</h1>
          <p className={e.para}>Fuerza: {n.fuerza}</p>
        </header>
        <Tarjeta>
          <DibujoBolsa />
        </Tarjeta>
        <ol className={s.seccion}>
          {n.pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        {fin === null ? (
          <Temporizador minutos={0} intervalos onFin={(m) => void terminar(m)} inicial={n.rounds} />
        ) : (
          <>
            <Aviso tipo="ok">¡Bien! {fin} minutos anotados en tu actividad de hoy.</Aviso>
            {!esfuerzoListo && (
              <Tarjeta>
                <Esfuerzo
                  valor={null}
                  onCambio={async (x) => {
                    await guardarSesionHecha({ sesionId: 'combate-bolsa', titulo: `Bolsa · ${n.nombre}`, version: 'completa', minutos: fin, esfuerzo: x, ejercicios: [] })
                    setEsfuerzoListo(true)
                  }}
                />
              </Tarjeta>
            )}
            <p className={estilos.texto2}>
              Para pasar al nivel siguiente: <b>{n.criterio}</b>
            </p>
            <Boton
              onClick={() => {
                setNivel(null)
                setFin(null)
                setEsfuerzoListo(false)
              }}
            >
              Volver a la bolsa
            </Boton>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>{tab === 'bolsa' ? 'Bolsa' : 'Con compañero'}</h1>
      </header>
      <div className={s.filtros} role="tablist" aria-label="Tipo">
        {(
          [
            ['bolsa', 'Bolsa'],
            ['companero', 'Con compañero'],
          ] as const
        ).map(([v, t]) => (
          <button key={v} type="button" role="tab" aria-selected={tab === v} className={`${s.filtro} ${tab === v ? s.filtroOn : ''}`} onClick={() => setParams({ tab: v }, { replace: true })}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'bolsa' ? (
        <>
          <Tarjeta destacada>
            <DibujoBolsa />
            <p className="etiqueta">Antes de pegar</p>
            <ul className={s.seccion}>
              {bolsa.seguridad.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Link to="/aprender/combate-vendaje" className={estilos.boton}>
              Cómo vendarte las manos
            </Link>
          </Tarjeta>
          {bolsa.niveles.map((x, i) => (
            <Tarjeta key={x.nivel}>
              <p className="etiqueta">
                Nivel {x.nivel} · {x.rounds.rondas} rounds de {x.rounds.trabajo / 60} min
              </p>
              <h2 className={h.tituloTarjeta}>{x.nombre}</h2>
              <p className={estilos.chico}>Fuerza: {x.fuerza}. Para pasar: {x.criterio}</p>
              <Boton variante={i === 0 ? 'principal' : undefined} ancho onClick={() => setNivel(i)}>
                Empezar nivel {x.nivel}
              </Boton>
            </Tarjeta>
          ))}
          <p className={estilos.chico}>{bolsa.fuente}</p>
        </>
      ) : (
        <>
          <Tarjeta destacada>
            <DibujoCompanero />
            <p className="etiqueta">Reglas para practicar con alguien</p>
            <ul className={s.seccion}>
              {companero.reglas.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Tarjeta>
          {companero.ejercicios.map((x) => (
            <Tarjeta key={x.nombre}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{x.nombre}</h2>
              <DibujoTecnica id={x.tecnica} />
              <p className={estilos.texto2}>{x.como}</p>
              <p className={estilos.chico}>{x.tiempo}</p>
            </Tarjeta>
          ))}
          <p className={estilos.chico}>{companero.fuente}</p>
        </>
      )}
    </div>
  )
}
