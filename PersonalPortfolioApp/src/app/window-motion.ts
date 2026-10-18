import { playBusyCursor } from './cursors';

// Shared grow/shrink motion for windows (bouncing pockets and the video window), so every window
// opens and closes the same way.

export const OPEN_MS = 520;
export const CLOSE_MS = 440;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export interface Box { x: number; y: number; w: number; h: number; }

// FLIP: start the element looking like box `from` and ease it into its real box `to`, where it sits
// with the transform `rest`. Needs `transform-origin: 0 0` on the element. The hourglass cursor plays
// meanwhile.
export function flip(el: HTMLElement, from: Box, to: Box, rest: string, duration: number): Promise<void> {
  const start = `translate3d(${from.x - to.x}px, ${from.y - to.y}px, 0) ${rest} scale(${from.w / to.w}, ${from.h / to.h})`;
  playBusyCursor(duration);
  const animation = el.animate([{ transform: start }, { transform: `${rest} scale(1, 1)` }], { duration, easing: EASE });
  return animation.finished.then(() => undefined, () => undefined);
}

// The reverse: ease the element from its box `from` (sitting there with `rest`) down into box `to`,
// and hold it there until the caller removes or moves it.
export function shrinkInto(el: HTMLElement, from: Box, to: Box, rest: string, duration: number): Promise<void> {
  const end = `translate3d(${to.x - from.x}px, ${to.y - from.y}px, 0) ${rest} scale(${to.w / from.w}, ${to.h / from.h})`;
  playBusyCursor(duration);
  const animation = el.animate([{ transform: `${rest} scale(1, 1)` }, { transform: end }],
    { duration, easing: EASE, fill: 'forwards' });
  return animation.finished.then(() => undefined, () => undefined);
}

// A fixed element's layout box. Offsets ignore transforms, so this is right even mid-animation.
export function layoutBox(el: HTMLElement): Box {
  return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
}

export function rectBox(el: Element): Box {
  const rect = el.getBoundingClientRect();
  return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
}
