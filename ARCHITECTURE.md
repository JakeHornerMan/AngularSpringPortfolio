# Architecture

How the portfolio fits together: the backend, the frontend's data flow, and the site's design and cursor system.

**Backend layering:** `controller` → `service` → `repo` (Spring Data `JpaRepository` with derived query methods) → `entitys` (JPA entities; the package name really is `entitys`). Schema is created by Hibernate (`ddl-auto=update`); there's no migration tool. The `V1__`/`V2__`/`V3__` SQL files in `src/main/resources/static/` are seed data to run by hand.
- `V3__jakedev-content.sql` holds the real portfolio content, pulled from the old jakedev.win site and updated from the 2026 CV: 15 projects (Scrambled Eggs rebuilt from its Steam page, with its 2025 IMIRT award photo in `assets/content/`; Fishing for Memories and Lost in Transit from itch.io; This Portfolio, Simple Neural Network, CourseTrack, the R stock market analysis, Snap Travel Pop and the Deadlift Minigame from their GitHub repos; their media is hotlinked from the Steam and itch.io CDNs), plus 8 work and education entries (ZIM Connections is the current job; the Founders and Coders apprenticeship is ongoing education) with their contribution write-ups as text content blocks. It replaces V2's test data.
- `jakedev-content.json` next to it is the same content in API shape. The frontend's `StaticContentInterceptor` answers API reads from it: the dev build serves the local copy (an `angular.json` asset, `contentUrl: '/jakedev-content.json'`), and the prod build fetches it from GitHub, so neither needs MySQL or the backend.
- Its `artworks` key holds Jake's ArtStation posts, as project-shaped objects (negative ids, `projectImageUrl` = thumbnail, `contentList` = the post's images, YouTube/Sketchfab embeds as `video` blocks, and a "View on ArtStation" link). They exist only in this file. `npm run sync:art` (`PersonalPortfolioApp/scripts/sync-artstation.js`) rewrites just that key from the ArtStation RSS feed; re-run it after posting new art. The site can't call ArtStation itself: its JSON API is behind a Cloudflare challenge and the RSS feed has no CORS headers. `ArtworkService` reads them from `/artworks`, which only `StaticContentInterceptor` answers (against the Spring API it's an empty list).
- Images it references live in the frontend's `src/assets/content/`.
- Work logos there are trimmed to the mark itself (SuperNimbus is just its symbol; ZIM is its wordmark). Most are black on transparent; Mastercard keeps its original file. On a work window the headline is the workplace without any trailing note in brackets (`headline()`: "Ergo (Contract: SBCI Customer Hub)" shows as "Ergo"), while the title bar keeps the full name. The name takes the full width and the logo sits beside the role and dates: 32px tall, at most 72px wide, greyscale.
- `project.project_description` is a VARCHAR(255), so long project text goes in `text` content blocks.

**Domain model:**
- `Project` and `WorkExperience` each own a `List<Content>` through a unidirectional `@OneToMany` with a join column (`project_fk` on `Content`, cascade ALL). `Content` is an ordered block (`position`) whose `contentType` is one of `text`, `video`, `image`, `link`. The frontend switches on that string to render the matching component in `components/contentTypes/`.
- Relationships to `Interest`/`Technology` are stored as **comma-separated ID strings** (`linkedInterests`, `linkedTechnologys`), not JPA relations. `findProjectsByLinkedInterests` does an exact string match against that field.
- `Project` and `WorkExperience` each have a `tldr` (VARCHAR 500): the one- or two-line summary a closed window shows. Opening the window swaps it for the full description (`projectDescription` / `workDescription`) and the content blocks. Without a tldr, the closed window falls back to the description. The editors have a TLDR field above the description. Hibernate adds the column on startup; re-run V3 to fill it.
- Lists come back newest first: anything ongoing (no end date) on top, then by end date, then start date. The services sort with `NEWEST_FIRST`, and the frontend sorts again with `newestFirst()` (`src/app/newest-first.ts`) so the mock API's order doesn't matter. This applies to every list page (games, art, software, work).
- Deletes are soft: the `PUT /…/delete/{id}` endpoints set `active=false`, and the list endpoints return only active rows.

**REST API:** `/interests`, `/projects` (including `/projects/interest/{id}`), `/workExperience`, each with `GET`, `GET /{id}`, `POST /save`, `PUT /update`, `PUT /delete/{id}`. Accounts: `/login`, `/register`, `/secure`.

**Auth:** HTTP Basic, with users loaded from the DB through `CustomUserDetailsService` and BCrypt passwords. `MySecurityConfig` only requires authentication for `/secure` and `/interests/save`. The `/projects/**` and `/workExperience` write endpoints are not protected server-side. CORS allows only `http://localhost:4200`.

**Frontend data flow:**
- `ProjectService`, `InterestService` and `WorkExperienceService` do public GETs.
- All authenticated writes go through `SecureService`, which builds a `Basic` header from credentials that `UserService` keeps base64-encoded in cookies (`username`/`password`). "Logged in" just means the `username` cookie exists. It controls whether edit/delete controls show (`isUserLoggedIn()`).
- The API base URL comes from `environment.apiBaseUrl` (localhost:8080 in dev, a hard-coded EC2 IP in prod).
- Frontend types are in `src/app/models/models.ts`. Keep them in sync with the Java entities, including the misspellings (`linkedTechnologys`, `staredProject`, `cateorys`).
- Routes are in `app-routing.module.ts`. `createProject/:id` and `createWorkExperience/:id` reuse the create components for editing, and the `**` → `ErrorComponent` route has to stay last.

**Frontend design (black & white suminagashi):**
- Colour/font tokens live on `:root` in `src/styles.css`, along with the shared `.pocket`, `.pockets` (staggered grid), `.label` and button classes.
- Fonts, loaded in `src/index.html`:
  - Rubik Glitch (`--page-display`) for the big page header only (the masthead `.name`).
  - Aboreto (`--display`) for all other headings.
  - Asap Sharp (`--body`) for everything else.
- `components/ink-field` is the slowly moving ink background (not interactive); the app shell renders one fixed instance behind everything.
  - It renders at 30fps with a WebGL fragment shader (`src/app/ink/ink-shader.ts`).
  - Lines are contours of a "drop potential": a smooth minimum of the stretched-ellipse distance to 2–3 ink drops (count, positions and sizes are random per seed, kept `MIN_SOURCE_GAP` apart). Each drop is its own ring source, and rings drift outward (`DRIFT`) and merge where they meet.
  - The contours are folded into flowing waves by slow fbm domain warping plus a sideways current.
  - The pattern comes from `SESSION_SEED` (`src/app/ink/ink-noise.ts`), picked once per page load. It's new on every reload, the same across in-app navigation, and shared by the background and the curtain so their rings line up.
  - Each line gets its own random (hashed) weight, from a 0.6px hairline up to ~65px, skewed with `pow(tier, 5)` so most stay fine. It swells along its length and is capped at 65% of the gap to the next line, so neighbours never merge.
  - `src/app/ink/ink-renderer-2d.ts` is a Canvas 2D fallback for when WebGL isn't available.
- `components/intro-loader` is the ink curtain: an inverted `ink-field` (white ink on black, same seed/density as the page background) in `revealMode`, whose rings dissolve from the centre outward via `setRevealProgress()` (shader uniforms `uReveal`/`uRevealFade`).
  - On first load it dissolves once the page is ready.
  - On every later navigation it plays in reverse to cover the page, then dissolves again once the new page's data is in. It's hidden with `display:none` when idle.
- All routes in `app-routing.module.ts` sit under one componentless parent with `canActivateChild: [PageTransitionGuard]`, which holds each navigation until `PageTransitionService` reports the curtain has covered the page. New routes must go in the `pages` array to get the transition. The curtain stays up until the first `NavigationEnd` and zero pending HTTP requests, tracked by `LoadingInterceptor`/`LoadingService`. First load holds at least 1.2s. A 15s cap (`INTRO_MAX_SECONDS`/`PAGE_MAX_WAIT_SECONDS`) is only a safety net for hung requests.
- `project-content` and `work-experience-content` render as pockets. `open` (an input plus a host class `wide`) expands one to full width to show its content blocks. Closed, the window shows the `tldr`; opened, the full description replaces it (`summary()`). The open button shows whenever there's more to see (`hasMore()`: content blocks, or a description behind the tldr).
- A starred project (`staredProject`) or work entry (`starred`) gets host class `starred` and pulses with a soft black glow: a `::after` layer on its `.pocket` whose opacity animates (`starred-glow`, in `styles.css`), switched off while the window is open. Only Scrambled Eggs and ZIM Connections are starred in the seed data.
- Pockets are styled as little browser windows. A pocket's first `.label` becomes the title bar, with the window dots on the left and the title on the right. On project and work windows (`.label.has-dots`) the dots plus "open/close" are a real button (`.window-open`) that toggles the full story, and the title text is in `.bar-title`.
- `BounceFieldDirective` (`appBounceField`, in `src/app/directives/`) sits on each `.pockets` grid:
  - It turns the children into windows that drift DVD-screensaver style, bouncing off the edges and off each other.
  - The windows are shared out, in page order, into "spaces" of at most `PER_SPACE` (5). A field can set its own `[perSpace]`; 0 means no limit (one space). Each space is one browser window tall and the full width, with a `SPACER` gap before the next. Space 0 starts at the top of the page, but its windows stay below the page title (the masthead's bottom edge), so they never pass behind it. The page scrolls through the spaces. Bouncing windows are `clamp(230px, 20vw, 310px)` wide.
    - The art page adds every ArtStation post after its projects as a small window (`project-content` with `[small]="true"`, host class `small`): `clamp(120px, 9vw, 160px)` wide, closed it shows only a full-colour thumbnail (`.pocket-thumb`) and the year, with no edit/delete. Opened, it's a normal wide window holding `ArtSliderComponent` (`components/art-slider`): the post's images and embeds in colour, one slide at a time (arrows, dots, a count, the arrow keys, a swipe), with only the current slide rendered so a playing video stops when you move on. Its link blocks ("View on ArtStation") go under the slider. That field takes 20 windows per space.
    - Each window bounces inside its own space. Dragging one into another space moves it there. A child can pick its space with a `data-space` attribute.
    - `[spaceTitles]` (index = space number) shows a title (`.space-divider-title`) on the divider above that space.
    - Each gap holds a `.space-divider` that the directive creates: three wavy ink lines, as tiled SVG backgrounds, rippling slowly sideways over a calm paper band.
    - The directive sets the field's height to hold every space. Windows are `position: absolute` in the field, with positions kept in page coordinates.
  - Collisions are per space, and switch off when a space's windows cover more than `CROWDED` of it.
  - Hovering pauses a window. Its title bar is a drag handle, and a flick throws it, easing back to `CRUISE` speed.
  - Only one window can be open at a time (`OpenWindowService`). Trying to open another just closes the open one, and so does a click anywhere outside it (except on layers above it: the media window, dialogs, the terminal swarm). "Outside" is judged from the click's `composedPath()`, since opening can remove the clicked element (a small window's thumbnail).
  - A click anywhere on a closed window opens it (host class `openable`, which also gives the whole window the hand cursor), not just its open button. Links and buttons inside keep their own clicks. A click where the pointer moved more than 5px (the end of a title-bar drag or a text selection) neither opens nor closes anything.
  - An opened (`.wide`) window leaves the simulation and sits centred. It grows there from its bouncing spot with a FLIP animation (`flip()` in `src/app/window-motion.ts`, shared by every window), and closing shrinks it back to the spot it left. While any window is open the others freeze.
  - Two or more images in a row with no text of their own (a screenshot dump) become one gallery, three tiles to a row (`groupContent()` in `src/app/content-blocks.ts`, `.media-grid`), headed by the first image's title. Images with a paragraph keep their own row.
  - Videos and images are never shown big inline. `video` and `image` content blocks (`contentTypes/videos`, `contentTypes/images`) are 320×180 `.media-tile`s (in `styles.css`): greyscale until hovered, with a "▶ play" or "⤢ view" badge. A video tile's thumbnail comes from YouTube. A direct video file (`.mp4`/`.webm`, e.g. Steam's GIF-style clips) has no thumbnail, so its tile shows the clip itself from 3s in, playing on hover.
    - Clicking a tile asks `MediaWindowService` to show it. The one `MediaWindowComponent`, rendered inside `main.page` above opened windows (z 5000) but below the page titles, grows a separate 16:9 window out of the tile.
    - Videos autoplay (`toEmbedUrl` adds `autoplay=1`); images are fitted with `object-fit: contain`.
    - A cross-origin player (YouTube, Vimeo) sets its own cursor inside its frame, and a page can't override that. While it loads, a transparent `.frame-cover` sits over it with the looping hourglass; the cover is removed on the iframe's `load`.
    - Its close button or Escape shrinks it back into the tile.
    - That's desktop only. On phones and tablets (`watchDesktop()`), videos and images sit inline instead: full width in portrait, scaled to fit the screen in landscape (`.inline-media`), and videos don't autoplay.
  - An opened window's title bar is sticky. `OverlayScrollbarService` hides the browser's scrollbars and draws a thin thumb inside whatever is scrolling, only while it scrolls. Set `--scroll-inset-top` on a scroller to keep the thumb below a pinned header.
  - On phones and tablets the windows stay static and in order in the normal grid. "Desktop" is `DESKTOP_MEDIA` in `src/app/layout-mode.ts`: at least 720px wide, with a mouse (`hover: hover` and `pointer: fine`). Reduced motion also gets the static grid.
  - While active it adds `body.pockets-bouncing`, which lifts `.page` above the footer.
- The home page is a fixed set of hard-coded windows (i make, tldr, elsewhere, contact) in the first space (`[perSpace]="0"`). The one window from the API is the current job: the work experience with no end date, else the latest start, ignoring entries flagged `education` (courses and apprenticeships, so an ongoing apprenticeship never replaces the job), shown as a work window titled "where i work" (`barTitle`).
  - Below it, a "starred" section: every starred project, plus any starred job that isn't the current one (that one is already up top), newest first, 5 to a space. They're placed with `data-space` (1, 2, …), and the field's `[spaceTitles]` puts "starred" on the divider above each of those spaces.
  - "i make" links to the software / games / art interest pages (in-app `routerLink`s, so no terminal virus).
  - The copy is in Jake's own voice: short, casual, first person, no CV buzzwords or year counts. The owner has edited it by hand, so change the wording only when asked. Facts come from his CV (ZIM Connections, SuperNimbus, Mastercard, SBCI, Scrambled Eggs on Steam).
- The footer is `position: fixed` to the bottom of the screen on every page. `.page`'s bottom padding keeps content clear of it, and bouncing windows can pass over it.
- The tab icon is Jake's skull painting: `src/favicon.ico` (16–64px) plus the PNGs in `src/assets/icons/` (32, 192 and a 180px apple-touch icon on black), linked in `src/index.html`.
- The masthead shows "Jake Horner" on the home page and the current section's name everywhere else.
  - It comes from `SectionTitleService`, which also sets the browser tab title.
  - The app shell resets it on `ResolveStart`, once the curtain has covered the old page. Section pages (interest pages, work, log in, log out, 404) call `set()` in `ngOnInit`.
  - Those pages have no heading of their own.
- `TerminalSwarmComponent` (in the app shell) is a joke "virus".
  - Clicking any `target="_blank"` link floods the screen with fake terminal windows, then opens the link (~1.7s; Escape skips ahead) and the terminals vanish. Every other terminal prints ASCII art; the rest type made-up hacker lines (`HACKER_LINES`). Phones and tablets get a single art terminal, centred.
  - The terminals are #2A4767 (`--terminal` on `.terminal`), the site's one colour, so the "virus" looks out of place.
  - The art lives in `terminal-swarm/ascii-art.ts` (from asciiart.website, each with its source URL; keep the artists' signatures). Each terminal's font is sized from the measured character width so the whole piece fits on screen.
  - The tab opens from a timer, which Chrome and Firefox allow for a few seconds after a click. If it's blocked, the last terminal stays up with the link to click.
  - Modified or middle clicks, and reduced motion, open the link straight away.
  - The terminals are plain DOM, styled by `.terminal*` in `styles.css`.
- The masthead name and `.page-title` always stay in front of the windows but are click-through (`pointer-events: none`), so the name is no longer a link; the dock's "home" is.

## Cursors

The site uses the **Smooth Classic** cursor set by Vlasta (http://www.rw-designer.com/cursor-set/antialiased-classic).
- **License:** CC BY, so the footer credit linking to that page must stay.
- **Files:** exported to PNG at 1.5× size (48px, Lanczos), with their hotspots, in `src/assets/cursors/`. Hotspots below are in those 48px pixels. Safari ignores `.cur`, and no browser plays `.ani`.
- **CSS:** they're defined as `--cursor-*` custom properties on `:root` in `src/styles.css`. Always use those variables, never a bare `cursor: pointer` etc.

| Variable | File (hotspot) | Use it for | Why |
|---|---|---|---|
| `--cursor-arrow` | `SmoothArrow.png` (3 3) | The default, set on `html` | Nothing here is interactive |
| `--cursor-hand` | `SmoothHand.png` (14 3) | Links, buttons, the dock, window controls (`.window-open`), anything clickable | A click does something |
| `--cursor-text` | `TextSelect.png` (9 14) | Inputs, textareas, `p` and `li` | You can type here or select the text |
| `--cursor-move` | `SmoothMove.png` (23 23) | Window title bars (`.drag-handle`), and everywhere while dragging (`html.grabbing`) | The window can be picked up and moved |
| `--cursor-no` | `SmoothNo.png` (18 18) | `:disabled` and `[aria-disabled="true"]` | The control can't be used right now |
| `--cursor-help` | `SmoothQuestion.png` (3 3) | Elements with a `title` tooltip (not links, buttons or iframes) | Hovering explains the thing |
| `--cursor-busy` | `SmoothHourglass-0…10.png` (24 24) | While a window grows open or shrinks shut, and while the page-transition curtain is up (first load and every page change) | Something is happening; wait a moment |

`--cursor-busy` is animated. `src/app/cursors.ts` swaps the hourglass frames. `playBusyCursor(ms)` plays one turn sped up to fit `ms`, and `startBusyCursor()` loops at the original `.ani` timing until its returned stop function is called. It adds `html.cursor-busy`, which forces that cursor everywhere.

`SmoothArrowDown.png` / `SmoothArrowUp.png` are SmoothArrow turned to point straight down / up, with the shadow redrawn below-right. They aren't cursors.
- Three of them sit either side of the nav dock (`.more-arrows` in the app shell), bobbing on a half-transparent pill backer.
- `BounceFieldDirective` sets `html.more-below` / `html.more-above` from the space in view. At the top both sides point down, at the bottom both point up, and in between the left points down and the right points up. With only one space they're hidden.
- Clicking them asks `SpaceNavService` to slide the page to the next / previous space.

The set's other cursors were left out because nothing needs them yet (precision, resize, pen, lightbulb), or because their animations are covered by the hourglass (working, pendulum). Chrome hides cursors bigger than 32px where they would overlap the browser's own UI (near the page edges) and shows the fallback keyword cursor there instead. To add one, re-export it the same way (1.5×) and give it a `--cursor-*` variable and a row here.
