# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
ng serve             # dev server at http://localhost:4200 (requires backend at localhost:8000)
ng build             # production build → dist/
ng test              # run all tests (Vitest)
ng test --run        # run tests once without watch mode
```

The API key must be set in `src/environments/environment.ts` before running. The backend (`../plenary-session/`) must be running at `http://localhost:8000`.

## Architecture

**Angular 21 standalone, signal-based, fully lazy-loaded.** There are no NgModules anywhere — every component, pipe, and directive is standalone.

### Request flow

```
Template → signal() reads
         → SessionService (HttpClient)
         → authInterceptor (attaches X-API-Key only to environment.apiUrl requests)
         → FastAPI backend /api/v1
```

`SessionService` is the single HTTP boundary. All three methods return `Observable`; components consume them with `.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)` — never `async` pipe, never bare subscribe.

### State management

No external state library. Components use `signal()` for local mutable state and `computed()` for derived state. All components use `ChangeDetectionStrategy.OnPush` — Angular re-renders only when a signal they read changes.

### i18n

`@ngx-translate/core` with JSON files in `src/assets/i18n/en.json` and `nl.json`. Language is set at bootstrap in `AppComponent`. The `NavbarComponent` exposes EN/NL toggle buttons that call `TranslateService.use()`.

### Markdown rendering

`MarkdownPipe` (`src/app/shared/markdown.pipe.ts`) converts backend-supplied markdown strings to HTML via `marked`, then sanitizes through `DomSanitizer.sanitize(SecurityContext.HTML, ...)` before binding to `[innerHTML]`. **Do not use `bypassSecurityTrustHtml`** — all backend content is untrusted.

### Key patterns to follow

- **Subscriptions**: always `takeUntilDestroyed(this.destroyRef)` — inject `DestroyRef` via `inject(DestroyRef)`
- **Route params**: use `this.route.paramMap` observable + `switchMap`, never `route.snapshot.paramMap`
- **Template methods**: extract to a pure `@Pipe` instead of calling class methods from templates (see `ExcerptPipe`)
- **Global styles for `[innerHTML]` content**: styles that target injected HTML (e.g. `.summary-text h2`) go in `src/styles.scss`, not in component styles with `::ng-deep`
- **API key**: never hardcode in source; read from `environment.apiKey` which should be empty in committed files and injected at build time

### Visual design tokens

| Token | Value | Usage |
|---|---|---|
| Primary | `#1565C0` | Navbar, buttons, headings |
| Accent | `#546E7A` | Labels, secondary text |
| Background | `#F5F7FA` | Page background |

Session status → `StatusBadgeComponent`; speaker stance (`support`/`oppose`/`unclear`) → `StanceChipComponent`.
