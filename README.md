# Anya y el deseo de las ocho velas

Un juego de cumpleaños creado para los ocho años de Anya. Alessandro está atrapado en casa por un hechizo que lo hace crecer. Anya y Pandora recorren el jardín para reunir ocho velas y los ingredientes del pastel. Alyssia hornea; Anya sopla y pide el deseo que salva a su hermano.

**[Jugar la aventura](https://jcazuero94.github.io/anya-juego/)**

## La misión

- Ocho estaciones abiertas desde el principio. Cada una tiene tres niveles consecutivos: fácil → una vela, medio → un ingrediente, difícil → un regalo.
- Para ganar bastan **ocho velas, harina, huevos y leche**: once retos. Los otros cinco ingredientes y los ocho regalos son opcionales. Cacao, azúcar, fresas y vainilla cambian detalles del pastel.
- Alyssia espera en el centro, indica qué falta, recomienda el próximo objetivo necesario y hornea el pastel. Anya elige su deseo y pulsa el botón para soplar las ocho velas.
- Una introducción animada en tres escenas explica la historia antes de iniciar el reloj. La victoria reúne a los cuatro personajes; en la derrota el tejado y las paredes se abren por el estirón.

## Explorar y aprender

Anya camina por un jardín de 2400 × 1600 con senderos, árboles, estanque, huerto, mariposas y observatorio. Pandora la sigue, recibe caricias y olfatea ocho estrellas secretas para el álbum. Se camina con flechas, WASD, botones táctiles o tocando el suelo. El mapa permite elegir estación y premio; las rutas rodean obstáculos. Incluye minimapa y zoom.

Doce minijuegos: cuentas, ordenar números, balanzas, observación, parejas, secuencias, palabras, acertijos, patrones, simetría, laberintos y decisiones de cuidado. Cada estación rota sus tres tipos entre partidas. Números, cartas, palabras, dibujos y caminos también cambian. La dificultad escala con el nivel: más parejas, secuencias y caminos más largos, palabras mayores, sumas/restas y luego grupos. Una semilla conserva los mismos retos al retomar la partida.

## Tiempo y descansos

**Veinte minutos de juego activo. Alessandro crece cada dos minutos.** El reloj continúa en retos, mapa, ayuda, álbum y durante la preparación del pastel. Llegar a 20:00 sin soplar provoca la derrota, incluso con todos los materiales. Los errores y las pistas no añaden estirones ni descuentan tiempo adicional.

Pausar, ocultar la pestaña o salir detiene el reloj. Al volver a una pestaña oculta se pide reanudar; al volver a abrir la página se conserva el tiempo restante. La intro no consume tiempo. El progreso y el tiempo se guardan en este navegador. Otra aventura reinicia los premios y da veinte minutos con nuevos retos.

No hay anuncios, compras, cuentas, formularios ni rastreadores. El humor trata de un hechizo ficticio: crecer en la vida real está bien.

## Desarrollo y verificación

Node.js 20 o posterior, sin instalar dependencias:

```sh
npm start
npm run check
npm test
```

Abrir `http://127.0.0.1:4173`. El servidor es únicamente de desarrollo. GitHub Pages sirve los archivos estáticos de `/docs`, sin backend.

Las 33 pruebas cubren premios secuenciales, victoria mínima, materiales obligatorios, guía, límites exactos del reloj, pausas, derrota y victoria, variedad y dificultad, guardado y rutas. El protocolo de navegador está en [tests/QA.md](tests/QA.md).

Para revisar los límites temporales sin esperar veinte minutos:

```sh
npm run start:qa
```

Abrir `http://127.0.0.1:4173/__qa__`. El panel prepara partidas locales próximas al primer estirón o la derrota. Solo se sirve con `--qa`; **no existe en el sitio público**, y sustituye la partida de prueba local.

## Código y recursos

- `docs/game.js`: historia, interfaz, reloj, premios, Alyssia, pastel, deseo, mapa y álbum.
- `docs/logic.js`: progresión, reloj de juego, retos reproducibles y guardado validado.
- `docs/world.js`, `docs/map.js`: Canvas, cámara, personajes, movimiento, colisiones y rutas.
- `docs/puzzles.js`, `docs/questions.js`: minijuegos, pistas y bancos de lectura.
- `docs/icons.js`: dibujos de velas, ingredientes y otros iconos.
- `docs/styles.css`, `docs/adventure.css`, `docs/birthday.css`: diseño adaptable y animaciones con movimiento reducido.

## Publicación y privacidad

GitHub Pages publica `main`, carpeta `/docs`. No hay compilación, dependencias de producción, claves ni llamadas a servicios externos durante el juego. Los datos se guardan en el navegador; si se bloquea el almacenamiento se puede jugar sin retomar después. La versión 3 inicia una misión nueva y conserva el contador de victorias anterior.

Las fotos de referencia permanecen en `Fotos/`, excluida de Git. Solo se publican las cuatro ilustraciones creadas para este regalo. Los prompts están en [design/characters.md](design/characters.md). Nunito se distribuye con su [licencia SIL Open Font License](docs/assets/fonts/OFL.txt).
