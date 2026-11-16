import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stepper } from '../../components/controles'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { DosPeleadores, EscalaPoder } from '../../content/dibujos-combate'
import { EXPERIENCIAS, experiencia, mejorExperiencia, poderDePelea } from '../../lib/calc/poder'
import { AREAS_PELEA, ESTRATEGIAS, REGLAMENTOS, RIVALES, perfilPropio, queMeFalta, simular, type Estrategia, type Reglamento, type Resumen } from '../../lib/calc/simulador'
import { guardarAjustesCombate } from '../../lib/combate'
import { db } from '../../lib/db/db'
import type { Resultados } from '../../lib/evaluacion'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver, usarCombate } from './comun'

const pct = (n: number, de: number) => `${Math.round((n / Math.max(1, de)) * 100)} %`

function chips<T extends string>(valor: T, opciones: { valor: T; texto: string }[], cambiar: (v: T) => void, etiqueta: string) {
  return (
    <div className={s.filtros} role="radiogroup" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="radio" aria-checked={valor === o.valor} className={`${s.filtro} ${valor === o.valor ? s.filtroOn : ''}`} onClick={() => cambiar(o.valor)}>
          {o.texto}
        </button>
      ))}
    </div>
  )
}

/** Todo lo que hace falta para el poder de pelea y el simulador, desde los datos del celular. */
function usarDatosPelea() {
  const combate = usarCombate()
  const { perfil } = usarInicio()
  const [areas, setAreas] = useState<Resultados['areas'] | null | undefined>(undefined)
  useEffect(() => {
    void db.evaluaciones
      .orderBy('fecha')
      .last()
      .then((ev) => setAreas((ev?.resultados as Resultados | undefined)?.areas ?? null))
  }, [])
  const a = combate.estado?.ajustes
  const golpes = a?.experienciaGolpes ?? 'ninguna'
  const agarre = a?.experienciaAgarre ?? 'ninguna'
  const sparring = a?.sparring ?? false
  const pesoKg = perfil?.pesoKg ?? 75
  const percentiles = areas ? Object.values(areas).filter((x): x is number => typeof x === 'number') : []

  async function guardar(cambio: { experienciaGolpes?: string; experienciaAgarre?: string; sparring?: boolean }) {
    await guardarAjustesCombate({ disciplina: combate.disciplina, segunda: a?.segunda, desde: a?.desde ?? new Date().toISOString(), experienciaGolpes: golpes, experienciaAgarre: agarre, sparring, ...cambio })
    await combate.recargar()
  }

  const poder = poderDePelea({ percentiles, experiencia: mejorExperiencia(golpes, agarre), sparring, nivelSombra: combate.nivelSombra, nivelPies: combate.nivelPies, pesoKg })
  const yo = perfilPropio({
    percentiles: { cardio: areas?.cardio, fuerza: areas?.fuerza, movilidad: areas?.movilidad, equilibrio: areas?.equilibrio },
    experienciaGolpes: golpes,
    experienciaAgarre: agarre,
    sparring,
    nivelSombra: combate.nivelSombra,
    nivelPies: combate.nivelPies,
    pesoKg,
  })
  return { listo: combate.estado !== null && areas !== undefined, sinEvaluacion: areas === null, golpes, agarre, sparring, pesoKg, poder, yo, guardar, perfilPesoFalta: !perfil?.pesoKg }
}

export function PoderPelea() {
  const d = usarDatosPelea()
  if (!d.listo) return null
  const opciones = EXPERIENCIAS.map((x) => ({ valor: x.valor as string, texto: x.texto }))
  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Poder de pelea</h1>
        <p className={e.para}>Una escala propia de la app para ver tu punto de partida y cómo avanzás: 10 es una persona promedio y cerca de 100, un campeón del mundo.</p>
      </header>
      <Tarjeta destacada>
        <p className="etiqueta">Tu poder de pelea</p>
        <h2 className={h.tituloTarjeta} style={{ fontSize: 56 }}>
          {d.poder.poder}
        </h2>
        <EscalaPoder valor={d.poder.poder} />
        <p className={estilos.chico}>
          10 × físico {d.poder.fisico.toFixed(2).replace('.', ',')} × técnica {d.poder.tecnica.toFixed(2).replace('.', ',')} × peso {d.poder.peso.toFixed(2).replace('.', ',')}
        </p>
      </Tarjeta>
      {d.sinEvaluacion && (
        <Aviso tipo="error">
          Todavía no tenés una evaluación: el factor físico se toma como promedio. <Link to="/evaluacion">Hacé la evaluación</Link> para que sea tuyo.
        </Aviso>
      )}
      {d.perfilPesoFalta && <p className={estilos.chico}>No cargaste tu peso: se usan 75 kg. Lo podés cambiar en Perfil.</p>}

      <p className="etiqueta">Experiencia en golpes (boxeo, kick, muay thai, karate…)</p>
      {chips(d.golpes, opciones, (v) => void d.guardar({ experienciaGolpes: v }), 'Experiencia en golpes')}
      <p className="etiqueta">Experiencia en agarre (lucha, judo, BJJ…)</p>
      {chips(d.agarre, opciones, (v) => void d.guardar({ experienciaAgarre: v }), 'Experiencia en agarre')}
      <label className={s.interruptor}>
        <input type="checkbox" checked={d.sparring} onChange={(ev) => void d.guardar({ sparring: ev.target.checked })} />
        Hice sparring con un profesor
      </label>

      <Tarjeta>
        <p className="etiqueta">De dónde sale</p>
        <ul className={s.seccion}>
          <li>
            <b>Físico:</b> tus percentiles de la evaluación pasados a puntaje z (cuántos desvíos estás arriba o abajo del promedio): e^(0,35 × z promedio).
          </li>
          <li>
            <b>Técnica:</b> tu experiencia ({experiencia(mejorExperiencia(d.golpes, d.agarre)).texto.toLowerCase()}, de 1,0 a 3,8; vale menos sin sparring) por tus niveles de sombra y pies (de 0,8 a 1,2).
          </li>
          <li>
            <b>Peso:</b> (tu peso / 75)^0,33. Más peso suma, pero cada vez menos.
          </li>
        </ul>
        <p className={estilos.chico}>Es una escala propia de la app, no un estándar publicado. Sirve para compararte con vos mismo con el tiempo.</p>
      </Tarjeta>
      <Link to="/combate/simulador" className={h.botonPrincipal}>
        Ir al simulador
      </Link>
    </div>
  )
}

export function Simulador() {
  const d = usarDatosPelea()
  const [rivalId, setRivalId] = useState('boxeo-1')
  const [pesoRival, setPesoRival] = useState<number | null>(null)
  const [reglamento, setReglamento] = useState<Reglamento>('mma')
  const [mia, setMia] = useState<Estrategia>('equilibrada')
  const [suya, setSuya] = useState<Estrategia>('equilibrada')
  const [res, setRes] = useState<{ r: Resumen; falta: ReturnType<typeof queMeFalta> } | null>(null)
  const preset = RIVALES.find((r) => r.id === rivalId)!
  const rival = useMemo(() => ({ ...preset, pesoKg: pesoRival ?? d.pesoKg }), [preset, pesoRival, d.pesoKg])
  if (!d.listo) return null
  const poderRival = poderDePelea({
    percentiles: [rival.cardio, rival.fuerza],
    experiencia: preset.experiencia,
    sparring: preset.experiencia !== 'ninguna',
    nivelSombra: preset.experiencia === 'ninguna' ? 0 : 5,
    nivelPies: preset.experiencia === 'ninguna' ? 0 : 6,
    pesoKg: rival.pesoKg,
  }).poder

  function correr() {
    const par: [typeof d.yo, typeof rival] = [d.yo, rival]
    setRes({ r: simular(par, [mia, suya], reglamento, 500, Date.now() % 100000), falta: queMeFalta(par, [mia, suya], reglamento) })
  }
  const cambio = (f: () => void) => () => {
    f()
    setRes(null)
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Simulador</h1>
        <p className={e.para}>500 peleas simuladas entre vos y un rival, con un modelo propio de la app. Es para orientarte y saber qué entrenar, no predice una pelea real.</p>
      </header>
      <Aviso tipo="error">No es una invitación a pelear: en la calle, lo mejor siempre es evitar la pelea o irte.</Aviso>

      <p className="etiqueta">Rival</p>
      {chips(rivalId, RIVALES.map((r) => ({ valor: r.id, texto: r.nombre })), (v) => cambio(() => setRivalId(v))(), 'Rival')}
      <p className={estilos.chico}>{preset.detalle}</p>
      <Stepper etiqueta="Peso del rival" valor={rival.pesoKg} min={45} max={150} unidad="kg" onCambio={(v) => cambio(() => setPesoRival(v))()} />
      <EscalaPoder valor={d.poder.poder} rival={{ valor: poderRival, nombre: preset.nombre }} />

      <p className="etiqueta">Reglamento</p>
      {chips(reglamento, REGLAMENTOS, (v) => cambio(() => setReglamento(v))(), 'Reglamento')}
      <p className="etiqueta">Tu estrategia</p>
      {chips(mia, ESTRATEGIAS, (v) => cambio(() => setMia(v))(), 'Tu estrategia')}
      <p className={estilos.chico}>{ESTRATEGIAS.find((x) => x.valor === mia)?.detalle}</p>
      <p className="etiqueta">Estrategia del rival</p>
      {chips(suya, ESTRATEGIAS, (v) => cambio(() => setSuya(v))(), 'Estrategia del rival')}

      <Boton variante="principal" ancho onClick={correr}>
        Simular 500 peleas
      </Boton>

      {res && (
        <>
          <Tarjeta destacada>
            <p className="etiqueta">Resultado</p>
            <h2 className={h.tituloTarjeta}>Ganás {pct(res.r.gana, res.r.peleas)}</h2>
            <DosPeleadores gana={res.r.gana} empate={res.r.empate} pierde={res.r.pierde} />
            <ul className={s.seccion}>
              <li>
                Ganás {res.r.gana}: {res.r.porMetodo.gana.ko} por nocaut, {res.r.porMetodo.gana.sumision} por sumisión y {res.r.porMetodo.gana.decision} por decisión.
              </li>
              <li>Empatás {res.r.empate}.</li>
              <li>
                Perdés {res.r.pierde}: {res.r.porMetodo.pierde.ko} por nocaut, {res.r.porMetodo.pierde.sumision} por sumisión y {res.r.porMetodo.pierde.decision} por decisión.
              </li>
            </ul>
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">Qué te falta para ganarle</p>
            {res.falta.mejoras.length === 0 ? (
              <p className={estilos.texto2}>{res.falta.base > 0.9 ? 'Ya le ganás casi siempre con este reglamento.' : 'Ninguna área sola cambia mucho: hace falta mejorar en todo, de a poco.'}</p>
            ) : (
              <ol className={s.seccion}>
                {res.falta.mejoras.slice(0, 3).map((m) => {
                  const a = AREAS_PELEA.find((x) => x.valor === m.area)!
                  return (
                    <li key={m.area}>
                      <b>{a.texto}</b>: con 15 puntos más pasarías a ganar el {Math.round(m.ganarias * 100)} %. {a.consejo}
                    </li>
                  )
                })}
              </ol>
            )}
          </Tarjeta>
          <Tarjeta>
            <p className="etiqueta">Tus áreas para el simulador (de 0 a 100)</p>
            <ul className={s.seccion}>
              {AREAS_PELEA.map((a) => (
                <li key={a.valor}>
                  {a.texto}: vos {d.yo[a.valor]} · rival {rival[a.valor]}
                </li>
              ))}
            </ul>
            <p className={estilos.chico}>Salen de tu evaluación (cardio, fuerza, movilidad, equilibrio), tu experiencia y tus niveles de sombra y pies. Cambialos en Poder de pelea.</p>
          </Tarjeta>
        </>
      )}
    </div>
  )
}
