# Anya y el hechizo estirón

Una aventura de exploración creada para los ocho años de Anya. Alessandro sopló una vela mágica y pidió crecer: ahora Anya y Pandora deben recorrer el jardín y preparar una poción para que vuelva a la fiesta.

**[Entrar al jardín](https://jcazuero94.github.io/anya-juego/)**

## Un jardín para jugar

- Anya camina por un mundo de 2400 × 1600 con seis zonas, senderos, árboles, un estanque, un huerto, mariposas y un observatorio. Pandora la sigue, busca tesoros y recibe caricias.
- Se puede caminar con flechas, WASD, botones en pantalla o tocando el suelo. El mapa permite elegir un reto: Anya camina hasta él rodeando obstáculos. También hay un minimapa y controles de zoom.
- Dieciocho retos principales, distribuidos entre doce tipos: sumas, restas y grupos; patrones numéricos y visuales; parejas; observación; palabras; acertijos; cuidado; ordenar números; comparaciones; secuencias; simetría y laberintos.
- Las palabras, cantidades, operaciones, cartas, secuencias, preguntas, dibujos y laberintos cambian con cada aventura. La misma partida mantiene sus retos al cerrar y volver a abrir el navegador.
- Cada zona aporta un ingrediente al resolver sus tres retos. Nuevos rincones se despiertan a medida que se avanza. Hay tres actos de historia y una receta final con los seis ingredientes.
- Ocho estrellas opcionales esconden pequeñas historias para la bitácora. Pandora puede olfatearlas; tres estrellas calman dos estirones. Explorar todos los rincones, encontrar los secretos y cuidar a Pandora aporta insignias.

## El hechizo y las pausas

Cada error suma un estirón. Alessandro ocupa progresivamente más espacio en el sendero central; después aparece brisa y caminar se vuelve un poco más lento. Completar una zona reduce un estirón y guarda un campamento. Al llegar a nueve se pierde esa partida, con la opción de volver al último campamento conservando las estrellas y los ingredientes de ese punto.

No hay reloj ni castigo por pedir pistas. Los setos del laberinto no penalizan los intentos. El progreso se guarda automáticamente en el navegador. Hay pausas voluntarias, recordatorios después de seis retos e invitación a celebrar fuera de la pantalla. No hay anuncios, compras, cuentas, formularios ni rastreadores.

El humor trata de un hechizo ficticio: crecer en la vida real está bien.

## Ejecutar y verificar

Se necesita Node.js 20 o posterior, sin instalar dependencias:

```sh
npm start
```

Abrir `http://127.0.0.1:4173`. El servidor local solo sirve para desarrollo; GitHub Pages publica archivos estáticos, sin backend.

```sh
npm run check
npm test
```

Las 27 pruebas cubren variedad de retos, partidas reproducibles, progresión, victoria, derrota, campamentos, guardado dañado, estrellas, movimiento, colisiones y rutas hacia todos los objetivos con los distintos tamaños de Alessandro. La revisión de interfaz se documenta en [tests/QA.md](tests/QA.md).

## Archivos

- `docs/game.js`: historia, interfaz, inventario, mapa, bitácora y guardado.
- `docs/world.js`: mundo Canvas, cámara, personajes, controles y exploración.
- `docs/map.js`: geometría, colisiones, búsqueda de rutas y movimiento.
- `docs/logic.js`: progresión, generación de retos y validación del guardado.
- `docs/questions.js`: banco de palabras, acertijos y decisiones de cuidado.
- `docs/puzzles.js`: los doce tipos de retos y la receta final.
- `docs/icons.js`: ilustraciones e iconos compartidos.
- `docs/styles.css` y `docs/adventure.css`: diseño adaptable, controles y movimiento reducido.

## Publicación y privacidad

GitHub Pages publica `main`, carpeta `/docs`. No hay compilación, dependencias de producción ni claves secretas. Los recursos se sirven desde el mismo sitio y la aplicación no llama a servicios externos durante el juego.

Solo el navegador guarda la semilla de la aventura, sus avances y el número de victorias. Bloquear el almacenamiento no impide jugar, aunque no permite retomar al cerrar la página. La versión anterior del juego conserva su contador de victorias.

Las fotos de referencia permanecen en la carpeta local `Fotos/`, excluida de Git. Solo se publican las ilustraciones creadas para este regalo. Sus prompts están en [design/characters.md](design/characters.md).

Nunito se distribuye con su [licencia SIL Open Font License](docs/assets/fonts/OFL.txt). Las ilustraciones de los personajes se crearon con ImageGen a partir de referencias suministradas para este regalo; el mundo del jardín se dibuja con código Canvas.
