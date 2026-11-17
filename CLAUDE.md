# Nivel Físico Real — instrucciones para Claude Code

Leé este archivo completo al empezar cada sesión. Después leé `ESTADO.md` para saber en qué entrega estamos y qué quedó pendiente.

## Qué es

Una app web instalable (PWA) para Android que:

1. Mide el estado físico real de una persona en su casa, sin equipos y en 1 × 1 m (ver `EVALUACION.md`).
2. Arma y adapta un plan de entrenamiento día a día y hora por hora, según su vida real.
3. Guía cada sesión ("Entrenar ahora"), registra pesos y progresiones, y enseña cómo hacer cada ejercicio.
4. Ayuda a sostener la constancia (hábitos, rachas, avisos) y enseña sobre el cuerpo, la salud y la mente.
5. Más adelante: módulo de combate (sombra, juego de pies, simulador) y lectura de pasos desde Health Connect.

La especificación completa está en `ESPECIFICACION.md`. El sistema visual y las pantallas, en `DISENO.md`.

## Para quién trabajás

- El dueño del proyecto **no sabe programar**. Al terminar cada tarea, explicale en español rioplatense (voseo), en pocas líneas y sin jerga, qué hiciste, cómo probarlo en el celular y qué botón tocar en GitHub. Si usás un término técnico, explicalo en una frase.
- Toda la interfaz de la app va en **español rioplatense con voseo** ("tocá", "empezá", "tu sesión").
- El usuario principal usa **Android con Chrome**. Diseñá y probá primero para pantalla de celular (390 × 844).

## Principios que no se negocian

1. **Sin servicios pagos.** Nada de APIs de IA pagas, bases de datos en la nube ni suscripciones. El "coach" funciona con reglas y contenido local (ver `ESPECIFICACION.md`, sección Coach).
2. **Datos solo en el celular.** Todo se guarda en IndexedDB del dispositivo. Nunca subir datos del usuario a ningún servidor. Siempre debe existir exportar/importar respaldo (archivo JSON y, como alternativa, texto para copiar y pegar).
3. **Funciona sin internet** una vez instalada (service worker con precache de toda la app y el contenido).
4. **Ciencia honesta.** Toda fórmula, tabla o umbral sale de una fuente citada en `EVALUACION.md` o `ESPECIFICACION.md`. Si algo es una decisión de diseño y no un estándar publicado, la app lo dice. Las estimaciones se muestran como estimaciones.
5. **Seguridad primero.** Cuestionario de salud antes de pruebas de esfuerzo; avisos de "consultá a un profesional" ante dolor; nunca diagnosticar. Modo limitación (muñeca, rodilla, hombro, espalda) que filtra ejercicios.
6. **Sin datos personales en el repositorio.** El repo es público. Nada de nombres, horarios, salud ni fotos del usuario en código, ejemplos o tests: la app pide esos datos al usarla.
7. **Fácil antes que completo.** Una acción principal por pantalla, botones grandes (mínimo 48 px), usable con una mano y transpirado, escribir lo menos posible (botones +/−, valores anteriores precargados).
8. **Siempre con ejemplo gráfico.** Toda prueba, ejercicio, técnica o medición que se explique en la app lleva un dibujo propio (SVG simple, con las piezas de `src/components/Figura.tsx`) que muestre cómo se hace. Sin dibujo no está terminado.

## Stack técnico (no cambiarlo sin preguntar)

- **Vite + React 19 + TypeScript** (estricto).
- **React Router con HashRouter** (necesario para GitHub Pages).
- **Dexie** sobre IndexedDB para guardar datos, con migraciones versionadas. Nunca borrar datos del usuario en una migración.
- **vite-plugin-pwa** para manifest, íconos y service worker (modo `generateSW`, precache de todo).
- **CSS con variables** (tokens de `DISENO.md`) en un archivo de tema; CSS Modules por componente. Sin frameworks de UI pesados.
- **Gráficos:** SVG propio y simple, o una librería liviana si hace falta (preguntar antes de sumar dependencias grandes).
- **Vitest** para tests de toda la lógica de cálculo.
- **GitHub Actions** para construir y publicar en GitHub Pages en cada cambio a `main`.
- Fuentes: Barlow Condensed (títulos) e Inter (texto), servidas localmente para que funcionen sin internet.

## Estructura de carpetas

```
src/
  app/            rutas, layout, barra de navegación inferior
  screens/        una carpeta por pantalla (Hoy, Plan, Progreso, Aprender, Perfil, Evaluacion, Entrenar...)
  components/     componentes reutilizables (Boton, Tarjeta, Stepper, Cronometro, BarraProgreso...)
  lib/
    calc/         fórmulas puras y testeadas (vo2max, percentiles, rfm, puntajes, calorías...)
    db/           esquema Dexie, migraciones, respaldo
    coach/        motor de reglas del coach
    plan/         generador y validador del plan
  content/        contenido en JSON/Markdown: ejercicios, guías, tablas de referencia, artículos
  theme/          tokens y estilos globales
public/           íconos de la app, fuentes
```

## Reglas de código

- **Toda fórmula va en `src/lib/calc/`** como función pura, con un comentario que cite la fuente y un test con al menos un caso calculado a mano.
- **Las tablas de referencia van en `src/content/normas/`** como JSON, con campo `fuente` (cita y enlace). No escribir números de tablas dentro de componentes.
- **El contenido (ejercicios, guías, artículos) va en `src/content/`**, separado del código, para poder sumarlo sin tocar componentes.
- Componentes accesibles: `<button>` reales, `<label>` en cada input, contraste 4,5:1, `aria-label` en botones de ícono.
- Nada de `alert`/`confirm`: usar diálogos propios.
- Antes de terminar una tarea: `npm run build` y `npm test` sin errores.

## Cómo trabajar cada sesión

1. Leé `CLAUDE.md` y `ESTADO.md`.
2. Trabajá solo en la entrega o tarea pedida. Si algo de la especificación no está claro, elegí la opción más simple, anotala en `ESTADO.md` en "Decisiones tomadas" y avisalo al final.
3. Hacé cambios chicos y probados. Commits con mensajes en español.
4. Al terminar, actualizá `ESTADO.md`: qué se hizo, qué falta, decisiones tomadas y cómo probar.
5. Respondé al usuario con: qué cambió (3 a 6 líneas), cómo probarlo en el celular, y el paso exacto en GitHub (por ejemplo: "entrá a Pull requests, abrí el último y tocá Merge pull request").

## La familia de apps

Esta app es el área 2 de una familia de 10 apps (una por área de habilidades), todas con el mismo stack, diseño y reglas; cada una en su repositorio. Si te piden algo de otra área, va en su repo, no acá.

| N.º | Área | App | Repositorio | Dirección |
| --- | --- | --- | --- | --- |
| 1 | Inteligencia y desarrollo mental | Nivel Mental Real | `nivel-mental-real` | https://daianquiroga.github.io/nivel-mental-real/ |
| 2 | Salud y capacidades físicas | Nivel Físico Real | `nivel-fisico-real` | https://daianquiroga.github.io/nivel-fisico-real/ ← esta app |
| 3 | Comunicación y habilidades sociales | Nivel Social Real | `nivel-social-real` | https://daianquiroga.github.io/nivel-social-real/ |
| 4 | Inteligencia emocional y mentalidad | Nivel Emocional Real | `nivel-emocional-real` | https://daianquiroga.github.io/nivel-emocional-real/ |
| 5 | Inteligencia financiera | Nivel Financiero Real | `nivel-financiero-real` | https://daianquiroga.github.io/nivel-financiero-real/ |
| 6 | Tecnología y habilidades digitales | Nivel Digital Real | `nivel-digital-real` | https://daianquiroga.github.io/nivel-digital-real/ |
| 7 | Conocimientos generales | Nivel Cultural Real | `nivel-cultural-real` | https://daianquiroga.github.io/nivel-cultural-real/ |
| 8 | Habilidades prácticas para la vida | Nivel Práctico Real | `nivel-practico-real` | https://daianquiroga.github.io/nivel-practico-real/ |
| 9 | Productividad y organización | Nivel Productivo Real | `nivel-productivo-real` | https://daianquiroga.github.io/nivel-productivo-real/ |
| 10 | Idiomas y adaptación | Nivel Idiomas Real | `nivel-idiomas-real` | https://daianquiroga.github.io/nivel-idiomas-real/ |
