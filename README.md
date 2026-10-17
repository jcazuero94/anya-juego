# Anya y el deseo de las ocho velas

Un juego de cumpleaños creado para los ocho años de Anya. Alessandro está atrapado en casa por un hechizo que lo hace crecer. Anya y Pandora recorren el jardín para reunir ocho velas y los ingredientes del pastel. Alyssia hornea; Anya sopla y pide el deseo que salva a su hermano.

**[Jugar la aventura](https://jcazuero94.github.io/anya-juego/)**

## La misión

- Ocho estaciones abiertas desde el principio. Cada una tiene tres niveles consecutivos: fácil → una vela, medio → un ingrediente, difícil → un regalo.
- Para ganar bastan **ocho velas, harina, huevos y leche**: once retos. Los otros cinco ingredientes y los ocho regalos son opcionales. Cada ingrediente extra mejora el pastel: mantequilla, glaseado y perlas de azúcar, flores de vainilla, chocolate y fresas. La receta crece hasta tres capas y un plato dorado. El botón «Ver cómo va mi pastel» permite revisar las mejoras.
- Alyssia espera en el centro, indica qué falta, recomienda el próximo objetivo necesario y hornea el pastel. Anya elige su deseo y pulsa el botón para soplar las ocho velas.
- Una introducción animada a pantalla completa, como un libro ilustrado de tres capítulos, explica la historia antes de iniciar el reloj; al empezar se abre un telón sobre el jardín. Al ganar aparece «¡Deseo cumplido!» con globos, fuegos artificiales y confeti; en la derrota un «¡CRAC!» sacude la pantalla y el tejado y las paredes se abren por el estirón. El puntaje cuenta hacia arriba en ambos finales.

## Explorar y aprender

Al empezar, el jardín de 2400 × 1600 ocupa toda la pantalla, también en el celular: senderos, árboles, estanque, huerto, mariposas y observatorio. Arriba quedan el botón «Menú», el reloj, la pausa y unas fichas con velas, ingredientes básicos y estirones, junto con el siguiente objetivo; cada premio nuevo salta al volver al jardín. Abajo están las flechas para caminar (en pantallas táctiles), los botones de Pandora y «Explorar». El menú reúne las velas e ingredientes, la casa de Alessandro, el mapa, el álbum, la ayuda y la música. «Guíame» (o tocar a Pandora) hace que camine delante de Anya hasta el siguiente objetivo necesario; con los materiales listos, la lleva al horno. «Pelota» lanza una pelota que Pandora busca y devuelve, y «Estrella» la pone a olfatear una de las ocho estrellas secretas. Se camina con flechas, WASD, los botones táctiles o tocando el suelo. El minimapa y el mapa permiten elegir estación; las rutas rodean obstáculos.

Doce minijuegos: cuentas, ordenar números, balanzas, observación, parejas, secuencias, palabras, acertijos, patrones, simetría, laberintos y decisiones de cuidado. Cada estación rota sus tres tipos entre partidas. Números, cartas, palabras, dibujos y caminos también cambian. La dificultad escala con el nivel: más parejas, secuencias y caminos más largos, palabras mayores, sumas/restas y luego grupos. Una semilla conserva los mismos retos al retomar la partida.

## Tiempo y descansos

**Diez minutos de juego activo. Alessandro crece cada minuto.** Cada estirón muestra una escena: Alessandro pasa de una pose a la siguiente dentro de la casa, cada vez más apretado, hasta hacerse una bolita. Si el estirón llega durante un minijuego, el mapa o el menú, la escena aparece al volver al jardín. La casa del centro del jardín cambia junto con la escena: al cerrarla, Alessandro aparece en la casa con su nueva pose y la casa da un pequeño rebote. Al encontrar las ocho estrellas secretas, Pandora celebra con una fiesta cuadro a cuadro: invita a jugar, corre de un lado a otro entre sus estrellas, juega con su pelota y termina sonriendo y guiñando un ojo. Estas dos escenas detienen el reloj mientras se ven. El reloj continúa en retos, mapa, ayuda, álbum y durante la preparación del pastel. Llegar a 10:00 sin soplar provoca la derrota, incluso con todos los materiales. Los errores y las pistas no añaden estirones ni descuentan tiempo adicional.

Pausar, ocultar la pestaña o salir detiene el reloj. Al volver a una pestaña oculta se pide reanudar; al volver a abrir la página se conserva el tiempo restante. La intro no consume tiempo. El progreso y el tiempo se guardan en este navegador. Otra aventura reinicia los premios y da diez minutos con nuevos retos.

No hay anuncios, compras, cuentas, formularios ni rastreadores. El humor trata de un hechizo ficticio: crecer en la vida real está bien.

## Las canciones de Pandora

«Pandora tiene hambre», «Sácame ya» y «Panties» acompañan la partida en ese orden y vuelven a empezar al terminar la tercera. La música comienza al iniciar o continuar el juego, con volumen inicial del 30 %. En el menú están el altavoz para silenciar música y efectos, el cambio de canción y el volumen. El navegador recuerda estas preferencias.

La música sigue durante los retos y los diálogos. Al pausar, ocultar la pestaña, salir o terminar la partida se detiene; al reanudar sigue desde el mismo punto. La portada y la introducción permanecen en silencio. Los archivos solo se cargan al jugar y se sirven desde GitHub Pages. Si una canción falla se intenta la siguiente; un fallo de audio no impide jugar.

## Puntaje de cada aventura

La pantalla final muestra el puntaje y el desglose, tanto al ganar como al perder:

- Cada vela: 100 puntos (hasta 800).
- Cada ingrediente: 150 puntos (hasta 1.200), con el total recogido de ocho.
- Cada regalo: 250 puntos (hasta 2.000), con el total recogido de ocho.
- Pedir el deseo a tiempo: 1.000 puntos.

El máximo es **5.000 puntos**. Ganar con los tres ingredientes básicos y sin regalos da 2.250. Jugar con Pandora o buscar estrellas no infla el puntaje. Los extras siguen siendo opcionales para ganar, y recogerlos mejora la receta y el resultado. Si ya se había horneado y se recoge otro ingrediente, Alyssia puede volver a hornear el pastel mejorado.

## Desarrollo y verificación

Node.js 20 o posterior, sin instalar dependencias:

```sh
npm start
npm run check
npm test
```

Abrir `http://127.0.0.1:4173`. El servidor es únicamente de desarrollo. GitHub Pages sirve los archivos estáticos de `/docs`, sin backend.

Las 54 pruebas cubren premios secuenciales, victoria mínima, materiales obligatorios, guía, límites exactos del reloj, pausas, derrota y victoria, variedad y dificultad, guardado y rutas, guía de Pandora, devolución de la pelota, mejoras del pastel, puntos y compatibilidad de los guardados. También verifican la lista musical, reanudación, silencio, volumen, recuperación de bloqueos, errores y preferencias. El protocolo de navegador está en [tests/QA.md](tests/QA.md).

Para revisar los límites temporales sin esperar diez minutos:

```sh
npm run start:qa
```

Abrir `http://127.0.0.1:4173/__qa__`. El panel prepara partidas locales próximas al primer estirón, a la derrota o a la octava estrella de Pandora. Solo se sirve con `--qa`; **no existe en el sitio público**, y sustituye la partida de prueba local.

## Código y recursos

- `docs/game.js`: historia, interfaz, menú, reloj, premios, Alyssia, pastel, deseo, mapa y álbum.
- `docs/logic.js`: progresión, reloj de juego, retos reproducibles y guardado validado.
- `docs/companion.js`: guía, pelota, olfato y seguimiento de Pandora.
- `docs/music.js`: lista de canciones, reproducción, volumen, pausas y preferencias de audio.
- `docs/assets/music/`: las tres canciones familiares, preparadas para reproducción web.
- `docs/world.js`, `docs/map.js`: Canvas, cámara, personajes, movimiento, colisiones y rutas.
- `docs/puzzles.js`, `docs/questions.js`: minijuegos, pistas y bancos de lectura.
- `docs/icons.js`: dibujos de velas, ingredientes y otros iconos.
- `docs/styles.css`, `docs/adventure.css`, `docs/birthday.css`, `docs/playtime.css`: diseño adaptable y animaciones con movimiento reducido.
- `docs/storybook.css`: capa visual del cuento: tipografía legible, tarjetas, botones, intro a pantalla completa, telón de inicio, premios animados y finales (deseo cumplido o ¡CRAC!).

## Publicación y privacidad

GitHub Pages publica `main`, carpeta `/docs`. No hay compilación, dependencias de producción, claves ni llamadas a servicios externos durante el juego. Los datos se guardan en el navegador; si se bloquea el almacenamiento se puede jugar sin retomar después. La versión 4 (diez minutos) inicia una misión nueva y conserva el contador de victorias anterior.

Las fotos de referencia permanecen en `Fotos/`, excluida de Git. Solo se publican las cuatro ilustraciones creadas para este regalo y las escenas del estirón: la casa y las veinte poses de Alessandro, convertidas a WebP de 640 px en `docs/assets/animations/alessandro/` (unos 1,3 MB en total). Los PNG originales generados con ChatGPT permanecen en `animaciones/`, excluida de Git. Las dieciséis poses de Pandora jugando y su pelota (originales en `design/animations/pandora-play/`) se publican como WebP de 480 px en `docs/assets/animations/pandora/` (unos 690 KB); solo se descargan al acercarse a la octava estrella. Los prompts están en [design/characters.md](design/characters.md). Nunito se distribuye con su [licencia SIL Open Font License](docs/assets/fonts/OFL.txt).

Los originales de las canciones permanecen en `musica/`, excluida de Git. Las copias publicadas son MP3 estéreo de 128 kbit/s, sin carátulas ni metadatos extra y con sonoridad equilibrada entre canciones. Su duración se conserva: 2:27, 2:21 y 3:10, respectivamente.
