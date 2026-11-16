import { Link } from 'react-router-dom'
import { Aviso, Tarjeta, estilos } from '../../components/ui'
import { diasSinFumar, formatoPesos, plataAhorrada } from '../../lib/fumar'
import { LIMITACIONES, TIPOS_LUGAR, diaDeHoy, tipoDeLugar } from '../../lib/perfil'
import { nivelPorPercentil } from '../../lib/calc/puntajes'
import type { Resultados } from '../../lib/evaluacion'
import { diasParaProxima, usarEvaluaciones } from '../../lib/usarEvaluaciones'
import { usarPlan } from '../../lib/plan/usarPlan'
import { ControlDiario } from './ControlDiario'
import { Pasos } from './Pasos'
import { TuDia } from './TuDia'
import { Actividad, Agua } from './Actividad'
import { usarInicio } from '../../lib/usarInicio'
import s from './hoy.module.css'

function fechaDeHoy(): string {
  const texto = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function Hoy() {
  const { cargado, perfil, semana, lugares } = usarInicio()
  const evaluaciones = usarEvaluaciones()
  const { plan } = usarPlan()
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

      {listo && (
        <div className={s.chips}>
          <span className={s.chip}>{lugaresHoy.length ? `Hoy entrenás en ${textoLugares}` : 'Hoy es día de descanso'}</span>
        </div>
      )}

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
          {!ultima ? (
            <>
              <p className="etiqueta" style={{ color: 'var(--accent)' }}>
                Próximo paso
              </p>
              <h2 className={s.tituloTarjeta}>Tu evaluación inicial</h2>
              <p className={estilos.texto2}>
                En tu habitación, sin equipos: vas a saber tu condición física, tu edad física y tu nivel en cada área. La completa lleva unos
                40 minutos; la rápida, 15.
              </p>
              <Link to="/evaluacion" className={s.botonPrincipal}>
                Empezar evaluación
              </Link>
            </>
          ) : (
            <>
              <p className="etiqueta" style={{ color: 'var(--done)' }}>
                Tu nivel hoy
              </p>
              <h2 className={s.tituloTarjeta}>
                {res?.condicion !== undefined
                  ? `${Math.round(res.condicion)} / 100 · ${nivelPorPercentil(res.condicion).nombre}`
                  : 'Evaluación guardada'}
              </h2>
              <p className={estilos.texto2}>
                {res?.edadFisica !== undefined ? `Edad física: ${Math.round(res.edadFisica)} años. ` : ''}
                {faltan > 0 ? `Próxima evaluación en ${faltan} ${faltan === 1 ? 'día' : 'días'}.` : 'Ya toca repetir la evaluación.'}
              </p>
              <Link to={faltan > 0 ? '/progreso' : '/evaluacion'} className={s.botonPrincipal}>
                {faltan > 0 ? 'Ver mis resultados' : 'Evaluarme otra vez'}
              </Link>
            </>
          )}
        </Tarjeta>
      )}

      {listo && plan === null && (
        <Tarjeta>
          <p className="etiqueta">Tu semana</p>
          <p className={estilos.texto2}>Todavía no armaste tu plan de entrenamiento.</p>
          <Link to="/plan" className={estilos.boton}>
            Armar mi plan
          </Link>
        </Tarjeta>
      )}

      {listo && <ControlDiario semana={semana} />}


      {listo && plan && (
        <Tarjeta destacada={plan.dias[diaDeHoy()].sesiones.some((x) => x.ejercicios.length > 0 && !x.titulo.includes('opcional'))}>
          <p className="etiqueta">Hoy te toca</p>
          {plan.dias[diaDeHoy()].sesiones.map((x) => (
            <p key={x.id} className={estilos.texto2}>
              <b>{x.titulo}</b>
              {x.desde ? ` · ${x.desde}` : ''}
              {x.lugar ? ` · ${x.lugar}` : ''}
            </p>
          ))}
          {(() => {
            const i = plan.dias[diaDeHoy()].sesiones.findIndex((x) => x.ejercicios.length > 0)
            return i >= 0 ? (
              <Link to={`/entrenar/${diaDeHoy()}/${i}`} className={s.botonPrincipal}>
                Entrenar ahora
              </Link>
            ) : null
          })()}
          <Link to={`/plan?dia=${diaDeHoy()}`} className={estilos.boton}>
            Ver el plan de hoy
          </Link>
        </Tarjeta>
      )}

      {listo && <Pasos edad={perfil?.edad ?? 30} />}

      {listo && <Actividad pesoKg={perfil?.pesoKg ?? (ultima?.datos as { pesoKg?: number } | undefined)?.pesoKg} />}

      {listo && <Agua sexo={perfil?.sexo ?? 'h'} />}

      {listo && semana && plan !== undefined && <TuDia semana={semana} plan={plan} />}

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
