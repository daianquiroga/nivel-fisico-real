import { Link } from 'react-router-dom'
import { Icono } from '../../components/Icono'
import { Tarjeta, estilos } from '../../components/ui'
import { LIMITACIONES, OBJETIVOS } from '../../lib/perfil'
import { usarInicio } from '../../lib/usarInicio'
import s from '../Hoy/hoy.module.css'
import { Respaldo } from './Respaldo'

export function Perfil() {
  const { cargado, perfil, lugares } = usarInicio()
  if (!cargado) return null
  const listo = Boolean(perfil?.inicioCompleto)

  return (
    <>
      <h1 className="titulo-pantalla">Perfil</h1>

      <Tarjeta>
        <p className="etiqueta">Tus datos</p>
        {listo && perfil ? (
          <>
            <p className={estilos.texto2}>
              {perfil.sexo === 'h' ? 'Hombre' : 'Mujer'}, {perfil.edad} años, {perfil.alturaCm} cm
              {perfil.pesoKg ? `, ${String(perfil.pesoKg).replace('.', ',')} kg` : ''}.
            </p>
            {perfil.objetivos && (
              <p className={estilos.texto2}>
                Objetivos:{' '}
                {OBJETIVOS.map((o) => `${o.nombre.toLowerCase()} ${perfil.objetivos![o.clave]}`).join(' · ')}
              </p>
            )}
            <p className={estilos.texto2}>Lugares: {lugares.map((l) => l.nombre).join(', ') || 'ninguno'}.</p>
            {(perfil.limitaciones?.length ?? 0) > 0 && (
              <p className={estilos.texto2}>
                Cuidar: {perfil.limitaciones!.map((l) => LIMITACIONES.find((x) => x.valor === l)?.texto ?? l).join(', ').toLowerCase()}.
              </p>
            )}
          </>
        ) : (
          <p className={estilos.texto2}>Todavía no configuraste la app.</p>
        )}
        <Link to="/inicio" className={listo ? estilos.boton : s.botonPrincipal}>
          {listo ? 'Editar mis datos' : 'Configurar ahora'}
        </Link>
      </Tarjeta>

      <Respaldo />

      <Tarjeta>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--done)' }}>
          <Icono nombre="escudo" />
          <p className="etiqueta" style={{ color: 'var(--done)' }}>
            Privacidad
          </p>
        </div>
        <p className={estilos.texto2}>
          La app no tiene servidores ni cuentas. Nada de lo que cargás sale de este celular, salvo que vos hagas un respaldo y lo guardes en
          otro lado.
        </p>
        <p className={estilos.chico}>Nivel Físico Real · versión {__VERSION_APP__}</p>
      </Tarjeta>
    </>
  )
}
