import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EJERCICIOS, NOMBRES_EQUIPO, PATRONES, avisosLimitacion, equipoDisponible, sePuedeHacer } from '../../lib/ejercicios'
import { LIMITACIONES } from '../../lib/perfil'
import tiposCuerpo from '../../content/tipos-cuerpo.json'
import { usarInicio } from '../../lib/usarInicio'
import { usarTipoCuerpo } from '../../lib/usarTipoCuerpo'
import s from './ejercicios.module.css'

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const nombreLimitacion = (v: string) => LIMITACIONES.find((l) => l.valor === v)?.texto.toLowerCase() ?? v

export function Biblioteca() {
  const { perfil, lugares } = usarInicio()
  const [busqueda, setBusqueda] = useState('')
  const [patron, setPatron] = useState<string | null>(null)
  const [soloMios, setSoloMios] = useState(true)
  const equipo = useMemo(() => equipoDisponible(lugares), [lugares])
  const limitaciones = perfil?.limitaciones ?? []
  const conLugares = lugares.length > 0
  const { estado } = usarTipoCuerpo()
  const base = new Set<string>(estado?.tipo ? (tiposCuerpo.tipos as Record<string, { ejercicios: string[] }>)[estado.tipo].ejercicios : [])

  const lista = EJERCICIOS.filter((e) => {
    if (patron && !PATRONES.find((p) => p.valor === patron)?.incluye.includes(e.patron)) return false
    if (soloMios && conLugares && !sePuedeHacer(e, equipo)) return false
    if (busqueda) {
      const q = sinTildes(busqueda)
      return sinTildes([e.nombre, ...e.principal, ...e.secundarios].join(' ')).includes(q)
    }
    return true
  })

  return (
    <>
      <input
        className={s.buscador}
        type="search"
        placeholder="Buscar: sentadilla, pecho, bíceps…"
        aria-label="Buscar ejercicio"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      <div className={s.filtros} role="group" aria-label="Filtrar por tipo">
        <button type="button" className={`${s.filtro} ${patron === null ? s.filtroOn : ''}`} aria-pressed={patron === null} onClick={() => setPatron(null)}>
          Todos
        </button>
        {PATRONES.map((p) => (
          <button
            key={p.valor}
            type="button"
            className={`${s.filtro} ${patron === p.valor ? s.filtroOn : ''}`}
            aria-pressed={patron === p.valor}
            onClick={() => setPatron(patron === p.valor ? null : p.valor)}
          >
            {p.texto}
          </button>
        ))}
      </div>
      {conLugares && (
        <label className={s.interruptor}>
          <input type="checkbox" checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} />
          Solo los que puedo hacer con mi equipo
        </label>
      )}

      <div className={s.lista}>
        {lista.map((e) => {
          const avisos = avisosLimitacion(e, limitaciones)
          const evitar = avisos.filter((a) => a.nivel === 'evitar')
          const adaptar = avisos.filter((a) => a.nivel === 'adaptar')
          const falta = e.equipo.filter((x) => !equipo.has(x))
          return (
            <Link key={e.id} to={`/ejercicio/${e.id}`} className={s.item}>
              <span className={s.itemNombre}>{e.nombre}</span>
              <span className={s.itemDetalle}>
                {e.principal.join(', ')} · {e.equipo.length ? e.equipo.map((x) => NOMBRES_EQUIPO[x] ?? x).join(' + ') : 'sin equipo'}
              </span>
              {(base.has(e.id) || evitar.length > 0 || adaptar.length > 0 || (conLugares && falta.length > 0)) && (
                <span className={s.etiquetas}>
                  {base.has(e.id) && <span className={`${s.tag} ${s.tagBase}`}>Base para tu tipo</span>}
                  {evitar.map((a) => (
                    <span key={a.limitacion} className={`${s.tag} ${s.tagEvitar}`}>
                      Evitar por {nombreLimitacion(a.limitacion)}
                    </span>
                  ))}
                  {adaptar.map((a) => (
                    <span key={a.limitacion} className={`${s.tag} ${s.tagAdaptar}`}>
                      Adaptar por {nombreLimitacion(a.limitacion)}
                    </span>
                  ))}
                  {conLugares && falta.length > 0 && <span className={`${s.tag} ${s.tagFalta}`}>Te falta: {falta.map((x) => NOMBRES_EQUIPO[x] ?? x).join(', ')}</span>}
                </span>
              )}
            </Link>
          )
        })}
        {lista.length === 0 && <p className="etiqueta">No hay ejercicios con esos filtros.</p>}
      </div>
    </>
  )
}
