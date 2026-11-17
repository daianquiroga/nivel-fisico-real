import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stepper } from '../../components/controles'
import { Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoPlato } from '../../content/dibujo-plato'
import tabla from '../../content/normas/alimentos-proteina.json'
import { G_POR_PALMA, proteinaDelDia, proteinaPlato } from '../../lib/calc/nutricion'
import { db } from '../../lib/db/db'
import { guardarTipo, leerTipo } from '../../lib/diario'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import { Volver } from '../Combate/comun'

const proteinaDe = (id: string) => tabla.alimentos.find((a) => a.id === id)?.proteina ?? 0

/** Tu comida del día: cuánta proteína te toca, contador de palmas, el plato y ejemplos de platos. */
export function Comida() {
  const { cargado, perfil } = usarInicio()
  const [peso, setPeso] = useState<number | null>(null)
  const [palmas, setPalmas] = useState(0)
  const [pesoNuevo, setPesoNuevo] = useState(70)
  const hoy = fechaLocal()

  useEffect(() => {
    void leerTipo<{ fecha: string; palmas: number }>('palmas').then((r) => setPalmas(r.filter((p) => p.fecha === hoy).at(-1)?.palmas ?? 0))
  }, [hoy])
  useEffect(() => {
    if (perfil?.pesoKg) setPeso(perfil.pesoKg)
  }, [perfil])

  if (!cargado) return null
  const p = peso ? proteinaDelDia(peso) : null

  async function cambiarPalmas(n: number) {
    setPalmas(n)
    await guardarTipo('palmas', hoy, { fecha: hoy, palmas: n })
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Comida</p>
        <h1 className={e.titulo}>Tu comida del día</h1>
        <p className={e.para}>Sin pesar nada: proteína en cada comida, medida con la palma de tu mano.</p>
      </header>

      {!p ? (
        <Tarjeta>
          <p className={estilos.texto2}>Para calcular tu proteína necesito tu peso. Queda solo en tu celular.</p>
          <Stepper etiqueta="Tu peso" valor={pesoNuevo} min={35} max={200} unidad="kg" onCambio={setPesoNuevo} />
          <Boton
            variante="principal"
            onClick={async () => {
              await db.perfil.update('yo', { pesoKg: pesoNuevo, actualizado: new Date().toISOString() })
              setPeso(pesoNuevo)
            }}
          >
            Guardar mi peso
          </Boton>
        </Tarjeta>
      ) : (
        <Tarjeta destacada>
          <p className="etiqueta">Tu proteína</p>
          <h2 style={{ margin: 0, fontSize: 40, fontFamily: 'var(--font-display)' }}>{p.objetivo} g por día</h2>
          <p className={estilos.texto2}>
            Unas <b>{p.palmas} palmas</b> en el día: {p.comidas} comidas de unos {p.porComida} g (una palma en cada una).
          </p>
          <p className={estilos.chico}>
            Para {peso} kg: 1,6 g por kilo, arriba de eso no se ganó más músculo (Morton 2018). Rango para quien entrena: {p.minimo} a {p.maximo} g (ISSN 2017). Por comida, 0,4 g por kilo (Schoenfeld y Aragon 2018). Una palma ≈ {G_POR_PALMA} g: aproximación práctica.
          </p>
        </Tarjeta>
      )}

      {p && (
        <Tarjeta>
          <p className="etiqueta">Hoy</p>
          <Stepper etiqueta="Palmas de proteína que comiste" valor={palmas} min={0} max={12} onCambio={(n) => void cambiarPalmas(n)} />
          <div style={{ height: 10, borderRadius: 6, background: 'var(--line)', overflow: 'hidden' }} aria-hidden="true">
            <div style={{ width: `${Math.min(100, (palmas / p.palmas) * 100)}%`, height: '100%', background: palmas >= p.palmas ? 'var(--done)' : 'var(--accent)' }} />
          </div>
          <p className={estilos.texto2} style={{ color: palmas >= p.palmas ? 'var(--done)' : undefined }}>
            {palmas >= p.palmas ? '✓ Llegaste a tu proteína de hoy.' : `Te faltan ${p.palmas - palmas} ${p.palmas - palmas === 1 ? 'palma' : 'palmas'}.`}
          </p>
        </Tarjeta>
      )}

      <Tarjeta>
        <p className="etiqueta">Cómo armar el plato</p>
        <DibujoPlato />
        <ul className={x.seccion} style={{ margin: 0 }}>
          <li>La mitad: verduras y frutas (las guías argentinas piden 5 porciones por día).</li>
          <li>Un cuarto: proteína, una palma (carne, pollo, pescado, huevos, legumbres, lácteos).</li>
          <li>Un cuarto: cereales, papa o legumbres, según tu objetivo (menos si bajás grasa, más si ganás músculo).</li>
          <li>Para tomar: agua. El agua del día la anotás en Hoy → Ver más.</li>
        </ul>
        <p className={estilos.chico}>{tabla.plato.fuente}</p>
      </Tarjeta>

      <p className="etiqueta" style={{ margin: '6px 0 0' }}>
        Ejemplos de platos
      </p>
      {tabla.platos.map((pl) => {
        const g = proteinaPlato(pl.alimentos.map((a) => ({ gramos: proteinaDe(a) })))
        return (
          <div key={pl.nombre} className={x.item} style={{ minHeight: 0 }}>
            <span className={x.itemNombre}>
              {pl.nombre} · unos {g} g
            </span>
            <span className={x.itemDetalle}>
              {pl.momento}. {pl.como}
              {p ? ` Cubre ${Math.round((g / p.objetivo) * 100)} % de tu día.` : ''}
            </span>
          </div>
        )
      })}

      <details>
        <summary className={estilos.boton} style={{ listStyle: 'none' }}>
          Proteína de cada alimento
        </summary>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 8 }}>
          <tbody>
            {tabla.alimentos.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '6px 4px' }}>
                  {a.nombre}
                  <br />
                  <span className={estilos.chico}>{a.porcion}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{a.proteina} g</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={estilos.chico}>{tabla.fuente}</p>
      </details>

      <Link to="/aprender/proteina-porciones" className={estilos.boton}>
        Leer: proteína y porciones con la mano
      </Link>
      <p className={estilos.chico}>Es una guía general, no un plan de nutrición. Con una enfermedad (por ejemplo, de los riñones) o en el embarazo, consultá a un profesional de la nutrición.</p>
    </div>
  )
}
