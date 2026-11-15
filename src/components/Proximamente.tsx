import { Tarjeta, estilos } from './ui'

/** Tarjeta honesta para lo que todavía no está construido. */
export function Proximamente({ entrega, items }: { entrega: string; items: string[] }) {
  return (
    <Tarjeta>
      <p className="etiqueta">Llega en la {entrega}</p>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((i) => (
          <li key={i} className={estilos.texto2}>
            {i}
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}
