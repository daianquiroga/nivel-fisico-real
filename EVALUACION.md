# Método de evaluación — Nivel Físico Real

Evaluación en casa, sin equipos (solo celular, pared, silla firme, hilo o cinta métrica) y con espacio de 1 × 1 m para las pruebas de pie. Las dos pruebas en el piso (flexiones y plancha) necesitan el largo del cuerpo acostado.

Resultado: **condición física (0 a 100)**, **edad física**, **composición corporal** y **habilidad de movimiento (0 a 100)**, más el **nivel por área (1 a 5)**. Las tablas de este archivo se pasan a `src/content/normas/*.json` con su campo `fuente`.

## 0. Antes de empezar

### Cuestionario de salud

Si responde **sí** a alguna, la app solo permite las mediciones en reposo y recomienda consultar a un médico antes de las pruebas de esfuerzo:

1. ¿Algún médico te dijo que tenés un problema de corazón o presión alta?
2. ¿Sentís dolor en el pecho al hacer esfuerzo o en reposo?
3. ¿Te mareaste o perdiste el conocimiento en el último año?
4. ¿Tenés algún problema de huesos o articulaciones que empeora con el ejercicio?
5. ¿Tomás medicación para el corazón o la presión?

Si la persona fumó muchos años o dejó hace poco, mostrar además: "conviene un chequeo médico antes de entrenar fuerte".

### Reglas para que los números sirvan

- Misma hora, misma ropa, sin haber entrenado ese día ni el anterior.
- Comida liviana 2 h antes; sin café en la hora previa.
- Orden: mediciones en reposo → movilidad → equilibrio → sentarse y pararse → flexiones → plancha → video. 3 a 5 minutos de descanso entre pruebas de esfuerzo.
- Si algo duele (no solo cansa), se corta la prueba y se marca "no realizada".

## 1. Pruebas

| # | Prueba | Área | Necesita | Tiempo |
| --- | --- | --- | --- | --- |
| 1 | Pulso en reposo (3 mañanas) | Cardio | Celular | 1 min por día |
| 2 | Altura y cintura | Composición | Pared, hilo, cinta o regla | 5 min |
| 3 | Cuestionario de actividad | Cardio | Nada | 1 min |
| 4 | Rodilla a la pared | Movilidad | Pared | 3 min |
| 5 | Equilibrio en un pie | Equilibrio y habilidad | Nada | 5 min |
| 6 | Sentarse y pararse en 1 minuto | Fuerza de piernas | Silla de ~46 cm | 1 min |
| 7 | Flexiones máximas | Fuerza de brazos | Largo del cuerpo en el piso | 2 min |
| 8 | Plancha | Core | Largo del cuerpo en el piso | 3 min |
| 9 | Video de movimiento y fotos | Habilidad y estética | Celular apoyado | 10 min |

Modo rápido: 1, 2, 5, 6 y 7.

## 2. Cardio: VO2max estimado (sin correr)

**Pulso en reposo:** tres mañanas seguidas, al despertar, sentado 1 minuto quieto; contar latidos durante 60 s en muñeca o cuello. Usar el promedio. La app ofrece un contador con cuenta regresiva de 60 s y un botón para tocar en cada latido como alternativa.

**Índice de actividad HUNT** (multiplicar los puntos de las tres respuestas, actividad de tiempo libre):

| Pregunta | Respuesta | Puntos |
| --- | --- | --- |
| Frecuencia | Nunca o menos de 1 por semana | 0 |
| | 1 por semana | 1 |
| | 2 o 3 por semana | 2,5 |
| | Casi todos los días | 5 |
| Intensidad | Tranquilo, sin transpirar | 1 |
| | Transpiro y respiro fuerte | 2 |
| | Cerca del agotamiento | 3 |
| Duración | Menos de 15 min | 0,1 |
| | 15 a 29 min | 0,38 |
| | 30 a 60 min | 0,75 |
| | Más de 60 min | 1 |

Intensidad y duración: puntajes del cuestionario HUNT (Loe 2013). **Pendiente:** confirmar los puntos de frecuencia contra Nes 2011 / Kurtze 2008 antes de cerrar la entrega 1; dejarlos en el JSON con una nota.

**Fórmulas de Nes 2011** (cintura en cm, pulso en latidos/min, PA = índice):

- Hombres: `VO2max = 100.27 − 0.296·edad − 0.369·cintura − 0.155·pulso + 0.226·PA`
- Mujeres: `VO2max = 74.736 − 0.247·edad − 0.259·cintura − 0.114·pulso + 0.198·PA`

Error típico de la estimación: unos 5 a 6 ml/kg/min. Mostrarlo.

**VO2max promedio por edad** (HUNT, medido en cinta; CERG NTNU). Para interpolar se usan los puntos medios de cada grupo (25, 35, 45, 55, 65, 75):

| Edad | Mujeres | Hombres |
| --- | --- | --- |
| 20–29 | 43 | 54 |
| 30–39 | 40 | 49 |
| 40–49 | 38 | 47 |
| 50–59 | 34 | 42 |
| 60–69 | 31 | 39 |
| 70 o más | 27 | 34 |

- **Percentil de cardio:** normal con media = promedio interpolado para la edad y desvío = 7 ml/kg/min (Loe 2013 informó desvíos de 7,7 a 8,4 en los más jóvenes).
- **Edad física:** la edad a la que el promedio interpolado iguala el VO2max estimado. Límite inferior 20 y superior 85 (fuera de la tabla, extrapolar con la pendiente del último tramo).
- Aclarar en la app: la población de referencia es de adultos sanos noruegos que hicieron la prueba, más en forma que el promedio general; la edad física puede salir mayor que la real aunque la persona sea "normal".

## 3. Composición corporal

**Medición:** altura descalzo contra la pared (libro apoyado en la cabeza). Cintura de pie, al final de una exhalación normal, sin meter panza, cinta horizontal a la altura del borde superior del hueso de la cadera (Cedars-Sinai). Dos veces, promedio, en ayunas a la mañana.

**Sin cinta métrica:** un hilo del largo de la altura, doblado a la mitad; si da la vuelta a la cintura, la relación cintura/altura es menor a 0,5 (Ashwell). Para el número exacto, medir el hilo con una regla.

**Relación cintura/altura** (guía NICE, Ashwell 2025):

| Cintura / altura | Grasa abdominal | Riesgo |
| --- | --- | --- |
| 0,40 a 0,49 | Saludable | Sin aumento |
| 0,50 a 0,59 | Aumentada | Aumentado |
| 0,60 o más | Alta | Más aumentado |

**Porcentaje de grasa estimado, RFM** (Woolcott y Bergman 2018, validado contra DXA):

- Hombres: `64 − 20 × altura / cintura`
- Mujeres: `76 − 20 × altura / cintura`

Umbral de obesidad por grasa: 22,8% hombres, 33,9% mujeres. Mostrar como estimación para seguir la propia evolución.

### Tipo de cuerpo (opcional: peso y muñeca)

El método de referencia es el **somatotipo de Heath-Carter**: tres números (endomorfia = grasa relativa, mesomorfia = desarrollo músculo-esquelético, ectomorfia = linealidad). Endomorfia y mesomorfia necesitan pliegues cutáneos y diámetros óseos con calibre, así que en casa solo se calcula la linealidad:

- `HWR = altura (cm) / raíz cúbica del peso (kg)`
- HWR ≥ 40,75: `ectomorfia = 0,732 × HWR − 28,58`
- 38,25 < HWR < 40,75: `ectomorfia = 0,463 × HWR − 17,63`
- HWR ≤ 38,25: `ectomorfia = 0,1`
- Niveles (Carter y Heath 1990): 0,5–2,5 baja, 3–5 moderada, 5,5–7 alta, 7,5 o más muy alta.

**Contextura ósea** por circunferencia de muñeca (justo arriba del huesito) y altura, tabla de MedlinePlus pasada a cm. Hombres (tabla de más de 165 cm, usada para todos): chica < 16,5; mediana 16,5–19,1; grande > 19,1. Mujeres: < 157,5 cm: chica < 14,0, mediana 14,0–14,6; 157,5–165 cm: chica < 15,2, mediana 15,2–15,9; > 165 cm: chica < 15,9, mediana 15,9–16,5; por encima, grande.

**Tendencia (decisión de diseño de la app, no es un estándar):** linealidad ≥ 4 → lineal; grasa RFM por encima del umbral de obesidad → redondeada; linealidad < 1,5 → robusta; el resto → intermedia. Se muestra como estimación y se aclara que no es el somatotipo completo. Caso calculado a mano: 178 cm y 69,2 kg → HWR 43,36 → linealidad 3,16 (moderada).

## 4. Fuerza y resistencia

### Sentarse y pararse en 1 minuto (Strassmann 2013, 6.926 adultos)

Silla de ~46 cm sin apoyabrazos contra la pared; pies al ancho de cadera; brazos cruzados (el estudio permitía brazos sueltos o en la cadera, pero sin empujarse). Cuenta cada vez que se para con rodillas estiradas y vuelve a tocar la silla. 60 s a ritmo propio; la app avisa a los 30 y 15 s restantes.

Percentiles (repeticiones por minuto):

| Edad | H P2,5 | H P25 | H P50 | H P75 | H P97,5 | M P2,5 | M P25 | M P50 | M P75 | M P97,5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20–24 | 27 | 41 | 50 | 57 | 72 | 31 | 39 | 47 | 55 | 70 |
| 25–29 | 29 | 40 | 48 | 56 | 74 | 30 | 40 | 47 | 54 | 68 |
| 30–34 | 28 | 40 | 47 | 56 | 72 | 27 | 37 | 45 | 51 | 68 |
| 35–39 | 27 | 38 | 47 | 58 | 72 | 25 | 37 | 42 | 50 | 63 |
| 40–44 | 25 | 37 | 45 | 53 | 69 | 26 | 35 | 41 | 48 | 65 |
| 45–49 | 25 | 35 | 44 | 52 | 70 | 25 | 35 | 41 | 50 | 63 |
| 50–54 | 24 | 35 | 42 | 53 | 67 | 23 | 33 | 39 | 47 | 60 |
| 55–59 | 22 | 33 | 41 | 48 | 63 | 21 | 30 | 36 | 43 | 61 |
| 60–64 | 20 | 31 | 37 | 46 | 63 | 20 | 28 | 34 | 40 | 55 |
| 65–69 | 20 | 29 | 35 | 44 | 60 | 19 | 27 | 33 | 40 | 53 |
| 70–74 | 19 | 27 | 32 | 40 | 59 | 17 | 25 | 30 | 36 | 51 |
| 75–79 | 16 | 25 | 30 | 37 | 56 | 13 | 22 | 27 | 30 | 43 |

Menores de 20: usar 20–24. Mayores de 79: usar 75–79 y avisar.

### Flexiones máximas (normas canadienses, Payne 2000, reproducidas por ACSM)

Hombres: flexión completa. Mujeres: con rodillas apoyadas (la app permite elegir completa y lo registra). Manos algo más abiertas que los hombros, cuerpo recto, pecho a un puño del piso, sin pausa en el piso; termina al perder la técnica. **Adaptación muñeca:** sobre puños o agarrando mancuernas; se registra la variante.

Hombres:

| Edad | A mejorar | Regular | Bien | Muy bien | Excelente |
| --- | --- | --- | --- | --- | --- |
| 20–29 | ≤16 | 17–21 | 22–28 | 29–35 | ≥36 |
| 30–39 | ≤11 | 12–16 | 17–21 | 22–29 | ≥30 |
| 40–49 | ≤9 | 10–12 | 13–16 | 17–24 | ≥25 |
| 50–59 | ≤6 | 7–9 | 10–12 | 13–20 | ≥21 |
| 60–69 | ≤4 | 5–7 | 8–10 | 11–17 | ≥18 |

Mujeres 20–29 (rodillas): ≤9, 10–14, 15–20, 21–29, ≥30. **Pendiente:** cargar el resto de las edades de mujeres desde la fuente original antes de cerrar la entrega 1.

Categoría → percentil: 10, 30, 50, 70, 90 (interpolar dentro de la categoría).

### Plancha (Chase 2014; Strand 2014)

Antebrazos y puntas de pie, codos bajo los hombros, cuerpo recto; termina cuando la cadera cae o sube y no se corrige. Referencia solo para 18–25 años: hombres P25 84 s, P50 110 s, P75 135 s; mujeres P25 63 s, P50 90 s, P75 121 s. Para otras edades no hay normas sólidas: se muestra el tiempo y la evolución personal, pero **solo entra al puntaje entre los 18 y 25 años**. Fuera de ese rango, el área de fuerza se calcula con sentarse y pararse y flexiones.

## 5. Movilidad: rodilla a la pared (McBride 2026)

Descalzo, frente a la pared, un pie adelante; la rodilla toca la pared sin levantar el talón; alejar el pie de a 1 cm hasta la máxima distancia posible. Medir dedo gordo–pared, ambas piernas; usar el promedio y señalar diferencias de más de 1,5 cm.

Referencia: menores de 50, la mitad central entre ~8 y ~14 cm (valor típico ~11 cm); 70–79 años, valor central ~7,4 cm hombres y ~6,5 cm mujeres. **Pendiente:** cargar la tabla completa de percentiles por edad y sexo de McBride 2026.

## 6. Habilidad de movimiento

### Equilibrio en un pie (Springer 2007, 549 adultos)

Descalzo, brazos cruzados, pie levantado cerca del tobillo sin tocarlo. Corta si: descruza los brazos, el pie levantado toca el piso o la pierna, el pie de apoyo se mueve, abre los ojos (prueba con ojos cerrados) o llega a 45 s. Tres intentos por condición; vale el mejor. Hacerlo cerca de una pared por seguridad. Sin diferencia por sexo.

Mejor de 3, promedio (desvío) en segundos:

| Edad | Ojos abiertos | Ojos cerrados |
| --- | --- | --- |
| 18–39 | 44,7 (3,1) | 15,2 (13,3) |
| 40–49 | 41,9 (9,9) | 12,7 (12,9) |
| 50–59 | 41,2 (10,2) | 8,3 (8,4) |
| 60–69 | 32,1 (16,2) | 4,4 (5,1) |
| 70–79 | 21,5 (17,3) | 3,1 (4,5) |
| 80 o más | 9,4 (12,8) | 1,9 (1,0) |

Para menores de 60 se puntúa con ojos cerrados (con ojos abiertos casi todos llegan al tope). Distribución sesgada: calcular el percentil con una normal sobre el logaritmo del tiempo, o como mínimo limitar entre 1 y 99.

### Calidad de movimiento en video (escala propia, 0 a 3 por movimiento)

Celular a ~2 m, de costado y de frente; 5 repeticiones lentas de cada movimiento:

| Movimiento | 3 | 2 | 1 | 0 |
| --- | --- | --- | --- | --- |
| Sentadilla profunda, brazos arriba | Muslos bajo la rodilla, talones apoyados, brazos alineados | Profunda pero talones se levantan o tronco muy inclinado | No pasa de paralela | Dolor |
| Estocada atrás | Rodilla casi toca el piso, tronco derecho, estable | Tambalea o se inclina | Necesita apoyarse | Dolor |
| Bisagra de cadera | Espalda recta, cadera atrás, rodillas apenas flexionadas | Espalda algo curva al final | Dobla la espalda en vez de la cadera | Dolor |
| Flexión de brazos (calidad) | Cuerpo recto, codos a ~45° | Cadera se hunde en alguna repetición | Cadera caída o recorrido corto | Dolor |
| Sentadilla parcial en un pie | Rodilla alineada con el pie, cadera nivelada | Rodilla se va un poco hacia adentro | Rodilla muy adentro o pierde el equilibrio | Dolor |

Inspirada en las escalas de evaluadores de movimiento, **no validada**: se compara contra uno mismo. Suma de 0 a 15 → 0 a 100. Movimiento con dolor: se excluye del plan y se recomienda consultar.

### Reacción (opcional)

Prueba en pantalla (simple, de elección y de anticipación). Se registra pero no entra en el puntaje: cada celular agrega su propio retraso. Solo se compara contra uno mismo y en el mismo aparato.

## 7. Estética (sin puntaje)

No existe una escala científica de apariencia. Se registra y se compara contra uno mismo:

- % de grasa estimado y cintura/altura;
- perímetros: brazo contraído, pecho, cadera, muslo (mismo punto siempre);
- postura contra la pared: talones, cola y espalda alta contra la pared mirando al frente; si la nuca no toca sin levantar el mentón, anotar la distancia en dedos;
- fotos de progreso (frente, perfil, espalda; misma luz, distancia ~2 m, cámara a la altura del ombligo, en ayunas, misma ropa);
- satisfacción con el cuerpo de 1 a 10, aparte.

## 8. Puntajes

### De la prueba al percentil

- Tabla con P25/P50/P75 (y P2,5/P97,5 si hay): interpolación lineal entre puntos; fuera de rango, normal con desvío = (P75 − P25) / 1,35.
- Tabla con media y desvío: normal.
- Tabla por categorías: percentil central de la categoría (10, 30, 50, 70, 90), interpolando dentro del rango.
- Siempre limitar entre 1 y 99.

### Composición (por zonas, no por percentil, para no premiar la delgadez extrema)

- Cintura/altura entre 0,40 y 0,49 → 85; por debajo de 0,40 → 75; desde 0,50, restar 15 por cada 0,05 (0,50 → 70, 0,55 → 55, 0,60 → 40, mínimo 10).
- RFM debajo del umbral de obesidad → +0; por encima → −10.
- Puntaje de composición = resultado, limitado entre 5 y 95.

### Condición física (0 a 100)

| Área | Pruebas | Peso |
| --- | --- | --- |
| Cardio | VO2max estimado | 35% |
| Fuerza y resistencia | Promedio de sentarse y pararse, flexiones y plancha (plancha solo de 18 a 25 años) | 30% |
| Composición | Ver arriba | 20% |
| Movilidad | Rodilla a la pared | 7,5% |
| Equilibrio | Un pie (ojos cerrados si < 60 años) | 7,5% |

Si falta una prueba, se reparte su peso entre las demás del área o, si el área queda vacía, entre las otras áreas, y se avisa que el resultado es parcial. Los pesos son una decisión de diseño (el VO2max tiene la evidencia más fuerte sobre salud), no un estándar publicado; la app lo dice.

### Habilidad de movimiento (0 a 100)

60% calidad de movimiento en video + 40% percentil de equilibrio.

### Nivel por área

Percentil 0–20 = 1 Inicial · 20–40 = 2 Base · 40–60 = 3 En marcha · 60–80 = 4 Sólido · 80–100 = 5 Avanzado.

## 9. Casos de prueba (para los tests de `src/lib/calc/`)

1. **Hombre, 35 años, cintura 90 cm, altura 175 cm, pulso 70, actividad 2 o 3 veces por semana, transpira, 30–60 min** → PA = 2,5 × 2 × 0,75 = 3,75 → VO2max = 46,70 ml/kg/min → percentil de cardio ≈ 37 (media 49, desvío 7) → edad física ≈ 45,6 → cintura/altura = 0,514 → RFM = 25,11%.
2. **Mujer, 28 años, cintura 75 cm, altura 165 cm, pulso 72, actividad casi todos los días, transpira, 30–60 min** → PA = 7,5 → VO2max = 41,68 → edad física ≈ 29,4 → RFM = 32,0%.
3. **Sentarse y pararse:** hombre de 31 años con 47 repeticiones → percentil 50; con 56 → 75.
4. **Flexiones:** hombre de 25 años con 22 → percentil 40 (inicio de "Bien"); con 36 → 80 o más.

## 10. Repetición

- Semanal: cintura y pulso en reposo (promedio de 3 mañanas).
- Cada 4 semanas: todo, más fotos y video.
- Un cambio cuenta como real si se mantiene en dos evaluaciones seguidas (el pulso y el equilibrio con ojos cerrados varían mucho de un día a otro).

## 11. Límites

- El VO2max es estimado (error de ~5–6 ml/kg/min).
- Las tablas son de Noruega, Suiza, Canadá y Estados Unidos; no hay equivalentes argentinas para estas pruebas.
- Plancha: solo normas de adultos jóvenes. Flexiones de mujeres y rodilla a la pared: completar tablas desde la fuente.
- Falta potencia (salto): se puede sumar más adelante.
- Calidad de movimiento y estética se comparan contra uno mismo.

## 12. Fuentes

- Nes y colegas 2011, fórmulas de VO2max sin ejercicio (tabla en JAHA 2020): https://pmc.ncbi.nlm.nih.gov/articles/PMC7428991/table/jah35165-tbl-0001
- Loe y colegas 2013, referencia aeróbica HUNT: https://pmc.ncbi.nlm.nih.gov/articles/PMC3654926
- CERG, NTNU, VO2max por edad: https://ntnu.edu/cerg/fitness-numbers
- Strassmann y colegas 2013, sentarse y pararse: https://doc.rero.ch/record/316283/files/38_2013_Article_504.pdf
- Normas canadienses de flexiones (Payne 2000): https://getfitcraft.com/blog/how-many-push-ups-should-i-be-able-to-do
- Chase y colegas 2014, plancha: https://digitalcommons.wku.edu/ijesab/vol8/iss2/14
- Strand y colegas 2014, plancha: https://pmc.ncbi.nlm.nih.gov/articles/PMC4096102
- McBride y colegas 2026, rodilla a la pared: https://pubmed.ncbi.nlm.nih.gov/41723909/ (resumen de percentiles: https://fitnessnorms.pages.dev/flexibility/ankle-dorsiflexion/)
- Springer y colegas 2007, equilibrio: https://geriatrictoolkit.missouri.edu/balance/Normative_Values_for_the_Unipedal_Stance_Test_Springer-JGPT.pdf
- Woolcott y Bergman 2018, RFM: https://wiki.oroboros.at/index.php/Woolcott_2018_Sci_Rep
- Cedars-Sinai, cómo medir la cintura para RFM: https://www.cedars-sinai.org/content/cedars-sinai/blog/relative-fat-mass.html
- Ashwell, cintura/altura y guía NICE: https://ashwell.uk.com/documents/2025%20Nutrition%20Today.pdf
- Carter 2002, manual del somatotipo Heath-Carter (ecuaciones y niveles): https://ebooks.inflibnet.ac.in/antp06/chapter/heath-carter-methods-of-somatotyping/
- MedlinePlus, contextura por muñeca: https://medlineplus.gov/ency/imagepages/17182.htm
