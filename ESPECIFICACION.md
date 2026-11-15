# Especificación — Nivel Físico Real

Versión 1 · noviembre de 2026. Documento vivo: si una decisión cambia, se actualiza acá.

## 1. Visión

Una app que responde tres preguntas: **¿dónde estoy?** (evaluación con números reales), **¿qué hago hoy?** (plan que encaja en la vida real) y **¿estoy mejorando?** (progreso por área, niveles y etapas). Pensada para alguien que empieza o retoma, entrena en casa con poco espacio y poco equipo, y necesita ayuda para no abandonar.

Tres objetivos que el usuario combina repartiendo 100 puntos:

- **Verme mejor** (estética: grasa, músculo, postura).
- **Estar en forma** (condición física y salud).
- **Saber defenderme** (técnica y poder de pelea; módulo de combate).

La mezcla decide qué prioriza el plan.

## 2. Navegación

Barra inferior fija con 5 pestañas: **Hoy · Plan · Progreso · Aprender · Perfil**. Pantallas de pantalla completa (sin barra): Primer inicio, Evaluación guiada, Entrenar ahora, Ficha de ejercicio, Niveles.

La pantalla **Hoy** responde "¿qué hago hoy?": la sesión del día con un botón grande para empezar, el control diario, la agenda del día y los indicadores de constancia. Detalle de cada pantalla en `DISENO.md`.

## 3. Primer inicio (configuración en 3 a 5 minutos)

Pasos, uno por pantalla, con barra de progreso y opción de completar después:

1. **Datos básicos:** sexo (para las tablas de referencia), edad, altura. Peso opcional.
2. **Objetivos:** repartir 100 puntos entre los tres objetivos con botones +/−. Elegir zonas a mejorar (panza, postura, espalda, brazos, pecho, piernas, glúteos, definición general). Mostrar el aviso: "la grasa no se baja por zonas; el músculo sí se trabaja por zona".
3. **Lugares y equipo:** uno o más lugares (ej. "Depto", "Mi casa", "Gym"), cada uno con su **tipo**:
   - **Casa:** equipo tildable (bandas elásticas con o sin anclaje, mancuernas y discos con su peso total, barra de dominadas, kettlebell, soga, bolsa, banco, silla firme, colchoneta) y espacio disponible (1 × 1 m, 2 × 2 m, más amplio).
   - **Gimnasio:** qué prefiere usar (máquinas, barra y discos, mancuernas, poleas, peso corporal; varias a la vez) y cómo armar las series (clásico con pausa, superseries, circuito o que decida la app), con un consejo corto para cada opción. Sin preferencias marcadas, la app mezcla: pesos libres en los ejercicios principales y máquinas o poleas en el resto.
   - **Aire libre:** barras de plaza, paralelas, escaleras, banco, lugar para correr, y si lleva bandas o soga.
4. **Tu semana:** **dónde entrena cada día** (uno o dos lugares por día, o descanso), horarios por tipo de día (laboral, sábado, domingo: levantarse, acostarse) y huecos disponibles para entrenar. Si un día tiene dos lugares, el plan pone la sesión principal donde hay más equipo y una sesión corta (microsesión, movilidad o cardio) en el otro. Los bloques fijos detallados (trabajo, comidas) se cargan en la agenda de la entrega 3.
5. **Salud:** cuestionario previo (ver `EVALUACION.md`), limitaciones o dolores (muñeca, rodilla, hombro, espalda baja, cuello, otra) y hábitos: si dejó de fumar y desde cuándo (opcional, activa el seguimiento).

Al terminar: ofrecer hacer la evaluación ahora o más tarde.

## 4. Evaluación

Método completo, fórmulas, tablas y fuentes en `EVALUACION.md`.

- **Modo guiado:** una prueba por pantalla con explicación corta, dibujo de la posición, errores comunes y **cronómetro integrado** (cuenta regresiva, conteo de 60 s, cronómetro de plancha y de equilibrio con botón grande para cortar).
- Las mediciones en reposo (pulso, cintura) se cargan en días distintos; la app recuerda tomarlas tres mañanas seguidas.
- **Modo rápido** (5 pruebas, ~15 min): pulso, cintura y altura, sentarse y pararse, flexiones, equilibrio.
- Prueba que causa dolor → se marca "no realizada" con aviso de consultar.
- Cada evaluación se guarda con fecha; el historial muestra gráficos por prueba y por área.
- Retest sugerido cada 4 semanas; cintura y pulso, cada semana.

## 5. Resultados, niveles y etapas

- **Condición física (0 a 100)**, **edad física**, **composición** (% grasa estimado y cintura/altura) y **habilidad de movimiento (0 a 100)**. Cálculo en `EVALUACION.md`.
- **Nivel por área (1 a 5):** Inicial, Base, En marcha, Sólido, Avanzado, según percentil (0–20, 20–40, 40–60, 60–80, 80–100). Cada área muestra barra de progreso hacia el siguiente nivel y **el próximo objetivo concreto** (ej. "3 dominadas negativas de 5 s").
- Áreas: Cardio, Fuerza y resistencia, Movilidad, Equilibrio, Composición, Habilidad, Constancia (y Técnica de combate cuando se active el módulo).
- **Constancia** se mide por cumplimiento: % de sesiones hechas en las últimas 4 semanas y semanas sin faltar dos veces seguidas.
- **Etapas del plan (5):** Construir la base → Desarrollar → Rendimiento → Dominio → Élite personal. Cada etapa dura 8 a 12 semanas y tiene requisitos para pasar, por ejemplo para salir de la etapa 1:
  - cumplir el 80% de las sesiones durante 8 semanas;
  - técnica aprobada (checklist) en los 6 ejercicios básicos;
  - mejorar cardio y fuerza en el segundo retest.

## 6. Ejercicios

### 6.1 Ficha de cada ejercicio (contenido en `src/content/ejercicios/`)

Campos:

- nombre, grupo muscular principal y secundarios, patrón (empuje, tracción, sentadilla, bisagra, zancada, core, transporte, movilidad, cardio);
- equipo necesario y espacio mínimo;
- posición inicial, 3 o 4 pasos, respiración;
- 3 errores comunes y cómo detectarlos;
- versión más fácil y más difícil (enlaces a otras fichas);
- adaptaciones por limitación (ej. muñeca: agarre neutro o en puños, antebrazos);
- criterio para subir de nivel en su escalera;
- cómo elegir el peso inicial;
- enlace a búsqueda de video (`https://www.youtube.com/results?search_query=...`);
- dibujo simple de posición inicial y final (SVG propio, estilo coherente).

### 6.2 Escaleras de progresión

Cada patrón tiene una escalera de 6 a 8 pasos con criterio de paso claro. Ejemplo de empuje: flexión en pared → inclinada en mesa → inclinada baja → con rodillas → completa → pies elevados → arquera → a un brazo asistida. Criterio general: **3 series en el tope del rango de repeticiones, con técnica limpia y 2 repeticiones en reserva, en dos sesiones seguidas**.

### 6.3 Pesos iniciales

- No se da un número fijo. Primera sesión de cada ejercicio con carga = **serie de prueba**: elegir una carga sugerida (según peso corporal, nivel y equipo disponible), hacer 10 repeticiones y marcar cuántas quedaban en reserva.
- Ajuste: más de 4 en reserva → +10%; entre 2 y 4 → mantener; menos de 2 → −10%.
- Primeras 2 semanas: dejar 3 o 4 repeticiones en reserva para aprender la técnica.
- Ejercicios con peso corporal: test de repeticiones máximas para asignar el escalón de la escalera.

### 6.4 Registro y progresión automática

- Cada serie: carga (kg, color de banda o variante), repeticiones, repeticiones en reserva (0, 1, 2, 3, 4+). Con valores de la vez anterior precargados.
- **Doble progresión:** cuando todas las series llegan al tope del rango con 2 o más en reserva → sugerir +2,5 a 5% o la variante siguiente.
- **Estancamiento:** 3 sesiones sin progreso → sugerir bajar 10% y reconstruir, o cambiar variante.
- Máximo estimado (fórmula de Epley: carga × (1 + repeticiones / 30)) para mostrar progreso sin pruebas al máximo.
- Historial por ejercicio con gráfico y récords personales.

## 7. Plan y agenda

### 7.1 Agenda hora por hora

- Vista **día** (línea de tiempo de 05:00 a 24:00) y vista **semana**.
- Tipos de bloque: fijo (trabajo, estudio, viaje), comida, sueño, entrenamiento, microsesión (5 a 10 min), actividad (caminata, bici), clase (si el usuario se suma a una escuela).
- **Plantillas por tipo de día** (laboral, sábado, domingo) y **cambios puntuales** para una fecha sin romper la plantilla.
- En celular: tocar un horario para agregar; mantener apretado para mover; tocar un bloque para editar. Nada de arrastrar con precisión.
- Varias sesiones por día permitidas.

### 7.2 Generador del plan

El usuario puede pedir "armámelo vos" y después editar todo. El generador:

1. Lee objetivos (los 100 puntos), nivel por área, lugares y equipo de cada día, huecos libres, limitaciones y etapa actual.
2. Elige frecuencia: fuerza 2 a 3 veces por semana para cada patrón principal; cardio que sume entre 150 y 300 minutos semanales de actividad moderada, **contando las caminatas que el usuario ya hace**; movilidad corta casi todos los días.
3. Si "Verme mejor" pesa más: prioriza series semanales por grupo muscular (meta inicial 10 series por grupo prioritario, subiendo con el nivel).
4. Alterna días fuertes y suaves; nunca dos días fuertes seguidos si se puede evitar.
5. Encaja cada sesión en un hueco del lugar correcto y con ejercicios posibles con ese equipo y espacio. En el gimnasio respeta las preferencias del usuario (máquinas, pesos libres, poleas) y el método de series elegido; con "que decida la app": series clásicas con 2 a 3 minutos de pausa en los ejercicios pesados, superseries de músculos distintos en los accesorios y circuito si el hueco es corto. Si la muñeca está marcada, prioriza mancuernas con agarre neutro y máquinas que no carguen la muñeca.
6. Agrega microsesiones en huecos chicos (mañana, pausas de trabajo).

### 7.3 Validador (avisos automáticos)

- Dos días fuertes seguidos.
- Sesión intensa a menos de 2 h de dormir.
- Fuerza y cardio intenso con menos de 3 h de separación (sugerir fuerza primero).
- Comida pesada a menos de 1 h de entrenar.
- Menos de 7 h de sueño programadas.
- Un área sin trabajar en la semana (ej. movilidad 0).
- Volumen semanal que sube más de 10 a 20% respecto de la semana anterior.

### 7.4 Medidor de equilibrio semanal

Barras por área (fuerza, cardio, movilidad, técnica, recuperación) contra lo recomendado para el objetivo del usuario.

### 7.5 Periodización

- Fases por etapa: adaptación → base → desarrollo → específico → descarga.
- Semana de descarga (mitad de series, algo menos de carga) cada 6 a 8 semanas en principiantes, 4 a 6 en intermedios y 3 a 4 en avanzados, o antes si el control diario muestra fatiga acumulada.
- Retest cada 4 semanas, programado en la agenda.

### 7.6 Proyección

Gráfico de cómo podría evolucionar cada área a 1, 3, 6, 9 y 12 meses con 3 escenarios de constancia (100%, la estimada por el usuario, 50%). Modelo de curva que se acerca a un techo, con ritmos tomados de la literatura:

- fuerza: principiantes suben entre 15 y 30% en 12 semanas; entrenados, 2 a 6% por año;
- VO2max: 10 a 20% en 8 a 12 semanas en personas no entrenadas;
- músculo: principiantes 1 a 1,5% del peso por mes (hombres) y 0,5 a 0,75% (mujeres), la mitad en intermedios;
- grasa: 0,5 a 1% del peso por semana como ritmo recomendado;
- el ritmo baja con la edad y con el nivel.

Siempre con la leyenda "estimación; cada persona responde distinto".

## 8. Entrenar ahora

- Una pantalla por ejercicio: nombre, series × repeticiones objetivo, enlace "cómo se hace".
- Registro rápido de la serie (+/−, valores precargados) y botones de repeticiones en reserva.
- **Temporizador de descanso** automático, con +15 s y "saltar".
- **Temporizador de rounds** (trabajo/descanso configurables) para cardio y sombra.
- **Voz** (Web Speech API, `speechSynthesis`, voz en español): anuncia ejercicio, series, descanso, últimos 10 s y, en sombra, las combinaciones. Pitidos y vibración (`navigator.vibrate`) como respaldo.
- **Pantalla encendida** con Wake Lock API mientras hay una sesión activa.
- "Cambiar ejercicio" por uno equivalente (mismo patrón, equipo disponible, respetando limitaciones).
- Al terminar: resumen, esfuerzo percibido de la sesión (1 a 10) y diario de 3 líneas opcional (qué salió bien, qué mejorar, cómo me sentí).

## 9. Control diario (30 segundos, en Hoy)

Preguntas: horas de sueño, energía (1 a 5), dolor (ninguno / molestia / dolor, y zona). Reglas:

- Sueño < 6 h o energía 1–2 → **sesión reducida** (−1 serie por ejercicio, sin pruebas máximas).
- Dos días seguidos en reducida → sugerir descanso o versión mínima.
- Molestia en una zona → cambiar ejercicios que la cargan y mostrar la adaptación ("Modo muñeca").
- Dolor articular, punzante o que empeora → solo movilidad suave de otras zonas y aviso de consultar a un profesional.
- Siempre se puede elegir: **completa, reducida o mínima (10 min)**.

## 10. Actividad diaria

- **Pasos:** carga manual en la entrega 4; lectura automática desde Health Connect en la entrega 7.
- **Caminata, bici y soga:** minutos y distancia (manual), o registrados con el temporizador de la app.
- **Calorías gastadas (estimación):** METs × peso (kg) × horas. Valores de MET del Compendium of Physical Activities (Ainsworth; versión 2024 para adultos). Guardar la tabla en `src/content/normas/mets.json` con la fuente y verificar cada valor contra el Compendium al cargarlo. Mostrar siempre como estimación.
- **Agua:** botones de vaso (250 ml) y botella (500 ml), editable. Referencia orientativa de ingesta total de agua (bebida + comida) de la EFSA: 2,0 L por día en mujeres y 2,5 L en hombres; la guía principal es la sed y el color de la orina. Más en días de calor y entrenamiento.

## 11. Estética

- **Medidas:** cintura, cadera, pecho, brazo contraído, muslo, cuello; siempre en el mismo punto, con instrucciones y dibujo.
- **Fotos de progreso:** guía (misma luz, distancia, hora, ropa; frente, perfil, espalda). Se guardan solo en el dispositivo (IndexedDB como Blob). Comparación "antes / ahora" con deslizador. Bloqueo opcional con PIN de la sección de fotos. Las fotos **no** se incluyen en el respaldo de texto; sí en el respaldo de archivo si el usuario lo elige.
- **Postura contra la pared** y **satisfacción con el cuerpo (1 a 10)**, registradas aparte, nunca mezcladas con el puntaje físico.
- Expectativas realistas: los cambios visibles suelen empezar a notarse entre 8 y 12 semanas.
- Cuidado: nada de dietas extremas ni metas de grasa muy baja; si el usuario carga metas peligrosas (ej. bajar más de 1% del peso por semana), avisar.

## 12. Hábitos y constancia

- **Intenciones "cuando… entonces…":** cada sesión del plan genera una frase editable ("El lunes a las 20:15, cuando llego al depto, me cambio y hago Fuerza con bandas").
- **Regla de nunca faltar dos veces seguidas** y **versión mínima** de 10 minutos siempre disponible.
- **Racha** en semanas cumplidas (no en días, para no castigar descansos).
- **Logros** por constancia más que por rendimiento (ej. "4 semanas sin faltar dos veces seguidas", "primer retest", "30 días con control diario").
- **Revisión del mes:** resumen automático de cumplimiento, mejoras, estancamientos y una sugerencia para el mes siguiente.
- **Dejar de fumar** (si el usuario lo activa): días sin fumar, plata ahorrada (precio cargado por el usuario), cómo se recupera el cuerpo mes a mes (contenido de Aprender), y botón **"Tengo ganas de fumar"** que lanza 5 minutos de respiración y movimiento.
- **Recordatorios:** generar eventos de calendario (.ics) para cada sesión, para que el usuario los importe en Google Calendar. Las notificaciones de la app quedan para la versión nativa.
- **Datos:** formar un hábito lleva una mediana de 66 días (rango de 18 a 254) según Lally y colegas; la app comunica "pensá en 3 meses, no en 21 días".

## 13. Aprender y coach

### 13.1 Base de conocimiento

Artículos cortos (2 a 4 minutos de lectura), cada uno con:

- versión para principiante, intermedio y avanzado (cambia el nivel de detalle, no los hechos);
- fuentes al pie;
- etiquetas para el buscador.

Categorías: Tu cuerpo, Ciencia del entrenamiento, Ejercicios, Estética y composición, Comida, Salud, Mente y hábitos, Técnica de combate, Cómo usar la app. Lista completa del contenido en la sección 17.

### 13.2 Guías prácticas por nivel

- **Caminar:** postura, ritmo, caminata con tramos rápidos, caminata en subida.
- **Correr:** desde cero con intervalos de caminar y trotar, hasta 30 minutos seguidos; técnica de pisada y cadencia; cómo no lesionarse.
- **Soga:** salto básico, alternado, cruces, doble salto; cómo elegir el largo; progresión por minutos.
- **Bici:** postura, ritmo, uso del viaje diario como entrenamiento.
- **Respiración:** por la nariz en ritmo suave; exhalaciones largas para bajar los nervios; respiración al levantar peso; respiración en rounds.
- **Movilidad diaria y pausas activas** para trabajo de escritorio.

### 13.3 Coach sin IA paga

- **Buscador local:** índice de palabras y sinónimos (ej. "panza" ↔ "abdomen", "barriga"; "agujetas" ↔ "dolor muscular").
- **Motor de reglas** (`src/lib/coach/`): reglas del tipo condición → mensaje + acción, evaluadas con los datos del usuario. Mínimo inicial:
  - estancado 3 sesiones en un ejercicio → bajar 10% o cambiar variante;
  - criterio de escalón cumplido → proponer subir;
  - sueño < 6 h → sesión reducida;
  - molestia marcada → modo limitación;
  - faltó dos veces seguidas → mensaje de vuelta con versión mínima;
  - cintura sube 2 cm en 4 semanas con objetivo de bajar grasa → revisar comida;
  - retest con mejora → celebrar y mostrar qué mejoró;
  - etapa cumplida → pasar de etapa.
- **Tono según nivel:** principiante, lenguaje simple y paso a paso; avanzado, detalle técnico.
- **Botón "Preguntarle a Claude":** arma un texto con el perfil, nivel, plan de la semana y últimos registros (sin fotos), lo copia al portapapeles y explica que lo pegue en la app de Claude.

## 14. Módulo de combate (entrega 6)

- **Poder de pelea:** 10 × factor físico × técnica × peso. Factor físico = e^(0,35 × z promedio de las pruebas); técnica = experiencia (1,0 a 3,8, reducida sin sparring) × ajuste por nivel de sombra y pies (0,8 a 1,2); peso = (peso / 75)^0,33. Escala: 10 = persona promedio, ~100 = campeón mundial. Es una escala propia y lo dice.
- **Sombra por disciplina** (boxeo, kickboxing/muay thai, MMA, karate/taekwondo, lucha/judo/BJJ): niveles 0 a 5 con checklist sobre video (4 criterios generales + 4 de la disciplina) y programa paso a paso: forma → con desplazamiento → en combinación → a velocidad → reacción.
- **Juego de pies:** 6 niveles con ejercicios para espacio chico.
- **Combinar disciplinas:** técnicas etiquetadas por disciplina, distancia (larga, media, corta, clinch, suelo), tipo y lado; generador de combinaciones con reglas biomecánicas (peso al terminar cada técnica) y énfasis en transiciones entre distancias. Recomendación: una disciplina base y sumar otra después de 6 a 12 meses.
- **Entrenador por voz:** canta combinaciones con tempo, complejidad, orden (fijo o aleatorio) y momento del round ajustables.
- **Entrenador de contragolpes:** estímulo en pantalla → respuesta.
- **Simulador:** dos perfiles con áreas separadas de ataque y defensa, estrategias, reglamentos; cientos de peleas simuladas; cómo se gana (decisión, sumisión, nocaut); "qué me falta para ganarle".
- Antes de recomendar sparring: aviso de que conviene aprender con un profesor.

## 15. Respaldo de datos

- **Exportar:** archivo JSON con todo (opción de incluir fotos) y texto comprimido para copiar.
- **Importar:** desde archivo o texto, con vista previa y confirmación.
- Recordatorio de respaldo cada 2 semanas.
- Pedir almacenamiento persistente (`navigator.storage.persist()`).

## 16. Entregas

Cada entrega tiene que poder usarse sola en el celular antes de pasar a la siguiente.

| Entrega | Incluye | Listo cuando |
| --- | --- | --- |
| 1. Base | Estructura, tema, navegación, primer inicio, evaluación guiada con cronómetros, resultados, niveles por área, historial, respaldo, instalable y sin internet, publicación en GitHub Pages | Se instala en Android, funciona en modo avión, la evaluación completa da los mismos números que el cálculo a mano de los tests, y el respaldo exporta e importa sin perder datos |
| 2. Ejercicios | Biblioteca con ~40 fichas (peso corporal, bandas, mancuernas, barra), escaleras, adaptaciones por limitación, pesos iniciales, registro y progresión automática | Se puede registrar una sesión entera y la app sugiere bien la carga siguiente |
| 3. Plan y agenda | Agenda hora por hora, plantillas, lugares, generador, validador, microsesiones, Entrenar ahora con temporizadores y voz, control diario, periodización, proyección | El usuario arma o genera su semana, la entrena guiado y el plan se ajusta con el control diario |
| 4. Actividad y hábitos | Pasos manuales, caminata, bici, soga, agua, calorías, estética (medidas, fotos, postura), intenciones, rachas, logros, revisión del mes, dejar de fumar, .ics | Todo se registra en menos de 3 toques |
| 5. Aprender y coach | Base de conocimiento inicial, guías, buscador, motor de reglas, "Preguntarle a Claude" | El coach reacciona a los casos de la sección 13.3 |
| 6. Combate | Sección 14 completa | — |
| 7. Android nativo | Envolver la app con Capacitor, leer pasos y distancia desde Health Connect, notificaciones locales | Los pasos aparecen solos en Hoy |

## 17. Contenido a cargar (catálogo)

1. **Tu cuerpo:** grupos musculares y qué hace cada uno; articulaciones y patrones de movimiento; tipos de fibra; qué pasa al entrenar y al descansar; sistemas de energía; corazón, pulmones, pulso y VO2max.
2. **Ciencia del entrenamiento:** sobrecarga progresiva, especificidad, recuperación, variación, individualidad; cómo se gana fuerza, músculo, resistencia, potencia y movilidad, y a qué ritmo; series, repeticiones, descansos, esfuerzo percibido y repeticiones en reserva; periodización y descargas; combinar fuerza y cardio; calentamiento.
3. **Ejercicios:** fichas (sección 6) y escaleras; movilidad, equilibrio y pausas activas.
4. **Estética:** grasa y músculo; por qué no se baja grasa por zonas; volumen por grupo muscular; postura de escritorio; cómo medirse y sacarse fotos; expectativas por mes.
5. **Comida:** proteína (1,4 a 2,0 g por kg por día según la ISSN), carbohidratos, grasas y calorías explicados simple; método de la mano para porciones; antes y después de entrenar; hidratación; comidas fáciles; mitos.
6. **Salud:** señales de alerta; dolor muscular contra dolor de lesión; lesiones comunes del principiante; dejar de fumar (recuperación, ganas, peso); sueño; ergonomía de compu y videojuegos.
7. **Mente y hábitos:** cómo se forma un hábito; señal, rutina y recompensa; intenciones; motivación y qué hacer sin ganas; versión mínima; recaídas; entrenar con otros; disfrutar; respiración, visualización y concentración.
8. **Técnica de combate:** guardia, desplazamientos y golpes por disciplina; programa de sombra; transiciones; vendaje de manos; seguridad en sparring.
9. **Cómo usar la app:** glosario (RIR, zona 2, descarga, percentil, VO2max, etc.), qué significa cada número, cómo hacer cada prueba.

Todo artículo cita sus fuentes. Prioridad de carga: lo que necesita cada entrega (entrega 1: evaluación, salud y hábitos básicos; entrega 2: ejercicios; y así).

## 18. Fuentes principales de este documento

- Ritmos de fuerza: Barbell Medicine, *Progressive Loading Part 3* — https://www.barbellmedicine.com/blog/novice-intermediate-advanced-strength-training/
- VO2max y frecuencia de entrenamiento: Sports Medicine 2024 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11787188/
- Ganancia de músculo (Aragon y Helms): https://powerliftingtechnique.com/how-long-do-newbie-gains-last/
- Proteína: ISSN Position Stand — https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
- Fuerza y cardio combinados: Schumann 2021 — https://link.springer.com/doi/10.1007/s40279-021-01587-7
- Formación de hábitos (Lally): https://www.thebehavioralscientist.com/?p=8902
- Health Connect y fin de Google Fit: https://developer.android.com/health-and-fitness/health-connect/migration/fit
- Resto de fuentes de la evaluación: ver `EVALUACION.md`.
