import { Proximamente } from '../../components/Proximamente'

export function Plan() {
  return (
    <>
      <h1 className="titulo-pantalla">Mi semana</h1>
      <Proximamente
        entrega="entrega 3"
        items={[
          'Tu agenda hora por hora, con tus horarios fijos y tus huecos libres.',
          'Plan armado automáticamente y editable día a día.',
          'Microsesiones de 5 a 10 minutos para los días complicados.',
          'Avisos si algo no encaja: dos días fuertes seguidos, poco sueño, entrenar muy tarde.',
        ]}
      />
    </>
  )
}
