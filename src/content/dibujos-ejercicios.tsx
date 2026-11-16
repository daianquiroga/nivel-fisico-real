/* Dibujos de cada ejercicio: posición de inicio y final, con figuras de palitos propias.
   Coordenadas de cada cuadro: 160 de ancho, piso en y = 168. Las figuras miran a la derecha. */
import type { ReactNode } from 'react'
import { Figura, Flecha, Lienzo, Piso, Texto, type Pose } from '../components/Figura'

type P = [number, number]
const sum = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]]
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const acento = 'var(--accent)'
const metal = 'var(--muted)'

interface Base {
  cabeza: P
  cuello: P
  cadera: P
  rod: P
  pie: P
  punta?: P
  codo: P
  mano: P
  /** Si no se dan, el lado lejano copia al cercano corrido un poco. */
  rodI?: P
  pieI?: P
  puntaI?: P
  codoI?: P
  manoI?: P
}

function pose(b: Base): Pose {
  const d: P = [-3, -2]
  return {
    cabeza: b.cabeza,
    cuello: b.cuello,
    cadera: b.cadera,
    rodD: b.rod,
    pieD: b.pie,
    puntaD: b.punta,
    codoD: b.codo,
    manoD: b.mano,
    rodI: b.rodI ?? sum(b.rod, d),
    pieI: b.pieI ?? sum(b.pie, d),
    puntaI: b.puntaI ?? (b.punta ? sum(b.punta, d) : undefined),
    codoI: b.codoI ?? sum(b.codo, d),
    manoI: b.manoI ?? sum(b.mano, d),
  }
}

/** Cambia los brazos de una posición ya armada (los dos lados juntos). */
function brazos(p: Pose, codo: P, mano: P): Pose {
  return { ...p, codoD: codo, manoD: mano, codoI: sum(codo, [-3, -2]), manoI: sum(mano, [-3, -2]) }
}

/* ---------- Accesorios ---------- */

function Mancuerna({ en, vertical }: { en: P; vertical?: boolean }) {
  const [x, y] = en
  return vertical ? (
    <g fill={metal}>
      <rect x={x - 2} y={y - 9} width={4} height={18} />
      <rect x={x - 6} y={y - 12} width={12} height={5} rx={1.5} />
      <rect x={x - 6} y={y + 7} width={12} height={5} rx={1.5} />
    </g>
  ) : (
    <g fill={metal}>
      <rect x={x - 9} y={y - 2} width={18} height={4} />
      <rect x={x - 12} y={y - 6} width={5} height={12} rx={1.5} />
      <rect x={x + 7} y={y - 6} width={5} height={12} rx={1.5} />
    </g>
  )
}

const Disco = ({ en, r = 15 }: { en: P; r?: number }) => (
  <g>
    <circle cx={en[0]} cy={en[1]} r={r} fill="none" stroke={metal} strokeWidth={5} />
    <circle cx={en[0]} cy={en[1]} r={2.5} fill={metal} />
  </g>
)

const Kettlebell = ({ en }: { en: P }) => (
  <g>
    <path d={`M${en[0] - 6},${en[1] - 6} q6,-12 12,0`} fill="none" stroke={metal} strokeWidth={3} />
    <circle cx={en[0]} cy={en[1] + 4} r={9} fill={metal} />
  </g>
)

const Banda = ({ de, a }: { de: P; a: P }) => (
  <path d={`M${de[0]},${de[1]} Q${(de[0] + a[0]) / 2},${(de[1] + a[1]) / 2 + 6} ${a[0]},${a[1]}`} fill="none" stroke={acento} strokeWidth={3} />
)

const BarraFija = ({ y = 18, x1 = 30, x2 = 140 }: { y?: number; x1?: number; x2?: number }) => (
  <g>
    <line x1={x1} x2={x2} y1={y} y2={y} stroke={metal} strokeWidth={5} strokeLinecap="round" />
  </g>
)

const Banco = ({ x, ancho, alto = 40 }: { x: number; ancho: number; alto?: number }) => (
  <g>
    <rect x={x} y={168 - alto} width={ancho} height={9} rx={3} fill="var(--surface-2)" stroke="var(--line)" />
    <line x1={x + 8} x2={x + 8} y1={168 - alto + 9} y2={168} stroke={metal} strokeWidth={3} />
    <line x1={x + ancho - 8} x2={x + ancho - 8} y1={168 - alto + 9} y2={168} stroke={metal} strokeWidth={3} />
  </g>
)

const Caja = ({ x, ancho, alto }: { x: number; ancho: number; alto: number }) => (
  <rect x={x} y={168 - alto} width={ancho} height={alto} rx={3} fill="var(--surface-2)" stroke="var(--line)" />
)

const ParedL = ({ x }: { x: number }) => <rect x={x} y={14} width={7} height={154} fill="var(--surface-2)" stroke="var(--line)" />

const SillaL = ({ x, asiento = 122 }: { x: number; asiento?: number }) => (
  <path d={`M${x},${asiento - 46} L${x},168 M${x},${asiento} L${x + 40},${asiento} L${x + 40},168`} stroke={metal} strokeWidth={4} fill="none" strokeLinecap="round" />
)

const Cable = ({ de, a }: { de: P; a: P }) => <line x1={de[0]} y1={de[1]} x2={a[0]} y2={a[1]} stroke={metal} strokeWidth={1.5} strokeDasharray="3 3" />

/* ---------- Plantilla de dos cuadros ---------- */

interface Cuadro {
  pose: Pose
  atras?: ReactNode
  adelante?: ReactNode
}

function Dos({ a, b, etiqueta, textos = ['Inicio', 'Final'] }: { a: Cuadro; b: Cuadro; etiqueta: string; textos?: [string, string] }) {
  const cuadro = (c: Cuadro, dx: number, t: string) => (
    <g transform={`translate(${dx},0)`}>
      {c.atras}
      <Figura pose={c.pose} />
      {c.adelante}
      <Texto x={80} y={184}>
        {t}
      </Texto>
    </g>
  )
  return (
    <Lienzo etiqueta={etiqueta} alto={190}>
      <Piso />
      <line x1={160} x2={160} y1={10} y2={168} stroke="var(--line)" strokeDasharray="2 5" />
      {cuadro(a, 0, textos[0])}
      {cuadro(b, 160, textos[1])}
    </Lienzo>
  )
}

/* ---------- Familias de posiciones ---------- */

/** Guardia de combate para los dibujos de sombra y pies. */
const GUARDIA_E: Base = { cabeza: [86, 32], cuello: [84, 48], cadera: [78, 98], rod: [96, 132], pie: [104, 165], punta: [116, 165], rodI: [64, 134], pieI: [56, 165], puntaI: [66, 165], codo: [98, 70], mano: [104, 50], codoI: [88, 74], manoI: [94, 52] }
const correr = (b: Base, dx: number): Base => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, [(v as P)[0] + dx, (v as P)[1]]])) as unknown as Base

const DE_PIE: Base = { cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [80, 132], pie: [80, 165], punta: [94, 165], codo: [81, 72], mano: [82, 98] }

/** Flexión: manos en "mano", pies en "pie" (o rodillas apoyadas). */
function flexion(o: { mano: P; pie: P; abajo?: boolean; rodilla?: P }): Pose {
  const hombro: P = o.abajo ? [o.mano[0] - 2, o.mano[1] - 15] : [o.mano[0], o.mano[1] - 46]
  const base = o.rodilla ?? o.pie
  const largo = Math.hypot(hombro[0] - base[0], hombro[1] - base[1])
  const dir: P = [(hombro[0] - base[0]) / largo, (hombro[1] - base[1]) / largo]
  const cabeza: P = [hombro[0] + dir[0] * 15, hombro[1] + dir[1] * 15 - 5]
  const cadera = lerp(base, hombro, o.rodilla ? 0.42 : 0.52)
  const rod = o.rodilla ?? lerp(o.pie, cadera, 0.5)
  const codo: P = o.abajo ? [hombro[0] - 16, hombro[1] - 4] : lerp(hombro, o.mano, 0.5)
  return pose({ cabeza, cuello: hombro, cadera, rod, pie: o.pie, codo, mano: o.mano })
}

/** Sentadilla de costado. t = 0 parado, 1 profunda. Brazos según "brazos". */
function sentadilla(t: number, brazos: 'adelante' | 'goblet' | 'cruzados' | 'barra' | 'abajo' = 'adelante'): Pose {
  const cadera = lerp([80, 98], [50, 128], t)
  const rod = lerp([80, 132], [100, 128], t)
  const cuello = lerp([80, 44], [84, 78], t)
  const cabeza = lerp([80, 30], [90, 65], t)
  const brazo: Record<string, [P, P]> = {
    adelante: [sum(cuello, [16, 6]), sum(cuello, [36, 6])],
    goblet: [sum(cuello, [6, 22]), sum(cuello, [14, 10])],
    cruzados: [sum(cuello, [18, 20]), sum(cuello, [4, 14])],
    barra: [sum(cuello, [-12, 14]), sum(cuello, [-6, -2])],
    abajo: [sum(cuello, [2, 28]), sum(cuello, [4, 54])],
  }
  const [codo, mano] = brazo[brazos]
  return pose({ cabeza, cuello, cadera, rod, pie: [80, 165], punta: [96, 165], codo, mano })
}

/** Bisagra de cadera. t = 0 parado, 1 inclinado con la espalda recta. */
function bisagra(t: number, rodillas = 0.25): Pose {
  const cadera = lerp([80, 98], [60, 104], t)
  const rod = lerp([80, 132], [80 + 14 * rodillas, 132], t)
  const cuello = lerp([80, 44], [114, 78], t)
  const cabeza = lerp([80, 30], [128, 72], t)
  const mano: P = [cuello[0] + 2, cuello[1] + 54]
  return pose({ cabeza, cuello, cadera, rod, pie: [82, 165], punta: [96, 165], codo: lerp(cuello, mano, 0.5), mano })
}

/** Acostado boca arriba, cabeza a la izquierda. alturaCadera: 0 en el piso, 1 arriba (puente). */
function bocaArriba(alturaCadera: number, rodillaUnaArriba = false): Pose {
  const cadera: P = [86, 160 - 34 * alturaCadera]
  const cuello: P = [38, 158]
  return pose({
    cabeza: [24, 154],
    cuello,
    cadera,
    rod: [116, 128],
    pie: [124, 165],
    codo: [58, 163],
    mano: [78, 164],
    rodI: rodillaUnaArriba ? [116, cadera[1] - 6] : [113, 126],
    pieI: rodillaUnaArriba ? [148, cadera[1] - 14] : [121, 163],
  })
}

/** Cuadrupedia (cuatro patas). */
function cuadrupedia(estira = false): Pose {
  return pose({
    cabeza: [124, 108],
    cuello: [110, 116],
    cadera: [52, 118],
    rod: [52, 160],
    pie: [22, 164],
    codo: [110, 140],
    mano: [110, 164],
    codoI: estira ? [134, 112] : [107, 140],
    manoI: estira ? [156, 108] : [107, 164],
    rodI: estira ? [26, 116] : [49, 160],
    pieI: estira ? [2, 114] : [19, 164],
  })
}

/** Colgado de una barra (y = 18). arriba = mentón sobre la barra. */
function colgado(arriba: number): Pose {
  const dy = -34 * arriba
  const cuello: P = [80, 64 + dy]
  return pose({
    cabeza: [82, 50 + dy],
    cuello,
    cadera: [80, 116 + dy],
    rod: [84, 146 + dy],
    pie: [80, 172 + dy - 10],
    codo: arriba > 0.5 ? [64, 40 + dy + 10] : [78, 40],
    mano: [76, 18],
    codoI: arriba > 0.5 ? [96, 38 + dy + 10] : [86, 40],
    manoI: [88, 18],
  })
}

const cuadrupediaBase: Base = {
  cabeza: [124, 108],
  cuello: [110, 116],
  cadera: [52, 118],
  rod: [52, 160],
  pie: [22, 164],
  codo: [110, 140],
  mano: [110, 164],
}

/* ---------- Ejercicios ---------- */

const DIBUJOS: Record<string, () => ReactNode> = {
  /* Empuje */
  'flexion-pared': () => (
    <Dos
      etiqueta="Flexión en la pared: brazos estirados y después el pecho cerca de la pared"
      a={{ atras: <ParedL x={140} />, pose: pose({ cabeza: [116, 34], cuello: [108, 46], cadera: [84, 98], rod: [72, 132], pie: [62, 165], punta: [76, 165], codo: [124, 50], mano: [139, 52] }) }}
      b={{ atras: <ParedL x={140} />, pose: pose({ cabeza: [128, 36], cuello: [120, 50], cadera: [92, 100], rod: [76, 133], pie: [62, 165], punta: [76, 165], codo: [118, 66], mano: [139, 52] }) }}
    />
  ),
  'flexion-inclinada-alta': () => (
    <Dos
      etiqueta="Flexión inclinada con las manos en una mesa"
      a={{ atras: <Caja x={112} ancho={44} alto={70} />, pose: flexion({ mano: [124, 98], pie: [14, 165] }) }}
      b={{ atras: <Caja x={112} ancho={44} alto={70} />, pose: flexion({ mano: [124, 98], pie: [14, 165], abajo: true }) }}
    />
  ),
  'flexion-inclinada-baja': () => (
    <Dos
      etiqueta="Flexión inclinada con las manos en un escalón"
      a={{ atras: <Caja x={112} ancho={44} alto={36} />, pose: flexion({ mano: [124, 132], pie: [12, 165] }) }}
      b={{ atras: <Caja x={112} ancho={44} alto={36} />, pose: flexion({ mano: [124, 132], pie: [12, 165], abajo: true }) }}
    />
  ),
  'flexion-rodillas': () => (
    <Dos
      etiqueta="Flexión con las rodillas apoyadas"
      a={{ pose: flexion({ mano: [124, 165], pie: [26, 150], rodilla: [52, 165] }) }}
      b={{ pose: flexion({ mano: [124, 165], pie: [26, 150], rodilla: [52, 165], abajo: true }) }}
    />
  ),
  flexion: () => (
    <Dos
      etiqueta="Flexión de brazos: arriba y con el pecho a un puño del piso"
      a={{ pose: flexion({ mano: [128, 165], pie: [12, 165] }) }}
      b={{ pose: flexion({ mano: [128, 165], pie: [12, 165], abajo: true }) }}
    />
  ),
  'flexion-pies-elevados': () => (
    <Dos
      etiqueta="Flexión con los pies sobre un escalón"
      a={{ atras: <Caja x={2} ancho={34} alto={34} />, pose: flexion({ mano: [128, 165], pie: [16, 132] }) }}
      b={{ atras: <Caja x={2} ancho={34} alto={34} />, pose: flexion({ mano: [128, 165], pie: [16, 132], abajo: true }) }}
    />
  ),
  'flexion-arquera': () => {
    const t = { stroke: 'var(--text-2)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
    return (
      <Lienzo etiqueta="Flexión arquera vista de frente: se baja hacia un brazo mientras el otro queda estirado" alto={190}>
        <Piso />
        <line x1={160} x2={160} y1={10} y2={168} stroke="var(--line)" strokeDasharray="2 5" />
        <g>
          <path d="M80,108 L80,124" {...t} opacity={0.45} />
          <path d="M54,108 L106,108 M54,108 L22,165 M106,108 L138,165" {...t} />
          <circle cx={80} cy={94} r={10} fill="var(--text-2)" />
          <Texto x={80} y={184}>Inicio (de frente)</Texto>
        </g>
        <g transform="translate(160,0)">
          <path d="M60,140 L62,152" {...t} opacity={0.45} />
          <path d="M36,140 L84,140 M36,140 L18,150 L22,165 M84,140 L138,165" {...t} />
          <circle cx={56} cy={127} r={10} fill="var(--text-2)" />
          <Texto x={80} y={184}>Bajando a un lado</Texto>
        </g>
      </Lienzo>
    )
  },
  'press-piso-mancuernas': () => (
    <Dos
      etiqueta="Press en el piso con mancuernas: codos apoyados y después brazos estirados"
      a={{ pose: brazos(bocaArriba(0), [62, 164], [64, 140]), adelante: <Mancuerna en={[64, 136]} /> }}
      b={{ pose: brazos(bocaArriba(0), [52, 128], [50, 100]), adelante: <Mancuerna en={[50, 96]} /> }}
    />
  ),
  'press-banca-mancuernas': () => (
    <Dos
      etiqueta="Press de banco con mancuernas"
      a={{ atras: <Banco x={14} ancho={96} />, pose: pose({ cabeza: [24, 118], cuello: [38, 122], cadera: [88, 124], rod: [116, 136], pie: [122, 165], codo: [36, 140], mano: [40, 112] }), adelante: <Mancuerna en={[40, 108]} /> }}
      b={{ atras: <Banco x={14} ancho={96} />, pose: pose({ cabeza: [24, 118], cuello: [38, 122], cadera: [88, 124], rod: [116, 136], pie: [122, 165], codo: [40, 96], mano: [42, 72] }), adelante: <Mancuerna en={[42, 68]} /> }}
    />
  ),
  'press-banca-barra': () => (
    <Dos
      etiqueta="Press de banco con barra: la barra baja al pecho y sube"
      a={{ atras: <Banco x={14} ancho={96} />, pose: pose({ cabeza: [24, 118], cuello: [38, 122], cadera: [88, 124], rod: [116, 136], pie: [122, 165], codo: [30, 76], mano: [42, 52] }), adelante: <Disco en={[42, 52]} r={18} /> }}
      b={{ atras: <Banco x={14} ancho={96} />, pose: pose({ cabeza: [24, 118], cuello: [38, 122], cadera: [88, 124], rod: [116, 136], pie: [122, 165], codo: [34, 138], mano: [50, 108] }), adelante: <Disco en={[50, 104]} r={18} /> }}
      textos={['Arriba', 'Abajo']}
    />
  ),
  'press-pecho-maquina': () => (
    <Dos
      etiqueta="Press de pecho en máquina, sentado con la espalda apoyada"
      a={{ atras: <><rect x={40} y={36} width={10} height={90} fill="var(--surface-2)" stroke="var(--line)" /><Banco x={40} ancho={50} alto={46} /></>, pose: pose({ cabeza: [58, 30], cuello: [58, 46], cadera: [60, 116], rod: [96, 118], pie: [98, 165], codo: [72, 68], mano: [86, 60] }) }}
      b={{ atras: <><rect x={40} y={36} width={10} height={90} fill="var(--surface-2)" stroke="var(--line)" /><Banco x={40} ancho={50} alto={46} /></>, pose: pose({ cabeza: [58, 30], cuello: [58, 46], cadera: [60, 116], rod: [96, 118], pie: [98, 165], codo: [84, 54], mano: [110, 58] }) }}
    />
  ),
  'press-banda': () => (
    <Dos
      etiqueta="Press de pecho con banda anclada atrás"
      a={{ atras: <><ParedL x={4} /><Banda de={[11, 60]} a={[100, 60]} /></>, pose: pose({ ...DE_PIE, cuello: [78, 46], cabeza: [80, 32], rod: [88, 132], pie: [96, 165], punta: [110, 165], rodI: [70, 132], pieI: [60, 165], codo: [64, 62], mano: [84, 60] }) }}
      b={{ atras: <><ParedL x={4} /><Banda de={[11, 60]} a={[128, 58]} /></>, pose: pose({ ...DE_PIE, cuello: [78, 46], cabeza: [80, 32], rod: [88, 132], pie: [96, 165], punta: [110, 165], rodI: [70, 132], pieI: [60, 165], codo: [102, 54], mano: [126, 56] }) }}
    />
  ),
  'press-hombros-mancuernas': () => (
    <Dos
      etiqueta="Press de hombros con mancuernas: de los hombros hasta arriba"
      a={{ pose: pose({ ...DE_PIE, codo: [98, 62], mano: [98, 42] }), adelante: <Mancuerna en={[98, 40]} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [86, 26], mano: [86, 12] }), adelante: <Mancuerna en={[86, 10]} /> }}
    />
  ),
  'flexion-pica': () => (
    <Dos
      etiqueta="Flexión en pica: cadera alta y la cabeza baja hacia el piso"
      a={{ pose: pose({ cabeza: [116, 118], cuello: [106, 112], cadera: [74, 64], rod: [56, 112], pie: [40, 165], codo: [112, 138], mano: [118, 165] }) }}
      b={{ pose: pose({ cabeza: [124, 150], cuello: [110, 140], cadera: [76, 78], rod: [58, 120], pie: [40, 165], codo: [96, 150], mano: [116, 165] }) }}
    />
  ),

  /* Tracción */
  'remo-banda': () => (
    <Dos
      etiqueta="Remo con banda sentado: brazos estirados y después codos atrás"
      a={{ pose: pose({ cabeza: [50, 70], cuello: [50, 84], cadera: [44, 160], rod: [90, 162], pie: [136, 164], codo: [78, 104], mano: [104, 110] }), adelante: <Banda de={[104, 110]} a={[140, 160]} /> }}
      b={{ pose: pose({ cabeza: [48, 70], cuello: [48, 84], cadera: [44, 160], rod: [90, 162], pie: [136, 164], codo: [30, 112], mano: [56, 112] }), adelante: <Banda de={[56, 112]} a={[140, 160]} /> }}
    />
  ),
  'remo-mancuerna': () => (
    <Dos
      etiqueta="Remo a una mano con mancuerna, apoyado en un banco"
      a={{ atras: <Banco x={70} ancho={80} alto={50} />, pose: pose({ cabeza: [140, 80], cuello: [124, 88], cadera: [62, 92], rod: [64, 128], pie: [56, 165], codo: [120, 112], mano: [118, 140], rodI: [96, 118], pieI: [74, 118], codoI: [134, 106], manoI: [138, 118] }), adelante: <Mancuerna en={[118, 144]} /> }}
      b={{ atras: <Banco x={70} ancho={80} alto={50} />, pose: pose({ cabeza: [140, 80], cuello: [124, 88], cadera: [62, 92], rod: [64, 128], pie: [56, 165], codo: [104, 74], mano: [108, 102], rodI: [96, 118], pieI: [74, 118], codoI: [134, 106], manoI: [138, 118] }), adelante: <Mancuerna en={[108, 104]} /> }}
    />
  ),
  'remo-invertido': () => (
    <Dos
      etiqueta="Remo invertido debajo de una barra baja"
      a={{ atras: <><BarraFija y={84} x1={96} x2={150} /><line x1={146} x2={146} y1={84} y2={168} stroke={metal} strokeWidth={3} /></>, pose: pose({ cabeza: [128, 124], cuello: [118, 130], cadera: [72, 146], rod: [44, 156], pie: [18, 165], codo: [120, 106], mano: [120, 86] }) }}
      b={{ atras: <><BarraFija y={84} x1={96} x2={150} /><line x1={146} x2={146} y1={84} y2={168} stroke={metal} strokeWidth={3} /></>, pose: pose({ cabeza: [130, 92], cuello: [118, 102], cadera: [70, 128], rod: [42, 148], pie: [18, 165], codo: [98, 92], mano: [118, 86] }) }}
    />
  ),
  'remo-polea': () => (
    <Dos
      etiqueta="Remo sentado en polea"
      a={{ atras: <><rect x={146} y={60} width={10} height={108} fill="var(--surface-2)" stroke="var(--line)" /><Cable de={[146, 108]} a={[118, 104]} /></>, pose: pose({ cabeza: [54, 72], cuello: [56, 86], cadera: [42, 156], rod: [92, 146], pie: [136, 160], codo: [88, 98], mano: [116, 104] }) }}
      b={{ atras: <><rect x={146} y={60} width={10} height={108} fill="var(--surface-2)" stroke="var(--line)" /><Cable de={[146, 108]} a={[72, 112]} /></>, pose: pose({ cabeza: [48, 70], cuello: [48, 84], cadera: [42, 156], rod: [92, 146], pie: [136, 160], codo: [34, 112], mano: [70, 112] }) }}
    />
  ),
  'colgado-activo': () => (
    <Dos
      etiqueta="Colgado: primero pasivo y después con los hombros abajo"
      a={{ atras: <BarraFija />, pose: colgado(0) }}
      b={{ atras: <BarraFija />, pose: colgado(0.18) }}
      textos={['Pasivo', 'Activo: hombros abajo']}
    />
  ),
  'dominada-negativa': () => (
    <Dos
      etiqueta="Dominada negativa: arriba con ayuda de una silla y bajada lenta"
      a={{ atras: <><BarraFija /><SillaL x={64} asiento={150} /></>, pose: colgado(1) }}
      b={{ atras: <><BarraFija /><SillaL x={64} asiento={150} /></>, pose: colgado(0) }}
      textos={['Arriba', 'Bajá en 5 segundos']}
    />
  ),
  'dominada-asistida-banda': () => (
    <Dos
      etiqueta="Dominada asistida con una banda bajo la rodilla"
      a={{ atras: <BarraFija />, pose: colgado(0), adelante: <Banda de={[80, 18]} a={[84, 146]} /> }}
      b={{ atras: <BarraFija />, pose: colgado(1), adelante: <Banda de={[80, 18]} a={[84, 112]} /> }}
    />
  ),
  dominada: () => <Dos etiqueta="Dominada: de colgado hasta el mentón sobre la barra" a={{ atras: <BarraFija />, pose: colgado(0) }} b={{ atras: <BarraFija />, pose: colgado(1) }} />,
  'jalon-polea': () => (
    <Dos
      etiqueta="Jalón al pecho en polea, sentado"
      a={{ atras: <><Cable de={[82, 0]} a={[82, 14]} /><BarraFija y={14} x1={60} x2={104} /><Banco x={40} ancho={56} alto={46} /></>, pose: pose({ cabeza: [66, 54], cuello: [68, 68], cadera: [62, 118], rod: [100, 118], pie: [102, 165], codo: [74, 40], mano: [78, 16] }) }}
      b={{ atras: <><Cable de={[82, 0]} a={[82, 62]} /><BarraFija y={62} x1={60} x2={104} /><Banco x={40} ancho={56} alto={46} /></>, pose: pose({ cabeza: [64, 54], cuello: [66, 68], cadera: [62, 118], rod: [100, 118], pie: [102, 165], codo: [62, 92], mano: [80, 64] }) }}
    />
  ),
  'face-pull-banda': () => (
    <Dos
      etiqueta="Face pull con banda: tirar hacia la cara con los codos altos"
      a={{ atras: <><ParedL x={150} /><Banda de={[150, 38]} a={[118, 40]} /></>, pose: pose({ ...DE_PIE, codo: [98, 40], mano: [118, 40] }) }}
      b={{ atras: <><ParedL x={150} /><Banda de={[150, 38]} a={[84, 28]} /></>, pose: pose({ ...DE_PIE, codo: [66, 36], mano: [84, 26] }) }}
    />
  ),

  /* Piernas */
  'sentadilla-silla': () => (
    <Dos
      etiqueta="Sentarse y pararse de la silla con los brazos cruzados"
      a={{ atras: <SillaL x={28} />, pose: pose({ cabeza: [60, 50], cuello: [60, 64], cadera: [54, 116], rod: [92, 116], pie: [94, 165], punta: [108, 165], codo: [78, 84], mano: [64, 78] }) }}
      b={{ atras: <SillaL x={28} />, pose: sentadilla(0, 'cruzados') }}
      textos={['Sentado', 'Parado']}
    />
  ),
  sentadilla: () => <Dos etiqueta="Sentadilla: de parado a muslos paralelos al piso" a={{ pose: sentadilla(0) }} b={{ pose: sentadilla(1) }} />,
  'sentadilla-goblet': () => (
    <Dos
      etiqueta="Sentadilla goblet con una mancuerna contra el pecho"
      a={{ pose: sentadilla(0, 'goblet'), adelante: <Mancuerna en={[94, 56]} vertical /> }}
      b={{ pose: sentadilla(1, 'goblet'), adelante: <Mancuerna en={[98, 90]} vertical /> }}
    />
  ),
  'sentadilla-barra': () => (
    <Dos
      etiqueta="Sentadilla con barra en la espalda"
      a={{ pose: sentadilla(0, 'barra'), adelante: <Disco en={[72, 46]} r={18} /> }}
      b={{ pose: sentadilla(1, 'barra'), adelante: <Disco en={[76, 80]} r={18} /> }}
    />
  ),
  prensa: () => {
    const asiento = (
      <>
        <path d="M8,92 L60,150 L84,150" stroke="var(--line)" strokeWidth={10} strokeLinecap="round" fill="none" />
        <line x1={96} y1={150} x2={156} y2={70} stroke={metal} strokeWidth={2} />
      </>
    )
    const base = { cabeza: [14, 86] as P, cuello: [24, 100] as P, cadera: [62, 140] as P, codo: [48, 132] as P, mano: [66, 146] as P }
    return (
      <Dos
        etiqueta="Prensa de piernas: rodillas dobladas y después piernas casi estiradas"
        a={{ atras: asiento, pose: pose({ ...base, rod: [76, 96], pie: [110, 84] }), adelante: <line x1={100} y1={72} x2={120} y2={96} stroke={metal} strokeWidth={6} strokeLinecap="round" /> }}
        b={{ atras: asiento, pose: pose({ ...base, rod: [96, 100], pie: [132, 62] }), adelante: <line x1={122} y1={50} x2={142} y2={74} stroke={metal} strokeWidth={6} strokeLinecap="round" /> }}
      />
    )
  },
  'zancada-atras': () => (
    <Dos
      etiqueta="Zancada hacia atrás: un paso largo atrás y la rodilla casi toca el piso"
      a={{ pose: pose({ ...DE_PIE, codo: [86, 70], mano: [80, 96] }) }}
      b={{ pose: pose({ cabeza: [86, 54], cuello: [86, 68], cadera: [84, 120], rod: [108, 128], pie: [110, 165], punta: [124, 165], rodI: [62, 156], pieI: [36, 160], puntaI: [30, 165], codo: [92, 94], mano: [86, 118] }) }}
    />
  ),
  'subida-banco': () => (
    <Dos
      etiqueta="Subida al escalón: empujar con la pierna de arriba"
      a={{ atras: <Caja x={86} ancho={60} alto={30} />, pose: pose({ cabeza: [70, 38], cuello: [70, 52], cadera: [70, 104], rod: [104, 110], pie: [104, 136], punta: [118, 136], rodI: [66, 136], pieI: [62, 165], codo: [74, 80], mano: [76, 104] }) }}
      b={{ atras: <Caja x={86} ancho={60} alto={30} />, pose: pose({ cabeza: [108, 14], cuello: [108, 28], cadera: [108, 80], rod: [108, 108], pie: [108, 136], punta: [122, 136], rodI: [100, 110], pieI: [96, 136], codo: [110, 54], mano: [112, 80] }) }}
    />
  ),
  'sentadilla-bulgara': () => (
    <Dos
      etiqueta="Sentadilla búlgara con el pie de atrás sobre una silla"
      a={{ atras: <Caja x={4} ancho={40} alto={46} />, pose: pose({ cabeza: [84, 30], cuello: [84, 44], cadera: [82, 96], rod: [94, 130], pie: [100, 165], punta: [114, 165], rodI: [58, 118], pieI: [34, 120], codo: [86, 70], mano: [84, 96] }) }}
      b={{ atras: <Caja x={4} ancho={40} alto={46} />, pose: pose({ cabeza: [92, 62], cuello: [90, 76], cadera: [80, 126], rod: [112, 128], pie: [104, 165], punta: [118, 165], rodI: [62, 156], pieI: [34, 120], codo: [94, 102], mano: [90, 126] }) }}
    />
  ),
  'puente-gluteo': () => <Dos etiqueta="Puente de glúteos: cadera abajo y después arriba" a={{ pose: bocaArriba(0) }} b={{ pose: bocaArriba(1) }} />,
  'puente-una-pierna': () => <Dos etiqueta="Puente de glúteos a una pierna" a={{ pose: bocaArriba(0, true) }} b={{ pose: bocaArriba(1, true) }} />,
  'hip-thrust': () => (
    <Dos
      etiqueta="Hip thrust con la espalda en un banco y peso sobre la cadera"
      a={{ atras: <Banco x={2} ancho={40} alto={48} />, pose: pose({ cabeza: [24, 108], cuello: [38, 120], cadera: [74, 150], rod: [112, 128], pie: [120, 165], codo: [58, 136], mano: [74, 142] }), adelante: <Mancuerna en={[76, 140]} /> }}
      b={{ atras: <Banco x={2} ancho={40} alto={48} />, pose: pose({ cabeza: [24, 110], cuello: [38, 120], cadera: [84, 120], rod: [116, 124], pie: [120, 165], codo: [62, 112], mano: [84, 112] }), adelante: <Mancuerna en={[84, 110]} /> }}
    />
  ),
  'peso-muerto-rumano-mancuernas': () => (
    <Dos
      etiqueta="Peso muerto rumano: cadera atrás con la espalda recta"
      a={{ pose: pose({ ...DE_PIE, mano: [84, 100] }), adelante: <Mancuerna en={[84, 102]} /> }}
      b={{ pose: bisagra(1), adelante: <Mancuerna en={[116, 134]} /> }}
    />
  ),
  'peso-muerto-una-pierna': () => (
    <Dos
      etiqueta="Peso muerto a una pierna: la pierna de atrás sube mientras el torso baja"
      a={{ pose: pose({ ...DE_PIE, rodI: [76, 128], pieI: [70, 150] }) }}
      b={{ pose: pose({ cabeza: [140, 82], cuello: [126, 86], cadera: [72, 98], rod: [80, 132], pie: [82, 165], punta: [96, 165], rodI: [40, 96], pieI: [8, 94], codo: [126, 112], mano: [126, 138] }) }}
    />
  ),
  'peso-muerto-barra': () => (
    <Dos
      etiqueta="Peso muerto con barra: desde el piso hasta parado"
      a={{ pose: pose({ cabeza: [116, 68], cuello: [104, 76], cadera: [58, 112], rod: [98, 128], pie: [84, 165], punta: [98, 165], codo: [102, 112], mano: [100, 146] }), adelante: <Disco en={[96, 150]} r={18} /> }}
      b={{ pose: pose({ ...DE_PIE, mano: [86, 104] }), adelante: <Disco en={[86, 104]} r={18} /> }}
    />
  ),
  'swing-kettlebell': () => (
    <Dos
      etiqueta="Swing con kettlebell: atrás entre las piernas y adelante a la altura del pecho"
      a={{ pose: brazos(bisagra(0.9, 0.6), [92, 116], [80, 138]), adelante: <Kettlebell en={[78, 142]} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [100, 60], mano: [122, 56] }), adelante: <Kettlebell en={[128, 56]} /> }}
    />
  ),
  'elevacion-talones': () => (
    <Dos
      etiqueta="Elevación de talones en un escalón"
      a={{ atras: <><Caja x={66} ancho={60} alto={18} /><ParedL x={130} /></>, pose: pose({ ...DE_PIE, cabeza: [80, 16], cuello: [80, 30], cadera: [80, 84], rod: [80, 118], pie: [76, 156], punta: [92, 150], codo: [104, 46], mano: [129, 50] }) }}
      b={{ atras: <><Caja x={66} ancho={60} alto={18} /><ParedL x={130} /></>, pose: pose({ ...DE_PIE, cabeza: [82, 12], cuello: [82, 26], cadera: [82, 80], rod: [82, 112], pie: [84, 142], punta: [94, 150], codo: [106, 42], mano: [129, 46] }) }}
      textos={['Talones abajo', 'En puntas de pie']}
    />
  ),

  /* Tronco y accesorios */
  'bird-dog': () => <Dos etiqueta="Bird dog: en cuatro patas, estirar brazo y pierna contraria" a={{ pose: cuadrupedia() }} b={{ pose: cuadrupedia(true) }} />,
  'dead-bug': () => (
    <Dos
      etiqueta="Dead bug: boca arriba, brazos y rodillas arriba; estirar brazo y pierna contraria"
      a={{ pose: pose({ cabeza: [24, 154], cuello: [38, 158], cadera: [86, 160], rod: [88, 120], pie: [116, 120], codo: [40, 130], mano: [42, 104] }) }}
      b={{ pose: pose({ cabeza: [24, 154], cuello: [38, 158], cadera: [86, 160], rod: [88, 120], pie: [116, 120], codo: [20, 140], mano: [4, 146], rodI: [112, 150], pieI: [142, 150], codoI: [40, 130], manoI: [42, 104] }) }}
    />
  ),
  plancha: () => (
    <Dos
      etiqueta="Plancha sobre antebrazos con el cuerpo recto"
      a={{ pose: pose({ cabeza: [128, 124], cuello: [114, 132], cadera: [66, 146], rod: [40, 154], pie: [14, 162], codo: [114, 163], mano: [138, 163] }) }}
      b={{ pose: pose({ cabeza: [128, 124], cuello: [114, 132], cadera: [66, 146], rod: [40, 154], pie: [14, 162], codo: [114, 163], mano: [138, 163] }), adelante: <line x1={10} y1={150} x2={132} y2={114} stroke={acento} strokeDasharray="4 4" strokeWidth={2} /> }}
      textos={['Posición', 'Todo en línea']}
    />
  ),
  'plancha-lateral': () => (
    <Dos
      etiqueta="Plancha lateral: con rodillas apoyadas y con piernas estiradas"
      a={{ pose: pose({ cabeza: [124, 102], cuello: [112, 112], cadera: [66, 136], rod: [40, 160], pie: [66, 164], codo: [112, 163], mano: [134, 163], codoI: [92, 126], manoI: [70, 130] }) }}
      b={{ pose: pose({ cabeza: [130, 96], cuello: [118, 106], cadera: [70, 132], rod: [42, 148], pie: [14, 162], codo: [118, 163], mano: [140, 163], codoI: [96, 120], manoI: [74, 126] }) }}
      textos={['Más fácil (de frente)', 'Completa']}
    />
  ),
  'pallof-banda': () => (
    <Dos
      etiqueta="Press Pallof: la banda tira de costado y el cuerpo no gira"
      a={{ atras: <><ParedL x={4} /><Banda de={[11, 62]} a={[96, 62]} /></>, pose: pose({ ...DE_PIE, codo: [94, 72], mano: [96, 62] }) }}
      b={{ atras: <><ParedL x={4} /><Banda de={[11, 62]} a={[126, 60]} /></>, pose: pose({ ...DE_PIE, codo: [104, 58], mano: [126, 60] }) }}
    />
  ),
  'caminata-granjero': () => (
    <Dos
      etiqueta="Caminata del granjero con una mancuerna pesada en cada mano"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Mancuerna en={[82, 106]} /> }}
      b={{ pose: pose({ ...DE_PIE, rod: [92, 132], pie: [100, 165], punta: [114, 165], rodI: [72, 132], pieI: [62, 162], puntaI: [74, 165], mano: [82, 102] }), adelante: <Mancuerna en={[82, 106]} /> }}
      textos={['Parado derecho', 'Pasos cortos']}
    />
  ),
  'curl-biceps': () => (
    <Dos
      etiqueta="Curl de bíceps: codos quietos al costado"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Mancuerna en={[82, 104]} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [80, 72], mano: [96, 50] }), adelante: <Mancuerna en={[98, 48]} /> }}
    />
  ),
  'extension-triceps': () => (
    <Dos
      etiqueta="Extensión de tríceps: la mancuerna baja detrás de la cabeza y sube"
      a={{ pose: pose({ ...DE_PIE, codo: [84, 12], mano: [66, 30] }), adelante: <Mancuerna en={[64, 32]} vertical /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [84, 26], mano: [84, 12] }), adelante: <Mancuerna en={[84, 10]} /> }}
    />
  ),
  'elevaciones-laterales': () => (
    <Dos
      etiqueta="Elevaciones laterales vistas de frente: los brazos suben hasta la altura de los hombros"
      a={{ pose: pose({ cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [72, 132], pie: [70, 165], rodI: [88, 132], pieI: [90, 165], codo: [62, 72], mano: [58, 98], codoI: [98, 72], manoI: [102, 98] }), adelante: <><Mancuerna en={[58, 102]} vertical /><Mancuerna en={[102, 102]} vertical /></> }}
      b={{ pose: pose({ cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [72, 132], pie: [70, 165], rodI: [88, 132], pieI: [90, 165], codo: [52, 48], mano: [26, 50], codoI: [108, 48], manoI: [134, 50] }), adelante: <><Mancuerna en={[24, 50]} vertical /><Mancuerna en={[136, 50]} vertical /></> }}
      textos={['Inicio (de frente)', 'Final']}
    />
  ),
  /* Movilidad */
  'gato-camello': () => (
    <Dos
      etiqueta="Gato-camello: espalda redondeada hacia el techo y después hundida"
      a={{ pose: pose({ ...cuadrupediaBase, cabeza: [118, 124], cuello: [110, 116] }), adelante: <path d="M52,118 Q82,86 110,116" fill="none" stroke={acento} strokeWidth={3} strokeDasharray="5 4" /> }}
      b={{ pose: pose({ ...cuadrupediaBase, cabeza: [124, 98], cuello: [110, 112] }), adelante: <path d="M52,116 Q82,140 110,112" fill="none" stroke={acento} strokeWidth={3} strokeDasharray="5 4" /> }}
      textos={['Gato: redondeá', 'Camello: hundí']}
    />
  ),
  'rotacion-toracica': () => (
    <Dos
      etiqueta="Rotación de la espalda alta: codo hacia abajo y después hacia el techo"
      a={{ pose: pose({ ...cuadrupediaBase, codoI: [100, 134], manoI: [116, 118] }) }}
      b={{ pose: pose({ ...cuadrupediaBase, codoI: [112, 76], manoI: [122, 98] }), adelante: <path d="M128,128 A26,26 0 0 0 126,80" fill="none" stroke="var(--done)" strokeWidth={2.5} /> }}
    />
  ),
  'movilidad-tobillo': () => (
    <Dos
      etiqueta="Movilidad de tobillo: la rodilla va hacia la pared sin levantar el talón"
      a={{ atras: <ParedL x={150} />, pose: pose({ cabeza: [104, 30], cuello: [100, 44], cadera: [86, 96], rod: [112, 126], pie: [120, 165], punta: [138, 165], rodI: [64, 130], pieI: [44, 162], puntaI: [56, 165], codo: [124, 56], mano: [149, 54] }) }}
      b={{ atras: <ParedL x={150} />, pose: pose({ cabeza: [110, 32], cuello: [106, 46], cadera: [92, 98], rod: [146, 122], pie: [120, 165], punta: [138, 165], rodI: [66, 132], pieI: [44, 162], puntaI: [56, 165], codo: [128, 58], mano: [149, 56] }), adelante: <circle cx={120} cy={165} r={5} fill={acento} /> }}
      textos={['Inicio', 'Rodilla a la pared']}
    />
  ),
  'estiramiento-flexor-cadera': () => (
    <Dos
      etiqueta="Estocada baja: rodilla atrás en el piso y cadera hacia adelante"
      a={{ pose: pose({ cabeza: [80, 56], cuello: [80, 70], cadera: [76, 120], rod: [110, 122], pie: [112, 165], punta: [126, 165], rodI: [52, 162], pieI: [24, 164], codo: [86, 96], mano: [80, 120] }) }}
      b={{ pose: pose({ cabeza: [90, 56], cuello: [90, 70], cadera: [88, 122], rod: [116, 124], pie: [114, 165], punta: [128, 165], rodI: [56, 163], pieI: [26, 164], codo: [96, 96], mano: [90, 120] }), adelante: <path d="M70,140 L90,132" stroke={acento} strokeWidth={3} strokeLinecap="round" /> }}
      textos={['Inicio', 'Cadera adelante']}
    />
  ),

  /* Cardio */
  'caminata-rapida': () => (
    <Dos
      etiqueta="Caminata rápida: postura derecha y brazos doblados"
      a={{ pose: pose({ cabeza: [82, 30], cuello: [80, 44], cadera: [78, 98], rod: [92, 130], pie: [100, 164], punta: [114, 165], rodI: [70, 132], pieI: [58, 160], puntaI: [68, 165], codo: [68, 70], mano: [76, 90], codoI: [92, 70], manoI: [104, 62] }) }}
      b={{ pose: pose({ cabeza: [82, 30], cuello: [80, 44], cadera: [78, 98], rod: [70, 132], pie: [60, 162], punta: [70, 165], rodI: [92, 130], pieI: [100, 164], puntaI: [114, 165], codo: [92, 70], mano: [104, 62], codoI: [68, 70], manoI: [76, 90] }) }}
      textos={['Paso', 'Otro paso']}
    />
  ),
  'trote-suave': () => (
    <Dos
      etiqueta="Trote suave: pasos cortos y el pie cae debajo del cuerpo"
      a={{ pose: pose({ cabeza: [86, 30], cuello: [83, 44], cadera: [78, 96], rod: [96, 118], pie: [88, 150], punta: [100, 152], rodI: [70, 126], pieI: [52, 136], codo: [70, 66], mano: [82, 82], codoI: [96, 64], manoI: [108, 54] }) }}
      b={{ pose: pose({ cabeza: [86, 32], cuello: [83, 46], cadera: [78, 98], rod: [80, 132], pie: [80, 165], punta: [94, 165], rodI: [92, 118], pieI: [74, 132], codo: [96, 66], mano: [108, 56], codoI: [70, 68], manoI: [82, 84] }) }}
      textos={['En el aire', 'Pie debajo del cuerpo']}
    />
  ),
  soga: () => (
    <Dos
      etiqueta="Saltar la soga: saltos bajitos sobre las puntas"
      a={{ pose: pose({ ...DE_PIE, codo: [86, 74], mano: [96, 90], pie: [80, 165], punta: [94, 165] }), adelante: <path d="M96,90 Q140,160 82,168 Q30,160 64,90" fill="none" stroke={acento} strokeWidth={2.5} /> }}
      b={{ pose: pose({ ...DE_PIE, cabeza: [80, 24], cuello: [80, 38], cadera: [80, 92], rod: [82, 126], pie: [80, 158], punta: [92, 160], codo: [86, 68], mano: [96, 84] }), adelante: <path d="M96,84 Q130,20 80,12 Q40,20 64,84" fill="none" stroke={acento} strokeWidth={2.5} /> }}
      textos={['Soga abajo', 'Saltito de 2 o 3 cm']}
    />
  ),
  'marcha-rodillas-altas': () => (
    <Dos
      etiqueta="Marcha en el lugar con rodillas altas"
      a={{ pose: pose({ ...DE_PIE, rod: [104, 98], pie: [104, 132], punta: [116, 134], codo: [70, 68], mano: [76, 88], codoI: [94, 68], manoI: [104, 58] }) }}
      b={{ pose: pose({ ...DE_PIE, rodI: [104, 98], pieI: [104, 132], puntaI: [116, 134], rod: [80, 132], pie: [80, 165], codo: [94, 68], mano: [104, 58], codoI: [70, 68], manoI: [76, 88] }) }}
      textos={['Una rodilla', 'La otra']}
    />
  ),
  sombra: () => (
    <Dos
      etiqueta="Sombra: desde la guardia, el golpe sale y vuelve a la cara"
      a={{ pose: pose({ ...GUARDIA_E }) }}
      b={{ pose: pose({ ...GUARDIA_E, codo: [118, 52], mano: [142, 48] }) }}
      textos={['Guardia', 'Golpe y vuelve']}
    />
  ),
  'juego-pies': () => (
    <Dos
      etiqueta="Juego de pies: paso adelante sin cruzar los pies y con la guardia arriba"
      a={{ pose: pose({ ...GUARDIA_E }) }}
      b={{ pose: pose(correr(GUARDIA_E, 18)), adelante: <Flecha de={[64, 20]} a={[104, 20]} /> }}
      textos={['Guardia', 'Paso corto']}
    />
  ),
  'clase-golpes': () => {
    const bolsa = (
      <g>
        <line x1={140} x2={140} y1={6} y2={28} stroke={metal} strokeWidth={2} />
        <rect x={128} y={28} width={24} height={92} rx={9} fill="var(--surface-2)" stroke="var(--line)" />
      </g>
    )
    return (
      <Dos
        etiqueta="Clase de golpes: técnica y bolsa con profesor"
        a={{ atras: bolsa, pose: pose({ ...GUARDIA_E }) }}
        b={{ atras: bolsa, pose: pose({ ...GUARDIA_E, codoI: [110, 54], manoI: [126, 52] }) }}
        textos={['Guardia', 'Golpe a la bolsa']}
      />
    )
  },
  'clase-agarre': () => (
    <Dos
      etiqueta="Clase de agarre: postura baja de pie y movimientos en el suelo"
      a={{ pose: pose({ cabeza: [104, 64], cuello: [94, 74], cadera: [66, 104], rod: [90, 132], pie: [98, 165], punta: [110, 165], rodI: [52, 136], pieI: [40, 165], codo: [104, 96], mano: [118, 108] }) }}
      b={{ pose: pose({ cabeza: [20, 150], cuello: [34, 154], cadera: [80, 158], rod: [104, 132], pie: [100, 166], rodI: [110, 150], pieI: [134, 162], codo: [52, 138], mano: [64, 124] }) }}
      textos={['De pie', 'En el suelo']}
    />
  ),
  'extension-cuadriceps': () => {
    const rodillo = (en: P) => <circle cx={en[0]} cy={en[1]} r={7} fill={metal} />
    return (
      <Dos
        etiqueta="Extensión de cuádriceps: sentado, de rodillas dobladas a piernas estiradas"
        a={{ atras: <SillaL x={40} asiento={118} />, pose: pose({ cabeza: [58, 48], cuello: [56, 64], cadera: [60, 114], rod: [98, 116], pie: [100, 158], codo: [62, 92], mano: [76, 114] }), adelante: rodillo([104, 154]) }}
        b={{ atras: <SillaL x={40} asiento={118} />, pose: pose({ cabeza: [58, 48], cuello: [56, 64], cadera: [60, 114], rod: [98, 116], pie: [138, 110], codo: [62, 92], mano: [76, 114] }), adelante: rodillo([140, 116]) }}
        textos={['Abajo', 'Piernas estiradas']}
      />
    )
  },
  'curl-femoral': () => {
    const rodillo = (en: P) => <circle cx={en[0]} cy={en[1]} r={7} fill={metal} />
    return (
      <Dos
        etiqueta="Curl femoral: boca abajo, los talones van hacia la cola"
        a={{ atras: <Banco x={10} ancho={124} alto={52} />, pose: pose({ cabeza: [22, 104], cuello: [36, 110], cadera: [88, 112], rod: [122, 112], pie: [150, 110], codo: [30, 124], mano: [18, 116] }), adelante: rodillo([150, 102]) }}
        b={{ atras: <Banco x={10} ancho={124} alto={52} />, pose: pose({ cabeza: [22, 104], cuello: [36, 110], cadera: [88, 112], rod: [122, 112], pie: [112, 74], codo: [30, 124], mano: [18, 116] }), adelante: rodillo([118, 70]) }}
        textos={['Piernas estiradas', 'Talones arriba']}
      />
    )
  },
  fondos: () => {
    const paralelas = (
      <g stroke={metal} strokeWidth={4} strokeLinecap="round">
        <line x1={50} x2={130} y1={96} y2={96} />
        <line x1={58} x2={58} y1={96} y2={168} />
        <line x1={122} x2={122} y1={96} y2={168} />
      </g>
    )
    return (
      <Dos
        etiqueta="Fondos en paralelas: de brazos estirados a codos doblados"
        a={{ atras: paralelas, pose: pose({ cabeza: [88, 40], cuello: [86, 56], cadera: [80, 108], rod: [78, 138], pie: [66, 150], codo: [88, 78], mano: [88, 96] }) }}
        b={{ atras: paralelas, pose: pose({ cabeza: [94, 62], cuello: [90, 78], cadera: [80, 126], rod: [72, 152], pie: [58, 160], codo: [70, 80], mano: [88, 96] }) }}
        textos={['Arriba', 'Abajo']}
      />
    )
  },
  'remo-barra': () => (
    <Dos
      etiqueta="Remo con barra: inclinado con la espalda recta, la barra va a la panza"
      a={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [104, 104], mano: [104, 132] }), adelante: <Disco en={[104, 134]} r={16} /> }}
      b={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [82, 80], mano: [92, 106] }), adelante: <Disco en={[92, 108]} r={16} /> }}
      textos={['Brazos estirados', 'Barra a la panza']}
    />
  ),
  'press-militar-barra': () => (
    <Dos
      etiqueta="Press militar con barra: de arriba del pecho a brazos estirados sobre la cabeza"
      a={{ pose: pose({ ...DE_PIE, codo: [96, 66], mano: [94, 48] }), adelante: <Disco en={[94, 46]} r={16} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [86, 26], mano: [84, 10] }), adelante: <Disco en={[84, 10]} r={16} /> }}
      textos={['Barra en el pecho', 'Arriba']}
    />
  ),
  crunch: () => (
    <Dos
      etiqueta="Crunch: boca arriba, despegar los hombros del piso"
      a={{ pose: pose({ cabeza: [24, 154], cuello: [38, 158], cadera: [86, 160], rod: [106, 128], pie: [124, 165], codo: [44, 146], mano: [32, 144] }) }}
      b={{ pose: pose({ cabeza: [38, 130], cuello: [48, 142], cadera: [86, 160], rod: [106, 128], pie: [124, 165], codo: [58, 132], mano: [46, 128] }) }}
      textos={['Apoyado', 'Hombros arriba']}
    />
  ),
  /* Variantes por implemento (barra, mancuernas, banda) */
  'press-militar-banda': () => (
    <Dos
      etiqueta="Press militar con banda: parado sobre la banda, de los hombros hasta arriba"
      a={{ pose: pose({ ...DE_PIE, codo: [98, 62], mano: [98, 42] }), adelante: <Banda de={[98, 42]} a={[84, 165]} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [86, 26], mano: [86, 10] }), adelante: <Banda de={[86, 10]} a={[84, 165]} /> }}
    />
  ),
  'remo-inclinado-mancuernas': () => (
    <Dos
      etiqueta="Remo inclinado con mancuernas: inclinado con la espalda recta, las mancuernas van a la panza"
      a={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [104, 104], mano: [104, 132] }), adelante: <Mancuerna en={[104, 134]} /> }}
      b={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [82, 80], mano: [92, 106] }), adelante: <Mancuerna en={[92, 108]} /> }}
      textos={['Brazos estirados', 'Codos atrás']}
    />
  ),
  'remo-inclinado-banda': () => (
    <Dos
      etiqueta="Remo inclinado con banda: parado sobre la banda, inclinado, tirás hacia la panza"
      a={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [104, 104], mano: [104, 132] }), adelante: <Banda de={[104, 132]} a={[72, 165]} /> }}
      b={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [82, 80], mano: [92, 106] }), adelante: <Banda de={[92, 106]} a={[72, 165]} /> }}
      textos={['Brazos estirados', 'Codos atrás']}
    />
  ),
  'curl-barra': () => (
    <Dos
      etiqueta="Curl de bíceps con barra: codos quietos al costado, la barra sube al pecho"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Disco en={[82, 104]} r={13} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [80, 72], mano: [96, 50] }), adelante: <Disco en={[98, 50]} r={13} /> }}
    />
  ),
  'curl-banda': () => (
    <Dos
      etiqueta="Curl de bíceps con banda: parado sobre la banda, codos quietos"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Banda de={[82, 102]} a={[84, 165]} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [80, 72], mano: [96, 50] }), adelante: <Banda de={[96, 50]} a={[84, 165]} /> }}
    />
  ),
  'curl-martillo': () => (
    <Dos
      etiqueta="Curl martillo: palmas enfrentadas, la mancuerna parada sube hasta el hombro"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Mancuerna en={[82, 104]} vertical /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [80, 72], mano: [96, 50] }), adelante: <Mancuerna en={[97, 50]} vertical /> }}
      textos={['Palmas enfrentadas', 'Arriba']}
    />
  ),
  'curl-martillo-banda': () => (
    <Dos
      etiqueta="Curl martillo con banda: palmas enfrentadas, parado sobre la banda"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Banda de={[82, 102]} a={[84, 165]} /> }}
      b={{ pose: pose({ ...DE_PIE, codo: [80, 72], mano: [96, 50] }), adelante: <Banda de={[96, 50]} a={[84, 165]} /> }}
      textos={['Palmas enfrentadas', 'Arriba']}
    />
  ),
  'elevaciones-laterales-banda': () => (
    <Dos
      etiqueta="Elevaciones laterales con banda vistas de frente: los brazos suben hasta la altura de los hombros"
      a={{ pose: pose({ cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [72, 132], pie: [70, 165], rodI: [88, 132], pieI: [90, 165], codo: [62, 72], mano: [58, 98], codoI: [98, 72], manoI: [102, 98] }), adelante: <><Banda de={[58, 98]} a={[76, 165]} /><Banda de={[102, 98]} a={[84, 165]} /></> }}
      b={{ pose: pose({ cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [72, 132], pie: [70, 165], rodI: [88, 132], pieI: [90, 165], codo: [52, 48], mano: [26, 50], codoI: [108, 48], manoI: [134, 50] }), adelante: <><Banda de={[26, 50]} a={[76, 165]} /><Banda de={[134, 50]} a={[84, 165]} /></> }}
      textos={['Inicio (de frente)', 'Final']}
    />
  ),
  'extension-triceps-banda': () => (
    <Dos
      etiqueta="Extensión de tríceps con banda: la banda pisada atrás, las manos van de detrás de la cabeza hasta arriba"
      a={{ pose: pose({ ...DE_PIE, rodI: [70, 134], pieI: [58, 165], codo: [84, 12], mano: [66, 30] }), adelante: <Banda de={[66, 30]} a={[58, 165]} /> }}
      b={{ pose: pose({ ...DE_PIE, rodI: [70, 134], pieI: [58, 165], codo: [84, 26], mano: [84, 8] }), adelante: <Banda de={[84, 8]} a={[58, 165]} /> }}
    />
  ),
  'pajaro-mancuernas': () => (
    <Dos
      etiqueta="Pájaro con mancuernas: inclinado, los brazos se abren hasta la altura de la espalda"
      a={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [108, 100], mano: [110, 128] }), adelante: <Mancuerna en={[110, 130]} vertical /> }}
      b={{ pose: pose({ cabeza: [124, 62], cuello: [110, 70], cadera: [62, 92], rod: [74, 130], pie: [66, 165], punta: [80, 165], codo: [104, 58], mano: [100, 40], codoI: [104, 58], manoI: [100, 40] }), adelante: <><Mancuerna en={[100, 38]} vertical /><Flecha de={[124, 120]} a={[118, 56]} /></> }}
      textos={['Brazos colgando', 'Abiertos']}
    />
  ),
  'pajaro-banda': () => (
    <Dos
      etiqueta="Pájaro con banda visto de frente: la banda adelante del pecho se estira abriendo los brazos"
      a={{ pose: pose({ cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [72, 132], pie: [70, 165], rodI: [88, 132], pieI: [90, 165], codo: [70, 58], mano: [66, 62], codoI: [90, 58], manoI: [94, 62] }), adelante: <line x1={66} x2={94} y1={62} y2={62} stroke={acento} strokeWidth={3} /> }}
      b={{ pose: pose({ cabeza: [80, 30], cuello: [80, 44], cadera: [80, 98], rod: [72, 132], pie: [70, 165], rodI: [88, 132], pieI: [90, 165], codo: [52, 52], mano: [26, 54], codoI: [108, 52], manoI: [134, 54] }), adelante: <path d="M26,54 Q80,62 134,54" fill="none" stroke={acento} strokeWidth={3} /> }}
      textos={['Inicio (de frente)', 'Abierta']}
    />
  ),
  'encogimientos-mancuernas': () => (
    <Dos
      etiqueta="Encogimientos con mancuernas: los hombros suben derecho hacia las orejas"
      a={{ pose: pose({ ...DE_PIE, mano: [82, 102] }), adelante: <Mancuerna en={[82, 106]} /> }}
      b={{ pose: pose({ ...DE_PIE, cuello: [80, 38], codo: [81, 66], mano: [82, 94] }), adelante: <><Mancuerna en={[82, 98]} /><Flecha de={[104, 60]} a={[104, 40]} /></> }}
      textos={['Hombros abajo', 'Hombros arriba']}
    />
  ),
  'encogimientos-barra': () => (
    <Dos
      etiqueta="Encogimientos con barra: los hombros suben derecho hacia las orejas"
      a={{ pose: pose({ ...DE_PIE, mano: [86, 102] }), adelante: <Disco en={[88, 104]} r={13} /> }}
      b={{ pose: pose({ ...DE_PIE, cuello: [80, 38], codo: [83, 66], mano: [86, 94] }), adelante: <><Disco en={[88, 96]} r={13} /><Flecha de={[110, 60]} a={[110, 40]} /></> }}
      textos={['Hombros abajo', 'Hombros arriba']}
    />
  ),
}

export function DibujoEjercicio({ id }: { id: string }) {
  const D = DIBUJOS[id]
  return D ? <>{D()}</> : null
}

export const tieneDibujo = (id: string) => id in DIBUJOS
