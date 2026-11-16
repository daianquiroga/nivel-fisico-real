/* Coach sin IA: reglas "condición → mensaje + acción" evaluadas con los datos guardados en el celular
   (ESPECIFICACION.md, sección 13.3). Cada mensaje tiene una versión simple con pasos (principiante),
   una normal (intermedio) y una con más detalle técnico (avanzado). */
import type { EstadoCarga } from '../calc/carga'
import type { NivelLectura } from '../aprender'
import { NOMBRES_AREA, type Area } from '../calc/puntajes'
import { sugerir, type Contexto, type Sesion } from '../calc/progresion'
import type { ControlDia } from '../plan/sesion'
import type { EstadoEtapa, EvaluacionAreas } from './etapas'

export type Accion = { tipo: 'ir'; texto: string; a: string } | { tipo: 'limitacion'; texto: string; valor: string } | { tipo: 'etapa'; texto: string }

export interface Consejo {
  id: string
  clase: 'aviso' | 'sugerencia' | 'celebrar'
  titulo: string
  texto: string
  pasos?: string[]
  accion?: Accion
  /** Más alto = se muestra antes. */
  prioridad: number
}

export interface EjercicioCoach {
  id: string
  nombre: string
  ctx: Contexto
  sesiones: Sesion[]
}

export interface DatosCoach {
  hoy: string
  control?: ControlDia
  /** Limitaciones ya activas en el perfil. */
  limitaciones: string[]
  nombreZona?: string
  /** Sesiones planeadas seguidas que no se hicieron, contando desde ayer hacia atrás. */
  faltasSeguidas: number
  /** Ruta para entrenar hoy, si hay sesión. */
  rutaHoy?: string
  ejercicios: EjercicioCoach[]
  cinturas: { fecha: string; cm: number }[]
  objetivoGrasa: boolean
  evaluaciones: EvaluacionAreas[]
  etapa?: EstadoEtapa
  /** Carga de los últimos 7 días contra las 3 semanas anteriores (lib/calc/carga.ts). */
  carga?: EstadoCarga
}

interface Mensaje {
  simple: string
  pasos?: string[]
  tecnico?: string
}

const DIA = 86_400_000
const dias = (a: string, b: string) => Math.round((new Date(b.slice(0, 10)).getTime() - new Date(a.slice(0, 10)).getTime()) / DIA)

function armar(nivel: NivelLectura, m: Mensaje): Pick<Consejo, 'texto' | 'pasos'> {
  if (nivel === 'principiante') return { texto: m.simple, pasos: m.pasos }
  if (nivel === 'avanzado') return { texto: m.tecnico ?? m.simple }
  return { texto: m.simple }
}

/** Cintura: compara la última medida con la más cercana a 4 semanas antes (entre 3 y 5 semanas). */
export function subaCintura(cinturas: { fecha: string; cm: number }[]): number | null {
  if (cinturas.length < 2) return null
  const orden = [...cinturas].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const ultima = orden[orden.length - 1]
  const antes = orden
    .filter((c) => {
      const d = dias(c.fecha, ultima.fecha)
      return d >= 21 && d <= 35
    })
    .sort((a, b) => Math.abs(dias(a.fecha, ultima.fecha) - 28) - Math.abs(dias(b.fecha, ultima.fecha) - 28))[0]
  return antes ? Math.round((ultima.cm - antes.cm) * 10) / 10 : null
}

/** Áreas que mejoraron al menos 5 puntos de percentil en el último retest (si fue en las últimas 2 semanas). */
export function mejorasRetest(evs: EvaluacionAreas[], hoy: string): Area[] {
  const orden = [...evs].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const u = orden[orden.length - 1]
  const p = orden[orden.length - 2]
  if (!u || !p || dias(u.fecha, hoy) > 14) return []
  return (Object.keys(u.areas) as Area[]).filter((a) => p.areas[a] !== undefined && (u.areas[a] as number) - (p.areas[a] as number) >= 5)
}

export function consejos(d: DatosCoach, nivel: NivelLectura): Consejo[] {
  const out: Consejo[] = []
  const c = d.control?.fecha === d.hoy ? d.control : undefined

  // Molestia o dolor marcado hoy → modo limitación.
  if (c && c.dolor !== 'ninguno' && c.zona) {
    const activa = d.limitaciones.includes(c.zona)
    const zona = d.nombreZona?.toLowerCase() ?? 'esa zona'
    out.push({
      id: `limitacion-${c.zona}`,
      clase: 'aviso',
      prioridad: 100,
      titulo: c.dolor === 'dolor' ? `Dolor en ${zona}` : `Molestia en ${zona}`,
      ...armar(nivel, {
        simple: activa
          ? `Ya tenés el modo cuidado de ${zona}: los ejercicios que la cargan se cambian solos. Si el dolor sigue o empeora, consultá a un profesional.`
          : `Activá el modo cuidado de ${zona}: la app saca o adapta los ejercicios que la cargan.`,
        pasos: activa ? undefined : ['Tocá el botón de abajo.', 'Entrená con la sesión que te propone la app.', 'Si el dolor es punzante, sigue o empeora, pará y consultá.'],
        tecnico: `${activa ? 'Modo limitación activo.' : 'Conviene activar el modo limitación.'} Se filtran o adaptan los ejercicios con carga en ${zona}; entrená sin dolor (molestia tolerable de 3 de 10 como máximo) y consultá si dura más de una semana.`,
      }),
      accion: activa ? undefined : { tipo: 'limitacion', texto: `Activar cuidado de ${zona}`, valor: c.zona },
    })
  }

  // Dormiste menos de 6 h → sesión reducida.
  if (c && c.sueno < 6) {
    out.push({
      id: 'sueno',
      clase: 'aviso',
      prioridad: 90,
      titulo: 'Dormiste poco',
      ...armar(nivel, {
        simple: `Dormiste ${String(c.sueno).replace('.', ',')} horas. Hoy hacé la versión reducida: una serie menos y nada al máximo.`,
        pasos: ['Tocá Entrenar.', 'Elegí "Reducida".', 'Cortá cada serie cuando sientas que podías hacer 3 más (en vez de 2).'],
        tecnico: 'Con menos de 6 h de sueño baja la capacidad de trabajo y sube el esfuerzo percibido: menos volumen (−1 serie por ejercicio) y RIR 3 o más. Una noche no cambia el progreso; varias seguidas sí.',
      }),
      accion: d.rutaHoy ? { tipo: 'ir', texto: 'Entrenar reducida', a: d.rutaHoy } : undefined,
    })
  }

  // La carga subió de golpe (más de 1,5 veces el promedio) → bajar un poco la semana que viene.
  if (d.carga === 'subida') {
    out.push({
      id: 'carga-subida',
      clase: 'aviso',
      prioridad: 70,
      titulo: 'Subiste mucho la carga',
      ...armar(nivel, {
        simple: 'Esta semana entrenaste bastante más (esfuerzo × minutos) que las anteriores. Si estás cansado o con molestias, la próxima semana bajala un poco.',
        pasos: ['Mirá tu carga en Progreso.', 'Si te sentís cansado, usá versiones reducidas unos días.', 'Subí de a poco: no más de la mitad de golpe.'],
        tecnico: 'Carga de los últimos 7 días mayor a 1,5 veces el promedio de las 3 semanas anteriores (session-RPE, Foster 2001). Corte de diseño de la app; la relación aguda:crónica no predice lesiones (Impellizzeri 2020), solo marca un cambio brusco.',
      }),
      accion: { tipo: 'ir', texto: 'Ver mi carga', a: '/progreso' },
    })
  }

  // Faltó dos veces seguidas → vuelta con la versión mínima.
  if (d.faltasSeguidas >= 2) {
    out.push({
      id: 'vuelta',
      clase: 'sugerencia',
      prioridad: 80,
      titulo: 'Volvé hoy, aunque sea un poco',
      ...armar(nivel, {
        simple: `Faltaste ${d.faltasSeguidas} sesiones seguidas. No pasa nada: hoy hacé la versión mínima de 10 minutos para retomar.`,
        pasos: ['Tocá Entrenar.', 'Elegí "Mínima".', 'Solo eso cuenta para la racha.'],
        tecnico: `${d.faltasSeguidas} sesiones seguidas sin hacer. Retomá con la versión mínima: lo que sostiene el hábito es la frecuencia, no el volumen de una sesión. La fuerza se mantiene varias semanas sin entrenar.`,
      }),
      accion: d.rutaHoy ? { tipo: 'ir', texto: 'Hacer la mínima', a: d.rutaHoy } : { tipo: 'ir', texto: 'Ver el plan', a: '/plan' },
    })
  }

  // Ejercicios: estancado o listo para el escalón siguiente (solo los anotados en las últimas 3 semanas).
  for (const e of d.ejercicios) {
    const ultima = e.sesiones[e.sesiones.length - 1]
    if (!ultima || dias(ultima.fecha, d.hoy) > 21) continue
    const s = sugerir(e.sesiones, e.ctx)
    if (s.tipo === 'estancado') {
      out.push({
        id: `estancado-${e.id}`,
        clase: 'sugerencia',
        prioridad: 60,
        titulo: `${e.nombre}: 3 sesiones sin mejorar`,
        ...armar(nivel, {
          simple: e.ctx.carga === 'externa' ? 'Bajá un 10 % el peso y volvé a subir de a poco, o cambiá por una variante.' : 'Probá la variante más fácil unas semanas o cambiá de ejercicio.',
          pasos: ['Abrí la ficha.', e.ctx.carga === 'externa' ? 'Usá el peso que te sugiere (10 % menos).' : 'Mirá la escalera y elegí el escalón anterior.', 'Revisá si estás durmiendo bien.'],
          tecnico: 'Estancamiento: 3 sesiones sin superar el mejor rendimiento (máximo estimado o repeticiones totales). Opciones: descarga del 10 % y reconstruir, cambiar de variante o revisar recuperación (sueño, proteína, volumen semanal).',
        }),
        accion: { tipo: 'ir', texto: 'Ver la ficha', a: `/ejercicio/${e.id}` },
      })
    } else if (s.tipo === 'siguiente-variante') {
      out.push({
        id: `escalon-${e.id}`,
        clase: 'celebrar',
        prioridad: 50,
        titulo: `${e.nombre}: ya podés subir de escalón`,
        ...armar(nivel, {
          simple: 'Dos sesiones seguidas en el tope del rango con reserva. Pasá al ejercicio siguiente de la escalera.',
          pasos: ['Abrí la ficha.', 'Tocá el escalón siguiente.', 'Empezá con el mínimo del rango.'],
          tecnico: 'Criterio de escalón cumplido: tope del rango con RIR ≥ 2 en todas las series, dos sesiones seguidas. Pasá a la variante más difícil y volvé al mínimo del rango.',
        }),
        accion: { tipo: 'ir', texto: 'Ver la escalera', a: `/ejercicio/${e.id}` },
      })
    }
  }

  // Cintura sube 2 cm en 4 semanas con objetivo de bajar grasa → revisar comida.
  const sube = subaCintura(d.cinturas)
  if (d.objetivoGrasa && sube !== null && sube >= 2) {
    out.push({
      id: 'cintura',
      clase: 'sugerencia',
      prioridad: 55,
      titulo: `La cintura subió ${String(sube).replace('.', ',')} cm en 4 semanas`,
      ...armar(nivel, {
        simple: 'Si querés bajar grasa, revisá la comida: es lo que más influye. El entrenamiento solo no alcanza.',
        pasos: ['Leé "Proteína y porciones con la mano".', 'Achicá un poco los hidratos en 1 o 2 comidas.', 'Volvé a medir en 2 semanas, a la mañana y en ayunas.'],
        tecnico: 'Un aumento de 2 cm de cintura en 4 semanas sugiere superávit de energía. Revisá ingesta (porciones, bebidas, picoteo), mantené proteína alta (1,6 a 2,2 g/kg) y medí siempre en las mismas condiciones.',
      }),
      accion: { tipo: 'ir', texto: 'Leer sobre porciones', a: '/aprender/proteina-porciones' },
    })
  }

  // Retest con mejora → celebrar.
  const mejoras = mejorasRetest(d.evaluaciones, d.hoy)
  if (mejoras.length) {
    const lista = mejoras.map((a) => NOMBRES_AREA[a].toLowerCase()).join(', ')
    out.push({
      id: 'retest',
      clase: 'celebrar',
      prioridad: 70,
      titulo: '¡Mejoraste en el retest!',
      ...armar(nivel, {
        simple: `Subiste en ${lista}. Es el resultado de tus sesiones: seguí así.`,
        tecnico: `Mejora de 5 puntos de percentil o más en ${lista} respecto de la evaluación anterior.`,
      }),
      accion: { tipo: 'ir', texto: 'Ver mi progreso', a: '/progreso' },
    })
  }

  // Etapa cumplida → pasar de etapa.
  if (d.etapa?.lista) {
    out.push({
      id: `etapa-${d.etapa.numero}`,
      clase: 'celebrar',
      prioridad: 75,
      titulo: `Cumpliste la etapa ${d.etapa.numero}: ${d.etapa.nombre}`,
      ...armar(nivel, {
        simple: 'Cumpliste los requisitos para pasar a la etapa siguiente. El plan se vuelve un poco más exigente: una serie más en los ejercicios principales.',
        tecnico: '8 semanas o más, 80 % de cumplimiento, mejora de cardio y fuerza en el retest y técnica aprobada en los 6 básicos. La etapa nueva suma una serie a los ejercicios principales (y desde la 3, a los accesorios).',
      }),
      accion: { tipo: 'etapa', texto: 'Pasar de etapa' },
    })
  }

  return out.sort((a, b) => b.prioridad - a.prioridad)
}
