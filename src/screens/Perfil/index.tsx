import { Icono } from '../../components/Icono'
import { Proximamente } from '../../components/Proximamente'
import { Tarjeta, estilos } from '../../components/ui'
import { Respaldo } from './Respaldo'

export function Perfil() {
  return (
    <>
      <h1 className="titulo-pantalla">Perfil</h1>

      <Proximamente
        entrega="próxima actualización"
        items={[
          'Tus datos básicos y tus objetivos (repartiendo 100 puntos).',
          'Tus lugares de entrenamiento y el equipo que tenés en cada uno.',
          'Tu semana: horarios fijos y huecos libres.',
          'Salud y limitaciones (por ejemplo, la muñeca).',
        ]}
      />

      <Respaldo />

      <Tarjeta>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--done)' }}>
          <Icono nombre="escudo" />
          <p className="etiqueta" style={{ color: 'var(--done)' }}>
            Privacidad
          </p>
        </div>
        <p className={estilos.texto2}>
          La app no tiene servidores ni cuentas. Nada de lo que cargás sale de este celular, salvo que vos hagas un
          respaldo y lo guardes en otro lado.
        </p>
        <p className={estilos.chico}>Nivel Físico Real · versión {__VERSION_APP__}</p>
      </Tarjeta>
    </>
  )
}
