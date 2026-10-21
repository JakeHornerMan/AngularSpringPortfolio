// Suminagashi as maths: ink lines are contours of a "drop potential" (rings around each ink drop that
// merge into each other), pushed around by slow layered noise so they fold into long flowing waves.
// Each line swells and pinches along its length, like ink stretched and bunched on the water.

export const MAX_DROPS = 4;
// Side of the random-value texture the shader's noise reads (a power of two).
export const NOISE_SIZE = 256;

// Shared with fieldPotential() below, which has to match the shader's field.
const DRIFT = 0.22;       // new rings per second each drop sends outward
const MERGE = 70;         // px: how softly neighbouring drops' rings blend where they meet

export const INK_VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const INK_FRAGMENT_SHADER = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

#define MAX_DROPS ${MAX_DROPS}

uniform vec2 uRes;       // CSS pixels
uniform float uDpr;
uniform float uTime;     // seconds
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec4 uDrops[MAX_DROPS]; // centre.xy (CSS px), weight, drift phase (weight 0 = unused)
uniform float uSpacing;  // potential units between neighbouring lines
// Intro reveal: rings whose (time-independent) line number is below uReveal fade out, each over
// uRevealFade lines, so the sheet dissolves ring by ring from the centre outward. -1e9 = off.
uniform float uReveal;
uniform float uRevealFade;

const float DRIFT = ${DRIFT.toFixed(3)};
const float MERGE = ${MERGE.toFixed(1)};

// NOISE_SIZE x NOISE_SIZE random values (seeded per page load), read texel by texel.
uniform sampler2D uNoise;

const float NOISE_SIZE = ${NOISE_SIZE.toFixed(1)};

// Random value in [0, 1] for a whole-numbered lattice point, looked up rather than computed. Phone GPUs
// may run shader maths at lower precision than asked, and a computed hash then gives neighbouring noise
// cells different values for the corner they share, tearing the sheet into seams. A texel lookup gives
// the same value for the same corner on every GPU. (mod by a power of two is exact at any precision.)
float hash(vec2 i) {
  return texture2D(uNoise, (mod(i, NOISE_SIZE) + 0.5) / NOISE_SIZE).r;
}

float hash1(float n) {
  return hash(vec2(n, 7.0));
}

// Smooth value noise in [0, 1].
float noise(vec2 p) {
  vec2 i = floor(p);
  // Not fract(p): some GPUs round that differently from floor(), so a pixel on a cell edge gets the wrong cell.
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = turn * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float t = uTime;

  // Two levels of slowly drifting domain warp fold the rings into long waves.
  // Low frequencies only, so the curves stay long and smooth rather than lumpy.
  vec2 s = p * 0.0011;
  vec2 q = vec2(fbm(s + vec2(0.0, t * 0.018)), fbm(s + vec2(5.2, 1.3) - t * 0.014));
  // Kept below the strength where the water would fold over itself and crease the lines.
  vec2 r = vec2(fbm(s + 2.4 * q + vec2(1.7, 9.2) + t * 0.011), fbm(s + 2.4 * q + vec2(8.3, 2.8) - t * 0.013));
  vec2 w = p + 320.0 * (r - 0.5) + 120.0 * (q - 0.5);
  // A current running across the sheet stretches the rings into long S-shaped flows.
  w.x += 150.0 * sin(w.y * 0.0026 + t * 0.05);
  w.y += 60.0 * sin(w.x * 0.0021 - t * 0.04);

  // Drop potential: a smooth minimum of the distance to each drop, so every drop is its own source
  // of rings, and where neighbouring drops' rings meet they merge into shared waves.
  float scaled[MAX_DROPS];
  float closest = 1e9;
  float nearest = 1e5;
  for (int i = 0; i < MAX_DROPS; i++) {
    vec4 drop = uDrops[i];
    scaled[i] = 1e9;
    if (drop.z <= 0.0) continue;
    vec2 c = drop.xy + 40.0 * vec2(sin(t * 0.03 + drop.w), cos(t * 0.025 + drop.w * 1.7));
    // Squashed distance: drops spread into stretched ellipses along the current, not circles.
    // A heavier drop (larger weight) spreads further, so its rings are wider.
    float d = length((w - c) * vec2(0.72, 1.25));
    scaled[i] = d / drop.z / MERGE;
    closest = min(closest, scaled[i]);
    nearest = min(nearest, d);
  }
  // Summed relative to the closest drop, so every exp() is between e^-15 and 1. The raw terms get as
  // small as e^-35, which some phone GPUs get wrong, breaking the sheet into dotted seams.
  float sum = 0.0;
  for (int i = 0; i < MAX_DROPS; i++) {
    if (uDrops[i].z > 0.0) sum += exp(max(closest - scaled[i], -15.0));
  }
  float spread = MERGE * (closest - log(sum));
  float pot = pow(max(spread, 0.0) + 30.0, 0.8);
  // Lines drift slowly outward from the drops, as new ink keeps spreading.
  float v = pot / uSpacing - t * DRIFT;

  float edge = floor(v + 0.5);
  // True gradient length (smoother than fwidth's |dx| + |dy|) gives a steady pixel distance.
  float grad = max(length(vec2(dFdx(v), dFdy(v))), 1e-4);
  float dist = abs(v - edge) / grad;  // device px to this line's centre

  // Each line has its own random weight, from hairline up to a broad band of ink. The cube keeps
  // most lines fine, so the few heavy ones stand out...
  float tier = hash1(edge);
  float base = mix(0.6, 42.0, pow(tier, 5.0));
  // ...and swells and pinches slowly along its length.
  // (mod keeps the offset small: lines drift outward forever, so edge keeps growing.)
  float lane = mod(edge, 64.0);
  float swell = noise(w * 0.004 + vec2(lane * 3.17, lane * 1.31) + t * 0.006);
  // Capped at 65% of the gap to the next line (1 / grad device px), so neighbours never merge.
  float thickness = min(base * (0.35 + 1.2 * swell) * uDpr, 0.65 / grad);

  // Lines are never drawn thinner than one device pixel: a thinner line would land between pixels
  // and blink as it drifts, so it's drawn 1px wide and lighter instead (same amount of ink).
  float drawn = max(thickness, 1.0);
  float ink = (1.0 - smoothstep(drawn * 0.5 - 0.5, drawn * 0.5 + 0.5, dist)) * (thickness / drawn);
  // Very close to a drop's centre the rings are tiny; fade them in.
  ink *= smoothstep(4.0, 18.0, nearest);

  // Each ring (a line plus half the water either side) fades as one piece during the reveal.
  float ring = edge + t * DRIFT;
  float alpha = 1.0 - clamp((uReveal - ring) / uRevealFade, 0.0, 1.0);

  vec3 color = mix(uPaper, uInk, ink * 0.92);
  gl_FragColor = vec4(color * alpha, alpha); // premultiplied
}
`;

// Same field as the shader without the warp or the drops' wander, for finding the range of line
// numbers on screen.
export function fieldPotential(x: number, y: number, drops: Float32Array, dropCount: number): number {
  let sum = 0;
  for (let i = 0; i < dropCount; i++) {
    const weight = drops[i * 4 + 2];
    if (weight <= 0) continue;
    const dx = (x - drops[i * 4]) * 0.72;
    const dy = (y - drops[i * 4 + 1]) * 1.25;
    sum += Math.exp(-(Math.hypot(dx, dy) / weight) / MERGE);
  }
  const spread = -MERGE * Math.log(Math.max(sum, 1e-30));
  return Math.pow(Math.max(spread, 0) + 30, 0.8);
}
