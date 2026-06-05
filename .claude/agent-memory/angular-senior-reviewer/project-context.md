---
name: project-context
description: Core tech stack, Angular version, architecture pattern, and auth strategy for plenary-ui
metadata:
  type: project
---

Angular 21.2 standalone-component app (no NgModules). RxJS 7.8. Angular Material 21. TypeScript ~5.9.

**App name**: ParlAI / plenary-ui — a parliamentary session viewer with chat-based Q&A.

**Architecture**: Fully standalone components, lazy-loaded routes via `loadComponent`. No NgRx; state is signal-based (Angular signals) within smart components.

**Auth strategy**: Functional HTTP interceptor (`authInterceptor`) injects `X-API-Key` header from `environment.apiKey` on every outgoing request. Key is currently hardcoded in `environment.ts` — a known secret-in-source issue.

**i18n**: ngx-translate with EN/NL, JSON files loaded via `TranslateHttpLoader`. Language toggle in NavbarComponent.

**State**: Signals (`signal`, `computed`) used throughout smart components. No shared signal store — each feature component owns its local state.

**Key dependencies**: marked ^18 (markdown rendering), Angular Material chips/tabs/expansion panels, ngx-translate ^17.

**Why:** First review pass on 2026-06-05. Architecture is clean and modern; main risk areas are XSS from `bypassSecurityTrustHtml` in MarkdownPipe, API key committed in source, and missing `OnPush` + `takeUntilDestroyed` patterns.

**How to apply:** Prioritise security findings first (XSS, API key), then change-detection and memory-leak fixes. Respect the signal-first state approach — do not suggest NgRx.
