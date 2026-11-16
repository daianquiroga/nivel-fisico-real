/* Dibujos del módulo de combate. Técnicas: de costado, mirando a la derecha, con la guardia de base en tenue.
   Juego de pies: huellas vistas desde arriba. Guardia "ortodoxa" (pie izquierdo adelante); los zurdos la ven espejada. */
import type { ReactNode } from 'react'
import { Figura, Flecha, Lienzo, Piso, Texto, type Pose } from '../components/Figura'

type P = [number, number]
const acento = 'var(--accent)'
const hecho = 'var(--done)'

export const GUARDIA: Pose = {
  cabeza: [138, 34],
  cuello: [136, 50],
  cadera: [128, 100],
  rodD: [150, 132],
  pieD: [160, 166],
  puntaD: [174, 166],
  rodI: [112, 134],
  pieI: [100, 166],
  puntaI: [112, 164],
  codoD: [152, 72],
  manoD: [160, 50],
  codoI: [140, 76],
  manoI: [148, 52],
}

const g = (o: Partial<Pose>): Pose => ({ ...GUARDIA, ...o })

/** Cambia de lado los brazos o las piernas, para que el que hace la técnica quede resaltado (lado cercano). */
function resaltar(p: Pose, que: 'brazos' | 'piernas'): Pose {
  if (que === 'brazos') return { ...p, codoD: p.codoI, manoD: p.manoI, codoI: p.codoD, manoI: p.manoD }
  return { ...p, rodD: p.rodI, pieD: p.pieI, puntaD: p.puntaI, rodI: p.rodD, pieI: p.pieD, puntaI: p.puntaD }
}

/** Flecha curva (curva cuadrática con punta dorada). */
export function FlechaCurva({ de, control, a }: { de: P; control: P; a: P }) {
  const ang = Math.atan2(a[1] - control[1], a[0] - control[0])
  const l = 8
  const p1: P = [a[0] - l * Math.cos(ang - 0.5), a[1] - l * Math.sin(ang - 0.5)]
  const p2: P = [a[0] - l * Math.cos(ang + 0.5), a[1] - l * Math.sin(ang + 0.5)]
  return (
    <g stroke={hecho} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${de[0]},${de[1]} Q${control[0]},${control[1]} ${a[0]},${a[1]}`} />
      <path d={`M${p1[0]},${p1[1]} L${a[0]},${a[1]} L${p2[0]},${p2[1]}`} />
    </g>
  )
}

interface DefTecnica {
  pose: Pose
  flechas?: ReactNode
  extra?: ReactNode
  /** Sin la guardia tenue de fondo (técnicas de suelo). */
  sinGuardia?: boolean
}

const recta = (de: P, a: P) => <Flecha de={de} a={a} />
const curva = (de: P, c: P, a: P) => <FlechaCurva de={de} control={c} a={a} />
const rival = (x: number, y: number) => <circle cx={x} cy={y} r={10} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="4 3" />

const TECNICAS: Record<string, DefTecnica> = {
  jab: { pose: g({ codoD: [184, 52], manoD: [210, 48] }), flechas: recta([170, 36], [214, 36]) },
  directo: {
    pose: resaltar(g({ cadera: [132, 100], cuello: [142, 50], cabeza: [147, 34], codoI: [178, 54], manoI: [208, 50], codoD: [150, 70], manoD: [152, 46], puntaI: [108, 158] }), 'brazos'),
    flechas: recta([172, 36], [214, 36]),
  },
  gancho: { pose: g({ codoD: [172, 50], manoD: [194, 56], cuello: [134, 50], cabeza: [136, 34] }), flechas: curva([148, 86], [196, 24], [204, 58]) },
  uppercut: {
    pose: resaltar(g({ cadera: [128, 104], rodD: [152, 136], rodI: [110, 138], codoI: [154, 86], manoI: [170, 48] }), 'brazos'),
    flechas: curva([146, 112], [178, 96], [176, 42]),
  },
  esquive: { pose: g({ cabeza: [152, 46], cuello: [145, 60], cadera: [127, 102], codoD: [160, 82], manoD: [166, 60], codoI: [150, 86], manoI: [158, 62] }), flechas: recta([136, 22], [156, 34]) },
  rolido: {
    pose: g({ cadera: [128, 116], rodD: [154, 140], rodI: [108, 144], cuello: [146, 76], cabeza: [155, 63], codoD: [160, 94], manoD: [164, 68], codoI: [150, 98], manoI: [152, 70] }),
    flechas: curva([110, 40], [152, 120], [196, 40]),
  },
  bloqueo: {
    pose: g({ manoD: [152, 28], codoD: [154, 64], manoI: [144, 30], codoI: [142, 66] }),
    flechas: recta([234, 34], [170, 34]),
    extra: <Texto x={250} y={60}>golpe que viene</Texto>,
  },
  chequeo: {
    pose: g({ rodD: [160, 102], pieD: [156, 138], puntaD: [168, 140], pieI: [104, 166], rodI: [112, 134], cadera: [126, 98], cuello: [132, 50], cabeza: [135, 34], manoD: [154, 34], codoD: [154, 66], manoI: [144, 36], codoI: [140, 68] }),
    flechas: recta([240, 126], [176, 122]),
    extra: <Texto x={252} y={150}>patada que viene</Texto>,
  },
  'patada-baja': {
    pose: resaltar(g({ rodD: [154, 132], cadera: [130, 98], cuello: [124, 50], cabeza: [121, 34], codoD: [134, 70], manoD: [140, 48], codoI: [112, 82], manoI: [98, 98], rodI: [174, 116], pieI: [206, 132], puntaI: [214, 130] }), 'piernas'),
    flechas: curva([108, 150], [160, 174], [212, 140]),
  },
  'patada-media': {
    pose: resaltar(g({ rodD: [154, 132], cadera: [130, 96], cuello: [118, 52], cabeza: [111, 38], codoD: [126, 72], manoD: [132, 50], codoI: [104, 84], manoI: [90, 100], rodI: [170, 92], pieI: [210, 88], puntaI: [218, 86] }), 'piernas'),
    flechas: curva([110, 124], [172, 136], [216, 96]),
  },
  teep: {
    pose: g({ pieI: [104, 166], rodI: [114, 134], cadera: [124, 98], cuello: [114, 50], cabeza: [109, 34], codoD: [130, 72], manoD: [136, 50], codoI: [122, 76], manoI: [126, 54], rodD: [158, 84], pieD: [198, 96], puntaD: [202, 84] }),
    flechas: recta([176, 112], [218, 104]),
  },
  rodilla: {
    pose: resaltar(g({ cadera: [140, 98], cuello: [140, 50], cabeza: [146, 34], codoD: [168, 54], manoD: [188, 40], codoI: [162, 58], manoI: [184, 42], rodI: [172, 88], pieI: [146, 122], puntaI: [140, 130], pieD: [150, 166], rodD: [148, 132] }), 'piernas'),
    flechas: recta([150, 124], [178, 86]),
    extra: rival(204, 40),
  },
  codo: { pose: g({ codoD: [178, 44], manoD: [152, 40], cuello: [138, 50], cabeza: [141, 34] }), flechas: curva([162, 74], [204, 54], [182, 26]), extra: rival(212, 42) },
  'gyaku-zuki': {
    pose: resaltar(g({ pieD: [206, 166], puntaD: [218, 166], rodD: [192, 134], cadera: [142, 110], rodI: [112, 140], pieI: [80, 166], puntaI: [92, 166], cuello: [148, 62], cabeza: [152, 46], codoI: [184, 72], manoI: [214, 72], codoD: [138, 96], manoD: [148, 106] }), 'brazos'),
    flechas: recta([192, 58], [224, 58]),
  },
  'patada-lateral': {
    pose: {
      cabeza: [100, 50],
      cuello: [113, 61],
      cadera: [142, 100],
      rodI: [124, 134],
      pieI: [118, 166],
      puntaI: [130, 166],
      rodD: [178, 94],
      pieD: [222, 90],
      puntaD: [224, 80],
      codoD: [120, 82],
      manoD: [112, 62],
      codoI: [114, 86],
      manoI: [104, 66],
    },
    flechas: recta([190, 74], [228, 74]),
  },
  derribo: {
    pose: {
      cabeza: [190, 98],
      cuello: [176, 96],
      cadera: [134, 106],
      rodD: [170, 164],
      pieD: [140, 166],
      rodI: [114, 138],
      pieI: [94, 166],
      puntaI: [106, 166],
      codoD: [198, 118],
      manoD: [220, 126],
      codoI: [194, 122],
      manoI: [216, 130],
    },
    flechas: recta([150, 78], [204, 78]),
    extra: <Texto x={262} y={150}>rodilla al piso</Texto>,
  },
  sprawl: {
    pose: {
      cabeza: [204, 128],
      cuello: [189, 132],
      cadera: [134, 152],
      rodD: [98, 160],
      pieD: [62, 166],
      rodI: [100, 163],
      pieI: [66, 167],
      codoD: [206, 150],
      manoD: [214, 166],
      codoI: [202, 152],
      manoI: [210, 167],
    },
    flechas: recta([124, 128], [74, 146]),
    extra: <Texto x={150} y={186}>cadera al piso</Texto>,
  },
  clinch: { pose: g({ cabeza: [148, 36], cuello: [144, 52], cadera: [134, 100], codoD: [178, 58], manoD: [192, 32], codoI: [174, 62], manoI: [190, 36] }), extra: rival(204, 42) },
  caida: {
    sinGuardia: true,
    pose: {
      cabeza: [88, 140],
      cuello: [104, 150],
      cadera: [150, 158],
      rodD: [186, 132],
      pieD: [208, 114],
      rodI: [182, 136],
      pieI: [202, 120],
      codoD: [86, 162],
      manoD: [66, 166],
      codoI: [88, 164],
      manoI: [68, 168],
      ojosCerrados: false,
    },
    flechas: recta([60, 136], [64, 158]),
    extra: <Texto x={90} y={112}>mentón al pecho</Texto>,
  },
  puente: {
    sinGuardia: true,
    pose: { cabeza: [80, 152], cuello: [96, 152], cadera: [150, 116], rodD: [184, 124], pieD: [194, 166], rodI: [180, 128], pieI: [188, 166], codoD: [100, 162], manoD: [84, 167], codoI: [104, 164], manoI: [90, 168] },
    flechas: recta([150, 156], [150, 100]),
    extra: <Texto x={236} y={100}>cadera arriba, explosivo</Texto>,
  },
  'escape-cadera': {
    sinGuardia: true,
    pose: { cabeza: [80, 148], cuello: [96, 152], cadera: [148, 156], rodD: [178, 128], pieD: [170, 166], rodI: [186, 146], pieI: [210, 160], codoD: [118, 134], manoD: [134, 118], codoI: [110, 140], manoI: [126, 124] },
    flechas: (
      <>
        {recta([154, 138], [116, 138])}
      </>
    ),
    extra: <Texto x={236} y={124}>empujá con el pie</Texto>,
  },
  levantarse: {
    sinGuardia: true,
    pose: { cabeza: [146, 88], cuello: [140, 104], cadera: [130, 148], rodD: [168, 138], pieD: [176, 166], rodI: [164, 160], pieI: [204, 166], codoI: [112, 140], manoI: [100, 166], codoD: [158, 112], manoD: [156, 90] },
    flechas: curva([200, 152], [150, 110], [104, 124]),
    extra: <Texto x={250} y={140}>pierna atrás</Texto>,
  },
}

export const tieneDibujoTecnica = (id: string) => id in TECNICAS

export function DibujoTecnica({ id }: { id: string }) {
  const t = TECNICAS[id]
  if (!t) return null
  return (
    <Lienzo etiqueta={`Cómo se hace: ${id}`} alto={192}>
      <Piso />
      {!t.sinGuardia && (
        <g opacity={0.28}>
          <Figura pose={GUARDIA} />
        </g>
      )}
      <Figura pose={t.pose} color={acento} />
      {t.flechas}
      {t.extra}
    </Lienzo>
  )
}

/* ---------- Juego de pies, visto desde arriba ---------- */

/** Huella: x, y del centro y ángulo en grados (0 = mira a la derecha, hacia el rival). */
function Huella({ x, y, ang, tenue, n }: { x: number; y: number; ang: number; tenue?: boolean; n?: string }) {
  return (
    <g opacity={tenue ? 0.3 : 1}>
      <g transform={`translate(${x},${y}) rotate(${ang})`}>
        <ellipse cx={0} cy={0} rx={17} ry={7} fill={tenue ? 'none' : 'var(--text-2)'} stroke="var(--text-2)" strokeWidth={2} strokeDasharray={tenue ? '4 3' : undefined} />
        <circle cx={13} cy={0} r={4} fill={tenue ? 'none' : 'var(--text)'} />
      </g>
      {n && (
        <Texto x={x} y={y - 14} color={acento}>
          {n}
        </Texto>
      )}
    </g>
  )
}

const ADELANTE: [number, number, number] = [180, 80, -8]
const ATRAS: [number, number, number] = [112, 110, 32]

function rotar([x, y, a]: [number, number, number], centro: P, grados: number): [number, number, number] {
  const r = (grados * Math.PI) / 180
  const dx = x - centro[0]
  const dy = y - centro[1]
  return [centro[0] + dx * Math.cos(r) - dy * Math.sin(r), centro[1] + dx * Math.sin(r) + dy * Math.cos(r), a + grados]
}

/** Punto de control para dibujar el arco de un pivote. */
function controlArco(desde: [number, number, number], centro: P, grados: number): P {
  const m = rotar(desde, centro, grados / 2)
  return [centro[0] + (m[0] - centro[0]) * 1.3, centro[1] + (m[1] - centro[1]) * 1.3]
}

const mover = ([x, y, a]: [number, number, number], dx: number, dy: number): [number, number, number] => [x + dx, y + dy, a]
const H = (p: [number, number, number], o: { tenue?: boolean; n?: string } = {}) => <Huella x={p[0]} y={p[1]} ang={p[2]} {...o} />

function Rival() {
  return (
    <g>
      <Texto x={296} y={96} ancla="end">
        rival →
      </Texto>
    </g>
  )
}

const PIES: Record<number, () => ReactNode> = {
  1: () => (
    <>
      {H(ADELANTE, { tenue: true })}
      {H(ATRAS, { tenue: true })}
      {H(mover(ADELANTE, 44, 0), { n: '1' })}
      {H(mover(ATRAS, 44, 0), { n: '2' })}
      <Flecha de={[192, 98]} a={[222, 98]} />
      <Flecha de={[124, 128]} a={[154, 128]} />
      <Rival />
    </>
  ),
  2: () => (
    <>
      {H(mover(ADELANTE, 0, 22), { tenue: true })}
      {H(mover(ATRAS, 0, 22), { tenue: true })}
      {H(mover(ADELANTE, 0, -22), { n: '1' })}
      {H(mover(ATRAS, 0, -22), { n: '2' })}
      <Flecha de={[206, 104]} a={[206, 62]} />
      <Flecha de={[138, 134]} a={[138, 92]} />
      <Texto x={40} y={40} ancla="start">
        sin cruzar
      </Texto>
      <Rival />
    </>
  ),
  3: () => {
    const c: P = [ADELANTE[0], ADELANTE[1]]
    const fin = rotar(ATRAS, c, 70)
    return (
      <>
        {H(ADELANTE, { n: 'eje' })}
        {H(ATRAS, { tenue: true })}
        {H(fin)}
        <FlechaCurva de={[ATRAS[0] - 10, ATRAS[1] + 10]} control={controlArco(mover(ATRAS, -10, 10), c, 70)} a={[fin[0] - 16, fin[1] + 8]} />
        <Texto x={60} y={170} ancla="start">
          girás sobre la punta del pie de adelante
        </Texto>
        <Rival />
      </>
    )
  },
  4: () => {
    const paso = mover(ADELANTE, 6, -34)
    const atrasPaso = mover(ATRAS, 6, -34)
    const fin = rotar(atrasPaso, [paso[0], paso[1]], -60)
    return (
      <>
        {H(ADELANTE, { tenue: true })}
        {H(ATRAS, { tenue: true })}
        {H(paso, { n: '1' })}
        {H(fin, { n: '2' })}
        <Flecha de={[194, 66]} a={[194, 40]} />
        <FlechaCurva de={[atrasPaso[0] - 4, atrasPaso[1] + 12]} control={controlArco(mover(atrasPaso, -4, 12), [paso[0], paso[1]], -60)} a={[fin[0] - 6, fin[1] + 12]} />
        <Texto x={40} y={170} ancla="start">
          paso al costado + pivote: salís de la línea
        </Texto>
        <Rival />
      </>
    )
  },
  5: () => (
    <>
      {H(ADELANTE, { tenue: true })}
      {H(ATRAS, { tenue: true })}
      {H([180, 110, 32], { n: 'cambio' })}
      {H([112, 80, -8])}
      <path d="M40,130 l10,-10 l10,10 l10,-10 l10,10 l10,-10 l10,10" stroke={hecho} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Texto x={70} y={150}>
        rebote suave
      </Texto>
      <Rival />
    </>
  ),
  6: () => (
    <>
      {H(ATRAS, { tenue: true })}
      {H(ADELANTE, { tenue: true })}
      {H(mover(ADELANTE, 40, 0))}
      {H(mover(ATRAS, 40, 0))}
      <Flecha de={[150, 60]} a={[236, 60]} />
      <Texto x={194} y={48}>
        entrás con jab
      </Texto>
      <Flecha de={[200, 126]} a={[150, 160]} />
      <Texto x={234} y={150}>
        salís en ángulo
      </Texto>
    </>
  ),
}

export const tieneDibujoPies = (n: number) => n in PIES

export function DibujoPies({ nivel }: { nivel: number }) {
  const D = PIES[nivel]
  if (!D) return null
  return (
    <Lienzo etiqueta={`Juego de pies, nivel ${nivel}, visto desde arriba`} alto={180}>
      <D />
    </Lienzo>
  )
}

/* ---------- Dibujos de los artículos de combate ---------- */

export function DibujoGuardia() {
  const nota = (x: number, y: number, lx: number, ly: number, t: string) => (
    <g key={t}>
      <circle cx={x} cy={y} r={4} fill={acento} />
      <path d={`M${x},${y} L${lx},${ly}`} stroke="var(--line)" strokeDasharray="3 3" />
      <Texto x={lx + 4} y={ly + 4} ancla="start">
        {t}
      </Texto>
    </g>
  )
  return (
    <Lienzo etiqueta="Guardia: manos a la cara, mentón bajo, codos cerrados, rodillas sueltas, pies al ancho de los hombros" alto={192}>
      <Piso />
      <Figura pose={GUARDIA} color={acento} />
      {nota(154, 50, 196, 26, 'manos a la cara')}
      {nota(140, 44, 196, 48, 'mentón bajo')}
      {nota(148, 76, 196, 76, 'codos cerrados')}
      {nota(150, 132, 196, 124, 'rodillas sueltas')}
      {nota(130, 166, 196, 154, 'pies separados')}
    </Lienzo>
  )
}

export function DibujoVendaje() {
  return (
    <Lienzo etiqueta="Vendaje: 1 muñeca, 2 nudillos, 3 entre los dedos y pulgar, 4 cierre en la muñeca" alto={190}>
      <g transform="translate(110,20)">
        <rect x={0} y={60} width={80} height={70} rx={14} fill="var(--surface-2)" stroke="var(--text-2)" strokeWidth={2.5} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={2 + i * 20} y={18 + (i === 0 || i === 3 ? 10 : 0)} width={17} height={48 - (i === 0 || i === 3 ? 10 : 0)} rx={8} fill="var(--surface-2)" stroke="var(--text-2)" strokeWidth={2.5} />
        ))}
        <rect x={-26} y={78} width={30} height={14} rx={7} transform="rotate(-35 -10 85)" fill="var(--surface-2)" stroke="var(--text-2)" strokeWidth={2.5} />
        <rect x={10} y={130} width={60} height={30} fill="var(--surface-2)" stroke="var(--text-2)" strokeWidth={2.5} />
        <path d="M10,136 L70,136 M10,146 L70,146 M10,156 L70,156" stroke={acento} strokeWidth={5} />
        <path d="M0,66 L80,66 M0,76 L80,76 M0,86 L80,86" stroke={hecho} strokeWidth={5} />
        <path d="M70,130 L20,66 M10,130 L60,66" stroke={acento} strokeWidth={4} opacity={0.75} />
      </g>
      <Texto x={210} y={170} ancla="start" color={acento}>
        1 y 4: muñeca
      </Texto>
      <Texto x={210} y={96} ancla="start" color={hecho}>
        2: nudillos
      </Texto>
      <Texto x={210} y={126} ancla="start" color={acento}>
        3: cruces y pulgar
      </Texto>
    </Lienzo>
  )
}

export function DibujoSparring() {
  return (
    <Lienzo etiqueta="Sparring: con profesor, casco, protector bucal y guantes de entrenamiento" alto={192}>
      <Piso />
      <Figura pose={GUARDIA} color={acento} />
      <path d="M124,30 Q138,10 152,30" stroke="var(--text-2)" strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={160} cy={50} r={9} fill="var(--text-2)" />
      <circle cx={148} cy={52} r={9} fill="var(--text-2)" />
      <Figura
        pose={{ cabeza: [262, 40], cuello: [262, 56], cadera: [262, 108], rodD: [266, 138], pieD: [266, 166], rodI: [258, 138], pieI: [258, 166], codoD: [246, 80], manoD: [236, 64], codoI: [276, 82], manoI: [280, 106] }}
      />
      <Texto x={40} y={22} ancla="start">
        casco y protector bucal
      </Texto>
      <Texto x={186} y={46} ancla="start">
        guantes
      </Texto>
      <Texto x={262} y={186}>
        profe mirando
      </Texto>
    </Lienzo>
  )
}

export function DibujoDistancias() {
  const zonas: [string, number][] = [
    ['clinch', 40],
    ['corta', 50],
    ['media', 60],
    ['larga', 80],
  ]
  let x = 30
  return (
    <Lienzo etiqueta="Distancias: clinch, corta, media y larga, y el suelo" alto={172}>
      <Figura
        pose={{ cabeza: [20, 34], cuello: [20, 50], cadera: [18, 100], rodD: [26, 132], pieD: [30, 166], rodI: [12, 134], pieI: [8, 166], codoD: [30, 72], manoD: [34, 52], codoI: [24, 76], manoI: [28, 54] }}
        color={acento}
      />
      {zonas.map(([t, w], i) => {
        const x0 = x
        x += w
        return (
          <g key={t}>
            <rect x={x0 + 14} y={70} width={w - 2} height={26} rx={4} fill={i % 2 ? 'var(--surface-2)' : 'var(--line)'} />
            <Texto x={x0 + 14 + w / 2} y={88} color="var(--text-2)">
              {t}
            </Texto>
          </g>
        )
      })}
      <rect x={44} y={150} width={268} height={14} rx={4} fill="var(--surface-2)" />
      <Texto x={178} y={161} color="var(--text-2)">
        suelo: cualquier distancia puede terminar acá
      </Texto>
      <Texto x={150} y={124}>
        de cerca → de lejos
      </Texto>
    </Lienzo>
  )
}
