# Diseño del juego

**Bichos de Chile** es un juego web para niños de 4 a 8 años. Dos partes que se alimentan entre sí:

1. **Carrera por niveles** (estilo Mario): el niño avanza solo, salta, se agacha y lanza un poder. Al llegar a la meta gana **el bicho de ese nivel**.
2. **Terrario vertical**: el niño pone los bichos que ganó, los cuida (humedad, comida, luz, escondites) y mira cómo **interactúan** entre ellos.

La idea educativa: aprender qué necesita cada bicho y cómo se relacionan (quién come a quién, quién poliniza, quién se asusta).

## Flujo

```
¿Quién juega?  →  Menú  ─┬─ A correr → elegir nivel → nivel → meta → premio (bicho) → terrario
(varios niños)           ├─ Mi terrario (mochila + sim)
                         ├─ Mi cara (foto del niño)
                         └─ Bichopedia (fichas + fuentes)
```

- Cada niño tiene su propio guardado (foto, mochila, terrario, nivel, datos descubiertos).
- Los niveles se desbloquean en orden (1 a 10). Los ya completados se pueden repetir: cada repetición da **otro** bicho de la especie (así se arma una población, de a poco).

## Controles (celular)

| Acción | Gesto |
|---|---|
| Saltar | Tocar la pantalla (se salta al **soltar** si el toque dura menos de 0,17 s) |
| Agacharse | Mantener apretado (se levanta al soltar) |
| Poder | Botón pequeño 💧 abajo a la derecha |

Teclado: Espacio/↑ saltar · ↓ agacharse · X/Z/Enter poder · P/Esc pausa.

## La carrera

- **Qué se recoge:** flores de **copihue** (flor nacional de Chile). No son bichos. Cada 5 cargan una carga de poder (máx. 3). Al final de la carrera, **cada 10 copihues = 1 flor** para la mochila (sirve de néctar para moscardón y mariposa).
- **Regalos en el camino:** hojas, zanahoria, cáscara de huevo (calcio), corteza, rama, palito, piedra y piña.
- **Obstáculos:** piedra (saltar), suelo seco (saltar; mide 60 unidades y su zona de choque es más angosta), pájaro (agacharse), lagartija (saltar o poder). Hay combinaciones (dos piedras, lagartija+piedra, suelo+pájaro, pájaro+lagartija, piedra+pájaro+piedra) cuya separación garantiza que siempre se puedan superar.
- **Vidas:** 3 corazones (1,6 s de invulnerabilidad al chocar). Aparece un corazón extra al 25 %, 50 % y 75 % del nivel si faltan vidas.
- **Meta:** bandera 🏁. A la mitad hay una bandera 🚩 (checkpoint): si pierdes las vidas, puedes seguir desde ahí.
- **Dificultad:** `d = 0,6·progreso + min(0,4; 0,1·(nivel−1))`. El nivel 1 empieza tranquilo (solo piedras, filas de copihues y regalos hasta el 10 %). Los patrones más duros se agregan cuando `d > 0,25` y `d > 0,4`. La velocidad sube de 170 a 290 unidades/s: `170 + 12·(nivel−1) + 40·progreso`.
- **Largo de los niveles:** 400 m (nivel 1) +50 m por nivel hasta 850 m. A ~190 unidades/s, el nivel 1 dura cerca de 1 minuto y medio.

### Niveles

| N.º | Bicho (premio) | Escenario | Largo | Decorado |
|---|---|---|---|---|
| 1 | Chanchito de tierra | Jardín de la casa | 400 m | árboles |
| 2 | Pololo verde | Noche de primavera | 450 m | árboles de noche, luna y estrellas |
| 3 | Chinita | El huerto | 500 m | arbustos con florcitas |
| 4 | Tijereta | Bajo las piedras | 550 m | rocas |
| 5 | Araña pollito | Matorral del norte | 600 m | cactus, tonos de desierto |
| 6 | Moscardón | Bosque del sur | 650 m | pinos |
| 7 | Chinchemolle | Cerro andino | 700 m | rocas de cordillera |
| 8 | Mariposa del chagual | Quebrada de chaguales | 750 m | chaguales |
| 9 | Libélula | Laguna | 800 m | totoras y agua |
| 10 | Grillo de campo | Tarde de verano | 850 m | arbustos, luz dorada |

(Los datos están en `LEVELS` de `data.js`.)

## El terrario

Vista desde arriba, mundo de 360×620 unidades, caja de vidrio. **Capacidad:** 60 bichos + 9 por corteza + 1 por adorno, máximo 150 (antes era 22).

### Mochila (estilo Minecraft)

Una fila de casillas con cantidad: primero los bichos ganados (con su ícono dibujado), luego hoja, verdura, calcio, flor, corteza, rama, palito, piedra y piña. Se elige una casilla y se toca la tierra para poner. La **esponja** guarda de vuelta en la mochila los bichos, cortezas, adornos y flores; la comida se tira.

Inventario libre que se repone solo mientras se mira el terrario: 1 hoja cada 45 s (hasta 6), 1 verdura cada 90 s (hasta 3), 1 calcio cada 120 s (hasta 3).

### Ambiente

| Variable | Modelo |
|---|---|
| Día y noche | 90 s por día; día de 0 a 0,58 (con amaneceres suaves), noche 0,62 a 1. El juego empieza de noche. |
| Humedad | Grilla 12×20 por zona. Evaporación base 0,13/s, más con calor, lámpara y ventilación, menos con musgo. Se difunde entre zonas. El rociador suma ~10 por toque en un radio de ~72. |
| Temperatura | 17,5 °C de noche a 23,5 °C de día, +4 con lámpara, +6 en ola de calor, −1,5 al ventilar. |
| Luz | Lámpara con radio 165: seca, calienta, hace crecer musgo y atrae pololos. |
| Musgo | Crece con lámpara y humedad > 45 %; reduce la evaporación hasta 35 %. |
| Moho | Verduras y hojas viejas en zona húmeda; se reduce ventilando, con la esponja o con chanchitos. |
| Olas de calor | Cada 5 a 8 días, duran ~0,9 día. |

### Necesidades de cada bicho

Hidratación (según la humedad de la zona donde está), hambre, salud, y calcio solo para el chanchito. Cada especie tiene sus propios rangos (ver `sim` en `data.js` y `docs/BICHOS.md`). Si la salud llega a 0 el bicho «se fue a descansar» y un cartel explica por qué (sed, hambre, calor, frío, agua, luz, calcio, moho o vejez). Vejez: 70–110 días de juego (chanchito) hasta 200–300 (araña pollito). Un día de juego = 90 s.

Cuando el niño no está jugando el tiempo del terrario **se detiene**; al volver se simula un avance suave de hasta 10 minutos que no mata a nadie.

### Interacciones entre bichos

Reglas: **nadie mata a otro bicho del niño**. Los cazadores cazan «presas» (moscas y pulgones) que aparecen solas, o asustan.

| Interacción | Quién | Cómo funciona |
|---|---|---|
| Limpieza | Chanchito | Come moho (reduce el moho de un objeto sin perder salud) y restos. |
| Pulgones | Chinita (y tijereta) | Cada ~28 s pueden aparecer colonias en flores o musgo (máx. 4). Crecen; con ≥ 2 dañan la flor o el musgo. La chinita las come. Sin flores ni musgo no aparecen. |
| Moscas | Libélula y araña pollito | Aparecen (máx. 5) cuando hay comida vieja o al azar. La libélula las persigue por todo el terrario a gran velocidad; la araña pollito solo las caza dentro de 90 unidades. |
| Polinización | Moscardón y mariposa | Toman néctar de las flores (cada flor dura ~200 s por visitante). Cada 4 s de visita suman polen; con 2 de polen nace una flor nueva cerca (hasta 8 flores). |
| Susto | Araña pollito → todos | Los bichos que asusta (con `fear`) a menos de 70 unidades: el chanchito se hace bolita, la chinita se queda quieta, los demás huyen. |
| Olor | Chinchemolle | Suelta olor (3 s) si la araña pollito está a menos de 55 unidades o si el niño lo toca con la lupa. |
| Luz | Pololo / otros | El pololo orbita la lámpara de noche. Chanchito, tijereta y chinchemolle evitan la zona iluminada. |
| Canto | Grillo | De noche emite ♪ cada 4 s a 15 °C hasta cada 1,4 s a 24 °C o más. |
| Percha | Libélula | Reposa en ramas y palitos. |
| Camuflaje | Chinchemolle | Se ve más tenue a menos de 22 unidades de una rama o palito. |
| Agrupación | Chanchito, tijereta | Se juntan y se frenan al tocarse o tocar un objeto (tigmocinesis). |
| Reproducción | Solo chanchito | Hembra adulta con buenas condiciones: tras ~75 s libera 1 a 4 crías (mancas). Los demás no se reproducen. |

### Consejero

Un globo arriba lee la situación y propone qué hacer (con botón 🔊 para leerlo en voz alta): sin escondites, calor, mucha agua, sed, hambre de una especie concreta (dice qué le falta), calcio, moho, bichos por poner…

## Datos curiosos y la Bichopedia

- 63 datos en `FACTS` (`data.js`). Cada uno pertenece a un bicho (`bug`) o a «general».
- Los **2 primeros** de cada bicho se desbloquean al ganarlo. Los demás aparecen al verlos en acción en el terrario (por ejemplo, `chinita3` cuando la chinita come un pulgón, `moscardon3` cuando nace una flor).
- Los descubiertos durante una carrera se muestran **al final**, para no interrumpir el juego.
- Cada ficha enlaza sus fuentes. Todo se puede escuchar con el botón 🔊 (voz del dispositivo).

## Guardado

Todo en `localStorage` del navegador (clave `chanchitos_v3`), nada sale del dispositivo. Estructura:

```
{ kids: [ { id, name, faceURL (JPEG 160 px), inv:{hoja, verdura, calcio, flor, corteza, rama, palito, piedra, pina},
            bichos:{especie: cantidad}, found:{especie:true}, done:{nivel:true}, level (1–10),
            facts:{id: fecha}, colony:{t, hum[], items[], bugs[], moss, ...}, sexN, best, runs, rescued, lastSeen, v:4 } ],
  cur, muted }
```

Migración automática desde las versiones anteriores («solo chanchitos»): se conserva nombre, foto, datos y nivel; los niveles ya pasados entregan su bicho.

## Limitaciones conocidas

- Solo el chanchito se reproduce; los demás bichos no.
- No hay etapas de huevo, larva o ninfa (la mariposa y la libélula se ven siempre adultas).
- No hay agua en el terrario más que como humedad del suelo.
- Los colores de la mariposa del chagual y algunas formas son aproximaciones (ver `docs/BICHOS.md`).
- Probado con Chromium (Playwright) a 390×844 y 844×390. **No** se ha probado en un celular real ni con niños.
