# Chanchitos de tierra 🐛

Juego web para niños de 4 a 8 años sobre el chanchito de tierra (*Armadillidium vulgare*). Abre `index.html` (o publícalo con GitHub Pages: `/chanchitos/`). No necesita instalación ni internet.

## Dos partes
1. **¡A correr!** — Niveles al estilo Mario: cada nivel tiene un largo fijo y termina en una **bandera 🏁**. El nivel 1 dura cerca de 1 minuto y medio y se va poniendo más difícil (piedras, suelo seco, pájaros, arañas y combinaciones). Hay una bandera 🚩 en la mitad (si te caes, sigues desde ahí) y corazones para recuperar vidas. **Cada nivel completado da 1 chanchito** para la **mochila** (estilo Minecraft). Los chanchitos que se juntan por el camino cargan el poder (cada 5). Controles: **toca la pantalla para saltar**, **mantén apretado para agacharte** y usa el botón pequeño 💧 para el **poder**. En computador: Espacio/↑ salta, ↓ se agacha, X poder. En el camino también hay hojas, zanahorias, cáscaras de huevo, cortezas, ramas, palitos, piedras y piñas.
2. **Mi terrario** (pantalla vertical, vista desde arriba) — Empieza **vacío**. La mochila de abajo tiene casillas: elige un chanchito o un objeto y toca la tierra para ponerlo. Así se construye de a poco. La esponja 🧽 guarda de vuelta en la mochila los chanchitos, cortezas y adornos. También hay rociador, luz, ventilación y consejero. Toca un chanchito para ver cómo está (se hace bolita).

## Varios niños y opciones ⚙️
Al abrir el juego aparece **¿Quién juega?**: cada niño tiene su foto, su mochila, su terrario, sus datos descubiertos y su nivel. Se cambia de niño con el saludo del menú. En **Opciones · Borrar** se puede borrar a un niño o **borrar todo** (con confirmación). Todo se guarda solo en el aparato.

## Mi cara 📸
En **Mi cara** se sube una foto (cámara o galería), se centra y se agranda, y pasa a ser la cara del personaje (estilo recortable con gorro que rebota). La foto **solo se guarda en el aparato** (localStorage), no se envía a ningún servidor.

## Lo que se aprende (todo está en el juego)
Branquias y humedad, cinesis (corren si hay sequedad), nocturnos y escondites, agrupación, comida y moho, calcio, muda en dos mitades, marsupio y mancas, temperatura 18–27 °C, luz, depredadores, cobre y coprofagia, y más. 25 datos en la **Chanciclopedia**, con botón 🔊 para leerlos en voz alta.

Fuentes: UF/IFAS EDIS (EENY630), BioKIDS (U. de Michigan), scaber.org, ZooKeys 176 (agregación), revisión SciELO sobre cobre en isópodos y guías de cuidado de isópodos. Las cifras del juego (tiempos, ritmos) están aceleradas para jugar.

## Archivos
`index.html` (pantallas y estilos) · `core.js` (guardado, sonido, voz, datos, foto) · `runner.js` (corredor) · `terrario.js` (simulación del terrario) · `boot.js`.

## Publicar y jugar en el celular
GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `/ (root)`). Luego abre la dirección en el celular y usa *Añadir a pantalla de inicio* (iPhone: Safari → Compartir; Android: Chrome ⋮ → Instalar aplicación). Al publicar cambios, sube la versión de `CACHE` en `sw.js`.
