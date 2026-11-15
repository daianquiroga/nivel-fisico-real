/* Progresión de cargas (ESPECIFICACION.md, secciones 6.3 y 6.4).
   - Máximo estimado con la fórmula de Epley: carga × (1 + repeticiones / 30) (Epley 1985).
   - Serie de prueba: más de 4 en reserva → +10 %; de 2 a 4 → igual; menos de 2 → −10 %.
   - Doble progresión: todas las series en el tope del rango con 2 o más en reserva → subir 2,5 a 5 %
     (o pasar a la variante siguiente si es con peso corporal o banda).
   - Estancamiento: 3 sesiones seguidas sin mejorar → bajar 10 % y reconstruir, o cambiar la variante.
   Los porcentajes y criterios son las reglas de diseño de la especificación, basadas en la práctica
   de la doble progresión; no son un estándar publicado único. */

export type TipoCarga = 'corporal' | 'externa' | 'banda'

export interface Serie {
  /** kg (solo con carga externa). */
  carga?: number
  /** Nivel de banda de 1 (muy liviana) a 5 (muy dura). */
  banda?: number
  /** Repeticiones o segundos, según el ejercicio. */
  reps: number
  /** Repeticiones en reserva: 0 a 5 (5 = "5 o más"). */
  rir: number
}

export interface Sesion {
  fecha: string
  series: Serie[]
}

export interface Contexto {
  carga: TipoCarga
  rango: [number, number]
}

export function epley(carga: number, reps: number): number {
  return carga * (1 + reps / 30)
}

/** Ajuste después de la serie de prueba de 10 repeticiones. */
export function ajusteSeriePrueba(carga: number, rir: number): { carga: number; texto: string } {
  if (rir > 4) return { carga: redondear(carga * 1.1), texto: 'Te sobraba mucho: subí un 10 %.' }
  if (rir < 2) return { carga: redondear(carga * 0.9), texto: 'Quedaste muy justo: bajá un 10 %.' }
  return { carga, texto: 'Es tu peso para empezar.' }
}

/** Redondea a 0,5 kg (lo más chico que se suele poder sumar). */
export function redondear(kg: number): number {
  return Math.round(kg * 2) / 2
}

/** Un número que resume la sesión para ver si mejoró: máximo estimado, banda y repeticiones, o repeticiones totales. */
export function rendimiento(s: Sesion, carga: TipoCarga): number {
  if (!s.series.length) return 0
  if (carga === 'externa') return Math.max(...s.series.map((x) => epley(x.carga ?? 0, x.reps)))
  if (carga === 'banda') return Math.max(...s.series.map((x) => (x.banda ?? 1) * 100 + x.reps))
  return s.series.reduce((a, x) => a + x.reps, 0)
}

export function enElTope(s: Sesion, rango: [number, number]): boolean {
  return s.series.length > 0 && s.series.every((x) => x.reps >= rango[1] && x.rir >= 2)
}

export type TipoSugerencia = 'prueba' | 'empezar' | 'subir' | 'siguiente-variante' | 'sumar-reps' | 'estancado' | 'mantener'

export interface Sugerencia {
  tipo: TipoSugerencia
  texto: string
  carga?: number
  reps?: number
}

/** Qué hacer hoy, mirando las sesiones anteriores (de la más vieja a la más nueva). */
export function sugerir(sesiones: Sesion[], ctx: Contexto): Sugerencia {
  const [min, max] = ctx.rango
  const ultima = sesiones[sesiones.length - 1]
  if (!ultima || !ultima.series.length) {
    return ctx.carga === 'externa'
      ? { tipo: 'prueba', texto: 'Primera vez: hacé una serie de prueba de 10 con un peso cómodo y marcá cuántas te quedaban.' }
      : { tipo: 'prueba', texto: `Primera vez: hacé todas las que puedas con buena técnica, dejando 2 en reserva. Apuntá a ${min} a ${max}.` }
  }

  // Después de la serie de prueba (primera sesión con una sola serie con peso): ajustar y empezar con 3 series.
  if (ctx.carga === 'externa' && sesiones.length === 1 && ultima.series.length === 1 && ultima.series[0].carga) {
    const a = ajusteSeriePrueba(ultima.series[0].carga, ultima.series[0].rir)
    return { tipo: 'empezar', carga: a.carga, reps: min, texto: `Según tu serie de prueba: ${coma(a.carga)} kg. Hacé 3 series de ${min} a ${max}, dejando 2 o 3 en reserva.` }
  }

  // Estancamiento: 3 sesiones seguidas sin superar a la mejor anterior.
  if (sesiones.length >= 4) {
    const r = sesiones.map((s) => rendimiento(s, ctx.carga))
    const mejorAntes = Math.max(...r.slice(0, -3))
    if (r.slice(-3).every((x) => x <= mejorAntes)) {
      return ctx.carga === 'externa'
        ? {
            tipo: 'estancado',
            carga: redondear((ultima.series[0].carga ?? 0) * 0.9),
            texto: '3 sesiones sin mejorar: bajá un 10 % y volvé a subir de a poco, o cambiá por una variante. Revisá también sueño y descanso.',
          }
        : { tipo: 'estancado', texto: '3 sesiones sin mejorar: probá la variante más fácil unas semanas o cambiá de ejercicio. Revisá sueño y descanso.' }
    }
  }

  if (enElTope(ultima, ctx.rango)) {
    if (ctx.carga === 'externa') {
      const actual = ultima.series[0].carga ?? 0
      const nueva = Math.max(actual + 0.5, redondear(actual * 1.035))
      return { tipo: 'subir', carga: nueva, reps: min, texto: `Llegaste al tope con reserva: subí a ${coma(nueva)} kg y volvé a ${min} repeticiones.` }
    }
    const anterior = sesiones[sesiones.length - 2]
    const dosSeguidas = anterior ? enElTope(anterior, ctx.rango) : false
    if (ctx.carga === 'banda')
      return { tipo: 'subir', texto: 'Llegaste al tope con reserva: usá una banda más dura o alejate un paso, y volvé al principio del rango.' }
    return dosSeguidas
      ? { tipo: 'siguiente-variante', texto: 'Dos sesiones seguidas en el tope: ya podés pasar al escalón siguiente.' }
      : { tipo: 'mantener', texto: 'Llegaste al tope. Si lo repetís la próxima, pasás al escalón siguiente.' }
  }

  const peor = Math.min(...ultima.series.map((x) => x.reps))
  const objetivo = Math.min(max, peor + 1)
  const conCarga = ctx.carga === 'externa' && ultima.series[0].carga !== undefined
  return {
    tipo: 'sumar-reps',
    carga: conCarga ? ultima.series[0].carga : undefined,
    reps: objetivo,
    texto: `${conCarga ? `Mismo peso (${coma(ultima.series[0].carga ?? 0)} kg). ` : ''}Buscá ${objetivo} en cada serie, dejando 2 en reserva.`,
  }
}

export interface Records {
  cargaMax?: number
  maximoEstimado?: number
  repsMax?: number
}

export function records(sesiones: Sesion[]): Records {
  const series = sesiones.flatMap((s) => s.series)
  if (!series.length) return {}
  const conCarga = series.filter((x) => x.carga !== undefined && x.carga > 0)
  return {
    cargaMax: conCarga.length ? Math.max(...conCarga.map((x) => x.carga!)) : undefined,
    maximoEstimado: conCarga.length ? Math.max(...conCarga.map((x) => epley(x.carga!, x.reps))) : undefined,
    repsMax: Math.max(...series.map((x) => x.reps)),
  }
}

const coma = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',')
