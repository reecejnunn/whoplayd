# Specification — WhoPlayd MVP

Version: 0.1.0 (draft, pending wp-gpo.2 clarify/review pass)
Depends on: [constitution.md](./constitution.md) — this document does not restate the constitution's
Non-Goals or Architecture Principles; it makes the Product Scope section implementable and resolves
the Open Questions the constitution deliberately left open.

## 1. Overview

WhoPlayd lets a user log which live football matches they attended and, from that, tracks which
players they've actually seen play. The app resolves "who got minutes" from a data provider rather
than asking the user to remember or enter it, then builds aggregate views (most-seen players, a
timeline, simple counts) from the accumulated history.

## 2. Resolved Open Questions

These were left open in the constitution and are resolved here per the wp-gpo.3 interview
(2026-09-11). Full interview record: `bd show wp-gpo.3`.

### 2.1 Data provider

**Working assumption: Sportmonks.** Documented fallback: **API-Football**. Highlightly is
de-prioritized (unconfirmed lower-league coverage; its ToS restricts operating a "proxy or
pass-through," which conflicts with WhoPlayd's core architecture).

This is provisional pending `wp-y08.5`, a spike verifying 5 items no public documentation settles:
Sportmonks' actual Scottish League One/Two availability and required plan tier; API-Football's
real minutes-played population on lower-league fixtures; post-full-time lineup latency for both;
Sportmonks' rate-limit mechanics; and (if still relevant) Highlightly's ToS position in writing.
`wp-y08.5` blocks `proxy-contract.md` / `sighting-schema.md` (wp-y08.1–.3) — it does not block this
document, since spec.md only needs the working-assumption + fallback framing, not a locked answer.

**Cost implication to carry forward:** WhoPlayd's competition list (§2.4) is ~11–13 leagues, which
will likely require Sportmonks' €99/mo Growth tier rather than the €29/mo Starter tier (5-league
cap). This is a real MVP operating cost, not a blocker.

### 2.2 Recent vs. historical discovery boundary

**Rolling 7-day window.** Date-anchored discovery (§3.1) covers matches from roughly the last 7
days. Anything older is reached only through historical browse (§3.2). This is a UX boundary, not
a caching TTL — cache TTLs for fixture/lineup data are a plan.md decision (constitution Open
Questions), not decided here.

### 2.3 Historical browse navigation shape

**Two parallel entry axes**, not a single forced hierarchy:

- **Team → Year → fixtures for that team.** Fits recall anchored on "I saw Arsenal play" —
  named in the interview as the season-ticket-holder pattern.
- **Year → Competition → fixtures in that competition/season.** Fits recall anchored on a
  competition run (e.g. "that FA Cup run a few seasons back") — named as the day-tripper pattern.

Both axes resolve to the same underlying fixture-selection flow (§3.3) once a specific match is
reached. Neither axis is primary; the entry point is a user choice on the historical browse screen.

### 2.4 Scottish league cutoff

**Aspirational target: as deep as England** — Premiership, Championship, League One, League Two —
mirroring the English Premier League→League Two depth. This is contingent on `wp-y08.5`:
API-Football's coverage page already confirms all 4 Scottish tiers; Sportmonks only publicly
confirms Premiership today. If the spike shows Sportmonks can't reach Scottish League One/Two, the
API-Football fallback path (§2.1) is what preserves this depth target for launch.

## 3. Discovery Flows

### 3.1 Date-anchored discovery

1. User picks a day within the rolling 7-day recent window (default: today).
2. App fetches fixtures for that day, filtered to covered competitions (§4).
3. User selects the match they attended from the day's fixture list.
4. Flow continues at §3.3 (match selection → resolution).

If the picked day has no fixtures in covered competitions, the app shows an explicit empty state
distinguishing "no fixtures that day" from "fixtures exist but none in covered competitions" — the
latter should not read as a bug.

### 3.2 Historical browse discovery

Entry point is a user choice between the two axes in §2.3:

**Team-first:**

1. User searches/selects a team (any team that has appeared in a covered fixture — not restricted
   to a fixed club list, consistent with the constitution's fixture-level coverage principle).
2. User selects a year/season.
3. App shows that team's fixtures in covered competitions for that season.
4. User selects a match. Flow continues at §3.3.

**Year-first:**

1. User selects a year/season.
2. User selects a competition within that season (from the covered list, §4).
3. App shows that competition's fixtures for the season.
4. User selects a match. Flow continues at §3.3.

### 3.3 Match selection → resolution

1. User confirms the specific match attended.
2. App creates a sighting-resolution request for that match (`pending` state — constitution §Async
   resolution).
3. If the match's lineup/events are already cached (long-TTL, per constitution caching tiers), the
   app resolves immediately: every player who got minutes in that fixture becomes a sighting for
   the user, `resolved` state.
4. If not cached, the app queues async resolution via the proxy/retry-worker. The user sees the
   match as `pending` in their history until resolution completes or exhausts retries (`failed`).
5. A `failed` sighting remains visible to the user (not silently dropped) — exact retry backoff and
   failure-notification UX is a plan.md decision (constitution Open Questions), not decided here.

### 3.4 No manual correction

Per the constitution, once a sighting resolves, its fields (player, minutes, etc.) are not user-
editable. If a user believes the provider data is wrong, there is no in-app correction path in the
MVP.

## 4. Coverage (competition list)

Fixture/competition-level coverage, per the constitution's "coverage is decided at the
fixture/competition level, not the club level":

- English domestic: Premier League, Championship, League One, League Two.
- English cups: FA Cup (First Round Proper onward), League Cup (Carabao Cup).
- Scottish domestic: Premiership, Championship, League One, League Two (aspirational — see §2.4).
- European: Champions League, Europa League, Europa Conference League.

Total: ~11–13 covered competitions depending on the final Scottish depth. International football
is out of scope (constitution Non-Goals).

## 5. Aggregate Views

Derived on read from the raw sighting log (constitution Data Principles — not pre-computed/stored):

- **Most-seen players**: players ranked by count of resolved sightings.
- **Timeline**: chronological list of sightings (by match date).
- **Simple counts**: total matches attended, total distinct players seen.

No further superlatives in the MVP (constitution Non-Goals) — these three views are the full scope.

## 6. Key Entities

Matches the constitution's Data Principles (`(matchId, playerId, minutesPlayed, status, ...)`).
Exact field-level shape is `sighting-schema.md`'s job (wp-y08.1, blocked on wp-y08.5) — this section
names the entities this spec's flows depend on, not their wire format:

- **Sighting**: one user's record of one player having played in one match they attended.
  Fields include at minimum matchId, playerId, minutesPlayed, status (`pending` / `resolved` /
  `failed`), plus any additional fields the provider payload already includes at ingest
  (team-at-match, competition, goals, cards — captured generously per constitution Data
  Principles, even before an MVP view uses them).
  Uses the provider's canonical IDs (no locally-generated IDs).
- **Match**: a single fixture in a covered competition, identified by the provider's canonical
  match ID.
- **Player**: identified by the provider's canonical player ID.
- **Team**: identified by the provider's canonical team ID; used as a navigation axis (§3.2) and
  as an ingest-time field on a Sighting, not as a coverage filter (§4).
- **Competition**: one of the covered competitions (§4); used as a navigation axis (§3.2).

## 7. Success Criteria

- A user can go from "I watched a match today" to a resolved list of players seen, entirely within
  the date-anchored flow (§3.1 → §3.3), for any fixture in a covered competition.
- A user can backfill a match from more than a season ago via either historical axis (§3.2) without
  needing to know or guess the exact date.
- Aggregate views (§5) reflect the full sighting history, including sightings added via both
  discovery flows.
- A `pending` or `failed` sighting is always visible and distinguishable from a `resolved` one —
  async resolution never looks like data loss to the user.

## 8. Explicitly Deferred (not this document's job)

- Retry backoff schedule, failure-notification thresholds, fixture/lineup cache TTLs — plan.md
  (constitution Open Questions; scoped to `wp-r3q.6`).
- Wire-level schema for Sighting/Match/Player/Team/Competition, proxy request/response shapes,
  retry-worker state machine — `wp-y08` contract specs, blocked on `wp-y08.5`.
- Final confirmation of Scottish League One/Two inclusion — depends on `wp-y08.5`.
