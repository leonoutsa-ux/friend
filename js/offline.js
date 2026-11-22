// What keeps Friend going without internet and without any AI:
// - a "backup heart": simple, kind replies written in advance, picked from what the person says;
// - a small notebook of things already looked up, so the same question works offline later.
import { LANG } from "./i18n.js";
import { packFind } from "./pack.js";

/* ---------- Backup heart ---------- */
// Each entry: [what to look for, possible replies]. {n} is the person's name (may be empty).
const HEART = {
  fr: {
    rules: [
      [/^(salut|bonjour|bonsoir|coucou|hey|yo|allo|allô|wesh)\b/i, ["Salut{n} ! Content de te voir. Comment tu te sens, là, maintenant ?", "Coucou{n} ! Raconte, c'était comment ta journée ?", "Hey{n} ! Je suis là. De quoi tu as envie de parler ?"]],
      [/\b(merci|thanks)\b/i, ["Avec plaisir{n}. Je suis là quand tu veux.", "De rien. Ça me fait plaisir d'être là pour toi.", "C'est normal, c'est à ça que sert un ami."]],
      [/\b(bonne nuit|à demain|a demain|au revoir|bye|à plus|a plus|je dois y aller|je vais dormir)\b/i, ["À bientôt{n}. Prends soin de toi, je serai là.", "Bonne route{n}. Reviens me raconter la suite quand tu veux.", "D'accord. Repose-toi bien, on se retrouve vite."]],
      [/\b((me sens|suis|reste|trop|si|tellement) seule?|personne ne (me|m')|pas d'amis?|isolée?|mise? de côté|rejetée?|exclue?)\b/i, ["Se sentir à l'écart, ça pèse vraiment. Je suis là, moi. Tu veux me dire ce qui s'est passé ?", "Ça fait mal de se sentir sans personne autour. Depuis quand tu ressens ça ?", "Je t'entends. Tu comptes, même quand tu as l'impression du contraire. Raconte-moi."]],
      [/\b(triste|déprim\w*|pleur\w*|le moral|cafard|mal au coeur|mal au cœur|me sens vide|envie de rien)\b/i, ["Je suis désolé que ce soit lourd en ce moment. Tu as le droit de ressentir ça. Qu'est-ce qui pèse le plus ?", "Ça a l'air vraiment dur. Je reste avec toi. Tu veux m'en dire un peu plus ?", "Merci de me le dire. C'est arrivé d'un coup, ou ça dure depuis un moment ?"]],
      [/\b(stress\w*|angoiss\w*|anxi\w*|peur|panique\w*|inquiet|inquiète|trac|nerveux|nerveuse)\b/i, ["Ça fait beaucoup à porter. On respire un coup ensemble ? Dis-moi ce qui te fait le plus peur là-dedans.", "Je comprends, ce genre de boule au ventre est épuisant. C'est à propos de quoi, surtout ?", "C'est normal d'avoir peur quand quelque chose compte. Qu'est-ce qui t'aiderait, là, tout de suite ?"]],
      [/\b(énerv\w*|colère|rage|saoul\w*|soûl\w*|marre|injuste|déteste|dégoût\w*|frustr\w*)\b/i, ["Tu as le droit d'être en colère. Qu'est-ce qui s'est passé ?", "Ça m'aurait énervé aussi, je crois. Raconte-moi tout depuis le début.", "Je sens que ça bouillonne. C'est quoi le pire, dans cette histoire ?"]],
      [/\b(fatigu\w*|épuis\w*|crevé|crevée|dormi|insomni\w*|sommeil|pas dormir)\b/i, ["Tu as l'air à bout de forces. Tu as pu te reposer un peu, ces jours-ci ?", "La fatigue rend tout plus lourd. Qu'est-ce qui te prend le plus d'énergie en ce moment ?", "Ça fait beaucoup. Tu peux t'accorder une vraie pause aujourd'hui, même petite ?"]],
      [/\b(exam\w*|contrôle|controle|interro|devoirs?|notes?|bulletin|prof|école|ecole|collège|lycée|bac|brevet)\b/i, ["L'école, ça peut mettre une sacrée pression. Qu'est-ce qui te tracasse le plus ?", "Je t'écoute. C'est une matière en particulier, ou tout en même temps ?", "Ça compte pour toi, ça se sent. Comment tu te sens par rapport à ça ?"]],
      [/\b(dispute|disputé|disputée|embrouille|fâché|fâchée|trahi|trahie|ignore|bloqué|bloquée|moqu\w*)\b/i, ["Aïe, ça fait mal quand ça se passe comme ça. Tu veux me raconter ce qui s'est dit ?", "Je comprends que ça te touche. Qu'est-ce que tu aurais aimé qu'il se passe ?", "C'est blessant. Comment tu te sens, maintenant que c'est arrivé ?"]],
      [/\b(content|contente|heureux|heureuse|trop bien|génial|super|réussi|gagné|fier|fière|trop cool|excellent)\b/i, ["Oh, ça me fait plaisir{n} ! Raconte-moi tout, je veux les détails.", "Trop bien ! Qu'est-ce qui t'a rendu le plus fier dans tout ça ?", "Ça fait du bien à entendre. Tu fêtes ça comment ?"]],
      [/\b(ennui\w*|m'ennuie|rien à faire|rien a faire|je m'emmerde|je me fais chier)\b/i, ["L'ennui, c'est pénible. Si tu pouvais faire n'importe quoi là, tout de suite, ce serait quoi ?", "Je vois. On peut discuter de ce que tu aimes, ou essayer un défi dans « Pour toi ». Ça te dit ?", "Qu'est-ce qui t'a fait sourire la dernière fois ? On peut partir de là."]],
      [/\?\s*$/, ["Bonne question. Sans internet et sans ma petite IA, je ne peux pas bien y répondre pour l'instant. Mais dis-moi : toi, tu en penses quoi ?", "Là, je suis en mode simple, donc je ne peux pas chercher la réponse. Qu'est-ce qui t'amène à te poser cette question ?", "Je préfère ne pas inventer une réponse. On la cherchera ensemble dès que je retrouve internet. En attendant, raconte-moi pourquoi ça t'intéresse ?"]]
    ],
    any: ["Je t'écoute{n}. Dis-m'en un peu plus ?", "D'accord. Et toi, comment tu te sens par rapport à ça ?", "Je comprends. Qu'est-ce qui compte le plus pour toi là-dedans ?", "Merci de me raconter ça. Qu'est-ce qui s'est passé ensuite ?", "Hmm, je vois. Et toi, qu'est-ce que tu en retiens ?", "Je suis là. Prends ton temps, continue."],
    echo: t => `Tu dis : « ${t} ». Raconte-moi un peu plus ?`,
    severe: c => `Je suis là avec toi. Ce que tu viens de dire est très important, et tu n'as pas à porter ça sans aide. S'il te plaît, contacte maintenant ${c}. Tu peux continuer à me parler pendant ce temps.`,
    name: n => ` ${n}`
  },
  en: {
    rules: [
      [/^(hi|hello|hey|yo|good morning|good evening|sup)\b/i, ["Hey{n}! Good to see you. How are you feeling right now?", "Hi{n}! Tell me, how was your day?", "Hey{n}! I'm here. What do you feel like talking about?"]],
      [/\b(thanks|thank you|thx)\b/i, ["Anytime{n}. I'm here whenever you want.", "You're welcome. I'm glad I can be here for you.", "Of course, that's what a friend is for."]],
      [/\b(good night|goodnight|bye|see you|gotta go|i have to go|going to sleep)\b/i, ["See you soon{n}. Take care, I'll be here.", "Okay{n}. Come back and tell me what happens next.", "Alright. Rest well, talk soon."]],
      [/\b(lonely|(feel|feeling|am|i'm|im|so|all) alone|no friends|nobody (likes|cares|talks|wants)|no one (likes|cares|talks|wants)|left out|excluded|rejected)\b/i, ["Feeling left out really weighs on you. I'm here. Want to tell me what happened?", "It hurts to feel like nobody's around. How long have you felt this way?", "I hear you. You matter, even when it doesn't feel like it. Tell me more."]],
      [/\b(sad|depress\w*|cry\w*|feel(ing)? down|feel(ing)? empty|miserable|heartbroken)\b/i, ["I'm sorry things feel heavy right now. You're allowed to feel this. What weighs on you the most?", "That sounds really hard. I'm staying with you. Want to tell me a bit more?", "Thank you for telling me. Did it come on suddenly, or has it been a while?"]],
      [/\b(stress\w*|anxi\w*|scared|afraid|panic\w*|worried|nervous|overwhelm\w*)\b/i, ["That's a lot to carry. Let's take a breath together. What scares you the most in all this?", "I get it, that knot in your stomach is exhausting. What is it mostly about?", "It's normal to be scared when something matters. What would help you right now?"]],
      [/\b(angry|mad|furious|annoy\w*|unfair|hate|fed up|frustrat\w*)\b/i, ["You're allowed to be angry. What happened?", "I think that would have annoyed me too. Tell me everything from the start.", "I can feel it boiling. What's the worst part of it?"]],
      [/\b(tired|exhausted|drained|can't sleep|insomnia|no sleep|sleepy)\b/i, ["You sound worn out. Have you been able to rest a little lately?", "Being tired makes everything heavier. What takes most of your energy right now?", "That's a lot. Can you give yourself a real break today, even a small one?"]],
      [/\b(exam\w*|test|homework|grades?|teacher|school|class|finals?)\b/i, ["School can put on a lot of pressure. What worries you the most?", "I'm listening. Is it one subject in particular, or everything at once?", "It clearly matters to you. How do you feel about it?"]],
      [/\b(fight|argu\w*|betray\w*|ignor\w*|blocked|made fun|teas\w*)\b/i, ["Ouch, it hurts when it goes like that. Want to tell me what was said?", "I understand why it gets to you. What do you wish had happened instead?", "That's hurtful. How do you feel now that it happened?"]],
      [/\b(happy|great|awesome|amazing|proud|won|passed|so good|excited)\b/i, ["Oh, that makes me happy{n}! Tell me everything, I want details.", "So good! What made you the proudest in all this?", "That's great to hear. How are you celebrating?"]],
      [/\b(bored|boring|nothing to do)\b/i, ["Being bored is the worst. If you could do anything right now, what would it be?", "I see. We can chat about something you love, or try a challenge in \"For you\". Up for it?", "What made you smile last time? We can start from there."]],
      [/\?\s*$/, ["Good question. Without internet and without my small AI, I can't answer it well right now. But tell me: what do you think?", "I'm in simple mode right now, so I can't look it up. What made you wonder about that?", "I'd rather not make up an answer. We'll look it up together once I'm back online. Meanwhile, why does it interest you?"]]
    ],
    any: ["I'm listening{n}. Tell me a bit more?", "Okay. And how do you feel about that?", "I understand. What matters most to you in this?", "Thanks for telling me. What happened next?", "Hmm, I see. What stays with you from all that?", "I'm here. Take your time, go on."],
    echo: t => `You said: "${t}". Tell me a bit more?`,
    severe: c => `I'm here with you. What you just said really matters, and you don't have to carry this without help. Please reach out now: ${c}. You can keep talking to me in the meantime.`,
    name: n => ` ${n}`
  },
  es: {
    rules: [
      [/^(hola|buenas|buenos días|buenas tardes|buenas noches|hey|qué tal)\b/i, ["¡Hola{n}! Me alegra verte. ¿Cómo te sientes ahora mismo?", "¡Hola{n}! Cuéntame, ¿qué tal tu día?", "¡Hey{n}! Aquí estoy. ¿De qué te apetece hablar?"]],
      [/\b(gracias)\b/i, ["Con gusto{n}. Aquí estoy cuando quieras.", "De nada. Me alegra estar aquí para ti.", "Claro, para eso están los amigos."]],
      [/\b(adiós|adios|hasta luego|hasta mañana|me voy|voy a dormir|chao)\b/i, ["Hasta pronto{n}. Cuídate, aquí estaré.", "Vale{n}. Vuelve y cuéntame cómo sigue.", "De acuerdo. Descansa, hablamos pronto."]],
      [/\b((me siento|estoy|muy|tan) sol[oa]|sin amigos|nadie me|excluid\w*|rechazad\w*|apartad\w*)\b/i, ["Sentirse apartado pesa mucho. Yo estoy aquí. ¿Quieres contarme qué pasó?", "Duele sentir que no hay nadie cerca. ¿Desde cuándo te sientes así?", "Te escucho. Importas, aunque ahora no lo parezca. Cuéntame más."]],
      [/\b(triste|deprim\w*|llor\w*|me siento vac[ií][oa]|desanimad\w*|me siento mal)\b/i, ["Siento que todo pese tanto ahora. Tienes derecho a sentirte así. ¿Qué es lo que más pesa?", "Suena muy difícil. Me quedo contigo. ¿Me cuentas un poco más?", "Gracias por decírmelo. ¿Llegó de golpe o lleva un tiempo?"]],
      [/\b(estr[eé]s\w*|ansi\w*|miedo|pánico|preocupad\w*|nervios\w*|agobiad\w*)\b/i, ["Es mucho que cargar. Respiremos juntos un momento. ¿Qué es lo que más miedo te da?", "Te entiendo, ese nudo en el estómago agota. ¿De qué se trata, sobre todo?", "Es normal tener miedo cuando algo importa. ¿Qué te ayudaría ahora mismo?"]],
      [/\b(enfadad\w*|enojad\w*|rabia|harto|harta|injusto|odio|frustrad\w*)\b/i, ["Tienes derecho a estar enfadado. ¿Qué pasó?", "Creo que a mí también me habría molestado. Cuéntamelo todo desde el principio.", "Noto que hierve por dentro. ¿Qué es lo peor de todo esto?"]],
      [/\b(cansad\w*|agotad\w*|tengo sueño|insomnio|no duermo|no puedo dormir)\b/i, ["Suenas sin fuerzas. ¿Has podido descansar un poco estos días?", "El cansancio lo vuelve todo más pesado. ¿Qué te quita más energía ahora?", "Es mucho. ¿Puedes darte un descanso de verdad hoy, aunque sea pequeño?"]],
      [/\b(examen\w*|deberes|tarea|notas?|profe\w*|colegio|escuela|instituto|clase)\b/i, ["La escuela puede meter mucha presión. ¿Qué es lo que más te preocupa?", "Te escucho. ¿Es una materia en concreto o todo a la vez?", "Se nota que te importa. ¿Cómo te sientes con eso?"]],
      [/\b(pelea\w*|discut\w*|traicion\w*|ignor\w*|bloque\w*|burl\w*)\b/i, ["Ay, duele cuando pasa así. ¿Quieres contarme qué se dijo?", "Entiendo que te afecte. ¿Qué te habría gustado que pasara?", "Eso hiere. ¿Cómo te sientes ahora?"]],
      [/\b(feliz|content\w*|genial|increíble|orgullos\w*|gané|aprobé|emocionad\w*)\b/i, ["¡Qué alegría{n}! Cuéntamelo todo, quiero detalles.", "¡Genial! ¿Qué es lo que más orgullo te dio?", "Qué bien suena eso. ¿Cómo lo celebras?"]],
      [/\b(aburrid\w*|nada que hacer)\b/i, ["Aburrirse es lo peor. Si pudieras hacer cualquier cosa ahora, ¿qué sería?", "Ya veo. Podemos hablar de algo que te guste o probar un reto en «Para ti». ¿Te animas?", "¿Qué te hizo sonreír la última vez? Podemos empezar por ahí."]],
      [/\?\s*$/, ["Buena pregunta. Sin internet y sin mi pequeña IA no puedo responderla bien ahora. Pero dime: ¿tú qué piensas?", "Ahora estoy en modo simple y no puedo buscarlo. ¿Qué te hizo preguntártelo?", "Prefiero no inventar una respuesta. La buscamos juntos cuando vuelva internet. Mientras, ¿por qué te interesa?"]]
    ],
    any: ["Te escucho{n}. ¿Me cuentas un poco más?", "Vale. ¿Y cómo te sientes con eso?", "Entiendo. ¿Qué es lo que más te importa de todo esto?", "Gracias por contármelo. ¿Qué pasó después?", "Mmm, ya veo. ¿Y tú con qué te quedas de todo eso?", "Aquí estoy. Tómate tu tiempo, sigue."],
    echo: t => `Dices: «${t}». ¿Me cuentas un poco más?`,
    severe: c => `Estoy aquí contigo. Lo que acabas de decir es muy importante, y no tienes que cargar con esto sin ayuda. Por favor, contacta ahora con ${c}. Puedes seguir hablándome mientras tanto.`,
    name: n => ` ${n}`
  }
};

let lastHeart = "";
// A simple reply with no AI at all. `n` is the number of the message in the conversation,
// so that the same sentence doesn't come back twice in a row.
export function heartReply(text, { name = "", n = 0, severe = false, crisis = "" } = {}) {
  const H = HEART[LANG.code] || HEART.en;
  if (severe) return H.severe(crisis);
  const t = String(text || "").trim();
  let pool = H.any;
  for (const [re, replies] of H.rules) if (re.test(t)) { pool = replies; break; }
  // Now and then, give the person's own words back: it shows they were heard.
  if (pool === H.any && n % 3 === 2 && t.length > 12 && t.length < 90 && !/[?"«»]/.test(t)) pool = [H.echo(t.replace(/[.!…]+$/, ""))];
  let pick = pool[n % pool.length];
  if (pick === lastHeart) pick = pool[(n + 1) % pool.length];
  lastHeart = pick;
  return pick.replace("{n}", name && n % 2 === 0 ? H.name(name) : "");
}

/* ---------- Notebook of things already looked up ---------- */
const KNOW = "friend.know", MAX_KNOW = 40;
const norm = q => String(q || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
function readKnow() { try { return JSON.parse(localStorage.getItem(KNOW)) || []; } catch { return []; } }
export function remember(query, found) {
  if (!found?.extract) return;
  const key = LANG.code + ":" + norm(query);
  const list = readKnow().filter(x => x.k !== key);
  list.unshift({ k: key, title: found.title, extract: found.extract.slice(0, 700), url: found.url });
  try { localStorage.setItem(KNOW, JSON.stringify(list.slice(0, MAX_KNOW))); } catch {}
}
export function recall(query) {
  const key = LANG.code + ":" + norm(query);
  const list = readKnow();
  const hit = list.find(x => x.k === key)
    // The same subject asked with other words ("c'est quoi un volcan" / "explique-moi les volcans").
    || list.find(x => x.k.startsWith(LANG.code + ":") && norm(x.title).length > 3 && key.includes(norm(x.title)));
  // Then the knowledge pack, when it was downloaded.
  return hit ? { title: hit.title, extract: hit.extract, url: hit.url, saved: true } : packFind(query);
}
export function knownCount() { return readKnow().length; }
export function forgetKnown() { try { localStorage.removeItem(KNOW); } catch {} }
