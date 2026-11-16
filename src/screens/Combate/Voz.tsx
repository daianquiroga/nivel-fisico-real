import { useEffect, useMemo, useRef, useState } from 'react'
import { Aviso, Boton, estilos } from '../../components/ui'
import { Stepper } from '../../components/controles'
import { DibujoGuardia } from '../../content/dibujos-combate'
import { disciplina, tecnicasDe, type Tecnica } from '../../lib/combate'
import { generarCombo, listaCombos, segundosCombo, textoCombo } from '../../lib/combos'
import { guardarActividad } from '../../lib/diario'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import { fechaLocal } from '../../lib/plan/sesion'
import { hablar, hayVoz, setVozActiva, vozActiva } from '../../lib/voz'
import { Rondas as Temporizador } from '../Entrenar/Rondas'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import { Volver, usarCombate } from './comun'

type Orden = 'fijo' | 'aleatorio'
type Momento = 'todo' | 'final'

const COMPLEJIDAD = ['', 'Simple (2 técnicas)', 'Media (2 o 3)', 'Difícil (3 a 5)']

/** Entrenador por voz: canta combinaciones durante el trabajo de cada round. */
export function VozCombate() {
  const { estado, disciplina: base } = usarCombate()
  const segunda = estado?.ajustes?.segunda
  const [usar, setUsar] = useState<'base' | 'ambas'>('base')
  const [complejidad, setComplejidad] = useState(1)
  const [tempo, setTempo] = useState(4)
  const [orden, setOrden] = useState<Orden>('aleatorio')
  const [momento, setMomento] = useState<Momento>('todo')
  const [semilla, setSemilla] = useState(0)
  const [actual, setActual] = useState<string | null>(null)
  const [fin, setFin] = useState<number | null>(null)
  const [voz, setVoz] = useState(vozActiva())
  const [enMarcha, setEnMarcha] = useState(false)
  const fase = useRef<{ trabajo: boolean; finFase: number }>({ trabajo: false, finFase: 0 })
  usarPantallaEncendida(true)
  useEffect(() => {
    if (enMarcha) window.scrollTo(0, 0)
  }, [enMarcha])

  const tecnicas = useMemo(() => {
    const ids = new Set<string>()
    const lista: Tecnica[] = []
    for (const d of usar === 'ambas' && segunda ? [base, segunda] : [base])
      for (const t of tecnicasDe(d, null))
        if (!ids.has(t.id)) {
          ids.add(t.id)
          lista.push(t)
        }
    return lista
  }, [base, segunda, usar])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fijas = useMemo(() => listaCombos(tecnicas, complejidad, 6), [tecnicas, complejidad, semilla])
  const indice = useRef(0)

  // Mientras dura el trabajo, canta una combinación cada tempo + medio segundo por técnica.
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const cantar = () => {
      const f = fase.current
      const resta = (f.finFase - performance.now()) / 1000
      if (f.trabajo && resta > 2 && (momento === 'todo' || resta <= 60)) {
        const c = orden === 'fijo' && fijas.length ? fijas[indice.current++ % fijas.length] : generarCombo(tecnicas, complejidad)
        const texto = textoCombo(c)
        setActual(texto)
        hablar(texto)
        id = setTimeout(cantar, segundosCombo(c, tempo) * 1000)
      } else {
        if (!f.trabajo) setActual(null)
        id = setTimeout(cantar, 500)
      }
    }
    id = setTimeout(cantar, 1500)
    return () => clearTimeout(id)
  }, [orden, fijas, tecnicas, complejidad, tempo, momento])

  if (!estado) return null
  const d = disciplina(base)!

  async function terminar(minutos: number) {
    fase.current = { trabajo: false, finFase: 0 }
    await guardarActividad({
      fecha: fechaLocal(),
      nombre: `Sombra con voz · ${d.nombre.toLowerCase()}`,
      met: complejidad >= 3 ? 10.3 : 5.3,
      minutos,
      actividad: 'combate',
      variante: complejidad >= 3 ? 'moderada' : 'suave',
      origen: 'entrenar',
    })
    setFin(minutos)
  }

  const chips = <T extends string>(valor: T, opciones: [T, string][], cambiar: (v: T) => void, etiqueta: string) => (
    <div className={s.filtros} role="radiogroup" aria-label={etiqueta}>
      {opciones.map(([v, t]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} className={`${s.filtro} ${valor === v ? s.filtroOn : ''}`} onClick={() => cambiar(v)}>
          {t}
        </button>
      ))}
    </div>
  )

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">{d.nombre}</p>
        <h1 className={e.titulo}>Entrenador por voz</h1>
        <p className={e.para}>Durante cada round la app te canta combinaciones. Escuchá, hacelas y volvé a la guardia.</p>
      </header>
      {!hayVoz() && <Aviso tipo="error">Este celular no tiene voz disponible: vas a ver las combinaciones en pantalla, en grande.</Aviso>}
      {hayVoz() && (
        <label className={s.interruptor}>
          <input
            type="checkbox"
            checked={voz}
            onChange={(ev) => {
              setVoz(ev.target.checked)
              setVozActiva(ev.target.checked)
            }}
          />
          Cantar en voz alta
        </label>
      )}

      {actual ? (
        <div className={s.item} style={{ minHeight: 140, justifyContent: 'center', alignItems: 'center', borderColor: 'var(--accent)' }} aria-live="polite">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 1.05, textAlign: 'center', textTransform: 'uppercase' }}>{actual}</span>
        </div>
      ) : (
        <DibujoGuardia />
      )}

      {fin === null ? (
        <>
          {!enMarcha && (
            <>
          {segunda && chips(usar, [['base', `Solo ${d.nombre.split(':')[0].toLowerCase()}`], ['ambas', `Con ${disciplina(segunda)?.nombre.split(':')[0].toLowerCase()}`]], setUsar, 'Qué técnicas usar')}
          <p className="etiqueta">Complejidad</p>
          {chips(String(complejidad) as '1' | '2' | '3', [['1', COMPLEJIDAD[1]], ['2', COMPLEJIDAD[2]], ['3', COMPLEJIDAD[3]]], (v) => setComplejidad(Number(v)), 'Complejidad')}
          <Stepper etiqueta="Tempo (segundos entre combinaciones)" valor={tempo} min={2} max={10} onCambio={setTempo} unidad="s" />
          <p className="etiqueta">Orden</p>
          {chips(orden, [['aleatorio', 'Al azar'], ['fijo', 'Siempre las mismas 6']], setOrden, 'Orden')}
          {orden === 'fijo' && (
            <>
              <ol className={s.seccion}>
                {fijas.map((c) => (
                  <li key={textoCombo(c)}>{textoCombo(c)}</li>
                ))}
              </ol>
              <Boton onClick={() => setSemilla(semilla + 1)}>Otras 6 combinaciones</Boton>
            </>
          )}
          <p className="etiqueta">Cuándo cantar</p>
          {chips(momento, [['todo', 'Todo el round'], ['final', 'Solo el último minuto']], setMomento, 'Cuándo cantar')}
            </>
          )}
          <Temporizador
            minutos={0}
            intervalos
            inicial={{ rondas: 3, trabajo: 120, descanso: 60 }}
            onRonda={(r) => {
              fase.current = { trabajo: r?.fase === 'trabajo', finFase: performance.now() + (r?.segundos ?? 0) * 1000 }
              setEnMarcha(r !== null)
            }}
            onFin={(m) => {
              setEnMarcha(false)
              void terminar(m)
            }}
          />
          {!enMarcha && <p className="etiqueta">Cómo se arman</p>}
          <p className={estilos.chico} hidden={enMarcha}>
            Cada técnica deja el peso en un lugar y la siguiente sale desde ahí: después del directo (peso adelante) va una de adelante, como el gancho; después del gancho (peso atrás), una de
            atrás. Las patadas, rodillas y codos cierran la combinación. Es una regla de diseño de la app sobre fundamentos comunes de enseñanza.
          </p>
        </>
      ) : (
        <>
          <Aviso tipo="ok">¡Bien! {fin} minutos anotados en tu actividad de hoy.</Aviso>
          <Boton onClick={() => setFin(null)}>Otra vez</Boton>
        </>
      )}
    </div>
  )
}
