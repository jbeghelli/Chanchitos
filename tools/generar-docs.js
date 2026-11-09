#!/usr/bin/env node
'use strict';
/* Genera docs/BICHOS.md y docs/FUENTES.md a partir de data.js (fuente única de la verdad).
   Uso:  node tools/generar-docs.js
   Las notas de confianza y las interacciones están escritas a mano abajo: si cambias un dato
   en data.js, revisa también su nota. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8') + '\n;({ SRC, BUGS, LEVELS, FACTS })';
const { SRC, BUGS, LEVELS, FACTS } = vm.runInNewContext(code);

/* Nivel de confianza de cada afirmación. ✔ = respaldada por una fuente consultada; ◐ = fuente divulgativa o parcial; ✖ = conocimiento general, por verificar. */
const NOTES = {
  chanchito: [
    '✔ Es un crustáceo (no un insecto), mide hasta ~18 mm, la hembra lleva los huevos en el marsupio y las crías mudan el primer día (UF/IFAS, BioKIDS).',
    '✔ Se agrupan: reduce pérdida de agua y da protección (ZooKeys 176, scaber.org). Respiran con estructuras derivadas de branquias que deben estar húmedas.',
    '✔ Muda en dos mitades, primero la de atrás (estudio en isópodos terrestres). Que coman su muda está documentado en algunas especies y en otras no: en el juego se muestra solo como «a veces».',
    '◐ Comer su propia caquita para recuperar cobre es una explicación respaldada por una revisión científica, pero sigue siendo una hipótesis («los científicos creen»).',
    '◐ Longevidad de 2 a 5 años (UF/IFAS) vs. ~1,5 a 2 años en vida silvestre (BioKIDS): las fuentes difieren.',
    '✖ El nombre «chanchito de tierra» y su presencia en Chile son de conocimiento general; es una especie introducida de origen europeo.'
  ],
  pololo: [
    '✔ Nativo; 14–18 mm; verde brillante; de Coquimbo a Los Lagos; coincide con bosques de Nothofagus (Plazi, Wikipedia).',
    '✔ En la zona central los adultos vuelan en octubre–noviembre; el ciclo dura un año; las larvas («gusano blanco») comen raíces de pastos y cereales (INIA vía Portal Frutícola).',
    '◐ Atracción por la luz: las fuentes consultadas mencionan que las trampas de luz capturan adultos, sin entregar cifras. Es un comportamiento muy conocido en escarabajos, y en el juego lo usamos como mecánica (vuela hacia la lámpara de noche).',
    '✖ Que los adultos coman «follaje» es consistente con su asociación a Nothofagus, pero la dieta adulta exacta no quedó verificada en las fuentes consultadas.',
    '✖ «Pololo» como apodo de pareja en Chile no se menciona en el juego (no verificado).'
  ],
  chinita: [
    '✔ En Chile hay ~120 especies de chinitas, la mayoría nativas (nota de la U. de Chile sobre su guía de 25 especies; la página no se pudo abrir directamente desde el entorno de trabajo, el dato proviene del resumen de búsqueda).',
    '✔ Eriopis connexa es nativa y depredadora de pulgones; su consumo de pulgones aumenta con la edad (Rev. Chilena de Entomología 2025).',
    '✔ La introducción de Hippodamia variegata en los años 70 se asocia a la baja de E. connexa; los autores señalan que las interacciones medidas en laboratorio no explican del todo el cambio (Grez, Viera y Soares 2012).',
    '◐ Insecticidas como metamidofos y dimetoato fueron los más tóxicos para E. connexa en una tesis de la U. de Chile (2005): en el juego se simplifica a «los insecticidas fuertes también las matan» (no incluido como dato).',
    '✖ Los tamaños no se verificaron: por eso el juego solo dice «muy pequeña».'
  ],
  tijereta: [
    '✔ Introducida (europea), omnívora, nocturna/crepuscular, se refugia de día bajo materia orgánica, piedras y hojarasca; gregaria; cercos usados para abrir alas, capturar presas y defenderse (INIA vía Portal Frutícola).',
    '✔ Cuidado maternal intenso, con regurgitación de alimento a las ninfas (Staerkle y Kölliker 2008).',
    '✖ El tamaño no se verificó: el juego solo dice «pequeña».'
  ],
  pollito: [
    '✔ Come invertebrados pequeños (saltamontes, grillos, cucarachas, escarabajos, polillas) y prefiere pasar la mayor parte del tiempo en madrigueras (Zoo New England). Muchas tarántulas se alimentan sobre todo de noche (Britannica, para tarántulas en general).',
    '✔ Si la molestan, patea pelos urticantes y muerde solo como último recurso (Zoo New England). Un reporte clínico describe calambres musculares tras una mordedura, pero indica que son raras y poco descritas: por eso el juego dice «mejor mirarla de lejos» y no «inofensiva».',
    '◐ Hábitat: desiertos y matorrales del norte de Chile (Hispanopedia, fuente divulgativa; otras fuentes la sitúan en el desierto de Atacama).',
    '◐ Longevidad: hembras 15–20 años o más, machos ~2–3 (fuentes divulgativas); un estudio de caso en la Rev. Chilena de Entomología reporta un macho cautivo de 8,5 años, por encima del rango habitual.',
    '✖ «Araña pollito» es el nombre popular que usa el juego para Grammostola rosea; el mismo nombre se usa para otras tarántulas chilenas (no verificado).',
    '⚠ Decisión de diseño: en el terrario la araña pollito solo caza «moscas» que aparecen solas y asusta a los demás bichos, pero nunca los mata, aunque en la naturaleza sí se alimentaría de bichos como los grillos.'
  ],
  moscardon: [
    '✔ Es nativo del sur de Chile y Argentina y se le llama también abejorro colorado, abejorro gigante o mangangá del sur; los medios lo presentan como el abejorro más grande del mundo (El Mostrador, La Tercera, UACh).',
    '✔ La UICN lo clasificó «En Peligro» en 2016; el abejorro europeo Bombus terrestris, autorizado en 1997 para polinizar cultivos, se escapó y se naturalizó; se investiga la transmisión de patógenos. Las cifras de declive varían según la fuente (de 54 % de pérdida de distribución en una década a hasta 90 % de caída poblacional): el juego no cita cifras.',
    '✖ Que «polinice» al visitar flores es conocimiento general de los abejorros; en el juego se modela como mecánica (nacen flores nuevas).'
  ],
  palo: [
    '✔ Agathemera crassa: chinchemolle, chinchimolle o chichina; Chile y Patagonia argentina; hembras ~75 mm y más gruesas; defensa por olor intenso; nombre de origen quechua (chinche = bicho hediondo, molle = árbol oloroso); vive en la cordillera de los Andes y de la Costa; adultos, hembras con huevos y ninfas aparecen en primavera–verano agrupados bajo piedras o vegetación baja (Earth.com, Atlas entomológico de la U. de Chile).',
    '✖ La dieta (hojas) y el camuflaje no aparecieron en las fuentes consultadas: se asumen como en los demás insectos palo. Agathemera es robusto, no tan «palito» como otros fásmidos: la ilustración del juego es aproximada.',
    '✖ «Insecto palo chileno» es una descripción general (el orden Phasmatodea); el nombre popular más específico es chinchemolle.'
  ],
  mariposa: [
    '✔ Endémica de Chile; alas de 90–115 mm; matorral esclerófilo; la larva perfora tallos de Puya chilensis y come su pulpa; el adulto toma néctar de las flores de Puya chilensis; categoría «Casi Amenazada» según Fundación Lepe (MMA, Fundación Lepe, Angulo y Olivares 2009, Currículum Nacional).',
    '◐ Hay discrepancia sobre si vuela de día (la familia Castniidae es en general diurna o crepuscular) o de noche (Fundación Lepe la llama «mariposa nocturna»). En el juego se trata como activa de día (decisión de diseño, no verificada).',
    '✖ Los colores de la ilustración son una aproximación; no se verificaron contra una foto o ficha.',
    '✖ La oruga y el chagual no aparecen en el terrario: la mariposa toma néctar de las flores de copihue, que es una licencia del juego.'
  ],
  libelula: [
    '✔ Rhionaeschna variegata: odonato más austral del mundo, único en Tierra del Fuego; se encuentra en los Andes a lo largo de Chile y Argentina; preocupación menor (Wikipedia, EcoRegistros).',
    '✔ Las libélulas adultas cazan insectos voladores como mosquitos y moscas; las ninfas son acuáticas y cazan con un labio modificado (Britannica).',
    '✖ El nombre «caballito del diablo» se usa popularmente en Chile para libélulas y caballitos del diablo en general: no se verificó su uso específico para esta especie. Que se pose en ramitas es conocimiento general de las libélulas.',
    '✖ Aquí no hay agua: no se representa la etapa de ninfa.'
  ],
  grillo: [
    '✔ Los machos cantan frotando las alas (estridulación). En Gryllus bimaculatus la tasa de canto aumenta linealmente entre 15 y 24 °C, y las hembras responden mejor a cantos con la tasa del macho a esa temperatura (J. Exp. Biol. 114).',
    '◐ Se trata de «Gryllus sp.»: un registro de iNaturalist lista Gryllus fulvipennis como grillo de campo chileno, pero no se verificó en una fuente taxonómica. El estudio del canto y la temperatura es de otra especie del mismo género.',
    '✖ La dieta omnívora y el tamaño son de conocimiento general (no verificados con una fuente específica).'
  ]
};

/* Cómo aparece cada bicho en el terrario (interacciones implementadas en terrario.js). */
const INTERACT = {
  chanchito: 'Come moho y restos (limpieza), hojas, verduras y calcio. Se hace bolita si se asusta. Se agrupa. Muda en dos mitades y las hembras tienen crías (único bicho que se reproduce).',
  pololo: 'De noche, con la lámpara encendida, vuela hacia la luz y da vueltas. Come hojas.',
  chinita: 'Come pulgones que aparecen en flores y musgo (si faltan, néctar). Se queda quieta si la asusta la araña pollito.',
  tijereta: 'Se esconde de día bajo la corteza, sale de noche, se agrupa. Come hojas, verduras y pulgones.',
  pollito: 'De noche espera en su madriguera (corteza) y caza moscas que se acercan. Asusta a los bichos pequeños; el chinchemolle la hace retroceder con su olor.',
  moscardon: 'Visita flores de día para tomar néctar. Cada ciertas visitas poliniza y nace una flor nueva (hasta 8). Descansa de noche.',
  palo: 'Se mueve muy lento, se esconde de día y se camufla cerca de ramas. Suelta olor si hay un cazador cerca o si lo tocas con la lupa.',
  mariposa: 'Toma néctar de flores de día y poliniza como el moscardón. Descansa de noche.',
  libelula: 'Caza moscas en vuelo (rápido). Descansa posada en ramas y palitos.',
  grillo: 'De noche canta (♪): más rápido con más calor. Se esconde de día. Come hojas y verduras; salta en vez de caminar.'
};

const lvOf = id => LEVELS.find(l => l.bug === id);
let md = '# Los 10 bichos de Chile\n\n> Generado automáticamente desde `data.js` con `node tools/generar-docs.js`. No lo edites a mano: cambia `data.js` o las notas del script.\n\n';
md += 'Cada nivel del juego entrega uno de estos bichos. Los datos que se muestran a los niños están en la **Bichopedia** dentro del juego, con enlaces a sus fuentes. Aquí se documenta, además, **qué tan respaldado está cada dato**.\n\n';
md += '**Leyenda de confianza:** ✔ respaldado por una fuente consultada · ◐ fuente divulgativa, parcial o con discrepancias · ✖ conocimiento general, por verificar · ⚠ decisión de diseño del juego.\n\n';
md += '## Resumen\n\n| Nivel | Bicho | Nombre científico | Grupo | Origen | Escenario |\n|---|---|---|---|---|---|\n';
for (const b of BUGS) md += `| ${b.lvl} | ${b.n} | *${b.sci}* | ${b.grp} | ${b.origin} | ${b.habitat} |\n`;
md += '\n---\n\n';
for (const b of BUGS) {
  const l = lvOf(b.id), s = b.sim;
  md += `## ${b.lvl}. ${b.n} (*${b.sci}*)\n\n`;
  md += `- **Nivel ${l.n}:** ${l.name} (${l.len} m).\n- **Grupo:** ${b.grp} · **Origen:** ${b.origin} · **Tamaño:** ${b.size}.\n- **Dónde vive:** ${b.where}\n- **Qué come:** ${b.eats}\n\n`;
  md += '**Datos que aprende el niño**\n\n';
  FACTS.filter(f => f.bug === b.id).forEach(f => { md += `- \`${f.id}\` ${f.ic} **${f.t}** — ${f.x}\n`; });
  md += `\n**Cómo se comporta en el terrario**\n\n- Actividad: ${s.act === 'night' ? 'nocturno (de día se esconde)' : 'diurno (de noche reposa)'} · Movimiento: ${{ walk: 'camina', hop: 'salta', fly: 'vuela' }[s.move]} · Luz: ${s.light > 0 ? 'la busca' : s.light < 0 ? 'le molesta' : 'indiferente'}.\n`;
  md += `- Humedad cómoda del suelo: ${s.hum[0]}–${s.hum[1]} % · Temperatura tolerable: ${s.tmin}–${s.tmax} °C · Alimento: ${s.diet.join(', ')}.\n- ${INTERACT[b.id]}\n\n`;
  md += '**Fuentes**\n\n' + b.src.map(k => `- [${SRC[k].t}](${SRC[k].u})`).join('\n') + '\n\n';
  md += '**Confianza y notas**\n\n' + NOTES[b.id].map(n => `- ${n}`).join('\n') + '\n\n---\n\n';
}
md += '## Datos generales («Cuidar el terrario»)\n\n';
FACTS.filter(f => f.bug === 'general').forEach(f => { md += `- \`${f.id}\` ${f.ic} **${f.t}** — ${f.x}\n`; });
md += '\n## Datos adicionales del chanchito de tierra\n\nAdemás de la ficha anterior, el chanchito tiene datos extra que se descubren al cuidarlo (branquias, cinesis, agrupación, calcio, muda, marsupio, cobre…):\n\n';
FACTS.filter(f => f.bug === 'chanchito').forEach(f => { md += `- \`${f.id}\` ${f.ic} **${f.t}** — ${f.x}\n`; });
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'BICHOS.md'), md);

let fu = '# Fuentes\n\n> Generado desde `data.js` con `node tools/generar-docs.js`. Las búsquedas se hicieron en noviembre de 2026; algunas páginas no se pudieron abrir desde el entorno de trabajo y se usaron sus resúmenes de búsqueda (se indica en las notas de cada bicho).\n\n';
for (const k of Object.keys(SRC)) fu += `- **${k}** — [${SRC[k].t}](${SRC[k].u})\n`;
fu += '\n## Fuentes de baja confiabilidad descartadas\n\nDurante la investigación aparecieron páginas con texto genérico o inventado (por ejemplo, afirmaciones sobre «sustancias de mal sabor» o «rituales de cortejo» en el chanchito de tierra). **No se usaron.**\n';
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'FUENTES.md'), fu);
console.log('docs/BICHOS.md y docs/FUENTES.md generados');
