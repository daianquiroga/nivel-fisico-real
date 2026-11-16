import { estilos } from './ui'
import x from '../screens/Ejercicios/ejercicios.module.css'

/** Escala de esfuerzo de la sesión (CR-10 de Borg, simplificada). */
export const TEXTOS_ESFUERZO = ['Muy fácil', 'Muy fácil', 'Fácil', 'Fácil', 'Moderado', 'Moderado', 'Duro', 'Duro', 'Muy duro', 'Máximo']

/** "¿Qué tan dura fue?" del 1 al 10, con botones grandes. */
export function Esfuerzo({ valor, onCambio }: { valor: number | null; onCambio: (n: number) => void }) {
  return (
    <>
      <p className="etiqueta">¿Qué tan dura fue? (1 a 10)</p>
      <div className={x.rir} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }} role="radiogroup" aria-label="Esfuerzo">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" role="radio" aria-checked={valor === n} className={`${x.filtro} ${valor === n ? x.filtroOn : ''}`} onClick={() => onCambio(n)}>
            {n}
          </button>
        ))}
      </div>
      <p className={estilos.chico}>{valor ? TEXTOS_ESFUERZO[valor - 1] : 'Pensá en toda la sesión, no en el último round. Sirve para medir tu carga de la semana.'}</p>
    </>
  )
}
