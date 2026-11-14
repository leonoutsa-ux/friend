// Every word Friend shows or says, in French and English.
import { es } from "./i18n-es.js";

const fr = {
  gardenBtn: "🌱 Jardin",
  brainAuto: "Automatique (conseillé)", brainAutoSub: "La petite IA privée répond si ton téléphone est assez rapide ou sans internet ; sinon l'IA en ligne",
  speedH: "Vitesse de la petite IA", speedTest: "Tester la vitesse", speedNone: "Pas encore mesurée", speedVal: (v, ms) => `${v} mots/s · premier mot en ${(ms / 1000).toFixed(1).replace(".", ",")} s`, speedFast: "Rapide : elle répondra à ta place, en privé.", speedSlow: "Un peu lente sur ce téléphone : l'IA en ligne prend le relais quand tu as internet.", speedTesting: "Test en cours…",
  localGet: "Télécharger la petite IA privée", localWhy: "Optionnel. Une fois téléchargée, Friend peut te répondre sans internet et sans rien envoyer.",
  displayH: "Affichage", themeL: "Thème", themes: [["auto", "Auto"], ["light", "Clair"], ["dark", "Sombre"]], textL: "Taille du texte", texts: [["normal", "Normal"], ["large", "Grand"], ["xlarge", "Très grand"]],
  quick: [["focus", "🎯 On se concentre ?"], ["challenge", "🎨 Défi du jour"], ["breathe", "🫧 Respirer un coup"]], memDelete: "Oublier ce souvenir",
  backupH: "Sauvegarde", backupSub: "Tout reste sur ce téléphone. Fais une copie de tes souvenirs, de ton jardin et de tes capsules pour ne rien perdre si tu changes de téléphone.",
  backupSave: "Télécharger ma sauvegarde", backupLoad: "Restaurer une sauvegarde", backupDone: "Sauvegarde téléchargée. Garde-la en lieu sûr.", backupBad: "Ce fichier n'est pas une sauvegarde de Friend.", backupSure: "Remplacer tout par cette sauvegarde ?", backupYes: "Oui, restaurer", backupOk: "Sauvegarde restaurée !",
  gardenMorning: "Ouvrir mon jardin chaque matin", gardenMorningSub: "Le matin, Friend te demande ton humeur dès que tu l'ouvres",
  garden: {
    title: "Mon jardin d'humeur", lead: "Chaque jour, dis comment tu te sens. Ton humeur devient une plante, et ton jardin pousse avec toi. Tout reste sur ce téléphone.",
    question: "Comment tu te sens aujourd'hui ?", notePh: "Un mot sur ta journée (optionnel)…",
    moods: ["Pas bien", "Bof", "Correct", "Bien", "Super"], plants: ["Champignon", "Pousse", "Tulipe", "Marguerite", "Tournesol"],
    plant: "Planter", update: "Mettre à jour", planted: p => `${p} plantée aujourd'hui.`,
    prev: "Avant", next: "Après", tapHint: "Touche une plante pour revoir ce jour-là.",
    example: "Exemple de jardin. Plante ta première fleur pour commencer le tien.", exampleTap: "C'est un exemple. Ton vrai jardin commence avec ta première plante.",
    nothing: "rien de planté", statsTitle: "Ton jardin en chiffres", sPlants: "plantes", sStreak: "jours d'affilée", sTop: "humeur la plus fréquente"
  },
  onlineTitle: "Avant de commencer",
  onlineText: "Pour répondre vite sur tous les téléphones, Friend utilise un service d'IA en ligne gratuit (Pollinations). Tes messages y sont envoyés pour obtenir les réponses. Friend retire automatiquement les courriels, numéros de téléphone, codes postaux et adresses avant l'envoi, mais n'y écris quand même pas ton nom complet ni ton école. Tes souvenirs et réglages, eux, restent sur ce téléphone. Tu peux passer à la petite IA privée dans Réglages > Cerveau.",
  onlineOk: "J'ai compris",
  shareBtn: "Partager Friend avec un ami", shareText: "Je te conseille Friend : un confident IA gratuit qui t'écoute sans te juger. Sans compte, et tes souvenirs restent sur ton téléphone.", shareCopied: "Lien copié ! Colle-le dans un message.",
  onlinePrivate: "Utiliser plutôt l'IA privée",
  onlinePrivateNote: gb => `Avec l'IA privée, rien ne quitte ton téléphone. Elle se télécharge une seule fois (environ ${String(gb).replace(".", ",")} Go, Wi-Fi conseillé) et répond un peu plus lentement.`,
  brainOnline: "IA en ligne gratuite", brainOnlineSub: "Rapide sur tous les téléphones · les messages passent par Pollinations",
  onlineBusy: "Le service en ligne est occupé. Réessaie dans un moment.", offline: "Pas d'internet. Reconnecte-toi, ou télécharge la petite IA privée dans Réglages.",
  langH: "Langue", langSub: "La langue de Friend, de sa voix et de l'écoute.",
  naturalH: "Voix naturelle", naturalSub: "Gratuite, téléchargée une fois (environ 60 Mo), puis marche sans internet.",
  naturalGet: "Télécharger la voix naturelle", naturalOn: "Voix naturelle prête", naturalLoading: "Téléchargement de la voix…", naturalFail: "La voix naturelle n'a pas pu se télécharger.",
  sysVoice: "Voix du téléphone",
  dlBrain: p => `Je télécharge mon cerveau… ${p} %`, wakeBrain: "Je me réveille…",
  tooSlow: "Ton téléphone a du mal à faire tourner cette IA. Essaie la taille « Légère » dans Réglages > Cerveau.",
  aiReplyLang: "français",
  lang: "fr-CA", langName: "français",
  introTitle: "Salut, moi c'est Friend.",
  intro: "Avant qu'on parle, j'ai quelques petites questions pour apprendre à te connaître. Ensuite, plus on discute, plus je deviens TON Friend : je me souviens de ce qui compte pour toi, directement sur ce téléphone.",
  notPro: "Friend n'est pas un professionnel de la santé. En cas d'urgence, appelle le 911.",
  introGo: "C'est parti", next: "Suivant", back: "Retour", skip: "Passer", done: "Terminer",
  qName: "Comment je peux t'appeler ?", qNameHint: "Un prénom, un surnom, ce que tu veux.", namePh: "Ton prénom ou surnom",
  qStyle: "Comment tu veux que je te parle ?",
  styles: [["soft", "Doux et calme", "Comme une conversation tard le soir"], ["pal", "Comme un pote", "Simple, détendu, sans chichis"], ["fun", "Avec de l'humour", "Pour alléger un peu les choses"], ["straight", "Direct et franc", "Je te dis les choses comme elles sont"]],
  qHelp: "Quand ça va pas, qu'est-ce qui t'aide le plus ?",
  helps: [["listen", "Qu'on m'écoute", "Juste vider mon sac"], ["advice", "Des idées et des conseils", "Pour savoir quoi faire"], ["distract", "Me changer les idées", "Penser à autre chose"], ["mix", "Un peu de tout", "Ça dépend des jours"]],
  qTopics: "De quoi tu risques de me parler ?", qTopicsHint: "Choisis-en autant que tu veux.",
  topics: ["L'école", "La famille", "Les amis", "L'amour", "Le stress", "La solitude", "La confiance en moi", "Mes passions"],
  qLen: "Mes réponses, tu les préfères…",
  lens: [["short", "Courtes", "Quelques phrases, comme un texto"], ["long", "Plus développées", "Quand j'ai envie de creuser"]],

  pinAskTitle: "Tu veux protéger Friend avec un code ?",
  pinAskText: "Friend garde des souvenirs sur toi. Avec un code à 4 chiffres, personne d'autre ne peut les voir.",
  pinYes: "Choisir un code", pinLater: "Plus tard",
  pinNew: "Choisis ton code à 4 chiffres", pinConfirm: "Retape ton code", pinMismatch: "Les deux codes ne sont pas pareils. On recommence.",
  pinEnter: "Ton code pour ouvrir Friend", pinWrong: "Ce n'est pas le bon code.",
  pinForgot: "Code oublié ?", pinForgotText: "Le code ne peut pas être récupéré : tout reste sur ce téléphone. Tu peux tout effacer et recommencer à zéro.",
  pinWipe: "Tout effacer et recommencer", cancel: "Annuler", del: "Effacer",

  welcome: n => `${n ? "Salut " + n + "." : "Salut."} Je suis là pour t'écouter, sans te juger. Qu'est-ce qui se passe pour toi en ce moment ?`,
  welcomeBack: n => `${n ? "Re-salut " + n + "." : "Re-salut."} Content de te revoir. Comment ça va aujourd'hui ?`,
  placeholder: "Écris ce que tu ressens…",
  chips: ["Je me sens seul·e", "Ça va pas à l'école", "Je sais pas à qui en parler", "J'ai juste besoin de vider mon sac"],
  bond: n => n < 3 ? "Nouvel ami" : n < 10 ? "On commence à se connaître" : n < 30 ? "Bon ami" : "Meilleurs potes",
  learned: "✦ Friend te connaît un peu mieux",
  lookTip: "Psst : tu peux changer mon look quand tu veux dans Réglages.",

  toDirect: "🎙 Direct", toChat: "⌨ Écrire", settings: "⚙ Réglages",
  tapToStart: "Touche-moi pour qu'on parle",
  sListening: "Je t'écoute…", sThinking: "Je réfléchis…", sSpeaking: "Je parle… (touche-moi pour me couper)", sPaused: "Micro en pause", sIdle: "Touche-moi pour parler",
  micOn: "Couper le micro", micOff: "Rallumer le micro",
  noMic: "Ton téléphone ne permet pas le mode direct ici. Tu peux écrire, ou utiliser le micro de ton clavier.",
  micDenied: "Friend n'a pas accès au micro. Autorise-le dans les réglages du téléphone, ou passe en mode écrit.",
  voiceNote: "Selon ton téléphone, la transformation de ta voix en texte peut passer par le service vocal de Google ou d'Apple. Le son n'est pas gardé.",
  voiceLocal: "Ta voix est transformée en texte directement sur ce téléphone.",

  brainNeedTitle: "Friend a besoin de son cerveau",
  brainNeedText: size => `La première fois, Friend télécharge sa petite IA (environ ${size}). Ensuite, elle reste sur ce téléphone et marche même sans internet. Utilise le Wi-Fi.`,
  brainGo: "Télécharger", brainLoading: "Friend se réveille…", brainLoadingFirst: "Téléchargement du cerveau de Friend…",
  brainNoGpu: "Ce téléphone ne peut pas faire tourner l'IA de Friend directement. Tu peux brancher ton propre compte Claude dans Réglages.",
  brainError: "Le cerveau de Friend n'a pas pu se charger. Vérifie ta connexion et réessaie.",
  brainRetry: "Réessayer", openSettings: "Ouvrir les réglages",
  thinkingFail: "Je n'ai pas réussi à répondre. Tu peux réessayer ?",
  keyBad: "Ta clé Claude ne marche pas. Vérifie-la dans Réglages.",
  quota: "Tu as atteint ta limite de messages du mois avec ton compte Claude. Friend repasse sur sa petite IA.",

  helpToggle: "Besoin d'aide tout de suite ?", helpTitle: "Des vraies personnes, à toute heure",
  helpSevere: "Ce que tu vis a l'air vraiment sérieux. Tu n'as pas à rester seul·e avec ça : des personnes peuvent t'aider tout de suite, gratuitement.",
  help: [["Jeunesse, J'écoute", "1-800-668-6868", "ou texto 686868"], ["Ligne de crise", "988", "appel ou texto"], ["Danger immédiat", "911", ""]],
  crisisText: "Jeunesse, J'écoute au 1-800-668-6868 ou par texto au 686868, le 988 par appel ou texto, et le 911 en cas de danger immédiat",
  close: "Fermer",

  setTitle: "Réglages",
  lookH: "Mon look", lookSub: "Choisis à quoi je ressemble.", shapeH: "Forme", colorH: "Couleur", accH: "Accessoire",
  hues: [["sun", "Soleil"], ["bubble", "Bonbon"], ["mint", "Menthe"], ["sky", "Ciel"], ["grape", "Raisin"], ["peach", "Pêche"]],
  shapes: [["round", "Rond"], ["cloud", "Nuage"], ["star", "Étoile"], ["cat", "Chat"], ["bear", "Ourson"], ["ghost", "Fantôme"], ["drop", "Goutte"], ["robot", "Robot"]],
  accs: [["none", "Aucun"], ["glasses", "Lunettes"], ["bow", "Nœud"], ["headphones", "Écouteurs"], ["crown", "Couronne"], ["cap", "Casquette"], ["flower", "Fleur"], ["halo", "Auréole"]],

  brainH: "Cerveau", brainWho: "Qui répond ?",
  brainLocal: "La petite IA de Friend", brainLocalSub: "Gratuite, privée, marche sans internet",
  brainClaude: "Mon compte Claude", brainClaudeSub: "Plus intelligent, payé par ton compte, pour les 18 ans et plus",
  sizeH: "Taille de la petite IA",
  sizes: [["small", "Légère", "Pour les téléphones plus modestes"], ["medium", "Équilibrée", "Le meilleur choix pour la plupart"], ["large", "Plus futée", "Pour les téléphones récents et puissants"]],
  brainState: { idle: "Pas encore téléchargée", loading: "En chargement…", ready: "Prête", nogpu: "Pas possible sur ce téléphone", error: "Erreur de chargement" },
  keyLabel: "Clé d'accès Claude", keyPh: "sk-ant-…", keySave: "Enregistrer", keyRemove: "Retirer la clé", keySaved: "Clé enregistrée sur ce téléphone.",
  keyHelp: "Crée une clé sur console.anthropic.com. Chaque message est facturé à ton compte. Seules tes questions partent vers Claude : tes souvenirs restent ici, sauf si tu actives l'option ci-dessous.",
  shareCtx: "Partager mon contexte avec Claude", shareCtxSub: "Envoie aussi tes préférences et souvenirs pour des réponses plus personnelles",
  limitLabel: "Limite de messages par mois", usage: (n, m) => `Ce mois-ci : ${n} message${n > 1 ? "s" : ""} sur ${m}`,

  voiceH: "Voix", voicePick: "Voix de Friend", voiceDefault: "Voix par défaut du téléphone", rate: "Vitesse", voiceTest: "Tester", voiceTestText: "Salut ! C'est moi, Friend.",
  autoDirect: "Ouvrir Friend en mode direct",

  lockH: "Verrou", lockOn: "Code activé", lockOff: "Pas de code", lockSet: "Choisir un code", lockChange: "Changer le code", lockRemove: "Retirer le code",

  meH: "Ce que je sais de toi", prefsH: "Tes préférences", memH: "Mes souvenirs", archiveH: "Résumé des plus vieux souvenirs",
  memPrivacy: "Tout ça reste sur ce téléphone. Nos conversations ne sont pas gardées : seulement ces petits souvenirs.",
  memEmpty: "Pas encore de souvenirs. Ça viendra en discutant.",
  redo: "Refaire le questionnaire", newChat: "Nouvelle discussion", forget: "Tout oublier", forgetSure: "Oui, tout effacer",
  aboutH: "À propos", privacyLink: "Politique de confidentialité", version: "Version"
};

const en = {
  gardenBtn: "🌱 Garden",
  brainAuto: "Automatic (recommended)", brainAutoSub: "The small private AI answers when your phone is fast enough or offline; otherwise the online AI",
  speedH: "Small AI speed", speedTest: "Test the speed", speedNone: "Not measured yet", speedVal: (v, ms) => `${v} words/s · first word in ${(ms / 1000).toFixed(1)} s`, speedFast: "Fast: it will answer you, privately.", speedSlow: "A bit slow on this phone: the online AI takes over when you have internet.", speedTesting: "Testing…",
  localGet: "Download the small private AI", localWhy: "Optional. Once downloaded, Friend can answer you offline without sending anything.",
  displayH: "Display", themeL: "Theme", themes: [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]], textL: "Text size", texts: [["normal", "Normal"], ["large", "Large"], ["xlarge", "Extra large"]],
  quick: [["focus", "🎯 Focus time?"], ["challenge", "🎨 Daily challenge"], ["breathe", "🫧 Take a breath"]], memDelete: "Forget this memory",
  backupH: "Backup", backupSub: "Everything stays on this phone. Save a copy of your memories, garden and capsules so you don't lose them if you change phones.",
  backupSave: "Download my backup", backupLoad: "Restore a backup", backupDone: "Backup downloaded. Keep it somewhere safe.", backupBad: "This file isn't a Friend backup.", backupSure: "Replace everything with this backup?", backupYes: "Yes, restore", backupOk: "Backup restored!",
  gardenMorning: "Open my garden every morning", gardenMorningSub: "In the morning, Friend asks how you feel as soon as you open it",
  garden: {
    title: "My mood garden", lead: "Each day, say how you feel. Your mood becomes a plant, and your garden grows with you. Everything stays on this phone.",
    question: "How are you feeling today?", notePh: "A word about your day (optional)…",
    moods: ["Not good", "Meh", "Okay", "Good", "Great"], plants: ["Mushroom", "Sprout", "Tulip", "Daisy", "Sunflower"],
    plant: "Plant", update: "Update", planted: p => `${p} planted today.`,
    prev: "Before", next: "After", tapHint: "Tap a plant to look back at that day.",
    example: "Example garden. Plant your first flower to start yours.", exampleTap: "This is an example. Your real garden starts with your first plant.",
    nothing: "nothing planted", statsTitle: "Your garden in numbers", sPlants: "plants", sStreak: "days in a row", sTop: "most frequent mood"
  },
  onlineTitle: "Before we start",
  onlineText: "To answer quickly on every phone, Friend uses a free online AI service (Pollinations). Your messages are sent there to get the replies. Friend automatically removes e-mails, phone numbers, postal codes and addresses before sending, but still don't write your full name or school. Your memories and settings stay on this phone. You can switch to the small private AI in Settings > Brain.",
  onlineOk: "Got it",
  shareBtn: "Share Friend with a friend", shareText: "Try Friend: a free AI confidant that listens without judging. No account, and your memories stay on your phone.", shareCopied: "Link copied! Paste it in a message.",
  onlinePrivate: "Use the private AI instead",
  onlinePrivateNote: gb => `With the private AI, nothing leaves your phone. It downloads once (about ${gb} GB, Wi-Fi recommended) and answers a bit more slowly.`,
  brainOnline: "Free online AI", brainOnlineSub: "Fast on every phone · messages go through Pollinations",
  onlineBusy: "The online service is busy. Try again in a moment.", offline: "No internet. Reconnect, or download the small private AI in Settings.",
  langH: "Language", langSub: "The language Friend speaks, listens and writes in.",
  naturalH: "Natural voice", naturalSub: "Free, downloaded once (about 60 MB), then works offline.",
  naturalGet: "Download the natural voice", naturalOn: "Natural voice ready", naturalLoading: "Downloading the voice…", naturalFail: "The natural voice couldn't be downloaded.",
  sysVoice: "Phone's voice",
  dlBrain: p => `Downloading my brain… ${p}%`, wakeBrain: "Waking up…",
  tooSlow: "Your phone is struggling to run this AI. Try the \"Light\" size in Settings > Brain.",
  aiReplyLang: "English",
  lang: "en-CA", langName: "English",
  introTitle: "Hi, I'm Friend.",
  intro: "Before we talk, I have a few quick questions to get to know you. Then the more we chat, the more I become YOUR Friend: I remember what matters to you, right here on this phone.",
  notPro: "Friend is not a health professional. In an emergency, call 911.",
  introGo: "Let's go", next: "Next", back: "Back", skip: "Skip", done: "Done",
  qName: "What should I call you?", qNameHint: "A name, a nickname, anything.", namePh: "Your name or nickname",
  qStyle: "How do you want me to talk to you?",
  styles: [["soft", "Soft and calm", "Like a late-night talk"], ["pal", "Like a buddy", "Simple and relaxed"], ["fun", "With some humor", "To lighten things up"], ["straight", "Direct and honest", "I tell it like it is"]],
  qHelp: "When things are rough, what helps you most?",
  helps: [["listen", "Being listened to", "Just letting it out"], ["advice", "Ideas and advice", "Figuring out what to do"], ["distract", "Taking my mind off it", "Thinking about something else"], ["mix", "A bit of everything", "Depends on the day"]],
  qTopics: "What might you want to talk about?", qTopicsHint: "Pick as many as you like.",
  topics: ["School", "Family", "Friends", "Love", "Stress", "Loneliness", "Self-confidence", "My passions"],
  qLen: "You like my replies…",
  lens: [["short", "Short", "A few sentences, like a text"], ["long", "Longer", "When I want to dig in"]],

  pinAskTitle: "Want to protect Friend with a code?",
  pinAskText: "Friend keeps memories about you. With a 4-digit code, nobody else can see them.",
  pinYes: "Choose a code", pinLater: "Later",
  pinNew: "Choose your 4-digit code", pinConfirm: "Type your code again", pinMismatch: "The two codes don't match. Let's start over.",
  pinEnter: "Your code to open Friend", pinWrong: "That's not the right code.",
  pinForgot: "Forgot your code?", pinForgotText: "The code can't be recovered: everything stays on this phone. You can erase everything and start over.",
  pinWipe: "Erase everything and start over", cancel: "Cancel", del: "Delete",

  welcome: n => `${n ? "Hey " + n + "." : "Hey."} I'm here to listen, no judgment. What's going on for you right now?`,
  welcomeBack: n => `${n ? "Hey again, " + n + "." : "Hey again."} Good to see you. How are you doing today?`,
  placeholder: "Write what you're feeling…",
  chips: ["I feel lonely", "School is rough", "I don't know who to talk to", "I just need to vent"],
  bond: n => n < 3 ? "New friend" : n < 10 ? "Getting to know each other" : n < 30 ? "Good friend" : "Close friend",
  learned: "✦ Friend knows you a little better",
  lookTip: "Psst: you can change my look anytime in Settings.",

  toDirect: "🎙 Live", toChat: "⌨ Type", settings: "⚙ Settings",
  tapToStart: "Tap me so we can talk",
  sListening: "I'm listening…", sThinking: "Thinking…", sSpeaking: "Talking… (tap me to interrupt)", sPaused: "Mic paused", sIdle: "Tap me to talk",
  micOn: "Mute the mic", micOff: "Turn the mic back on",
  noMic: "Your phone doesn't support live mode here. You can type, or use your keyboard's mic.",
  micDenied: "Friend can't use the microphone. Allow it in your phone settings, or switch to typing.",
  voiceNote: "Depending on your phone, turning your voice into text may go through Google's or Apple's speech service. The audio isn't kept.",
  voiceLocal: "Your voice is turned into text right on this phone.",

  brainNeedTitle: "Friend needs its brain",
  brainNeedText: size => `The first time, Friend downloads its small AI (about ${size}). After that, it stays on this phone and works without internet. Use Wi-Fi.`,
  brainGo: "Download", brainLoading: "Friend is waking up…", brainLoadingFirst: "Downloading Friend's brain…",
  brainNoGpu: "This phone can't run Friend's AI directly. You can connect your own Claude account in Settings.",
  brainError: "Friend's brain couldn't load. Check your connection and try again.",
  brainRetry: "Try again", openSettings: "Open settings",
  thinkingFail: "I couldn't answer that. Can you try again?",
  keyBad: "Your Claude key isn't working. Check it in Settings.",
  quota: "You've reached this month's message limit for your Claude account. Friend is switching back to its small AI.",

  helpToggle: "Need help right now?", helpTitle: "Real people, any time",
  helpSevere: "What you're going through sounds really serious. You don't have to face it alone: people can help you right now, for free.",
  help: [["Kids Help Phone", "1-800-668-6868", "or text 686868"], ["Crisis line", "988", "call or text"], ["Immediate danger", "911", ""]],
  crisisText: "Kids Help Phone at 1-800-668-6868 or by texting 686868, 988 by call or text, and 911 in immediate danger",
  close: "Close",

  setTitle: "Settings",
  lookH: "My look", lookSub: "Pick what I look like.", shapeH: "Shape", colorH: "Color", accH: "Accessory",
  hues: [["sun", "Sunshine"], ["bubble", "Bubblegum"], ["mint", "Mint"], ["sky", "Sky"], ["grape", "Grape"], ["peach", "Peach"]],
  shapes: [["round", "Round"], ["cloud", "Cloud"], ["star", "Star"], ["cat", "Cat"], ["bear", "Bear"], ["ghost", "Ghost"], ["drop", "Drop"], ["robot", "Robot"]],
  accs: [["none", "None"], ["glasses", "Glasses"], ["bow", "Bow"], ["headphones", "Headset"], ["crown", "Crown"], ["cap", "Cap"], ["flower", "Flower"], ["halo", "Halo"]],

  brainH: "Brain", brainWho: "Who answers?",
  brainLocal: "Friend's small AI", brainLocalSub: "Free, private, works offline",
  brainClaude: "My Claude account", brainClaudeSub: "Smarter, paid by your account, for ages 18 and up",
  sizeH: "Small AI size",
  sizes: [["small", "Light", "For more modest phones"], ["medium", "Balanced", "Best choice for most phones"], ["large", "Smarter", "For recent, powerful phones"]],
  brainState: { idle: "Not downloaded yet", loading: "Loading…", ready: "Ready", nogpu: "Not possible on this phone", error: "Loading error" },
  keyLabel: "Claude access key", keyPh: "sk-ant-…", keySave: "Save", keyRemove: "Remove key", keySaved: "Key saved on this phone.",
  keyHelp: "Create a key at console.anthropic.com. Each message is billed to your account. Only your questions go to Claude: your memories stay here unless you turn on the option below.",
  shareCtx: "Share my context with Claude", shareCtxSub: "Also sends your preferences and memories for more personal answers",
  limitLabel: "Message limit per month", usage: (n, m) => `This month: ${n} of ${m} messages`,

  voiceH: "Voice", voicePick: "Friend's voice", voiceDefault: "Phone's default voice", rate: "Speed", voiceTest: "Test", voiceTestText: "Hi! It's me, Friend.",
  autoDirect: "Open Friend in live mode",

  lockH: "Lock", lockOn: "Code on", lockOff: "No code", lockSet: "Choose a code", lockChange: "Change code", lockRemove: "Remove code",

  meH: "What I know about you", prefsH: "Your preferences", memH: "My memories", archiveH: "Summary of older memories",
  memPrivacy: "All of this stays on this phone. Our conversations aren't kept, only these little memories.",
  memEmpty: "No memories yet. They'll come as we talk.",
  redo: "Redo the questions", newChat: "New chat", forget: "Forget everything", forgetSure: "Yes, erase it all",
  aboutH: "About", privacyLink: "Privacy policy", version: "Version"
};

// Languages Friend can speak. UI is translated for fr / en / es; the others use English menus,
// but Friend talks, listens and answers in that language.
export const LANGS = [
  { code: "fr", name: "Français", speech: "fr-CA", ui: fr, reply: "français", piper: ["fr_FR-siwis-medium", "fr_FR-tom-medium"] },
  { code: "en", name: "English", speech: "en-US", ui: en, reply: "English", piper: ["en_US-amy-medium", "en_US-ryan-medium"] },
  { code: "es", name: "Español", speech: "es-ES", ui: es, reply: "español", piper: ["es_ES-davefx-medium", "es_MX-claude-high"] },
  { code: "de", name: "Deutsch", speech: "de-DE", ui: en, reply: "Deutsch (German)", piper: ["de_DE-thorsten-medium", "de_DE-kerstin-low"] },
  { code: "it", name: "Italiano", speech: "it-IT", ui: en, reply: "italiano (Italian)", piper: ["it_IT-riccardo-x_low"] },
  { code: "pt", name: "Português", speech: "pt-BR", ui: en, reply: "português (Portuguese)", piper: ["pt_BR-faber-medium", "pt_BR-edresson-low"] }
];
Object.assign(es, { langH: "Idioma" });
export const T = {};
export let LANG = LANGS[1];
export function detectLang() {
  for (const l of navigator.languages || [navigator.language || "en"]) {
    const c = (l || "").slice(0, 2).toLowerCase();
    const hit = LANGS.find(x => x.code === c);
    if (hit) return hit.code;
  }
  return "en";
}
export function setLang(code) {
  LANG = LANGS.find(x => x.code === code) || LANGS[1];
  for (const k of Object.keys(T)) delete T[k];
  Object.assign(T, LANG.ui, { lang: LANG.speech, langName: LANG.reply, aiReplyLang: LANG.reply, code: LANG.code });
  document.documentElement.lang = LANG.code;
}
export const isFR = () => LANG.code === "fr";
setLang(detectLang());
export const label = (list, v) => (list.find(x => x[0] === v) || [, v])[1];
