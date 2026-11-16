import { useEffect, useState, type ChangeEvent } from 'react'
import { Icono } from '../../components/Icono'
import { Aviso, Boton, Dialogo, Tarjeta, estilos } from '../../components/ui'
import { Capacitor } from '@capacitor/core'
import { db } from '../../lib/db/db'
import { guardarEnCelular, mandarAfuera, ultimaCopiaAuto } from '../../lib/respaldoNativo'
import {
  ErrorRespaldo,
  exportarDatos,
  importarDatos,
  leerRespaldo,
  respaldoATexto,
  resumirRespaldo,
  type Respaldo as TipoRespaldo,
} from '../../lib/db/respaldo'

const NOMBRES: Record<string, string> = {
  perfil: 'Perfil',
  lugares: 'Lugares',
  evaluaciones: 'Evaluaciones',
  registros: 'Registros',
  ajustes: 'Ajustes',
}

type Mensaje = { tipo: 'ok' | 'error'; texto: string } | null

async function marcarRespaldo() {
  await db.ajustes.put({ clave: 'ultimoRespaldo', valor: new Date().toISOString() })
}

function formatoFecha(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

export function Respaldo() {
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [ultimo, setUltimo] = useState<string | null>(null)
  const [pegando, setPegando] = useState(false)
  const [textoPegado, setTextoPegado] = useState('')
  const [textoCopia, setTextoCopia] = useState<string | null>(null)
  const [aImportar, setAImportar] = useState<TipoRespaldo | null>(null)
  const [conFotos, setConFotos] = useState(false)

  const nativo = Capacitor.isNativePlatform()
  const [copiaAuto, setCopiaAuto] = useState<string | null>(null)
  const leerUltimo = async () => {
    const a = await db.ajustes.get('ultimoRespaldo')
    setUltimo(typeof a?.valor === 'string' ? a.valor : null)
  }
  useEffect(() => {
    void leerUltimo()
    void ultimaCopiaAuto().then((x) => setCopiaAuto(x ?? null))
  }, [])

  async function afuera() {
    const ok = await mandarAfuera(conFotos)
    await leerUltimo()
    if (ok) setMensaje({ tipo: 'ok', texto: nativo ? 'Listo: el respaldo quedó donde lo mandaste.' : 'Listo: el archivo quedó en la carpeta Descargas o donde lo compartiste.' })
  }

  async function enCelular() {
    const ok = await guardarEnCelular(conFotos)
    setCopiaAuto((await ultimaCopiaAuto()) ?? null)
    setMensaje(ok ? { tipo: 'ok', texto: 'Listo: copia guardada en Documentos/NivelFisicoReal.' } : { tipo: 'error', texto: 'No se pudo guardar en el celular. Probá "Guardar en Drive, mail o WhatsApp".' })
  }

  async function copiarTexto() {
    const texto = respaldoATexto(await exportarDatos(db))
    try {
      await navigator.clipboard.writeText(texto)
      setMensaje({ tipo: 'ok', texto: 'Copiado. Pegalo en una nota o mandátelo por mail para guardarlo.' })
    } catch {
      setTextoCopia(texto)
    }
    await marcarRespaldo()
    await leerUltimo()
  }

  function prepararImportacion(contenido: string) {
    try {
      setAImportar(leerRespaldo(contenido))
      setMensaje(null)
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof ErrorRespaldo ? e.message : 'No pudimos leer el respaldo.' })
    }
  }

  async function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (archivo) prepararImportacion(await archivo.text())
  }

  async function confirmarImportacion() {
    if (!aImportar) return
    try {
      await importarDatos(db, aImportar)
      setMensaje({ tipo: 'ok', texto: 'Datos restaurados.' })
      setPegando(false)
      setTextoPegado('')
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo restaurar. Tus datos anteriores no se tocaron.' })
    }
    setAImportar(null)
    await leerUltimo()
  }

  return (
    <Tarjeta>
      <p className="etiqueta">Respaldo de tus datos</p>
      <p className={estilos.texto2}>
        Todo se guarda solo en este celular. Si borrás los datos del navegador o cambiás de teléfono, lo recuperás con un
        respaldo.
      </p>
      <p className={estilos.chico}>{ultimo ? `Última copia guardada afuera de la app: ${formatoFecha(ultimo)}` : 'Todavía no guardaste ninguna copia afuera de la app.'}</p>

      <label style={{ display: 'flex', gap: 10, alignItems: 'center', minHeight: 44 }} className={estilos.chico}>
        <input type="checkbox" checked={conFotos} onChange={(e) => setConFotos(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} />
        Incluir las fotos de progreso en el archivo (queda más pesado). El texto para copiar nunca lleva fotos.
      </label>
      <Boton variante="principal" ancho onClick={() => void afuera()}>
        <Icono nombre="descargar" tam={20} /> {nativo ? 'Guardar en Drive, mail o WhatsApp' : 'Guardar archivo'}
      </Boton>
      {nativo && (
        <>
          <Boton ancho onClick={() => void enCelular()}>
            Guardar una copia en el celular
          </Boton>
          <p className={estilos.chico}>
            Copia automática cada semana en Documentos/NivelFisicoReal (quedan las últimas 4, aunque borres la app):{' '}
            {copiaAuto ? `la última fue el ${formatoFecha(copiaAuto)}.` : 'todavía no se hizo ninguna.'} Para no perder nada si se pierde el celular, mandá una copia afuera cada tanto.
          </p>
        </>
      )}
      <Boton onClick={copiarTexto}>
        <Icono nombre="copiar" tam={20} /> Copiar como texto
      </Boton>

      <div className={estilos.fila}>
        <label className={estilos.boton}>
          <Icono nombre="subir" tam={20} /> Restaurar desde archivo
          <input type="file" accept=".json,.txt,application/json,text/plain" onChange={elegirArchivo} className="sr-only" />
        </label>
        <Boton onClick={() => setPegando((v) => !v)} aria-expanded={pegando}>
          Restaurar pegando texto
        </Boton>
      </div>

      {pegando && (
        <>
          <label htmlFor="texto-respaldo" className={estilos.chico}>
            Pegá acá el texto del respaldo (empieza con NFR1:)
          </label>
          <textarea
            id="texto-respaldo"
            className={estilos.areaTexto}
            value={textoPegado}
            onChange={(e) => setTextoPegado(e.target.value)}
          />
          <Boton variante="principal" disabled={!textoPegado.trim()} onClick={() => prepararImportacion(textoPegado)}>
            Revisar respaldo
          </Boton>
        </>
      )}

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {aImportar && (
        <Dialogo titulo="¿Restaurar este respaldo?" onCerrar={() => setAImportar(null)}>
          <p className={estilos.texto2}>
            Es del {formatoFecha(aImportar.exportado)}. Va a <b>reemplazar</b> todos los datos que tenés ahora en la app.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {resumirRespaldo(aImportar).map((x) => (
              <li key={x.tabla} className={estilos.texto2}>
                {NOMBRES[x.tabla]}: {x.filas}
              </li>
            ))}
          </ul>
          <Boton variante="principal" onClick={confirmarImportacion}>
            Restaurar
          </Boton>
          <Boton onClick={() => setAImportar(null)}>Cancelar</Boton>
        </Dialogo>
      )}

      {textoCopia && (
        <Dialogo titulo="Copiá este texto" onCerrar={() => setTextoCopia(null)}>
          <p className={estilos.texto2}>Tu celular no dejó copiar solo. Mantené apretado el texto, elegí "Seleccionar todo" y copiá.</p>
          <textarea readOnly className={estilos.areaTexto} value={textoCopia} aria-label="Texto del respaldo" />
          <Boton onClick={() => setTextoCopia(null)}>Listo</Boton>
        </Dialogo>
      )}
    </Tarjeta>
  )
}
