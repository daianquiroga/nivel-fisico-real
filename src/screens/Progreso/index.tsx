import { Proximamente } from '../../components/Proximamente'

export function Progreso() {
  return (
    <>
      <h1 className="titulo-pantalla">Nivel físico real</h1>
      <Proximamente
        entrega="próxima actualización"
        items={[
          'Tu condición física de 0 a 100 comparada con gente de tu edad.',
          'Tu edad física estimada.',
          'Tu nivel del 1 al 5 en cardio, fuerza, movilidad, equilibrio y composición.',
          'El historial de cada evaluación con gráficos.',
        ]}
      />
    </>
  )
}
