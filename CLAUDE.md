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

**Backend layering:** `controller` → `service` → `repo` (Spring Data `JpaRepository` with derived query methods) → `entitys` (JPA entities; the package name really is `entitys`). Schema is created by Hibernate (`ddl-auto=update`); there's no migration tool. The `V1__`/`V2__` SQL files in `src/main/resources/static/` are seed data to run by hand.

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
- `components/ink-field` draws the animated ink-ring background on a canvas using `src/app/ink/ink-noise.ts`. The app shell renders one fixed instance behind everything.
- `components/intro-loader` is the black ink-edge sweep shown on every full page load. It waits for the first `NavigationEnd` and zero pending HTTP requests, tracked by `LoadingInterceptor`/`LoadingService` (min 1.4s, max 4s).
- `project-content` and `work-experience-content` render as pockets. `open` (an input plus a host class `wide`) expands one to full width to show its content blocks.

## Gotchas

- `application.properties` contains a YAML-style `server.ssl` block that Spring won't parse as properties. It also names `keystore.p12`, but the file in the repo is `springboot.p12`, so SSL is effectively not configured.
- `ProjectService.saveProject`/`deleteProject` in the frontend are broken leftovers (they send GETs to write endpoints). Use the `SecureService` equivalents.
