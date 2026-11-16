import { useEffect, useState } from 'react'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { Stepper } from '../../components/controles'
import { CuentaRegresiva } from '../../components/tiempo'
import { GraficoLinea } from '../../components/GraficoLinea'
import { DibujoTecnica } from '../../content/dibujos-combate'
import fskt from '../../content/normas/fskt.json'
import sjft from '../../content/normas/sjft.json'
import { clasificarFskt, indiceCaida, indiceSjft } from '../../lib/calc/pruebasCombate'
import { guardarTipo, leerTipo } from '../../lib/diario'
import { usarPantallaEncendida } from '../../lib/dispositivo'
import { fechaLocal } from '../../lib/plan/sesion'
import e from '../Evaluacion/evaluacion.module.css'
import s from '../Ejercicios/ejercicios.module.css'
import { Volver } from './comun'

interface Prueba {
  fecha: string
  prueba: 'fskt10' | 'fsktmult' | 'sjft'
  valor: number
  series?: number[]
  indice?: number
}

type Paso = { tipo: 'lista' } | { tipo: 'fskt10'; fase: 'listo' | 'corriendo' | 'anotar' } | { tipo: 'fsktmult'; serie: number; descanso: boolean; anotar: boolean } | { tipo: 'sjft' }

/** Pruebas específicas de combate con normas publicadas: patadas en 10 s, 5 × 10 s, y el test de judo. */
export function PruebasCombate() {
  const [paso, setPaso] = useState<Paso>({ tipo: 'lista' })
  const [hechas, setHechas] = useState<(Prueba & { id?: number })[]>([])
  const [n, setN] = useState(18)
  const [series, setSeries] = useState<number[]>([18, 18, 18, 18, 18])
  const [proy, setProy] = useState<[number, number, number]>([5, 10, 10])
  const [pulsos, setPulsos] = useState<[number, number]>([175, 145])
  const [resultado, setResultado] = useState<string | null>(null)
  usarPantallaEncendida(paso.tipo !== 'lista')

  const cargar = () => void leerTipo<Prueba>('prueba-combate').then(setHechas)
  useEffect(cargar, [])

  async function guardar(p: Omit<Prueba, 'fecha'>, texto: string) {
    await guardarTipo('prueba-combate', fechaLocal(), { ...p, fecha: fechaLocal() })
    setResultado(texto)
    setPaso({ tipo: 'lista' })
    cargar()
  }

  const historia = (p: Prueba['prueba']) => hechas.filter((x) => x.prueba === p).map((x) => ({ fecha: x.fecha, valor: x.valor }))

  if (paso.tipo === 'fskt10') {
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>Patadas en 10 segundos</h1>
        <DibujoTecnica id="patada-media" />
        {paso.fase === 'listo' && (
          <>
            <ol className={s.seccion}>
              <li>Calentá 5 minutos (soga o sombra suave).</li>
              <li>Parate en guardia frente a una bolsa o un blanco a la altura del cuerpo.</li>
              <li>Cuando arranque, pateá patada media alternando piernas lo más rápido que puedas, volviendo a la guardia en cada una. Contá solo las que pegan bien.</li>
            </ol>
            <Boton variante="principal" ancho onClick={() => setPaso({ tipo: 'fskt10', fase: 'corriendo' })}>
              Estoy listo
            </Boton>
          </>
        )}
        {paso.fase === 'corriendo' && <CuentaRegresiva segundos={10} onFin={() => setPaso({ tipo: 'fskt10', fase: 'anotar' })} />}
        {paso.fase === 'anotar' && (
          <>
            <Stepper etiqueta="Patadas válidas" valor={n} min={0} max={50} onCambio={setN} />
            <Boton variante="principal" ancho onClick={() => void guardar({ prueba: 'fskt10', valor: n }, `${n} patadas: ${clasificarFskt(n).toLowerCase()} según la tabla de atletas.`)}>
              Guardar
            </Boton>
          </>
        )}
      </div>
    )
  }

  if (paso.tipo === 'fsktmult') {
    const { serie, descanso, anotar } = paso
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>Patadas: 5 × 10 segundos</h1>
        <DibujoTecnica id="patada-media" />
        {!anotar && (
          <>
            <p className="etiqueta" style={{ color: descanso ? 'var(--done)' : 'var(--accent)' }}>
              {descanso ? `Descanso · después viene la serie ${serie + 2}` : `Serie ${serie + 1} de 5: ¡a patear!`}
            </p>
            <p className={estilos.chico}>Acordate cuántas patadas hiciste en cada serie: las anotás al final.</p>
            <CuentaRegresiva
              key={`${serie}-${descanso}`}
              segundos={descanso ? fskt.mult.descanso : fskt.mult.trabajo}
              onFin={() => {
                if (descanso) setPaso({ tipo: 'fsktmult', serie: serie + 1, descanso: false, anotar: false })
                else if (serie + 1 < fskt.mult.series) setPaso({ tipo: 'fsktmult', serie, descanso: true, anotar: false })
                else setPaso({ tipo: 'fsktmult', serie, descanso: false, anotar: true })
              }}
            />
          </>
        )}
        {anotar && (
          <>
            {series.map((v, i) => (
              <Stepper key={i} etiqueta={`Serie ${i + 1}`} valor={v} min={0} max={50} onCambio={(x) => setSeries(series.map((y, j) => (j === i ? x : y)))} />
            ))}
            <Boton
              variante="principal"
              ancho
              onClick={() => {
                const total = series.reduce((a, b) => a + b, 0)
                const kdi = indiceCaida(series)
                void guardar({ prueba: 'fsktmult', valor: total, series, indice: kdi }, `${total} patadas en total; caída ${String(kdi).replace('.', ',')} % (más bajo = aguantás mejor el ritmo).`)
              }}
            >
              Guardar
            </Boton>
          </>
        )}
      </div>
    )
  }

  if (paso.tipo === 'sjft') {
    const indice = indiceSjft(proy, pulsos[0], pulsos[1])
    return (
      <div className={e.pantalla}>
        <Volver />
        <h1 className={e.titulo}>Test de judo (SJFT)</h1>
        <DibujoTecnica id="uchikomi" />
        <p className={estilos.texto2}>{sjft.nota}</p>
        <p className={estilos.chico}>Bloques de 15, 30 y 30 segundos con 10 de pausa, proyectando con ippon seoi nage a los dos compañeros, uno por vez.</p>
        {proy.map((v, i) => (
          <Stepper key={i} etiqueta={`Proyecciones bloque ${i + 1} (${sjft.bloques[i]} s)`} valor={v} min={0} max={20} onCambio={(x) => setProy(proy.map((y, j) => (j === i ? x : y)) as [number, number, number])} />
        ))}
        <Stepper etiqueta="Pulso al terminar" valor={pulsos[0]} min={80} max={220} unidad="ppm" onCambio={(x) => setPulsos([x, pulsos[1]])} />
        <Stepper etiqueta="Pulso 1 minuto después" valor={pulsos[1]} min={60} max={220} unidad="ppm" onCambio={(x) => setPulsos([pulsos[0], x])} />
        <p className={estilos.texto2}>
          Índice: <b>{String(indice).replace('.', ',')}</b> (más bajo es mejor)
        </p>
        <Boton variante="principal" ancho onClick={() => void guardar({ prueba: 'sjft', valor: indice, series: [...proy] }, `Índice SJFT ${String(indice).replace('.', ',')}: comparalo con tu próxima prueba.`)}>
          Guardar
        </Boton>
      </div>
    )
  }

  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <h1 className={e.titulo}>Pruebas de combate</h1>
        <p className={e.para}>Pruebas publicadas para medir tu rendimiento específico. Repetilas cada 4 a 6 semanas, en las mismas condiciones.</p>
      </header>
      {resultado && <Aviso tipo="ok">{resultado}</Aviso>}

      <Tarjeta destacada>
        <p className="etiqueta">Velocidad de patada · FSKT 10 s</p>
        <DibujoTecnica id="patada-media" />
        <p className={estilos.texto2}>Cuántas patadas medias válidas metés en 10 segundos. Mide velocidad y potencia anaeróbica.</p>
        <Boton variante="principal" ancho onClick={() => setPaso({ tipo: 'fskt10', fase: 'listo' })}>
          Hacer la prueba
        </Boton>
        <GraficoLinea puntos={historia('fskt10')} etiqueta="Patadas en 10 segundos" />
      </Tarjeta>

      <Tarjeta>
        <p className="etiqueta">Aguante de patada · FSKT 5 × 10 s</p>
        <p className={estilos.texto2}>5 series de 10 segundos con 10 de descanso. Mide cuánto aguantás el ritmo: la caída entre la mejor serie y el resto.</p>
        <Boton ancho onClick={() => setPaso({ tipo: 'fsktmult', serie: 0, descanso: false, anotar: false })}>
          Hacer la prueba
        </Boton>
        <GraficoLinea puntos={historia('fsktmult')} etiqueta="Patadas en 5 series" />
      </Tarjeta>

      <Tarjeta>
        <p className="etiqueta">Test de judo · SJFT (con compañeros)</p>
        <p className={estilos.texto2}>La prueba más usada en judo. Necesita 2 compañeros: anotá el resultado cuando la hagas en el club.</p>
        <Boton ancho onClick={() => setPaso({ tipo: 'sjft' })}>
          Anotar un SJFT
        </Boton>
        <GraficoLinea puntos={historia('sjft')} etiqueta="Índice SJFT (más bajo es mejor)" />
      </Tarjeta>

      <details className={s.detalle}>
        <summary>Fuentes y cómo leer los números</summary>
        <p>{fskt.nota}</p>
        <p>{fskt.kdi}</p>
        <p>Tabla del FSKT 10 s: 16 o menos, muy bajo; 17, bajo; 18 a 21, promedio; 22 a 23, bueno; 24 o más, excelente.</p>
        <p>{fskt.fuente}</p>
        <p>{sjft.fuente}</p>
        <p>Para boxeo o golpes de puño no hay una prueba solo, sin equipo, con normas publicadas: la app no inventa una. Usá el video de Evaluar para medir la técnica.</p>
      </details>
    </div>
  )
}
