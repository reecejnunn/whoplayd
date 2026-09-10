# Style Guide

Prettier and ESLint enforce most of this automatically. What follows covers the conventions they can't.

## Naming

| Thing                        | Convention         | Example                                             |
| ---------------------------- | ------------------ | --------------------------------------------------- |
| Files — React components     | PascalCase         | `PlayerCard.tsx`                                    |
| Files — everything else      | kebab-case         | `sighting-schema.ts`                                |
| React components             | PascalCase         | `function PlayerCard()`                             |
| Variables, functions, params | camelCase          | `resolvedPlayers`                                   |
| Types and interfaces         | PascalCase         | `type Sighting`, `interface ProxyResponse`          |
| Constants (module-level)     | SCREAMING_SNAKE    | `MAX_RETRY_COUNT`                                   |
| Enums                        | PascalCase members | `enum SightingStatus { Pending, Resolved, Failed }` |

## Imports

Order (separated by blank lines, enforced by Prettier/ESLint):

1. Node built-ins (`node:fs`, `node:path`)
2. External packages (`expo`, `react`, third-party)
3. Internal workspace packages (`@whoplayd/contracts`)
4. Local imports (relative `./`, `../`)

No default re-exports from index barrels unless the package explicitly needs a public API surface — prefer direct imports over deep re-exporting.

## Types

- Shared types that cross a service boundary (client ↔ proxy, proxy ↔ retry-worker) live in `packages/contracts/src/`.
- Types local to a single package live next to the code that uses them — not in a dedicated `types/` folder unless there are enough of them to justify the indirection.
- Prefer `type` over `interface` for plain data shapes; use `interface` only when you need extension or declaration merging.
- No `any`. Use `unknown` at trust boundaries (external API responses) and narrow from there.

## Misc

- `async`/`await` over raw Promises.
- Named exports over default exports (easier to grep, rename-safe).
- `const` by default; `let` only when reassignment is genuinely needed.
