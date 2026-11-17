import { useCallback, useEffect, useState } from 'react'
import { Stepper } from '../../components/controles'
import { Cronometro } from '../../components/tiempo'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { DibujoEjercicio } from '../../content/dibujos-ejercicios'
import { compararMarca, mejorMarca, type Cambio } from '../../lib/calc/marcas'
import { guardarTipo, leerTipo } from '../../lib/diario'
import { fechaLocal } from '../../lib/plan/sesion'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import { Volver } from '../Combate/comun'

interface Marca {
  fecha: string
  valor: number
  lado?: 'derecho' | 'izquierdo'
}

interface Prueba {
  tipo: string
  nombre: string
  que: string
  dibujo: string
  unidad: 's' | 'cm'
  menorEsMejor: boolean
  /** Cambio mínimo para contar como mejora real. */
  minimo: number
  textoMinimo: string
  pasos: string[]
  porLado?: boolean
  normas: string
}

const PRUEBAS: Prueba[] = [
  {
    tipo: 'hexagono',
    nombre: 'Agilidad: prueba del hexágono',
    que: 'Cambios de dirección rápidos con los pies juntos.',
    dibujo: 'saltos-hexagono',
    unidad: 's',
    menorEsMejor: true,
    minimo: 1.015,
    textoMinimo: 'Cuenta como mejora real si bajás más de 1 segundo (cambio mínimo detectable, Beekhuizen y otros 2009).',
    pasos: [
      'Marcá un hexágono con cinta en el piso, de 60 cm por lado (necesitás unos 2 × 2 m).',
      'Parate en el centro, mirando siempre al mismo frente.',
      'Con los pies juntos, saltá afuera por cada lado y volvé al centro, en el sentido de las agujas del reloj.',
      'Hacé 3 vueltas completas lo más rápido que puedas. Si pisás una línea, empezá de nuevo.',
      'Hacé un intento de práctica antes: la primera vez siempre sale más lento.',
    ],
    normas: 'La prueba es confiable para comparar tus marcas (Beekhuizen y otros 2009), pero no hay tablas por edad para adultos que no son deportistas: la app compara con tu marca anterior.',
  },
  {
    tipo: 'alcance-espalda',
    nombre: 'Hombros: alcance detrás de la espalda',
    que: 'La movilidad de los hombros, con una regla o un centímetro.',
    dibujo: 'prueba-alcance-espalda',
    unidad: 'cm',
    menorEsMejor: false,
    minimo: 2,
    textoMinimo: 'Cuenta como mejora si ganás más de 2 cm (decisión de diseño: es lo que suele variar entre un intento y otro).',
    pasos: [
      'De pie, llevá una mano por arriba del hombro hacia la espalda, con la palma hacia la espalda.',
      'La otra mano va por la cintura, hacia arriba, con la palma hacia afuera.',
      'Acercá los dedos medios sin forzar. Que alguien mida la distancia entre las puntas.',
      'Si no se tocan, anotalo en menos (por ejemplo, −6). Si se tocan, 0. Si se pasan, en más.',
      'Probá con cada lado arriba: suelen dar distinto.',
    ],
    porLado: true,
    normas: 'Es la prueba de alcance de la espalda de Rikli y Jones (Senior Fitness Test). Sus tablas son para mayores de 60 años, así que la app compara con tu marca anterior.',
  },
  {
    tipo: 'alcance-sentado',
    nombre: 'Parte de atrás de las piernas: sentado y alcanzar',
    que: 'La flexibilidad de la parte de atrás de las piernas y la espalda baja.',
    dibujo: 'prueba-sentado-alcanzar',
    unidad: 'cm',
    menorEsMejor: false,
    minimo: 2,
    textoMinimo: 'Cuenta como mejora si ganás más de 2 cm (decisión de diseño).',
    pasos: [
      'Sentate en el piso con las piernas estiradas, juntas, y las plantas contra una pared o una caja.',
      'Entrá en calor antes: 2 minutos de caminata y unos balanceos de pierna.',
      'Poné una mano sobre la otra y estirate hacia adelante despacio, sin rebotar, con las rodillas estiradas.',
      'Quedate 2 segundos en el punto más lejos. Que alguien mida cuánto falta para la punta de los pies (en menos) o cuánto la pasás (en más).',
    ],
    normas: 'Las tablas publicadas usan un cajón especial, así que esta versión casera no se compara con ellas: la app compara con tu marca anterior.',
  },
]

const TEXTO_CAMBIO: Record<Cambio, string> = { mejor: 'Mejoraste de verdad', igual: 'Igual que la vez anterior (dentro de lo que varía)', peor: 'Bajaste un poco: puede ser cansancio o falta de entrada en calor' }

function UnaPrueba({ p }: { p: Prueba }) {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [valor, setValor] = useState(p.unidad === 's' ? 15 : 0)
  const [lado, setLado] = useState<'derecho' | 'izquierdo'>('derecho')
  const [abierta, setAbierta] = useState(false)
  const [guardada, setGuardada] = useState<Cambio | 'primera' | null>(null)
  const recargar = useCallback(() => void leerTipo<Marca>(p.tipo).then(setMarcas), [p.tipo])
  useEffect(recargar, [recargar])

  const delLado = marcas.filter((m) => !p.porLado || m.lado === lado)
  const mejor = mejorMarca(delLado.map((m) => m.valor), p.menorEsMejor)
  const formato = (v: number) => (p.unidad === 's' ? `${v.toFixed(1).replace('.', ',')} s` : `${v > 0 ? '+' : ''}${v} cm`)

  async function guardar(v: number) {
    const anterior = delLado.at(-1)
    await guardarTipo(p.tipo, fechaLocal(), { fecha: fechaLocal(), valor: v, ...(p.porLado ? { lado } : {}) })
    setGuardada(anterior ? compararMarca(anterior.valor, v, p.minimo, p.menorEsMejor) : 'primera')
    recargar()
  }

  return (
    <Tarjeta>
      <p className="etiqueta">{p.nombre}</p>
      <p className={estilos.texto2}>{p.que}</p>
      <DibujoEjercicio id={p.dibujo} />
      {mejor !== undefined && (
        <p className={estilos.texto2}>
          Tu mejor marca{p.porLado ? ` (${lado} arriba)` : ''}: <b style={{ color: 'var(--done)' }}>{formato(mejor)}</b> · {delLado.length} {delLado.length === 1 ? 'intento' : 'intentos'}
        </p>
      )}
      {!abierta ? (
        <Boton variante="principal" onClick={() => (setAbierta(true), setGuardada(null))}>
          Hacer la prueba
        </Boton>
      ) : (
        <>
          <ol className={x.seccion} style={{ margin: 0 }}>
            {p.pasos.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {p.porLado && (
            <div className={x.etiquetas} role="group" aria-label="Lado" style={{ gap: 6 }}>
              {(['derecho', 'izquierdo'] as const).map((l) => (
                <button key={l} type="button" aria-pressed={lado === l} className={`${x.filtro} ${lado === l ? x.filtroOn : ''}`} style={{ minHeight: 48 }} onClick={() => setLado(l)}>
                  Brazo {l} arriba
                </button>
              ))}
            </div>
          )}
          {p.unidad === 's' ? (
            <Cronometro textoEmpezar="Empezar las 3 vueltas" onResultado={(s) => setValor(Math.round(s * 10) / 10)} />
          ) : null}
          <Stepper etiqueta={p.unidad === 's' ? 'Tiempo (podés corregirlo)' : 'Distancia'} valor={valor} min={p.unidad === 's' ? 3 : -40} max={p.unidad === 's' ? 60 : 40} paso={p.unidad === 's' ? 0.1 : 1} unidad={p.unidad} onCambio={setValor} />
          <Boton variante="principal" onClick={() => void guardar(valor)}>
            Guardar {formato(valor)}
          </Boton>
          {guardada && <Aviso tipo="ok">{guardada === 'primera' ? 'Primera marca guardada: la próxima vez la comparo con esta.' : `${TEXTO_CAMBIO[guardada]}.`}</Aviso>}
          <p className={estilos.chico}>{p.textoMinimo}</p>
        </>
      )}
      <p className={estilos.chico}>{p.normas}</p>
    </Tarjeta>
  )
}

/** Pruebas que no tienen tablas para tu edad en casa: agilidad y flexibilidad, comparadas con tu marca anterior. */
export function MasPruebas() {
  return (
    <div className={e.pantalla}>
      <Volver />
      <header>
        <p className="etiqueta">Progreso</p>
        <h1 className={e.titulo}>Más pruebas</h1>
        <p className={e.para}>Agilidad y flexibilidad. Repetilas cada 4 semanas, a la misma hora y después de entrar en calor, para comparar bien.</p>
      </header>
      {PRUEBAS.map((p) => (
        <UnaPrueba key={p.tipo} p={p} />
      ))}
      <p className={estilos.chico}>Si una prueba te da dolor, pará y consultá a un profesional.</p>
    </div>
  )
}
