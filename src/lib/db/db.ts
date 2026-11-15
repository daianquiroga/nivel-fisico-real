import Dexie, { type EntityTable } from 'dexie'

/* Base de datos local (IndexedDB). Todo queda en el celular del usuario.
   Reglas: cada cambio de esquema es una versión nueva; nunca borrar datos del usuario en una migración. */

export type Sexo = 'h' | 'm'

export interface Perfil {
  id: 'yo'
  sexo?: Sexo
  edad?: number
  alturaCm?: number
  pesoKg?: number
  objetivos?: { estetica: number; condicion: number; combate: number }
  zonas?: string[]
  limitaciones?: string[]
  fumar?: { activo: boolean; fechaDejo?: string; precioAtado?: number; atadosPorDia?: number }
  /** Respuestas del cuestionario de salud (true = sí). apto = todas en no. */
  salud?: { respuestas: boolean[]; apto: boolean; fecha: string }
  inicioCompleto?: boolean
  creado: string
  actualizado: string
}

export interface Lugar {
  id?: number
  nombre: string
  equipo: string[]
  /** Peso total de mancuernas y discos, si tiene. */
  pesoTotalKg?: number
  espacio: '1x1' | '2x2' | 'amplio'
}

export interface Evaluacion {
  id?: number
  fecha: string
  modo: 'completa' | 'rapida'
  datos: Record<string, unknown>
  resultados?: Record<string, unknown>
}

export interface Registro {
  id?: number
  fecha: string
  tipo: string
  datos: Record<string, unknown>
}

export interface Ajuste {
  clave: string
  valor: unknown
}

export type BaseDatos = Dexie & {
  perfil: EntityTable<Perfil, 'id'>
  lugares: EntityTable<Lugar, 'id'>
  evaluaciones: EntityTable<Evaluacion, 'id'>
  registros: EntityTable<Registro, 'id'>
  ajustes: EntityTable<Ajuste, 'clave'>
}

export const TABLAS = ['perfil', 'lugares', 'evaluaciones', 'registros', 'ajustes'] as const
export type NombreTabla = (typeof TABLAS)[number]

export function crearBaseDatos(nombre = 'nivel-fisico-real'): BaseDatos {
  const db = new Dexie(nombre) as BaseDatos
  db.version(1).stores({
    perfil: 'id',
    lugares: '++id, nombre',
    evaluaciones: '++id, fecha',
    registros: '++id, fecha, tipo, [tipo+fecha]',
    ajustes: 'clave',
  })
  return db
}

export const db = crearBaseDatos()

/** Pide al navegador que no borre los datos aunque falte espacio. */
export async function pedirAlmacenamientoPersistente(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true
      return await navigator.storage.persist()
    }
  } catch {
    /* algunos navegadores no lo permiten; la app funciona igual */
  }
  return false
}
