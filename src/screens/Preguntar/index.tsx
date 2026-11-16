import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flecha, Lienzo, Texto } from '../../components/Figura'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { juntarDatosPregunta } from '../../lib/coach/datosPregunta'
import { armarTextoClaude, type DatosPregunta, type OpcionesPregunta } from '../../lib/coach/preguntar'
import { usarNivelLectura } from '../../lib/usarNivelLectura'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'

const SUGERENCIAS = ['¿Cómo voy? Decime qué mejorar.', 'Revisá mi plan de esta semana.', '¿Qué como antes y después de entrenar?', '¿Cómo mejoro mis flexiones?']

/** Los 3 pasos: escribir, copiar y pegar en Claude. */
function PasosPreguntar() {
  const caja = (x: number, n: string, t1: string, t2: string) => (
    <g key={n}>
      <rect x={x} y={20} width={84} height={70} rx={10} fill="var(--surface-2)" stroke="var(--line)" />
      <circle cx={x + 42} cy={42} r={13} fill="var(--accent)" />
      <Texto x={x + 42} y={47} color="#fff">
        {n}
      </Texto>
      <Texto x={x + 42} y={74} color="var(--text-2)">
        {t1}
      </Texto>
      <Texto x={x + 42} y={110}>
        {t2}
      </Texto>
    </g>
  )
  return (
    <Lienzo etiqueta="Escribí tu pregunta, copiá el texto y pegalo en la app de Claude" alto={124}>
      {caja(6, '1', 'escribí', 'tu pregunta')}
      {caja(118, '2', 'copiá', 'el texto')}
      {caja(230, '3', 'pegá', 'en Claude')}
      <Flecha de={[93, 55]} a={[115, 55]} />
      <Flecha de={[205, 55]} a={[227, 55]} />
    </Lienzo>
  )
}

export function Preguntar() {
  const navegar = useNavigate()
  const { nivel } = usarNivelLectura()
  const [datos, setDatos] = useState<DatosPregunta | null>(null)
  const [pregunta, setPregunta] = useState('')
  const [op, setOp] = useState<OpcionesPregunta>({ horarios: true, salud: true, diario: false })
  const [copiado, setCopiado] = useState(false)
  const [manual, setManual] = useState(false)
  const listo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (copiado) listo.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [copiado])
  useEffect(() => {
    void juntarDatosPregunta(nivel).then(setDatos)
  }, [nivel])
  const texto = useMemo(() => (datos ? armarTextoClaude(datos, op, pregunta) : ''), [datos, op, pregunta])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      setManual(true)
    }
  }

  const casilla = (k: keyof OpcionesPregunta, t: string) => (
    <label className={s.interruptor}>
      <input
        type="checkbox"
        checked={op[k]}
        onChange={(ev) => {
          setOp({ ...op, [k]: ev.target.checked })
          setCopiado(false)
        }}
      />
      {t}
    </label>
  )

  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      </div>
      <header>
        <h1 className={e.titulo}>Preguntarle a Claude</h1>
        <p className={e.para}>
          La app arma un texto con tus datos para que Claude te responda sabiendo cómo estás. La app no se conecta a ningún lado: vos copiás el texto y lo pegás en la app de
          Claude.
        </p>
      </header>
      <Tarjeta>
        <PasosPreguntar />
      </Tarjeta>

      <label htmlFor="pregunta" className="etiqueta">
        1. Tu pregunta
      </label>
      <textarea
        id="pregunta"
        className={estilos.areaTexto}
        style={{ minHeight: 96 }}
        value={pregunta}
        placeholder="Ej.: ¿por qué no mejoro en sentadilla?"
        onChange={(ev) => {
          setPregunta(ev.target.value)
          setCopiado(false)
        }}
      />
      <div className={s.filtros} role="group" aria-label="Preguntas de ejemplo">
        {SUGERENCIAS.map((x) => (
          <button
            key={x}
            type="button"
            className={s.filtro}
            onClick={() => {
              setPregunta(x)
              setCopiado(false)
            }}
          >
            {x}
          </button>
        ))}
      </div>

      <p className="etiqueta">Qué incluir</p>
      <p className={estilos.chico}>Siempre va: perfil, objetivos, última evaluación, plan, sesiones y ejercicios anotados. Nunca van las fotos.</p>
      {casilla('horarios', 'Horarios y nombres de lugares')}
      {casilla('salud', 'Salud: limitaciones, molestias y días sin fumar')}
      {casilla('diario', 'Mis notas del diario de cada sesión')}

      <details>
        <summary className={estilos.texto2} style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          Ver el texto que se copia
        </summary>
        <textarea readOnly className={estilos.areaTexto} style={{ minHeight: 260, fontSize: 13 }} value={texto} aria-label="Texto para Claude" />
      </details>

      <Boton variante="principal" ancho disabled={!datos} onClick={() => void copiar()}>
        2. Copiar texto
      </Boton>
      {copiado && (
        <div ref={listo} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Aviso tipo="ok">Copiado. Ahora abrí la app de Claude, mantené apretado el cuadro de mensaje y tocá Pegar.</Aviso>
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className={estilos.boton}>
            3. Abrir Claude
          </a>
          <p className={estilos.chico}>Lo que pegues en Claude queda en tu cuenta de Claude. Si no querés compartir algo, sacalo con las casillas de arriba antes de copiar.</p>
        </div>
      )}
      {manual && (
        <Dialogo titulo="Copiá este texto" onCerrar={() => setManual(false)}>
          <p className={estilos.texto2}>Tu celular no dejó copiar solo. Mantené apretado el texto, elegí "Seleccionar todo" y copiá.</p>
          <textarea readOnly className={estilos.areaTexto} value={texto} aria-label="Texto para Claude" />
          <Boton onClick={() => setManual(false)}>Listo</Boton>
        </Dialogo>
      )}
    </div>
  )
}
