import { Link } from 'react-router-dom'
import { Proximamente } from '../../components/Proximamente'
import { TiposDeCuerpo } from '../../content/ilustraciones'
import s from '../Ejercicios/ejercicios.module.css'
import { Biblioteca } from '../Ejercicios/Biblioteca'

export function Aprender() {
  return (
    <>
      <h1 className="titulo-pantalla">Aprender</h1>
      <Link to="/tipo-cuerpo" className={s.item}>
        <TiposDeCuerpo />
        <span className={s.itemNombre}>Tipos de cuerpo: ectomorfo, mesomorfo y endomorfo</span>
        <span className={s.itemDetalle}>Cuál es el tuyo, cómo medirlo y cómo entrenar con él</span>
      </Link>
      <p className="etiqueta">Ejercicios</p>
      <Biblioteca />
      <Proximamente
        entrega="entrega 5"
        items={[
          'Guías por nivel: tu cuerpo, entrenamiento, comida, salud, mente y hábitos.',
          'Cómo caminar, correr, saltar la soga y respirar mejor.',
          'Un coach que funciona sin internet y se adapta a tu nivel.',
        ]}
      />
    </>
  )
}
