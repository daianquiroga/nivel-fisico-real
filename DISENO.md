# Diseño — Nivel Físico Real

Referencia visual: el lienzo de diseño "Nivel Físico Real — Diseño de la app" (8 pantallas de 390 × 844) que el dueño del proyecto tiene en Claude. Si algo de este archivo choca con el lienzo, manda este archivo.

## Principios

- **Una pregunta por pantalla.** Hoy = "¿qué hago hoy?"; Entrenar = "¿qué serie toca?"; Progreso = "¿estoy mejorando?".
- **El resultado primero, el detalle plegado.**
- **Usable entrenando:** botones de 48 px o más, texto legible con el celular en el piso, una mano, transpirado.
- **Cada color tiene un solo significado**, siempre el mismo, para que el cerebro lo asocie rápido.

## Tokens de color (tema oscuro, único tema en la entrega 1)

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#0D0F12` | Fondo de la app |
| `--surface` | `#16191F` | Tarjetas |
| `--surface-2` | `#1E2229` | Botones secundarios, chips |
| `--line` | `#2A2F38` | Bordes, pistas de barras |
| `--nav` | `#121418` | Barra inferior |
| `--text` | `#F2F4F7` | Texto principal |
| `--text-2` | `#C3C9D1` | Texto secundario |
| `--muted` | `#9AA3AF` | Etiquetas, horas |
| `--action` | `#9E1F3C` | Bordó profundo: botón principal (texto `#FFF3F5`) |
| `--accent` | `#E04A68` | Bordó claro: elemento activo, enlaces, pestaña seleccionada |
| `--accent-soft` | `#F5B8C4` | Texto sobre tintes bordó, avisos suaves |
| `--accent-tint` | `rgba(224,74,104,0.12)` | Fondos seleccionados |
| `--deep` | `#2A0A13` → `#16191F` | Degradé de la tarjeta de sesión del día |
| `--deep-border` | `#5E1427` | Borde de tarjetas destacadas |
| `--done` | `#E2B861` | Dorado: cumplido, progreso, logros, tildes |
| `--done-tint` | `rgba(226,184,97,0.12)` | Fondo de cumplido |
| `--soft` | `#8FA8C0` | Azul grisáceo: días suaves, caminatas, recuperación |
| `--soft-tint` | `rgba(143,168,192,0.12)` | Fondo de bloques suaves |
| `--danger` | `#FF5A5F` | Errores y alertas de salud (uso mínimo) |

Significados fijos:

- **Bordó** = esfuerzo y acción (empezar, día fuerte, lo seleccionado).
- **Dorado** = cumplido y progreso (series hechas, rachas, mejoras, niveles alcanzados).
- **Azul grisáceo** = suave (caminata, movilidad, recuperación).
- **Gris** = fijo (trabajo, comidas, sueño).

Contraste mínimo 4,5:1 para texto; verificar cada combinación nueva.

## Tipografía

- **Títulos y números grandes:** Barlow Condensed 700 (estilo marcador deportivo), en mayúsculas para títulos de pantalla. Tamaños: 32 px título de pantalla, 34 px nombre de sesión o ejercicio, 24 a 26 px botones principales, 50 px puntajes.
- **Texto:** Inter 400/500/600/700. 15 px cuerpo, 13 a 14 px secundario, 11 a 12 px etiquetas.
- Números con `font-variant-numeric: tabular-nums` en horarios y contadores.
- Fuentes servidas localmente (funcionan sin internet).

## Forma

- Radios: 10 px chips y bloques chicos, 12 a 14 px tarjetas y botones, 16 a 20 px tarjetas destacadas, círculo para anillos de puntaje.
- Espaciado base de 4 px; separación entre tarjetas 12 a 14 px; márgenes laterales 18 px.
- Íconos de trazo simple (2 px), propios, nunca emojis.
- Sin degradés decorativos salvo la tarjeta de sesión del día.

## Barra inferior

5 pestañas de 72 px de alto: Hoy (casa), Plan (calendario), Progreso (barras), Aprender (libro), Perfil (persona). Activa en `--accent`, inactivas en `--muted`.

## Pantallas (entrega 1 y siguientes)

### Primer inicio

Barra de pasos arriba (1 de 5) con botón volver. Título grande en mayúsculas ("¿PARA QUÉ ENTRENÁS?"), una línea de explicación, el control principal y un botón "SIGUIENTE" abajo. En objetivos: barra horizontal partida en tres colores (bordó estética, dorado condición, azul combate), tres tarjetas con botones − / + y el número en grande; chips de zonas a mejorar.

### Hoy

1. Fecha y hora; título "HOY TOCA FUERZA"; anillo chico con el nivel físico (toca → Progreso).
2. Chips: racha en semanas, días sin fumar (si está activo).
3. Tarjeta "¿Cómo llegás hoy?": tres botones (sueño, energía, dolor). El que tiene un problema se pinta con tinte bordó.
4. **Tarjeta de sesión del día** (degradé bordó): hora y lugar, etiqueta de adaptación (ej. "Modo muñeca"), nombre de la sesión, duración, cantidad de ejercicios y esfuerzo, una línea explicando cualquier ajuste, botón grande "EMPEZAR".
5. "Tu día": lista de la agenda con hora; lo hecho con tilde dorada, lo actual en bordó, lo que viene con círculo. Enlace "Editar".
6. Barra inferior.

### Entrenar ahora

Arriba: cerrar, nombre de la sesión, "ejercicio 2 de 5" con barra segmentada, botón de voz (activo en dorado). Nombre del ejercicio grande, objetivo (3 × 12, dejá 2 en reserva) y enlace "Cómo se hace". Tarjeta de descanso con anillo dorado y cuenta regresiva grande, botones "+15 s" y "Saltar". Tabla de series: hechas (atenuadas con tilde), actual (borde bordó con − / +), siguientes (punteadas). Botones de repeticiones en reserva (0, 1, 2, 3, 4+). Abajo: "Después: …" y botón grande "SERIE HECHA".

### Plan día a día

Título "MI SEMANA" y botón "Encajar en mis huecos". 7 días como botones con un punto de color (bordó fuerte, dorado microsesión o suave, gris descanso). Selector de lugar del día. Línea de tiempo de bloques: fijos en gris, caminatas en azul, microsesiones en dorado, entrenamiento en bordó, con subtítulos (ej. "Pausa activa de 2 min cada hora"). Tarjeta "Equilibrio de la semana" con barras por área.

### Progreso

Título "NIVEL FÍSICO REAL". Anillo grande con el puntaje de 0 a 100, cambio reciente, edad física y una frase destacada. Tres tarjetas: Condición, Estética, Combate. Barras por área con percentil y tendencia (flecha y número). Gráfico de retests. Accesos a Fotos de progreso y Medidas. Enlace "Ver niveles".

### Niveles

Tarjeta de etapa ("Etapa 1 de 5 · Construir la base", semana 6 de 12, barra dorada) con los requisitos para pasar (tildados en dorado). Lista de áreas con "Nv 2 · Base", barra bordó y "Próximo: …".

### Ficha de ejercicio

Volver, nombre, músculos. Dibujo de posición inicial → final. Pestañas: Cómo, Errores, Niveles, Historial. Pasos numerados. Recuadro con el error más común. "Tu escalera" con nivel actual y criterio para subir, incluido el peso sugerido. Botones "Buscar video" y "Volver a la serie".

### Aprender

Título. Tarjeta del coach con campo de pregunta y sugerencias. Botón "Tengo ganas de fumar: 5 minutos ahora" (solo si está activo). Tarjeta "Dato del día". Grilla de categorías con barra de progreso de lectura.

### Evaluación guiada (entrega 1, sin lienzo todavía)

Seguir el patrón de Primer inicio: una prueba por pantalla, barra de pasos, título, dibujo de la posición, 3 a 4 líneas de instrucciones, botón "Ver errores comunes", cronómetro grande en Barlow Condensed (100 px o más) con un único botón enorme para empezar y cortar, y carga del resultado con − / +. Al final, pantalla de resultados con el anillo de condición física, edad física y las áreas.
