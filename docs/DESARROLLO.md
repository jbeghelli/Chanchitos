# Guía de desarrollo

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` | Pantallas (HTML) y todos los estilos. |
| `data.js` | **Todo el contenido**: fuentes (`SRC`), 10 bichos (`BUGS`), 10 niveles (`LEVELS`), datos curiosos (`FACTS`). |
| `art.js` | Dibujo vectorial de los bichos y del copihue; íconos de mochila (`Art.icon`). |
| `core.js` | Guardado por niño, selector de niño y opciones, sonido, voz, datos y avisos, navegación, selector de nivel, Bichopedia, recorte de la foto. |
| `runner.js` | La carrera: físicas, obstáculos, niveles, meta, premios, resultados. |
| `terrario.js` | Simulación del terrario y sus interacciones. |
| `boot.js` | Arranque y menú. |
| `sw.js`, `manifest.webmanifest`, `icons/` | App instalable (PWA) y modo sin conexión. |
| `tools/generar-docs.js` | Genera `docs/BICHOS.md` y `docs/FUENTES.md` desde `data.js`. |

Orden de carga: `data.js` → `art.js` → `core.js` → `runner.js` → `terrario.js` → `boot.js`. Sin dependencias ni compilación.

## Probar

```bash
python3 -m http.server 8000    # dentro de la carpeta del juego
# abrir http://localhost:8000 (en el celular: la IP del computador)
```

Para probar la cámara y la instalación como app hace falta `https` (por ejemplo GitHub Pages). Atajos útiles desde la consola del navegador:

```js
giveBug('pollito', 1); G.save.level = 10; persist();   // ganar un bicho y desbloquear niveles
Terr.step(60);                                          // avanzar 60 s la simulación (con el terrario abierto)
```

Las pruebas automáticas que se hicieron durante el desarrollo usaron Playwright (Chromium) simulando un celular: flujo completo de un nivel, colocar bichos, simulación larga con los 10 bichos, selector de niños, borrado, migración de guardados antiguos.

## Cómo agregar un bicho (checklist)

1. **`data.js` → `SRC`:** agrega las fuentes (título + URL).
2. **`data.js` → `BUGS`:** agrega el bicho con sus parámetros `sim` (ver el comentario sobre `sim` arriba de `BUGS`).
3. **`data.js` → `LEVELS`:** agrega su nivel (o reemplaza uno) con escenario y paleta.
4. **`data.js` → `FACTS`:** 4 datos con ids `<id>1` … `<id>4` (los dos primeros se desbloquean al ganarlo).
5. **`art.js`:** escribe su función de dibujo, regístrala en `DRAW`.
6. **`terrario.js`:** si tiene una interacción nueva, agrégala en `think()`, `consume()` o `stepMove()` y desbloquea su dato con `unlockFact('<id>3')`.
7. **`tools/generar-docs.js`:** agrega sus notas de confianza (`NOTES`) y su descripción (`INTERACT`), y ejecuta `node tools/generar-docs.js`.
8. Sube el número de versión (`?v=N` en `index.html`, y `CACHE` y `FILES` en `sw.js`).

## Versionado y caché

Los scripts se cargan con `?v=N` y el service worker (`sw.js`) pide siempre la red primero (`cache: 'no-cache'`) y guarda copia para el modo sin conexión. Al publicar una versión nueva: sube `N` en `index.html` y en `sw.js`, y cambia `CACHE`.

## Convenciones

- Español en toda la interfaz y los comentarios; tuteo.
- Los números del terrario (velocidades, tasas) están en `data.js` (`sim`) y en las constantes del inicio de `terrario.js`.
- Los datos curiosos se escriben simples para niños de 4 a 8 años y se pueden leer en voz alta; toda afirmación debe tener respaldo en `SRC` o quedar anotada como «por verificar» en `tools/generar-docs.js`.
