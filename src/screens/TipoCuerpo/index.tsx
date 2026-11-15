import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Stepper } from '../../components/controles'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { PuntosSomatotipo, TiposDeCuerpo } from '../../content/ilustraciones'
import contenido from '../../content/tipos-cuerpo.json'
import { endomorfia, linealidad, mesomorfia, type Tendencia } from '../../lib/calc/tipoCuerpo'
import { ejercicio } from '../../lib/ejercicios'
import { guardarSomatotipo, usarTipoCuerpo } from '../../lib/usarTipoCuerpo'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'

const TIPOS = contenido.tipos as Record<Tendencia, (typeof contenido.tipos)['mixto']>
const coma = (x: number) => x.toFixed(1).replace('.', ',')

const INICIALES: Record<string, number> = {
  triceps: 12,
  subescapular: 14,
  supraespinal: 10,
  pantorrillaP: 10,
  brazo: 32,
  pantorrilla: 37,
  humero: 6.8,
  femur: 9.5,
}

function Medicion({ alturaInicial, pesoInicial, onListo }: { alturaInicial: number; pesoInicial: number; onListo: () => void }) {
  const [m, setM] = useState<Record<string, number>>({ ...INICIALES, altura: alturaInicial, peso: pesoInicial })
  const cambiar = (k: string, v: number) => setM((x) => ({ ...x, [k]: v }))
  const pliegue = (id: string) => ['triceps', 'subescapular', 'supraespinal', 'pantorrillaP'].includes(id)
  const hueso = (id: string) => ['humero', 'femur'].includes(id)

  async function calcular() {
    const endo = endomorfia(m.triceps + m.subescapular + m.supraespinal, m.altura)
    const meso = mesomorfia({
      alturaCm: m.altura,
      humeroCm: m.humero,
      femurCm: m.femur,
      brazoCm: m.brazo,
      pantorrillaCm: m.pantorrilla,
      pliegueTricepsMm: m.triceps,
      plieguePantorrillaMm: m.pantorrillaP,
    })
    const ecto = linealidad(m.altura, m.peso)
    await guardarSomatotipo({ fecha: new Date().toISOString(), medidas: m, endo, meso, ecto })
    onListo()
  }

  return (
    <Tarjeta>
      <p className="etiqueta">Medición completa (Heath-Carter)</p>
      <p className={estilos.texto2}>{contenido.medicion.materiales}</p>
      <div className={e.dibujo}>
        <PuntosSomatotipo />
      </div>
      <ul className={s.seccion}>
        {contenido.medicion.consejos.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <Stepper etiqueta="Altura" valor={m.altura} min={120} max={220} paso={0.5} unidad="cm" onCambio={(v) => cambiar('altura', v)} />
      <Stepper etiqueta="Peso" valor={m.peso} min={35} max={200} paso={0.5} unidad="kg" onCambio={(v) => cambiar('peso', v)} />
      {contenido.medicion.puntos.map((p, i) => (
        <div key={p.id}>
          <Stepper
            etiqueta={`${i + 1}. ${p.nombre}`}
            valor={m[p.id]}
            min={pliegue(p.id) ? 2 : hueso(p.id) ? 4 : 15}
            max={pliegue(p.id) ? 60 : hueso(p.id) ? 14 : 70}
            paso={pliegue(p.id) ? 1 : hueso(p.id) ? 0.1 : 0.5}
            unidad={pliegue(p.id) ? 'mm' : 'cm'}
            onCambio={(v) => cambiar(p.id, v)}
          />
          <p className={estilos.chico}>{p.como}</p>
        </div>
      ))}
      <Boton variante="principal" ancho onClick={() => void calcular()}>
        Calcular mi somatotipo
      </Boton>
    </Tarjeta>
  )
}

export function TipoCuerpo() {
  const navegar = useNavigate()
  const { perfil } = usarInicio()
  const { estado, recargar } = usarTipoCuerpo()
  const [midiendo, setMidiendo] = useState(false)
  if (!estado) return null
  const tipo = estado.tipo
  const info = tipo ? TIPOS[tipo] : undefined

  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      </div>
      <header>
        <h1 className={e.titulo}>Tipo de cuerpo</h1>
        <p className={e.para}>{contenido.intro}</p>
      </header>

      <Tarjeta destacada={Boolean(tipo)}>
        <div className={e.dibujo}>
          <TiposDeCuerpo activa={tipo} />
        </div>
        {info ? (
          <>
            <p className="etiqueta" style={{ color: 'var(--accent)' }}>
              Tu tipo {estado.fuente === 'completo' ? '(medición completa)' : '(estimación casera)'}
            </p>
            <h2 className={e.titulo} style={{ fontSize: 30 }}>
              {estado.completo ? estado.completo.categoria : info.nombre}
            </h2>
            {estado.completo && (
              <p className={estilos.texto2}>
                Somatotipo {coma(estado.completo.endo)} – {coma(estado.completo.meso)} – {coma(estado.completo.ecto)} (grasa – músculo y hueso –
                linealidad)
              </p>
            )}
            <p className={estilos.texto2}>{info.descripcion}</p>
            {estado.fuente === 'casero' && (
              <p className={estilos.chico}>
                Sale de tu altura, peso y cintura. Es una estimación: para los tres números exactos, hacé la medición completa de abajo.
              </p>
            )}
          </>
        ) : (
          <>
            <p className={estilos.texto2}>Todavía no sabemos tu tipo. Hay dos formas de averiguarlo:</p>
            <ol className={s.seccion}>
              <li>
                <b>Estimación casera:</b> en la evaluación, en "Altura y cintura", marcá "Sumar peso y muñeca".
              </li>
              <li>
                <b>Medición completa:</b> con plicómetro y cinta, abajo.
              </li>
            </ol>
            <Link to="/evaluacion" className={estilos.boton}>
              Ir a la evaluación
            </Link>
          </>
        )}
      </Tarjeta>

      {info && (
        <Tarjeta>
          <p className="etiqueta">Cómo entrenar con tu tipo</p>
          <ul className={s.seccion}>
            {info.enfoque.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="etiqueta" style={{ marginTop: 6 }}>
            Ejercicios base para vos
          </p>
          <div className={s.lista}>
            {info.ejercicios.map((id) => {
              const x = ejercicio(id)
              return x ? (
                <Link key={id} to={`/ejercicio/${id}`} className={s.item} style={{ minHeight: 52 }}>
                  <span className={s.itemNombre}>{x.nombre}</span>
                  <span className={s.itemDetalle}>{x.principal.join(', ')}</span>
                </Link>
              ) : null
            })}
          </div>
          <p className={estilos.chico}>En la biblioteca aparecen marcados como "Base para tu tipo". El plan (próxima etapa) los va a priorizar.</p>
        </Tarjeta>
      )}

      <Tarjeta>
        <p className="etiqueta">Cómo reconocer cada tipo</p>
        {(['ectomorfo', 'mesomorfo', 'endomorfo'] as Tendencia[]).map((t) => (
          <details key={t} className={s.detalle} open={t === tipo}>
            <summary>
              {TIPOS[t].nombre} · {TIPOS[t].corto.toLowerCase()}
            </summary>
            <p className={estilos.texto2}>{TIPOS[t].descripcion}</p>
            <ul className={s.seccion}>
              {TIPOS[t].reconocer.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        ))}
        <p className={estilos.chico}>Mirarse sirve para orientarse, pero engaña: la ropa, la postura y la luz cambian mucho. Los números son más confiables.</p>
      </Tarjeta>

      {midiendo ? (
        <Medicion
          alturaInicial={estado.alturaCm ?? perfil?.alturaCm ?? 170}
          pesoInicial={estado.pesoKg ?? perfil?.pesoKg ?? 70}
          onListo={() => {
            setMidiendo(false)
            void recargar()
            window.scrollTo(0, 0)
          }}
        />
      ) : (
        <Boton ancho onClick={() => setMidiendo(true)}>
          {estado.completo ? 'Volver a medir (completo)' : 'Hacer la medición completa'}
        </Boton>
      )}

      <Aviso tipo="ok">{contenido.ciencia}</Aviso>
      <p className={estilos.chico}>Fuentes: {contenido.fuente}</p>
    </div>
  )
}

