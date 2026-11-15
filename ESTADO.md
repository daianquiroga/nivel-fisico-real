# Estado del proyecto

Claude Code actualiza este archivo al final de cada sesión.

## Entrega actual

**Entrega 1 — Base**, terminada (versión 0.4.0). Solo quedan datos de tablas por completar. Próxima: **Entrega 2 — Ejercicios** (fichas, progresiones, registro de pesos).

## Hecho

- Parte 1 de la entrega 1: base técnica, tema, navegación, respaldo, publicación.
- Parte 2 de la entrega 1 (versión 0.2.0): primer inicio en 5 pasos (datos, objetivos, lugares y equipo, semana, salud), tablas de referencia en `src/content/normas/` y todos los cálculos de la evaluación en `src/lib/calc/` con 30 pruebas automáticas que reproducen los casos de `EVALUACION.md`. Hoy muestra días sin fumar, plata ahorrada, avisos de salud y limitaciones; Perfil muestra el resumen y permite editar.
- Parte 3 de la entrega 1 (versión 0.4.0): evaluación guiada en `/evaluacion` (modo completo de 9 pruebas y rápido de 6), con cuenta regresiva, cronómetro, pitidos, vibración y pantalla siempre encendida. Se guarda a medias y se puede seguir después. Resultados en `/resultado/:id` (condición física, edad física, VO2máx estimado, composición, nivel 1 a 5 por área). Progreso muestra la última evaluación, un gráfico de la evolución y el historial. Hoy invita a evaluarse o muestra el nivel y los días hasta la próxima evaluación. Lógica en `src/lib/evaluacion.ts` con tests (37 en total).
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
- GitHub Pages activado con origen "GitHub Actions" (lo activa el dueño de la cuenta en Configuración → Páginas).

## Cómo probar

Dirección: https://daianquiroga.github.io/nivel-fisico-real/

1. Abrirla en Chrome en Android → menú ⋮ → Instalar app.
2. Abrir la app instalada, poner el celular en modo avión y cerrarla y abrirla: tiene que funcionar igual.
3. Perfil → Guardar archivo y Copiar como texto; después Restaurar pegando texto con lo copiado.
4. Hoy → Empezar evaluación → elegir Rápida o Completa → seguir las pruebas → Ver mis resultados.
5. Progreso: aparece la última evaluación y el historial; tocar una fecha abre sus resultados.
