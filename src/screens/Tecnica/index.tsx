import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { leerTipo, guardarTipo } from '../../lib/diario'
import { equipoDisponible, type Ejercicio } from '../../lib/ejercicios'
import { MOVIMIENTOS_BASE, apruebaTecnica, basicosPara, criteriosTecnica, type PruebaTecnica } from '../../lib/tecnica'
import { leerPlan } from '../../lib/plan/usarPlan'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import { Volver } from '../Combate/comun'

function Revision({ ej, aprobado, onGuardado }: { ej: Ejercicio; aprobado: boolean; onGuardado: (ok: boolean) => void }) {
  const criterios = criteriosTecnica(ej)
  const [marcas, setMarcas] = useState<boolean[]>(criterios.map(() => false))
  const [abierto, setAbierto] = useState(false)
  const movimiento = MOVIMIENTOS_BASE.find((m) => m.patron === ej.patron || (m.patron === 'traccion' && ej.patron === 'traccion-vertical'))?.texto
  async function guardar() {
    const ok = apruebaTecnica(marcas)
    await guardarTipo('tecnica', fechaLocal(), { fecha: new Date().toISOString(), ejercicio: ej.id, criterios: marcas, aprobado: ok })
    setMarcas(criterios.map(() => false))
    setAbierto(false)
    onGuardado(ok)
  }
  return (
    <Tarjeta>
      <p className="etiqueta">{movimiento}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Link to={`/ejercicio/${ej.id}`} className={x.itemNombre} style={{ color: 'var(--text)' }}>
          {ej.nombre}
        </Link>
        <span className={x.tag} style={aprobado ? { background: 'var(--done)', color: 'var(--bg)' } : undefined}>
          {aprobado ? '✓ aprobada' : 'sin aprobar'}
        </span>
      </div>
      <DibujoEjercicio id={ej.id} />
      {!abierto ? (
        <Boton onClick={() => setAbierto(true)}>{aprobado ? 'Revisar de nuevo' : 'Revisar con un video'}</Boton>
      ) : (
        <>
          <p className={estilos.chico}>Grabate de costado haciendo 5 repeticiones. Mirá el video y tildá solo lo que hiciste bien en todas.</p>
          {criterios.map((c, i) => (
            <label key={c} className={x.interruptor}>
              <input type="checkbox" checked={marcas[i]} onChange={(ev) => setMarcas(marcas.map((m, j) => (j === i ? ev.target.checked : m)))} />
              {c}
            </label>
          ))}
          <Boton variante="principal" onClick={() => void guardar()}>
            Guardar ({marcas.filter(Boolean).length} de {criterios.length})
          </Boton>
        </>
      )}
    </Tarjeta>
  )
}

/** Checklist de técnica de los 6 ejercicios básicos. */
export function Tecnica() {
  const { cargado, perfil, lugares } = usarInicio()
  const [basicos, setBasicos] = useState<Ejercicio[] | null>(null)
  const [pruebas, setPruebas] = useState<PruebaTecnica[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const recargar = useCallback(async () => setPruebas(await leerTipo<PruebaTecnica>('tecnica')), [])
  useEffect(() => {
    if (!cargado) return
    void leerPlan().then((p) => setBasicos(basicosPara(p, equipoDisponible(lugares), perfil?.limitaciones ?? [])))
    void recargar()
  }, [cargado, lugares, perfil, recargar])
  if (!basicos) return null
  const ok = new Set(pruebas.filter((p) => p.aprobado).map((p) => p.ejercicio))
  const n = basicos.filter((b) => ok.has(b.id)).length
  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Técnica de los básicos</h1>
        <p className={e.para}>
          Un ejercicio por cada movimiento base, el que ya hacés en tu plan. Aprobar los 6 es requisito para pasar de etapa. Vas {n} de {basicos.length}.
        </p>
      </header>
      {mensaje && <Aviso tipo="ok">{mensaje}</Aviso>}
      {basicos.map((b) => (
        <Revision
          key={b.id}
          ej={b}
          aprobado={ok.has(b.id)}
          onGuardado={(aprobo) => {
            setMensaje(aprobo ? `¡Técnica aprobada en ${b.nombre.toLowerCase()}!` : `Seguí practicando ${b.nombre.toLowerCase()}: en la ficha tenés los errores comunes y cómo detectarlos.`)
            window.scrollTo(0, 0)
            void recargar()
          }}
        />
      ))}
      <p className={estilos.chico}>Si tenés profesor, pedile que mire tu técnica: vale más que el video. El video queda en tu galería; la app no lo guarda.</p>
    </div>
  )
}
