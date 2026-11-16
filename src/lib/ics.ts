/* Archivo de calendario (.ics, estándar RFC 5545) con las sesiones del plan, para importar en Google Calendar.
   Hora "flotante" (sin zona): el calendario la toma en la hora del celular. */
import { NOMBRES_DIAS } from './perfil'
import type { PlanSemana } from './plan/generador'
import { intencionPorDefecto, sesionesQueCuentan } from './habitos'

const DIAS_ICS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const dos = (n: number) => String(n).padStart(2, '0')
const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export function generarIcs(plan: PlanSemana, o: { desde?: Date; semanas?: number; intenciones?: Record<string, string> } = {}): string {
  const desde = o.desde ?? new Date()
  const semanas = o.semanas ?? 8
  const sello = `${desde.getUTCFullYear()}${dos(desde.getUTCMonth() + 1)}${dos(desde.getUTCDate())}T000000Z`
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nivel Fisico Real//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const { dia, sesion } of sesionesQueCuentan(plan)) {
    if (!sesion.desde) continue
    // Primer día de ese tipo desde mañana (si es hoy y todavía no pasó la hora, hoy).
    const d = new Date(desde)
    const hoyDia = (d.getDay() + 6) % 7
    let suma = (dia - hoyDia + 7) % 7
    const [h, m] = sesion.desde.split(':').map(Number)
    if (suma === 0 && d.getHours() * 60 + d.getMinutes() >= h * 60 + m) suma = 7
    d.setDate(d.getDate() + suma)
    const fecha = `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}`
    const fin = h * 60 + m + sesion.minutos
    const descripcion = o.intenciones?.[sesion.id] ?? sesion.intencion ?? intencionPorDefecto(NOMBRES_DIAS[dia], sesion)
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${sesion.id}-${dia}@nivel-fisico-real`,
      `DTSTAMP:${sello}`,
      `DTSTART:${fecha}T${dos(h)}${dos(m)}00`,
      `DTEND:${fecha}T${dos(Math.floor(fin / 60) % 24)}${dos(fin % 60)}00`,
      `RRULE:FREQ=WEEKLY;BYDAY=${DIAS_ICS[dia]};COUNT=${semanas}`,
      `SUMMARY:${escapar(sesion.titulo)}`,
      `DESCRIPTION:${escapar(descripcion)}`,
      ...(sesion.lugar ? [`LOCATION:${escapar(sesion.lugar)}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapar(sesion.titulo)}`,
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lineas.push('END:VCALENDAR')
  return lineas.join('\r\n') + '\r\n'
}
