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
