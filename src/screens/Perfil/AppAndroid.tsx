import { useEffect, useState } from 'react'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { abrirAjustesHC, esAndroidWeb, esNativo, leerAvisosActivos, leerEstadoHC, programarAvisos, urlApk, type EstadoHC } from '../../lib/nativo'
import { leerPlan } from '../../lib/plan/usarPlan'
import s from '../Ejercicios/ejercicios.module.css'

/** En la app de Android: estado de Health Connect y avisos. En Chrome de Android: cómo instalar la app. */
export function AppAndroid() {
  const nativo = esNativo()
  const [hc, setHc] = useState<EstadoHC | null>(null)
  const [avisos, setAvisos] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  useEffect(() => {
    if (!nativo) return
    void leerEstadoHC().then(setHc)
    void leerAvisosActivos().then(setAvisos)
  }, [nativo])

  if (!nativo) {
    const url = urlApk()
    if (!esAndroidWeb() || !url) return null
    return (
      <Tarjeta>
        <p className="etiqueta">App de Android</p>
        <p className={estilos.texto2}>Con la app de Android los pasos se cargan solos desde Health Connect y te llegan avisos antes de cada sesión, sin internet.</p>
        <ol className={s.seccion}>
          <li>
            <b>Antes, hacé un respaldo</b> (arriba, en Respaldo → Guardar archivo): la app de Android empieza vacía y ahí lo restaurás.
          </li>
          <li>Tocá el botón para bajar el archivo de la app.</li>
          <li>Abrilo desde la notificación de descarga. Si Android pregunta, permití "instalar apps de esta fuente" para Chrome.</li>
          <li>Abrí la app nueva, andá a Perfil → Restaurar y elegí el respaldo.</li>
        </ol>
        <a className={estilos.boton} href={url}>
          Bajar la app de Android
        </a>
        <p className={estilos.chico}>Instalala solo desde este botón. No está en Google Play porque es tu app personal.</p>
      </Tarjeta>
    )
  }

  async function cambiarAvisos(activar: boolean) {
    const r = await programarAvisos(await leerPlan(), activar)
    if (r === 'sin-permiso') {
      setAvisos(false)
      setMensaje('No diste permiso para los avisos. Podés darlo desde los ajustes de Android → Apps → Nivel Físico Real → Notificaciones.')
    } else {
      setAvisos(activar)
      setMensaje(activar ? (r === 0 ? 'Activados. Cuando tu plan tenga sesiones con horario, te van a llegar.' : `Listo: ${r} avisos por semana, 15 minutos antes de cada sesión.`) : 'Avisos apagados.')
    }
  }

  return (
    <Tarjeta>
      <p className="etiqueta">App de Android</p>
      <p className={estilos.texto2}>Health Connect: {hc?.activo ? 'conectado, la app lee tus pasos y la distancia.' : 'sin conectar. Conectalo desde Hoy → Pasos de hoy.'}</p>
      {hc?.activo && <Boton onClick={() => void abrirAjustesHC()}>Ajustes de Health Connect</Boton>}
      <label className={s.interruptor}>
        <input type="checkbox" checked={avisos} onChange={(ev) => void cambiarAvisos(ev.target.checked)} />
        Avisarme 15 minutos antes de cada sesión
      </label>
      {mensaje && <p className={estilos.chico}>{mensaje}</p>}
    </Tarjeta>
  )
}
