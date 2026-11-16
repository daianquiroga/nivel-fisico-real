import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Tarjeta, estilos } from '../../components/ui'
import { diasSinFumar, formatoPesos, plataAhorrada } from '../../lib/fumar'
import { LIMITACIONES, TIPOS_LUGAR, diaDeHoy, tipoDeLugar } from '../../lib/perfil'
import { nivelPorPercentil } from '../../lib/calc/puntajes'
import type { Resultados } from '../../lib/evaluacion'
import { diasParaProxima, usarEvaluaciones } from '../../lib/usarEvaluaciones'
import { usarPlan } from '../../lib/plan/usarPlan'
import { ControlDiario } from './ControlDiario'
import { Coach, type CoachRef } from './Coach'
import { Pasos } from './Pasos'
import { TuDia } from './TuDia'
import { Constancia } from './Constancia'
import { Actividad, Agua } from './Actividad'
import { usarInicio } from '../../lib/usarInicio'
import { leerEstadoActualizacion, olvidarActualizada, type EstadoActualizacion } from '../../lib/actualizarNativo'
import s from './hoy.module.css'

function fechaDeHoy(): string {
  const texto = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function Hoy() {
  const { cargado, perfil, semana, lugares } = usarInicio()
  const evaluaciones = usarEvaluaciones()
  const { plan } = usarPlan()
  const coach = useRef<CoachRef>(null)
  const [act, setAct] = useState<EstadoActualizacion>({})
  const [mas, setMas] = useState(() => {
    try {
      return localStorage.getItem('hoy-ver-mas') === '1'
    } catch {
      return false
    }
  })
  const guardarMas = (v: boolean) => {
    setMas(v)
    try {
      localStorage.setItem('hoy-ver-mas', v ? '1' : '0')
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }
  useEffect(() => {
    void leerEstadoActualizacion().then((e) => {
      setAct(e)
      if (e.actualizadaDesde) void olvidarActualizada()
    })
  }, [])
  if (!cargado || evaluaciones === null) return null
  const ultima = evaluaciones[evaluaciones.length - 1]
  const res = ultima?.resultados as Resultados | undefined
  const faltan = ultima ? diasParaProxima(ultima.fecha) : 0
  const listo = Boolean(perfil?.inicioCompleto)
  const fumar = perfil?.fumar
  const dias = fumar?.activo && fumar.fechaDejo ? diasSinFumar(fumar.fechaDejo) : null
  const ahorro = dias !== null && fumar?.precioAtado ? plataAhorrada(dias, fumar.precioAtado, fumar.atadosPorDia ?? 1) : null
  const lugaresHoy = semana?.lugaresPorDia[diaDeHoy()] ?? []
  const textoLugares = lugaresHoy
    .map((n) => {
      const l = lugares.find((x) => x.nombre === n)
      const tipo = l ? TIPOS_LUGAR.find((t) => t.valor === tipoDeLugar(l))?.texto : undefined
      return tipo && tipo.toLowerCase() !== n.toLowerCase() ? `${n} (${tipo.toLowerCase()})` : n
    })
    .join(' y ')
  const limitaciones = (perfil?.limitaciones ?? []).map((l) => LIMITACIONES.find((x) => x.valor === l)?.texto ?? l)

  return (
    <>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className={estilos.chico}>{fechaDeHoy()}</span>
        <h1 className="titulo-pantalla">Hoy</h1>
      </header>

      {act.actualizadaDesde && <Aviso tipo="ok">¡La app se actualizó sola a la versión {__VERSION_APP__}! Tus datos siguen igual.</Aviso>}

      {act.apkNueva && (
        <Aviso tipo="error">
          Hay una versión nueva ({act.apkNueva}) que necesita instalar la app una vez más. {act.apkUrl && <a href={act.apkUrl}>Bajar la app</a>}
        </Aviso>
      )}

      {!listo && (
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Para empezar
          </p>
          <h2 className={s.tituloTarjeta}>Configurá tu app</h2>
          <p className={estilos.texto2}>Unas preguntas simples (3 a 5 minutos) y la app se arma para vos.</p>
          <Link to="/inicio" className={s.botonPrincipal}>
            Empezar
          </Link>
        </Tarjeta>
      )}

      {listo && perfil?.salud && !perfil.salud.apto && (
        <Aviso tipo="error">Por tus respuestas de salud, consultá a un médico antes de las pruebas de esfuerzo.</Aviso>
      )}

      {listo && plan === null && (
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Próximo paso
          </p>
          <h2 className={s.tituloTarjeta}>Armá tu rutina</h2>
          <p className={estilos.texto2}>Te hago 4 preguntas y te propongo una rutina para tu semana.</p>
          <Link to="/plan/asistente" className={s.botonPrincipal}>
            Armar mi rutina
          </Link>
        </Tarjeta>
      )}

      {listo && plan && (() => {
        const sesiones = plan.dias[diaDeHoy()].sesiones
        const i = sesiones.findIndex((x) => x.ejercicios.length > 0 && !x.titulo.includes('opcional'))
        const ses = i >= 0 ? sesiones[i] : undefined
        return (
          <Tarjeta destacada={Boolean(ses)}>
            <p className="etiqueta" style={{ color: ses ? 'var(--accent)' : undefined }}>
              Hoy te toca
            </p>
            <h2 className={s.tituloTarjeta}>{ses ? ses.titulo : 'Descanso'}</h2>
            <p className={estilos.texto2}>
              {ses
                ? [ses.desde, ses.lugar ?? textoLugares, `${ses.minutos} min`, `${ses.ejercicios.length} ejercicios`].filter(Boolean).join(' · ')
                : 'Hoy no hay entrenamiento. Caminar un rato y dormir bien también suma.'}
            </p>
            {ses && (
              <Link to={`/entrenar/${diaDeHoy()}/${i}`} className={s.botonPrincipal}>
                Entrenar
              </Link>
            )}
            <Link to={`/plan?dia=${diaDeHoy()}`} className={estilos.boton}>
              {ses ? 'Ver los ejercicios' : 'Ver mi semana'}
            </Link>
            {sesiones
              .map((x, j) => ({ x, j }))
              .filter(({ x, j }) => j !== i && x.ejercicios.length > 0 && !x.titulo.includes('opcional'))
              .map(({ x, j }) => (
                <Link key={x.id} to={`/entrenar/${diaDeHoy()}/${j}`} className={estilos.boton}>
                  También hoy: {x.titulo}
                  {x.desde ? ` · ${x.desde}` : ''}
                </Link>
              ))}
          </Tarjeta>
        )
      })()}

      {listo && !ultima && (
        <Link to="/evaluacion" className={estilos.boton}>
          Medir mi estado físico (15 a 40 min)
        </Link>
      )}

      {listo && dias !== null && (
        <div className={s.chips}>
          <span className={s.chip}>
            {dias} {dias === 1 ? 'día' : 'días'} sin fumar
          </span>
          <Link to="/ganas" className={s.chip} style={{ borderColor: 'var(--accent)', color: 'var(--text)', textDecoration: 'none' }}>
            Tengo ganas de fumar
          </Link>
        </div>
      )}

      {listo && <ControlDiario semana={semana} onCambio={() => coach.current?.recargar()} />}

      {listo && <Coach ref={coach} />}

      {listo && (
        <button type="button" className={estilos.boton} aria-expanded={mas} onClick={() => guardarMas(!mas)}>
          {mas ? 'Ver menos' : 'Ver más: nivel, racha, pasos, agua y tu día'}
        </button>
      )}

      {listo && mas && (
        <>
          {ultima && (
            <Tarjeta>
              <p className="etiqueta" style={{ color: 'var(--done)' }}>
                Tu nivel
              </p>
              <h2 className={s.tituloTarjeta}>
                {res?.condicion !== undefined ? `${Math.round(res.condicion)} / 100 · ${nivelPorPercentil(res.condicion).nombre}` : 'Evaluación guardada'}
              </h2>
              <p className={estilos.texto2}>
                {res?.edadFisica !== undefined ? `Edad física: ${Math.round(res.edadFisica)} años. ` : ''}
                {faltan > 0 ? `Próxima evaluación en ${faltan} ${faltan === 1 ? 'día' : 'días'}.` : 'Ya toca repetir la evaluación.'}
              </p>
              <Link to={faltan > 0 ? '/progreso' : '/evaluacion'} className={estilos.boton}>
                {faltan > 0 ? 'Ver mis resultados' : 'Evaluarme otra vez'}
              </Link>
            </Tarjeta>
          )}

          {(perfil?.objetivos?.combate ?? 0) >= 10 && (
            <Link to="/combate" className={estilos.boton}>
              Combate: sombra, juego de pies y técnicas
            </Link>
          )}

          {plan && <Constancia plan={plan} />}

          <Pasos edad={perfil?.edad ?? 30} />

          <Actividad pesoKg={perfil?.pesoKg ?? (ultima?.datos as { pesoKg?: number } | undefined)?.pesoKg} />

          <Agua sexo={perfil?.sexo ?? 'h'} />

          {semana && plan !== undefined && <TuDia semana={semana} plan={plan} />}

          {ahorro !== null && <p className={estilos.chico}>Llevás {formatoPesos(ahorro)} ahorrados sin fumar.</p>}

          {limitaciones.length > 0 && (
            <p className={estilos.chico}>Cuidamos tus molestias en: {limitaciones.join(', ').toLowerCase()}. El plan evita ejercicios que carguen esas zonas.</p>
          )}

          <p className={estilos.chico}>
            Tus objetivos, lugares y horarios se cambian desde <Link to="/perfil">Perfil</Link>.
          </p>
        </>
      )}
    </>
  )
}
