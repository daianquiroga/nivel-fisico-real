/* Íconos de trazo simple (2 px), propios. Nunca emojis. */
const RUTAS: Record<string, string> = {
  hoy: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plan: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 3v4M16 3v4',
  progreso: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  aprender: 'M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  descargar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  subir: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  copiar: 'M9 9h10v12H9zM5 15V3h10',
  check: 'M5 12l5 5 9-10',
  cerrar: 'M6 6l12 12M18 6L6 18',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
}

export type NombreIcono = keyof typeof RUTAS

export function Icono({ nombre, tam = 24 }: { nombre: string; tam?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={RUTAS[nombre]} />
    </svg>
  )
}
