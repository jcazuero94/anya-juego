# Anya y el hechizo estirón

Un regalo para los 8 años de Anya: una aventura ilustrada con Anya, su hermano Alessandro y Pandora. Un hechizo hace crecer a Alessandro; hay que reunir seis ingredientes y preparar la poción antiestirón para que pueda volver a la fiesta.

**[Jugar en GitHub Pages](https://jcazuero94.github.io/anya-juego/)**

## La aventura

1. Sumar dos grupos de flores.
2. Descubrir la regla de un camino de números.
3. Encontrar tres parejas de cartas.
4. Elegir cómo cuidar a los animales y al jardín.
5. Ordenar las letras de EQUIPO.
6. Recordar la receta de una poción mágica.

Cada error añade un estirón. Al quinto, la magia gana esa partida y se puede volver a intentar. Cada reto ofrece una pista de Pandora. Las sumas, los patrones, las cartas, las preguntas y la receta varían entre partidas.

Sin reloj, anuncios, compras, cuentas, formularios, rastreadores ni conexión a servicios externos durante el juego. El sonido se activa de forma voluntaria. Hay una pausa a mitad de la aventura y una invitación a celebrar fuera de la pantalla al terminar. El humor se refiere a un hechizo ficticio: crecer en la vida real está bien.

## Ejecutar en local

Se necesita Node.js 20 o posterior, sin instalar dependencias:

```sh
npm start
```

Abrir `http://127.0.0.1:4173`. El servidor local es solo una herramienta de desarrollo. Todo el juego está en `docs/` y se publica como archivos estáticos, sin backend.

```sh
npm run check
npm test
```

Las pruebas cubren reglas, progresión, victoria, derrota, reinicio, generación de sumas y patrones, parejas y receta. La comprobación de interfaz se describe en [tests/QA.md](tests/QA.md).

## Publicación

GitHub Pages publica la rama `main`, carpeta `/docs`. Los cambios a esa carpeta se publican automáticamente al actualizar `main`. No hay compilación ni variables secretas. Se incluye `.nojekyll`.

## Archivos

- `docs/index.html`: estructura accesible y diálogos.
- `docs/styles.css`: diseño adaptable y movimiento reducido.
- `docs/game.js`: interfaz, minijuegos, pistas y sonido local.
- `docs/logic.js`: reglas y generación de retos, sin dependencias del navegador.
- `docs/assets/`: ilustraciones, jardín vectorial y fuente local.
- `design/characters.md`: origen y prompts de las ilustraciones.

Las fotos de referencia permanecen en la carpeta local `Fotos/`, excluida de Git. Solo se publican las ilustraciones creadas para el juego. No se guardan fotografías, nombres de usuario ni partidas; únicamente el número de victorias en el almacenamiento del navegador. Bloquear ese almacenamiento no impide jugar.

Nunito, de Vernon Adams, Jacques Le Bailly y Cyreal, se distribuye con su [licencia SIL Open Font License](docs/assets/fonts/OFL.txt). Las ilustraciones son personajes originales creados con ImageGen a partir de referencias suministradas para este regalo.
