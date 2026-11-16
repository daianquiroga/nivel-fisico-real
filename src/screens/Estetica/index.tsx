import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Segmentado } from '../../components/controles'
import { GraficoLinea } from '../../components/GraficoLinea'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import contenido from '../../content/estetica.json'
import { GuiaFotos, MedidasCuerpo, PosturaPared } from '../../content/ilustraciones'
import { bajaMuyRapido, cambio, ritmoSemanalPeso } from '../../lib/calc/estetica'
import { db, type Foto, type VistaFoto } from '../../lib/db/db'
import { borrarRegistro, guardarTipo, leerTipo, type Medidas, type Postura, type Satisfaccion } from '../../lib/diario'
import { guardarFoto, ponerPin, probarPin, sacarPin, sesionAbierta, tienePin } from '../../lib/fotos'
import { fechaLocal } from '../../lib/plan/sesion'
import { usarInicio } from '../../lib/usarInicio'
import e from '../Evaluacion/evaluacion.module.css'
import x from '../Ejercicios/ejercicios.module.css'
import p from '../Plan/plan.module.css'

type Seccion = 'medidas' | 'fotos' | 'postura'
const coma = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const fechaCorta = (f: string) => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${f.slice(0, 10)}T12:00:00`))
const VISTAS: { valor: VistaFoto; texto: string }[] = [
  { valor: 'frente', texto: 'Frente' },
  { valor: 'perfil', texto: 'Perfil' },
  { valor: 'espalda', texto: 'Espalda' },
]

/* ---------- Medidas ---------- */

function Campo({ id, nombre, unidad, valor, onCambio, onFoco }: { id: string; nombre: string; unidad: string; valor?: number; onCambio: (v: number) => void; onFoco: () => void }) {
  const [texto, setTexto] = useState(valor ? String(valor).replace('.', ',') : '')
  return (
    <label htmlFor={`medida-${id}`} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 28px', alignItems: 'center', gap: 8, minHeight: 52 }}>
      <span style={{ fontWeight: 600 }}>{nombre}</span>
      <input
        id={`medida-${id}`}
        className={x.buscador}
        inputMode="decimal"
        value={texto}
        onFocus={onFoco}
        onChange={(ev) => {
          setTexto(ev.target.value)
          const n = Number(ev.target.value.replace(',', '.'))
          onCambio(Number.isFinite(n) ? n : 0)
        }}
        style={{ textAlign: 'right' }}
      />
      <span className={estilos.chico}>{unidad}</span>
    </label>
  )
}

function SeccionMedidas({ pesoInicial }: { pesoInicial?: number }) {
  const [lista, setLista] = useState<(Medidas & { id?: number })[] | null>(null)
  const [cargando, setCargando] = useState<Record<string, number> | null>(null)
  const [activa, setActiva] = useState<string>('cintura')
  const cargar = useCallback(async () => setLista(await leerTipo<Medidas>('medidas')), [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  if (!lista) return null
  const ultima = lista[lista.length - 1]
  const pesos = lista.filter((m) => m.valores.peso).map((m) => ({ fecha: m.fecha, peso: m.valores.peso }))
  const ritmo = ritmoSemanalPeso(pesos)

  async function guardar() {
    if (!cargando) return
    const valores = Object.fromEntries(Object.entries(cargando).filter(([, v]) => v > 0))
    await guardarTipo('medidas', fechaLocal(), { fecha: fechaLocal(), valores })
    setCargando(null)
    await cargar()
  }

  return (
    <>
      <Tarjeta>
        <div className={e.dibujo}>
          <MedidasCuerpo activa={activa} />
        </div>
        <ul className={x.seccion}>
          {contenido.consejosMedidas.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Tarjeta>
      {bajaMuyRapido(ritmo) && (
        <Aviso tipo="error">
          Estás bajando {coma(Math.abs(ritmo ?? 0))} % de tu peso por semana. Más de 1 % por semana es demasiado rápido: se pierde músculo y cuesta sostenerlo. Comé un poco
          más y, si podés, consultá a un nutricionista.
        </Aviso>
      )}
      {cargando ? (
        <Tarjeta destacada>
          <p className="etiqueta" style={{ color: 'var(--accent)' }}>
            Medidas de hoy
          </p>
          {contenido.medidas.map((m) => (
            <div key={m.id}>
              <Campo id={m.id} nombre={m.nombre} unidad="cm" valor={cargando[m.id]} onFoco={() => setActiva(m.id)} onCambio={(v) => setCargando({ ...cargando, [m.id]: v })} />
              {activa === m.id && <p className={estilos.chico}>{m.como}</p>}
            </div>
          ))}
          <Campo id="peso" nombre="Peso (opcional)" unidad="kg" valor={cargando.peso} onFoco={() => setActiva('')} onCambio={(v) => setCargando({ ...cargando, peso: v })} />
          <p className={estilos.chico}>Dejá vacío lo que no midas hoy. Se usa coma o punto para los decimales.</p>
          <div className={estilos.fila}>
            <Boton onClick={() => setCargando(null)}>Cancelar</Boton>
            <Boton variante="principal" onClick={() => void guardar()}>
              Guardar
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <Boton variante="principal" ancho onClick={() => setCargando({ ...(ultima?.valores ?? {}), peso: ultima?.valores.peso ?? pesoInicial ?? 0 })}>
          Anotar medidas de hoy
        </Boton>
      )}
      {lista.length > 0 && (
        <Tarjeta>
          <p className="etiqueta">Tu evolución</p>
          {[...contenido.medidas, { id: 'peso', nombre: 'Peso', como: '' }].map((m) => {
            const serie = lista.filter((r) => r.valores[m.id]).map((r) => ({ fecha: r.fecha, valor: r.valores[m.id] }))
            if (!serie.length) return null
            const c = cambio(serie.map((s) => s.valor))
            const u = m.id === 'peso' ? 'kg' : 'cm'
            return (
              <div key={m.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
                <div className={p.cabeza}>
                  <b>{m.nombre}</b>
                  <span className={p.meta}>
                    {coma(serie[serie.length - 1].valor)} {u}
                    {c !== null ? ` · ${c > 0 ? '+' : ''}${coma(c)} ${u} desde el ${fechaCorta(serie[0].fecha)}` : ''}
                  </span>
                </div>
                <GraficoLinea etiqueta={`Evolución de ${m.nombre}`} puntos={serie} unidad={` ${u}`} />
              </div>
            )
          })}
          <button
            type="button"
            className={p.accion}
            onClick={() => {
              if (ultima?.id) void borrarRegistro(ultima.id).then(cargar)
            }}
          >
            Borrar la última medición
          </button>
        </Tarjeta>
      )}
    </>
  )
}

/* ---------- Fotos ---------- */

function Comparar({ antes, ahora }: { antes: Foto; ahora: Foto }) {
  const [corte, setCorte] = useState(50)
  const urls = useMemo(() => [URL.createObjectURL(antes.imagen), URL.createObjectURL(ahora.imagen)], [antes, ahora])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return (
    <div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
        <img src={urls[0]} alt={`Antes, ${fechaCorta(antes.fecha)}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <img
          src={urls[1]}
          alt={`Ahora, ${fechaCorta(ahora.fecha)}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 0 0 ${corte}%)` }}
        />
        <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${corte}%`, width: 3, background: 'var(--done)' }} />
        <span className={x.tag} style={{ position: 'absolute', left: 8, top: 8 }}>
          Antes · {antes.fecha.slice(8, 10)}/{antes.fecha.slice(5, 7)}
        </span>
        <span className={x.tag} style={{ position: 'absolute', right: 8, top: 8 }}>
          Ahora · {ahora.fecha.slice(8, 10)}/{ahora.fecha.slice(5, 7)}
        </span>
      </div>
      <input type="range" min={0} max={100} value={corte} onChange={(ev) => setCorte(Number(ev.target.value))} aria-label="Deslizá para comparar" style={{ width: '100%', accentColor: 'var(--accent)', minHeight: 44 }} />
    </div>
  )
}

function SeccionFotos() {
  const [abierta, setAbierta] = useState<boolean | null>(null)
  const [conPin, setConPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [fotos, setFotos] = useState<Foto[] | null>(null)
  const [vista, setVista] = useState<VistaFoto>('frente')
  const [configPin, setConfigPin] = useState(false)
  const [borrar, setBorrar] = useState<Foto | null>(null)

  const cargar = useCallback(async () => setFotos(await db.fotos.orderBy('fecha').toArray()), [])
  useEffect(() => {
    void tienePin().then((t) => {
      setConPin(t)
      setAbierta(!t || sesionAbierta())
    })
  }, [])
  useEffect(() => {
    if (abierta) void cargar()
  }, [abierta, cargar])

  if (abierta === null) return null
  if (!abierta) {
    return (
      <Tarjeta>
        <p className="etiqueta">Fotos con candado</p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className={estilos.chico}>PIN</span>
          <input className={x.buscador} type="password" inputMode="numeric" value={pin} onChange={(ev) => setPin(ev.target.value)} maxLength={8} />
        </label>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <Boton
          variante="principal"
          ancho
          onClick={() =>
            void probarPin(pin).then((ok) => {
              if (ok) setAbierta(true)
              else setError('PIN incorrecto.')
              setPin('')
            })
          }
        >
          Abrir
        </Boton>
      </Tarjeta>
    )
  }
  if (!fotos) return null
  const deVista = fotos.filter((f) => f.vista === vista)

  async function subir(ev: ChangeEvent<HTMLInputElement>) {
    const archivo = ev.target.files?.[0]
    ev.target.value = ''
    if (!archivo) return
    await guardarFoto(fechaLocal(), vista, archivo)
    await cargar()
  }

  return (
    <>
      <Tarjeta>
        <div className={e.dibujo}>
          <GuiaFotos />
        </div>
        <ul className={x.seccion}>
          {contenido.fotos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className={estilos.chico}>Las fotos quedan solo en este celular. No se suben a ningún lado y no van en el respaldo de texto.</p>
      </Tarjeta>
      <Segmentado<VistaFoto> etiqueta="Vista" opciones={VISTAS} valor={vista} onCambio={setVista} />
      <label className={`${estilos.boton} ${estilos.principal}`} style={{ textAlign: 'center' }}>
        Sacar o elegir foto de {VISTAS.find((v) => v.valor === vista)?.texto.toLowerCase()}
        <input type="file" accept="image/*" capture="user" onChange={(ev) => void subir(ev)} className="sr-only" />
      </label>
      {deVista.length >= 2 && (
        <Tarjeta>
          <p className="etiqueta">Antes y ahora</p>
          <Comparar antes={deVista[0]} ahora={deVista[deVista.length - 1]} />
        </Tarjeta>
      )}
      {deVista.length > 0 && (
        <Tarjeta>
          <p className="etiqueta">Tus fotos de {vista}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {deVista.map((f) => (
              <Miniatura key={f.id} foto={f} onBorrar={() => setBorrar(f)} />
            ))}
          </div>
        </Tarjeta>
      )}
      <Boton ancho onClick={() => setConfigPin(true)}>
        {conPin ? 'Cambiar o sacar el PIN' : 'Ponerle PIN a las fotos'}
      </Boton>
      {configPin && (
        <Dialogo titulo="PIN de las fotos" onCerrar={() => setConfigPin(false)}>
          <p className={estilos.texto2}>Es un candado para que nadie vea tus fotos si agarra tu celular desbloqueado. Si lo olvidás, no hay forma de recuperarlo desde la app.</p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className={estilos.chico}>PIN nuevo (4 a 8 números)</span>
            <input className={x.buscador} type="password" inputMode="numeric" value={pin} onChange={(ev) => setPin(ev.target.value.replace(/\D/g, ''))} maxLength={8} />
          </label>
          <Boton
            variante="principal"
            disabled={pin.length < 4}
            onClick={() =>
              void ponerPin(pin).then(() => {
                setConPin(true)
                setPin('')
                setConfigPin(false)
              })
            }
          >
            Guardar PIN
          </Boton>
          {conPin && (
            <Boton
              onClick={() =>
                void sacarPin().then(() => {
                  setConPin(false)
                  setConfigPin(false)
                })
              }
            >
              Sacar el PIN
            </Boton>
          )}
        </Dialogo>
      )}
      {borrar && (
        <Dialogo titulo="¿Borrar esta foto?" onCerrar={() => setBorrar(null)}>
          <p className={estilos.texto2}>Se borra del celular y no se puede recuperar (salvo que esté en un respaldo de archivo con fotos).</p>
          <div className={estilos.fila}>
            <Boton onClick={() => setBorrar(null)}>Cancelar</Boton>
            <Boton
              variante="principal"
              onClick={() => {
                if (borrar.id) void db.fotos.delete(borrar.id).then(cargar)
                setBorrar(null)
              }}
            >
              Borrar
            </Boton>
          </div>
        </Dialogo>
      )}
    </>
  )
}

function Miniatura({ foto, onBorrar }: { foto: Foto; onBorrar: () => void }) {
  const url = useMemo(() => URL.createObjectURL(foto.imagen), [foto])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <button type="button" onClick={onBorrar} aria-label={`Foto del ${fechaCorta(foto.fecha)}. Tocá para borrarla`} style={{ border: 0, padding: 0, background: 'none', position: 'relative' }}>
      <img src={url} alt="" style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 8 }} />
      <span className={estilos.chico} style={{ position: 'absolute', left: 4, bottom: 4, background: 'rgba(0,0,0,.6)', borderRadius: 6, padding: '0 4px' }}>
        {fechaCorta(foto.fecha)}
      </span>
    </button>
  )
}

/* ---------- Postura y satisfacción ---------- */

function SeccionPostura() {
  const [lista, setLista] = useState<(Postura & { id?: number })[] | null>(null)
  const [r, setR] = useState<Record<string, number>>({})
  const cargar = useCallback(async () => setLista(await leerTipo<Postura>('postura')), [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  if (!lista) return null
  const ultima = lista[lista.length - 1]
  const completo = contenido.postura.preguntas.every((q) => r[q.id] !== undefined)
  return (
    <>
      <Tarjeta>
        <div className={e.dibujo}>
          <PosturaPared />
        </div>
        <ol className={x.seccion}>
          {contenido.postura.como.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </Tarjeta>
      <Tarjeta>
        {contenido.postura.preguntas.map((q) => (
          <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
            <p className={estilos.texto2} style={{ margin: 0 }}>
              {q.texto}
            </p>
            <div className={x.filtros} role="radiogroup" aria-label={q.texto} style={{ flexWrap: 'wrap' }}>
              {q.opciones.map((o, i) => (
                <button key={o} type="button" role="radio" aria-checked={r[q.id] === i} className={`${x.filtro} ${r[q.id] === i ? x.filtroOn : ''}`} onClick={() => setR({ ...r, [q.id]: i })}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Boton
          variante="principal"
          ancho
          disabled={!completo}
          onClick={() =>
            void guardarTipo('postura', fechaLocal(), { fecha: fechaLocal(), respuestas: r }).then(() => {
              setR({})
              void cargar()
            })
          }
        >
          Guardar
        </Boton>
        <p className={estilos.chico}>{contenido.postura.nota}</p>
      </Tarjeta>
      {ultima && (
        <Tarjeta>
          <p className="etiqueta">Última vez · {fechaCorta(ultima.fecha)}</p>
          {contenido.postura.preguntas.map((q) => (
            <p key={q.id} className={estilos.texto2} style={{ margin: 0 }}>
              {q.texto.replace('¿', '').replace('?', '')}: <b>{q.opciones[ultima.respuestas[q.id]]}</b>
            </p>
          ))}
          {lista.length > 1 && <p className={estilos.chico}>Tenés {lista.length} registros: comparalos cada 4 semanas.</p>}
        </Tarjeta>
      )}
    </>
  )
}

function SatisfaccionCuerpo() {
  const [lista, setLista] = useState<Satisfaccion[] | null>(null)
  const cargar = useCallback(async () => setLista(await leerTipo<Satisfaccion>('satisfaccion')), [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  if (!lista) return null
  const hoy = lista.find((s) => s.fecha === fechaLocal())
  return (
    <Tarjeta>
      <p className="etiqueta">¿Qué tan conforme estás con tu cuerpo hoy? (1 a 10)</p>
      <div className={x.rir} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }} role="radiogroup" aria-label="Satisfacción con el cuerpo">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={hoy?.valor === n}
            className={`${x.filtro} ${hoy?.valor === n ? x.filtroOn : ''}`}
            onClick={() => {
              if (!hoy) void guardarTipo('satisfaccion', fechaLocal(), { fecha: fechaLocal(), valor: n }).then(cargar)
            }}
            disabled={Boolean(hoy)}
          >
            {n}
          </button>
        ))}
      </div>
      {lista.length > 1 && <GraficoLinea etiqueta="Satisfacción con el cuerpo" puntos={lista.map((s) => ({ fecha: s.fecha, valor: s.valor }))} />}
      <p className={estilos.chico}>{contenido.satisfaccion}</p>
    </Tarjeta>
  )
}

export function Estetica() {
  const navegar = useNavigate()
  const { perfil } = usarInicio()
  const [seccion, setSeccion] = useState<Seccion>('medidas')
  return (
    <div className={e.pantalla}>
      <div className={e.arriba}>
        <button type="button" className={e.volver} onClick={() => navegar(-1)} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      </div>
      <header>
        <h1 className={e.titulo}>Tu cuerpo</h1>
        <p className={e.para}>{contenido.expectativas}</p>
      </header>
      <Segmentado<Seccion>
        etiqueta="Sección"
        opciones={[
          { valor: 'medidas', texto: 'Medidas' },
          { valor: 'fotos', texto: 'Fotos' },
          { valor: 'postura', texto: 'Postura' },
        ]}
        valor={seccion}
        onCambio={setSeccion}
      />
      {seccion === 'medidas' && <SeccionMedidas pesoInicial={perfil?.pesoKg} />}
      {seccion === 'fotos' && <SeccionFotos />}
      {seccion === 'postura' && <SeccionPostura />}
      <SatisfaccionCuerpo />
    </div>
  )
}
