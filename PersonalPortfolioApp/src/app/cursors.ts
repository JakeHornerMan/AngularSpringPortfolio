// The animated hourglass from the Smooth Classic cursor set (by Vlasta, CC BY; see styles.css).
// Browsers can't play animated .ani cursors, so its frames were exported as PNGs and are swapped
// here by updating the --cursor-busy custom property, which `html.cursor-busy` applies everywhere.

const FRAMES = Array.from({ length: 11 }, (_, i) => `/assets/cursors/SmoothHourglass-${i}.png`);
// The original timing: the sand runs for seven slow frames, then the glass flips in four quick ones.
const DELAYS = [250, 250, 250, 250, 250, 250, 583, 83, 83, 83, 83];
const HOTSPOT = '24 24';  // frames are 48px (1.5x the original)

let preloaded = false;
let stopCurrent: (() => void) | null = null;

// Plays one full turn of the hourglass, sped up to fit `durationMs` (a window growing or shrinking).
export function playBusyCursor(durationMs: number): void {
  const total = DELAYS.reduce((sum, d) => sum + d, 0);
  run(durationMs / total, false);
}

// Keeps the hourglass turning at its original speed until the returned function is called
// (the page-transition curtain, for as long as it's showing).
export function startBusyCursor(): () => void {
  return run(1, true);
}

function run(speed: number, loop: boolean): () => void {
  if (typeof document === 'undefined') return () => {};
  if (!preloaded) {
    FRAMES.forEach(src => new Image().src = src);
    preloaded = true;
  }
  stopCurrent?.();

  const root = document.documentElement;
  let frame = 0;
  let timer = 0;
  const show = () => {
    root.style.setProperty('--cursor-busy', `url('${FRAMES[frame]}') ${HOTSPOT}, wait`);
    const delay = DELAYS[frame] * speed;
    frame++;
    if (frame >= FRAMES.length && loop) frame = 0;
    timer = window.setTimeout(frame < FRAMES.length ? show : stop, delay);
  };
  const stop = () => {
    // Only the cursor's current owner can stop it; a newer animation has taken over otherwise.
    if (stopCurrent !== stop) return;
    window.clearTimeout(timer);
    root.classList.remove('cursor-busy');
    root.style.removeProperty('--cursor-busy');
    stopCurrent = null;
  };
  stopCurrent = stop;
  root.classList.add('cursor-busy');
  show();
  return stop;
}
