// Cheap, deterministic "floating ink" noise built from layered sines.
// Shared by the ink-field canvas and the intro sweep so both ripple the same way.

export interface InkNoise {
  (x: number, y: number, t: number): number;
}

// Picked once per page load: the ink pattern is new on every reload but stays the same while
// moving between pages, and the background and transition curtain share it so their rings line up.
export const SESSION_SEED = 1 + Math.floor(Math.random() * 1000000);

// Small seeded PRNG (mulberry32) so a given seed always draws the same marbling.
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns a noise function in roughly [-1, 1].
export function createInkNoise(seed: number): InkNoise {
  const rand = seededRandom(seed);
  const layers = [1, 2.1, 4.3].map((freq, i) => ({
    fx: freq * (0.8 + rand() * 0.4),
    fy: freq * (0.8 + rand() * 0.4),
    px: rand() * Math.PI * 2,
    py: rand() * Math.PI * 2,
    speed: (0.25 + rand() * 0.35) * (i % 2 ? -1 : 1),
    amp: 1 / (i + 1),
  }));
  const total = layers.reduce((sum, l) => sum + l.amp, 0);

  return (x, y, t) => {
    let v = 0;
    for (const l of layers) {
      v += l.amp * Math.sin(x * l.fx + l.px + t * l.speed + Math.sin(y * l.fy * 0.7 + l.py));
    }
    return v / total;
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && !!window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
