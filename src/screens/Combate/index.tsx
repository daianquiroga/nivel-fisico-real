import { Link } from 'react-router-dom'
import { Aviso, Tarjeta, estilos } from '../../components/ui'
import { DibujoGuardia, DibujoPies, DibujoTecnica } from '../../content/dibujos-combate'
import { DISCIPLINAS, NIVELES_PIES, NIVELES_SOMBRA, disciplina, guardarAjustesCombate, mesesCon, nivelSombra as nivelDe } from '../../lib/combate'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import h from '../Hoy/hoy.module.css'
import { Volver, usarCombate } from './comun'

export function Combate() {
  const { estado, recargar, disciplina: disc, nivelSombra, nivelPies } = usarCombate()
  if (!estado) return null
  const segunda = estado.ajustes?.segunda && estado.ajustes.segunda !== disc ? estado.ajustes.segunda : undefined
  const d2 = segunda ? disciplina(segunda) : undefined
  const nivel2 = segunda ? nivelDe(estado.sombra, segunda) : 0
  const d = disciplina(disc)!
  const sigSombra = NIVELES_SOMBRA[Math.min(nivelSombra, NIVELES_SOMBRA.length - 1)]
  const sigPies = NIVELES_PIES[Math.min(nivelPies, NIVELES_PIES.length - 1)]
  const meses = estado.ajustes ? mesesCon(estado.ajustes) : 0

  async function elegir(id: string) {
    await guardarAjustesCombate({ disciplina: id, segunda: estado?.ajustes?.segunda === id ? undefined : estado?.ajustes?.segunda, desde: estado?.ajustes?.disciplina === id ? estado.ajustes.desde : new Date().toISOString() })
    await recargar()
  }

  async function elegirSegunda(id: string | undefined) {
    await guardarAjustesCombate({ disciplina: disc, segunda: id, desde: estado?.ajustes?.desde ?? new Date().toISOString() })
    await recargar()
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Combate</h1>
        <p className={e.para}>Técnica, sombra y juego de pies para entrenar en casa, en 1 × 1 m.</p>
      </header>

      <Aviso tipo="error">Para pelear con otra persona (sparring), aprendé con un profesor en un club. Acá se entrena solo, sin contacto.</Aviso>

      <p className="etiqueta">Tu disciplina base</p>
      <div className={s.filtros} role="radiogroup" aria-label="Disciplina base">
        {DISCIPLINAS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === disc} className={`${s.filtro} ${x.id === disc ? s.filtroOn : ''}`} onClick={() => void elegir(x.id)}>
            {x.nombre}
          </button>
        ))}
      </div>
      <p className={estilos.chico}>
        {d.detalle}{' '}
        {estado.ajustes
          ? meses >= 6
            ? `Llevás ${meses} meses con esta base: si querés, ya podés sumar otra disciplina.`
            : 'Recomendación: quedate con una base de 6 a 12 meses antes de sumar otra.'
          : 'Elegí una para empezar (podés cambiarla cuando quieras).'}
      </p>

      <Tarjeta destacada>
        <p className="etiqueta">Sombra · {d.nombre}</p>
        <h2 className={h.tituloTarjeta}>{nivelSombra === 0 ? 'Empezá por el nivel 1' : `Nivel ${nivelSombra} de 5`}</h2>
        <DibujoGuardia />
        <p className={estilos.texto2}>
          {nivelSombra >= NIVELES_SOMBRA.length ? 'Completaste los 5 niveles. Seguí con rounds de reacción.' : `Ahora: nivel ${sigSombra.nivel}, ${sigSombra.nombre.toLowerCase()}. ${sigSombra.objetivo}`}
        </p>
        <Link to="/combate/rondas/sombra" className={h.botonPrincipal}>
          Hacer rounds de sombra
        </Link>
        {nivelSombra < NIVELES_SOMBRA.length && (
          <Link to="/combate/evaluar" className={estilos.boton}>
            Evaluar el nivel {sigSombra.nivel} con un video
          </Link>
        )}
      </Tarjeta>

      <div className={s.lista}>
        <Link to="/combate/voz" className={s.item}>
          <span className={s.itemNombre}>Entrenador por voz</span>
          <span className={s.itemDetalle}>Te canta combinaciones durante el round: elegís tempo, complejidad, orden y momento</span>
        </Link>
        <Link to="/combate/poder" className={s.item}>
          <span className={s.itemNombre}>Poder de pelea</span>
          <span className={s.itemDetalle}>Tu número en una escala donde 10 es una persona promedio y cerca de 100 un campeón</span>
        </Link>
        <Link to="/combate/simulador" className={s.item}>
          <span className={s.itemNombre}>Simulador</span>
          <span className={s.itemDetalle}>500 peleas contra un rival y qué te falta para ganarle</span>
        </Link>
        <Link to="/combate/reaccion" className={s.item}>
          <span className={s.itemNombre}>Contragolpes</span>
          <span className={s.itemDetalle}>Aparece un ataque y respondés con defensa y contragolpe; mide tu reacción</span>
        </Link>
      </div>

      <p className="etiqueta">Segunda disciplina (opcional)</p>
      <div className={s.filtros} role="radiogroup" aria-label="Segunda disciplina">
        <button type="button" role="radio" aria-checked={!segunda} className={`${s.filtro} ${!segunda ? s.filtroOn : ''}`} onClick={() => void elegirSegunda(undefined)}>
          Ninguna
        </button>
        {DISCIPLINAS.filter((x) => x.id !== disc).map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === segunda} className={`${s.filtro} ${x.id === segunda ? s.filtroOn : ''}`} onClick={() => void elegirSegunda(x.id)}>
            {x.nombre}
          </button>
        ))}
      </div>
      {segunda && meses < 6 && <p className={estilos.chico}>Se puede, pero lo ideal es sumarla después de 6 a 12 meses con la base. Si la sumás ahora, que sea 1 o 2 rounds por sesión.</p>}
      {d2 && (
        <Tarjeta>
          <p className="etiqueta">Sombra · {d2.nombre}</p>
          <h2 className={h.tituloTarjeta}>{nivel2 === 0 ? 'Empezá por el nivel 1' : `Nivel ${nivel2} de 5`}</h2>
          {segunda === 'lucha' && <DibujoTecnica id="escape-cadera" />}
          <p className={estilos.texto2}>
            {segunda === 'lucha'
              ? 'Rounds de movimiento de suelo: camarón, puente, levantarte y sprawl. Necesitás unos 2 × 1 m o un colchón finito.'
              : `Ahora: nivel ${Math.min(nivel2 + 1, 5)}. Hacé 1 o 2 rounds al final de tu sombra.`}
          </p>
          <Link to={`/combate/rondas/sombra?d=${segunda}`} className={estilos.boton}>
            {segunda === 'lucha' ? 'Hacer rounds de suelo' : `Hacer rounds de ${d2.nombre.split(':')[0].toLowerCase()}`}
          </Link>
          {nivel2 < 5 && (
            <Link to={`/combate/evaluar?d=${segunda}`} className={estilos.boton}>
              Evaluar el nivel {nivel2 + 1}
            </Link>
          )}
        </Tarjeta>
      )}

      <Tarjeta>
        <p className="etiqueta">Juego de pies</p>
        <h2 className={h.tituloTarjeta}>{nivelPies === 0 ? 'Empezá por el nivel 1' : `Nivel ${nivelPies} de 6`}</h2>
        <DibujoPies nivel={sigPies.nivel} />
        <p className={estilos.texto2}>
          {nivelPies >= NIVELES_PIES.length ? 'Completaste los 6 niveles.' : `Ahora: nivel ${sigPies.nivel}, ${sigPies.nombre.toLowerCase()}. ${sigPies.que}`}
        </p>
        <Link to="/combate/rondas/pies" className={estilos.boton}>
          Hacer rounds de pies
        </Link>
      </Tarjeta>

      <Link to="/combate/tecnicas" className={s.item}>
        <span className={s.itemNombre}>Técnicas</span>
        <span className={s.itemDetalle}>Cada golpe, patada, defensa y derribo, con dibujo, por disciplina y distancia</span>
      </Link>
      <p className="etiqueta">Para leer</p>
      {[
        ['combate-guardia', 'La guardia: tu posición base'],
        ['combate-vendaje', 'Cómo vendarte las manos'],
        ['combate-sparring', 'Sparring: cuándo y cómo, con seguridad'],
        ['combate-disciplinas', 'Disciplinas y distancias: por dónde empezar'],
      ].map(([id, t]) => (
        <Link key={id} to={`/aprender/${id}`} className={s.item}>
          <span className={s.itemNombre}>{t}</span>
        </Link>
      ))}
    </div>
  )
}
