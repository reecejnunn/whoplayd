# Constitution — Footballers Seen Live

This document is the durable contract for this project. It rarely changes. Every spec, plan, and task beneath it must stay inside these bounds. An agent (or a future you) should be able to read this file alone and know what's in bounds and what isn't, without needing prior chat context.

## Purpose

A personal, local-first app for tracking which footballers you've watched play in person. You log the matches you attended; the app resolves the players who actually got minutes and builds aggregate views — most-seen players, a chronological timeline, that kind of thing — from that history.

Built for personal use first, with a handful of friends expected to install it too, and an eye toward wider sharing among football fans further down the line — not a single-user tool, though the MVP audience is small and self-selecting.

A secondary purpose: this project is a deliberate vehicle for practising an agent-first, spec-driven engineering workflow — multiple agents working against explicit contracts, coordinated via a dependency-aware task graph — rather than a from-scratch product bet. Architectural decisions should favour real service boundaries over the simplest possible implementation, where the two diverge.

## Product Scope (MVP)

- Select a day → see fixtures for supported leagues that day → select the match you attended → app resolves players who got minutes and adds them to your local history.
- Coverage is decided at the fixture/competition level, not the club level. Once a match belongs to a covered competition, every player who got minutes in that specific fixture is tracked — regardless of which club, league, or nationality they otherwise belong to. No filtering by nationality or "is this club normally tracked."
- Covered competitions at launch: domestic leagues (England down to League Two, fully professional, postponements rare; Scotland starting wherever the chosen data provider covers cleanly — do not assume symmetry with England) plus FA Cup (First Round Proper onward), League Cup (Carabao Cup), Champions League, Europa League, and Europa Conference League. International football is explicitly out of scope for now.
- Two discovery modes are needed, driven by how memory actually works rather than by a fixed cutoff. Date-anchored discovery (today, yesterday, a recent window) suits matches where "when" is still front of mind — this covers both real-time logging and easy recent backfill. A separate historical browse mode is needed for deeper backfill, where team, competition, and season are remembered far more reliably than the exact date. Where "recent" ends, and the precise navigation shape of the historical mode, are spec/plan-level decisions informed by what the chosen data provider's API makes efficient to fetch — not fixed here.
- Aggregate views: most-seen players, chronological sighting timeline, and simple counts (matches attended, players seen). More elaborate superlatives are explicitly deferred — see Non-Goals.

## Architecture Principles

- Local-first. The device is the source of truth for a user's own sightings. No user account is required to use the app fully.
- Thin, largely stateless server. A proxy sits between the app and the third-party football data provider. Its jobs: protect the API key/quota, cache aggressively, and hold the minimal state needed for asynchronous lookup retries. It never stores a user's collection.
- Provider-agnostic contract. The app talks only to our own proxy's stable interface, never directly to the third-party API. The underlying provider can be swapped without an app release. Proxy responses carry an explicit `schemaVersion` so the data model can evolve without forcing every client to update in lockstep. Note: this keeps the *interface* stable across a swap, not the *data* — see Data Principles for why a provider swap still fragments historical aggregates in the MVP.
- Caching tiers reflect data volatility. Fixtures-for-a-day: short TTL. Lineup/events-for-a-concluded-match: long TTL, but invalidatable — never hardcoded as permanently immutable. Exact durations are a spec/plan-level tuning decision, not fixed here.
- Minimize third-party API dependency on the critical path. Once a completed match's lineup/events have been fetched and cached, they're treated as effectively permanent for practical purposes — the retry/backoff machinery exists for the resolution phase, not for re-verifying data already in hand. No proactive or background pre-fetching in the MVP; caching is lazy and demand-driven only, revisited if usage patterns justify the added complexity.
- Async resolution is a first-class state, not an error case. A sighting can be `pending`, `resolved`, or `failed`. Retries are deduplicated by match, not by user, with backoff rather than a fixed interval.
- Client framework: React Native / Expo, to stay inside the existing TypeScript skillset rather than picking up native mobile languages cold.
- Language: TypeScript end-to-end, client and proxy/retry worker alike. This lets the provider-agnostic contract (schemaVersion and all) be a single shared source of truth between client and server rather than two hand-synced representations, and keeps this project's stretch goal to the agent-workflow practice rather than also picking up a new server-side ecosystem mid-project.
- Platform rollout: ship the Expo web export first — lowest friction for friends to try (a link, no install, no login) — with Android as a fast-follow from the same codebase once warranted. iOS deferred indefinitely. Web's local storage is less durable than native on-device storage (browser storage can be evicted; there's no server-side backup by design), and push-based failure notification is unreliable on web — both are accepted trade-offs of shipping web first, not oversights.
- Infrastructure stays swappable. The proxy and retry worker are built against standard interfaces (plain HTTP, a standard container or function runtime) rather than deep platform-proprietary APIs, so moving off a low-cost MVP host to more serious infrastructure later is a redeploy, not a rewrite.
- Local data is exportable. Because storage lives on-device (or in the browser) with no server-side backup by design, users can export and re-import their sighting history as a file — a safety net against storage eviction, not a sync feature and not a reason to weaken the local-first/no-accounts stance.
- Contracts are enforced, not just documented. Each service-boundary contract spec (proxy contract, sighting schema, retry flow) is validated by automated tests, not left as documentation alone — consistent with this project's purpose as a vehicle for practising real, agent-verifiable service boundaries.

## Data Principles

- A sighting is a raw fact, not a pre-computed aggregate: `(matchId, playerId, minutesPlayed, status, ...)`. Aggregate views (top players, timelines) are derived on read, not stored.
- Capture generously at ingest. If a field is already present in the provider payload we're fetching anyway (team-at-match, competition, goals, cards), store it even if no MVP view uses it yet — re-fetching historical fixture data later may be costly, rate-limited, or unavailable.
- Use the provider's canonical IDs for players, teams, and matches rather than generating local ones, so any future sync or comparison work starts from a shared vocabulary instead of an ID-reconciliation problem.
- Provider data is authoritative once resolved. Users cannot add players themselves or correct/override a sighting's fields (player, minutes, etc.) — the data source tells you who played, not the other way around. Any future need to reconcile or dispute data belongs to a possible future social/leaderboard system, not this one.
- The MVP has one data provider, treated as a hard dependency, not a redundant one — if it becomes unavailable, the app stops working for MVP; there's no fallback provider. A swap to a different provider is possible without a client rewrite (see "provider-agnostic contract"), but it is not seamless for existing data: cross-provider names and IDs don't reliably match (spelling and formatting differ between sources), so a swap would fragment aggregates for players seen under the old provider versus the new one. This is an accepted MVP risk, not solved now. Real reconciliation — ID mapping, provider redundancy, genuine provider-agnosticism — is real future work, needed to move beyond MVP, not a natural side effect of the contract already being provider-agnostic in shape.

## Explicit Non-Goals (MVP)

These are deliberately out of scope. Do not design around them; revisit only if real usage signal justifies the cost of crossing into them.

- No user accounts, no auth, no cross-user data of any kind.
- No social features: friends, following, sharing, leaderboards, comparisons. (If ever built, these require auth and a real backend — a different system, not an extension of this one.)
- No ticket marketplace or monetisation features.
- No domestic league tracked as an ongoing competition below England League Two — this is about which *competitions* are tracked, not which *clubs* can appear. A club below League Two can still show up in the data via a covered cup or European fixture (e.g. reaching the FA Cup First Round Proper); their domestic league simply isn't otherwise tracked. No assumption that Scottish league coverage mirrors English coverage.
- No international football (national team fixtures) in the MVP.
- No manual sighting entry or correction. Provider data is authoritative once resolved — users cannot add a player themselves or edit a resolved sighting's fields.
- No cross-provider reconciliation, ID mapping, or provider redundancy in the MVP. This is an accepted MVP-only limitation, not a permanent one — needed to move beyond MVP, not solved now.
- No free-text search. Discovery is via date-anchored browsing or team/competition/season browsing only (see Product Scope).
- No RAG, no semantic search, no LLM-powered product features — this app's data problem is plain fetch-and-aggregate.
- No pre-computed superlatives beyond the MVP's simple aggregate views; more complex queries are deferred until real usage patterns are known.

## Open Questions (resolve in spec.md, not here)

- Final choice of data provider (API-Football / Sportmonks / Highlightly — evaluate against actual EFL + Scottish coverage before committing).
- Exact Scottish league cutoff, pending provider coverage.
- Retry backoff schedule and failure-notification thresholds.
- Fixture-list and resolved-match cache TTLs (the ~30 min figure floated during drafting is a guess, not a decision).
- Exact navigation shape of the historical discovery mode (by team, by season, by competition), and where "recent" ends and "historical" begins — both depend on the chosen provider's API.

## Governance

- **Version**: v1.0.0 — first ratified version, following full section-by-section review.
- **Ratified**: 2026-09-10.
- **Amendment procedure**: This document changes only through an explicit, deliberate conversation like the one that produced it — never as an incidental side effect of writing a spec, a plan, or code. An agent (or Reece, moving fast) that finds a spec, plan, or implementation detail in tension with this constitution should surface the conflict and pause, not silently resolve it by reinterpreting either document.
- **Precedence**: Where a spec, plan, or task conflicts with this constitution, the constitution wins until it is explicitly amended — "explicitly amended" means the specific principle is revisited on purpose and the change is recorded here with a version bump, not just quietly overridden in practice.
- **Scope of stability**: Not everything here carries equal weight. Items explicitly marked "accepted MVP risk," "MVP-only," or "revisit post-MVP" (single data provider with no redundancy, no cross-provider reconciliation, web-first/Android-fast-follow platform rollout, iOS deferred) are pre-authorized to change without a full amendment debate — they were already written expecting to change. Everything else is a real amendment: it needed today's discussion to get here, and changing it later deserves the same treatment, not a quiet drift during implementation.
