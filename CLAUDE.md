@specs/constitution.md

> **Expo version:** always read the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any Expo/React Native code — the API changes between versions.

## Workflow

This project follows spec-driven development for everything, not just setup: constitution → spec → clarify →
plan → tasks → analyze → implement. Each phase is a Beads epic, gated — don't open the next phase's epic while
the current one has open issues, and don't let implementation work happen inside a planning epic.

At the start of every session, check Beads state (open epic, open/closed issues) before proposing next steps —
don't assume continuity from a previous conversation, since sessions carry no memory of it. When an epic's
issues all appear closed, say so explicitly and confirm before opening the next epic's issues, rather than
proceeding silently. If a genuinely open product or architecture question comes up mid-implementation (not a
tooling question), surface it rather than deciding it unilaterally — same posture as the constitution's own
governance rule for conflicts.

## Commits

Conventional Commits format (feat/fix/docs/chore/refactor/test), referencing the Beads issue being closed (e.g.
a footer line "Beads: <issue-id>"). One commit generally maps to one closed issue — not a hard rule, but the
default unit — so there's a traceable line from spec → contract → Beads issue → commit.

**Push is user-triggered only.** Agents stage and commit; they do not push. The user decides when to push.

## Branching

One branch per epic: `<epic-id>/<short-slug>` (e.g. `wp-gpo/spec`). Beads close as commits on the branch;
when the epic is done, open a PR — CI must pass, then squash-merge to master. No direct pushes to master;
master is protected at the repo level (CI required, squash merges only).

## Definition of done (implementation issues)

An issue isn't done because code exists for it. It's done when: it satisfies what its linked spec/contract
section requires, lint/typecheck/tests pass (including contract tests where applicable), and the commit
references the issue. See STYLE.md for naming and file-organization conventions.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

When ending a work session:

1. File issues for remaining work
2. Run quality gates if code changed (`npm run lint && npm run format-check && npm run typecheck`)
3. Close finished issues: `bd close <id>`
4. Stage and commit: `git add <files> && git commit -m "chore(...): ... \n\nBeads: <id>"`
5. Hand off — provide context for next session

**Push is user-triggered** — see Commits section above. Agents do not push.

<!-- END BEADS INTEGRATION -->
