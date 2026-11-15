# Estado del proyecto

Claude Code actualiza este archivo al final de cada sesión.

## Entrega actual

**Entrega 1 — Base**, parte 1 de 3 terminada.

## Hecho

- Parte 1 de la entrega 1: base técnica, tema, navegación, respaldo, publicación.
- Especificación, diseño y método de evaluación escritos (`ESPECIFICACION.md`, `DISENO.md`, `EVALUACION.md`).

## Próximo: partes 2 y 3 de la entrega 1

- [x] Proyecto Vite + React 19 + TypeScript con la estructura de `CLAUDE.md`.
- [x] Publicación automática en GitHub Pages con GitHub Actions (`.github/workflows/publicar.yml`).
- [x] PWA instalable y funcionando sin internet (íconos propios, precache de toda la app).
- [x] Tema (tokens de `DISENO.md`), fuentes locales y barra de navegación con las 5 pestañas.
- [x] Base de datos local (Dexie) y respaldo: guardar archivo, copiar texto, restaurar desde archivo o texto (con tests).
- [ ] Primer inicio (5 pasos).
- [ ] Evaluación guiada con cronómetros (modo completo y rápido).
- [ ] Cálculos con tests (`EVALUACION.md`, sección 9).
- [ ] Resultados, niveles por área e historial con gráficos.
- [ ] Pantalla Hoy en versión inicial (sin plan todavía: invita a hacer la evaluación y muestra resultados).
- [ ] Datos pendientes de completar desde las fuentes: puntos de frecuencia del índice HUNT, flexiones de mujeres por edad, tabla completa de rodilla a la pared.

## Decisiones tomadas

- React 19 en lugar de 18 (es la versión actual del generador de Vite).
- Fuentes cargadas solo con caracteres latinos para que la app pese menos.
- El respaldo en texto es el JSON en Base64 con el prefijo `NFR1:` (sin compresión por ahora).
- Las pantallas Plan, Progreso, Aprender y parte de Perfil muestran qué llega y en qué entrega.

## Cómo probar

Dirección: https://daianquiroga.github.io/nivel-fisico-real/

1. Abrirla en Chrome en Android → menú ⋮ → Instalar app.
2. Abrir la app instalada, poner el celular en modo avión y cerrarla y abrirla: tiene que funcionar igual.
3. Perfil → Guardar archivo y Copiar como texto; después Restaurar pegando texto con lo copiado.
