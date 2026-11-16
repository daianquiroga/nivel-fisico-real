import { db } from '../db/db'
import { leerControles, leerPasos, leerTipo, sesionesHechas, ultimosDias, type Medidas } from '../diario'
import { ejercicio } from '../ejercicios'
import type { Resultados } from '../evaluacion'
import { diasSinFumar } from '../fumar'
import { LIMITACIONES, NOMBRES_DIAS, ZONAS, cargarInicio } from '../perfil'
import { leerPlan } from '../plan/usarPlan'
import { fechaLocal } from '../plan/sesion'
import { todasLasSesiones } from '../registroEjercicios'
import type { NivelLectura } from '../aprender'
import { calcularCoach } from './usarCoach'
import type { DatosPregunta } from './preguntar'

const texto = (lista: { valor: string; texto: string }[], v: string) => lista.find((x) => x.valor === v)?.texto.toLowerCase() ?? v
const coma = (n: number) => String(n).replace('.', ',')

/** Junta los datos del celular para el texto de "Preguntarle a Claude" (sin fotos). */
export async function juntarDatosPregunta(nivel: NivelLectura): Promise<DatosPregunta> {
  const [{ perfil }, plan, controles, hechas, sesiones, medidas, evs, pasos, coach] = await Promise.all([
    cargarInicio(),
    leerPlan(),
    leerControles(),
    sesionesHechas(),
    todasLasSesiones(),
    leerTipo<Medidas>('medidas'),
    db.evaluaciones.orderBy('fecha').toArray(),
    leerPasos(),
    calcularCoach(nivel),
  ])
  const hoy = fechaLocal()
  const hace = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return fechaLocal(d)
  }
  const ultimaEv = evs[evs.length - 1]
  const r = ultimaEv?.resultados as Resultados | undefined

  const ultimaPorEj = new Map<string, (typeof sesiones)[number]>()
  for (const s of sesiones) ultimaPorEj.set(s.ejercicio, s)
  const recientes = [...ultimaPorEj.values()].filter((s) => s.fecha.slice(0, 10) >= hace(28)).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const dias14 = ultimosDias(pasos, 14).filter((d) => d.pasos > 0)
  const fumar = perfil?.fumar

  return {
    hoy,
    nivel,
    perfil: {
      sexo: perfil?.sexo,
      edad: perfil?.edad,
      alturaCm: perfil?.alturaCm,
      pesoKg: perfil?.pesoKg,
      objetivos: perfil?.objetivos,
      zonas: (perfil?.zonas ?? []).map((z) => texto(ZONAS, z)),
      limitaciones: (perfil?.limitaciones ?? []).map((z) => texto(LIMITACIONES, z)),
      aptoCuestionario: perfil?.salud?.apto,
      diasSinFumar: fumar?.activo && fumar.fechaDejo ? diasSinFumar(fumar.fechaDejo) : undefined,
    },
    evaluacion: ultimaEv && r ? { fecha: ultimaEv.fecha, condicion: r.condicion, edadFisica: r.edadFisica, vo2: r.vo2, grasa: r.composicion?.grasa, areas: r.areas ?? {} } : undefined,
    etapa: coach.etapa ? { numero: coach.etapa.numero, nombre: coach.etapa.nombre, semanas: coach.etapa.semanas } : undefined,
    plan: (plan?.dias ?? []).map((d, i) => ({
      dia: NOMBRES_DIAS[i],
      sesiones: d.sesiones
        .filter((s) => s.ejercicios.length > 0)
        .map((s) => ({
          titulo: s.titulo,
          lugar: s.lugar,
          desde: s.desde,
          hasta: s.hasta,
          minutos: s.minutos,
          ejercicios: s.ejercicios.map((e) => {
            const ej = ejercicio(e.id)
            const unidad = ej?.tipo === 'segundos' ? ' s' : ej?.tipo === 'minutos' ? ' min' : ''
            const rango = e.rango[0] === e.rango[1] ? `${e.rango[0]}` : `${e.rango[0]}-${e.rango[1]}`
            return `${ej?.nombre ?? e.id} ${e.series}×${rango}${unidad}`
          }),
        })),
    })),
    sesionesHechas: hechas
      .filter((h) => h.fecha.slice(0, 10) >= hace(14))
      .map((h) => ({
        fecha: h.fecha,
        titulo: h.titulo,
        version: h.version,
        minutos: h.minutos,
        esfuerzo: h.esfuerzo,
        nota: [h.diario?.bien, h.diario?.mejorar, h.diario?.sentir].filter(Boolean).join(' / ') || undefined,
      })),
    ejercicios: recientes.map((s) => ({
      nombre: ejercicio(s.ejercicio)?.nombre ?? s.ejercicio,
      fecha: s.fecha,
      series: s.series.map((x) => `${x.reps}${x.carga ? ` × ${coma(x.carga)} kg` : ''}${x.banda ? ` banda ${x.banda}` : ''} (RIR ${x.rir})`).join(', '),
    })),
    controles: controles
      .filter((c) => c.fecha >= hace(6))
      .map((c) => ({ fecha: c.fecha, sueno: c.sueno, energia: c.energia, dolor: c.dolor, zona: c.zona ? texto(LIMITACIONES, c.zona) : undefined })),
    pasosPromedio: dias14.length ? Math.round(dias14.reduce((a, d) => a + d.pasos, 0) / dias14.length) : undefined,
    cintura: medidas
      .filter((m) => m.valores?.cintura)
      .slice(-4)
      .map((m) => ({ fecha: m.fecha, cm: m.valores.cintura })),
    consejos: coach.consejos.map((c) => `${c.titulo}: ${c.texto}`),
  }
}
