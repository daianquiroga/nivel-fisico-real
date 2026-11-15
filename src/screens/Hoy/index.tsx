import { Link } from 'react-router-dom'
import { Aviso, Tarjeta, estilos } from '../../components/ui'
import { diasSinFumar, formatoPesos, plataAhorrada } from '../../lib/fumar'
import { LIMITACIONES } from '../../lib/perfil'
import { usarInicio } from '../../lib/usarInicio'
import s from './hoy.module.css'

function fechaDeHoy(): string {
  const texto = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function Hoy() {
  const { cargado, perfil } = usarInicio()
  if (!cargado) return null
  const listo = Boolean(perfil?.inicioCompleto)
  const fumar = perfil?.fumar
  const dias = fumar?.activo && fumar.fechaDejo ? diasSinFumar(fumar.fechaDejo) : null
  const ahorro = dias !== null && fumar?.precioAtado ? plataAhorrada(dias, fumar.precioAtado, fumar.atadosPorDia ?? 1) : null
  const limitaciones = (perfil?.limitaciones ?? []).map((l) => LIMITACIONES.find((x) => x.valor === l)?.texto ?? l)

  return (
    <>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className={estilos.chico}>{fechaDeHoy()}</span>
        <h1 className="titulo-pantalla">Hoy</h1>
      </header>

      {listo && dias !== null && (
        <div className={s.chips}>
          <span className={s.chip}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--done)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z" />
              <path d="M2 21c0-3 1.9-5.4 5-6" />
            </svg>
            {dias} {dias === 1 ? 'día' : 'días'} sin fumar
          </span>
          {ahorro !== null && <span className={s.chip}>{formatoPesos(ahorro)} ahorrados</span>}
        </div>
      )}

      {!listo ? (
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Para empezar
          </p>
          <h2 className={s.tituloTarjeta}>Configurá tu app</h2>
          <p className={estilos.texto2}>
            En 3 a 5 minutos: tus datos, tus objetivos, dónde entrenás, tus horarios y tu salud. Con eso la app se arma para vos.
          </p>
          <Link to="/inicio" className={s.botonPrincipal}>
            Empezar
          </Link>
        </Tarjeta>
      ) : (
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Próximo paso
          </p>
          <h2 className={s.tituloTarjeta}>Tu evaluación inicial</h2>
          <p className={estilos.texto2}>
            En unos 40 minutos y en tu habitación vas a saber tu condición física, tu edad física y tu nivel en cada área. Llega en la
            próxima actualización de la app.
          </p>
        </Tarjeta>
      )}

      {listo && perfil?.salud && !perfil.salud.apto && (
        <Aviso tipo="error">
          Por tus respuestas de salud, consultá a un médico antes de las pruebas de esfuerzo. Las mediciones en reposo las podés hacer igual.
        </Aviso>
      )}

      {listo && limitaciones.length > 0 && (
        <Tarjeta>
          <p className="etiqueta">Te vamos a cuidar</p>
          <p className={estilos.texto2}>
            Marcaste molestias en: {limitaciones.join(', ').toLowerCase()}. El plan va a cambiar los ejercicios que cargan esas zonas.
          </p>
        </Tarjeta>
      )}

      {listo && (
        <Tarjeta>
          <p className="etiqueta">Tus datos</p>
          <p className={estilos.texto2}>
            Podés cambiar tus objetivos, lugares y horarios cuando quieras desde <Link to="/perfil">Perfil</Link>.
          </p>
        </Tarjeta>
      )}
    </>
  )
}
