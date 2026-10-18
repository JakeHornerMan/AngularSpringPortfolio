// Desktop vs phone/tablet. The desktop layout (bouncing windows, media opening in windows of their own)
// needs a wide screen and a mouse: touch screens have no hover to pause a window, and dragging would
// fight scrolling. Everything else gets the mobile layout (a static, ordered grid with inline media).
export const DESKTOP_MEDIA = '(min-width: 720px) and (hover: hover) and (pointer: fine)';

// Calls `onChange(isDesktop)` now and whenever the layout mode changes; returns an unsubscribe function.
export function watchDesktop(onChange: (isDesktop: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    onChange(true);
    return () => {};
  }
  const query = window.matchMedia(DESKTOP_MEDIA);
  const listener = () => onChange(query.matches);
  query.addEventListener('change', listener);
  listener();
  return () => query.removeEventListener('change', listener);
}
