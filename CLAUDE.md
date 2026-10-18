# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

Never run `git commit` or `git push` in this repository, even if asked to "finish up" or "ship" a change. Committing and pushing are always the owner's responsibility. Leave changes uncommitted in the working tree.

## Overview

A personal portfolio site whose content (interests, projects, work experience) is stored in a database and managed through the site itself, so the owner can add and update entries without code changes. Two independent apps live side by side:

- `PersonalPortfolio/` — Spring Boot 2.6 (Java 11, Maven, JPA + MySQL, Spring Security, Lombok) REST API. Base package `com.jake`.
- `PersonalPortfolioApp/` — Angular 13 SPA (Angular Material, ngx-cookie-service, Karma/Jasmine).

## Commands

Backend (run from `PersonalPortfolio/`):
- Run: `./mvnw spring-boot:run` (needs a local MySQL database `portfolio`, user `root`/`password`, per `application.properties`)
- Build: `./mvnw package`
- Tests: `./mvnw test`; single test: `./mvnw test -Dtest=ClassName#method`
- The `dev`/`prod` Maven profiles (`-Pdev` / `-Pprod`) reference `src/main/resources/dev.propertys` / `prod.propertys`, which are not in the repo.

Frontend (run from `PersonalPortfolioApp/`):
- Install: `npm ci --legacy-peer-deps` (`ngx-cookie-service@16` declares an Angular 16 peer).
- On Node 17+, prefix CLI commands with `NODE_OPTIONS=--openssl-legacy-provider` (Angular 13's webpack needs it).
- Dev server: `npm start` (http://localhost:4200)
- Build: `npm run build` (production by default; swaps in `environment.prod.ts`)
- Tests: `npm test` (Karma, Chrome). For a single spec, change `describe`/`it` to `fdescribe`/`fit` temporarily.
- No lint target is configured in `angular.json`.

## Architecture

**Backend layering:** `controller` → `service` → `repo` (Spring Data `JpaRepository` with derived query methods) → `entitys` (JPA entities; the package name really is `entitys`). Schema is created by Hibernate (`ddl-auto=update`); there's no migration tool. The `V1__`/`V2__`/`V3__` SQL files in `src/main/resources/static/` are seed data to run by hand.
- `V3__jakedev-content.sql` holds the real portfolio content, pulled from the old jakedev.win site: 7 projects, plus 6 work and education entries with their contribution write-ups as text content blocks. It replaces V2's test data.
- `jakedev-content.json` next to it is the same content in API shape, for a mock API when previewing without MySQL.
- Images it references live in the frontend's `src/assets/content/`.
- `project.project_description` is a VARCHAR(255), so long project text goes in `text` content blocks.

**Domain model:**
- `Project` and `WorkExperience` each own a `List<Content>` through a unidirectional `@OneToMany` with a join column (`project_fk` on `Content`, cascade ALL). `Content` is an ordered block (`position`) whose `contentType` is one of `text`, `video`, `image`, `link`. The frontend switches on that string to render the matching component in `components/contentTypes/`.
- Relationships to `Interest`/`Technology` are stored as **comma-separated ID strings** (`linkedInterests`, `linkedTechnologys`), not JPA relations. `findProjectsByLinkedInterests` does an exact string match against that field.
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
- Fonts: Rubik Glitch for all headings (`--display`) and Asap Sharp for everything else (`--body`), loaded in `src/index.html`.
- `components/ink-field` is the slowly moving ink background (not interactive); the app shell renders one fixed instance behind everything.
  - It renders at 30fps with a WebGL fragment shader (`src/app/ink/ink-shader.ts`).
  - Lines are contours of a "drop potential": a smooth minimum of the stretched-ellipse distance to 2–3 ink drops (count, positions and sizes are random per seed, kept `MIN_SOURCE_GAP` apart). Each drop is its own ring source, and rings drift outward (`DRIFT`) and merge where they meet.
  - The contours are folded into flowing waves by slow fbm domain warping plus a sideways current.
  - The pattern comes from `SESSION_SEED` (`src/app/ink/ink-noise.ts`), picked once per page load. It's new on every reload, the same across in-app navigation, and shared by the background and the curtain so their rings line up.
  - Each line gets a hashed weight (hairline/medium/bold) and swells along its length, capped so neighbours never merge.
  - `src/app/ink/ink-renderer-2d.ts` is a Canvas 2D fallback for when WebGL isn't available.
- `components/intro-loader` is the ink curtain: an inverted `ink-field` (white ink on black, same seed/density as the page background) in `revealMode`, whose rings dissolve from the centre outward via `setRevealProgress()` (shader uniforms `uReveal`/`uRevealFade`).
  - On first load it dissolves once the page is ready.
  - On every later navigation it plays in reverse to cover the page, then dissolves again once the new page's data is in. It's hidden with `display:none` when idle.
- All routes in `app-routing.module.ts` sit under one componentless parent with `canActivateChild: [PageTransitionGuard]`, which holds each navigation until `PageTransitionService` reports the curtain has covered the page. New routes must go in the `pages` array to get the transition. The curtain stays up until the first `NavigationEnd` and zero pending HTTP requests, tracked by `LoadingInterceptor`/`LoadingService`. First load holds at least 1.2s. A 15s cap (`INTRO_MAX_SECONDS`/`PAGE_MAX_WAIT_SECONDS`) is only a safety net for hung requests.
- `project-content` and `work-experience-content` render as pockets. `open` (an input plus a host class `wide`) expands one to full width to show its content blocks.
- Pockets are styled as little browser windows. A pocket's first `.label` becomes the title bar, with the window dots on the left and the title on the right. On project and work windows (`.label.has-dots`) the dots plus "open/close" are a real button (`.window-open`) that toggles the full story, and the title text is in `.bar-title`.
- `BounceFieldDirective` (`appBounceField`, in `src/app/directives/`) sits on each `.pockets` grid:
  - It turns the children into windows that drift DVD-screensaver style, bouncing off the edges and off each other.
  - The windows are shared out, in page order, into "spaces" of at most `PER_SPACE` (4). Each space is one browser window tall and the full width, with a `SPACER` gap before the next. Space 0 starts at the top of the page, and the page scrolls through the spaces.
    - Each window bounces inside its own space. Dragging one into another space moves it there.
    - Each gap holds a `.space-divider` that the directive creates: three wavy ink lines, as tiled SVG backgrounds, rippling slowly sideways over a calm paper band.
    - The directive sets the field's height to hold every space. Windows are `position: absolute` in the field, with positions kept in page coordinates.
  - Collisions are per space, and switch off when a space's windows cover more than `CROWDED` of it.
  - Hovering pauses a window. Its title bar is a drag handle, and a flick throws it, easing back to `CRUISE` speed.
  - Only one window can be open at a time (`OpenWindowService`). Trying to open another just closes the open one.
  - An opened (`.wide`) window leaves the simulation and sits centred. It grows there from its bouncing spot with a FLIP animation (`flip()` in `src/app/window-motion.ts`, shared by every window), and closing shrinks it back to the spot it left. While any window is open the others freeze.
  - Videos and images are never shown big inline. `video` and `image` content blocks (`contentTypes/videos`, `contentTypes/images`) are 320×180 `.media-tile`s (in `styles.css`): greyscale until hovered, with a "▶ play" or "⤢ view" badge. A video tile's thumbnail comes from YouTube.
    - Clicking a tile asks `MediaWindowService` to show it. The one `MediaWindowComponent`, rendered inside `main.page` above opened windows (z 5000) but below the page titles, grows a separate 16:9 window out of the tile.
    - Videos autoplay (`toEmbedUrl` adds `autoplay=1`); images are fitted with `object-fit: contain`.
    - A cross-origin player (YouTube, Vimeo) sets its own cursor inside its frame, and a page can't override that. While it loads, a transparent `.frame-cover` sits over it with the looping hourglass; the cover is removed on the iframe's `load`.
    - Its close button or Escape shrinks it back into the tile.
    - That's desktop only. On phones and tablets (`watchDesktop()`), videos and images sit inline instead: full width in portrait, scaled to fit the screen in landscape (`.inline-media`), and videos don't autoplay.
  - An opened window's title bar is sticky. `OverlayScrollbarService` hides the browser's scrollbars and draws a thin thumb inside whatever is scrolling, only while it scrolls. Set `--scroll-inset-top` on a scroller to keep the thumb below a pinned header.
  - On phones and tablets the windows stay static and in order in the normal grid. "Desktop" is `DESKTOP_MEDIA` in `src/app/layout-mode.ts`: at least 720px wide, with a mouse (`hover: hover` and `pointer: fine`). Reduced motion also gets the static grid.
  - While active it adds `body.pockets-bouncing`, which lifts `.page` above the footer.
- The masthead shows "Jake Horner" on the home page and the current section's name everywhere else.
  - It comes from `SectionTitleService`, which also sets the browser tab title.
  - The app shell resets it on `ResolveStart`, once the curtain has covered the old page. Section pages (interest pages, work, log in, log out, 404) call `set()` in `ngOnInit`.
  - Those pages have no heading of their own.
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

## Gotchas

- `application.properties` contains a YAML-style `server.ssl` block that Spring won't parse as properties. It also names `keystore.p12`, but the file in the repo is `springboot.p12`, so SSL is effectively not configured.
- `ProjectService.saveProject`/`deleteProject` in the frontend are broken leftovers (they send GETs to write endpoints). Use the `SecureService` equivalents.
