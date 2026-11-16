# Estado del proyecto

Claude Code actualiza este archivo al final de cada sesión.

## Entrega actual

**Entrega 3 — Plan y agenda**, partes 1 y 2 terminadas (versión 0.12.0): plan semanal personalizable, Entrenar ahora y control diario. Falta la parte 3: agenda hora por hora, microsesiones, periodización con semanas de descarga, retest en la agenda y proyección. Entregas 1 y 2 terminadas.

## Hecho

- Parte 1 de la entrega 1: base técnica, tema, navegación, respaldo, publicación.
- Parte 2 de la entrega 1 (versión 0.2.0): primer inicio en 5 pasos (datos, objetivos, lugares y equipo, semana, salud), tablas de referencia en `src/content/normas/` y todos los cálculos de la evaluación en `src/lib/calc/` con 30 pruebas automáticas que reproducen los casos de `EVALUACION.md`. Hoy muestra días sin fumar, plata ahorrada, avisos de salud y limitaciones; Perfil muestra el resumen y permite editar.
- Parte 3 de la entrega 1 (versión 0.4.0): evaluación guiada en `/evaluacion` (modo completo de 9 pruebas y rápido de 6), con cuenta regresiva, cronómetro, pitidos, vibración y pantalla siempre encendida. Se guarda a medias y se puede seguir después. Resultados en `/resultado/:id` (condición física, edad física, VO2máx estimado, composición, nivel 1 a 5 por área). Progreso muestra la última evaluación, un gráfico de la evolución y el historial. Hoy invita a evaluarse o muestra el nivel y los días hasta la próxima evaluación. Lógica en `src/lib/evaluacion.ts` con tests (37 en total).
- Versión 0.13.0: pasos diarios. Tarjeta en Hoy para cargar los pasos del día (número, +500, +1000) con barra hacia la meta y barras de la última semana; meta según edad (comienzo de la meseta de Paluch 2022: 8000 antes de los 60, 6000 desde los 60) y escalonada desde el promedio propio (+1000 por semana, criterio de la app); explicación con cadencia de 100 pasos por minuto para caminata moderada (Tudor-Locke). La meta aparece en Plan y las últimas 2 semanas en Progreso. Cálculo en `src/lib/calc/pasos.ts` con tests, tabla en `src/content/normas/pasos.json`. La lectura automática queda para la entrega 7 (Health Connect).
- Versión 0.12.0 (entrega 3, parte 2): Entrenar ahora (`/entrenar/:dia/:idx`, desde Plan y desde Hoy): versión completa, reducida o mínima; una pantalla por serie con dibujo, cómo se hace, avisos por limitación, peso, banda o repeticiones precargados (lo de la serie anterior o la sugerencia del historial) y repeticiones en reserva; cronómetro para ejercicios de tiempo; temporizador de rondas (trabajo, descanso y rondas) para cardio; descanso automático con +15 s y Saltar; voz en español (Web Speech API, se puede apagar) más pitidos y vibración; pantalla encendida; cambiar o saltar ejercicio; se guarda a medias y se retoma el mismo día. Al terminar: resumen, esfuerzo de 1 a 10 y diario de 3 líneas; cada ejercicio se anota en su historial. Control diario en Hoy (sueño, energía con dibujo de batería, molestia o dolor y zona) con recomendación de versión. Lógica en `src/lib/plan/sesion.ts` (orden de series por método, versiones, cambio por zona, reglas del control) con tests; guardado en `src/lib/diario.ts`.
- Versión 0.11.0: personalizar rutinas. En cada sesión del plan, "Editar": nombre, lugar, hora de inicio (el final se calcula), método (clásico, superseries, circuito, con consejos), agregar ejercicios desde la biblioteca (filtra por equipo del lugar y oculta los que hay que evitar), quitar, ordenar, ajustar series, repeticiones y pausa (con dibujo), mover o copiar la sesión a otro día y borrarla. "+ Agregar una sesión" por día (fuerza propia, cardio o movilidad). Lógica en `src/lib/plan/editar.ts` con tests. El plan queda marcado como editado y se avisa antes de volver a armarlo.
- Versión 0.10.0 (entrega 3, parte 1): plan semanal. Generador en `src/lib/plan/generador.ts` (con tests): días de fuerza sin dos seguidos cuando se puede (cuerpo completo A/B, o tren superior e inferior si hay 4 días y "Verme mejor" pesa 40 o más), cardio moderado el resto de los días, movilidad en los días libres y al final de cada sesión. Elige ejercicios posibles con el equipo y espacio de cada lugar, sin los que hay que evitar por limitaciones, en el escalón actual de cada escalera, priorizando los ejercicios base del tipo de cuerpo, las preferencias del gimnasio y, con la muñeca, mancuernas y máquinas. Accesorios según las zonas elegidas. Método de series (clásico, superseries, circuito) y ajuste al hueco libre. Validador y medidor de equilibrio (`validador.ts`), con metas de la OMS (`src/content/normas/actividad-oms.json`). Pantalla Plan con semana, sesión del día, "Cambiar" por un equivalente, "Anotar", avisos y equilibrio. Hoy muestra "Hoy te toca". Se sumaron 8 ejercicios de movilidad y cardio con dibujos (57 en total).
- Versión 0.9.0 (entrega 2, parte 2): anotar series desde la ficha (`/registrar/:id`): peso, banda o repeticiones/segundos y repeticiones en reserva (0 a 5+, con dibujo que lo explica), con los valores de la vez anterior precargados. Sugerencia automática (`src/lib/calc/progresion.ts`, con tests): serie de prueba y ajuste ±10 %, doble progresión (+3,5 %, mínimo 0,5 kg), escalón siguiente tras dos sesiones en el tope, estancamiento a las 3 sesiones. Historial y récords en la ficha (máximo estimado con Epley y gráfico) y "Tus ejercicios" en Progreso. Se guarda en `registros` con tipo `ejercicio`.
- Versión 0.8.0: dibujo de inicio y final para los 49 ejercicios (`src/content/dibujos-ejercicios.tsx`), en la ficha. Un test verifica que ningún ejercicio quede sin dibujo.
- Versión 0.7.0: pantalla Tipo de cuerpo (`/tipo-cuerpo`, también desde Aprender y desde los resultados): ectomorfo, mesomorfo y endomorfo con dibujos, cómo reconocerlos, estimación casera desde la evaluación, medición completa de Heath-Carter con plicómetro (8 medidas con dibujo de los puntos) y categoría de Carter, cómo entrenar según el tipo y ejercicios base (marcados en la biblioteca). Regla nueva en `CLAUDE.md`: todo va con ejemplo gráfico.
- Entrega 2, parte 1 (versión 0.6.0): 49 fichas de ejercicios en `src/content/ejercicios/*.json` (posición inicial, pasos, respiración, 3 errores con cómo detectarlos, versión más fácil y más difícil, adaptaciones por limitación, criterio para subir, peso inicial y búsqueda de video) y 5 escaleras de progresión (`escaleras.json`). Lógica en `src/lib/ejercicios.ts` con tests (`revisarContenido` verifica que todo el contenido sea coherente). Biblioteca en Aprender con buscador, filtros por tipo y "solo lo que puedo hacer con mi equipo"; ficha en `/ejercicio/:id`.
- Versión 0.5.0: dibujos de cómo hacer cada prueba (`src/content/ilustraciones.tsx`, figuras SVG propias) y tipo de cuerpo opcional en la evaluación (peso y muñeca): linealidad de Heath-Carter, contextura ósea por muñeca y una tendencia (lineal, intermedia, robusta, redondeada) con su explicación. Cálculo en `src/lib/calc/tipoCuerpo.ts`, tabla en `src/content/normas/tipo-cuerpo.json`, 43 tests.
- Especificación, diseño y método de evaluación escritos (`ESPECIFICACION.md`, `DISENO.md`, `EVALUACION.md`).

## Entrega 1: lista

- [x] Proyecto Vite + React 19 + TypeScript con la estructura de `CLAUDE.md`.
- [x] Publicación automática en GitHub Pages con GitHub Actions (`.github/workflows/publicar.yml`).
- [x] PWA instalable y funcionando sin internet (íconos propios, precache de toda la app).
- [x] Tema (tokens de `DISENO.md`), fuentes locales y barra de navegación con las 5 pestañas.
- [x] Base de datos local (Dexie) y respaldo: guardar archivo, copiar texto, restaurar desde archivo o texto (con tests).
- [x] Primer inicio (5 pasos).
- [x] Evaluación guiada con cronómetros (modo completo y rápido).
- [x] Cálculos con tests (`EVALUACION.md`, sección 9).
- [x] Resultados, niveles por área e historial con gráficos.
- [x] Pantalla Hoy en versión inicial (sin plan todavía: invita a hacer la evaluación y muestra resultados).
- [ ] Datos pendientes de completar desde las fuentes: puntos de frecuencia del índice HUNT, flexiones de mujeres por edad, tabla completa de rodilla a la pared.

## Decisiones tomadas

- React 19 en lugar de 18 (es la versión actual del generador de Vite).
- Fuentes cargadas solo con caracteres latinos para que la app pese menos.
- El respaldo en texto es el JSON en Base64 con el prefijo `NFR1:` (sin compresión por ahora).
- Las pantallas Plan, Progreso, Aprender y parte de Perfil muestran qué llega y en qué entrega.
- Primer inicio, paso "Tu semana": versión simple (hora de levantarse y acostarse, lugar y huecos libres por tipo de día). Los bloques fijos detallados (trabajo, comidas) llegan con la agenda en la entrega 3.
- Objetivos: se reparten de a 10 puntos; al sumar se descuenta del objetivo con más puntos y al restar se le da al siguiente.
- Dejar de fumar: se pide también cuántos atados por día se fumaban, para calcular la plata ahorrada.
- Equilibrio: percentil con normal sobre el logaritmo del tiempo (Springer da media y desvío de tiempos sesgados).
- Rodilla a la pared: referencia provisional de menores de 50 años para todas las edades hasta cargar la tabla completa.
- Versión 0.3.0: cada lugar tiene tipo (casa, gimnasio, aire libre). En el gimnasio se eligen preferencias (máquinas, barra, mancuernas, poleas, peso corporal) y método de series (clásico, superseries, circuito, que decida la app), con consejos. En "Tu semana" se elige dónde se entrena cada día (hasta 2 lugares o descanso), guardado en `Semana.lugaresPorDia`; los datos viejos se convierten solos (`normalizarSemana`). Hoy muestra dónde se entrena ese día.
- Actualización automática (versión 0.2.1): la app busca versiones nuevas al abrirse y al volver a primer plano, y se recarga sola cuando hay una (`src/lib/actualizar.ts`).
- Evaluación: si las respuestas de salud no dan apto, se sacan las pruebas de esfuerzo (sentarse y pararse, flexiones, plancha).
- Evaluación: lo que se ve en los contadores de medidas y rodilla se guarda aunque no se toque (valores iniciales 170/85 cm y 10 cm), porque es lo que la persona ve al tocar Siguiente.
- Evaluación: la cuenta regresiva del pulso permite contar tocando la pantalla; si no, se carga el número a mano (hasta 3 mediciones, se promedian).
- Evaluación: equilibrio y plancha empiezan con cuenta de 3; equilibrio corta solo a los 45 s y guarda el mejor de los intentos.
- Habilidad de movimiento se muestra solo si se hizo la prueba de calidad de movimiento.
- Se repite la evaluación cada 28 días (decisión de diseño: antes los cambios no se notan en las pruebas); se puede hacer antes igual.
- Tipo de cuerpo: en casa solo se puede calcular bien la linealidad (Heath-Carter); grasa y músculo del somatotipo necesitan calibres. La tendencia combina linealidad y grasa RFM con cortes propios (lineal ≥ 4, robusta < 1,5), avisando que es una estimación. Contextura de hombres: se usa la tabla de MedlinePlus de más de 165 cm para todas las alturas.
- Ejercicios: en el gimnasio se da por hecho que hay mancuernas, banco, barra, máquinas, poleas, barra de dominadas, kettlebell, barra baja y bandas.
- Ejercicios: las escaleras tienen entre 3 y 7 pasos (la especificación pide 6 a 8); se alargan cuando se sumen variantes.
- Ejercicios: los pesos iniciales sugeridos para el kit de mancuernas son un punto de partida (decisión de diseño); siempre se ajustan con la serie de prueba de 10 repeticiones.
- Ejercicios: el video es un enlace a la búsqueda de YouTube (necesita internet), para no guardar videos en la app.
- Arreglo: un `useEffect` que devolvía el resultado de `window.scrollTo` rompía la pantalla en Chrome nuevo (ahí devuelve una promesa); los efectos siempre con llaves.
- Tipo de cuerpo: si hay medición completa se usa esa; si no, la estimación de la última evaluación con peso. Las mediciones completas se guardan en `ajustes` con la clave `somatotipos` (entran en el respaldo).
- Tipo de cuerpo: las evaluaciones de la versión 0.5.0 guardaron lineal/intermedia/robusta/redondeada; se leen como ectomorfo/mixto/mesomorfo/endomorfo (`tendenciaActual`).
- Progresión: al llegar al tope del rango se sube un 3,5 % (punto medio del 2,5 a 5 % de la especificación), redondeado a 0,5 kg y nunca menos de 0,5 kg.
- Progresión: con banda, el nivel se anota de 1 (muy liviana) a 5 (muy dura); no hay gráfico de evolución para bandas.
- Plan: "2 × 2 m" en un ejercicio solo pide el largo del cuerpo en el piso, así que se permite en lugares de 1 × 1 m; lo "amplio" necesita gimnasio o aire libre.
- Plan: tren superior seguido de tren inferior no cuenta como dos días fuertes seguidos (trabajan músculos distintos).
- Plan: el escalón de cada escalera sale del último ejercicio anotado o, si no hay, del nivel de fuerza de la última evaluación (2 si no hay evaluación).
- Plan: con un día de dos lugares, la sesión principal va donde hay más equipo y una movilidad corta en el otro (en el segundo horario libre si hay).
- Plan: el plan guardado no se actualiza solo al cambiar los datos; se vuelve a armar con un botón (avisando que se pierden los cambios a mano).
- Control diario: las reglas son las de la especificación (sueño menor a 6 h o energía 1–2 → reducida; dos días así → mínima o descanso; dolor → solo movilidad y consultar; molestia → se cambian los ejercicios marcados "evitar" para esa zona por uno equivalente, buscando también en patrones parecidos).
- Entrenar ahora: en superseries se descansa al final de cada vuelta (la pausa más larga del grupo); en circuito 15 s entre ejercicios y 90 s entre vueltas. La versión mínima son 3 ejercicios en circuito de 2 vueltas.
- Entrenar ahora: la caminata usa un temporizador continuo; la soga, rondas de 30 s de trabajo y 30 s de descanso (configurables).
- GitHub Pages activado con origen "GitHub Actions" (lo activa el dueño de la cuenta en Configuración → Páginas).

## Cómo probar

Dirección: https://daianquiroga.github.io/nivel-fisico-real/

1. Abrirla en Chrome en Android → menú ⋮ → Instalar app.
2. Abrir la app instalada, poner el celular en modo avión y cerrarla y abrirla: tiene que funcionar igual.
3. Perfil → Guardar archivo y Copiar como texto; después Restaurar pegando texto con lo copiado.
4. Hoy → Empezar evaluación → elegir Rápida o Completa → seguir las pruebas → Ver mis resultados.
5. Progreso: aparece la última evaluación y el historial; tocar una fecha abre sus resultados.
6. Aprender: buscar un ejercicio, filtrar por tipo, abrir la ficha y moverse por la escalera.
7. Ficha de un ejercicio → Anotar series → Guardar; volver a anotar y ver la sugerencia, el historial y Progreso → Tus ejercicios.
8. Plan → Armame el plan → tocar cada día; Cambiar un ejercicio; ver avisos y equilibrio. Hoy → "Hoy te toca".
9. Hoy → control diario → Entrenar ahora; probar descanso, +15 s, Saltar, cambiar ejercicio, salir y volver; terminar con esfuerzo y diario; ver el historial del ejercicio.
