// Friend's original avatars, drawn in SVG. Colors come from CSS variables, so the
// chosen color (and day/night theme) applies everywhere.
export const COLORS = { sun: "#ffc23a", bubble: "#ff8fb1", mint: "#3ddc97", sky: "#6cc7ff", grape: "#b48cff", peach: "#ffab76" };

const SHAPES = {
  round: { body: '<circle cx="50" cy="54" r="38"/>', fy: 54, s: 1, crown: 16, bow: [74, 24], hp: 54 },
  cloud: { body: '<circle cx="33" cy="60" r="20"/><circle cx="54" cy="46" r="25"/><circle cx="72" cy="62" r="18"/><rect x="16" y="58" width="70" height="26" rx="13"/>', fy: 62, s: 1, crown: 21, bow: [72, 30], hp: 60 },
  star: { body: '<polygon class="av-soft" points="50,13 61.8,38.8 89.9,42 69,61.2 74.7,89 50,75 25.3,89 31,61.2 10.1,42 38.2,38.8"/>', fy: 57, s: .78, crown: 11, bow: [68, 30], hp: 56 },
  cat: { body: '<polygon class="av-soft" points="22,44 25,14 46,30"/><polygon class="av-soft" points="78,44 75,14 54,30"/><circle cx="50" cy="57" r="33"/>', extra: '<polygon class="av-cheek" points="29,35 30,24 38,31"/><polygon class="av-cheek" points="71,35 70,24 62,31"/>', fy: 59, s: .95, crown: 24, bow: [70, 30], hp: 57 },
  bear: { body: '<circle cx="27" cy="29" r="13"/><circle cx="73" cy="29" r="13"/><circle cx="50" cy="57" r="34"/>', extra: '<circle class="av-cheek" cx="27" cy="29" r="6"/><circle class="av-cheek" cx="73" cy="29" r="6"/>', fy: 59, s: .95, crown: 23, bow: [50, 22], hp: 57 },
  ghost: { body: '<path class="av-soft" d="M20 86 V50 A30 30 0 0 1 80 50 V86 L70 78 L60 86 L50 78 L40 86 L30 78 Z"/>', fy: 52, s: 1, crown: 19, bow: [72, 26], hp: 52 },
  drop: { body: '<path class="av-soft" d="M50 10 C50 10 18 46 18 62 A32 32 0 0 0 82 62 C82 46 50 10 50 10 Z"/>', fy: 64, s: .95, crown: 32, bow: [64, 32], hp: 62 },
  robot: { body: '<rect x="18" y="30" width="64" height="54" rx="16"/><rect x="47" y="15" width="6" height="16" rx="3"/><circle cx="50" cy="14" r="6"/><rect x="10" y="48" width="10" height="18" rx="4"/><rect x="80" y="48" width="10" height="18" rx="4"/>', fy: 57, s: 1, crown: 30, bow: [74, 34], hp: 57 }
};

function face(y, s, expr = "smile") {
  const ex = 10 * s, ey = y - 4 * s, r = 4.6 * s;
  const L = (x1, y1, x2, y2) => `M${x1} ${y1} L${x2} ${y2}`;
  const mouths = {
    smile: `M${50 - 9 * s} ${y + 4 * s} Q50 ${y + 13 * s} ${50 + 9 * s} ${y + 4 * s}`,
    happy: `M${50 - 10 * s} ${y + 3 * s} Q50 ${y + 17 * s} ${50 + 10 * s} ${y + 3 * s} Z`,
    care: `M${50 - 6 * s} ${y + 8 * s} Q50 ${y + 5 * s} ${50 + 6 * s} ${y + 8 * s}`,
    think: `M${50 - 5 * s} ${y + 7 * s} L${50 + 6 * s} ${y + 6 * s}`
  };
  const brows = expr === "care" ? `<path class="av-line" style="stroke-width:${2.6 * s}" d="${L(50 - ex - 5 * s, ey - 8 * s, 50 - ex + 4 * s, ey - 10 * s)} ${L(50 + ex - 4 * s, ey - 10 * s, 50 + ex + 5 * s, ey - 8 * s)}"/>`
    : expr === "think" ? `<path class="av-line" style="stroke-width:${2.6 * s}" d="${L(50 + ex - 5 * s, ey - 11 * s, 50 + ex + 5 * s, ey - 9 * s)}"/>` : "";
  return `<g class="av-face"><circle class="av-cheek" cx="${50 - 18 * s}" cy="${y + 5 * s}" r="${5 * s}"/><circle class="av-cheek" cx="${50 + 18 * s}" cy="${y + 5 * s}" r="${5 * s}"/>`
    + `<g class="av-eyes"><circle class="av-ink" cx="${50 - ex}" cy="${ey}" r="${r}"/><circle class="av-ink" cx="${50 + ex}" cy="${ey}" r="${r}"/>`
    + `<circle class="av-hl" cx="${50 - ex + 1.6 * s}" cy="${ey - 1.6 * s}" r="${1.5 * s}"/><circle class="av-hl" cx="${50 + ex + 1.6 * s}" cy="${ey - 1.6 * s}" r="${1.5 * s}"/></g>`
    + brows + `<path class="av-line av-mouth${expr === "happy" ? " av-open" : ""}" style="stroke-width:${4 * s}" d="${mouths[expr] || mouths.smile}"/></g>`;
}

function accessory(a, sh) {
  const s = sh.s, ey = sh.fy - 4 * s, ex = 10 * s, lr = 8.5 * s;
  if (a === "glasses") return `<circle class="av-lens" cx="${50 - ex}" cy="${ey}" r="${lr}"/><circle class="av-lens" cx="${50 + ex}" cy="${ey}" r="${lr}"/><path class="av-frame" d="M${50 - ex + lr} ${ey} H${50 + ex - lr}"/>`;
  if (a === "bow") { const [x, y] = sh.bow; return `<g transform="translate(${x} ${y}) rotate(-18)"><path class="av-acc" d="M0 0 L-12 -8 L-12 8 Z M0 0 L12 -8 L12 8 Z"/><circle class="av-acc" r="3.5"/></g>`; }
  if (a === "headphones") { const c = sh.hp; return `<path class="av-frame" style="stroke-width:5" d="M13 ${c} A37 37 0 0 1 87 ${c}"/><rect class="av-acc" x="6" y="${c - 10}" width="12" height="22" rx="6"/><rect class="av-acc" x="82" y="${c - 10}" width="12" height="22" rx="6"/>`; }
  if (a === "cap") { const b = sh.crown + 6; return `<path class="av-acc" d="M33 ${b} Q33 ${b - 17} 50 ${b - 17} Q67 ${b - 17} 67 ${b} Z"/><path class="av-acc" d="M60 ${b} L80 ${b} Q82 ${b + 4} 76 ${b + 4} L60 ${b + 3} Z"/><circle class="av-hl" cx="50" cy="${b - 16}" r="2.4"/>`; }
  if (a === "flower") { const [x, y] = sh.bow; let f = ""; for (let i = 0; i < 5; i++) { const t = i * 72 * Math.PI / 180; f += `<circle cx="${(x + Math.cos(t) * 6).toFixed(1)}" cy="${(y + Math.sin(t) * 6).toFixed(1)}" r="4.6" fill="#ffffff" stroke="#f3b6c8" stroke-width="1"/>`; } return f + `<circle cx="${x}" cy="${y}" r="4" fill="#ffd23f"/>`; }
  if (a === "halo") { const y = sh.crown - 4; return `<ellipse cx="50" cy="${y}" rx="17" ry="5" fill="none" stroke="#ffd23f" stroke-width="4"/>`; }
  if (a === "crown") { const b = sh.crown + 4; return `<path class="av-gold" d="M35 ${b} L35 ${b - 14} L42.5 ${b - 7} L50 ${b - 17} L57.5 ${b - 7} L65 ${b - 14} L65 ${b} Z"/>`; }
  return "";
}

export function avatarSVG(shape = "round", acc = "none", glow = true, expr = "smile") {
  const sh = SHAPES[shape] || SHAPES.round;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${glow ? '<circle class="av-glow" cx="50" cy="54" r="49"/>' : ""}<g class="av-body">${sh.body}</g>${sh.extra || ""}${face(sh.fy, sh.s, expr)}${accessory(acc, sh)}</svg>`;
}

// Accessories earned in Focus mode, with the stars each one needs.
export const UNLOCKS = [{ acc: "cap", stars: 5 }, { acc: "flower", stars: 15 }, { acc: "halo", stars: 30 }];
