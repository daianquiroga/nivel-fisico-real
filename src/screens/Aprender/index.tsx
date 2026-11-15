import { Proximamente } from '../../components/Proximamente'
import { Biblioteca } from '../Ejercicios/Biblioteca'

export function Aprender() {
  return (
    <>
      <h1 className="titulo-pantalla">Aprender</h1>
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
