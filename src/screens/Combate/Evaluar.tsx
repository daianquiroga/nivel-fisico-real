import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoGuardia } from '../../content/dibujos-combate'
import { CRITERIOS_GENERALES, NIVELES_SOMBRA, aprueba, criteriosDe, disciplina } from '../../lib/combate'
import { guardarTipo } from '../../lib/diario'
import { fechaLocal } from '../../lib/plan/sesion'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import { Volver, usarCombate } from './comun'

export function EvaluarSombra() {
  const { estado, recargar, disciplina: disc, nivelSombra } = usarCombate()
  const [marcas, setMarcas] = useState<boolean[]>(Array(8).fill(false))
  const [resultado, setResultado] = useState<{ aprobado: boolean; faltan: string[]; nivel: number } | null>(null)
  if (!estado) return null
  const d = disciplina(disc)!
  const nivel = NIVELES_SOMBRA[Math.min(nivelSombra, NIVELES_SOMBRA.length - 1)]
  const criterios = criteriosDe(disc)

  async function guardar() {
    const ok = aprueba(marcas)
    await guardarTipo('sombra', fechaLocal(), { fecha: new Date().toISOString(), disciplina: disc, nivel: nivel.nivel, criterios: marcas, aprobado: ok })
    setResultado({ aprobado: ok, faltan: criterios.filter((_, i) => !marcas[i]), nivel: nivel.nivel })
    setMarcas(Array(8).fill(false))
    await recargar()
  }

  if (resultado) {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>{resultado.aprobado ? `¡Aprobaste el nivel ${resultado.nivel}!` : 'Casi: seguí practicando'}</h1>
        {resultado.aprobado ? (
          <Aviso tipo="ok">
            {resultado.nivel < NIVELES_SOMBRA.length ? `Ya podés pasar al nivel ${resultado.nivel + 1}: ${NIVELES_SOMBRA[resultado.nivel].nombre.toLowerCase()}.` : 'Completaste los 5 niveles de sombra.'}
          </Aviso>
        ) : (
          <Tarjeta>
            <p className="etiqueta">Para trabajar en los próximos rounds</p>
            <ul className={s.seccion}>
              {resultado.faltan.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Tarjeta>
        )}
        <Link to="/combate" className={estilos.boton}>
          Volver a Combate
        </Link>
      </div>
    )
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Sombra · {d.nombre}</p>
        <h1 className={e.titulo}>Evaluar nivel {nivel.nivel}</h1>
        <p className={e.para}>{nivel.objetivo}</p>
      </header>
      <Tarjeta>
        <DibujoGuardia />
      </Tarjeta>
      <ol className={s.seccion}>
        <li>Apoyá el celular a unos 2 metros, a la altura de la cintura, y grabate 1 minuto con la cámara (el video queda en tu galería; la app no lo guarda).</li>
        <li>Hacé sombra como pide el nivel {nivel.nivel}.</li>
        <li>Mirá el video y marcá solo lo que hiciste bien todo el minuto.</li>
      </ol>
      <p className="etiqueta">Para todas las disciplinas</p>
      {criterios.map((c, i) => (
        <div key={c}>
          {i === CRITERIOS_GENERALES.length && <p className="etiqueta">De {d.nombre.toLowerCase()}</p>}
          <label className={s.interruptor}>
            <input type="checkbox" checked={marcas[i]} onChange={(ev) => setMarcas(marcas.map((m, j) => (j === i ? ev.target.checked : m)))} />
            {c}
          </label>
        </div>
      ))}
      <p className={estilos.chico}>Se aprueba con los 8 criterios (decisión de la app). Si tenés profesor, pedile que lo mire él.</p>
      <Boton variante="principal" ancho onClick={() => void guardar()}>
        Guardar evaluación ({marcas.filter(Boolean).length} de 8)
      </Boton>
    </div>
  )
}
