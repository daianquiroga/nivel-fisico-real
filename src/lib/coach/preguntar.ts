/* "Preguntarle a Claude": arma un texto con tus datos para pegar en la app de Claude.
   No se manda nada a ningún servidor: el texto se copia al portapapeles y la persona decide dónde pegarlo.
   Nunca incluye fotos. Los horarios, la salud y las notas del diario se pueden sacar. */
import type { NivelLectura } from '../aprender'
import { NOMBRES_AREA, type Area } from '../calc/puntajes'

export interface DatosPregunta {
  hoy: string
  nivel: NivelLectura
  perfil: {
    sexo?: 'h' | 'm'
    edad?: number
    alturaCm?: number
    pesoKg?: number
    objetivos?: { estetica: number; condicion: number; combate: number }
    zonas: string[]
    limitaciones: string[]
    aptoCuestionario?: boolean
    diasSinFumar?: number
  }
  evaluacion?: { fecha: string; condicion?: number; edadFisica?: number; vo2?: number; grasa?: number; areas: Partial<Record<Area, number>> }
  etapa?: { numero: number; nombre: string; semanas: number }
  plan: { dia: string; sesiones: { titulo: string; lugar?: string; desde?: string; hasta?: string; minutos: number; ejercicios: string[] }[] }[]
  sesionesHechas: { fecha: string; titulo: string; version: string; minutos: number; esfuerzo?: number; nota?: string }[]
  ejercicios: { nombre: string; fecha: string; series: string }[]
  controles: { fecha: string; sueno: number; energia: number; dolor: string; zona?: string }[]
  pasosPromedio?: number
  cintura?: { fecha: string; cm: number }[]
  consejos: string[]
}

export interface OpcionesPregunta {
  horarios: boolean
  salud: boolean
  diario: boolean
}

const TONO: Record<NivelLectura, string> = {
  principiante: 'Soy principiante: explicame simple, paso a paso y sin jerga.',
  intermedio: 'Tengo algo de experiencia: explicame claro y con algo de detalle.',
  avanzado: 'Tengo experiencia: podés usar términos técnicos (RIR, volumen, periodización).',
}

const coma = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
const fecha = (f: string) => f.slice(0, 10)

export function armarTextoClaude(d: DatosPregunta, o: OpcionesPregunta, pregunta = ''): string {
  const l: string[] = []
  l.push('Hola, Claude. Uso la app Nivel Físico Real para entrenar. Te paso mis datos (los resultados son estimaciones de la app, no mediciones de laboratorio).')
  l.push(TONO[d.nivel])
  l.push('No me diagnostiques: si algo puede ser un problema de salud, decime que consulte a un profesional.')
  l.push('')
  l.push(`Mi pregunta: ${pregunta.trim() || '(escribila acá)'}`)
  l.push('')

  const p = d.perfil
  l.push('## Perfil')
  const base = [p.sexo ? (p.sexo === 'h' ? 'hombre' : 'mujer') : null, p.edad ? `${p.edad} años` : null, p.alturaCm ? `${p.alturaCm} cm` : null, p.pesoKg ? `${coma(p.pesoKg)} kg` : null]
  if (base.some(Boolean)) l.push(`- ${base.filter(Boolean).join(', ')}`)
  if (p.objetivos) l.push(`- Objetivos (de 100 puntos): verme mejor ${p.objetivos.estetica}, condición física ${p.objetivos.condicion}, combate ${p.objetivos.combate}`)
  if (p.zonas.length) l.push(`- Zonas que quiero mejorar: ${p.zonas.join(', ')}`)
  if (o.salud) {
    if (p.limitaciones.length) l.push(`- Cuidar: ${p.limitaciones.join(', ')}`)
    if (p.aptoCuestionario !== undefined) l.push(`- Cuestionario de salud antes de entrenar: ${p.aptoCuestionario ? 'todo en no' : 'alguna respuesta en sí'}`)
    if (p.diasSinFumar !== undefined) l.push(`- Dejé de fumar hace ${p.diasSinFumar} días`)
  }
  l.push(`- Nivel de lectura elegido: ${d.nivel}`)

  if (d.evaluacion) {
    const e = d.evaluacion
    l.push('', `## Última evaluación (${fecha(e.fecha)})`)
    if (e.condicion !== undefined) l.push(`- Condición física: ${Math.round(e.condicion)} de 100`)
    if (e.edadFisica !== undefined) l.push(`- Edad física estimada: ${Math.round(e.edadFisica)} años`)
    if (e.vo2 !== undefined) l.push(`- VO2máx estimado: ${coma(e.vo2)} ml/kg/min`)
    if (e.grasa !== undefined) l.push(`- Grasa estimada: ${coma(e.grasa)} %`)
    const areas = (Object.entries(e.areas) as [Area, number][]).map(([a, v]) => `${NOMBRES_AREA[a].toLowerCase()} ${Math.round(v)}`)
    if (areas.length) l.push(`- Percentil por área (de 0 a 100, contra personas de mi edad y sexo): ${areas.join(', ')}`)
  }
  if (d.etapa) l.push('', '## Etapa', `- Etapa ${d.etapa.numero} de 5 (${d.etapa.nombre}), hace ${d.etapa.semanas} semanas`)

  const conSesion = d.plan.filter((x) => x.sesiones.length)
  if (conSesion.length) {
    l.push('', '## Plan de la semana')
    for (const x of conSesion) {
      for (const s of x.sesiones) {
        const hora = o.horarios && s.desde ? ` ${s.desde}${s.hasta ? `–${s.hasta}` : ''}` : ''
        const lugar = o.horarios && s.lugar ? (s.lugar === 'Afuera' ? ' al aire libre' : ` en ${s.lugar}`) : ''
        l.push(`- ${x.dia}${hora}${lugar}: ${s.titulo}${s.titulo.includes('minutos') ? '' : ` (${s.minutos} min)`}${s.ejercicios.length ? `: ${s.ejercicios.join('; ')}` : ''}`)
      }
    }
  }

  if (d.sesionesHechas.length) {
    l.push('', '## Sesiones hechas (últimas 2 semanas)')
    for (const s of d.sesionesHechas) {
      const nota = o.diario && s.nota ? ` · nota: ${s.nota}` : ''
      l.push(`- ${fecha(s.fecha)}: ${s.titulo}, versión ${s.version}, ${s.minutos} min${s.esfuerzo ? `, esfuerzo ${s.esfuerzo}/10` : ''}${nota}`)
    }
  }
  if (d.ejercicios.length) {
    l.push('', '## Última vez de cada ejercicio (repeticiones o segundos × peso, y RIR = repeticiones en reserva)')
    for (const e of d.ejercicios) l.push(`- ${e.nombre} (${fecha(e.fecha)}): ${e.series}`)
  }
  if (d.controles.length) {
    l.push('', '## Control diario (últimos 7 días)')
    for (const c of d.controles) {
      const dolor = c.dolor !== 'ninguno' && o.salud ? `, ${c.dolor}${c.zona ? ` en ${c.zona}` : ''}` : ''
      l.push(`- ${c.fecha}: durmió ${coma(c.sueno)} h, energía ${c.energia}/5${dolor}`)
    }
  }
  const extra: string[] = []
  if (d.pasosPromedio) extra.push(`- Pasos: ${d.pasosPromedio.toLocaleString('es-AR')} por día de promedio (últimas 2 semanas)`)
  if (d.cintura?.length) extra.push(`- Cintura: ${d.cintura.map((c) => `${coma(c.cm)} cm (${fecha(c.fecha)})`).join(', ')}`)
  if (extra.length) l.push('', '## Actividad y medidas', ...extra)
  if (d.consejos.length) l.push('', '## Lo que me sugirió la app hoy', ...d.consejos.map((c) => `- ${c}`))
  return l.join('\n')
}
