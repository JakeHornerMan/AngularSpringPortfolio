// Suminagashi as maths: ink lines are contours of a "drop potential" (rings around each ink drop that
// merge into each other), pushed around by slow layered noise so they fold into long flowing waves.
// Each line swells and pinches along its length, like ink stretched and bunched on the water.

export const MAX_DROPS = 4;

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
uniform float uSeed;
// Intro reveal: rings whose (time-independent) line number is below uReveal fade out, each over
// uRevealFade lines, so the sheet dissolves ring by ring from the centre outward. -1e9 = off.
uniform float uReveal;
uniform float uRevealFade;

const float DRIFT = 0.035; // lines per second the rings drift outward

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21) + uSeed);
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash1(float n) {
  return fract(sin(n * 12.9898 + uSeed * 78.233) * 43758.5453);
}

// Smooth value noise in [0, 1].
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
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

  // Drop potential: rings around each drop that merge into wavy contours between drops.
  float pot = 0.0;
  float nearest = 1e5;
  for (int i = 0; i < MAX_DROPS; i++) {
    vec4 drop = uDrops[i];
    if (drop.z <= 0.0) continue;
    vec2 c = drop.xy + 40.0 * vec2(sin(t * 0.03 + drop.w), cos(t * 0.025 + drop.w * 1.7));
    // Squashed distance: drops spread into stretched ellipses along the current, not circles.
    float d = length((w - c) * vec2(0.72, 1.25));
    pot += drop.z * pow(d + 30.0, 0.8);
    nearest = min(nearest, d);
  }
  // Lines drift slowly outward from the drops, as new ink keeps spreading.
  float v = pot / uSpacing - t * DRIFT;

  float edge = floor(v + 0.5);
  // True gradient length (smoother than fwidth's |dx| + |dy|) gives a steady pixel distance.
  float grad = max(length(vec2(dFdx(v), dFdy(v))), 1e-4);
  float dist = abs(v - edge) / grad;  // device px to this line's centre

  // Each line has its own weight: mostly hairlines, some medium, a few bold...
  float tier = hash1(mod(edge, 997.0));
  float base = tier < 0.4 ? mix(0.7, 1.2, tier / 0.4)
             : tier < 0.75 ? mix(1.8, 3.2, (tier - 0.4) / 0.35)
             : mix(4.5, 8.5, (tier - 0.75) / 0.25);
  // ...and swells and pinches slowly along its length.
  float swell = noise(w * 0.004 + vec2(edge * 3.17, edge * 1.31) + t * 0.006);
  float thickness = base * (0.35 + 1.2 * swell) * uDpr;

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

// Same field as the shader without the warp, for finding the range of line numbers on screen.
export function linePotential(x: number, y: number, drops: Float32Array, dropCount: number): number {
  let pot = 0;
  for (let i = 0; i < dropCount; i++) {
    const weight = drops[i * 4 + 2];
    if (weight <= 0) continue;
    const dx = (x - drops[i * 4]) * 0.72;
    const dy = (y - drops[i * 4 + 1]) * 1.25;
    pot += weight * Math.pow(Math.hypot(dx, dy) + 30, 0.8);
  }
  return pot;
}
