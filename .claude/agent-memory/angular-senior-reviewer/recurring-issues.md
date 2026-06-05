---
name: recurring-issues
description: Recurring issues found in plenary-ui codebase during first review (2026-06-05)
metadata:
  type: project
---

Issues identified in first review pass. Check these patterns in any future modified files:

1. **Missing `changeDetection: ChangeDetectionStrategy.OnPush`** — none of the components (smart or presentational) declare OnPush. All components are eligible.
2. **Missing `takeUntilDestroyed()`** — `.subscribe()` calls in `ngOnInit` (SessionListComponent, SessionDetailComponent) are not cleaned up. Should use `takeUntilDestroyed(this.destroyRef)`.
3. **`bypassSecurityTrustHtml` in MarkdownPipe** — used without sanitizing the marked output first. XSS risk if backend content is untrusted.
4. **API key hardcoded in `environment.ts`** — `environment.apiKey: 'parliai3290-afae'` committed to source. Should come from a build-time env var.
5. **`excerpt()` method called in template** — SessionListComponent calls `excerpt(session.summary)` inside `@for`, which runs on every CD cycle. Should be a pure pipe or pre-computed in the signal.
6. **`::ng-deep` usage** — SessionDetailComponent uses `::ng-deep` for markdown heading styles. Deprecated; prefer a global stylesheet or ViewEncapsulation.None with scoped class.
7. **`route.snapshot` used instead of `route.paramMap` observable** — SessionDetailComponent won't react to in-place navigation to a different session ID.
8. **`StatusBadgeComponent` declared but never used** — dead code in shared/.
9. **`sendMessage()` sends stale history** — chat history includes the user message just added before the POST is sent; double-counts the last user turn.
