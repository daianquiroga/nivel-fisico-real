import { Lienzo, Texto } from '../components/Figura'

/** Plato de una comida: mitad verduras y frutas, un cuarto proteína y un cuarto cereales, papa o legumbres; y agua. */
export function DibujoPlato() {
  const cx = 130
  const cy = 98
  const r = 74
  return (
    <Lienzo etiqueta="Plato: la mitad verduras y frutas, un cuarto proteína (una palma), un cuarto cereales, papa o legumbres, y agua para tomar" alto={196}>
      <circle cx={cx} cy={cy} r={r + 10} fill="var(--surface-2)" stroke="var(--line)" strokeWidth={2} />
      <path d={`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} Z`} fill="var(--soft-tint)" stroke="var(--soft)" strokeWidth={2} />
      <path d={`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 0 1 ${cx + r},${cy} Z`} fill="var(--accent-tint)" stroke="var(--accent)" strokeWidth={2} />
      <path d={`M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 0 1 ${cx},${cy + r} Z`} fill="var(--done-tint)" stroke="var(--done)" strokeWidth={2} />
      <Texto x={cx - 38} y={cy - 4} color="var(--text)">
        Verduras
      </Texto>
      <Texto x={cx - 38} y={cy + 12} color="var(--text)">
        y frutas
      </Texto>
      <Texto x={cx + 36} y={cy - 26} color="var(--text)">
        Proteína
      </Texto>
      <Texto x={cx + 36} y={cy + 30} color="var(--text)">
        Cereales
      </Texto>
      <Texto x={cx + 36} y={cy + 44} color="var(--text)">
        o legumbres
      </Texto>
      <path d="M250,60 L284,60 L280,150 L254,150 Z" fill="var(--soft-tint)" stroke="var(--soft)" strokeWidth={2} />
      <Texto x={267} y={170}>
        Agua
      </Texto>
    </Lienzo>
  )
}
