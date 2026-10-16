# Comprobación de interfaz

Verificación del 16 de octubre de 2026: partida completa hasta victoria, derrota al quinto error, reinicio, pistas, parejas, borrado de letras, recuperación de receta, pausa, ayuda y sonido comprobados en navegador. Pantallas de 390 × 844, 320 × 740 y escritorio revisadas. Sin imágenes faltantes ni errores de consola. Se corrigieron el nombre accesible de la ayuda y el desbordamiento horizontal en pantallas estrechas.

Abrir el juego desde `npm start` o desde su URL pública. Todas las interacciones se realizan con botones; no se necesita teclado físico.

## Partida completa

- Inicio: se ven los tres personajes y el botón de aventura.
- Sumas: una respuesta equivocada añade un solo estirón; queda deshabilitada. La pista permite contar ambos grupos. La respuesta correcta consigue el primer ingrediente.
- Patrones: la respuesta correcta sigue el incremento constante de las cuatro piedras.
- Memoria: la pista revela las seis cartas temporalmente sin añadir estirones. Una pareja se conserva y no se puede volver a seleccionar. Dos cartas diferentes se ocultan tras la respuesta y añaden un estirón. Tres parejas permiten continuar.
- Cuidado: exactamente una de las tres respuestas consigue el ingrediente. La explicación confirma el gesto de cuidado.
- Palabras: se puede seleccionar una letra y borrarla. Comprobar solo se habilita con seis letras. EQUIPO supera el reto.
- Receta: se estudia sin límite de tiempo. Se puede volver a consultar. Un error añade un estirón y muestra de nuevo la receta. La secuencia correcta consigue el sexto ingrediente.
- Final: romper el hechizo muestra la felicitación para Anya y a Alessandro de su tamaño normal. Volver a jugar reinicia todos los ingredientes y el estirón.

## Derrota y controles

- Reunir cinco errores a lo largo de la partida muestra el final de derrota, sin más acciones sobre retos anteriores.
- Volver a intentarlo abre una partida nueva con cero errores.
- Pausar abre un diálogo y conserva la partida. Seguir jugando la reanuda. Volver al inicio permite empezar desde cero.
- Cómo jugar se cierra con su botón o Escape. Tab y Enter permiten jugar; los encabezados reciben el foco al cambiar de reto.
- El sonido comienza apagado, puede activarse y desactivarse. Cambiar de pestaña pausa la partida.

## Pantallas y recursos

- Revisar a 390 × 844, 320 × 740 y en escritorio; no debe haber desplazamiento horizontal ni controles cortados.
- Comprobar imágenes y fuente local, sin recursos faltantes ni errores de JavaScript.
- Comprobar que `prefers-reduced-motion: reduce` elimina las animaciones y el confeti.
- Bloquear el almacenamiento local no impide completar el juego.

Pruebas de lógica reproducibles: `npm test` (14 casos).
