import { Link } from 'react-router-dom'
import { Tarjeta, estilos } from '../../components/ui'

function fechaDeHoy(): string {
  const texto = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function Hoy() {
  return (
    <>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className={estilos.chico}>{fechaDeHoy()}</span>
        <h1 className="titulo-pantalla">Hoy</h1>
      </header>

      <Tarjeta destacada>
        <p className="etiqueta" style={{ color: 'var(--accent)' }}>
          Primer paso
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, margin: 0 }}>
          Tu evaluación inicial
        </h2>
        <p className={estilos.texto2}>
          En unos 40 minutos y en tu habitación vas a saber tu condición física, tu edad física y tu nivel en cada área.
          Llega en la próxima actualización de la app.
        </p>
      </Tarjeta>

      <Tarjeta>
        <p className="etiqueta">Mientras tanto</p>
        <p className={estilos.texto2}>
          Instalá la app en tu pantalla de inicio y probá el respaldo de datos en{' '}
          <Link to="/perfil">Perfil</Link>. Tus datos quedan guardados solo en este celular.
        </p>
      </Tarjeta>
    </>
  )
}
