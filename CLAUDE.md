# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
ng serve             # dev server at http://localhost:4200 (requires backend at localhost:8000)
ng build             # production build → dist/
ng test              # run all tests (Vitest) — exits after one run in this repo's non-interactive shell
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

`SessionService` is the HTTP boundary for session/chat data; `SpeakerService` is a second, narrower boundary for the speaker entity. Both follow the same shape (`providedIn: 'root'`, one typed method per endpoint) and their methods return `Observable`; components consume them with `.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)` — never `async` pipe, never bare subscribe.

### State management

No external state library. Components use `signal()` for local mutable state and `computed()` for derived state. All components use `ChangeDetectionStrategy.OnPush` — Angular re-renders only when a signal they read changes.

### i18n

`@ngx-translate/core` with JSON files in `public/assets/i18n/en.json` and `nl.json`. Language is set at bootstrap in `AppComponent`. The `NavbarComponent` exposes EN/NL toggle buttons that call `TranslateService.use()`.

### Markdown rendering

`MarkdownPipe` (`src/app/shared/markdown.pipe.ts`) converts backend-supplied markdown strings to HTML via `marked`, then sanitizes through `DomSanitizer.sanitize(SecurityContext.HTML, ...)` before binding to `[innerHTML]`. **Do not use `bypassSecurityTrustHtml`** — all backend content is untrusted.

### Key patterns to follow

- **Subscriptions**: always `takeUntilDestroyed(this.destroyRef)` — inject `DestroyRef` via `inject(DestroyRef)`
- **Route params**: use `this.route.paramMap` observable + `switchMap`, never `route.snapshot.paramMap`
- **Template methods**: extract to a pure `@Pipe` instead of calling class methods from templates (see `ExcerptPipe`)
- **Global styles for `[innerHTML]` content**: styles that target injected HTML (e.g. `.summary-text h2`) go in `src/styles.scss`, not in component styles with `::ng-deep`
- **API key**: never hardcode in source; read from `environment.apiKey` which should be empty in committed files and injected at build time

### Testing

- **After adding or updating any component, pipe, service, or interceptor**, use the `angular-component-test-writer` agent to write or update the co-located `*.spec.ts` file.
- **After adding or updating any feature component**, use the `playwright-e2e-writer` agent to write or update e2e tests in `e2e/`. Import from `e2e/fixtures/index.ts` (not directly from `@playwright/test`) so tests get the authenticated `apiContext` fixture.
- E2E tests run against the test backend (`localhost:8001`) via `npm run e2e`. See `.env.e2e.example` for required env vars.
- Unit tests live co-located with source files (`*.spec.ts`). Run with `ng test`.

### Visual design system — "Open Record" (brand: Demos)

All tokens are CSS custom properties defined once in `src/styles.scss` `:root`. Components
reference `var(--token)` — never re-hardcode a hex value.

| Token | Value | Usage |
|---|---|---|
| `--paper` | `#faf7f2` | Page background |
| `--surface` | `#ffffff` | Cards, raised elements |
| `--ink` | `#1c1c1e` | Primary text, headings |
| `--text-muted` | `#8a857c` | Secondary text, metadata |
| `--line` | `#e7e1d6` | Hairline borders/dividers |
| `--accent` | `#e0a526` | Amber — **reserved**: source-linked evidence only, plus the one primary CTA per view |
| `--on-accent` | `#3a2c07` | Text on amber fills |
| `--anchor` | `#3c4a57` | Slate — structural weight, focus rings, links/icons, and Material's `primary` palette |
| `--stance-support` | `#2f6e73` | Teal — "supported / voted for" |
| `--stance-oppose` | `#a8622a` | Brown — "opposed / voted against" |
| `--stance-unclear` | = `--text-muted`, italic | "position unclear" |

Fonts (three roles, two weights each, never a fourth family):
- `--font-display` (Space Grotesk 500/700) — h1–h3, logo wordmark, party/MP names.
- `--font-body` (Inter 400/500/600) — everything else: body copy, nav, buttons, labels, AI-generated summaries/chat answers.
- `--font-voice` (Source Serif 4 400/500/400italic) — **verbatim parliamentary quotes only** (e.g. `session-detail`'s `.evidence-quote`). Never apply to AI-generated text (chat answers, summaries) — that would misrepresent AI output as the official record.

Shape: `--radius` (10px) for cards/fields/buttons/tags; `--radius-pill` (999px) for pill-style chips only. One hairline border weight (`--line`), near-flat `--shadow-card` (`0 1px 2px rgba(28,28,30,.05)`) — no heavier shadows, gradients, or glow.

Hard rules (do not drift):
1. No dominant/saturated full-bleed color field anywhere (this is why the navbar/footer/hero have no colored background — a solid color bar reads as a party affiliation in a parliamentary-transparency product).
2. Amber (`--accent`) marks source-linked evidence only, plus the single primary CTA per view (given its own `.btn`/`.cta`/`.gate-submit`-style class, not Material's `color="primary"`).
3. Serif (`--font-voice`) marks verbatim transcript speech only.
4. Stance colors never recolor to match a political party.
5. Sentence case everywhere (the uppercase eyebrow label is the one deliberate exception).

Session status → `StatusBadgeComponent`; speaker stance (`support`/`oppose`/`unclear`) → `StanceChipComponent`. Both render as bordered, flat pills (no fill, no shadow) per the rules above.
