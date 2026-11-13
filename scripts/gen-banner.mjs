// Generates a blueprint-style animated SVG banner for a GitHub profile README.
// Usage: node gen-banner.mjs <out.svg>
import fs from 'node:fs';

const W = 1200;
const H = 300;
const INK = '#e6f0ff';
const DIM = 'rgba(230,240,255,0.55)';
const FAINT = 'rgba(230,240,255,0.28)';
const ACCENT = '#7fd4ff';

const f = (n) => Number(n.toFixed(2));

// Spur gear outline: trapezoid teeth between root and tip circles.
function gear(cx, cy, teeth, rRoot, rTip) {
  const step = (2 * Math.PI) / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const p = (r, t) => [f(cx + r * Math.cos(a + t * step)), f(cy + r * Math.sin(a + t * step))];
    pts.push(p(rRoot, 0), p(rRoot, 0.12), p(rTip, 0.28), p(rTip, 0.52), p(rRoot, 0.68), p(rRoot, 1));
  }
  return 'M' + pts.map((q) => q.join(',')).join('L') + 'Z';
}

// Two meshing gears: same module, pitch radii proportional to tooth count.
const m = 5; // pitch radius per tooth / 2 ≈ size of a tooth
const g1 = {cx: 150, cy: 150, z: 18};
const g2 = {z: 10};
const r1 = (m * g1.z) / 2;
const r2 = (m * g2.z) / 2;
const ang = (-35 * Math.PI) / 180;
g2.cx = f(g1.cx + (r1 + r2) * Math.cos(ang));
g2.cy = f(g1.cy + (r1 + r2) * Math.sin(ang));
const gearPath = (g, r) => gear(g.cx, g.cy, g.z, r - m * 0.62, r + m * 0.5);
const T1 = 18; // seconds per revolution of the big gear
const T2 = (T1 * g2.z) / g1.z;
// Starting angles so they mesh: in gear(), a tooth is centred at 0.40 of each pitch
// step and a gap at 0.90. Put a big-gear tooth on the line of centres and a
// small-gear gap facing it. Both then turn at speeds in the tooth ratio, so they stay meshed.
const deg = (r) => (r * 180) / Math.PI;
const phase1 = f(deg(ang) - 0.4 * (360 / g1.z));
const phase2 = f(deg(ang) + 180 - 0.9 * (360 / g2.z));

// Circuit traces on the right, each with a travelling pulse.
const traces = [
  "M995,50 H1050 L1070,70 H1104",
  "M995,95 H1040 L1055,110 H1104",
  "M1104,150 H1060 L1040,170 V205 H990",
  "M1176,90 H1188",
  "M1140,60 V40 H1180",
  "M1176,130 H1188",
  "M1140,170 V205 H1100",
];

// Engineering-drawing zone marks along the frame.
const zones = [];
for (let i = 0; i < 6; i++) {
  const x = 20 + ((W - 40) / 6) * (i + 0.5);
  zones.push(`<text x="${f(x)}" y="17" class="zone">${i + 1}</text>`);
  if (i) zones.push(`<line x1="${f(20 + ((W - 40) / 6) * i)}" y1="12" x2="${f(20 + ((W - 40) / 6) * i)}" y2="20" class="thin"/>`);
}
['A', 'B', 'C'].forEach((l, i) => {
  const y = 20 + ((H - 40) / 3) * (i + 0.5);
  zones.push(`<text x="16" y="${f(y + 3)}" class="zone">${l}</text>`);
});

const nameX = 290;
const nameW = 620;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Andriy Kravchenko</title>
<desc id="d">Blueprint-style banner: Andriy Kravchenko, engineering student at Trinity College Dublin, mechatronics at Formula Trinity. Two meshing gears on the left and a circuit board on the right.</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#11407a"/>
    <stop offset="1" stop-color="#0a2a52"/>
  </linearGradient>
  <pattern id="minor" width="10" height="10" patternUnits="userSpaceOnUse">
    <path d="M10 0H0V10" fill="none" stroke="rgba(230,240,255,0.06)" stroke-width="1"/>
  </pattern>
  <pattern id="major" width="50" height="50" patternUnits="userSpaceOnUse">
    <rect width="50" height="50" fill="url(#minor)"/>
    <path d="M50 0H0V50" fill="none" stroke="rgba(230,240,255,0.12)" stroke-width="1"/>
  </pattern>
  <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
    <path d="M0,1 L10,5 L0,9 Z" fill="${DIM}"/>
  </marker>
  <radialGradient id="glow">
    <stop offset="0" stop-color="${ACCENT}" stop-opacity="1"/>
    <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
  </radialGradient>
</defs>
<style>
  text { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace; }
  .thin { stroke: ${FAINT}; stroke-width: 1; fill: none; }
  .line { stroke: ${DIM}; stroke-width: 1; fill: none; }
  .zone { fill: ${FAINT}; font-size: 10px; text-anchor: middle; }
  .name { font-size: 60px; font-weight: 700; fill: ${INK}; fill-opacity: 0; stroke: ${INK}; stroke-width: 1.2;
          stroke-dasharray: 420; stroke-dashoffset: 420;
          animation: draw 2.6s ease-out 0.3s forwards, fillin 0.9s ease-out 2.4s forwards; }
  .sub { font-size: 15px; fill: ${INK}; letter-spacing: 3px; opacity: 0; animation: fade 0.8s ease-out forwards; }
  .note { font-size: 11px; fill: ${DIM}; letter-spacing: 1.5px; }
  .dim { opacity: 0; animation: fade 0.6s ease-out 1.2s forwards; }
  .gear { fill: none; stroke: ${INK}; stroke-width: 1.4; }
  .g1 { transform-origin: ${g1.cx}px ${g1.cy}px; animation: spin ${T1}s linear infinite; }
  .g2 { transform-origin: ${g2.cx}px ${g2.cy}px; animation: spin ${f(T2)}s linear infinite reverse; }
  .trace { fill: none; stroke: ${DIM}; stroke-width: 1.4; stroke-dasharray: 300; stroke-dashoffset: 300; animation: draw 1.6s ease-out 0.6s forwards; }
  .pad { fill: #0d3566; stroke: ${INK}; stroke-width: 1.2; }
  .chip { fill: #0d3566; stroke: ${INK}; stroke-width: 1.4; }
  .cell { fill: none; stroke: ${DIM}; stroke-width: 1; }
  .cellk { font-size: 8px; fill: ${FAINT}; letter-spacing: 1px; }
  .cellv { font-size: 11px; fill: ${INK}; letter-spacing: 1px; }
  .blink { animation: blink 1.1s steps(1) infinite; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes fillin { to { fill-opacity: 1; stroke-opacity: 0.35; } }
  @keyframes fade { to { opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .name { fill-opacity: 1; stroke-dashoffset: 0; stroke-opacity: 0.35; }
    .sub, .dim { opacity: 1; }
    .trace { stroke-dashoffset: 0; }
    .pulse { display: none; }
  }
</style>

<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#major)"/>

<!-- drawing frame -->
<rect x="8" y="8" width="${W - 16}" height="${H - 16}" class="thin"/>
<rect x="20" y="20" width="${W - 40}" height="${H - 40}" class="line"/>
${zones.join('\n')}

<!-- gears -->
<g>
  <line x1="${g1.cx - 85}" y1="${g1.cy}" x2="${g1.cx + 85}" y2="${g1.cy}" class="thin" stroke-dasharray="12 4 2 4"/>
  <line x1="${g1.cx}" y1="${g1.cy - 85}" x2="${g1.cx}" y2="${g1.cy + 85}" class="thin" stroke-dasharray="12 4 2 4"/>
  <circle cx="${g1.cx}" cy="${g1.cy}" r="${f(r1)}" class="thin" stroke-dasharray="3 3"/>
  <g transform="rotate(${phase1} ${g1.cx} ${g1.cy})"><g class="g1">
    <path d="${gearPath(g1, r1)}" class="gear"/>
    <circle cx="${g1.cx}" cy="${g1.cy}" r="9" class="gear"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i * Math.PI) / 3;
      return `<circle cx="${f(g1.cx + 19 * Math.cos(a))}" cy="${f(g1.cy + 19 * Math.sin(a))}" r="3.5" class="gear"/>`;
    }).join('')}
  </g></g>
  <g transform="rotate(${phase2} ${g2.cx} ${g2.cy})"><g class="g2">
    <path d="${gearPath(g2, r2)}" class="gear"/>
    <circle cx="${g2.cx}" cy="${g2.cy}" r="5" class="gear"/>
  </g></g>
</g>

<!-- name with dimension line -->
<g class="dim">
  <line x1="${nameX}" y1="70" x2="${nameX}" y2="96" class="line"/>
  <line x1="${nameX + nameW}" y1="70" x2="${nameX + nameW}" y2="96" class="line"/>
  <line x1="${nameX + 2}" y1="78" x2="${nameX + nameW - 2}" y2="78" class="line" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <rect x="${nameX + nameW / 2 - 92}" y="70" width="184" height="16" fill="#0f3a70"/>
  <text x="${nameX + nameW / 2}" y="82" class="note" text-anchor="middle">TRINITY COLLEGE DUBLIN</text>
</g>
<text x="${nameX}" y="150" textLength="${nameW}" lengthAdjust="spacingAndGlyphs" class="name">ANDRIY KRAVCHENKO</text>
<text x="${nameX}" y="190" class="sub" style="animation-delay:2.6s">ENGINEERING STUDENT · M.A.I.</text>
<text x="${nameX}" y="216" class="sub" style="animation-delay:3.0s">MECHATRONICS @ FORMULA TRINITY<tspan class="blink" fill="${ACCENT}">_</tspan></text>

<!-- circuit -->
<g>
  ${traces.map((d, i) => `<path id="tr${i}" d="${d}" class="trace" style="animation-delay:${f(0.6 + i * 0.15)}s"/>`).join('\n  ')}
  <rect x="1110" y="60" width="60" height="110" rx="3" class="chip"/>
  ${[0, 1, 2, 3, 4].map((i) => `<line x1="1104" y1="${70 + i * 20}" x2="1110" y2="${70 + i * 20}" class="line"/><line x1="1170" y1="${70 + i * 20}" x2="1176" y2="${70 + i * 20}" class="line"/>`).join('')}
  <text x="1140" y="112" class="note" text-anchor="middle" fill="${INK}">MCU</text>
  <text x="1140" y="128" class="note" text-anchor="middle" font-size="8">FT-AUTO</text>
  ${[[995, 50], [995, 95], [990, 205], [1180, 40], [1100, 205]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" class="pad"/>`).join('')}
  ${traces.slice(0, 3).map((_, j) => {
    const id = j;
    return `<circle r="7" fill="url(#glow)" class="pulse"><animateMotion dur="${2.4 + j * 0.7}s" begin="${2 + j * 0.5}s" repeatCount="indefinite"><mpath href="#tr${id}"/></animateMotion></circle>`;
  }).join('\n  ')}
</g>

<!-- title block -->
<g transform="translate(${W - 20 - 230}, ${H - 20 - 44})">
  <rect width="230" height="44" class="cell"/>
  <line x1="150" y1="0" x2="150" y2="44" class="cell"/>
  <text x="8" y="14" class="cellk">DRAWN BY</text><text x="8" y="33" class="cellv">A. KRAVCHENKO</text>
  <text x="158" y="14" class="cellk">SHEET</text><text x="158" y="33" class="cellv">1 / 1</text>
</g>
<text x="32" y="${H - 30}" class="note">GITHUB.COM/KRAVCHENKOCODES</text>
</svg>
`;

fs.writeFileSync(process.argv[2], svg);
console.log('wrote', process.argv[2], svg.length, 'bytes');
