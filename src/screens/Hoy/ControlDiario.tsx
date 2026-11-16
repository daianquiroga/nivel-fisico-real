import { useState } from 'react'
import { Segmentado, Stepper } from '../../components/controles'
import { Aviso, Boton, Tarjeta, estilos } from '../../components/ui'
import { guardarControl, usarControlHoy } from '../../lib/diario'
import { LIMITACIONES, diaDeHoy, horasDeSueno, type Semana } from '../../lib/perfil'
import { NOMBRES_VERSION, fechaLocal, recomendar, type ControlDia, type Dolor, type Version } from '../../lib/plan/sesion'
import e from '../Ejercicios/ejercicios.module.css'

/** Batería con 1 a 5 rayitas para la energía. */
function Bateria({ nivel, activa }: { nivel: number; activa: boolean }) {
  const color = activa ? (nivel <= 2 ? 'var(--accent)' : 'var(--done)') : 'var(--muted)'
  return (
    <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden="true">
      <rect x="1" y="1" width="28" height="16" rx="3" fill="none" stroke={color} strokeWidth="2" />
      <rect x="30" y="6" width="3" height="6" rx="1" fill={color} />
      {Array.from({ length: nivel }, (_, i) => (
        <rect key={i} x={4 + i * 5} y="4" width="3.5" height="10" rx="1" fill={color} />
      ))}
    </svg>
  )
}

const ENERGIA = ['Muy baja', 'Baja', 'Normal', 'Buena', 'Muy buena']

export function ControlDiario({ semana, onCambio }: { semana?: Semana; onCambio?: () => void }) {
  const { estado, recargar } = usarControlHoy()
  // Lo programado para anoche: hora de dormir de ayer y de despertar de hoy.
  const hoyTipo = semana?.tipos[semana.dias[diaDeHoy()]]
  const ayerTipo = semana?.tipos[semana.dias[(diaDeHoy() + 6) % 7]]
  const suenoPlan = hoyTipo && ayerTipo ? Math.round(horasDeSueno(ayerTipo.dormir, hoyTipo.despertar) * 2) / 2 : 7
  const [c, setC] = useState<ControlDia>({ fecha: fechaLocal(), sueno: suenoPlan, energia: 3, dolor: 'ninguno' })
  const [editando, setEditando] = useState(false)
  if (!estado) return null

  const hoy = estado.hoy
  const cambiar = (x: Partial<ControlDia>) => setC((v) => ({ ...v, ...x }))

  async function guardar(version?: Version) {
    const base = hoy && !editando ? hoy : c
    const rec = recomendar(base, estado?.ayer)
    await guardarControl({ ...base, version: version ?? rec.version })
    setEditando(false)
    await recargar()
    onCambio?.()
  }

  if (hoy && !editando) {
    const rec = recomendar(hoy, estado.ayer)
    const opciones: Version[] = rec.version === 'movilidad' ? ['movilidad', 'minima'] : ['completa', 'reducida', 'minima']
    return (
      <Tarjeta>
        <p className="etiqueta">Control de hoy</p>
        <p className={estilos.texto2}>
          Dormiste {String(hoy.sueno).replace('.', ',')} h · energía {ENERGIA[hoy.energia - 1].toLowerCase()}
          {hoy.dolor !== 'ninguno' ? ` · ${hoy.dolor} en ${LIMITACIONES.find((l) => l.valor === hoy.zona)?.texto.toLowerCase() ?? 'una zona'}` : ''}
        </p>
        {rec.consultar ? <Aviso tipo="error">{rec.texto}</Aviso> : <p className={estilos.texto2}>{rec.texto}</p>}
        <p className={estilos.chico}>Elegí cómo entrenar hoy:</p>
        <Segmentado<Version>
          etiqueta="Versión de la sesión"
          opciones={opciones.map((v) => ({ valor: v, texto: NOMBRES_VERSION[v] }))}
          valor={hoy.version ?? rec.version}
          onCambio={(v) => void guardar(v)}
        />
        <button
          type="button"
          className={e.filtro}
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            setC(hoy)
            setEditando(true)
          }}
        >
          Corregir respuestas
        </button>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta destacada>
      <p className="etiqueta" style={{ color: 'var(--accent)' }}>
        Control diario · 30 segundos
      </p>
      <Stepper etiqueta="¿Cuánto dormiste?" valor={c.sueno} min={0} max={14} paso={0.5} unidad="h" onCambio={(v) => cambiar({ sueno: v })} />
      <p className={estilos.chico}>¿Cómo está tu energía?</p>
      <div className={e.rir} role="radiogroup" aria-label="Energía" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={c.energia === n}
            aria-label={ENERGIA[n - 1]}
            className={`${e.filtro} ${c.energia === n ? e.filtroOn : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 56 }}
            onClick={() => cambiar({ energia: n })}
          >
            <Bateria nivel={n} activa={c.energia === n} />
          </button>
        ))}
      </div>
      <p className={estilos.chico} style={{ textAlign: 'center' }}>
        {ENERGIA[c.energia - 1]}
      </p>
      <p className={estilos.chico}>¿Algo te duele?</p>
      <Segmentado<Dolor>
        etiqueta="Dolor"
        opciones={[
          { valor: 'ninguno', texto: 'Nada' },
          { valor: 'molestia', texto: 'Molestia' },
          { valor: 'dolor', texto: 'Dolor' },
        ]}
        valor={c.dolor}
        onCambio={(v) => cambiar({ dolor: v, zona: v === 'ninguno' ? undefined : c.zona })}
      />
      {c.dolor !== 'ninguno' && (
        <div className={e.filtros} role="radiogroup" aria-label="Zona" style={{ flexWrap: 'wrap' }}>
          {LIMITACIONES.map((l) => (
            <button
              key={l.valor}
              type="button"
              role="radio"
              aria-checked={c.zona === l.valor}
              className={`${e.filtro} ${c.zona === l.valor ? e.filtroOn : ''}`}
              onClick={() => cambiar({ zona: l.valor })}
            >
              {l.texto}
            </button>
          ))}
        </div>
      )}
      <p className={estilos.chico}>Molestia: se siente pero no cambia cómo te movés. Dolor: punzante, en la articulación o que empeora al moverte.</p>
      <Boton variante="principal" ancho onClick={() => void guardar()}>
        Listo
      </Boton>
    </Tarjeta>
  )
}
