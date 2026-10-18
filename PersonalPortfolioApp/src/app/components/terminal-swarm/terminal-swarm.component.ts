import { Component, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';
import { startBusyCursor } from 'src/app/cursors';
import { prefersReducedMotion } from 'src/app/ink/ink-noise';
import { DESKTOP_MEDIA } from 'src/app/layout-mode';
import { ASCII_ART } from './ascii-art';

// A joke "virus": clicking any link that opens a new tab (target="_blank") first floods the screen with
// fake terminal windows, then opens the link and the terminals vanish. Every other terminal prints a piece
// of ASCII art (ascii-art.ts); the rest type out made-up hacker lines (HACKER_LINES).
// On phones and tablets it's a single art terminal, filling the screen, before the link opens.
// Each terminal's text is sized so its whole piece of art fits on screen.
// The tab is opened from a timer, which browsers allow for a few seconds after the click (Chrome,
// Firefox). If the browser blocks it anyway (Safari is stricter), the last terminal offers the link.
// Modified clicks (ctrl/shift/middle) and reduced motion open the link straight away.
// The terminals are built as plain DOM outside Angular; their styles are `.terminal*` in styles.css.

const DESKTOP_COUNT = 14;    // terminals on desktop; phones and tablets get one
const SPAWN_MS = 85;         // between one terminal popping up and the next
const OPEN_AFTER_MS = 1700;  // from the click to opening the tab (desktop)
const OPEN_AFTER_ONE_MS = 1300;  // the same with a single terminal
const VANISH_MS = 30;        // between terminals closing, newest first
const LINE_MS = 16;          // printing speed: LINES_PER_STEP lines every LINE_MS
const LINES_PER_STEP = 3;
const CHAR_MS = 14;          // typing speed of the hacker lines: two characters every 2 * CHAR_MS
const HACKER_FONT_SIZE = 12;
const LINE_HEIGHT = 1.1;     // matches .terminal-screen
const FONT = "Consolas, 'Courier New', monospace";  // matches .terminal-screen
const PAD_X = 24;            // .terminal-screen's left + right padding
const PAD_Y = 20;            // .terminal-screen's top + bottom padding
const BAR_H = 28;            // the title bar
const MARGIN = 16;           // kept clear of the screen's edges
const MIN_WIDTH = 220;       // room for the title bar

const HACKER_LINES = [
  'C:\\> ping {host}',
  'Reply from {host}: bytes=32 time=4ms TTL=57',
  'injecting cookies.............. ok',
  'downloading more RAM........... 87%',
  'bypassing the mainframe........ done',
  'reticulating splines........... done',
  'deleting System32.............. jk',
  'compiling shaders.............. 412/412',
  'mining one (1) bitcoin......... failed',
  'hacking the gibson............. ok',
  'unzipping portfolio.zip........ ok',
  'calling mum.................... no answer',
  'sudo make me a sandwich',
  'warning: too many tabs open',
  'scanning ports 1-65535......... bored',
  'feeding the ink................ ok',
];

@Component({
  selector: 'app-terminal-swarm',
  template: '',
})
export class TerminalSwarmComponent implements OnInit, OnDestroy {

  private running = false;
  private timers: number[] = [];
  private terminals: HTMLElement[] = [];
  private stopBusy?: () => void;
  private finish?: () => void;
  private charWidth = 0;  // a character's width per px of font size

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) { }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      // Capture phase, so it runs before anything else handles the click.
      document.addEventListener('click', this.onClick, true);
      document.addEventListener('keydown', this.onKey);
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKey);
    this.clear();
  }

  private onClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest?.('a[target="_blank"][href]') as HTMLAnchorElement | null;
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (prefersReducedMotion()) return;
    event.preventDefault();
    if (this.running) return;
    this.play(link.href);
  };

  // Escape skips straight to opening the link.
  private onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.running) this.finish?.();
  };

  private play(url: string): void {
    this.running = true;
    this.stopBusy = startBusyCursor();
    this.host.nativeElement.classList.add('active');

    const host = hostOf(url);
    const single = !window.matchMedia(DESKTOP_MEDIA).matches;
    const count = single ? 1 : DESKTOP_COUNT;
    // Art and hacker lines take turns. The art cycles on from a random piece, so no piece repeats.
    const first = Math.floor(Math.random() * ASCII_ART.length);
    for (let i = 0; i < count; i++) {
      const last = i === count - 1;
      const artIndex = (first + Math.floor(i / 2)) % ASCII_ART.length;
      this.later(i * SPAWN_MS, () => i % 2
        ? this.spawnHacker(host, last)
        : this.spawn(host, artIndex, last, single));
    }

    let done = false;
    this.finish = () => {
      if (done) return;
      done = true;
      this.timers.forEach(t => clearTimeout(t));
      this.timers = [];
      const opened = openTab(url);
      this.stopBusy?.();
      this.stopBusy = undefined;
      if (!opened) {
        this.blocked(url, host);
        return;
      }
      this.vanish();
    };
    this.later(single ? OPEN_AFTER_ONE_MS : OPEN_AFTER_MS, () => this.finish?.());
  }

  // A terminal of a few random hacker lines, typed out; the last one ends on the link being opened.
  private spawnHacker(host: string, last: boolean): void {
    const lines = shuffle(HACKER_LINES).slice(0, 4).map(l => l.replace(/\{host\}/g, host));
    if (last) lines.push('', `opening ${host} ↗`);
    const w = Math.min(380, window.innerWidth - 2 * MARGIN);
    const screen = this.addTerminal(host, w, HACKER_FONT_SIZE, 6 * HACKER_FONT_SIZE * LINE_HEIGHT + PAD_Y, false);
    this.type(screen, lines.join('\n'));
  }

  // `single`: the only terminal (phones and tablets), as big as fits and centred.
  private spawn(host: string, artIndex: number, last: boolean, single: boolean): void {
    const { file, lines: art } = ASCII_ART[artIndex];
    const lines = [`C:\\> type ${file}`, '', ...art];
    if (last) lines.push('', `opening ${host} ↗`);
    const cols = Math.max(...lines.map(l => l.length));

    // The largest text that fits the whole piece on screen; on desktop a random size below that, so the
    // terminals vary, but never so small the art can't be made out.
    const charWidth = this.measureCharWidth();
    const fitWide = (window.innerWidth - 2 * MARGIN - PAD_X) / (cols * charWidth);
    const fitTall = (window.innerHeight - 2 * MARGIN - BAR_H - PAD_Y) / (lines.length * LINE_HEIGHT);
    const fits = Math.min(fitWide, fitTall);
    const fontSize = single ? Math.min(fits, 12) : Math.min(fits, 6 + Math.random() * 4);
    const w = Math.max(MIN_WIDTH, Math.ceil(cols * charWidth * fontSize + PAD_X + 2));
    const screenH = Math.ceil(lines.length * fontSize * LINE_HEIGHT + PAD_Y);
    const screen = this.addTerminal(host, w, fontSize, screenH, single);
    this.print(screen, lines);
  }

  // Pops up an empty terminal window and returns its screen.
  private addTerminal(host: string, w: number, fontSize: number, screenH: number, centred: boolean): HTMLElement {
    const h = screenH + BAR_H;
    const term = document.createElement('div');
    term.className = 'terminal';
    const spareX = Math.max(0, window.innerWidth - w - 2 * MARGIN);
    const spareY = Math.max(0, window.innerHeight - h - 2 * MARGIN);
    term.style.left = `${MARGIN + (centred ? spareX / 2 : Math.random() * spareX)}px`;
    term.style.top = `${MARGIN + (centred ? spareY / 2 : Math.random() * spareY)}px`;
    term.style.width = `${w}px`;

    const bar = document.createElement('div');
    bar.className = 'terminal-bar';
    bar.innerHTML = '<span class="window-dots" aria-hidden="true"></span>';
    const title = document.createElement('span');
    title.textContent = `cmd.exe — ${host}`;
    bar.appendChild(title);
    const screen = document.createElement('pre');
    screen.className = 'terminal-screen';
    screen.style.fontSize = `${fontSize}px`;
    screen.style.height = `${Math.ceil(screenH)}px`;
    term.append(bar, screen);
    this.host.nativeElement.appendChild(term);
    this.terminals.push(term);
    return screen;
  }

  // Prints the lines a few at a time, like a terminal scrolling them out.
  private print(screen: HTMLElement, lines: string[]): void {
    let shown = 0;
    const step = () => {
      shown = Math.min(lines.length, shown + LINES_PER_STEP);
      screen.textContent = lines.slice(0, shown).join('\n') + '█';
      if (shown < lines.length) this.later(LINE_MS, step);
    };
    step();
  }

  // Types the text out a couple of characters at a time, with a block cursor.
  private type(screen: HTMLElement, text: string): void {
    let shown = 0;
    const step = () => {
      shown = Math.min(text.length, shown + 2);
      screen.textContent = text.slice(0, shown) + '█';
      if (shown < text.length) this.later(CHAR_MS * 2, step);
    };
    step();
  }

  // The width of one character of the terminal font, per px of font size.
  private measureCharWidth(): number {
    if (!this.charWidth) {
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.font = `100px ${FONT}`;
        this.charWidth = ctx.measureText('M'.repeat(10)).width / 1000;
      }
      if (!this.charWidth) this.charWidth = 0.6;
    }
    return this.charWidth;
  }

  // The new tab was blocked: leave one terminal up with the link to click.
  private blocked(url: string, host: string): void {
    const keep = this.terminals.pop();
    this.vanish();
    if (!keep) return;
    keep.classList.add('blocked');
    const screen = keep.querySelector<HTMLElement>('.terminal-screen')!;
    screen.style.removeProperty('font-size');
    screen.style.removeProperty('height');
    screen.textContent = 'popup blocked. the virus failed.\n\n';
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener';
    link.textContent = `open ${host} ↗`;
    // Opened by hand from here: let the click through without playing again.
    link.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      openTab(url);
      this.clear();
    }, true);
    screen.appendChild(link);
    this.terminals = [keep];
    this.host.nativeElement.addEventListener('click', this.dismiss);
  }

  private dismiss = (event: MouseEvent) => {
    if ((event.target as Element).closest('.terminal')) return;
    this.clear();
  };

  private vanish(): void {
    const terms = this.terminals.splice(0).reverse();
    terms.forEach((term, i) => this.later(i * VANISH_MS, () => {
      term.classList.add('closing');
      this.later(180, () => term.remove());
    }));
    this.later(terms.length * VANISH_MS + 200, () => {
      if (!this.terminals.length) this.clear();
    });
  }

  private clear(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    this.terminals = [];
    this.stopBusy?.();
    this.stopBusy = undefined;
    const layer = this.host.nativeElement;
    layer.removeEventListener('click', this.dismiss);
    layer.replaceChildren();
    layer.classList.remove('active');
    this.running = false;
    this.finish = undefined;
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, ms));
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'somewhere';
  }
}

// Opens the link in a new tab, cut off from this page like rel="noopener". It isn't opened with the
// 'noopener' feature because then window.open always returns null, and null is how a blocked popup shows.
function openTab(url: string): boolean {
  const tab = window.open(url, '_blank');
  if (!tab) return false;
  tab.opener = null;
  return true;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
