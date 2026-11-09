'use strict';
/* =====================================================================
   DATOS DEL JUEGO: bichos, niveles, datos curiosos y fuentes.
   Todo el contenido educativo vive aquí (ver docs/BICHOS.md para el detalle
   y el nivel de confianza de cada dato). Para agregar un bicho, ver docs/DESARROLLO.md.
   ===================================================================== */

/* ---------- Fuentes (se muestran en la Bichopedia) ---------- */
const SRC = {
  ifas:     { t: 'UF/IFAS EDIS EENY630: el chanchito Armadillidium vulgare', u: 'https://edis.ifas.ufl.edu/in1099' },
  biokids:  { t: 'BioKIDS (U. de Michigan): Armadillidium vulgare', u: 'https://www.biokids.umich.edu/critters/Armadillidium_vulgare/' },
  scaber:   { t: 'scaber.org: hábitat de los isópodos terrestres', u: 'https://scaber.org/porcellio/woodlice/habitat/' },
  zookeys:  { t: 'ZooKeys 176: agregación en isópodos', u: 'https://zookeys.pensoft.net/article_preview.php?id=2535' },
  scielo:   { t: 'SciELO: cobre y coprofagia en isópodos', u: 'https://scielo.br/j/nau/a/4ZkRcdScZGcr6QW8nQ8pykS/?lang=en' },
  inia:     { t: 'INIA vía Portal Frutícola: el pololo verde', u: 'https://www.portalfruticola.com/?p=162513' },
  plazi:    { t: 'Plazi: Hylamorpha elegans (Burmeister, 1844)', u: 'https://treatment.plazi.org/GgServer/html/0393BE06F1448754FE8E156B77A7237D' },
  wikiHyl:  { t: 'Wikipedia: Hylamorpha', u: 'https://en.wikipedia.org/wiki/Hylamorpha' },
  ladera:   { t: 'Insectos de Chile: atlas entomológico (U. de Chile)', u: 'https://libros.uchile.cl/files/presses/1/monographs/420/submission/proof/53/' },
  chinitas: { t: 'U. de Chile: guía de 25 especies de chinitas', u: 'https://www.uchile.cl/noticias/174157/guia-presenta-25-especies-de-chinitas-de-nuestro-pais' },
  rce2025:  { t: 'Revista Chilena de Entomología (2025): consumo de pulgones por Eriopis connexa', u: 'https://doaj.org/article/2558d540fa9a4ade95ed2c639609992c' },
  tijInia:  { t: 'INIA vía Portal Frutícola: manejo de tijeretas', u: 'https://www.portalfruticola.com/noticias/2021/04/13/manejo-y-control-de-tijeretas-en-huertos-horticolas/' },
  tijStk:   { t: 'Staerkle y Kölliker (2008): cuidado maternal en la tijereta', u: 'https://edoc.unibas.ch/8205' },
  zooNE:    { t: 'Zoo New England: tarántula rosada chilena', u: 'https://zoonewengland.org/franklin-park-zoo/animals/insects-spiders/chilean-rosy-haired-tarantula/' },
  brTar:    { t: 'Britannica: tarántula', u: 'https://www.britannica.com/animal/tarantula' },
  hispano:  { t: 'Hispanopedia: Grammostola rosea (fuente divulgativa)', u: 'https://es.hispanopedia.com/wiki/Grammostola_rosea' },
  pmcTar:   { t: 'Reporte clínico: mordedura de Grammostola rosea (PMC)', u: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12342680/' },
  elmo:     { t: 'El Mostrador (2026): el abejorro más grande del mundo', u: 'https://www.elmostrador.cl/agenda-pais/vida-en-linea/2026/01/06/el-abejorro-mas-grande-del-mundo-lucha-contra-la-extincion/' },
  laterc:   { t: 'La Tercera: insecto chileno en lista de peligro de extinción', u: 'https://www.latercera.com/noticia/por-primera-vez-insecto-chileno-en-lista-de-peligro-de-extincion/' },
  uach:     { t: 'Diario UACh: el abejorro nativo', u: 'https://diario.uach.cl/?p=107689' },
  earthAg:  { t: 'Earth.com: Agathemera crassa', u: 'https://www.earth.com/animal-encyclopedia/arthropoda/Agathemeridae/agathemera-crassa/en/' },
  atlas8:   { t: 'Atlas entomológico U. de Chile: Agathemera', u: 'https://libros.uchile.cl/files/presses/1/monographs/420/submission/proof/8/' },
  mmaCast:  { t: 'MMA: ficha de clasificación de Castnia eudesmia', u: 'https://clasificacionespecies.mma.gob.cl/wp-content/uploads/2019/10/Castnia_eudesmia_11RCE_03_PAC.pdf' },
  lepe:     { t: 'Fundación Lepe: Mariposa del Chagual', u: 'https://fundacionlepe.cl/web/wp-content/uploads/2024/07/Mariposa-del-Chagual_propiedad.pdf' },
  angulo:   { t: 'Angulo y Olivares (2009), Tropical Lepidoptera Research', u: 'https://www.troplep.org/TLR/19-1/Angulo.pdf' },
  curric:   { t: 'Currículum Nacional: ficha Mariposa del Chagual', u: 'https://www.curriculumnacional.cl/estudiante/621/articles-257061_recurso_pdf.pdf' },
  wikiRv:   { t: 'Wikipedia: Rhionaeschna variegata', u: 'https://en.wikipedia.org/wiki/Rhionaeschna_variegata' },
  ecoReg:   { t: 'EcoRegistros: Rhionaeschna variegata', u: 'https://www.ecoregistros.org/sheet/Rhionaeschna-variegata?idpais=10' },
  brDrag:   { t: 'Britannica: libélula', u: 'https://www.britannica.com/animal/dragonfly' },
  jeb:      { t: 'J. Exp. Biol. 114: temperatura y canto en Gryllus bimaculatus', u: 'https://cob.silverchair.com/jeb/article/114/1/17/4546/Temperature-Coupling-and-Trade-Off-Phenomena-in' }
};

/* ---------- Los 10 bichos ----------
   Parámetros de simulación (usados por terrario.js):
   act   : 'night' (activo de noche, de día se esconde) | 'day' (activo de día, de noche reposa)
   move  : 'walk' | 'hop' | 'fly'
   spd   : velocidad base (unidades/seg)    len: largo del adulto en el terrario
   diet  : qué come → 'hoja' 'verdura' 'calcio' 'flor' (néctar) 'pulgon' 'mosca' 'moho'
   hum   : [mín, máx] de humedad del suelo que le acomoda   hydRate: qué tan rápido se deshidrata
   tmin/tmax: temperaturas tolerables (°C)   light: -1 le molesta la luz, 0 indiferente, +1 la busca
   foodRate: hambre por segundo (la tarántula casi no come)   life: [mín, máx] días de vida en el juego
   huntR : radio de caza (cazadores)   hunter: asusta a otros bichos
   Ver docs/DISENO.md para la tabla de interacciones. */
const BUGS = [
  { id: 'chanchito', n: 'Chanchito de tierra', sci: 'Armadillidium vulgare', grp: 'Crustáceo', origin: 'Introducido (de Europa)', size: 'hasta 18 mm',
    where: 'Jardines, bajo piedras, hojas y troncos húmedos, en casi todo Chile.', eats: 'Hojas secas, madera podrida, hongos y verduras blandas. Necesita calcio.',
    lvl: 1, habitat: 'Jardín de la casa',
    sim: { act: 'night', move: 'walk', spd: 15, len: 22, diet: ['hoja', 'verdura', 'calcio', 'moho'], hum: [50, 100], hydRate: 1, tmin: 10, tmax: 30, light: -1, hides: true, fear: true, foodRate: 0.18, life: [70, 110] },
    src: ['ifas', 'biokids', 'scaber', 'zookeys', 'scielo'], color: '#6f7d8b' },
  { id: 'pololo', n: 'Pololo verde', sci: 'Hylamorpha elegans', grp: 'Insecto (escarabajo)', origin: 'Nativo', size: '14 a 18 mm',
    where: 'Zona central y sur de Chile, de Coquimbo a Los Lagos, junto a bosques de roble, coigüe y ñirre.', eats: 'Los adultos comen follaje; las larvas (gusano blanco) comen raíces de pastos.',
    lvl: 2, habitat: 'Noche de primavera',
    sim: { act: 'night', move: 'fly', spd: 34, len: 20, diet: ['hoja'], hum: [30, 100], hydRate: 0.5, tmin: 8, tmax: 34, light: 1, hides: true, fear: true, foodRate: 0.15, life: [60, 90] },
    src: ['inia', 'plazi', 'wikiHyl', 'ladera'], color: '#3fa34d' },
  { id: 'chinita', n: 'Chinita', sci: 'Eriopis connexa', grp: 'Insecto (escarabajo)', origin: 'Nativa', size: 'muy pequeña (unos milímetros)',
    where: 'Huertos, jardines y campos de Chile; en el país hay cerca de 120 especies de chinitas.', eats: 'Pulgones (áfidos) y otros bichos pequeños; también néctar y polen.',
    lvl: 3, habitat: 'El huerto',
    sim: { act: 'day', move: 'walk', spd: 16, len: 14, diet: ['pulgon', 'flor'], hum: [30, 100], hydRate: 0.5, tmin: 8, tmax: 34, light: 0, hides: false, fear: true, foodRate: 0.16, life: [60, 90] },
    src: ['chinitas', 'rce2025', 'ladera'], color: '#e5483b' },
  { id: 'tijereta', n: 'Tijereta', sci: 'Forficula auricularia', grp: 'Insecto', origin: 'Introducida (de Europa)', size: 'pequeña',
    where: 'Huertos y jardines de Chile; de día bajo piedras, hojarasca y materia en descomposición.', eats: 'De todo (omnívora): brotes, frutos, restos y pequeños bichos como pulgones.',
    lvl: 4, habitat: 'Bajo las piedras',
    sim: { act: 'night', move: 'walk', spd: 20, len: 24, diet: ['hoja', 'verdura', 'pulgon'], hum: [40, 100], hydRate: 0.7, tmin: 8, tmax: 31, light: -1, hides: true, fear: false, foodRate: 0.17, life: [70, 110] },
    src: ['tijInia', 'tijStk'], color: '#7a4a2a' },
  { id: 'pollito', n: 'Araña pollito', sci: 'Grammostola rosea', grp: 'Arácnido (tarántula)', origin: 'Nativa', size: 'tarántula grande y peluda',
    where: 'Desiertos y matorrales del norte de Chile; vive en madrigueras en el suelo.', eats: 'Grillos, saltamontes, cucarachas, escarabajos y otros bichos que caza de noche.',
    lvl: 5, habitat: 'Matorral del norte',
    sim: { act: 'night', move: 'walk', spd: 11, len: 34, diet: ['mosca'], huntR: 90, hum: [20, 75], hydRate: 0.25, tmin: 12, tmax: 35, light: 0, hides: true, fear: false, hunter: true, foodRate: 0.04, life: [200, 300] },
    src: ['zooNE', 'brTar', 'hispano', 'pmcTar'], color: '#a77a62' },
  { id: 'moscardon', n: 'Moscardón (abejorro gigante)', sci: 'Bombus dahlbomii', grp: 'Insecto (abejorro)', origin: 'Nativo', size: 'el abejorro más grande del mundo',
    where: 'Sur de Chile y Argentina, en bosques y praderas con flores.', eats: 'Néctar y polen de las flores.',
    lvl: 6, habitat: 'Bosque del sur',
    sim: { act: 'day', move: 'fly', spd: 40, len: 26, diet: ['flor'], hum: [30, 100], hydRate: 0.4, tmin: 8, tmax: 32, light: 0, hides: false, fear: true, foodRate: 0.3, life: [50, 80] },
    src: ['elmo', 'laterc', 'uach'], color: '#e8892b' },
  { id: 'palo', n: 'Chinchemolle (insecto palo)', sci: 'Agathemera crassa', grp: 'Insecto (fásmido)', origin: 'Nativo', size: 'las hembras, unos 75 mm',
    where: 'Cordillera de los Andes y de la Costa de Chile, y Patagonia argentina; bajo piedras y plantas bajas.', eats: 'Hojas de plantas bajas (como los demás insectos palo).',
    lvl: 7, habitat: 'Cerro andino',
    sim: { act: 'night', move: 'walk', spd: 6, len: 34, diet: ['hoja'], hum: [40, 100], hydRate: 0.5, tmin: 6, tmax: 30, light: -1, hides: true, fear: false, foodRate: 0.1, life: [120, 180] },
    src: ['earthAg', 'atlas8'], color: '#8a6a3c' },
  { id: 'mariposa', n: 'Mariposa del chagual', sci: 'Castnia eudesmia', grp: 'Insecto (mariposa)', origin: 'Endémica de Chile', size: 'alas de 9 a 11 cm',
    where: 'Matorral de Chile central, donde crece el chagual (Puya chilensis).', eats: 'Adulta: néctar de las flores del chagual. Oruga: pulpa del tallo del chagual.',
    lvl: 8, habitat: 'Quebrada de chaguales',
    sim: { act: 'day', move: 'fly', spd: 28, len: 30, diet: ['flor'], hum: [35, 100], hydRate: 0.4, tmin: 12, tmax: 32, light: 0, hides: false, fear: true, foodRate: 0.25, life: [50, 80] },
    src: ['mmaCast', 'lepe', 'angulo', 'curric'], color: '#d4682a' },
  { id: 'libelula', n: 'Libélula (caballito del diablo)', sci: 'Rhionaeschna variegata', grp: 'Insecto (libélula)', origin: 'Nativa', size: 'una libélula grande',
    where: 'Lagunas, esteros y bosques de los Andes a lo largo de Chile y Argentina, hasta Tierra del Fuego.', eats: 'Adulta: moscas y mosquitos que caza en el aire. Ninfa (en el agua): larvas de mosquito y otros bichos acuáticos.',
    lvl: 9, habitat: 'Laguna',
    sim: { act: 'day', move: 'fly', spd: 55, len: 32, diet: ['mosca'], huntR: 450, hum: [45, 100], hydRate: 0.7, tmin: 12, tmax: 33, light: 0, hides: false, fear: true, foodRate: 0.12, life: [70, 110] },
    src: ['wikiRv', 'ecoReg', 'brDrag'], color: '#2d8fd6' },
  { id: 'grillo', n: 'Grillo de campo', sci: 'Gryllus sp.', grp: 'Insecto', origin: 'Nativo', size: 'pequeño',
    where: 'Pastizales y jardines; de noche se oye su canto.', eats: 'Plantas y otros bichos (omnívoro).',
    lvl: 10, habitat: 'Tarde de verano',
    sim: { act: 'night', move: 'hop', spd: 24, len: 20, diet: ['hoja', 'verdura'], hum: [35, 100], hydRate: 0.6, tmin: 10, tmax: 32, light: 0, hides: true, fear: true, foodRate: 0.17, life: [60, 100] },
    src: ['jeb', 'ladera'], color: '#4a3220' }
];
const BUG_BY_ID = Object.fromEntries(BUGS.map(b => [b.id, b]));

/* ---------- Los 10 niveles (uno por bicho) ----------
   len: metros del nivel. biome: paleta y decorado del fondo. */
const LEVELS = [
  { n: 1,  bug: 'chanchito', name: 'Jardín de la casa',     len: 400, biome: { sky: ['#8fd3ff', '#d8f3ff'], hill: '#7cc45a', hill2: '#5fae48', ground: '#6bbf4a', dirt: '#6b4a2b', deco: 'trees',   sun: 'sun' } },
  { n: 2,  bug: 'pololo',    name: 'Noche de primavera',    len: 450, biome: { sky: ['#1b2250', '#3b4a8a'], hill: '#26502f', hill2: '#1d4026', ground: '#2f7a3a', dirt: '#3a2814', deco: 'trees',   sun: 'moon', stars: true } },
  { n: 3,  bug: 'chinita',   name: 'El huerto',             len: 500, biome: { sky: ['#9fe0ff', '#e6f8ff'], hill: '#8cc94f', hill2: '#6fb043', ground: '#78c443', dirt: '#7a5230', deco: 'bushes',  sun: 'sun' } },
  { n: 4,  bug: 'tijereta',  name: 'Bajo las piedras',      len: 550, biome: { sky: ['#ffb36b', '#ffe3b0'], hill: '#8a7a5a', hill2: '#6e6048', ground: '#7d8a4a', dirt: '#5a3d22', deco: 'rocks',   sun: 'sun' } },
  { n: 5,  bug: 'pollito',   name: 'Matorral del norte',    len: 600, biome: { sky: ['#ffd98a', '#fff0c8'], hill: '#d9b36a', hill2: '#c49a52', ground: '#cfae6a', dirt: '#8a6234', deco: 'cactus',  sun: 'sun' } },
  { n: 6,  bug: 'moscardon', name: 'Bosque del sur',        len: 650, biome: { sky: ['#a9d3c2', '#dff0e6'], hill: '#2f7a4a', hill2: '#25663d', ground: '#3a8a46', dirt: '#4a3320', deco: 'pines',   sun: 'sun' } },
  { n: 7,  bug: 'palo',      name: 'Cerro andino',          len: 700, biome: { sky: ['#8fb8e8', '#dcecff'], hill: '#9a8f86', hill2: '#7b726b', ground: '#8a9a5a', dirt: '#5e4a38', deco: 'rocks',   sun: 'sun' } },
  { n: 8,  bug: 'mariposa',  name: 'Quebrada de chaguales', len: 750, biome: { sky: ['#ff9f6b', '#ffd9a8'], hill: '#b08a55', hill2: '#96723f', ground: '#a8a050', dirt: '#6e4a28', deco: 'chagual', sun: 'sun' } },
  { n: 9,  bug: 'libelula',  name: 'Laguna',                len: 800, biome: { sky: ['#7fd0ff', '#d6f4ff'], hill: '#5fae62', hill2: '#4a9a58', ground: '#5cb86a', dirt: '#4a5a3a', deco: 'reeds',   sun: 'sun' } },
  { n: 10, bug: 'grillo',    name: 'Tarde de verano',       len: 850, biome: { sky: ['#ff8a5a', '#ffd27a'], hill: '#c9a24a', hill2: '#a98338', ground: '#b9aa4a', dirt: '#6a4a24', deco: 'bushes',  sun: 'sun' } }
];

/* ---------- Datos curiosos ----------
   bug: a qué ficha pertenece ('general' = cuidar el terrario).
   Los 2 primeros de cada bicho se desbloquean al ganarlo; los demás al verlos en acción en el terrario. */
const FACTS = [
  { bug: 'chanchito', id: 'crust', ic: '🦀', t: 'No son insectos', x: 'Los chanchitos de tierra no son insectos. Son crustáceos, ¡primos del camarón y del cangrejo! Son los crustáceos que mejor viven en tierra firme.' },
  { bug: 'chanchito', id: 'legs', ic: '🦵', t: '¡14 patas!', x: 'Tienen 7 pares de patas, o sea 14. Los insectos tienen solo 6 patas. Y las antenas largas les sirven para tocar y oler el camino.' },
  { bug: 'chanchito', id: 'gills', ic: '💧', t: 'Respiran con branquias', x: 'Respiran con branquias escondidas bajo la cola, como los peces y los cangrejos. Las branquias deben estar húmedas, por eso siempre buscan lugares con humedad.' },
  { bug: 'chanchito', id: 'kinesis', ic: '🏃', t: 'Corren si hay sequedad', x: 'Cuando el aire está seco se mueven más rápido, y cuando hay humedad se calman. Así, andando y andando, encuentran un lugar húmedo.' },
  { bug: 'chanchito', id: 'ball', ic: '⚽', t: 'Se hacen bolita', x: 'Al asustarse, el chanchito Armadillidium vulgare se enrolla en una bolita para proteger su panza blandita. Pero ojo: no todos los isópodos pueden hacerlo, ¡algunos solo corren!' },
  { bug: 'chanchito', id: 'nocturnal', ic: '🌙', t: 'Les gusta la oscuridad', x: 'Prefieren la sombra y la noche. De día se esconden bajo piedras, troncos y cortezas; por eso en tu terrario necesitan escondites.' },
  { bug: 'chanchito', id: 'group', ic: '👨‍👩‍👧', t: 'Les gusta juntarse', x: 'Se juntan en grupitos: así pierden menos agua y están más protegidos. Les encanta tocar cosas, ¡incluso a otros chanchitos!' },
  { bug: 'chanchito', id: 'decomp', ic: '🍂', t: 'Los recicladores', x: 'Comen hojas secas, madera podrida y hongos. Al comer y hacer caquita, devuelven nutrientes a la tierra. ¡Son recicladores de la naturaleza!' },
  { bug: 'chanchito', id: 'veg', ic: '🥕', t: 'Verduras con cuidado', x: 'Les gustan las verduras blanditas, como la zanahoria. Pero si sobra comida, aparece moho. Retira lo que no se coma en uno o dos días.' },
  { bug: 'chanchito', id: 'calcium', ic: '🦴', t: 'Caparazón de calcio', x: 'Su armadura está hecha con calcio. Por eso en los terrarios se les da cáscara de huevo o hueso de jibia para que puedan fabricar un caparazón nuevo.' },
  { bug: 'chanchito', id: 'molt', ic: '👕', t: 'Cambian de piel en dos partes', x: 'Cuando crecen, mudan su caparazón en dos mitades: primero la de atrás y después la de adelante. Por un ratito se ven mitad claros y mitad oscuros.' },
  { bug: 'chanchito', id: 'molt2', ic: '🥚', t: 'Usan el calcio de nuevo', x: 'Guardan calcio en pequeñas manchas blancas del cuerpo y lo usan para endurecer la piel nueva. A veces se comen la piel que dejaron.' },
  { bug: 'chanchito', id: 'marsupium', ic: '🎒', t: 'La mochila de mamá', x: 'La mamá lleva los huevos en una bolsa en la panza, llamada marsupio, con un líquido que alimenta a las crías. Las crías nacen blancas y pequeñitas: se llaman mancas.' },
  { bug: 'chanchito', id: 'broods', ic: '👶', t: 'Varias camadas', x: 'Una mamá puede tener hasta tres camadas en una temporada. Los huevos tardan unas 3 o 4 semanas, y las crías se quedan un tiempito más en la bolsa.' },
  { bug: 'chanchito', id: 'baby', ic: '🍼', t: 'Mudan al primer día', x: 'Las crías mudan su piel por primera vez el mismo día en que salen de la bolsa de mamá. ¡Por eso necesitan calcio desde chiquitas!' },
  { bug: 'chanchito', id: 'copper', ic: '🔵', t: 'Sangre con cobre', x: 'Su sangre lleva cobre, como un metal. Los científicos creen que por eso a veces se comen su propia caquita: las bacterias de la caquita ayudan a recuperar cobre.' },
  { bug: 'chanchito', id: 'size', ic: '📏', t: 'Chiquitos pero firmes', x: 'Un chanchito adulto mide hasta unos 18 milímetros, como una uña pequeña. ¡Y no muerden ni pican a las personas!' },
  { bug: 'chanchito', id: 'life', ic: '🎂', t: '¡Viven años!', x: 'Pueden vivir entre 2 y 5 años si los cuidan bien. En la naturaleza suelen vivir menos.' },
  { bug: 'chanchito', id: 'world', ic: '🌍', t: 'Viajeros del mundo', x: 'Este chanchito es originario de Europa, pero hoy vive en jardines de muchos países del mundo.' },
  /* ----- Pololo verde ----- */
  { bug: 'pololo', id: 'pololo1', ic: '🪲', t: 'Verde metálico', x: 'El pololo verde es un escarabajo nativo de Chile. Mide entre 14 y 18 milímetros y tiene un verde brillante.' },
  { bug: 'pololo', id: 'pololo2', ic: '🌳', t: 'De Coquimbo a Los Lagos', x: 'Vive en el centro y el sur de Chile, cerca de los bosques de roble, coigüe y ñirre.' },
  { bug: 'pololo', id: 'pololo3', ic: '💡', t: 'Les gusta la luz', x: 'Los pololos adultos vuelan de noche hacia las luces. Los científicos los atrapan con trampas de luz.' },
  { bug: 'pololo', id: 'pololo4', ic: '🥚', t: 'De gusano blanco a pololo', x: 'Cuando es bebé es el «gusano blanco», que vive bajo la tierra y come raíces de pastos. El ciclo completo dura un año.' },
  /* ----- Chinita ----- */
  { bug: 'chinita', id: 'chinita1', ic: '🐞', t: 'Escarabajos de puntitos', x: 'La chinita es un escarabajo. Sus alas duras de colores forman una cúpula con puntos.' },
  { bug: 'chinita', id: 'chinita2', ic: '🔢', t: 'Unas 120 chinitas', x: 'En Chile hay cerca de 120 especies de chinitas y la mayoría son nativas, ¡no solo la roja con puntos negros!' },
  { bug: 'chinita', id: 'chinita3', ic: '🌿', t: 'Cazadora de pulgones', x: 'Las chinitas comen pulgones, esos bichitos que chupan las plantas. En un estudio chileno, comían más pulgones mientras más grandes eran.' },
  { bug: 'chinita', id: 'chinita4', ic: '🌍', t: 'Una chinita que llegó de lejos', x: 'En los años 70 se trajo de Europa otra chinita (Hippodamia variegata) para combatir pulgones. Desde entonces la chinita nativa Eriopis connexa bajó en número, aunque los científicos aún discuten por qué.' },
  /* ----- Tijereta ----- */
  { bug: 'tijereta', id: 'tijereta1', ic: '✂️', t: 'Las pinzas de atrás', x: 'Las pinzas de la tijereta se llaman cercos. Las usa para defenderse, capturar presas y abrir sus alas.' },
  { bug: 'tijereta', id: 'tijereta2', ic: '🍽️', t: 'Come de todo', x: 'Es omnívora: come brotes, frutos, restos y también bichitos pequeños como los pulgones.' },
  { bug: 'tijereta', id: 'tijereta3', ic: '🌙', t: 'Sale de noche', x: 'De día se esconde bajo piedras, hojas secas y troncos. Sale al atardecer y de noche. Le gusta andar en grupo.' },
  { bug: 'tijereta', id: 'tijereta4', ic: '👩‍👧', t: 'Mamá cuidadora', x: 'La mamá tijereta cuida sus huevos y sus crías, y hasta les da comida de su propia boca. Es una mamá muy dedicada.' },
  /* ----- Araña pollito ----- */
  { bug: 'pollito', id: 'pollito1', ic: '🕷️', t: 'Tarántula chilena', x: 'La araña pollito es una tarántula peluda y rosada. Vive en madrigueras que cava en el suelo.' },
  { bug: 'pollito', id: 'pollito2', ic: '🌵', t: 'Del desierto y matorral', x: 'Vive en el desierto y los matorrales del norte de Chile. Aguanta bien lugares secos, por eso no le gusta la humedad excesiva.' },
  { bug: 'pollito', id: 'pollito3', ic: '🌙', t: 'Cazadora nocturna', x: 'Caza de noche grillos, saltamontes y otros bichos. Casi no se mueve: prefiere esperar en su madriguera.' },
  { bug: 'pollito', id: 'pollito4', ic: '⚠️', t: 'Mejor mirarla de lejos', x: 'Si la molestan, patea unos pelitos que pican y muerde solo como último recurso. Hay que mirarla sin tocarla. Las hembras viven 15 a 20 años o más; los machos, unos 2 o 3.' },
  /* ----- Moscardón ----- */
  { bug: 'moscardon', id: 'moscardon1', ic: '🐝', t: 'El abejorro más grande', x: 'El moscardón, o abejorro colorado, es el abejorro más grande del mundo. Vive en Chile y Argentina.' },
  { bug: 'moscardon', id: 'moscardon2', ic: '🌸', t: 'Un gran polinizador', x: 'Cuando visita flores para tomar néctar, se le pega polen. Lo lleva a otra flor y así ayuda a que haya semillas y frutos.' },
  { bug: 'moscardon', id: 'moscardon3', ic: '🌺', t: '¡Hizo crecer una flor!', x: 'Gracias a los polinizadores aparecen flores nuevas. ¡Sin ellos, muchas plantas no tendrían semillas!' },
  { bug: 'moscardon', id: 'moscardon4', ic: '🆘', t: 'Está en peligro', x: 'En 2016 la UICN lo clasificó «En Peligro». Una causa es el abejorro europeo (Bombus terrestris), que se trajo para polinizar cultivos y se escapó. ¡Cuidemos a nuestro abejorro!' },
  /* ----- Chinchemolle ----- */
  { bug: 'palo', id: 'palo1', ic: '🌿', t: 'Insecto palo chileno', x: 'El chinchemolle (o chichina) es un insecto palo de Chile y de la Patagonia argentina.' },
  { bug: 'palo', id: 'palo2', ic: '📏', t: 'Las hembras son más grandes', x: 'Las hembras miden unos 75 milímetros y son más gruesas que los machos.' },
  { bug: 'palo', id: 'palo3', ic: '💨', t: '¡Qué olor!', x: 'Cuando se asusta suelta un olor muy fuerte. Su nombre viene del quechua: «chinche» es bicho hediondo y «molle», árbol oloroso.' },
  { bug: 'palo', id: 'palo4', ic: '⛰️', t: 'De la cordillera', x: 'Vive en la cordillera, bajo piedras y plantas bajas. En primavera y verano se ven grupos de ninfas y adultos.' },
  /* ----- Mariposa del chagual ----- */
  { bug: 'mariposa', id: 'mariposa1', ic: '🦋', t: 'Solo existe en Chile', x: 'La mariposa del chagual es endémica: no vive en ningún otro país. Sus alas miden entre 9 y 11 centímetros.' },
  { bug: 'mariposa', id: 'mariposa2', ic: '🌵', t: 'Vive dentro del chagual', x: 'Su oruga vive adentro del tallo del chagual (Puya chilensis), una planta espinosa, y come su pulpa blanca.' },
  { bug: 'mariposa', id: 'mariposa3', ic: '🌺', t: 'Toma néctar', x: 'De adulta toma néctar de las flores del chagual con su trompa larga.' },
  { bug: 'mariposa', id: 'mariposa4', ic: '🛟', t: 'Casi amenazada', x: 'Está «casi amenazada». Como depende del chagual, cuidar el matorral donde crece también la cuida a ella.' },
  /* ----- Libélula ----- */
  { bug: 'libelula', id: 'libelula1', ic: '🧭', t: 'La libélula más austral', x: 'Esta libélula llega hasta Tierra del Fuego: es la libélula que vive más al sur del mundo.' },
  { bug: 'libelula', id: 'libelula2', ic: '💧', t: 'Los bebés viven en el agua', x: 'Las ninfas viven en el agua y cazan con un labio que se estira como un gancho para atrapar a sus presas.' },
  { bug: 'libelula', id: 'libelula3', ic: '🪰', t: 'Cazadora en vuelo', x: 'De adulta caza moscas y mosquitos en el aire. ¡Es una gran ayuda contra las plagas!' },
  { bug: 'libelula', id: 'libelula4', ic: '🪽', t: 'Cuatro alas', x: 'Tiene dos pares de alas, ve muy bien con sus ojos enormes y le encanta posarse en ramitas para descansar.' },
  /* ----- Grillo ----- */
  { bug: 'grillo', id: 'grillo1', ic: '🎻', t: 'Cantan con las alas', x: 'Los grillos machos cantan frotando una ala contra la otra. Eso se llama estridulación.' },
  { bug: 'grillo', id: 'grillo2', ic: '🌡️', t: 'Un termómetro que canta', x: 'Cuanto más calor hace, más rápido canta. En un estudio con un grillo de campo (Gryllus bimaculatus), entre 15 y 24 grados el canto se aceleraba parejo.' },
  { bug: 'grillo', id: 'grillo3', ic: '🎶', t: 'Canción para las grillas', x: 'En ese mismo estudio, las hembras respondían mejor a un canto que tenía el ritmo que un macho tiene a esa temperatura.' },
  { bug: 'grillo', id: 'grillo4', ic: '🥗', t: 'Comen de todo', x: 'Son omnívoros: comen plantas, frutas y también otros bichitos.' },
  /* ----- Cuidar el terrario (general) ----- */
  { bug: 'general', id: 'temp', ic: '🌡️', t: 'Ni mucho calor ni mucho frío', x: 'Casi todos los bichos viven bien entre 18 y 27 grados. Sobre los 30 grados sufren, y con mucho frío se quedan lentos y casi dormidos.' },
  { bug: 'general', id: 'moisture', ic: '🏜️', t: 'Un lado húmedo y otro seco', x: 'En un buen terrario hay una parte más húmeda y otra más seca, para que cada bicho elija dónde estar. Todo mojado tampoco sirve: aparece moho y se pueden ahogar.' },
  { bug: 'general', id: 'mold', ic: '🍄', t: 'Cuidado con el moho', x: 'La humedad y la comida vieja hacen crecer moho. Ventilar un poquito y sacar la comida que sobra mantiene sano al terrario. ¡Los chanchitos ayudan a limpiar!' },
  { bug: 'general', id: 'light', ic: '💡', t: 'La luz fuerte', x: 'A muchos bichos nocturnos la luz fuerte los asusta y los seca. Las plantas y el musgo, en cambio, sí necesitan luz. Y los pololos, ¡las buscan!' },
  { bug: 'general', id: 'home', ic: '🏠', t: 'Un buen hogar', x: 'Un buen terrario tiene tierra suelta, hojas secas, escondites, algo de calcio, flores y humedad. Cada bicho necesita cosas distintas.' },
  { bug: 'general', id: 'predators', ic: '🦎', t: '¡Tienen enemigos!', x: 'Pájaros, lagartijas, arañas y otros animales se comen a muchos bichos. Por eso ellos se esconden, se enrollan, huelen mal o corren.' },
  { bug: 'general', id: 'food', ic: '🔗', t: 'Todos se ayudan', x: 'En la naturaleza todo está conectado: las chinitas controlan pulgones, los moscardones polinizan flores y los chanchitos reciclan hojas.' },
  { bug: 'general', id: 'fear', ic: '😱', t: '¡Qué susto!', x: 'Cuando un cazador se acerca, los bichos más chicos huyen, se hacen bolita o se quedan quietos fingiendo estar muertos. ¡Cada uno tiene su truco!' }
];
const FACT_BY_ID = Object.fromEntries(FACTS.map(f => [f.id, f]));
