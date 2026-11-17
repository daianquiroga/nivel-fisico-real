/* Dibujos de los artículos y guías de Aprender. Lienzo de 320 de ancho, piso en y = 168. */
import type { ReactNode } from 'react'
import { Figura, Flecha, Lienzo, Piso, Texto } from '../components/Figura'
import { DibujoEjercicio, tieneDibujo } from './dibujos-ejercicios'
import { EnReserva } from './ilustraciones'
import { DibujoDistancias, DibujoGuardia, DibujoSparring, DibujoTecnica, DibujoVendaje, tieneDibujoTecnica } from './dibujos-combate'

const acento = 'var(--accent)'
const hecho = 'var(--done)'

/** Plan para empezar a correr: 5 min de caminata y 8 × (1 min trote + 1½ caminata). */
function IntervalosCorrer() {
  const px = 11.6
  const x0 = 12
  const bloques: { x: number; w: number; trote: boolean }[] = [{ x: x0, w: 5 * px, trote: false }]
  for (let i = 0; i < 8; i++) {
    const x = x0 + 5 * px + i * 2.5 * px
    bloques.push({ x, w: px, trote: true }, { x: x + px, w: 1.5 * px, trote: false })
  }
  return (
    <Lienzo etiqueta="Semana 1: 5 minutos caminando y después 8 veces 1 minuto de trote y 1 minuto y medio caminando" alto={170}>
      <Figura
        pose={{
          cabeza: [168, 22],
          cuello: [164, 38],
          cadera: [158, 76],
          rodD: [178, 92],
          pieD: [170, 116],
          rodI: [146, 98],
          pieI: [128, 108],
          codoD: [176, 56],
          manoD: [188, 46],
          codoI: [150, 56],
          manoI: [142, 70],
        }}
        color={acento}
      />
      <Piso y={122} />
      {bloques.map((b, i) => (
        <rect key={i} x={b.x} y={b.trote ? 132 : 140} width={b.w - 1.5} height={b.trote ? 18 : 10} rx={3} fill={b.trote ? acento : 'var(--line)'} />
      ))}
      <Texto x={x0} y={164} ancla="start">5 min caminando</Texto>
      <Texto x={308} y={164} ancla="end" color={acento}>1 trote · 1½ caminás (×8)</Texto>
    </Lienzo>
  )
}

function Bici() {
  const rueda = (x: number) => <circle cx={x} cy={136} r={30} fill="none" stroke="var(--muted)" strokeWidth={4} />
  return (
    <Lienzo etiqueta="Bicicleta: con el pedal abajo, la rodilla queda apenas doblada" alto={176}>
      <Piso y={166} />
      {rueda(92)}
      {rueda(232)}
      <path d="M92,136 L140,136 L128,88 M140,136 L206,92 L232,136 M128,88 L206,92 M206,92 L210,74 L224,72 M118,84 L140,84" stroke="var(--muted)" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Figura
        pose={{
          cabeza: [196, 30],
          cuello: [184, 44],
          cadera: [130, 78],
          rodD: [154, 112],
          pieD: [146, 150],
          rodI: [160, 96],
          pieI: [138, 124],
          codoD: [204, 58],
          manoD: [220, 72],
          codoI: [200, 60],
          manoI: [216, 74],
        }}
        color={acento}
      />
      <Flecha de={[96, 150]} a={[138, 152]} />
      <Texto x={60} y={30} ancla="start">pedal abajo:</Texto>
      <Texto x={60} y={46} ancla="start">rodilla apenas doblada</Texto>
    </Lienzo>
  )
}

function Respiracion() {
  return (
    <Lienzo etiqueta="Inhalá 4 segundos inflando la panza y exhalá 6 segundos, más largo que la inhalación" alto={170}>
      <Piso desde={0} hasta={120} />
      <Figura
        pose={{
          cabeza: [60, 30],
          cuello: [60, 46],
          cadera: [60, 100],
          rodD: [64, 134],
          pieD: [64, 166],
          rodI: [56, 134],
          pieI: [56, 166],
          codoD: [80, 66],
          manoD: [70, 86],
          codoI: [44, 70],
          manoI: [48, 92],
        }}
      />
      <ellipse cx={62} cy={86} rx={14} ry={10} fill="none" stroke={hecho} strokeWidth={2.5} strokeDasharray="4 3" />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={`i${i}`} x={132 + i * 17} y={58} width={14} height={20} rx={3} fill={hecho} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`e${i}`} x={132 + i * 17} y={112} width={14} height={20} rx={3} fill={acento} />
      ))}
      <Texto x={132} y={48} ancla="start" color={hecho}>inhalá 4 s (panza afuera)</Texto>
      <Texto x={132} y={102} ancla="start" color={acento}>exhalá 6 s, más largo</Texto>
      <Texto x={132} y={154} ancla="start">2 a 5 minutos</Texto>
    </Lienzo>
  )
}

function Fumar() {
  const hitos = [
    ['20 min', 'baja el pulso'],
    ['12 h', 'CO casi normal'],
    ['2 sem a 3 m', 'pulmones'],
    ['1 a 9 m', 'menos tos'],
    ['1 año', 'corazón: ½'],
    ['10 años', 'cáncer: ½'],
  ]
  return (
    <Lienzo etiqueta="Desde que dejás de fumar: 20 minutos baja el pulso, 12 horas el monóxido casi normal, semanas mejoran los pulmones, meses menos tos, al año la mitad de riesgo del corazón, a los 10 años la mitad de riesgo de cáncer de pulmón" alto={150}>
      <line x1={26} x2={296} y1={75} y2={75} stroke="var(--line)" strokeWidth={3} />
      <Flecha de={[280, 75]} a={[306, 75]} />
      {hitos.map(([t, d], i) => {
        const x = 42 + i * 49
        const arriba = i % 2 === 0
        return (
          <g key={t}>
            <circle cx={x} cy={75} r={7} fill={i < 2 ? hecho : acento} />
            <Texto x={x} y={arriba ? 40 : 104} color="var(--text-2)">{t}</Texto>
            <Texto x={x} y={arriba ? 56 : 120}>{d}</Texto>
          </g>
        )
      })}
    </Lienzo>
  )
}

/** Porciones con la mano: palma, puño, puñado y pulgar. */
function Mano() {
  const forma = (x: number, d: ReactNode, t1: string, t2: string) => (
    <g key={t1}>
      <g transform={`translate(${x},70)`}>{d}</g>
      <Texto x={x} y={128} color="var(--text-2)">{t1}</Texto>
      <Texto x={x} y={146}>{t2}</Texto>
    </g>
  )
  const piel = { fill: 'var(--surface-2)', stroke: 'var(--text-2)', strokeWidth: 2.5 }
  return (
    <Lienzo etiqueta="Por comida: una palma de proteína, un puño de verduras, un puñado de hidratos y un pulgar de grasas" alto={160}>
      {forma(
        44,
        <>
          <rect x={-20} y={-24} width={40} height={50} rx={12} {...piel} />
          <rect x={-8} y={-12} width={16} height={22} rx={4} fill={acento} />
        </>,
        'palma',
        'proteína',
      )}
      {forma(
        124,
        <>
          <rect x={-20} y={-18} width={40} height={36} rx={14} {...piel} />
          <path d="M-10,-18 L-10,-4 M0,-18 L0,-4 M10,-18 L10,-4" stroke="var(--text-2)" strokeWidth={2} />
        </>,
        'puño',
        'verduras',
      )}
      {forma(
        204,
        <>
          <path d="M-26,-4 Q0,34 26,-4 Z" {...piel} />
          {[-12, -4, 4, 12, -8, 0, 8].map((dx, i) => (
            <circle key={i} cx={dx} cy={i < 4 ? -6 : -12} r={4} fill={hecho} />
          ))}
        </>,
        'puñado',
        'hidratos',
      )}
      {forma(
        280,
        <>
          <rect x={-8} y={-22} width={16} height={40} rx={8} {...piel} />
          <circle cx={0} cy={-12} r={5} fill="#d9b44a" />
        </>,
        'pulgar',
        'grasas',
      )}
    </Lienzo>
  )
}

const DE_PIE = {
  cabeza: [0, 30],
  cuello: [0, 46],
  cadera: [0, 100],
  rodD: [4, 134],
  pieD: [4, 166],
  rodI: [-4, 134],
  pieI: [-4, 166],
  codoD: [12, 72],
  manoD: [14, 98],
  codoI: [-12, 72],
  manoI: [-14, 98],
} as const

const mover = (dx: number) =>
  Object.fromEntries(Object.entries(DE_PIE).map(([k, [x, y]]) => [k, [x + dx, y] as [number, number]])) as unknown as Parameters<typeof Figura>[0]['pose']

function Dolor() {
  return (
    <Lienzo etiqueta="Dolor muscular normal: difuso, en el músculo. Lesión: punzante, en un punto o en la articulación" alto={196}>
      <Piso />
      <Figura pose={mover(80)} />
      <ellipse cx={82} cy={118} rx={10} ry={18} fill={hecho} opacity={0.45} />
      <ellipse cx={82} cy={118} rx={16} ry={26} fill={hecho} opacity={0.18} />
      <Figura pose={mover(240)} />
      <path d="M244,124 l4,9 l9,-3 l-6,7 l7,6 l-9,0 l-1,9 l-4,-8 l-8,4 l3,-8 l-8,-5 l9,-1 z" fill={acento} transform="translate(0,-10)" />
      <Texto x={80} y={186}>difuso: normal</Texto>
      <Texto x={240} y={186} color={acento}>punzante: pará</Texto>
    </Lienzo>
  )
}

function Grasa() {
  const flechas: [number, number, number, number][] = [
    [148, 64, 120, 52],
    [172, 64, 200, 52],
    [148, 94, 118, 96],
    [172, 94, 202, 96],
    [150, 130, 124, 142],
    [170, 130, 196, 142],
  ]
  return (
    <Lienzo etiqueta="La grasa baja de todo el cuerpo a la vez, no solo de la zona que entrenás" alto={196}>
      <Piso />
      <Figura pose={mover(160)} />
      {flechas.map(([a, b, c, d], i) => (
        <Flecha key={i} de={[a, b]} a={[c, d]} />
      ))}
      <Texto x={24} y={100} ancla="start">de todos</Texto>
      <Texto x={24} y={116} ancla="start">lados</Texto>
      <Texto x={296} y={100} ancla="end">no de una</Texto>
      <Texto x={296} y={116} ancla="end">sola zona</Texto>
    </Lienzo>
  )
}

function Sueno() {
  return (
    <Lienzo etiqueta="Dormir 7 horas o más por noche" alto={170}>
      <rect x={40} y={122} width={220} height={14} rx={4} fill="var(--surface-2)" stroke="var(--line)" />
      <path d="M44,136 L44,160 M256,136 L256,160 M40,122 L40,96" stroke="var(--muted)" strokeWidth={4} strokeLinecap="round" />
      <rect x={50} y={108} width={36} height={14} rx={6} fill="var(--surface-2)" stroke="var(--line)" />
      <Figura
        pose={{
          cabeza: [70, 100],
          cuello: [88, 112],
          cadera: [152, 114],
          rodD: [196, 112],
          pieD: [238, 114],
          rodI: [196, 116],
          pieI: [238, 118],
          codoD: [118, 116],
          manoD: [146, 116],
          codoI: [118, 118],
          manoI: [146, 120],
          ojosCerrados: true,
        }}
      />
      <circle cx={266} cy={38} r={18} fill="#d9b44a" />
      <circle cx={276} cy={32} r={16} fill="var(--bg)" />
      <Texto x={176} y={48} color="var(--text-2)">7 h o más</Texto>
      <Texto x={176} y={66}>por noche</Texto>
    </Lienzo>
  )
}

/** 66 días para formar un hábito: un día que faltás no corta la cadena. */
function Habitos() {
  const falta = 23
  return (
    <Lienzo etiqueta="Un hábito tarda unos 66 días; faltar un día no lo arruina" alto={150}>
      {Array.from({ length: 70 }, (_, i) => {
        const x = 22 + (i % 14) * 21
        const y = 18 + Math.floor(i / 14) * 21
        if (i >= 66) return <circle key={i} cx={x} cy={y} r={7} fill="none" stroke="var(--line)" strokeWidth={2} />
        if (i === falta) return <circle key={i} cx={x} cy={y} r={7} fill="none" stroke={acento} strokeWidth={2.5} strokeDasharray="3 2" />
        return <circle key={i} cx={x} cy={y} r={7} fill={hecho} />
      })}
      <Texto x={160} y={130} color="var(--text-2)">66 días en la mitad de los casos</Texto>
      <Texto x={160} y={146} color={acento}>faltar un día no corta el hábito</Texto>
    </Lienzo>
  )
}

/** Zonas que más se lastiman en combate, sobre una figura de frente. */
function ZonasLesion() {
  const pose = { cabeza: [160, 30] as [number, number], cuello: [160, 44] as [number, number], cadera: [160, 100] as [number, number], rodD: [150, 134] as [number, number], pieD: [146, 166] as [number, number], rodI: [170, 134] as [number, number], pieI: [174, 166] as [number, number], codoD: [138, 72] as [number, number], manoD: [130, 96] as [number, number], codoI: [182, 72] as [number, number], manoI: [190, 96] as [number, number] }
  const punto = (x: number, y: number, lx: number, ly: number, texto: string, ancla: 'start' | 'end') => (
    <g key={texto}>
      <circle cx={x} cy={y} r={6} fill={acento} opacity={0.85} />
      <path d={`M${x},${y} L${lx},${ly}`} stroke="var(--line)" strokeDasharray="3 3" />
      <Texto x={lx + (ancla === 'start' ? 4 : -4)} y={ly + 4} ancla={ancla}>
        {texto}
      </Texto>
    </g>
  )
  return (
    <Lienzo etiqueta="Zonas que más se lastiman en combate: cabeza, mano y muñeca, hombro, codo, rodilla, tobillo y dedos" alto={190}>
      <Piso />
      <Figura pose={pose} />
      {punto(160, 30, 226, 20, 'cabeza', 'start')}
      {punto(130, 96, 104, 112, 'mano y muñeca', 'end')}
      {punto(148, 52, 104, 46, 'hombro', 'end')}
      {punto(182, 72, 226, 66, 'codo', 'start')}
      {punto(170, 134, 226, 128, 'rodilla', 'start')}
      {punto(146, 166, 104, 150, 'tobillo y pie', 'end')}
      {punto(190, 96, 226, 100, 'dedos (agarre)', 'start')}
    </Lienzo>
  )
}

/** Cabeza con las señales que piden parar. */
function Cabeza() {
  const senales = ['dolor de cabeza', 'mareo o náuseas', 'ver borroso o doble', 'confusión, "en una nube"']
  return (
    <Lienzo etiqueta="Después de un golpe en la cabeza, señales para parar ese día: dolor de cabeza, mareo, ver borroso, confusión" alto={190}>
      <circle cx={80} cy={86} r={44} fill="none" stroke="var(--text-2)" strokeWidth={6} />
      <path d="M62,80 q6,-6 12,0 M86,80 q6,-6 12,0" stroke="var(--text-2)" strokeWidth={3} fill="none" />
      <path d="M68,104 q12,-8 24,0" stroke="var(--text-2)" strokeWidth={3} fill="none" />
      <path d="M30,40 q8,-12 16,0 q8,12 16,0" stroke={hecho} strokeWidth={2.5} fill="none" />
      {senales.map((s, i) => (
        <Texto key={s} x={150} y={52 + i * 24} ancla="start" color="var(--text)">
          {`• ${s}`}
        </Texto>
      ))}
      <rect x={146} y={146} width={160} height={30} rx={8} fill={acento} />
      <Texto x={226} y={166} color="var(--text)">
        Ese día se termina
      </Texto>
    </Lienzo>
  )
}

/** Orden recomendado: fuerza primero o separado del cardio intenso. */
function Orden() {
  const bloque = (x: number, w: number, texto: string, color: string) => (
    <g key={texto + x}>
      <rect x={x} y={70} width={w} height={36} rx={8} fill={color} />
      <Texto x={x + w / 2} y={93} color="var(--bg)">
        {texto}
      </Texto>
    </g>
  )
  return (
    <Lienzo etiqueta="Mismo día: primero fuerza y potencia, después combate o cardio; o separados unas horas" alto={170}>
      <Texto x={10} y={50} ancla="start">
        Mismo día
      </Texto>
      {bloque(10, 92, 'saltos', hecho)}
      {bloque(108, 92, 'fuerza', hecho)}
      {bloque(206, 104, 'combate/cardio', acento)}
      <Flecha de={[56, 122]} a={[260, 122]} />
      <Texto x={160} y={150}>
        lo explosivo, fresco y primero
      </Texto>
    </Lienzo>
  )
}

/** Crear distancia y salir: la mejor defensa. */
function Escape() {
  const agresor = { cabeza: [80, 34] as [number, number], cuello: [82, 50] as [number, number], cadera: [86, 100] as [number, number], rodD: [96, 134] as [number, number], pieD: [104, 166] as [number, number], rodI: [76, 134] as [number, number], pieI: [68, 166] as [number, number], codoD: [104, 66] as [number, number], manoD: [118, 54] as [number, number], codoI: [96, 72] as [number, number], manoI: [110, 62] as [number, number] }
  const vos = { cabeza: [230, 34] as [number, number], cuello: [228, 50] as [number, number], cadera: [232, 100] as [number, number], rodD: [246, 132] as [number, number], pieD: [262, 162] as [number, number], rodI: [222, 134] as [number, number], pieI: [210, 166] as [number, number], codoD: [214, 66] as [number, number], manoD: [204, 50] as [number, number], codoI: [222, 70] as [number, number], manoI: [212, 52] as [number, number] }
  return (
    <Lienzo etiqueta="Crear distancia, manos arriba y salir: la respuesta más segura" alto={190}>
      <Piso />
      <Figura pose={agresor} />
      <Figura pose={vos} color={acento} />
      <Flecha de={[150, 150]} a={[300, 150]} />
      <Texto x={226} y={184}>
        distancia y salida
      </Texto>
    </Lienzo>
  )
}

/** Seis columnas que sostienen el techo: los pilares del cambio del cuerpo. */
function Pilares() {
  const nombres = ['Fuerza', 'Proteína', 'Balance', 'Sueño', 'Moverse', 'Tiempo']
  return (
    <Lienzo etiqueta="Seis pilares sostienen el resultado: fuerza, proteína, balance de comida, sueño, movimiento y tiempo" alto={198}>
      <path d="M20,44 L160,12 L300,44 Z" fill={acento} opacity={0.9} />
      <Texto x={160} y={38} color="var(--bg)">
        Tu cuerpo, sostenible
      </Texto>
      {nombres.map((n, i) => (
        <g key={n}>
          <rect x={30 + i * 46} y={50} width={30} height={104} rx={4} fill="var(--surface-2)" stroke="var(--line)" />
          <Texto x={45 + i * 46} y={i % 2 ? 190 : 176}>
            {n}
          </Texto>
        </g>
      ))}
      <rect x={20} y={154} width={280} height={8} rx={3} fill={hecho} />
    </Lienzo>
  )
}

const DIBUJOS: Record<string, () => ReactNode> = {
  pilares: Pilares,
  'zonas-lesion': ZonasLesion,
  cabeza: Cabeza,
  orden: Orden,
  escape: Escape,
  'intervalos-correr': IntervalosCorrer,
  bici: Bici,
  respiracion: Respiracion,
  fumar: Fumar,
  mano: Mano,
  dolor: Dolor,
  grasa: Grasa,
  sueno: Sueno,
  habitos: Habitos,
  reserva: () => <EnReserva />,
  guardia: DibujoGuardia,
  vendaje: DibujoVendaje,
  sparring: DibujoSparring,
  distancias: DibujoDistancias,
}

export const existeDibujo = (clave: string) =>
  clave.startsWith('ej:') ? tieneDibujo(clave.slice(3)) : clave.startsWith('tec:') ? tieneDibujoTecnica(clave.slice(4)) : clave in DIBUJOS

export function DibujoArticulo({ clave }: { clave: string }) {
  if (clave.startsWith('ej:')) return <DibujoEjercicio id={clave.slice(3)} />
  if (clave.startsWith('tec:')) return <DibujoTecnica id={clave.slice(4)} />
  const D = DIBUJOS[clave]
  return D ? <D /> : null
}
