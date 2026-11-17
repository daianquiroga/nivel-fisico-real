import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { Esfuerzo } from '../../components/Esfuerzo'
import { DibujoGuardia, DibujoPies, DibujoTecnica } from '../../content/dibujos-combate'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { tecnica } from '../../lib/combate'
import { ejercicio } from '../../lib/ejercicios'
import { guardarActividad, guardarSesionHecha } from '../../lib/diario'
import { avisoFin, pitido, usarPantallaEncendida, vibrar } from '../../lib/dispositivo'
import { bloquesSesion, nombreCorto, resumenBloques, type Bloque } from '../../lib/plan/marcial'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarPlan } from '../../lib/plan/usarPlan'
import { callar, hablar, hayVoz, setVozActiva, vozActiva } from '../../lib/voz'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import t from '../../components/tiempo.module.css'
import { Volver, usarCombate } from './comun'

const reloj = (seg: number) => `${Math.floor(seg / 60)}:${String(Math.max(0, seg) % 60).padStart(2, '0')}`

function Dibujos({ b }: { b: Bloque }) {
  if (b.tecnicas?.length)
    return (
      <div className={s.filtros}>
        {b.tecnicas.map((id) => (
          <span key={id} className={s.item} style={{ flexShrink: 0, width: 120, minHeight: 0, padding: 6 }}>
            <DibujoTecnica id={id} />
            <span className={s.itemDetalle}>{tecnica(id)?.nombre}</span>
          </span>
        ))}
      </div>
    )
  if (b.ejercicios?.length)
    return (
      <div className={s.filtros}>
        {b.ejercicios.map((id) => (
          <span key={id} className={s.item} style={{ flexShrink: 0, width: 132, minHeight: 0, padding: 6 }}>
            <DibujoEjercicio id={id} />
            <span className={s.itemDetalle}>{ejercicio(id)?.nombre}</span>
          </span>
        ))}
      </div>
    )
  if (b.nivelPies) return <DibujoPies nivel={b.nivelPies} />
  if (b.tipo === 'calor' || b.tipo === 'sombra') return <DibujoGuardia />
  return null
}

/** Sesión marcial guiada: bloque por bloque, con reloj, voz y dibujos. Se abre sola desde el plan o desde Combate. */
export function SombraGuiada() {
  const [params] = useSearchParams()
  const arteId = params.get('d') ?? 'boxeo'
  const minutos = Math.max(10, Number(params.get('min') ?? 30))
  const movilidad = params.get('mov') === '1'
  const dia = params.get('dia')
  const idx = params.get('idx')
  const { plan } = usarPlan()
  const sesionPlan = dia !== null && idx !== null ? plan?.dias[Number(dia)]?.sesiones[Number(idx)] : undefined
  const { estado, nivelSombra, nivelPies } = usarCombate(arteId)
  const bloques = useMemo(() => bloquesSesion(arteId, minutos, movilidad, nivelSombra, nivelPies), [arteId, minutos, movilidad, nivelSombra, nivelPies])
  const [i, setI] = useState(-1)
  const [fin, setFin] = useState<number | null>(null)
  const [pausa, setPausa] = useState<number | null>(null)
  const [resta, setResta] = useState(0)
  const [voz, setVoz] = useState(vozActiva())
  const [esfuerzoGuardado, setEsfuerzoGuardado] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const avisos = useRef(new Set<string>())
  usarPantallaEncendida(i >= 0 && !terminado)

  const b = bloques[i]
  const total = Math.round(bloques.reduce((a, x) => a + x.segundos, 0) / 60)
  const nombre = nombreCorto(arteId)

  // Al empezar cada bloque: reloj, aviso y voz.
  useEffect(() => {
    if (i < 0 || !b) return
    setFin(performance.now() + b.segundos * 1000)
    setResta(b.segundos)
    setPausa(null)
    pitido(990, 250)
    vibrar(200)
    hablar(`${b.titulo.replace(/: /, '. ')}. ${b.que[0] ?? ''}`)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fin === null || pausa !== null || terminado) return
    const id = setInterval(() => {
      const r = Math.ceil((fin - performance.now()) / 1000)
      setResta(Math.max(0, r))
      const clave = `${i}-${r}`
      if (r <= 3 && r > 0 && !avisos.current.has(clave)) {
        avisos.current.add(clave)
        pitido(660, 120)
      }
      if (r === 10 && b && b.segundos > 30 && !avisos.current.has(clave)) {
        avisos.current.add(clave)
        hablar('Diez segundos')
      }
      if (r <= 0) {
        clearInterval(id)
        siguiente()
      }
    }, 200)
    return () => clearInterval(id)
  }, [fin, pausa, i, terminado]) // eslint-disable-line react-hooks/exhaustive-deps

  function siguiente() {
    if (i + 1 < bloques.length) setI(i + 1)
    else void terminar()
  }

  async function terminar() {
    setTerminado(true)
    setFin(null)
    avisoFin()
    hablar('Terminaste. Muy bien.')
    // Compendium 2024: artes marciales, práctica lenta (15425) 5,3 MET; desde el nivel 4 de sombra se toma 7,8 (mitad a 15425 y
    // mitad a ritmo moderado, 15430, 10,3 MET), igual que la sesión del sistema completo: decisión de diseño.
    const met = nivelSombra >= 3 ? 7.8 : 5.3
    await guardarActividad({ fecha: fechaLocal(), nombre: `Sesión guiada de ${nombre.toLowerCase()}`, met, minutos: total, actividad: 'combate', variante: met > 6 ? 'moderada' : 'suave', origen: 'entrenar' })
  }

  if (!estado) return null

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">
          Sesión guiada · {nombre} · {total} min
        </p>
        <h1 className={e.titulo}>{i < 0 ? `${nombre}: tu sesión` : terminado ? '¡Terminaste!' : b?.titulo}</h1>
      </header>

      {i < 0 && (
        <>
          <p className={e.para}>
            Te guío bloque por bloque: la pantalla te dice qué hacer y el reloj avanza solo. Nivel de sombra {nivelSombra + 1} y de pies {nivelPies + 1}.
          </p>
          <Tarjeta>
            <ol className={s.seccion} style={{ margin: 0 }}>
              {resumenBloques(bloques).map((x, k) => (
                <li key={k}>{x}</li>
              ))}
            </ol>
            <p className={estilos.chico}>Entre rounds hay descansos. Necesitás 1 × 1 m{['bjj', 'lucha', 'judo', 'aikido'].includes(arteId) ? ' (mejor 2 × 1 m o un colchón finito)' : ''}.</p>
          </Tarjeta>
          {hayVoz() && (
            <Boton
              ancho
              onClick={() => {
                setVozActiva(!voz)
                setVoz(!voz)
              }}
            >
              {voz ? '🔊 Voz activada (tocá para apagar)' : '🔇 Activar la voz que te guía'}
            </Boton>
          )}
          <Boton variante="principal" ancho onClick={() => setI(0)}>
            Empezar
          </Boton>
        </>
      )}

      {i >= 0 && !terminado && b && (
        <>
          <p className={estilos.chico}>
            Bloque {i + 1} de {bloques.length}
          </p>
          <div className={t.caja}>
            <p className={t.estado}>{b.tipo === 'descanso' ? 'Descanso' : pausa !== null ? 'En pausa' : 'Trabajo'}</p>
            <div className={`${t.reloj} ${b.tipo === 'descanso' ? '' : t.corriendo}`}>{reloj(resta)}</div>
            <div className={t.fila}>
              <button
                type="button"
                className={`${t.botonGrande} ${t.parar}`}
                onClick={() => {
                  if (pausa === null) {
                    setPausa(resta)
                    callar()
                  } else {
                    setFin(performance.now() + pausa * 1000)
                    setPausa(null)
                  }
                }}
              >
                {pausa === null ? 'Pausa' : 'Seguir'}
              </button>
              <button type="button" className={t.botonGrande} onClick={siguiente}>
                Saltar
              </button>
            </div>
          </div>
          <Tarjeta destacada>
            <ul className={s.seccion} style={{ margin: 0 }}>
              {b.que.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </Tarjeta>
          <Dibujos b={b.tipo === 'descanso' ? (bloques[i + 1] ?? b) : b} />
        </>
      )}

      {terminado && (
        <>
          <Aviso tipo="ok">¡Bien! {total} minutos anotados en tu actividad de hoy.</Aviso>
          {!esfuerzoGuardado && (
            <Tarjeta>
              <Esfuerzo
                valor={null}
                onCambio={async (n) => {
                  await guardarSesionHecha({
                    sesionId: sesionPlan?.id ?? `combate-guiada-${arteId}`,
                    titulo: sesionPlan?.titulo ?? `Sesión guiada de ${nombre.toLowerCase()}`,
                    version: 'completa',
                    minutos: total,
                    esfuerzo: n,
                    ejercicios: sesionPlan?.ejercicios.map((x) => x.id) ?? ['juego-pies', 'sombra'],
                  })
                  setEsfuerzoGuardado(true)
                }}
              />
            </Tarjeta>
          )}
          <Link to={`/combate/evaluar?d=${arteId}`} className={estilos.boton}>
            Evaluar mi sombra con un video
          </Link>
          <Link to="/" className={estilos.boton}>
            Volver a Hoy
          </Link>
        </>
      )}
    </div>
  )
}
