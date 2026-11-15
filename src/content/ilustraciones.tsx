/* Dibujos de cómo hacer cada prueba de la evaluación. Figuras simples, propias. */
import type { ReactNode } from 'react'
import { Figura, Flecha, Lienzo, Pared, Piso, Silla, Texto, type Pose } from '../components/Figura'
import type { Tendencia } from '../lib/calc/tipoCuerpo'
import type { IdPaso } from './evaluacion-pasos'

const acento = 'var(--accent)'

const brazosCruzadosCostado = (cx: number, cy: number) => ({ codoI: [cx + 20, cy + 22], manoI: [cx + 4, cy + 14], codoD: [cx + 22, cy + 26], manoD: [cx + 2, cy + 20] }) as Pick<Pose, 'codoI' | 'manoI' | 'codoD' | 'manoD'>

function Pulso() {
  return (
    <Lienzo etiqueta="Persona sentada tomándose el pulso en la muñeca">
      <Piso hasta={190} />
      <Silla x={40} />
      <Figura
        pose={{
          cabeza: [64, 46],
          cuello: [62, 60],
          cadera: [64, 112],
          rodI: [102, 110],
          pieI: [104, 163],
          rodD: [100, 114],
          pieD: [100, 163],
          puntaD: [114, 163],
          codoI: [80, 96],
          manoI: [108, 92],
          codoD: [76, 92],
          manoD: [104, 88],
        }}
      />
      <circle cx={106} cy={90} r={7} fill="none" stroke={acento} strokeWidth={2.5} />
      <line x1={113} y1={86} x2={196} y2={58} stroke="var(--line)" strokeDasharray="3 4" />
      <circle cx={250} cy={84} r={60} fill="var(--surface-2)" stroke="var(--line)" />
      <rect x={196} y={74} width={84} height={30} rx={14} fill="var(--muted)" />
      <rect x={270} y={66} width={34} height={44} rx={14} fill="var(--muted)" />
      <path d="M232,48 L246,78 M246,46 L258,78" stroke="var(--text)" strokeWidth={9} strokeLinecap="round" />
      <path d="M212,124 h12 l5,-10 l6,20 l5,-10 h12" stroke={acento} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <Texto x={250} y={166}>2 dedos, lado del pulgar</Texto>
    </Lienzo>
  )
}

function Medidas() {
  return (
    <Lienzo etiqueta="Cómo medir altura, cintura y muñeca">
      <Piso />
      <Pared x={10} />
      <Figura
        pose={{
          cabeza: [30, 40],
          cuello: [28, 54],
          cadera: [28, 104],
          rodI: [30, 134],
          pieI: [30, 163],
          rodD: [28, 134],
          pieD: [28, 163],
          puntaD: [42, 163],
          codoI: [30, 80],
          manoI: [32, 104],
          codoD: [28, 80],
          manoD: [30, 104],
        }}
      />
      <rect x={18} y={26} width={34} height={6} fill={acento} />
      <Flecha de={[72, 163]} a={[72, 30]} doble />
      <Texto x={72} y={20}>altura</Texto>

      <Figura
        pose={{
          cabeza: [160, 40],
          cuello: [160, 54],
          cadera: [160, 104],
          rodI: [150, 134],
          pieI: [148, 163],
          rodD: [170, 134],
          pieD: [172, 163],
          codoI: [142, 80],
          manoI: [140, 104],
          codoD: [178, 80],
          manoD: [180, 104],
        }}
      />
      <ellipse cx={160} cy={96} rx={22} ry={6} fill="none" stroke={acento} strokeWidth={3} />
      <Texto x={160} y={22}>cintura</Texto>
      <Texto x={160} y={180}>borde de la cadera</Texto>

      <rect x={226} y={84} width={56} height={22} rx={10} fill="var(--muted)" />
      <rect x={276} y={76} width={30} height={38} rx={12} fill="var(--muted)" />
      <ellipse cx={268} cy={95} rx={6} ry={15} fill="none" stroke={acento} strokeWidth={3} />
      <Texto x={266} y={56}>muñeca</Texto>
      <Texto x={266} y={140}>justo arriba</Texto>
      <Texto x={266} y={154}>del huesito</Texto>
    </Lienzo>
  )
}

function Rodilla() {
  return (
    <Lienzo etiqueta="Rodilla a la pared: el talón apoyado y la rodilla toca la pared">
      <Piso />
      <Pared x={238} />
      <Figura
        pose={{
          cabeza: [196, 32],
          cuello: [190, 46],
          cadera: [172, 98],
          rodI: [150, 132],
          pieI: [118, 160],
          puntaI: [130, 163],
          rodD: [236, 118],
          pieD: [190, 163],
          puntaD: [212, 163],
          codoI: [214, 64],
          manoI: [236, 56],
          codoD: [214, 70],
          manoD: [236, 62],
        }}
      />
      <circle cx={236} cy={118} r={8} fill="none" stroke={acento} strokeWidth={2.5} />
      <circle cx={190} cy={163} r={6} fill={acento} />
      <Flecha de={[213, 176]} a={[237, 176]} doble />
      <Texto x={160} y={180} ancla="end">talón apoyado</Texto>
      <Texto x={290} y={124}>toca</Texto>
      <Texto x={290} y={180}>cm</Texto>
    </Lienzo>
  )
}

function Equilibrio() {
  return (
    <Lienzo etiqueta="Equilibrio en un pie con brazos cruzados y ojos cerrados">
      <Piso />
      <Pared x={250} />
      <Figura
        pose={{
          cabeza: [150, 34],
          cuello: [150, 48],
          cadera: [150, 102],
          rodI: [170, 128],
          pieI: [158, 146],
          rodD: [146, 134],
          pieD: [146, 163],
          codoI: [128, 70],
          manoI: [160, 64],
          codoD: [172, 70],
          manoD: [140, 64],
          ojosCerrados: true,
        }}
      />
      <circle cx={158} cy={146} r={8} fill="none" stroke={acento} strokeWidth={2.5} />
      <Texto x={210} y={148} ancla="start">cerca, sin tocar</Texto>
      <Texto x={70} y={60}>brazos cruzados</Texto>
      <Texto x={70} y={30}>hasta 45 s</Texto>
      <Texto x={250} y={10}>pared cerca</Texto>
    </Lienzo>
  )
}

function Sentarse() {
  return (
    <Lienzo etiqueta="Sentarse y pararse de una silla con brazos cruzados">
      <Piso />
      <Silla x={20} />
      <Figura
        pose={{
          cabeza: [46, 46],
          cuello: [44, 60],
          cadera: [44, 112],
          rodI: [82, 110],
          pieI: [86, 163],
          rodD: [80, 114],
          pieD: [82, 163],
          puntaD: [96, 163],
          ...brazosCruzadosCostado(44, 64),
        }}
      />
      <Silla x={170} />
      <Figura
        pose={{
          cabeza: [230, 30],
          cuello: [228, 44],
          cadera: [226, 98],
          rodI: [228, 130],
          pieI: [230, 163],
          rodD: [226, 130],
          pieD: [226, 163],
          puntaD: [240, 163],
          ...brazosCruzadosCostado(228, 48),
        }}
      />
      <Flecha de={[290, 118]} a={[290, 46]} doble />
      <Texto x={140} y={30}>1 minuto</Texto>
      <Texto x={292} y={140}>rodillas</Texto>
      <Texto x={292} y={154}>estiradas</Texto>
    </Lienzo>
  )
}

function Flexiones() {
  return (
    <Lienzo etiqueta="Flexión: arriba con brazos estirados y abajo con el pecho a un puño del piso">
      <Piso />
      <Figura
        pose={{
          cabeza: [140, 108],
          cuello: [126, 118],
          cadera: [70, 140],
          rodI: [44, 150],
          pieI: [16, 160],
          rodD: [42, 152],
          pieD: [14, 162],
          codoI: [130, 142],
          manoI: [130, 164],
          codoD: [126, 142],
          manoD: [126, 164],
        }}
      />
      <Texto x={80} y={40}>arriba</Texto>
      <Figura
        pose={{
          cabeza: [304, 138],
          cuello: [290, 146],
          cadera: [234, 154],
          rodI: [206, 157],
          pieI: [178, 160],
          rodD: [204, 159],
          pieD: [176, 162],
          codoI: [272, 132],
          manoI: [292, 164],
          codoD: [268, 134],
          manoD: [288, 164],
        }}
      />
      <Flecha de={[300, 151]} a={[300, 166]} doble />
      <Texto x={240} y={40}>abajo</Texto>
      <Texto x={240} y={110}>a un puño del piso</Texto>
      <Texto x={80} y={58}>cuerpo recto</Texto>
    </Lienzo>
  )
}

function Plancha() {
  return (
    <Lienzo etiqueta="Plancha sobre antebrazos con el cuerpo recto">
      <Piso />
      <line x1={30} y1={146} x2={250} y2={112} stroke={acento} strokeWidth={2} strokeDasharray="5 5" />
      <Figura
        pose={{
          cabeza: [250, 124],
          cuello: [234, 130],
          cadera: [140, 145],
          rodI: [90, 153],
          pieI: [40, 160],
          rodD: [88, 155],
          pieD: [38, 162],
          codoI: [236, 162],
          manoI: [270, 162],
          codoD: [232, 163],
          manoD: [266, 163],
        }}
      />
      <rect x={284} y={156} width={26} height={8} rx={2} fill="var(--muted)" />
      <Texto x={140} y={92}>cabeza, cadera y talones en línea</Texto>
      <Texto x={234} y={182}>codos bajo los hombros</Texto>
    </Lienzo>
  )
}

function Calidad() {
  return (
    <Lienzo etiqueta="Filmarse con el celular a 2 metros haciendo una sentadilla profunda">
      <Piso />
      <rect x={30} y={120} width={22} height={40} rx={4} fill="var(--muted)" />
      <circle cx={41} cy={128} r={3} fill="var(--bg)" />
      <path d="M52,130 L190,50 M52,140 L190,160" stroke="var(--line)" strokeDasharray="4 5" />
      <Flecha de={[60, 176]} a={[190, 176]} doble />
      <Texto x={125} y={170}>unos 2 m</Texto>
      <Figura
        pose={{
          cabeza: [242, 70],
          cuello: [234, 84],
          cadera: [206, 136],
          rodI: [252, 128],
          pieI: [226, 162],
          puntaI: [242, 163],
          rodD: [250, 130],
          pieD: [224, 163],
          puntaD: [240, 163],
          codoI: [230, 52],
          manoI: [228, 24],
          codoD: [226, 54],
          manoD: [222, 26],
        }}
      />
      <Texto x={280} y={20}>de costado</Texto>
      <Texto x={280} y={36}>y de frente</Texto>
    </Lienzo>
  )
}

export const ILUSTRACIONES: Partial<Record<IdPaso, () => ReactNode>> = {
  pulso: Pulso,
  medidas: Medidas,
  rodilla: Rodilla,
  equilibrio: Equilibrio,
  sentarse: Sentarse,
  flexiones: Flexiones,
  plancha: Plancha,
  calidad: Calidad,
}

/** Silueta simple de frente para los tipos de cuerpo. hombros, cintura y cadera son medios anchos. */
function Silueta({ x, hombros, cintura, cadera, alto, activa }: { x: number; hombros: number; cintura: number; cadera: number; alto: number; activa: boolean }) {
  const top = 168 - alto
  const cuello = top + 26
  const yC = cuello + (alto - 26) * 0.32
  const yK = cuello + (alto - 26) * 0.46
  const piernas = 168
  const relleno = activa ? 'var(--accent-tint)' : 'var(--surface-2)'
  const borde = activa ? 'var(--accent)' : 'var(--line)'
  const cuerpo = `M${x - 6},${cuello - 4} L${x - hombros},${cuello + 4} Q${x - hombros - 4},${cuello + 12} ${x - hombros + 2},${cuello + 20}
    L${x - cintura},${yC} L${x - cadera},${yK} L${x - cadera + 4},${piernas} L${x - 3},${piernas} L${x},${yK + 18} L${x + 3},${piernas}
    L${x + cadera - 4},${piernas} L${x + cadera},${yK} L${x + cintura},${yC} L${x + hombros - 2},${cuello + 20}
    Q${x + hombros + 4},${cuello + 12} ${x + hombros},${cuello + 4} L${x + 6},${cuello - 4} Z`
  return (
    <g>
      <path d={cuerpo} fill={relleno} stroke={borde} strokeWidth={2} strokeLinejoin="round" />
      <path
        d={`M${x - hombros + 1},${cuello + 8} L${x - hombros - 6},${yK + 6} M${x + hombros - 1},${cuello + 8} L${x + hombros + 6},${yK + 6}`}
        stroke={borde}
        strokeWidth={Math.max(6, hombros / 4)}
        strokeLinecap="round"
        opacity={0.6}
      />
      <circle cx={x} cy={top + 12} r={11} fill={relleno} stroke={borde} strokeWidth={2} />
    </g>
  )
}

export function TiposDeCuerpo({ activa }: { activa?: Tendencia }) {
  const color = (t: Tendencia) => (activa === t ? 'var(--accent)' : undefined)
  return (
    <Lienzo etiqueta="Los tres tipos de cuerpo: ectomorfo, mesomorfo y endomorfo" alto={196}>
      <Silueta x={55} hombros={20} cintura={13} cadera={15} alto={150} activa={activa === 'ectomorfo'} />
      <Silueta x={160} hombros={31} cintura={18} cadera={20} alto={146} activa={activa === 'mesomorfo'} />
      <Silueta x={265} hombros={26} cintura={30} cadera={30} alto={140} activa={activa === 'endomorfo'} />
      <Texto x={55} y={188} color={color('ectomorfo')}>Ectomorfo</Texto>
      <Texto x={160} y={188} color={color('mesomorfo')}>Mesomorfo</Texto>
      <Texto x={265} y={188} color={color('endomorfo')}>Endomorfo</Texto>
    </Lienzo>
  )
}

/** Dónde se toman las medidas del somatotipo completo: de frente y de espalda, con números. */
export function PuntosSomatotipo() {
  const punto = (x: number, y: number, n: number, color = 'var(--accent)') => (
    <g key={n}>
      <circle cx={x} cy={y} r={8} fill={color} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" fontFamily="var(--font-body)">
        {n}
      </text>
    </g>
  )
  return (
    <Lienzo etiqueta="Puntos de medición: pliegues, perímetros y anchos de hueso" alto={200}>
      <Silueta x={85} hombros={28} cintura={18} cadera={21} alto={160} activa={false} />
      <Silueta x={235} hombros={28} cintura={18} cadera={21} alto={160} activa={false} />
      <Texto x={85} y={196}>de frente</Texto>
      <Texto x={235} y={196}>de espalda</Texto>
      {punto(97, 111, 3)}
      {punto(54, 90, 5, 'var(--done)')}
      {punto(50, 113, 7, 'var(--soft)')}
      {punto(96, 152, 8, 'var(--soft)')}
      {punto(78, 176, 4)}
      {punto(98, 176, 6, 'var(--done)')}
      {punto(203, 86, 1)}
      {punto(246, 82, 2)}
    </Lienzo>
  )
}
