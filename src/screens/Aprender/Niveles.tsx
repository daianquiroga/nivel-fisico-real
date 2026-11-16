import { NIVELES_LECTURA, type NivelLectura } from '../../lib/aprender'
import s from '../Ejercicios/ejercicios.module.css'

export function Niveles({ nivel, sugerido, elegir }: { nivel: NivelLectura; sugerido: NivelLectura; elegir: (n: NivelLectura) => void }) {
  return (
    <div className={s.filtros} role="group" aria-label="Nivel de lectura (la estrella marca tu nivel según la evaluación)">
      {NIVELES_LECTURA.map((n) => (
        <button
          key={n.valor}
          type="button"
          className={`${s.filtro} ${nivel === n.valor ? s.filtroOn : ''}`}
          aria-pressed={nivel === n.valor}
          onClick={() => elegir(n.valor)}
        >
          {n.texto}
          {n.valor === sugerido ? ' ★' : ''}
        </button>
      ))}
    </div>
  )
}
