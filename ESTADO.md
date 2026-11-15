# Estado del proyecto

Claude Code actualiza este archivo al final de cada sesión.

## Entrega actual

**Entrega 1 — Base**, partes 1 y 2 de 3 terminadas. Falta la parte 3: evaluación guiada con cronómetros, resultados, niveles e historial.

## Hecho

- Parte 1 de la entrega 1: base técnica, tema, navegación, respaldo, publicación.
- Parte 2 de la entrega 1 (versión 0.2.0): primer inicio en 5 pasos (datos, objetivos, lugares y equipo, semana, salud), tablas de referencia en `src/content/normas/` y todos los cálculos de la evaluación en `src/lib/calc/` con 30 pruebas automáticas que reproducen los casos de `EVALUACION.md`. Hoy muestra días sin fumar, plata ahorrada, avisos de salud y limitaciones; Perfil muestra el resumen y permite editar.
- Especificación, diseño y método de evaluación escritos (`ESPECIFICACION.md`, `DISENO.md`, `EVALUACION.md`).

## Próximo: partes 2 y 3 de la entrega 1

- [x] Proyecto Vite + React 19 + TypeScript con la estructura de `CLAUDE.md`.
- [x] Publicación automática en GitHub Pages con GitHub Actions (`.github/workflows/publicar.yml`).
- [x] PWA instalable y funcionando sin internet (íconos propios, precache de toda la app).
- [x] Tema (tokens de `DISENO.md`), fuentes locales y barra de navegación con las 5 pestañas.
- [x] Base de datos local (Dexie) y respaldo: guardar archivo, copiar texto, restaurar desde archivo o texto (con tests).
- [x] Primer inicio (5 pasos).
- [ ] Evaluación guiada con cronómetros (modo completo y rápido).
- [x] Cálculos con tests (`EVALUACION.md`, sección 9).
- [ ] Resultados, niveles por área e historial con gráficos.
- [ ] Pantalla Hoy en versión inicial (sin plan todavía: invita a hacer la evaluación y muestra resultados).
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
- GitHub Pages activado con origen "GitHub Actions" (lo activa el dueño de la cuenta en Configuración → Páginas).

## Cómo probar

Dirección: https://daianquiroga.github.io/nivel-fisico-real/

1. Abrirla en Chrome en Android → menú ⋮ → Instalar app.
2. Abrir la app instalada, poner el celular en modo avión y cerrarla y abrirla: tiene que funcionar igual.
3. Perfil → Guardar archivo y Copiar como texto; después Restaurar pegando texto con lo copiado.
