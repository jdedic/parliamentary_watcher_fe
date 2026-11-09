# Task spec: clickable speaker names → speaker detail page

## Context
The backend (`../plenary-session`) now resolves each stance's free-text speaker/party to a
normalized `speakers` record (name, function, party abbreviation + Dutch/English full party
name, and a photo — fetched from the Tweede Kamer OData API — or a placeholder). This is
already shipped and live on the backend; nothing here requires backend changes.

Goal: in the session detail page's **Stances** tab, make each speaker's name clickable,
navigating to a new speaker detail page showing name, function, party (NL/EN), and photo.

## Backend contract (already live)

All endpoints require the existing `X-API-Key` header (same auth as every other backend
call — the `authInterceptor` already handles this for any request to `environment.apiUrl`).

**`GET {apiUrl}/speakers/{id}`**
```json
{
  "id": 3,
  "name": "Thierry Aartsen",
  "function": "minister van Werk en Participatie",
  "party_afkorting": "VVD",
  "party_name_nl": "Volkspartij voor Vrijheid en Democratie",
  "party_name_en": "People's Party for Freedom and Democracy",
  "image_url": "/api/v1/speakers/3/image",
  "resolved": true
}
```
- 404 if the id doesn't exist.
- `resolved: false` means the backend hasn't attempted enrichment yet — it enriches
  synchronously on this same request, so by the time the response comes back the fields
  above already reflect the result. `resolved` is mainly informative (e.g. could be used to
  show "photo/party lookup pending" on a retry), not something the frontend needs to poll.
- `party_afkorting`/`party_name_nl`/`party_name_en`/`function` can all be `null` (e.g. a
  cabinet member who was never an MP, or a party lookup that failed) — **the UI must handle
  all of these as optional, not just render blindly**.

**`GET {apiUrl}/speakers/{id}/image`**
- Always returns a real image — either the resolved photo (JPEG) or a bundled placeholder
  (PNG). The frontend never needs its own "no image" fallback UI — but see **Photo handling**
  below for an important auth wrinkle.

**Stance payload change:** every stance object returned from `GET {apiUrl}/sessions/{id}`
now includes a new key:
```json
{ "speaker": "Thierry Aartsen", "party": "VVD", "speaker_id": 3, ... }
```
- `speaker_id` is `number | null`. It will be `null`/absent on sessions whose stances were
  extracted before this feature shipped, until a backend backfill script runs for that
  session. **Treat it as optional and hide the link (not a broken link) when absent.**

## 1. Data models — `src/app/core/models/session.model.ts`

Add `speaker_id` to the existing `Stance` interface (currently lines 44-52, no such field
today):
```ts
export interface Stance {
  speaker: string;
  party: string | null;
  speaker_id?: number | null; // NEW
  activity: string;
  stance: 'support' | 'oppose' | 'unclear';
  summary: string;
  evidence: string;
  utterance_ids: string[];
}
```

New file — `src/app/core/models/speaker.model.ts`:
```ts
export interface Speaker {
  id: number;
  name: string;
  function: string | null;
  party_afkorting: string | null;
  party_name_nl: string | null;
  party_name_en: string | null;
  image_url: string;
  resolved: boolean;
}
```

## 2. `SpeakerService` — `src/app/core/services/speaker.service.ts` (new)

Follow the existing `SessionService` pattern exactly (`providedIn: 'root'`, `inject(HttpClient)`,
`private base = environment.apiUrl`, one typed method per endpoint):

```ts
@Injectable({ providedIn: 'root' })
export class SpeakerService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSpeaker(id: number): Observable<Speaker> {
    return this.http.get<Speaker>(`${this.base}/speakers/${id}`);
  }

  getSpeakerImage(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/speakers/${id}/image`, { responseType: 'blob' });
  }
}
```

> CLAUDE.md currently states "`SessionService` is the single HTTP boundary." This introduces
> a second one for the speaker resource — update that line when this lands, rather than
> stretching `SessionService` to cover an unrelated entity.

## 3. Photo handling — important auth wrinkle, do not skip

`authInterceptor` (`src/app/core/interceptors/auth.interceptor.ts`) only attaches
`X-API-Key` to requests made **through Angular's `HttpClient`**. A plain
`<img [src]="environment.apiUrl + '/speakers/' + id + '/image'">` is a native browser image
request — it bypasses `HttpClient` entirely, so it would **not** get the API key header and
would 401.

Required approach: fetch the image via `SpeakerService.getSpeakerImage()` as a `Blob`,
convert it to an object URL, and bind that:

```ts
// in SpeakerDetailComponent
private speakerService = inject(SpeakerService);
private destroyRef = inject(DestroyRef);
imageUrl = signal<string | null>(null);

private loadImage(id: number): void {
  this.speakerService.getSpeakerImage(id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.imageUrl.set(url);
      },
    });
}
```
Revoke the object URL on destroy (and whenever a new one is set, since navigating between
two speaker ids without a full component reload would otherwise leak the previous blob URL):
```ts
this.destroyRef.onDestroy(() => {
  const url = this.imageUrl();
  if (url) URL.revokeObjectURL(url);
});
```
This is the first `<img>`/image-display code in the app (confirmed — no existing precedent),
so there's no other pattern to match; the above is the correct approach given how
`authInterceptor` works, not a stopgap.

## 4. Route — `src/app/app.routes.ts`

Add, following the existing lazy-loaded convention:
```ts
{ path: 'speakers/:id', loadComponent: () => import('./features/speaker-detail/speaker-detail.component').then(m => m.SpeakerDetailComponent) },
```

## 5. `SpeakerDetailComponent` — `src/app/features/speaker-detail/` (new)

Structural template: `SessionDetailComponent` (`src/app/features/session-detail/session-detail.component.ts`).
Match its conventions:
- Standalone, `ChangeDetectionStrategy.OnPush`.
- `speaker = signal<Speaker | null>(null)`, `loading = signal(true)`.
- `ngOnInit()` uses `route.paramMap.pipe(switchMap(...), takeUntilDestroyed(this.destroyRef))`
  — **never** `route.snapshot.paramMap` (this is an explicit CLAUDE.md rule, not a style nit —
  it's what makes navigating directly from one speaker link to another, without an
  intermediate route change, actually refetch).
- Reset `loading.set(true)` and `speaker.set(null)` (and revoke any previous image URL) at
  the start of each `switchMap` emission, same reason `SessionDetailComponent` does it.

**New here vs. `SessionDetailComponent`: an explicit error state.** `SessionDetailComponent`
has no dedicated "not found" UI today — on error it just leaves `loading()` false and the
entity `null`, rendering nothing. For speakers, a 404 is an expected, not exceptional, case
(a session's stance could reference a speaker id that was later cleaned up, or link-sharing
a stale URL) — add a real error signal and template branch:
```ts
error = signal(false);
// in the subscribe error handler:
error: () => { this.loading.set(false); this.error.set(true); }
```
```html
@if (loading()) {
  <mat-spinner />
} @else if (error()) {
  <p class="empty-placeholder">{{ 'speaker.not_found' | translate }}</p>
} @else if (speaker(); as s) {
  <!-- detail content -->
}
```

**Content to render** (all fields optional per the contract above — hide the row, don't
render "null" text, when a field is absent):
- Photo: `<img [src]="imageUrl()" [alt]="speaker()!.name">` — only once `imageUrl()` is set;
  show a placeholder spinner/skeleton while the blob request is in flight.
- Name (`speaker.name`), function (`speaker.function`, if present).
- Party: show `party_name_nl` / `party_name_en` depending on `currentLang()` (same
  language-switch pattern `SessionDetailComponent` already uses for `stances` vs
  `stances_en` — reuse that logic rather than inventing a new one), with `party_afkorting`
  as a secondary/abbreviation label. If both name fields are null but `party_afkorting`
  exists, fall back to showing just the abbreviation.
- A "Back" link/button (reuse the `detail.back` i18n key and pattern from
  `SessionDetailComponent`).

## 6. Stances tab changes — `session-detail.component.ts`

Current template (lines ~85-122):
```html
<span class="speaker-name">{{ stance.speaker }}</span>
```
Change to a conditional link — only when `speaker_id` is present, so old un-backfilled
sessions degrade to today's plain-text behavior instead of a dead link:
```html
@if (stance.speaker_id) {
  <a class="speaker-name" [routerLink]="['/speakers', stance.speaker_id]">{{ stance.speaker }}</a>
} @else {
  <span class="speaker-name">{{ stance.speaker }}</span>
}
```
Add `RouterLink` to the component's standalone `imports` array. Style the link to look like
the existing `.speaker-name` text (not default anchor blue/underline) — this repo's visual
tokens are primary `#1565C0` / accent `#546E7A`; a subtle hover-underline in the primary
color reads as "clickable" without looking like a generic web link.

No change needed to the `@for` track expression — track-by uses `stance.speaker + stance.activity`, which stays unique regardless of `speaker_id`.

## 7. i18n — `public/assets/i18n/en.json` / `nl.json`

Add keys (existing file location is `public/assets/i18n/`, not `src/assets/i18n/` as
CLAUDE.md currently states — worth fixing that doc line too):
```json
"speaker": {
  "not_found": "Speaker not found.",
  "function": "Function",
  "party": "Party"
}
```
(`stance.support`/`oppose`/`unclear` already exist and are unrelated/unaffected.)

## 8. Testing (per this repo's standing conventions — not optional)

- After writing `SpeakerService`, `SpeakerDetailComponent`, and the stances-tab template
  change, use the `angular-component-test-writer` agent to write/update the co-located
  `*.spec.ts` files.
- After the feature component is in place, use the `playwright-e2e-writer` agent for `e2e/`
  coverage — at minimum: click a speaker name from the stances tab → lands on the speaker
  page with correct name/party/photo rendered; and a direct-navigation-to-nonexistent-id case
  rendering the not-found state.
- Manually verify the blob/object-URL image path actually works against the running backend
  (`ng serve` + backend at `localhost:8000`) — this is new territory for the app (first
  image ever rendered) and worth eyeballing once rather than trusting it from the spec alone.

## Out of scope for this iteration
- No manual override UI for speakers the backend couldn't resolve to a photo (e.g. the
  "Claudia van Bruggen" case — cabinet members who were never MPs aren't always in the
  Tweede Kamer's own person dataset). The detail page should simply render whatever
  `null` fields it gets gracefully; that's already covered by "hide absent fields" above,
  no extra work needed.
- No caching/prefetching of speaker data from the stances list (e.g. hovering a name to
  preload). Fine to add later if navigation feels slow in practice.
