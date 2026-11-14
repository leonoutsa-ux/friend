// A small quiz that needs no AI and no internet: general-knowledge questions kept in the app.
// Each line: [question, right answer, wrong, wrong, wrong, short explanation].
const fr = [
  ["Quelle planète est la plus proche du Soleil ?", "Mercure", "Vénus", "Mars", "La Terre", "Mercure tourne autour du Soleil en seulement 88 jours."],
  ["Combien de côtés a un hexagone ?", "6", "5", "7", "8", "« Hexa » veut dire six en grec."],
  ["Quel gaz les plantes absorbent-elles pour faire la photosynthèse ?", "Le dioxyde de carbone", "L'oxygène", "L'azote", "L'hélium", "Elles prennent le CO₂ et rejettent de l'oxygène."],
  ["Quel est le plus grand océan du monde ?", "L'océan Pacifique", "L'océan Atlantique", "L'océan Indien", "L'océan Arctique", "Le Pacifique couvre environ un tiers de la surface de la Terre."],
  ["Qui a peint La Joconde ?", "Léonard de Vinci", "Pablo Picasso", "Claude Monet", "Michel-Ange", "Léonard de Vinci l'a peinte au début du 16e siècle."],
  ["Combien font 7 × 8 ?", "56", "54", "63", "48", "7 × 8 = 56."],
  ["Quelle est la capitale du Canada ?", "Ottawa", "Toronto", "Montréal", "Vancouver", "Ottawa, en Ontario, a été choisie comme capitale en 1857."],
  ["Quel organe pompe le sang dans le corps ?", "Le cœur", "Les poumons", "Le foie", "L'estomac", "Le cœur bat environ 100 000 fois par jour."],
  ["Quel est l'état de l'eau à 0 °C quand elle gèle ?", "Solide", "Liquide", "Gazeux", "Plasma", "L'eau devient de la glace à 0 °C."],
  ["Combien de jours compte une année bissextile ?", "366", "365", "364", "367", "Tous les quatre ans environ, février a un 29e jour."],
  ["Quel animal est le plus grand du monde ?", "La baleine bleue", "L'éléphant d'Afrique", "La girafe", "Le requin-baleine", "La baleine bleue peut dépasser 25 mètres."],
  ["Quelle est la langue la plus parlée comme langue maternelle ?", "Le mandarin", "L'anglais", "L'espagnol", "Le français", "Le mandarin compte le plus de locuteurs natifs."],
  ["Dans quel pays se trouvent les pyramides de Gizeh ?", "L'Égypte", "Le Mexique", "Le Pérou", "L'Inde", "Elles sont près du Caire, en Égypte."],
  ["Combien de minutes y a-t-il dans deux heures ?", "120", "100", "90", "140", "2 × 60 = 120 minutes."],
  ["Quelle est la formule chimique de l'eau ?", "H₂O", "CO₂", "O₂", "NaCl", "Deux atomes d'hydrogène et un d'oxygène."],
  ["Quel instrument a des touches noires et blanches ?", "Le piano", "La guitare", "Le violon", "La flûte", "Un piano classique a 88 touches."],
  ["Quelle est la planète la plus grande du système solaire ?", "Jupiter", "Saturne", "Neptune", "La Terre", "Jupiter est plus massive que toutes les autres planètes réunies."],
  ["Qui a écrit « Les Misérables » ?", "Victor Hugo", "Émile Zola", "Molière", "Jules Verne", "Victor Hugo a publié ce roman en 1862."],
  ["Quel est le résultat de 15 + 27 ?", "42", "41", "43", "32", "15 + 27 = 42."],
  ["Quelle partie de la plante absorbe l'eau du sol ?", "Les racines", "Les feuilles", "Les fleurs", "La tige", "Les racines puisent l'eau et les minéraux."],
  ["Combien de joueurs une équipe de soccer a-t-elle sur le terrain ?", "11", "9", "10", "12", "Dix joueurs de champ et un gardien."],
  ["Quel est le plus long fleuve d'Amérique du Sud ?", "L'Amazone", "Le Paraná", "L'Orénoque", "Le Mississippi", "L'Amazone traverse surtout le Brésil et le Pérou."],
  ["Comment appelle-t-on un angle de 90 degrés ?", "Un angle droit", "Un angle aigu", "Un angle obtus", "Un angle plat", "Un angle droit mesure exactement 90°."],
  ["Quel métal est liquide à température ambiante ?", "Le mercure", "Le fer", "L'or", "L'aluminium", "Le mercure fond à environ −39 °C."],
  ["Quel pays a la forme d'une botte ?", "L'Italie", "L'Espagne", "La Grèce", "Le Portugal", "L'Italie s'avance dans la mer Méditerranée."],
  ["Combien de couleurs voit-on habituellement dans un arc-en-ciel ?", "7", "5", "6", "9", "Rouge, orange, jaune, vert, bleu, indigo, violet."],
  ["Quel est le plus petit nombre premier ?", "2", "1", "3", "0", "2 est le seul nombre premier pair."],
  ["Quel scientifique a formulé la théorie de la relativité ?", "Albert Einstein", "Isaac Newton", "Marie Curie", "Galilée", "Einstein a publié la relativité restreinte en 1905."]
];
const en = [
  ["Which planet is closest to the Sun?", "Mercury", "Venus", "Mars", "Earth", "Mercury goes around the Sun in just 88 days."],
  ["How many sides does a hexagon have?", "6", "5", "7", "8", "\"Hexa\" means six in Greek."],
  ["Which gas do plants absorb for photosynthesis?", "Carbon dioxide", "Oxygen", "Nitrogen", "Helium", "They take in CO₂ and release oxygen."],
  ["What is the largest ocean in the world?", "The Pacific Ocean", "The Atlantic Ocean", "The Indian Ocean", "The Arctic Ocean", "The Pacific covers about a third of Earth's surface."],
  ["Who painted the Mona Lisa?", "Leonardo da Vinci", "Pablo Picasso", "Claude Monet", "Michelangelo", "Leonardo painted it in the early 1500s."],
  ["What is 7 × 8?", "56", "54", "63", "48", "7 × 8 = 56."],
  ["What is the capital of Canada?", "Ottawa", "Toronto", "Montreal", "Vancouver", "Ottawa, in Ontario, was chosen as the capital in 1857."],
  ["Which organ pumps blood through the body?", "The heart", "The lungs", "The liver", "The stomach", "The heart beats about 100,000 times a day."],
  ["What state is water in when it freezes at 0 °C?", "Solid", "Liquid", "Gas", "Plasma", "Water turns to ice at 0 °C."],
  ["How many days are there in a leap year?", "366", "365", "364", "367", "About every four years, February gets a 29th day."],
  ["What is the largest animal in the world?", "The blue whale", "The African elephant", "The giraffe", "The whale shark", "A blue whale can be over 25 metres long."],
  ["Which language has the most native speakers?", "Mandarin Chinese", "English", "Spanish", "French", "Mandarin has the most native speakers."],
  ["In which country are the pyramids of Giza?", "Egypt", "Mexico", "Peru", "India", "They stand near Cairo, in Egypt."],
  ["How many minutes are there in two hours?", "120", "100", "90", "140", "2 × 60 = 120 minutes."],
  ["What is the chemical formula of water?", "H₂O", "CO₂", "O₂", "NaCl", "Two hydrogen atoms and one oxygen atom."],
  ["Which instrument has black and white keys?", "The piano", "The guitar", "The violin", "The flute", "A standard piano has 88 keys."],
  ["Which is the largest planet in the solar system?", "Jupiter", "Saturn", "Neptune", "Earth", "Jupiter is more massive than all the other planets combined."],
  ["Who wrote \"Romeo and Juliet\"?", "William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain", "Shakespeare wrote it in the 1590s."],
  ["What is 15 + 27?", "42", "41", "43", "32", "15 + 27 = 42."],
  ["Which part of a plant takes in water from the soil?", "The roots", "The leaves", "The flowers", "The stem", "Roots draw up water and minerals."],
  ["How many players does a soccer team have on the field?", "11", "9", "10", "12", "Ten outfield players and one goalkeeper."],
  ["What is the longest river in South America?", "The Amazon", "The Paraná", "The Orinoco", "The Mississippi", "The Amazon flows mostly through Brazil and Peru."],
  ["What is a 90-degree angle called?", "A right angle", "An acute angle", "An obtuse angle", "A straight angle", "A right angle measures exactly 90°."],
  ["Which metal is liquid at room temperature?", "Mercury", "Iron", "Gold", "Aluminium", "Mercury melts at about −39 °C."],
  ["Which country is shaped like a boot?", "Italy", "Spain", "Greece", "Portugal", "Italy stretches into the Mediterranean Sea."],
  ["How many colours are usually named in a rainbow?", "7", "5", "6", "9", "Red, orange, yellow, green, blue, indigo, violet."],
  ["What is the smallest prime number?", "2", "1", "3", "0", "2 is the only even prime number."],
  ["Which scientist came up with the theory of relativity?", "Albert Einstein", "Isaac Newton", "Marie Curie", "Galileo", "Einstein published special relativity in 1905."]
];
const es = [
  ["¿Qué planeta está más cerca del Sol?", "Mercurio", "Venus", "Marte", "La Tierra", "Mercurio da la vuelta al Sol en solo 88 días."],
  ["¿Cuántos lados tiene un hexágono?", "6", "5", "7", "8", "«Hexa» significa seis en griego."],
  ["¿Qué gas absorben las plantas para la fotosíntesis?", "El dióxido de carbono", "El oxígeno", "El nitrógeno", "El helio", "Toman CO₂ y liberan oxígeno."],
  ["¿Cuál es el océano más grande del mundo?", "El océano Pacífico", "El océano Atlántico", "El océano Índico", "El océano Ártico", "El Pacífico cubre cerca de un tercio de la Tierra."],
  ["¿Quién pintó La Gioconda?", "Leonardo da Vinci", "Pablo Picasso", "Claude Monet", "Miguel Ángel", "Leonardo la pintó a comienzos del siglo XVI."],
  ["¿Cuánto es 7 × 8?", "56", "54", "63", "48", "7 × 8 = 56."],
  ["¿Cuál es la capital de Canadá?", "Ottawa", "Toronto", "Montreal", "Vancouver", "Ottawa, en Ontario, fue elegida capital en 1857."],
  ["¿Qué órgano bombea la sangre por el cuerpo?", "El corazón", "Los pulmones", "El hígado", "El estómago", "El corazón late unas 100 000 veces al día."],
  ["¿En qué estado está el agua cuando se congela a 0 °C?", "Sólido", "Líquido", "Gaseoso", "Plasma", "El agua se vuelve hielo a 0 °C."],
  ["¿Cuántos días tiene un año bisiesto?", "366", "365", "364", "367", "Cada cuatro años más o menos, febrero tiene un día 29."],
  ["¿Cuál es el animal más grande del mundo?", "La ballena azul", "El elefante africano", "La jirafa", "El tiburón ballena", "Una ballena azul puede superar los 25 metros."],
  ["¿Qué idioma tiene más hablantes nativos?", "El chino mandarín", "El inglés", "El español", "El francés", "El mandarín tiene el mayor número de hablantes nativos."],
  ["¿En qué país están las pirámides de Guiza?", "Egipto", "México", "Perú", "India", "Están cerca de El Cairo, en Egipto."],
  ["¿Cuántos minutos hay en dos horas?", "120", "100", "90", "140", "2 × 60 = 120 minutos."],
  ["¿Cuál es la fórmula química del agua?", "H₂O", "CO₂", "O₂", "NaCl", "Dos átomos de hidrógeno y uno de oxígeno."],
  ["¿Qué instrumento tiene teclas blancas y negras?", "El piano", "La guitarra", "El violín", "La flauta", "Un piano normal tiene 88 teclas."],
  ["¿Cuál es el planeta más grande del sistema solar?", "Júpiter", "Saturno", "Neptuno", "La Tierra", "Júpiter tiene más masa que todos los demás planetas juntos."],
  ["¿Quién escribió «Don Quijote de la Mancha»?", "Miguel de Cervantes", "Federico García Lorca", "Gabriel García Márquez", "Lope de Vega", "Cervantes publicó la primera parte en 1605."],
  ["¿Cuánto es 15 + 27?", "42", "41", "43", "32", "15 + 27 = 42."],
  ["¿Qué parte de la planta absorbe el agua del suelo?", "Las raíces", "Las hojas", "Las flores", "El tallo", "Las raíces toman agua y minerales."],
  ["¿Cuántos jugadores tiene un equipo de fútbol en el campo?", "11", "9", "10", "12", "Diez jugadores de campo y un portero."],
  ["¿Cuál es el río más largo de América del Sur?", "El Amazonas", "El Paraná", "El Orinoco", "El Misisipi", "El Amazonas cruza sobre todo Brasil y Perú."],
  ["¿Cómo se llama un ángulo de 90 grados?", "Ángulo recto", "Ángulo agudo", "Ángulo obtuso", "Ángulo llano", "Un ángulo recto mide exactamente 90°."],
  ["¿Qué metal es líquido a temperatura ambiente?", "El mercurio", "El hierro", "El oro", "El aluminio", "El mercurio se funde a unos −39 °C."],
  ["¿Qué país tiene forma de bota?", "Italia", "España", "Grecia", "Portugal", "Italia se adentra en el mar Mediterráneo."],
  ["¿Cuántos colores se nombran normalmente en el arcoíris?", "7", "5", "6", "9", "Rojo, naranja, amarillo, verde, azul, añil y violeta."],
  ["¿Cuál es el número primo más pequeño?", "2", "1", "3", "0", "2 es el único número primo par."],
  ["¿Qué científico formuló la teoría de la relatividad?", "Albert Einstein", "Isaac Newton", "Marie Curie", "Galileo", "Einstein publicó la relatividad especial en 1905."]
];
const BANK = { fr, en, es };

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Five questions picked at random, in the same shape as the quizzes written by the AI.
export function surpriseQuiz(lang, count = 5) {
  const pool = shuffle([...(BANK[lang] || BANK.en)]).slice(0, count);
  return pool.map(([q, right, a, b, c, why]) => {
    const options = shuffle([right, a, b, c]);
    return { q, options, answer: options.indexOf(right), why };
  });
}
