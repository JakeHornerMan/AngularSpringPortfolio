// The animated hourglass from the Smooth Classic cursor set (by Vlasta, CC BY; see styles.css).
// Browsers can't play animated .ani cursors, so its frames were exported as PNGs and are swapped
// here by updating the --cursor-busy custom property, which `html.cursor-busy` applies everywhere.

const FRAMES = Array.from({ length: 11 }, (_, i) => `/assets/cursors/SmoothHourglass-${i}.png`);
// The original timing: the sand runs for seven slow frames, then the glass flips in four quick ones.
const DELAYS = [250, 250, 250, 250, 250, 250, 583, 83, 83, 83, 83];
const HOTSPOT = '32 32';  // frames are 64px (2x the original)

let preloaded = false;
let stopCurrent: (() => void) | null = null;

// Plays one full turn of the hourglass, sped up to fit `durationMs`, then restores the normal cursors.
export function playBusyCursor(durationMs: number): void {
  if (typeof document === 'undefined') return;
  if (!preloaded) {
    FRAMES.forEach(src => new Image().src = src);
    preloaded = true;
  }
  stopCurrent?.();

  const root = document.documentElement;
  const total = DELAYS.reduce((sum, d) => sum + d, 0);
  const scale = durationMs / total;
  let frame = 0;
  let timer = 0;
  const show = () => {
    root.style.setProperty('--cursor-busy', `url('${FRAMES[frame]}') ${HOTSPOT}, wait`);
    const delay = DELAYS[frame] * scale;
    frame++;
    timer = frame < FRAMES.length ? window.setTimeout(show, delay) : window.setTimeout(stop, delay);
  };
  const stop = () => {
    window.clearTimeout(timer);
    root.classList.remove('cursor-busy');
    root.style.removeProperty('--cursor-busy');
    if (stopCurrent === stop) stopCurrent = null;
  };
  stopCurrent = stop;
  root.classList.add('cursor-busy');
  show();
}
