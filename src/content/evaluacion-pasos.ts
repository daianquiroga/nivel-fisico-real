/* Textos de cada prueba de la evaluación (EVALUACION.md). Separados del código para poder corregirlos fácil. */

export type IdPaso =
  | 'pulso'
  | 'medidas'
  | 'actividad'
  | 'rodilla'
  | 'equilibrio'
  | 'sentarse'
  | 'flexiones'
  | 'plancha'
  | 'calidad'

export interface TextoPaso {
  titulo: string
  para: string
  como: string[]
  errores?: string[]
  piso?: boolean
}

export const PASOS: Record<IdPaso, TextoPaso> = {
  pulso: {
    titulo: 'Pulso en reposo',
    para: 'Un corazón entrenado late menos en reposo. Es parte del cálculo de tu cardio.',
    como: [
      'Lo ideal: al despertar, antes de levantarte, tres mañanas seguidas.',
      'Sentado y quieto 1 minuto. Poné dos dedos en la muñeca (del lado del pulgar) o en el costado del cuello.',
      'Tocá Empezar y contá los latidos durante 60 segundos. Si querés, tocá el botón en cada latido.',
      'Si hoy no es a la mañana, cargá lo que midas igual y después sumá las otras mañanas.',
    ],
    errores: ['Medir después de café, mate o de subir escaleras.', 'Apretar muy fuerte: se pierde el pulso.'],
  },
  medidas: {
    titulo: 'Altura y cintura',
    para: 'Con estas dos medidas se estima tu grasa y el riesgo por grasa abdominal, sin balanza.',
    como: [
      'Altura: descalzo contra la pared, apoyá un libro en la cabeza, marcá y medí hasta el piso.',
      'Cintura: de pie, al final de una exhalación normal, sin meter panza. Cinta horizontal a la altura del borde de arriba del hueso de la cadera.',
      'Medí dos veces y cargá el promedio. Mejor a la mañana, antes de comer.',
      'Opcional, para tu tipo de cuerpo: tu peso y la vuelta de tu muñeca, justo arriba del huesito.',
      'Sin cinta: un hilo del largo de tu altura, doblado a la mitad. Si da la vuelta a tu cintura, estás por debajo del límite de riesgo. Después medí el hilo con una regla.',
    ],
    errores: ['Medir en el ombligo o en la parte más angosta en vez del borde de la cadera.', 'Meter panza o apretar la cinta.'],
  },
  actividad: {
    titulo: 'Tu actividad',
    para: 'Tres preguntas sobre el ejercicio que hacés en tu tiempo libre (no cuenta el trabajo ni ir caminando a hacer mandados).',
    como: ['Pensá en una semana normal de los últimos meses.'],
  },
  rodilla: {
    titulo: 'Rodilla a la pared',
    para: 'Mide la movilidad del tobillo, clave para agacharte bien y no lesionarte.',
    como: [
      'Descalzo, de frente a la pared, un pie adelante.',
      'Llevá la rodilla a tocar la pared sin levantar el talón.',
      'Alejá el pie de a 1 cm hasta la distancia máxima en que la rodilla todavía toca.',
      'Medí del dedo gordo a la pared. Hacelo con las dos piernas.',
    ],
    errores: ['Levantar el talón.', 'Dejar que la rodilla se vaya hacia adentro.'],
  },
  equilibrio: {
    titulo: 'Equilibrio en un pie',
    para: 'El control del cuerpo. Baja con los años y mejora rápido con práctica.',
    como: [
      'Descalzo, al lado de una pared o una cama por seguridad.',
      'Brazos cruzados sobre el pecho. Levantá un pie y dejalo cerca del tobillo, sin tocarlo.',
      'Tocá Empezar: después de la cuenta de 3, levantá el pie. Tocá Parar si descruzás los brazos, el pie toca el piso o la otra pierna, o mueve el pie de apoyo. Para en 45 segundos solo.',
      'Hacé 3 intentos. Vale el mejor.',
    ],
    errores: ['Apoyar el pie levantado contra la pierna.', 'Abrir los ojos en la prueba con ojos cerrados.'],
  },
  sentarse: {
    titulo: 'Sentarse y pararse',
    para: 'Fuerza y resistencia de piernas. Es una de las pruebas más relacionadas con la salud a largo plazo.',
    como: [
      'Silla firme de unos 46 cm, sin rueditas, contra la pared.',
      'Pies apoyados al ancho de la cadera, brazos cruzados sobre el pecho.',
      'En 1 minuto, pararte del todo (rodillas estiradas) y volver a tocar la silla con la cola, las veces que puedas a tu ritmo.',
      'Contá en voz alta. Vas a escuchar pitidos a los 30 y a los 15 segundos del final.',
    ],
    errores: ['Empujarte con las manos.', 'No estirar del todo las rodillas arriba.', 'No llegar a tocar la silla.'],
  },
  flexiones: {
    titulo: 'Flexiones',
    para: 'Fuerza y resistencia de brazos, pecho y tronco.',
    como: [
      'Manos un poco más abiertas que los hombros, cuerpo recto de la cabeza a los talones.',
      'Bajá hasta que el pecho quede a un puño del piso y subí con los brazos estirados.',
      'Sin pausas en el piso. Terminás cuando no podés mantener la técnica.',
      'Hombres: flexión completa. Mujeres: con las rodillas apoyadas (así están las tablas).',
    ],
    errores: ['La cadera se hunde o sube.', 'Bajar poco.'],
    piso: true,
  },
  plancha: {
    titulo: 'Plancha',
    para: 'Resistencia del tronco (core).',
    como: [
      'Apoyá el celular en el piso donde lo puedas tocar.',
      'Tocá Empezar y ponete en posición durante la cuenta de 3: antebrazos y puntas de pie, codos debajo de los hombros, cuerpo recto.',
      'Tocá Parar cuando la cadera baje o suba y no la puedas corregir.',
    ],
    errores: ['Cola muy arriba.', 'Cadera caída.', 'Aguantar la respiración.'],
    piso: true,
  },
  calidad: {
    titulo: 'Calidad de movimiento',
    para: 'Cómo te movés, no cuánto. Sirve para ver tu progreso y elegir ejercicios seguros.',
    como: [
      'Apoyá el celular a unos 2 metros y filmate de costado y de frente.',
      'Hacé 5 repeticiones lentas de cada movimiento.',
      'Mirá el video y elegí la opción que mejor describe lo que ves.',
    ],
  },
}

export const MOVIMIENTOS: { nombre: string; niveles: [string, string, string, string] }[] = [
  {
    nombre: 'Sentadilla profunda con brazos arriba',
    niveles: [
      'Duele',
      'No paso de muslos paralelos al piso',
      'Bajo profundo pero se levantan los talones o me inclino mucho',
      'Muslos bajo la rodilla, talones apoyados, brazos alineados',
    ],
  },
  {
    nombre: 'Estocada hacia atrás',
    niveles: ['Duele', 'Necesito apoyarme', 'Tambaleo o me inclino', 'Rodilla de atrás casi toca el piso, tronco derecho, estable'],
  },
  {
    nombre: 'Bisagra de cadera (tocar las rodillas con las manos llevando la cola atrás)',
    niveles: ['Duele', 'Doblo la espalda en vez de la cadera', 'La espalda se curva un poco al final', 'Espalda recta, cadera atrás, rodillas apenas flexionadas'],
  },
  {
    nombre: 'Flexión de brazos (calidad, no cantidad)',
    niveles: ['Duele', 'Cadera caída o recorrido corto', 'La cadera se hunde en alguna repetición', 'Cuerpo recto todo el recorrido, codos a 45°'],
  },
  {
    nombre: 'Sentadilla parcial en un pie',
    niveles: [
      'Duele',
      'La rodilla se va mucho hacia adentro o pierdo el equilibrio',
      'La rodilla se va un poco hacia adentro',
      'Rodilla alineada con el pie, cadera nivelada',
    ],
  },
]
