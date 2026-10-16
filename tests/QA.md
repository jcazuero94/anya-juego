# Verificación de la aventura del jardín

La lógica se verifica con `npm test` (27 pruebas). La sintaxis de todos los módulos se revisa con `npm run check`. La interfaz se comprueba en el navegador con acciones sobre sus controles reales.

Revisión del 16 de octubre de 2026: completados los 18 retos y la receta final mediante controles de la interfaz; comprobados los tres actos, la derrota al noveno error, el campamento, la recarga con progreso conservado, las caricias, el olfateo, la recogida y el gasto de tres estrellas, la bitácora, el minimapa, el borrado de letras y la recuperación de una receta equivocada. Revisados el jardín y los retos a 390 y 320 píxeles, sin desbordamiento horizontal ni errores de consola. Las pruebas de rutas verifican todos los destinos con cada tamaño de Alessandro.

## Recorrido de revisión

1. Entrar al jardín y cerrar la introducción. Anya y Pandora aparecen en un mundo explorable.
2. Caminar con los botones, tocar el suelo o el minimapa y comprobar que la cámara acompaña a Anya. Los senderos rodean el estanque, los árboles y los huertos.
3. Pedir a Pandora que busque. Seguirla hasta una estrella y comprobar el inventario y la bitácora. Tres estrellas permiten calmar dos estirones; no se pueden gastar dos veces.
4. Elegir retos en el mapa o usar la sugerencia de la misión. Anya recorre la ruta y el reto se abre al llegar.
5. Completar los tres retos de una zona: debe aparecer su ingrediente, disminuir un estirón y abrirse nuevas zonas. Los retos terminados quedan marcados y florecen en el mundo.
6. Recargar, continuar y comprobar la semilla, la posición aproximada, los ingredientes y las estrellas. La misma partida conserva sus retos.
7. Jugar los doce tipos de reto. Probar una pista de cartas, una equivocación, borrar una letra, repasar una secuencia, reflejar un patrón y atravesar un laberinto.
8. Provocar nueve errores y volver al campamento. Se conservan las estrellas y los ingredientes del último campamento; los retos posteriores vuelven a estar pendientes.
9. Completar los 18 retos, volver a Alessandro y resolver la receta de seis símbolos. Debe aparecer la felicitación y una nueva aventura debe tener otros retos.
10. Revisar el mapa, la bitácora, la ayuda, la pausa y el sonido en escritorio y en pantallas de 390 y 320 píxeles. No debe haber desbordamiento horizontal, imágenes faltantes ni errores de consola.

## Publicación

Después del despliegue, comparar los archivos publicados con los locales y probar una jugada desde la URL pública. Los módulos y estilos de esta versión usan `?v=2` para evitar mezclas con los recursos de la primera edición.

Las fotos originales de `Fotos/` no forman parte del repositorio ni del sitio.
