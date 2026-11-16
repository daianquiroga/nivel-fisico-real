/* Generador de combinaciones y de contragolpes (ESPECIFICACION.md, sección 14).
   Regla biomecánica de la app: dónde queda el peso al terminar una técnica decide cuál sale natural después.
   - Peso adelante (por ejemplo, después del directo) → sigue una técnica de adelante (gancho, jab).
   - Peso atrás (por ejemplo, después del gancho de adelante) → sigue una de atrás (directo, patada baja).
   - Peso al centro (jab, defensas) → sigue cualquiera.
   Además: patadas, rodillas y codos cierran la combinación (salvo el teep, que puede abrirla); una sola defensa,
   al principio (contragolpe) o al final (salida); el clinch y las rodillas solo después de acortar la distancia.
   Son reglas de diseño de la app basadas en fundamentos comunes de enseñanza, no un estándar publicado. */
import type { Tecnica } from './combate'

export type Azar = () => number

export const NOMBRE_CORTO: Record<string, string> = {
  jab: 'jab',
  directo: 'directo',
  gancho: 'gancho',
  uppercut: 'uppercut',
  esquive: 'esquiva',
  rolido: 'pendular',
  bloqueo: 'bloqueo',
  chequeo: 'chequeo',
  'patada-baja': 'patada baja',
  'patada-media': 'patada media',
  teep: 'teep',
  rodilla: 'rodilla',
  codo: 'codo',
  clinch: 'clinch',
  'gyaku-zuki': 'gyaku',
  'patada-lateral': 'lateral',
  derribo: 'derribo',
  sprawl: 'sprawl',
  'pull-back': 'atrás',
  'switch-kick': 'switch',
  'mae-geri': 'mae geri',
  giratoria: 'giratoria',
  'cadena-punos': 'cadena',
  'defensa-360': 'tres sesenta',
  estallido: 'estallido',
  barrido: 'barrido',
  'cambio-nivel': 'cambio de nivel',
}

const DEFENSA = new Set(['defensa'])
const CIERRE = new Set(['patada', 'rodilla', 'codo', 'derribo', 'agarre'])
const ORDEN_DIST = { larga: 0, media: 1, corta: 2, clinch: 3, suelo: 4 } as const

/** Técnicas que se pueden cantar de pie (sin suelo ni caídas). */
export const deCombo = (ts: Tecnica[]) => ts.filter((t) => t.distancia !== 'suelo' && t.tipo !== 'caida' && NOMBRE_CORTO[t.id])

/** ¿Puede abrir una combinación? Se empieza desde lejos (larga o media) o con una defensa (contragolpe). */
export function empiezaBien(t: Tecnica, largo: number): boolean {
  if (DEFENSA.has(t.tipo)) return largo > 1
  if (CIERRE.has(t.tipo) && t.id !== 'teep') return largo === 1
  return t.distancia === 'larga' || t.distancia === 'media'
}

/** ¿Puede ir `b` justo después de `a`? */
export function sigueBien(a: Tecnica, b: Tecnica, posicion: number, largo: number): boolean {
  const ultimo = posicion === largo - 1
  if (CIERRE.has(a.tipo) && a.id !== 'teep') return false // lo que cierra no puede tener nada después
  if (CIERRE.has(b.tipo) && b.id !== 'teep' && !ultimo) return false
  if (b.id === 'teep' && posicion > 0 && !ultimo) return false
  if (DEFENSA.has(b.tipo) && posicion !== 0 && !ultimo) return false
  if (b.id === 'chequeo' || b.id === 'sprawl') return false // reacciones a un ataque: solo abren la combinación
  if (DEFENSA.has(a.tipo) && DEFENSA.has(b.tipo)) return false
  if ((b.distancia === 'clinch' || b.id === 'uppercut' || b.id === 'codo') && ORDEN_DIST[a.distancia] < 1) return false // primero acortar
  if (a.id === b.id && a.id !== 'jab') return false // repetir solo el jab
  if (DEFENSA.has(b.tipo) || b.lado === 'ambos') return true
  if (a.peso === 'adelante') return b.lado === 'adelante'
  if (a.peso === 'atras') return b.lado === 'atras'
  return true
}

/** Largo de la combinación según la complejidad (1 = 2 técnicas, 2 = 2 o 3, 3 = 3 a 5). */
export function largoPara(complejidad: number, azar: Azar): number {
  if (complejidad <= 1) return 2
  if (complejidad === 2) return 2 + Math.floor(azar() * 2)
  return 3 + Math.floor(azar() * 3)
}

/** Arma una combinación que respete las reglas. Si no encuentra con ese largo, prueba más corta. */
export function generarCombo(disponibles: Tecnica[], complejidad: number, azar: Azar = Math.random): Tecnica[] {
  const ts = deCombo(disponibles)
  if (!ts.length) return []
  for (let largo = largoPara(complejidad, azar); largo >= 1; largo--) {
    for (let intento = 0; intento < 40; intento++) {
      const combo: Tecnica[] = []
      for (let i = 0; i < largo; i++) {
        const opciones = ts.filter((t) => {
          if (i === 0) return empiezaBien(t, largo)
          return sigueBien(combo[i - 1], t, i, largo)
        })
        if (!opciones.length) break
        // Los golpes básicos salen más seguido que las técnicas de cierre.
        const pesos = opciones.map((t) => (t.tipo === 'golpe' ? 3 : 1))
        let r = azar() * pesos.reduce((x, y) => x + y, 0)
        let k = 0
        while (r >= pesos[k] && k < opciones.length - 1) r -= pesos[k++]
        combo.push(opciones[k])
      }
      if (combo.length === largo) return combo
    }
  }
  return [ts[0]]
}

export const textoCombo = (c: Tecnica[]) => c.map((t) => NOMBRE_CORTO[t.id] ?? t.nombre).join(', ')

/** Lista fija de combinaciones distintas (para el orden "fijo"). */
export function listaCombos(disponibles: Tecnica[], complejidad: number, cuantas: number, azar: Azar = Math.random): Tecnica[][] {
  const vistos = new Set<string>()
  const out: Tecnica[][] = []
  for (let i = 0; i < cuantas * 20 && out.length < cuantas; i++) {
    const c = generarCombo(disponibles, complejidad, azar)
    const k = c.map((t) => t.id).join('-')
    if (c.length && !vistos.has(k)) {
      vistos.add(k)
      out.push(c)
    }
  }
  return out
}

/** Segundos que se tarda en decir y hacer una combinación: el tempo más medio segundo por técnica. */
export const segundosCombo = (c: Tecnica[], tempo: number) => tempo + c.length * 0.5

/* ---------- Contragolpes ---------- */

export interface Estimulo {
  id: string
  ataque: string
  /** Respuesta según lo que tiene la disciplina, en orden de preferencia (ids de técnicas). */
  respuestas: string[][]
  color: string
}

const ESTIMULOS: Estimulo[] = [
  { id: 'jab', ataque: 'Jab', respuestas: [['esquive', 'directo'], ['bloqueo', 'directo'], ['bloqueo', 'gyaku-zuki']], color: '#e2b861' },
  { id: 'directo', ataque: 'Directo', respuestas: [['esquive', 'gancho'], ['bloqueo', 'jab'], ['bloqueo', 'gyaku-zuki']], color: '#d94a64' },
  { id: 'gancho', ataque: 'Gancho', respuestas: [['rolido', 'directo'], ['bloqueo', 'directo'], ['bloqueo', 'gyaku-zuki']], color: '#8fa8c0' },
  { id: 'patada-baja', ataque: 'Patada baja', respuestas: [['chequeo', 'directo'], ['bloqueo', 'patada-lateral']], color: '#6fbf8e' },
  { id: 'patada-media', ataque: 'Patada media', respuestas: [['bloqueo', 'patada-baja'], ['bloqueo', 'gyaku-zuki']], color: '#b48ce0' },
  { id: 'teep', ataque: 'Teep', respuestas: [['esquive', 'patada-baja'], ['bloqueo', 'directo'], ['bloqueo', 'gyaku-zuki']], color: '#f0f0f0' },
  { id: 'derribo', ataque: 'Derribo', respuestas: [['sprawl'], ['rodilla']], color: '#ff9f43' },
]

/** Estímulos que tienen sentido para las técnicas que sabe la persona, con la primera respuesta posible. */
export function estimulosPara(ids: Set<string>): { estimulo: Estimulo; respuesta: string[] }[] {
  const out: { estimulo: Estimulo; respuesta: string[] }[] = []
  for (const e of ESTIMULOS) {
    const r = e.respuestas.find((rs) => rs.every((x) => ids.has(x)))
    if (r) out.push({ estimulo: e, respuesta: r })
  }
  return out
}

/** Promedio y mejor tiempo de reacción en milisegundos. */
export function resumenReaccion(ms: number[]): { promedio: number; mejor: number } | null {
  if (!ms.length) return null
  return { promedio: Math.round(ms.reduce((a, b) => a + b, 0) / ms.length), mejor: Math.min(...ms) }
}
