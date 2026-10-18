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

Architecture and design notes are in [`ARCHITECTURE.md`](ARCHITECTURE.md): backend layering, the domain model, the REST API, auth, frontend data flow, the suminagashi design, and the cursor set. Read it before changing either app, and keep it up to date when the architecture or design changes.

## Gotchas

- `application.properties` contains a YAML-style `server.ssl` block that Spring won't parse as properties. It also names `keystore.p12`, but the file in the repo is `springboot.p12`, so SSL is effectively not configured.
- `ProjectService.saveProject`/`deleteProject` in the frontend are broken leftovers (they send GETs to write endpoints). Use the `SecureService` equivalents.
