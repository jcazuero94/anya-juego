# Verificación del deseo de las ocho velas · versión 3

Fecha: 16 de octubre de 2026. Revisión sobre la aplicación real en navegador, usando el servidor estático local y después GitHub Pages. Sin dependencias de producción.

## Comprobación automática

`npm run check`: todos los módulos tienen sintaxis válida.

`npm test`: 33 pruebas correctas. Cubren ocho estaciones y 24 premios secuenciales; ingredientes básicos frente a extras; victoria con once retos y sin regalos; guía que solo recomienda objetivos necesarios; intro sin consumo de tiempo; estirones exactos a los 120 000 ms; derrota exacta a los 1 200 000 ms; reloj independiente de la tasa de fotogramas; pausa, reanudación y guardado; victoria antes del límite; rotación de doce tipos; dificultad progresiva; laberintos resolubles; palabras con tildes; colisiones y rutas a cada destino.

## Recorrido real en el navegador

- Portada con Anya, Pandora, Alyssia y Alessandro dentro de la casa.
- Las tres escenas de la intro explican el problema, el pastel, los premios y los veinte minutos; el reloj permanece en 20:00 hasta pulsar Empezar.
- Anya camina al centro y Alyssia indica qué falta y recomienda la pradera. La navegación automática lleva a estaciones rodeando obstáculos.
- Recorrido completo por las ocho estaciones. Se ganaron las ocho velas y solo los tres ingredientes básicos; se comprobó además un regalo del nivel 3.
- Se jugaron números en orden, cuentas, balanza, memoria, secuencias, patrones, acertijos y laberinto. Las pistas revelan cartas y explican los retos. Un error permite reintentar sin sumar un estirón.
- Cada nivel abre el siguiente, entrega el premio correspondiente y actualiza inventario/mapa. Los niveles aún cerrados no se pueden elegir.
- El reloj continúa con retos y mapa abiertos. Se observó el primer estirón al llegar a 18:00.
- Pausar desde un reto conserva la vista y congela el tiempo. Reanudar conserva el reto. La pausa durante el horneado también congela su progreso lógico.
- Recargar con ocho velas y tres ingredientes conserva los premios, la semilla y el tiempo restante. La partida no vuelve a veinte minutos.
- Alyssia acepta tres ingredientes básicos sin exigir los cinco extras. Horneado animado, pastel con ocho velas, elección del deseo y soplido. Las ocho llamas se apagan y aparece la celebración con los cuatro personajes.
- Los regalos aparecen como extras en el álbum; no bloquean la victoria.
- No hubo errores ni avisos de consola durante el recorrido.

## Límite de tiempo y casos de borde

El panel `tests/browser-fixture.html` prepara estados a través de botones visibles y usa la misma lógica del juego. Solo está disponible con `npm run start:qa` en `/__qa__`; el servidor normal devuelve 404 y GitHub Pages no publica este archivo.

- Partida a tres segundos del límite con el mapa abierto: al agotarse el reloj se cierra el mapa y aparece la derrota, con tejado y paredes que se abren por el estirón.
- Partida con las ocho velas y los tres ingredientes, a tres segundos del límite: también pierde si no se ha pedido el deseo. Tener materiales no concede una victoria automática.
- Partida con pastel listo: permite volver con Alyssia y soplar. Cerrar la animación del deseo conduce a la victoria, sin dejar una partida bloqueada.

## Diseño adaptable

Revisión en 1280 × 900, 390 × 844 y 320 × 740. Sin desplazamiento horizontal del documento ni de los diálogos. Se comprobaron mapa, cartas, controles de caminar, inventario y pantalla del deseo. La versión de 320 px muestra las ocho velas, el personaje y la casilla del deseo con el botón de soplar accesible.

Canvas y CSS respetan `prefers-reduced-motion`; la comprobación de esta preferencia fue de código. Los diálogos usan títulos accesibles, el reloj usa `role=timer` y las pistas/avisos usan estados anunciables. Hay controles de teclado, botones táctiles y sonido optativo.

## Capturas locales

En `output/qa/` (fuera de Git): `anya-v3-deseo.jpg`, `anya-v3-victoria.jpg`, `anya-v3-derrota.jpg` y la captura de la versión publicada. Las fotos originales permanecen en `Fotos/`, excluidas de Git.

## Ajuste de altura · versión 3.0.1

Alyssia se muestra más alta que Anya en portada, jardín, introducción y celebración. Revisado en 1280 × 900, 390 × 844 y 320 × 740: alrededor de 20 % de diferencia en la portada y 22 % en la celebración, sin deformar las ilustraciones ni introducir desplazamiento horizontal. La intro conserva la figura completa y los módulos pasan la comprobación de sintaxis.

## Pandora, receta y puntaje · versión 3.1

46 pruebas automáticas correctas. Las nuevas pruebas simulan guía hasta las ocho estaciones y el horno, retorno desde un punto lejano, vuelo/recogida/devolución de la pelota, devolución con Anya en movimiento, premio y caricia de cerca, pausa y cancelación. Se comprueban mejoras por ingrediente, receta con tres capas, rehacer un pastel al recoger otro ingrediente, puntajes mínimo y máximo, puntuación en derrota, contadores y compatibilidad con guardados anteriores de versión 3.

Revisión real de interfaz:

- La huella de Pandora inicia la guía: Pandora va delante, aparece un sendero dorado y Anya la sigue. Al ganar la primera vela, vuelve a guiar al nivel que entrega harina. Con la misión mínima completa, guía al horno.
- «Jugar con Pandora» abre acciones de pelota, premio, caricia y búsqueda de estrella. Se comprobó el vuelo de la pelota y su devolución real, con mensaje y contador de una pelota devuelta. El premio requiere acercamiento y muestra corazones; la caricia también se completa con mensaje. Los juegos no suman puntos.
- Se corrigió la superposición de la vista fija del jardín que ocultaba los botones de su pie al desplazarse. Los botones del pie y los del escenario ahora reciben sus clics por separado.
- Pastel con tres ingredientes frente a ocho: se ven el cambio de bizcocho, tres capas, chocolate, glaseado y perlas, flores de vainilla, fresas y plato dorado. La vista previa enumera las mejoras y permite buscar otro ingrediente.
- El final con ocho ingredientes y ocho regalos muestra 5.000 de 5.000 puntos: 800 por velas, 1.200 por ingredientes, 2.000 por regalos y 1.000 por el deseo. Incluye recuentos 8/8 y desglose; la misión mínima sin regalos vale 2.250.
- Vistas de receta, deseo y puntaje revisadas en 1280 × 900, 390 × 844 y 320 × 740, sin desplazamiento horizontal del documento ni de sus diálogos. Sin errores de consola durante las interacciones.

El panel local de pruebas añade un caso con los ocho ingredientes y ocho regalos. No se publica en `/docs`.

## Acciones de Pandora a mano · versión 3.1.1

La vista principal muestra una barra sobre el jardín con Acariciar, Lanzar pelota, Buscar estrella y Darle premio. Cada botón inicia su acción directamente, sin abrir ningún diálogo; la interacción al tocar a Pandora conserva su panel opcional.

Comprobado en navegador a 1280 × 900, 390 × 844 y 320 × 740: caricia completada, pelota devuelta, premio entregado y búsqueda de estrella iniciada con huellas. Ninguna acción abre un submenú. Los botones miden al menos 46 px de alto en computador y 72 px en celular, no se superponen y sus etiquetas caben sin desplazamiento horizontal. Se conserva la guía de la huella y el progreso guardado de versión 3.

## Acciones dentro del jardín · versión 3.1.2

La huella de guía y los cuatro botones de Pandora comparten ahora un grupo dentro del escenario. En computador aparecen junto al botón de explorar; en jardines más estrechos se colocan encima de las flechas y de explorar. Se retira la barra exterior.

Revisión en navegador a 1280 × 900, 390 × 844 y 320 × 740: los cinco botones están íntegramente dentro del jardín, reciben sus clics y no se superponen entre sí ni con los controles para caminar y explorar. La huella conserva 44 × 44 px y las acciones, al menos 44 × 54 px. Comprobados lanzamiento, caricia, premio, estrella y guía al siguiente objetivo desde el nuevo grupo, sin submenús. Sin desplazamiento horizontal.

## Las canciones de Pandora · versión 3.2

55 pruebas automáticas correctas. Las nueve pruebas de audio verifican los tres archivos públicos, carga diferida, repetición completa de la lista, pausa con conservación de posición, silencio, cambio de canción, volumen, preferencias, recuperación del bloqueo de reproducción, promesas canceladas y límite de reintentos ante errores.

Comprobaciones en el navegador real:

- La portada no inicia ni descarga canciones. La introducción permanece en silencio; comenzar o continuar una partida inicia la música.
- Los tres MP3 se decodifican y reproducen: `readyState=4`, `paused=false` y avance del tiempo de reproducción. El botón siguiente cambia entre «Pandora tiene hambre», «Sácame ya» y «Panties».
- Pausar detiene el audio en su posición exacta. Al reanudar sigue desde allí. Volver al inicio y terminar una partida por tiempo detienen la música.
- El altavoz de la cabecera y el del reproductor comparten el silencio. La preferencia se conserva al recargar. El volumen inicial es 30 %; cambiarlo a 29 % con el teclado se conserva al recargar, y el control no activa las flechas para caminar. Se restauró a 30 % tras la prueba.
- Controles revisados a 1280 × 900, 390 × 844 y 320 × 740: sin desplazamiento horizontal y con botones musicales de 44 × 44 px accesibles. Sin errores de consola.

Las copias web conservan las duraciones originales y solo contienen audio MP3 estéreo a 44,1 kHz y 128 kbit/s. Los archivos originales de `musica/` se conservan localmente, fuera de Git.
