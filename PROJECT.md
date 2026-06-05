# Plenary UI

Angular 19 frontend for the Parliamentary Session Intelligence platform. Displays Dutch parliamentary plenary session data — summaries, speaker stances, and source references — retrieved from the FastAPI backend.

---

## Pages

| Route | Description |
|---|---|
| `/` | Home page — hero section + feature overview |
| `/sessions` | Blog-style session list with search and pagination |
| `/sessions/:id` | Session detail with Summary, Stances, and Sources tabs |
| `/about` | Static about page describing the project and tech stack |

---

## Tech stack

- **Angular 19** — standalone components, signals
- **Angular Material** — UI component library
- **Angular Router** — client-side navigation
- **HttpClient** — REST API communication
- **SCSS** — styling with government/civic palette

---

## Backend

Expects the FastAPI backend (`plenary-session/`) running at `http://localhost:8000`.

All requests are authenticated with an API key sent as `X-API-Key` header, configured in `src/environments/environment.ts`.

### Endpoints used

| Method | Path | Used by |
|---|---|---|
| `GET` | `/api/v1/sessions` | Sessions list (with `?title=`, `?skip=`, `?limit=`) |
| `GET` | `/api/v1/sessions/:id` | Session detail |

---

## Project structure

```
plenary-ui/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/session.model.ts       # TypeScript interfaces
│   │   │   ├── services/session.service.ts   # HTTP calls
│   │   │   └── interceptors/auth.interceptor.ts
│   │   ├── features/
│   │   │   ├── home/
│   │   │   ├── about/
│   │   │   ├── session-list/
│   │   │   └── session-detail/
│   │   └── shared/
│   │       ├── navbar/
│   │       ├── status-badge/
│   │       └── stance-chip/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.development.ts
│   └── styles.scss
└── PROJECT.md
```

---

## Visual design

Government/civic palette:

| Token | Value | Usage |
|---|---|---|
| Primary | `#1565C0` | Navbar, buttons, links |
| Accent | `#546E7A` | Secondary actions, labels |
| Page background | `#F5F7FA` | Body background |
| Card background | `#FFFFFF` | Cards and panels |

Session status colours:

| Status | Colour |
|---|---|
| `DOWNLOADED` | Grey |
| `CHUNK_SUMMARISED` | Blue |
| `SUMMARISED` | Green |
| `FAILED` | Red |

Stance colours:

| Stance | Colour |
|---|---|
| `support` | Green |
| `oppose` | Red |
| `unclear` | Grey |

---

## Getting started

```bash
# Install dependencies
npm install

# Start dev server (requires backend running at localhost:8000)
ng serve

# Build for production
ng build
```

Set your API key in `src/environments/environment.development.ts` before running.

---

## Related

- Backend: `../plenary-session/` — FastAPI + PostgreSQL + OpenAI + Qdrant
