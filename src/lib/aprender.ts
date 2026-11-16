/* Base de conocimiento: artículos y guías por nivel, búsqueda local con sinónimos. Todo sin internet. */
import articulosJson from '../content/aprender/articulos.json'

export type NivelLectura = 'principiante' | 'intermedio' | 'avanzado'
export const NIVELES_LECTURA: { valor: NivelLectura; texto: string }[] = [
  { valor: 'principiante', texto: 'Principiante' },
  { valor: 'intermedio', texto: 'Intermedio' },
  { valor: 'avanzado', texto: 'Avanzado' },
]

export const CATEGORIAS: { valor: string; texto: string }[] = [
  { valor: 'guias', texto: 'Guías prácticas' },
  { valor: 'cuerpo', texto: 'Tu cuerpo' },
  { valor: 'entrenamiento', texto: 'Ciencia del entrenamiento' },
  { valor: 'ejercicios', texto: 'Ejercicios' },
  { valor: 'estetica', texto: 'Estética' },
  { valor: 'comida', texto: 'Comida' },
  { valor: 'salud', texto: 'Salud' },
  { valor: 'mente', texto: 'Mente y hábitos' },
  { valor: 'combate', texto: 'Técnica de combate' },
  { valor: 'app', texto: 'Cómo usar la app' },
]

export interface Articulo {
  id: string
  categoria: string
  titulo: string
  resumen: string
  etiquetas: string[]
  /** Clave del dibujo: "ej:<id de ejercicio>" o un dibujo propio de src/content/dibujos-aprender.tsx. */
  dibujo: string
  niveles: Partial<Record<NivelLectura, string[]>>
  fuentes: { texto: string; enlace: string }[]
}

export const ARTICULOS = articulosJson as Articulo[]
const POR_ID = new Map(ARTICULOS.map((a) => [a.id, a]))
export const articulo = (id: string) => POR_ID.get(id)

const ORDEN: NivelLectura[] = ['principiante', 'intermedio', 'avanzado']

/** Texto del nivel pedido; si el artículo no lo tiene, el nivel más cercano por debajo (o el primero que haya). */
export function textoNivel(a: Articulo, nivel: NivelLectura): { nivel: NivelLectura; parrafos: string[] } {
  for (let i = ORDEN.indexOf(nivel); i >= 0; i--) {
    const p = a.niveles[ORDEN[i]]
    if (p?.length) return { nivel: ORDEN[i], parrafos: p }
  }
  const primero = ORDEN.find((n) => a.niveles[n]?.length) ?? 'principiante'
  return { nivel: primero, parrafos: a.niveles[primero] ?? [] }
}

/** Nivel de lectura sugerido a partir del nivel de 1 a 5 de la última evaluación (decisión de diseño). */
export function nivelLecturaPorNivel(nivel?: number): NivelLectura {
  if (!nivel || nivel <= 2) return 'principiante'
  return nivel === 3 ? 'intermedio' : 'avanzado'
}

/* ---------- Búsqueda ---------- */

/** Grupos de palabras que se buscan como si fueran la misma (sin acentos, en minúscula). */
export const SINONIMOS: string[][] = [
  ['panza', 'abdomen', 'barriga', 'vientre', 'abdominal', 'abdominales', 'rollos'],
  ['agujetas', 'dolor muscular', 'doms', 'dolorido', 'molestia'],
  ['fumar', 'cigarrillo', 'cigarrillos', 'tabaco', 'pucho', 'puchos', 'nicotina'],
  ['correr', 'trotar', 'trote', 'running', 'carrera'],
  ['soga', 'comba', 'cuerda', 'saltar'],
  ['bici', 'bicicleta', 'ciclismo', 'pedalear'],
  ['dormir', 'sueno', 'descanso', 'descansar', 'insomnio'],
  ['comida', 'comer', 'alimentacion', 'dieta', 'nutricion', 'proteina', 'proteinas'],
  ['habito', 'habitos', 'constancia', 'motivacion', 'ganas', 'disciplina'],
  ['grasa', 'adelgazar', 'bajar de peso', 'quemar', 'definir', 'definicion'],
  ['respirar', 'respiracion', 'aire', 'ansiedad', 'nervios'],
  ['caminar', 'caminata', 'pasos', 'andar'],
  ['progresar', 'progresion', 'subir', 'sobrecarga', 'estancado'],
  ['escritorio', 'oficina', 'sentado', 'computadora', 'compu'],
]

const VACIAS = new Set('de del la las el los un una unos unas y o en con sin por para que como se mi mis tu tus me al lo es hay mas muy cuanto cuanta cual'.split(' '))

export const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Raíz muy simple para plurales: "flexiones" → "flexion", "pesas" → "pesa". */
export function raiz(p: string): string {
  if (p.length > 5 && p.endsWith('es') && !p.endsWith('ees')) return p.slice(0, -2)
  if (p.length > 4 && p.endsWith('s')) return p.slice(0, -1)
  return p
}

/** Convierte lo que escribió la persona en grupos de términos: alcanza con que aparezca uno de cada grupo. */
export function terminos(consulta: string): string[][] {
  let q = ` ${normalizar(consulta)} `
  const grupos: string[][] = []
  for (const g of SINONIMOS) {
    const miembro = [...g].sort((a, b) => b.length - a.length).find((m) => q.includes(` ${m} `) || q.includes(` ${raiz(m)} `))
    if (miembro) {
      grupos.push(g.map(raiz))
      q = q.replace(` ${q.includes(` ${miembro} `) ? miembro : raiz(miembro)} `, ' ')
    }
  }
  for (const p of q.split(' ')) if (p.length >= 3 && !VACIAS.has(p)) grupos.push([raiz(p)])
  return grupos
}

export interface Resultado {
  id: string
  puntos: number
}

/** Busca en una lista de textos, por comienzo de palabra. Título pesa 3, etiquetas 2, el resto 1.
    Primero se piden todos los grupos; si nada los tiene a todos, se muestran los que tienen más. */
export function buscarEn(items: { id: string; titulo: string; etiquetas: string; cuerpo: string }[], consulta: string): Resultado[] {
  const gs = terminos(consulta)
  if (!gs.length) return []
  const tiene = (texto: string, g: string[]) => g.some((x) => texto.includes(` ${x}`))
  const parciales: (Resultado & { grupos: number })[] = []
  for (const it of items) {
    const t = ` ${normalizar(it.titulo)}`
    const e = ` ${normalizar(it.etiquetas)}`
    const c = ` ${normalizar(it.cuerpo)}`
    let puntos = 0
    let grupos = 0
    for (const g of gs) {
      const p = tiene(t, g) ? 3 : tiene(e, g) ? 2 : tiene(c, g) ? 1 : 0
      if (p) grupos++
      puntos += p
    }
    if (grupos) parciales.push({ id: it.id, puntos, grupos })
  }
  const mejor = Math.max(0, ...parciales.map((r) => r.grupos))
  return parciales
    .filter((r) => r.grupos === mejor)
    .sort((a, b) => b.puntos - a.puntos)
    .map(({ id, puntos }) => ({ id, puntos }))
}

const INDICE = ARTICULOS.map((a) => ({
  id: a.id,
  titulo: a.titulo,
  etiquetas: a.etiquetas.join(' '),
  cuerpo: [a.resumen, ...Object.values(a.niveles).flat()].join(' '),
}))

export const buscarArticulos = (consulta: string) => buscarEn(INDICE, consulta).map((r) => POR_ID.get(r.id) as Articulo)

/** Revisa que el contenido esté completo: categoría válida, dibujo, fuentes y texto para principiantes. */
export function revisarArticulos(existeDibujo: (clave: string) => boolean): string[] {
  const errores: string[] = []
  const cats = new Set(CATEGORIAS.map((c) => c.valor))
  const ids = new Set<string>()
  for (const a of ARTICULOS) {
    if (ids.has(a.id)) errores.push(`${a.id}: id repetido`)
    ids.add(a.id)
    if (!cats.has(a.categoria)) errores.push(`${a.id}: categoría ${a.categoria}`)
    if (!a.dibujo || !existeDibujo(a.dibujo)) errores.push(`${a.id}: sin dibujo`)
    if (!a.fuentes.length) errores.push(`${a.id}: sin fuentes`)
    if (!a.niveles.principiante?.length) errores.push(`${a.id}: sin texto principiante`)
  }
  return errores
}
